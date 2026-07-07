import { Component, OnInit } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { BugReportRow, BugReportService, BugReportStatus, BugReportType } from 'src/app/api-services';
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
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.025));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }

      .bug-column-panel {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        overflow: hidden;
      }

      .bug-column-heading {
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        padding: 0.85rem;
      }

      .report-status-open .bug-column-heading {
        background: linear-gradient(90deg, rgba(var(--primary-color-rgb, 76, 175, 80), 0.18), rgba(var(--primary-color-rgb, 76, 175, 80), 0.045));
        border-bottom-color: rgba(var(--primary-color-rgb, 76, 175, 80), 0.22);
      }

      .report-status-in_progress .bug-column-heading {
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.18), rgba(59, 130, 246, 0.045));
        border-bottom-color: rgba(59, 130, 246, 0.22);
      }

      .report-status-closed .bug-column-heading {
        background: linear-gradient(90deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.035));
        border-bottom-color: rgba(148, 163, 184, 0.2);
      }

      .bug-report-row-new {
        background: transparent !important;
      }

      .bug-board-scroll {
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }

      .bug-board-columns {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(3, minmax(285px, 1fr));
        min-width: 900px;
      }

      .bug-board-column {
        min-width: 0;
      }

      .bug-card-list {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.75rem;
        min-height: 7rem;
        padding: 0.85rem;
      }

      .bug-card-list-loading {
        opacity: 0.65;
        pointer-events: none;
      }

      .bug-board-card,
      .bug-empty-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.058), rgba(255, 255, 255, 0.032));
        box-shadow: inset 4px 0 0 rgba(var(--primary-color-rgb, 76, 175, 80), 0.55);
        padding: 0.85rem;
      }

      .bug-board-card {
        cursor: pointer;
        transition:
          background-color 0.16s,
          border-color 0.16s,
          transform 0.16s;
      }

      .bug-board-card.cdk-drag-preview {
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
      }

      .bug-board-card.cdk-drag-placeholder {
        opacity: 0.28;
      }

      .bug-card-list.cdk-drop-list-dragging {
        background: rgba(var(--primary-color-rgb, 76, 175, 80), 0.06);
        border-radius: 0 0 6px 6px;
      }

      .bug-drag-handle {
        cursor: grab;
      }

      .bug-drag-handle:active {
        cursor: grabbing;
      }

      .bug-board-card:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .bug-board-card:hover {
        border-color: rgba(255, 255, 255, 0.14);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.085), rgba(255, 255, 255, 0.046));
        transform: translateY(-1px);
      }

      .bug-board-card.report-status-open {
        box-shadow: inset 4px 0 0 rgba(var(--primary-color-rgb, 76, 175, 80), 0.6);
      }

      .bug-board-card.report-status-in_progress {
        box-shadow: inset 4px 0 0 rgba(96, 165, 250, 0.58);
      }

      .bug-board-card.report-status-closed {
        box-shadow: inset 4px 0 0 rgba(148, 163, 184, 0.42);
      }

      .bug-card-topline,
      .bug-card-actions,
      .bug-card-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .bug-card-topline {
        justify-content: space-between;
      }

      .bug-card-actions {
        flex: 0 0 auto;
      }

      .bug-report-id {
        color: var(--text-color-secondary);
        font-size: 0.75rem;
        font-weight: 700;
      }

      .bug-card-title {
        display: block;
        line-height: 1.3;
        margin-top: 0.65rem;
        max-width: 100%;
      }

      .bug-card-meta {
        flex-wrap: wrap;
        color: var(--text-color-secondary);
        font-size: 0.75rem;
        margin-top: 0.75rem;
      }

      .bug-card-meta .pi {
        font-size: 0.75rem;
        margin-right: 0.35rem;
      }

      .bug-card-reporter {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        margin-top: 0.75rem;
        padding-top: 0.65rem;
      }

      .bug-card-image-link {
        display: inline-flex;
        margin-top: 0.65rem;
      }

      .bug-card-image {
        border-radius: 4px;
        height: 44px;
        object-fit: cover;
        width: 44px;
      }

      .bug-card-controls {
        display: grid;
        gap: 0.55rem;
        grid-template-columns: 1fr;
        margin-top: 0.75rem;
      }

      .bug-empty-card {
        color: var(--text-color-secondary);
        font-size: 0.85rem;
        text-align: center;
      }

      .bug-title-button {
        appearance: none;
        border: 0;
        background: transparent;
        color: var(--primary-color);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        padding: 0;
        text-align: left;
      }

      .bug-title-button:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      :host ::ng-deep .admin-bug-board .p-paginator {
        margin-top: 0.35rem;
        border-color: rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.035);
      }

      :host ::ng-deep .admin-bug-board .p-paginator .p-paginator-page.p-paginator-page-selected,
      :host ::ng-deep .admin-bug-board .p-paginator .p-paginator-page.p-highlight,
      :host ::ng-deep .admin-bug-board .p-paginator .p-paginator-page[aria-current='page'] {
        color: var(--primary-color-text);
        background: var(--primary-color);
        border-color: var(--primary-color);
      }

      .status-badge,
      .type-badge,
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
        color: #9ee6b2;
        background: rgba(34, 197, 94, 0.13);
        border: 1px solid rgba(34, 197, 94, 0.28);
      }

      .status-in_progress {
        color: #b7d5ff;
        background: rgba(59, 130, 246, 0.13);
        border: 1px solid rgba(59, 130, 246, 0.28);
      }

      .status-closed {
        color: var(--text-color-secondary);
        background: rgba(148, 163, 184, 0.14);
        border: 1px solid rgba(148, 163, 184, 0.28);
      }

      .reply-badge {
        color: #d4c7ff;
        background: rgba(139, 92, 246, 0.12);
        border: 1px solid rgba(139, 92, 246, 0.25);
      }

      .type-bug {
        color: #f2b8b8;
        background: rgba(239, 68, 68, 0.11);
        border: 1px solid rgba(239, 68, 68, 0.25);
      }

      .type-request {
        color: #f4d78a;
        background: rgba(245, 158, 11, 0.11);
        border: 1px solid rgba(245, 158, 11, 0.25);
      }
    `,
  ],
})
export class AdminBugReportsComponent implements OnInit {
  reports: BugReportRow[] = [];
  loading = false;
  readonly bugRowsPerPage = 20;

  readonly firstByStatus: Partial<Record<BugReportStatus, number>> = {
    open: 0,
    in_progress: 0,
    closed: 0,
  };

  readonly statusOptions: { label: string; value: BugReportStatus }[] = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Closed', value: 'closed' },
  ];

  readonly reportTypeOptions: { label: string; value: BugReportType }[] = [
    { label: 'Bug', value: 'bug' },
    { label: 'Request', value: 'request' },
  ];

  readonly statusSections: {
    label: string;
    value: BugReportStatus;
    icon: string;
    description: string;
  }[] = [
    { label: 'New Issues', value: 'open', icon: 'pi pi-bell', description: 'Fresh reports waiting for first triage' },
    { label: 'In Progress', value: 'in_progress', icon: 'pi pi-wrench', description: 'Reports currently being investigated' },
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
      this.reports = (await this.bugReportService.list()).map((row) => ({
        ...row,
        status: row.status === 'resolved' ? 'closed' : row.status,
      }));
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

  pageFirst(status: BugReportStatus): number {
    const rowCount = this.rowsByStatus(status).length;
    const first = this.firstByStatus[status] ?? 0;
    if (first < rowCount) return first;
    if (rowCount === 0) return 0;
    return Math.floor((rowCount - 1) / this.bugRowsPerPage) * this.bugRowsPerPage;
  }

  pagedRowsByStatus(status: BugReportStatus): BugReportRow[] {
    const first = this.pageFirst(status);
    return this.rowsByStatus(status).slice(first, first + this.bugRowsPerPage);
  }

  onPageChange(status: BugReportStatus, event: PaginatorState) {
    this.firstByStatus[status] = event.first ?? 0;
  }

  async onDropStatus(status: BugReportStatus, event: CdkDragDrop<BugReportStatus>) {
    const row = event.item.data as BugReportRow | undefined;
    if (!row || row.status === status) return;
    await this.onStatusChange(row, status);
  }

  statusLabel(status: BugReportStatus): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  statusClass(status: BugReportStatus): string {
    return `status-badge status-${status}`;
  }

  reportTypeLabel(type: BugReportType): string {
    return this.reportTypeOptions.find((option) => option.value === type)?.label ?? type;
  }

  reportTypeClass(type: BugReportType): string {
    return `type-badge type-${type}`;
  }

  isNewIssue(row: BugReportRow): boolean {
    return row.status === 'open';
  }

  async onStatusChange(row: BugReportRow, status: BugReportStatus) {
    const previous = row.status;
    const previousUpdatedAt = row.updated_at;
    const updatedAt = new Date().toISOString();
    row.status = status;
    row.updated_at = updatedAt;
    try {
      const savedUpdatedAt = await this.bugReportService.updateStatus(row.id, status, updatedAt);
      row.updated_at = savedUpdatedAt;
      this.messageService.add({ severity: 'success', summary: `Status: ${status}` });
    } catch (err) {
      row.status = previous;
      row.updated_at = previousUpdatedAt;
      const detail = err instanceof Error ? err.message : 'Failed to update.';
      this.messageService.add({ severity: 'error', summary: 'Update failed', detail });
    }
  }

  async onReportTypeChange(row: BugReportRow, reportType: BugReportType) {
    const previous = row.report_type;
    row.report_type = reportType;
    try {
      await this.bugReportService.updateReportType(row.id, reportType);
      this.messageService.add({ severity: 'success', summary: `Type: ${this.reportTypeLabel(reportType)}` });
    } catch (err) {
      row.report_type = previous;
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
      row.public_reply = null;
      row.public_replied_at = null;
      row.public_reply_admin_replied_at = null;
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

  openDetailFromCard(row: BugReportRow, event: Event) {
    if (this.isInteractiveCardTarget(event)) return;
    if (event instanceof KeyboardEvent && event.key === ' ') event.preventDefault();
    this.openDetail(row);
  }

  private isInteractiveCardTarget(event: Event): boolean {
    if (event.target === event.currentTarget) return false;
    const target = event.target;
    if (!(target instanceof Element)) return false;
    return !!target.closest('button, a, input, textarea, select, .p-component, .bug-card-controls');
  }
}
