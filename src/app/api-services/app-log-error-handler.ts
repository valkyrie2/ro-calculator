import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { AppLogService } from './app-log.service';
import { logger } from './logger.service';

/**
 * Forwards unhandled Angular errors to the `app_logs` table via
 * {@link AppLogService}. Keeps the default console behaviour so DevTools
 * still show the stack trace.
 *
 * Uses the {@link Injector} lazily because `ErrorHandler` is constructed
 * before `AppLogService` (which depends on Supabase + auth) is ready.
 */
@Injectable()
export class AppLogErrorHandler implements ErrorHandler {
  constructor(private readonly injector: Injector) {}

  handleError(error: unknown): void {
    // Always log to the console first — never swallow.
    logger.error(error);

    // Handle stale chunk references after a new deploy: the user's cached
    // index.html points at chunk hashes that no longer exist. Reloading
    // fetches the new index.html and resolves the broken module import.
    if (this.isChunkLoadError(error) && this.shouldReloadForChunkError()) {
      window.location.reload();
      return;
    }

    try {
      const appLog = this.injector.get(AppLogService, null);
      appLog?.error('app.unhandled-error', error);
    } catch {
      // Logging must never throw.
    }
  }

  private isChunkLoadError(error: unknown): boolean {
    const err: any = (error as any)?.rejection ?? error;
    const name = err?.name || '';
    const message = String(err?.message || err || '');
    return (
      name === 'ChunkLoadError' ||
      /Failed to fetch dynamically imported module/i.test(message) ||
      /Loading chunk [^\s]+ failed/i.test(message) ||
      /error loading dynamically imported module/i.test(message)
    );
  }

  private shouldReloadForChunkError(): boolean {
    // Avoid reload loops: only reload once per session.
    try {
      const key = 'app:chunkReloadAt';
      const last = Number(sessionStorage.getItem(key) || 0);
      const now = Date.now();
      if (now - last < 30_000) return false;
      sessionStorage.setItem(key, String(now));
      return true;
    } catch {
      return true;
    }
  }
}
