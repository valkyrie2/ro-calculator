import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

/**
 * Singleton wrapper around the Supabase client. Inject this service anywhere
 * the app needs to talk to Supabase (auth, database, storage).
 *
 * The anon key is safe to ship to the browser; RLS policies enforce access.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  readonly client: SupabaseClient;

  constructor() {
    const { url, anonKey } = environment.supabase;
    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Use a no-op lock instead of the default Navigator LockManager.
        // The default can throw NavigatorLockAcquireTimeoutError during dev HMR
        // reloads or rapid tab switches. We're a single-page app where
        // cross-tab token-refresh coordination isn't critical.
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    });
  }
}
