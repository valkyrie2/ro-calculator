import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { logger } from './logger.service';
import { SupabaseClientService } from './supabase-client.service';

export type BugReportStatus = 'open' | 'backlog' | 'in_progress' | 'resolved' | 'closed';
export type BugReportType = 'bug' | 'request';

export interface BugReportRow {
  id: number;
  title: string;
  description: string | null;
  page_url: string | null;
  user_agent: string | null;
  image_path: string | null;
  status: BugReportStatus;
  report_type: BugReportType;
  reporter_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  admin_reply: string | null;
  admin_replied_at: string | null;
  admin_replied_by: string | null;
  public_reply: string | null;
  public_replied_at: string | null;
  public_reply_admin_replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicBugReportRow {
  id: number;
  title: string;
  description: string | null;
  status: BugReportStatus;
  report_type: BugReportType;
  admin_reply: string | null;
  admin_replied_at: string | null;
  public_reply: string | null;
  public_replied_at: string | null;
  created_at: string;
  updated_at: string;
  can_reply: boolean;
}

export interface SubmitBugReportInput {
  title: string;
  description?: string;
  reportType?: BugReportType;
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

  async submit(input: SubmitBugReportInput): Promise<void> {
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
      report_type: input.reportType ?? 'bug',
      page_url: input.pageUrl ?? (typeof window !== 'undefined' ? window.location.href : null),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      image_path: imagePath,
      reporter_id: profile?.id || null,
      reporter_name: profile?.name || null,
      reporter_email: profile?.email || null,
    };

    // Do NOT chain `.select()` here. That sets `Prefer: return=representation`,
    // asking PostgREST to read the inserted row back — which is filtered by the
    // SELECT RLS policy (admins, or owners where reporter_id = auth.uid()).
    // Anonymous reporters (reporter_id null, auth.uid() null) fail that policy,
    // so the read-back is rejected and the whole insert is rolled back with
    // "new row violates row-level security policy for table bug_reports".
    // Anyone may INSERT (policy `with check (true)`); only admins/owners may read.
    // `return=minimal` (no `.select()`) skips the read-back, so anon submits work.
    const { error } = await this.client.from('bug_reports').insert(row);

    if (error) {
      logger.error({ submitBugReportError: error });
      throw new Error(error.message);
    }
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

  async listPublicDashboard(): Promise<PublicBugReportRow[]> {
    const { data, error } = await this.client
      .from('public_bug_report_dashboard')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      logger.error({ listPublicBugReportsError: error });
      throw new Error(error.message);
    }
    return (data ?? []) as PublicBugReportRow[];
  }

  async updateStatus(id: number, status: BugReportStatus, updatedAt = new Date().toISOString()): Promise<string> {
    const { data, error } = await this.client
      .from('bug_reports')
      .update({ status, updated_at: updatedAt })
      .eq('id', id)
      .select('updated_at')
      .single();
    if (error) throw new Error(error.message);
    return data.updated_at as string;
  }

  async updateReportType(id: number, reportType: BugReportType): Promise<void> {
    const { error } = await this.client.from('bug_reports').update({ report_type: reportType }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async updateReply(id: number, reply: string): Promise<void> {
    const trimmed = reply.trim();
    const profile = this.authService.getProfile();
    const { error } = await this.client
      .from('bug_reports')
      .update({
        admin_reply: trimmed || null,
        admin_replied_at: trimmed ? new Date().toISOString() : null,
        admin_replied_by: trimmed ? profile?.id ?? null : null,
        public_reply: null,
        public_replied_at: null,
        public_reply_admin_replied_at: null,
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async replyToAdminComment(id: number, reply: string): Promise<void> {
    const { error } = await this.client.rpc('reply_to_bug_report_admin_comment', {
      report_id: id,
      reply,
    });
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
