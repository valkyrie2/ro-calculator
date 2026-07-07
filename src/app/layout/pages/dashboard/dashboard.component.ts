import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { BugReportService, BugReportStatus, BugReportType, PublicBugReportRow } from 'src/app/api-services';
import { logger } from 'src/app/api-services/logger.service';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  reports: PublicBugReportRow[] = [];
  loading = false;
  selected: PublicBugReportRow | null = null;
  detailVisible = false;
  replyText = '';
  savingReply = false;
  readonly reportRowsPerPage = 5;

  readonly firstByStatus: Record<BugReportStatus, number> = {
    open: 0,
    backlog: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  readonly sections: { label: string; status: BugReportStatus; icon: string }[] = [
    { label: 'Open', status: 'open', icon: 'pi pi-bell' },
    { label: 'In Progress', status: 'in_progress', icon: 'pi pi-wrench' },
    { label: 'Closed', status: 'closed', icon: 'pi pi-lock' },
  ];

  constructor(
    private readonly bugReportService: BugReportService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  async refresh() {
    this.loading = true;
    try {
      this.reports = await this.bugReportService.listPublicDashboard();
    } catch (err) {
      logger.error({ listPublicDashboard: err });
      const detail = err instanceof Error ? err.message : 'Failed to load dashboard.';
      this.messageService.add({ severity: 'error', summary: 'Load failed', detail });
    } finally {
      this.loading = false;
    }
  }

  rowsByStatus(status: BugReportStatus): PublicBugReportRow[] {
    return this.reports.filter((row) => row.status === status);
  }

  pageFirst(status: BugReportStatus): number {
    const rowCount = this.rowsByStatus(status).length;
    const first = this.firstByStatus[status] ?? 0;
    if (first < rowCount) return first;
    if (rowCount === 0) return 0;
    return Math.floor((rowCount - 1) / this.reportRowsPerPage) * this.reportRowsPerPage;
  }

  pagedRowsByStatus(status: BugReportStatus): PublicBugReportRow[] {
    const first = this.pageFirst(status);
    return this.rowsByStatus(status).slice(first, first + this.reportRowsPerPage);
  }

  onPageChange(status: BugReportStatus, event: PaginatorState) {
    this.firstByStatus[status] = event.first ?? 0;
  }

  openDetail(row: PublicBugReportRow) {
    this.selected = row;
    this.replyText = '';
    this.detailVisible = true;
  }

  openDetailFromCard(row: PublicBugReportRow, event: Event) {
    if (this.isInteractiveCardTarget(event)) return;
    if (event instanceof KeyboardEvent && event.key === ' ') event.preventDefault();
    this.openDetail(row);
  }

  canReply(row: PublicBugReportRow | null): boolean {
    return !!row?.can_reply;
  }

  statusLabel(status: BugReportStatus): string {
    if (status === 'in_progress') return 'In Progress';
    if (status === 'closed') return 'Closed';
    if (status === 'resolved') return 'Resolved';
    return 'Open';
  }

  statusClass(status: BugReportStatus): string {
    return `dashboard-badge status-${status}`;
  }

  reportTypeLabel(type: BugReportType): string {
    return type === 'request' ? 'Request' : 'Bug';
  }

  reportTypeClass(type: BugReportType): string {
    return `dashboard-badge type-${type}`;
  }

  async submitReply() {
    if (!this.selected || !this.canReply(this.selected)) return;
    const reply = this.replyText.trim();
    if (!reply) {
      this.messageService.add({ severity: 'warn', summary: 'Reply is required' });
      return;
    }

    this.savingReply = true;
    try {
      await this.bugReportService.replyToAdminComment(this.selected.id, reply);
      this.messageService.add({ severity: 'success', summary: 'Reply sent' });
      this.detailVisible = false;
      await this.refresh();
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Failed to send reply.';
      this.messageService.add({ severity: 'error', summary: 'Reply failed', detail });
    } finally {
      this.savingReply = false;
    }
  }

  private isInteractiveCardTarget(event: Event): boolean {
    if (event.target === event.currentTarget) return false;
    const target = event.target;
    if (!(target instanceof Element)) return false;
    return !!target.closest('button, a, input, textarea, select, .p-component');
  }
}