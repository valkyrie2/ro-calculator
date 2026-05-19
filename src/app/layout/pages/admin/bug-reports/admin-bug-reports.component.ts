import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BugReportRow, BugReportService, BugReportStatus } from 'src/app/api-services';
import { logger } from 'src/app/api-services/logger.service';

@Component({
  standalone: false,
  selector: 'app-admin-bug-reports',
  templateUrl: './admin-bug-reports.component.html',
  styles: [
    `
      .bug-report-section-header {
        border: 1px solid var(--surface-border);
        border-radius: 6px;
        background: var(--surface-card);
      }

      .bug-report-row-new {
        background: rgba(34, 197, 94, 0.12) !important;
      }

      .status-badge,
      .new-issue-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        line-height: 1;
        padding: 0.25rem 0.5rem;
        white-space: nowrap;
      }

      .status-open,
      .new-issue-badge {
        color: #86efac;
        background: rgba(34, 197, 94, 0.18);
        border: 1px solid rgba(34, 197, 94, 0.35);
      }

      .status-in_progress {
        color: #93c5fd;
        background: rgba(59, 130, 246, 0.18);
        border: 1px solid rgba(59, 130, 246, 0.35);
      }

      .status-resolved {
        color: #c4b5fd;
        background: rgba(139, 92, 246, 0.18);
        border: 1px solid rgba(139, 92, 246, 0.35);
      }

      .status-closed {
        color: var(--text-color-secondary);
        background: rgba(148, 163, 184, 0.14);
        border: 1px solid rgba(148, 163, 184, 0.28);
      }
    `,
  ],
})
export class AdminBugReportsComponent implements OnInit {
  reports: BugReportRow[] = [];
  loading = false;

  readonly statusOptions: { label: string; value: BugReportStatus }[] = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Closed', value: 'closed' },
  ];

  readonly statusSections: {
    label: string;
    value: BugReportStatus;
    icon: string;
    description: string;
  }[] = [
    { label: 'New Issues', value: 'open', icon: 'pi pi-bell', description: 'Fresh reports waiting for first triage' },
    { label: 'In Progress', value: 'in_progress', icon: 'pi pi-wrench', description: 'Reports currently being investigated' },
    { label: 'Resolved', value: 'resolved', icon: 'pi pi-check-circle', description: 'Fixed or answered reports' },
    { label: 'Closed', value: 'closed', icon: 'pi pi-lock', description: 'Archived reports' },
  ];

  selected: BugReportRow | null = null;
  detailVisible = false;
  replyText = '';
  savingReply = false;

  constructor(
    private readonly bugReportService: BugReportService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  async refresh() {
    this.loading = true;
    try {
      this.reports = await this.bugReportService.list();
    } catch (err) {
      logger.error({ listBugReports: err });
      const detail = err instanceof Error ? err.message : 'Failed to load reports.';
      this.messageService.add({ severity: 'error', summary: 'Load failed', detail });
    } finally {
      this.loading = false;
    }
  }

  imageUrl(row: BugReportRow): string | null {
    return this.bugReportService.getPublicImageUrl(row.image_path);
  }

  rowsByStatus(status: BugReportStatus): BugReportRow[] {
    return this.reports.filter((row) => row.status === status);
  }

  statusLabel(status: BugReportStatus): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  statusClass(status: BugReportStatus): string {
    return `status-badge status-${status}`;
  }

  isNewIssue(row: BugReportRow): boolean {
    return row.status === 'open';
  }

  async onStatusChange(row: BugReportRow, status: BugReportStatus) {
    const previous = row.status;
    row.status = status;
    try {
      await this.bugReportService.updateStatus(row.id, status);
      this.messageService.add({ severity: 'success', summary: `Status: ${status}` });
    } catch (err) {
      row.status = previous;
      const detail = err instanceof Error ? err.message : 'Failed to update.';
      this.messageService.add({ severity: 'error', summary: 'Update failed', detail });
    }
  }

  async saveReply() {
    if (!this.selected) return;

    const row = this.selected;
    this.savingReply = true;
    try {
      await this.bugReportService.updateReply(row.id, this.replyText);
      const trimmed = this.replyText.trim();
      row.admin_reply = trimmed || null;
      row.admin_replied_at = trimmed ? new Date().toISOString() : null;
      this.messageService.add({ severity: 'success', summary: trimmed ? 'Reply saved' : 'Reply cleared' });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Failed to save reply.';
      this.messageService.add({ severity: 'error', summary: 'Reply failed', detail });
    } finally {
      this.savingReply = false;
    }
  }

  confirmDelete(row: BugReportRow) {
    this.confirmationService.confirm({
      message: `Delete bug report #${row.id}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.delete(row),
    });
  }

  private async delete(row: BugReportRow) {
    try {
      await this.bugReportService.delete(row.id);
      this.reports = this.reports.filter((r) => r.id !== row.id);
      if (this.selected?.id === row.id) {
        this.selected = null;
        this.detailVisible = false;
      }
      this.messageService.add({ severity: 'success', summary: 'Deleted' });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Failed to delete.';
      this.messageService.add({ severity: 'error', summary: 'Delete failed', detail });
    }
  }

  openDetail(row: BugReportRow) {
    this.selected = row;
    this.replyText = row.admin_reply ?? '';
    this.detailVisible = true;
  }
}
