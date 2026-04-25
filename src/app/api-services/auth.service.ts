import { Injectable, NgZone } from '@angular/core';
import { Provider, Session, User } from '@supabase/supabase-js';
import { Observable, ReplaySubject, distinctUntilChanged, from, map, tap } from 'rxjs';
import { Profile, UserRole } from './models';
import { logger } from './logger.service';
import { SupabaseClientService } from './supabase-client.service';

export type OAuthProvider = Extract<Provider, 'google' | 'discord'>;

interface UserProfileRow {
  id: string;
  role: UserRole;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class AuthService {
  private readonly profileEvent = new ReplaySubject<Profile>(1);
  private readonly loggedInSubject = new ReplaySubject<boolean>(1);

  private profile: Profile | undefined;

  /** Emits the current profile (or empty profile when logged out). */
  readonly profileEventObs$ = this.profileEvent.asObservable();
  /** Emits the current logged-in state. */
  readonly loggedInEvent$ = this.loggedInSubject.asObservable();
  /** True when the current user has the `admin` role. */
  readonly isAdmin$ = this.profileEvent.pipe(
    map((p) => p?.role === 'admin'),
    distinctUntilChanged(),
  );
  /** True when the user is admin OR has a non-expired premium grant. */
  readonly isPremium$ = this.profileEvent.pipe(
    map((p) => this.computeIsPremium(p)),
    distinctUntilChanged(),
  );
  isLoggedIn = false;

  constructor(private readonly supabaseClient: SupabaseClientService, private readonly zone: NgZone) {
    this.loggedInEvent$.subscribe((isLoggedIn) => (this.isLoggedIn = isLoggedIn));

    // Hydrate from any persisted session and listen for future auth events
    // (sign-in, sign-out, token refresh, OAuth callback parsing, etc.).
    this.client.auth.getSession().then(({ data }) => this.handleSession(data.session));
    this.client.auth.onAuthStateChange((_event, session) => {
      // Supabase callbacks fire outside Angular's zone — re-enter so UI updates.
      this.zone.run(() => this.handleSession(session));
    });
  }

  private get client() {
    return this.supabaseClient.client;
  }

  // ---- Session / profile -------------------------------------------------

  private handleSession(session: Session | null) {
    if (session?.user) {
      this.storeProfile(this.toProfile(session.user));
      this.loggedInSubject.next(true);
      // Pull role + premium expiry from user_profiles. The signup trigger
      // creates the row, so this should always succeed for valid users.
      this.refreshUserProfileRow(session.user.id).catch((err) =>
        logger.error({ refreshUserProfileRow: err }),
      );
    } else {
      this.storeProfile({} as Profile);
      this.loggedInSubject.next(false);
    }
  }

  private toProfile(user: User, row?: UserProfileRow): Profile {
    const meta = (user.user_metadata ?? {}) as Record<string, any>;
    const name: string =
      meta['name'] || meta['full_name'] || meta['user_name'] || user.email?.split('@')[0] || '';
    return {
      id: user.id,
      name,
      email: user.email ?? '',
      status: 'active',
      role: row?.role ?? 'user',
      premiumExpiresAt: row?.premium_expires_at ?? '',
      createdAt: user.created_at ?? '',
      updatedAt: (user.updated_at as string) ?? user.created_at ?? '',
    };
  }

  private async refreshUserProfileRow(userId: string): Promise<void> {
    const { data, error } = await this.client
      .from('user_profiles')
      .select('id, role, premium_expires_at, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      logger.error({ userProfileError: error });
      return;
    }
    if (!data || !this.profile) return;
    const row = data as UserProfileRow;
    this.storeProfile({
      ...this.profile,
      role: row.role ?? 'user',
      premiumExpiresAt: row.premium_expires_at ?? '',
    });
  }

  private computeIsPremium(profile: Profile | undefined): boolean {
    if (!profile?.id) return false;
    if (profile.role === 'admin') return true;
    if (!profile.premiumExpiresAt) return false;
    const exp = Date.parse(profile.premiumExpiresAt);
    return Number.isFinite(exp) && exp > Date.now();
  }

  private storeProfile(profile: Profile) {
    this.profile = { ...profile };
    this.profileEvent.next(this.profile);
  }

  getProfile() {
    return this.profile;
  }

  /** Synchronous helper — true when the cached profile is admin. */
  isAdmin(): boolean {
    return this.profile?.role === 'admin';
  }

  /** Synchronous helper — true when admin OR premium not yet expired. */
  isPremium(): boolean {
    return this.computeIsPremium(this.profile);
  }

  /** Re-fetches the current user from Supabase and re-emits the profile. */
  getMyProfile(): Observable<Profile | null> {
    return from(
      (async () => {
        const { data, error } = await this.client.auth.getUser();
        if (error || !data?.user) {
          this.handleSession(null);
          return null;
        }
        const baseProfile = this.toProfile(data.user);
        this.storeProfile(baseProfile);
        this.loggedInSubject.next(true);
        await this.refreshUserProfileRow(data.user.id);
        return this.profile ?? baseProfile;
      })(),
    );
  }

  /** Returns the current Supabase access token, or null if logged out. */
  async getAccessToken(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.access_token ?? null;
  }

  // ---- Email + password --------------------------------------------------

  signUpWithEmail(email: string, password: string, name?: string) {
    return from(
      this.client.auth.signUp({
        email,
        password,
        options: {
          data: name ? { name } : undefined,
          emailRedirectTo: this.buildRedirectUrl(),
        },
      }),
    ).pipe(
      tap(({ error }) => {
        if (error) logger.error({ supabaseSignUpError: error });
      }),
    );
  }

  signInWithEmail(email: string, password: string) {
    return from(this.client.auth.signInWithPassword({ email, password })).pipe(
      tap(({ error }) => {
        if (error) logger.error({ supabaseSignInError: error });
      }),
    );
  }

  sendPasswordReset(email: string) {
    return from(
      this.client.auth.resetPasswordForEmail(email, {
        redirectTo: this.buildRedirectUrl(),
      }),
    );
  }

  // ---- OAuth -------------------------------------------------------------

  signInWithProvider(provider: OAuthProvider) {
    return from(
      this.client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: this.buildRedirectUrl() },
      }),
    );
  }

  // ---- Backwards-compatible API -----------------------------------------

  /**
   * Legacy entry point kept so existing call sites compile. The Supabase
   * flow no longer uses an authorization code on the frontend, so this is a
   * no-op that just refreshes the profile.
   */
  login(_authorizationCode?: string) {
    return this.getMyProfile();
  }

  /** Sign the current user out and clear local profile state. */
  logout() {
    this.client.auth.signOut().catch((err) => logger.error({ err }));
  }

  /** Update the display name on the user's Supabase metadata. */
  updateMyProfile(body: { name: string }): Observable<Profile> {
    return from(this.client.auth.updateUser({ data: { name: body.name } })).pipe(
      map(({ data, error }) => {
        if (error || !data?.user) {
          throw error ?? new Error('Failed to update profile');
        }
        const profile = this.toProfile(data.user);
        this.storeProfile(profile);
        return profile;
      }),
    );
  }

  // ---- Helpers -----------------------------------------------------------

  private buildRedirectUrl(): string {
    // Always come back to /login so AuthComponent can finish the round-trip.
    // Preserve the deployed sub-path (e.g. /ro-calculator/) but drop any
    // existing route + hash so Supabase doesn't double-append.
    const { origin, pathname } = window.location;
    const base = pathname.replace(/index\.html$/, '').replace(/\/+$/, '');
    return `${origin}${base}/login`;
  }
}
