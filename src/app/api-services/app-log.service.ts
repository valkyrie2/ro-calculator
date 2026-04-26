import { Injectable, OnDestroy } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { logger } from './logger.service';
import { SupabaseClientService } from './supabase-client.service';

type LogLevel = 'info' | 'warn' | 'error';

interface AppLogRow {
  user_id: string | null;
  level: LogLevel;
  event: string;
  message: string | null;
  data: Record<string, unknown> | null;
  url: string;
  user_agent: string;
  app_version: string;
}

const APP_VERSION = '1.0.3';
const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER = 20;
const OPT_OUT_KEY = 'app-logs.disabled';

/**
 * Sends app activity + error logs to the `app_logs` table in Supabase.
 *
 * - Buffers info/warn entries and flushes every {@link FLUSH_INTERVAL_MS}
 *   (or when the buffer reaches {@link MAX_BUFFER}) to keep network chatter
 *   low.
 * - Errors flush immediately so they are not lost on a crash/reload.
 * - Flushes on `pagehide` / `visibilitychange` so we don't lose buffered logs
 *   when the user navigates away.
 *
 * To read logs: open the Supabase Dashboard → Table Editor → `app_logs`,
 * or run `select * from public.app_logs order by created_at desc limit 100;`
 * in the SQL editor. See `docs-internal/app-logs.md`.
 */
@Injectable({ providedIn: 'root' })
export class AppLogService implements OnDestroy {
  private readonly buffer: AppLogRow[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly flushOnHide = () => {
    if (this.buffer.length > 0) void this.flush();
  };

  constructor(
    private readonly supabaseClient: SupabaseClientService,
    private readonly authService: AuthService,
  ) {
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', this.flushOnHide);
      window.addEventListener('visibilitychange', this.flushOnHide);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.flushOnHide);
      window.removeEventListener('visibilitychange', this.flushOnHide);
    }
    if (this.flushTimer) clearTimeout(this.flushTimer);
    void this.flush();
  }

  /** Track a major user action (e.g. `preset.save`, `auth.login`). */
  info(event: string, data?: Record<string, unknown>, message?: string): void {
    this.enqueue('info', event, data, message);
  }

  warn(event: string, data?: Record<string, unknown>, message?: string): void {
    this.enqueue('warn', event, data, message);
  }

  /**
   * Log an error. Accepts a raw `Error`, an arbitrary value, or a payload
   * object. Always flushes immediately.
   */
  error(event: string, err?: unknown, data?: Record<string, unknown>): void {
    const { message, payload } = this.normalizeError(err);
    this.enqueue('error', event, { ...payload, ...data }, message);
    void this.flush();
  }

  /** Disable client-side logging (persists in localStorage). */
  setOptOut(optOut: boolean): void {
    try {
      if (optOut) localStorage.setItem(OPT_OUT_KEY, '1');
      else localStorage.removeItem(OPT_OUT_KEY);
    } catch {
      // localStorage unavailable — ignore
    }
  }

  isOptedOut(): boolean {
    try {
      return localStorage.getItem(OPT_OUT_KEY) === '1';
    } catch {
      return false;
    }
  }

  // ---- Internals ---------------------------------------------------------

  private enqueue(
    level: LogLevel,
    event: string,
    data: Record<string, unknown> | undefined,
    message: string | undefined,
  ): void {
    if (this.isOptedOut()) return;
    if (!event) return;

    const row: AppLogRow = {
      user_id: this.authService.getProfile()?.id || null,
      level,
      event: this.truncate(event, 200),
      message: message ? this.truncate(message, 1000) : null,
      data: this.sanitize(data),
      url: typeof window !== 'undefined' ? this.truncate(window.location.href, 500) : '',
      user_agent: typeof navigator !== 'undefined' ? this.truncate(navigator.userAgent, 500) : '',
      app_version: APP_VERSION,
    };
    this.buffer.push(row);

    if (this.buffer.length >= MAX_BUFFER) {
      void this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        void this.flush();
      }, FLUSH_INTERVAL_MS);
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const rows = this.buffer.splice(0, this.buffer.length);
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      const { error } = await this.supabaseClient.client.from('app_logs').insert(rows);
      if (error) {
        // Don't recurse via this.error — write to console so we don't loop.
        if (!environment.production) logger.error({ appLogFlushError: error });
      }
    } catch (err) {
      if (!environment.production) logger.error({ appLogFlushThrow: err });
    }
  }

  private normalizeError(err: unknown): {
    message: string;
    payload: Record<string, unknown>;
  } {
    if (!err) return { message: '', payload: {} };
    if (err instanceof Error) {
      return {
        message: this.truncate(err.message || err.name, 1000),
        payload: { name: err.name, stack: this.truncate(err.stack ?? '', 4000) },
      };
    }
    if (typeof err === 'string') {
      return { message: this.truncate(err, 1000), payload: {} };
    }
    try {
      return { message: '', payload: { value: JSON.parse(JSON.stringify(err)) } };
    } catch {
      return { message: String(err), payload: {} };
    }
  }

  /**
   * Strip non-JSON-safe values (functions, undefined) and cap size so we
   * don't blow up the row.
   */
  private sanitize(data: Record<string, unknown> | undefined): Record<string, unknown> | null {
    if (!data) return null;
    try {
      const clone = JSON.parse(JSON.stringify(data));
      const text = JSON.stringify(clone);
      if (text.length > 8000) {
        return { _truncated: true, preview: text.slice(0, 8000) };
      }
      return clone;
    } catch {
      return { _unserializable: true };
    }
  }

  private truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) : text;
  }
}
