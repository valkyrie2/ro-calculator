import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AdminService } from 'src/app/api-services';
import { logger } from 'src/app/api-services/logger.service';
import { ItemModel } from 'src/app/models/item.model';

@Component({
  selector: 'app-admin-add-item',
  templateUrl: './admin-add-item.component.html',
})
export class AdminAddItemComponent {
  jsonText = '';
  imageFile: File | null = null;
  imagePreview: string | null = null;
  parseError: string | null = null;
  saving = false;
  parsedItem: ItemModel | null = null;

  constructor(
    private readonly adminService: AdminService,
    private readonly messageService: MessageService,
  ) {}

  /** Re-parse on every keystroke so the user gets immediate feedback. */
  onJsonInput() {
    this.parseError = null;
    this.parsedItem = null;
    if (!this.jsonText.trim()) return;

    try {
      const obj = JSON.parse(this.jsonText);
      // Accept either a bare ItemModel or the keyed shape { "1234": {...} }.
      const item = this.unwrapKeyedItem(obj);
      if (typeof item.id !== 'number' || !Number.isFinite(item.id)) {
        throw new Error('Item JSON is missing a numeric "id" field.');
      }
      this.parsedItem = item;
    } catch (err: any) {
      this.parseError = err?.message ?? 'Invalid JSON.';
    }
  }

  /**
   * Lets the admin paste either:
   *   { "id": 1234, ... }
   * or the on-disk shape:
   *   { "1234": { "id": 1234, ... } }
   * The latter matches the format kept in `assets/demo/data/item.json`,
   * which is the easiest copy/paste path when migrating an existing entry.
   */
  private unwrapKeyedItem(obj: any): ItemModel {
    if (obj && typeof obj === 'object' && typeof obj.id !== 'number') {
      const keys = Object.keys(obj);
      if (keys.length === 1 && obj[keys[0]] && typeof obj[keys[0]] === 'object') {
        return obj[keys[0]] as ItemModel;
      }
    }
    return obj as ItemModel;
  }

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageFile = file;
    this.imagePreview = file ? URL.createObjectURL(file) : null;
  }

  async save() {
    if (!this.parsedItem) {
      this.messageService.add({ severity: 'error', summary: 'Fix JSON errors before saving.' });
      return;
    }
    this.saving = true;
    try {
      await this.adminService.addItem(this.parsedItem, this.imageFile);
      this.messageService.add({
        severity: 'success',
        summary: `Saved item ${this.parsedItem.id}`,
        detail: this.parsedItem.name,
      });
      this.jsonText = '';
      this.imageFile = null;
      this.imagePreview = null;
      this.parsedItem = null;
    } catch (err: any) {
      logger.error({ saveItem: err });
      this.messageService.add({ severity: 'error', summary: 'Save failed', detail: err?.message });
    } finally {
      this.saving = false;
    }
  }
}
