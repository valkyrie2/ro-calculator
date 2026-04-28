import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BugReportRow, BugReportService, BugReportStatus } from 'src/app/api-services';
import { logger } from 'src/app/api-services/logger.service';

@Component({
  selector: 'app-admin-bug-reports',
  templateUrl: './admin-bug-reports.component.html',
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

  selected: BugReportRow | null = null;
  detailVisible = false;

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
    this.detailVisible = true;
  }
}
