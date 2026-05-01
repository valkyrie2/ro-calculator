import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AdminService } from 'src/app/api-services';
import {
  divinePrideItemImageUrl,
  mapDivinePrideItem,
  parseDivinePrideItemRef,
  type DivinePrideItemResponse,
} from 'src/app/api-services/divine-pride';
import { logger } from 'src/app/api-services/logger.service';
import { ItemModel } from 'src/app/models/item.model';

const DIVINE_PRIDE_API_KEY = '4661da55613043bc544aaa9274fda488';
const DIVINE_PRIDE_SERVER = 'thROG';

@Component({
  selector: 'app-admin-add-item',
  templateUrl: './admin-add-item.component.html',
})
export class AdminAddItemComponent implements OnInit {
  // ── Source: divine-pride.net URL/ID fetch ────────────────────────────────
  sourceRef = '';
  fetching = false;
  fetchError: string | null = null;

  // ── Source: raw JSON paste / edit buffer ─────────────────────────────────
  jsonText = '';
  parseError: string | null = null;
  parsedItem: ItemModel | null = null;

  // ── Image upload ─────────────────────────────────────────────────────────
  imageFile: File | null = null;
  imagePreview: string | null = null;

  // ── Enchant configuration ────────────────────────────────────────────────
  enableEnchant = false;
  enchantTemplate: string | null = null;
  enchantTemplateOptions: { label: string; value: string }[] = [];

  saving = false;

  constructor(
    private readonly adminService: AdminService,
    private readonly messageService: MessageService,
    private readonly http: HttpClient,
  ) {}

  ngOnInit() {
    this.enchantTemplateOptions = this.adminService
      .getEnchantTemplateNames()
      .map((name) => ({ label: name, value: name }));
  }

  // ── Divine-Pride fetch ───────────────────────────────────────────────────

  /**
   * Pull item JSON from divine-pride.net's REST endpoint and populate the
   * editable JSON buffer. Also tries to grab the item icon from the static
   * CDN. Both calls are best-effort: on CORS or 404 failures we keep the
   * already-parsed item so the admin can still hand-edit and save.
   */
  async fetchFromDivinePride() {
    this.fetchError = null;
    const id = parseDivinePrideItemRef(this.sourceRef);
    if (id == null) {
      this.fetchError = 'Could not extract a numeric item id from the input.';
      return;
    }

    this.fetching = true;
    try {
      const url =
        `https://www.divine-pride.net/api/database/Item/${id}` +
        `?apiKey=${DIVINE_PRIDE_API_KEY}&server=${DIVINE_PRIDE_SERVER}`;
      const payload = await firstValueFrom(
        this.http.get<DivinePrideItemResponse>(url),
      );

      const mapped = mapDivinePrideItem(payload);
      this.parsedItem = mapped;
      this.jsonText = JSON.stringify(mapped, null, 2);
      this.parseError = null;

      // Best-effort image fetch from divine-pride's static CDN.
      await this.tryFetchImage(id);

      this.messageService.add({
        severity: 'success',
        summary: `Fetched #${id}`,
        detail: mapped.name,
      });
    } catch (err: any) {
      logger.error({ divinePrideFetch: err });
      this.fetchError = err?.message ?? 'Fetch failed (CORS or network).';
    } finally {
      this.fetching = false;
    }
  }

  /** Attempts to download the item image and convert it to an upload File. */
  private async tryFetchImage(id: number) {
    try {
      const imgUrl = divinePrideItemImageUrl(id);
      const blob = await firstValueFrom(
        this.http.get(imgUrl, { responseType: 'blob' }),
      );
      const file = new File([blob], `${id}.png`, { type: blob.type || 'image/png' });
      this.imageFile = file;
      if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);
      this.imagePreview = URL.createObjectURL(file);
    } catch (err) {
      // Image fetch failures are non-fatal — the admin can still upload
      // a file manually. Log for diagnostics.
      logger.error({ divinePrideImage: err });
    }
  }

  // ── JSON editing ─────────────────────────────────────────────────────────

  /** Re-parse on every keystroke so the user gets immediate feedback. */
  onJsonInput() {
    this.parseError = null;
    this.parsedItem = null;
    if (!this.jsonText.trim()) return;

    try {
      const obj = JSON.parse(this.jsonText);
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

  // ── Image upload ─────────────────────────────────────────────────────────

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);
    this.imageFile = file;
    this.imagePreview = file ? URL.createObjectURL(file) : null;
  }

  // ── Script preview helpers ───────────────────────────────────────────────

  /** Pretty-printed `script` block for the preview pane. */
  get scriptPreview(): string {
    if (!this.parsedItem) return '';
    const script = (this.parsedItem.script ?? {}) as Record<string, unknown>;
    return JSON.stringify(script, null, 2);
  }

  get scriptKeyCount(): number {
    if (!this.parsedItem) return 0;
    return Object.keys(this.parsedItem.script ?? {}).length;
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async save() {
    if (!this.parsedItem) {
      this.messageService.add({ severity: 'error', summary: 'Fix JSON errors before saving.' });
      return;
    }
    if (this.enableEnchant && !this.enchantTemplate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Pick an enchant template or turn off enchant support.',
      });
      return;
    }

    this.saving = true;
    try {
      await this.adminService.addItem(this.parsedItem, this.imageFile, {
        enchantTemplate: this.enableEnchant ? this.enchantTemplate : null,
      });
      this.messageService.add({
        severity: 'success',
        summary: `Saved item ${this.parsedItem.id}`,
        detail: this.parsedItem.name,
      });
      this.resetForm();
    } catch (err: any) {
      logger.error({ saveItem: err });
      this.messageService.add({ severity: 'error', summary: 'Save failed', detail: err?.message });
    } finally {
      this.saving = false;
    }
  }

  private resetForm() {
    this.sourceRef = '';
    this.jsonText = '';
    this.parsedItem = null;
    this.parseError = null;
    this.fetchError = null;
    if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);
    this.imageFile = null;
    this.imagePreview = null;
    this.enableEnchant = false;
    this.enchantTemplate = null;
  }
}
