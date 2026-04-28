import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { logger } from './logger.service';
import { SupabaseClientService } from './supabase-client.service';

export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface BugReportRow {
  id: number;
  title: string;
  description: string | null;
  page_url: string | null;
  user_agent: string | null;
  image_path: string | null;
  status: BugReportStatus;
  reporter_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitBugReportInput {
  title: string;
  description?: string;
  pageUrl?: string;
  image?: File | null;
}

const BUCKET = 'bug-report-images';

/**
 * Submits and lists bug reports stored in the `public.bug_reports` table.
 * Anyone (incl. anon) can submit; only admins can list/update via RLS.
 */
@Injectable({ providedIn: 'root' })
export class BugReportService {
  constructor(
    private readonly supabaseClient: SupabaseClientService,
    private readonly authService: AuthService,
  ) {}

  private get client() {
    return this.supabaseClient.client;
  }

  async submit(input: SubmitBugReportInput): Promise<BugReportRow> {
    const title = (input.title || '').trim();
    if (!title) throw new Error('Title is required.');

    let imagePath: string | null = null;
    if (input.image) {
      imagePath = await this.uploadImage(input.image);
    }

    const profile = this.authService.getProfile();

    const row = {
      title,
      description: input.description?.trim() || null,
      page_url: input.pageUrl ?? (typeof window !== 'undefined' ? window.location.href : null),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      image_path: imagePath,
      reporter_id: profile?.id || null,
      reporter_name: profile?.name || null,
      reporter_email: profile?.email || null,
    };

    const { data, error } = await this.client
      .from('bug_reports')
      .insert(row)
      .select()
      .single();

    if (error) {
      logger.error({ submitBugReportError: error });
      throw new Error(error.message);
    }
    return data as BugReportRow;
  }

  async list(): Promise<BugReportRow[]> {
    const { data, error } = await this.client
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      logger.error({ listBugReportsError: error });
      throw new Error(error.message);
    }
    return (data ?? []) as BugReportRow[];
  }

  async updateStatus(id: number, status: BugReportStatus): Promise<void> {
    const { error } = await this.client.from('bug_reports').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.client.from('bug_reports').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  getPublicImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl ?? null;
  }

  private async uploadImage(file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    // Random short id keeps uploads unique even from anon users.
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${Date.now()}-${rand}.${ext}`;

    const { error } = await this.client.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || `image/${ext}`,
    });
    if (error) {
      logger.error({ uploadBugReportImageError: error });
      throw new Error(error.message);
    }
    return path;
  }
}
