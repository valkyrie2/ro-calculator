import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AnalyticsService, AppLogService, AuthService, OAuthProvider } from 'src/app/api-services';
import { logger } from 'src/app/api-services/logger.service';

type Mode = 'sign-in' | 'sign-up' | 'reset';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  providers: [MessageService],
})
export class AuthComponent implements OnInit, OnDestroy {
  mode: Mode = 'sign-in';
  email = '';
  password = '';
  name = '';
  loading = false;
  errorMessage = '';
  infoMessage = '';

  /**
   * Cooldown for email-sending auth actions (sign-up confirmation,
   * password reset). Supabase enforces a per-email rate limit (default 60s)
   * and rejects faster requests with a 429 "For security purposes..."
   * error. We disable the submit button + show a countdown so the user
   * doesn't keep mashing it.
   */
  cooldownLeft = 0;
  private cooldownTimer?: ReturnType<typeof setInterval>;
  /** Default cooldown when Supabase doesn't tell us a specific seconds value. */
  private readonly defaultCooldownMs = 60_000;

  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly analytics: AnalyticsService,
    private readonly messageService: MessageService,
    private readonly appLog: AppLogService,
  ) {}

  ngOnInit() {
    // Surface any error returned from an OAuth / email-confirm round-trip.
    const errDesc = this.route.snapshot.queryParamMap.get('error_description');
    if (errDesc) {
      this.errorMessage = decodeURIComponent(errDesc);
    }

    // If we already have a session (OAuth callback or persisted login),
    // bounce back to the calculator.
    this.sub = this.authService.loggedInEvent$.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this.analytics.track('login-success');
        this.appLog.info('auth.login-success', { mode: this.mode });
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.clearCooldownTimer();
  }

  /**
   * Whether the current action is rate-limited and the submit button
   * should be disabled. Sign-in itself isn't email-rate-limited, so the
   * cooldown only blocks signup + reset modes.
   */
  get isRateLimited(): boolean {
    return this.cooldownLeft > 0 && this.mode !== 'sign-in';
  }

  get submitLabel(): string {
    if (this.isRateLimited) return `Try again in ${this.cooldownLeft}s`;
    if (this.mode === 'sign-in') return 'Sign in';
    if (this.mode === 'sign-up') return 'Create account';
    return 'Send reset email';
  }

  private startCooldown(seconds: number) {
    this.cooldownLeft = Math.max(1, Math.ceil(seconds));
    this.clearCooldownTimer();
    this.cooldownTimer = setInterval(() => {
      this.cooldownLeft = Math.max(0, this.cooldownLeft - 1);
      if (this.cooldownLeft <= 0) this.clearCooldownTimer();
    }, 1000);
  }

  private clearCooldownTimer() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }
  }

  /**
   * Parses Supabase's rate-limit error message (e.g.
   * "For security purposes, you can only request this after 47 seconds.")
   * and starts the appropriate cooldown.
   */
  private handleRateLimitError(err: { message?: string; status?: number } | undefined): boolean {
    const msg = err?.message ?? '';
    const status = err?.status;
    const isRateLimit =
      status === 429 ||
      /for security purposes/i.test(msg) ||
      /rate limit/i.test(msg) ||
      /only request this after/i.test(msg);
    if (!isRateLimit) return false;
    const m = msg.match(/after\s+(\d+)\s+second/i);
    const secs = m ? Number(m[1]) : Math.ceil(this.defaultCooldownMs / 1000);
    this.startCooldown(secs > 0 ? secs : Math.ceil(this.defaultCooldownMs / 1000));
    return true;
  }

  setMode(mode: Mode) {
    this.mode = mode;
    this.errorMessage = '';
    this.infoMessage = '';
  }

  submit() {
    if (this.loading) return;
    if (this.isRateLimited) return;
    this.errorMessage = '';
    this.infoMessage = '';

    if (!this.email) {
      this.errorMessage = 'Email is required.';
      return;
    }

    if (this.mode === 'reset') {
      this.runResetPassword();
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Password is required.';
      return;
    }

    if (this.mode === 'sign-up') {
      this.runSignUp();
    } else {
      this.runSignIn();
    }
  }

  private runSignIn() {
    this.loading = true;
    this.authService.signInWithEmail(this.email.trim(), this.password).subscribe({
      next: ({ error }) => {
        this.loading = false;
        if (error) {
          this.errorMessage = error.message;
          this.analytics.track('login-failure');
          this.appLog.error('auth.login-failure', error, { method: 'email' });
        }
        // success path is handled by the loggedInEvent$ subscription.
      },
      error: (err) => {
        this.loading = false;
        logger.error(err);
        this.errorMessage = err?.message ?? 'Sign-in failed.';
        this.analytics.track('login-failure');
        this.appLog.error('auth.login-failure', err, { method: 'email' });
      },
    });
  }

  private runSignUp() {
    this.loading = true;
    this.authService.signUpWithEmail(this.email.trim(), this.password, this.name?.trim() || undefined).subscribe({
      next: ({ data, error }) => {
        this.loading = false;
        if (error) {
          this.errorMessage = error.message;
          this.appLog.error('auth.signup-failure', error);
          this.handleRateLimitError(error as any);
          return;
        }
        this.appLog.info('auth.signup-success', { hasSession: !!data.session });
        // Always start the cooldown after a successful signup call so the
        // user can't spam-trigger Supabase's per-email rate limit on a
        // double-submit. (When email confirmation is disabled the user is
        // redirected away by the loggedInEvent$ subscription so the timer
        // is harmless.)
        this.startCooldown(this.defaultCooldownMs / 1000);
        // When email confirmation is enabled, no session is returned yet.
        if (!data.session) {
          this.infoMessage = 'Check your inbox to confirm your email address.';
          this.messageService.add({ severity: 'success', summary: 'Confirmation email sent' });
        }
      },
      error: (err) => {
        this.loading = false;
        logger.error(err);
        this.errorMessage = err?.message ?? 'Sign-up failed.';
        this.appLog.error('auth.signup-failure', err);
        this.handleRateLimitError(err);
      },
    });
  }

  private runResetPassword() {
    this.loading = true;
    this.authService.sendPasswordReset(this.email.trim()).subscribe({
      next: ({ error }) => {
        this.loading = false;
        if (error) {
          this.errorMessage = error.message;
          this.handleRateLimitError(error as any);
          return;
        }
        this.infoMessage = 'Password reset email sent. Check your inbox.';
        this.startCooldown(this.defaultCooldownMs / 1000);
      },
      error: (err) => {
        this.loading = false;
        logger.error(err);
        this.errorMessage = err?.message ?? 'Could not send reset email.';
        this.handleRateLimitError(err);
      },
    });
  }

  signInWith(provider: OAuthProvider) {
    if (this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.authService.signInWithProvider(provider).subscribe({
      next: ({ error }) => {
        if (error) {
          this.loading = false;
          this.errorMessage = error.message;
          this.appLog.error('auth.oauth-failure', error, { provider });
        }
        // On success the browser is redirected away — keep loading=true.
      },
      error: (err) => {
        this.loading = false;
        logger.error(err);
        this.errorMessage = err?.message ?? `Could not sign in with ${provider}.`;
        this.appLog.error('auth.oauth-failure', err, { provider });
      },
    });
  }

  /**
   * Legacy entry point retained for any external link still passing
   * `?auth_code=...`. New flows do not need it.
   */
  login(_authCode: string) {
    this.authService.login().subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => logger.error(err),
    });
  }
}
