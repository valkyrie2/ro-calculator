import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Thin wrapper around `console` that no-ops in production builds.
 * Use via DI (`constructor(private logger: LoggerService) {}`) where possible.
 * For files that are not Angular-injectable (utils, constants, bare classes),
 * import the shared `logger` singleton instead.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly enabled = !environment.production;

  log(...args: unknown[]): void {
    if (this.enabled) console.log(...args);
  }

  warn(...args: unknown[]): void {
    if (this.enabled) console.warn(...args);
  }

  info(...args: unknown[]): void {
    if (this.enabled) console.info(...args);
  }

  debug(...args: unknown[]): void {
    if (this.enabled) console.debug(...args);
  }

  /** Errors are always logged — keep them on in production for diagnostics. */
  error(...args: unknown[]): void {
    console.error(...args);
  }

  clear(): void {
    if (this.enabled) console.clear();
  }
}

/**
 * Module-level singleton for non-DI contexts (utility functions, constants,
 * standalone classes). Mirrors `LoggerService` semantics.
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (!environment.production) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (!environment.production) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (!environment.production) console.info(...args);
  },
  debug: (...args: unknown[]) => {
    if (!environment.production) console.debug(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  clear: () => {
    if (!environment.production) console.clear();
  },
};
