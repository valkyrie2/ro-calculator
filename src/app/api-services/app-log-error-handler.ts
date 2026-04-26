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

    try {
      const appLog = this.injector.get(AppLogService, null);
      appLog?.error('app.unhandled-error', error);
    } catch {
      // Logging must never throw.
    }
  }
}
