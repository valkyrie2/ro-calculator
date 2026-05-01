import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, from, map, shareReplay } from 'rxjs';
import { EnchantTable, getEnchants, registerEnchants } from 'src/app/constants/enchant_item/_enchant_table';
import { ItemModel } from 'src/app/models/item.model';
import { MonsterModel } from 'src/app/models/monster.model';
import { logger } from './logger.service';
import { SupabaseClientService } from './supabase-client.service';

export interface CustomItemRow {
  id: number;
  data: ItemModel;
  image_path: string | null;
  enchant_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomMonsterRow {
  id: number;
  data: MonsterModel;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

const ITEM_BUCKET = 'custom-item-images';
const MONSTER_BUCKET = 'custom-monster-images';

/**
 * CRUD for admin-managed custom items + custom monsters.
 *
 * Reads are public (RLS allows select for everyone) so the calculator can
 * call `loadCustomItems()` / `loadCustomMonsters()` on boot to merge the
 * cloud data with the static JSON shipped in assets/.
 *
 * Writes (insert / image upload) are guarded by the `is_admin()` Postgres
 * helper used in the table & storage policies — non-admin clients will
 * receive an RLS error if they try.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  /** Cached custom item map keyed by id. Refreshed by `loadCustomItems()`. */
  private readonly customItems$ = new ReplaySubject<Record<number, ItemModel>>(1);
  private readonly customMonsters$ = new ReplaySubject<Record<number, MonsterModel>>(1);

  /** Lazily fetched on first access. */
  private items$?: Observable<Record<number, ItemModel>>;
  private monsters$?: Observable<Record<number, MonsterModel>>;

  constructor(private readonly supabaseClient: SupabaseClientService) {}

  private get client() {
    return this.supabaseClient.client;
  }

  /**
   * The list of existing enchant template names available for admins to
   * copy onto a new custom item. Sorted alphabetically for the dropdown.
   */
  getEnchantTemplateNames(): string[] {
    return EnchantTable.map((e) => e.name).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Returns a hot, cached observable of every custom item keyed by id.
   * Subsequent subscribers replay the last fetched snapshot. Call
   * `refreshItems()` after a successful insert to invalidate the cache.
   */
  getCustomItems(): Observable<Record<number, ItemModel>> {
    if (!this.items$) {
      this.items$ = from(this.fetchCustomItems()).pipe(shareReplay(1));
    }
    return this.items$;
  }

  getCustomMonsters(): Observable<Record<number, MonsterModel>> {
    if (!this.monsters$) {
      this.monsters$ = from(this.fetchCustomMonsters()).pipe(shareReplay(1));
    }
    return this.monsters$;
  }

  /** Force re-fetch on next subscribe. */
  refreshItems() {
    this.items$ = undefined;
  }
  refreshMonsters() {
    this.monsters$ = undefined;
  }

  // ---- Items -------------------------------------------------------------

  async addItem(
    item: ItemModel,
    image: File | null,
    options?: { enchantTemplate?: string | null },
  ): Promise<CustomItemRow> {
    if (!item || typeof item.id !== 'number') {
      throw new Error('Item JSON must contain a numeric "id" field.');
    }

    let imagePath: string | null = null;
    if (image) {
      imagePath = await this.uploadImage(ITEM_BUCKET, item.id, image);
    }

    const row = {
      id: item.id,
      data: item as any,
      image_path: imagePath,
      enchant_template: options?.enchantTemplate ?? null,
    };

    const { data, error } = await this.client
      .from('custom_items')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      logger.error({ addItemError: error });
      throw new Error(error.message);
    }

    // Register the enchant pools immediately so the calculator UI sees
    // them on the next equipment-pick without waiting for a refetch.
    if (options?.enchantTemplate) {
      const enchants = getEnchants(options.enchantTemplate);
      if (enchants) registerEnchants(item.aegisName, enchants);
    }

    this.refreshItems();
    return data as CustomItemRow;
  }

  async deleteItem(id: number): Promise<void> {
    const { error } = await this.client.from('custom_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
    this.refreshItems();
  }

  // ---- Monsters ----------------------------------------------------------

  async addMonster(monster: MonsterModel, image: File | null): Promise<CustomMonsterRow> {
    if (!monster || typeof monster.id !== 'number') {
      throw new Error('Monster must contain a numeric "id" field.');
    }

    let imagePath: string | null = null;
    if (image) {
      imagePath = await this.uploadImage(MONSTER_BUCKET, monster.id, image);
    }

    const row = {
      id: monster.id,
      data: monster as any,
      image_path: imagePath,
    };

    const { data, error } = await this.client
      .from('custom_monsters')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      logger.error({ addMonsterError: error });
      throw new Error(error.message);
    }

    this.refreshMonsters();
    return data as CustomMonsterRow;
  }

  async deleteMonster(id: number): Promise<void> {
    const { error } = await this.client.from('custom_monsters').delete().eq('id', id);
    if (error) throw new Error(error.message);
    this.refreshMonsters();
  }

  // ---- Helpers -----------------------------------------------------------

  /** Build the public URL for an image stored in one of the buckets. */
  getPublicImageUrl(bucket: 'item' | 'monster', path: string | null | undefined): string | null {
    if (!path) return null;
    const id = bucket === 'item' ? ITEM_BUCKET : MONSTER_BUCKET;
    const { data } = this.client.storage.from(id).getPublicUrl(path);
    return data.publicUrl ?? null;
  }

  private async uploadImage(bucket: string, id: number, file: File): Promise<string> {
    // Derive extension from filename or default to .png so the public URL
    // serves with a sensible content type.
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${id}.${ext}`;

    const { error } = await this.client.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type || `image/${ext}`,
    });
    if (error) {
      logger.error({ uploadImageError: error });
      throw new Error(error.message);
    }
    return path;
  }

  private async fetchCustomItems(): Promise<Record<number, ItemModel>> {
    const { data, error } = await this.client
      .from('custom_items')
      .select('id, data, image_path, enchant_template');

    if (error) {
      logger.error({ fetchCustomItemsError: error });
      return {};
    }

    const out: Record<number, ItemModel> = {};
    for (const row of (data ?? []) as CustomItemRow[]) {
      const item = { ...(row.data as any) } as ItemModel;
      const url = this.getPublicImageUrl('item', row.image_path);
      if (url) (item as any).customImageUrl = url;
      // Plug this item into the enchant lookup using the chosen template.
      // If the template doesn't exist (was removed?), the call is a no-op.
      if (row.enchant_template && item.aegisName) {
        const enchants = getEnchants(row.enchant_template);
        if (enchants) registerEnchants(item.aegisName, enchants);
      }
      out[row.id] = item;
    }
    return out;
  }

  private async fetchCustomMonsters(): Promise<Record<number, MonsterModel>> {
    const { data, error } = await this.client
      .from('custom_monsters')
      .select('id, data, image_path');

    if (error) {
      logger.error({ fetchCustomMonstersError: error });
      return {};
    }

    const out: Record<number, MonsterModel> = {};
    for (const row of (data ?? []) as CustomMonsterRow[]) {
      const monster = { ...(row.data as any) } as MonsterModel;
      const url = this.getPublicImageUrl('monster', row.image_path);
      if (url) (monster as any).customImageUrl = url;
      out[row.id] = monster;
    }
    return out;
  }
}
