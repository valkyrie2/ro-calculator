import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    umami?: {
      track: (event?: string | ((props: Record<string, unknown>) => Record<string, unknown>), data?: Record<string, unknown>) => void;
      identify?: (data: Record<string, unknown>) => void;
    };
  }
}

const OPT_OUT_KEY = 'umami.disabled';

/**
 * Thin wrapper over the Umami tracker (loaded in `index.html`).
 * - No-ops in non-production builds.
 * - Respects user opt-out stored in `localStorage['umami.disabled']`.
 * - Safe if the script failed to load (e.g. blocked by adblocker).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly canTrack = environment.production;

  /** True when user has opted out of analytics. */
  isOptedOut(): boolean {
    try {
      return localStorage.getItem(OPT_OUT_KEY) === '1';
    } catch {
      return false;
    }
  }

  setOptOut(optOut: boolean): void {
    try {
      if (optOut) {
        localStorage.setItem(OPT_OUT_KEY, '1');
      } else {
        localStorage.removeItem(OPT_OUT_KEY);
      }
    } catch {
      // localStorage unavailable — swallow
    }
  }

  /** Track a custom event. `data` is extra key/value metadata. */
  track(event: string, data?: Record<string, unknown>): void {
    if (!this.canTrack || this.isOptedOut()) return;
    try {
      window.umami?.track(event, data);
    } catch {
      // umami missing or threw — swallow
    }
  }

  /** Track current URL as a pageview. Useful for SPA route changes. */
  trackPageview(url: string): void {
    if (!this.canTrack || this.isOptedOut()) return;
    try {
      window.umami?.track((props) => ({ ...props, url }));
    } catch {
      // swallow
    }
  }
}
