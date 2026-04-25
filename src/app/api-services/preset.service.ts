import { Injectable } from '@angular/core';
import { Observable, defer, from, map } from 'rxjs';
import { PostgrestError } from '@supabase/supabase-js';
import {
  BulkOperationRequest,
  EntirePresetWithTagsModel,
  GetMyEntirePresetsResponse,
  GetMyPresetsResponse,
  LikeTagResponse,
  PresetTagModel,
  PresetWithTagsModel,
  PublishPresetModel,
  PublishPresetsReponse,
  RoPresetModel,
} from './models';
import { AuthService } from './auth.service';
import { SupabaseClientService } from './supabase-client.service';
import { Unauthorized } from '../app-errors';

interface PresetRow {
  id: string;
  user_id: string;
  label: string;
  class_id: number;
  model: any;
  publish_name: string | null;
  publisher_name: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TagSummaryRow {
  id: string;
  preset_id: string;
  publisher_id: string;
  class_id: number;
  tag: string;
  label: string | null;
  created_at: string;
  updated_at: string;
  total_like: number;
  liked: boolean;
}

@Injectable()
export class PresetService {
  constructor(
    private readonly supabaseClient: SupabaseClientService,
    private readonly authService: AuthService,
  ) {}

  private get client() {
    return this.supabaseClient.client;
  }

  // ---- Reads -------------------------------------------------------------

  getPreset(presetId: string): Observable<RoPresetModel> {
    return defer(async () => {
      const { data, error } = await this.client
        .from('ro_presets')
        .select('*')
        .eq('id', presetId)
        .single();
      this.throwIfError(error);
      return rowToPreset(data as PresetRow);
    });
  }

  getMyPresets(): Observable<GetMyPresetsResponse> {
    return defer(async () => {
      const userId = await this.requireUserId();
      const { data: rows, error } = await this.client
        .from('ro_presets')
        .select('id, label, class_id, publish_name, publisher_name, is_published, published_at, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      this.throwIfError(error);

      const list = (rows ?? []) as Omit<PresetRow, 'user_id' | 'model'>[];
      const tagsByPreset = await this.fetchTagsForPresets(list.map((r) => r.id));

      return list.map<PresetWithTagsModel>((r) => ({
        id: r.id,
        label: r.label,
        classId: r.class_id,
        publishName: r.publish_name ?? '',
        isPublished: !!r.is_published,
        publishedAt: r.published_at ?? '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        tags: tagsByPreset[r.id] ?? [],
      }));
    });
  }

  getEntirePresets(): Observable<GetMyEntirePresetsResponse> {
    return defer(async () => {
      const userId = await this.requireUserId();
      const { data: rows, error } = await this.client
        .from('ro_presets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      this.throwIfError(error);

      const list = (rows ?? []) as PresetRow[];
      const tagsByPreset = await this.fetchTagsForPresets(list.map((r) => r.id));

      return list.map<EntirePresetWithTagsModel>((r) => ({
        id: r.id,
        label: r.label,
        model: r.model,
        publishName: r.publish_name ?? '',
        isPublished: !!r.is_published,
        publishedAt: r.published_at ?? '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        tags: tagsByPreset[r.id] ?? [],
      }));
    });
  }

  // ---- Writes ------------------------------------------------------------

  createPreset(preset: Pick<RoPresetModel, 'label' | 'model'>): Observable<RoPresetModel> {
    return defer(async () => {
      const userId = await this.requireUserId();
      const { data, error } = await this.client
        .from('ro_presets')
        .insert({
          user_id: userId,
          label: preset.label,
          class_id: (preset.model as any)?.class ?? 0,
          model: preset.model,
        })
        .select('*')
        .single();
      this.throwIfError(error);
      return rowToPreset(data as PresetRow);
    });
  }

  bulkCreatePresets(bulkPreset: { bulkData: any[] }): Observable<RoPresetModel[]> {
    return defer(async () => {
      const userId = await this.requireUserId();
      const rows = bulkPreset.bulkData.map((p) => ({
        user_id: userId,
        label: p?.label,
        class_id: p?.model?.class ?? 0,
        model: p?.model,
      }));
      if (rows.length === 0) return [];
      const { data, error } = await this.client.from('ro_presets').insert(rows).select('*');
      this.throwIfError(error);
      return (data ?? []).map((r) => rowToPreset(r as PresetRow));
    });
  }

  updatePreset(id: string, preset: Partial<Pick<RoPresetModel, 'label' | 'model'>>): Observable<RoPresetModel> {
    return defer(async () => {
      const patch: Record<string, unknown> = {};
      if (preset.label !== undefined) patch['label'] = preset.label;
      if (preset.model !== undefined) {
        patch['model'] = preset.model;
        patch['class_id'] = (preset.model as any)?.class ?? 0;
      }
      const { data, error } = await this.client
        .from('ro_presets')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      this.throwIfError(error);
      return rowToPreset(data as PresetRow);
    });
  }

  deletePreset(id: string): Observable<RoPresetModel> {
    return defer(async () => {
      const { data, error } = await this.client
        .from('ro_presets')
        .delete()
        .eq('id', id)
        .select('*')
        .single();
      this.throwIfError(error);
      return rowToPreset(data as PresetRow);
    });
  }

  // ---- Sharing -----------------------------------------------------------

  sharePreset(id: string, body: { publishName: string }): Observable<PresetWithTagsModel> {
    return defer(async () => {
      const profile = this.authService.getProfile();
      const { data, error } = await this.client
        .from('ro_presets')
        .update({
          is_published: true,
          publish_name: body.publishName,
          publisher_name: profile?.name ?? '',
          published_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
      this.throwIfError(error);
      const row = data as PresetRow;
      const tags = await this.fetchTagsForPresets([row.id]);
      return presetRowToWithTags(row, tags[row.id] ?? []);
    });
  }

  unsharePreset(id: string): Observable<Omit<RoPresetModel, 'model'>> {
    return defer(async () => {
      const { data, error } = await this.client
        .from('ro_presets')
        .update({
          is_published: false,
          publish_name: null,
          publisher_name: null,
          published_at: null,
        })
        .eq('id', id)
        .select('id, user_id, label, class_id, publish_name, publisher_name, is_published, published_at, created_at, updated_at')
        .single();
      this.throwIfError(error);
      const r = data as Omit<PresetRow, 'model'>;
      return {
        id: r.id,
        userId: r.user_id,
        label: r.label,
        classId: r.class_id,
        publishName: r.publish_name ?? '',
        isPublished: !!r.is_published,
        publishedAt: r.published_at ?? '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  // ---- Tags --------------------------------------------------------------

  addPresetTags(id: string, body: BulkOperationRequest): Observable<PresetWithTagsModel> {
    return defer(async () => {
      const userId = await this.requireUserId();
      const { data: presetRow, error: pErr } = await this.client
        .from('ro_presets')
        .select('id, class_id, label, publish_name, publisher_name, is_published, published_at, created_at, updated_at')
        .eq('id', id)
        .single();
      this.throwIfError(pErr);
      const preset = presetRow as Omit<PresetRow, 'user_id' | 'model'>;

      if (body.deleteTags?.length) {
        const { error: dErr } = await this.client
          .from('preset_tags')
          .delete()
          .eq('preset_id', id)
          .in('tag', body.deleteTags);
        this.throwIfError(dErr);
      }
      if (body.createTags?.length) {
        const rows = body.createTags.map((tag) => ({
          preset_id: id,
          publisher_id: userId,
          class_id: preset.class_id,
          tag,
        }));
        const { error: cErr } = await this.client
          .from('preset_tags')
          .upsert(rows, { onConflict: 'preset_id,tag' });
        this.throwIfError(cErr);
      }

      const tagsByPreset = await this.fetchTagsForPresets([id]);
      return presetRowToWithTags({ ...(preset as any), id } as PresetRow, tagsByPreset[id] ?? []);
    });
  }

  removePresetTag(params: { presetId: string; tagId: string }): Observable<Omit<RoPresetModel, 'model'>> {
    return defer(async () => {
      const { presetId, tagId } = params;
      const { error } = await this.client
        .from('preset_tags')
        .delete()
        .eq('id', tagId)
        .eq('preset_id', presetId);
      this.throwIfError(error);

      const { data, error: pErr } = await this.client
        .from('ro_presets')
        .select('id, user_id, label, class_id, publish_name, publisher_name, is_published, published_at, created_at, updated_at')
        .eq('id', presetId)
        .single();
      this.throwIfError(pErr);
      const r = data as Omit<PresetRow, 'model'>;
      return {
        id: r.id,
        userId: r.user_id,
        label: r.label,
        classId: r.class_id,
        publishName: r.publish_name ?? '',
        isPublished: !!r.is_published,
        publishedAt: r.published_at ?? '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  // ---- Likes -------------------------------------------------------------

  likePresetTags(tagId: string): Observable<LikeTagResponse> {
    return defer(async () => {
      const userId = await this.requireUserId();
      const { error } = await this.client
        .from('preset_tag_likes')
        .upsert({ user_id: userId, tag_id: tagId }, { onConflict: 'user_id,tag_id' });
      this.throwIfError(error);
      return this.fetchLikeResponse(tagId);
    });
  }

  unlikePresetTag(tagId: string): Observable<LikeTagResponse> {
    return defer(async () => {
      const userId = await this.requireUserId();
      const { error } = await this.client
        .from('preset_tag_likes')
        .delete()
        .eq('tag_id', tagId)
        .eq('user_id', userId);
      this.throwIfError(error);
      return this.fetchLikeResponse(tagId);
    });
  }

  // ---- Public browsing ---------------------------------------------------

  getPublishPresets(params: {
    classId: number;
    tagName: string;
    skip: number;
    take: number;
  }): Observable<PublishPresetsReponse> {
    const { classId, tagName, skip, take } = params;
    return from(
      this.client.rpc('get_published_presets', {
        p_class_id: classId,
        p_tag: tagName,
        p_skip: skip || 0,
        p_take: take || 1,
      }),
    ).pipe(
      map(({ data, error }) => {
        this.throwIfError(error);
        const rows = (data ?? []) as Array<{
          tag_id: string;
          preset_id: string;
          tag: string;
          liked: boolean;
          total_like: number;
          created_at: string;
          publish_name: string | null;
          publisher_name: string | null;
          model: any;
          tags: Record<string, number> | null;
          total_count: number;
        }>;

        const items: PublishPresetModel[] = rows.map((r) => ({
          tagId: r.tag_id,
          presetId: r.preset_id,
          publishName: r.publish_name ?? '',
          publisherName: r.publisher_name ?? '',
          model: r.model,
          tags: r.tags ?? {},
          liked: !!r.liked,
          createdAt: r.created_at,
        }));

        return {
          items,
          totalItem: rows.length > 0 ? Number(rows[0].total_count) : 0,
          skip: skip || 0,
          take: take || 1,
        };
      }),
    );
  }

  // ---- Internals ---------------------------------------------------------

  private async requireUserId(): Promise<string> {
    const { data } = await this.client.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) throw new Unauthorized();
    return userId;
  }

  private throwIfError(error: PostgrestError | null | undefined) {
    if (!error) return;
    // PGRST301 / 401 status indicate a missing or invalid JWT.
    const isAuth =
      (error as any)?.status === 401 ||
      error.code === 'PGRST301' ||
      /jwt|auth/i.test(error.message ?? '');
    if (isAuth) throw new Unauthorized();
    throw error;
  }

  private async fetchTagsForPresets(ids: string[]): Promise<Record<string, PresetTagModel[]>> {
    if (!ids.length) return {};
    const { data, error } = await this.client
      .from('preset_tag_summary')
      .select('*')
      .in('preset_id', ids);
    this.throwIfError(error);

    const grouped: Record<string, PresetTagModel[]> = {};
    for (const row of (data ?? []) as TagSummaryRow[]) {
      (grouped[row.preset_id] ||= []).push(tagSummaryRowToModel(row));
    }
    return grouped;
  }

  private async fetchLikeResponse(tagId: string): Promise<LikeTagResponse> {
    const { data, error } = await this.client
      .from('preset_tag_summary')
      .select('id, tag, class_id, preset_id, total_like, liked')
      .eq('id', tagId)
      .single();
    this.throwIfError(error);
    const r = data as Pick<TagSummaryRow, 'id' | 'tag' | 'class_id' | 'preset_id' | 'total_like' | 'liked'>;
    return {
      id: r.id,
      tag: r.tag,
      classId: r.class_id,
      presetId: r.preset_id,
      totalLike: r.total_like,
      liked: !!r.liked,
    };
  }
}

// ---- Row mappers ---------------------------------------------------------

function rowToPreset(row: PresetRow): RoPresetModel {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    model: row.model,
    classId: row.class_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishName: row.publish_name ?? '',
    isPublished: !!row.is_published,
    publishedAt: row.published_at ?? '',
  };
}

function presetRowToWithTags(row: PresetRow, tags: PresetTagModel[]): PresetWithTagsModel {
  return {
    id: row.id,
    label: row.label,
    classId: row.class_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishName: row.publish_name ?? '',
    isPublished: !!row.is_published,
    publishedAt: row.published_at ?? '',
    tags,
  };
}

function tagSummaryRowToModel(row: TagSummaryRow): PresetTagModel {
  return {
    id: row.id,
    label: row.label ?? '',
    classId: row.class_id,
    liked: !!row.liked,
    tag: row.tag,
    totalLike: row.total_like,
    publisherId: row.publisher_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
