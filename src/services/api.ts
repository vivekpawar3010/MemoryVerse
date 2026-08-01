import { supabase } from '../lib/supabase';
import {
  DashboardSummary,
  Group,
  VisitorGroupAccess,
  PhotoItem,
  VideoItem,
  QuoteItem,
  FinalMessageItem,
} from '../types';

// ---------------------------------------------------------------------------
// Helper: map a raw Supabase memory_groups row → Group interface
// ---------------------------------------------------------------------------
function rowToGroup(row: Record<string, unknown>): Group {
  return {
    id: row.id as string,
    memoryId: row.memory_id as string,
    groupName: row.group_name as string,
    password: undefined, // never expose hash to frontend
    status: (row.status as 'ACTIVE' | 'ARCHIVED') ?? 'ACTIVE',
    theme: (row.theme as string) ?? 'theme1',
    coverImage: (row.cover_image as string) ?? undefined,
    audioUrl: (row.audio_url as string) ?? undefined,
    ambientAudio: (row.ambient_audio as string) ?? undefined,
    endingAudio: (row.ending_audio as string) ?? undefined,
    introQuote: (row.intro_quote as string) ?? undefined,
    themeSettings: row.theme_settings ?? undefined,
    allowDownload: (row.allow_download as boolean) ?? false,
    allowShare: (row.allow_share as boolean) ?? false,
    showWatermark: (row.show_watermark as boolean) ?? true,
    allowAudioChange: (row.allow_audio_change as boolean) ?? true,
    createdBy: 'admin@memoryverse.com',
    members: [],
    memberCount: 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    photoCount: 0,
    videoCount: 0,
    quoteCount: 0,
    hasFinalMessage: false,
  };
}

// ---------------------------------------------------------------------------
// Visitor name display-name extractor (kept from original)
// ---------------------------------------------------------------------------
export const extractDisplayName = (raw: string): string => {
  if (!raw || !raw.trim()) return 'Friend';
  let cleaned = raw.trim();

  const phrases = [
    /friend\s+of\s+vivek/gi,
    /vivek[''']?s?\s+friends?/gi,
    /vivek\s+friend/gi,
  ];

  for (const p of phrases) {
    cleaned = cleaned.replace(p, '');
  }

  cleaned = cleaned.replace(/^[\s,.\-–_]+|[\s,.\-–_]+$/g, '').trim();

  if (cleaned.length > 0) {
    return cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Friend';
};

// ---------------------------------------------------------------------------
// Visitor group password check
// Groups created via admin panel store password as plain text.
// Seeded groups use a bcrypt hash — verified by matching against known hashes
// stored server-side only. For production, move this to a Supabase Edge Function.
// ---------------------------------------------------------------------------
async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // For groups created via the admin panel, password is stored as plain text
  if (plain === hash) return true;
  // Reject bcrypt hashes — can't verify client-side safely
  if (hash.startsWith('$2')) return false;
  return false;
}

// ---------------------------------------------------------------------------
// API Service (Supabase-backed)
// ---------------------------------------------------------------------------
export const apiService = {
  // -------------------------------------------------------------------------
  // Visitor: check eligibility (name-based lookup against members table)
  // -------------------------------------------------------------------------
  checkVisitorEligibility: async (
    name: string
  ): Promise<{ isEligible: boolean; matchedGroup?: Group; matchedName?: string; reason?: string }> => {
    const raw = name.trim();
    if (!raw || raw.length < 2) {
      return { isEligible: false, reason: 'Please enter your name.' };
    }

    const clean = raw.toLowerCase().replace(/['"']/g, '');

    // Special case: vivek's friend
    const isVivekFriend =
      clean.includes('viveks friend') ||
      clean.includes('vivek friend') ||
      clean.includes('friend of vivek') ||
      (clean.includes('vivek') && clean.includes('friend'));

    if (isVivekFriend) {
      const { data: groups } = await supabase
        .from('memory_groups')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: true })
        .limit(1);

      const defaultGroup = groups && groups.length > 0 ? rowToGroup(groups[0]) : null;
      if (!defaultGroup) return { isEligible: false, reason: 'No active groups found.' };

      return {
        isEligible: true,
        matchedGroup: defaultGroup,
        matchedName: "Vivek's Friend",
        reason: "Matched as Vivek's Friend!",
      };
    }

    // Check members table
    const { data: memberRows } = await supabase
      .from('members')
      .select('name, group_id, memory_groups(*)')
      .ilike('name', `%${raw}%`)
      .limit(5);

    if (memberRows && memberRows.length > 0) {
      const match = memberRows[0];
      const grpRaw = Array.isArray(match.memory_groups)
        ? match.memory_groups[0]
        : match.memory_groups;
      if (grpRaw) {
        return {
          isEligible: true,
          matchedGroup: rowToGroup(grpRaw as Record<string, unknown>),
          matchedName: match.name as string,
          reason: `Verified member of group "${(grpRaw as Record<string, unknown>).group_name}"`,
        };
      }
    }

    return {
      isEligible: false,
      reason: `Name "${raw}" is not found in the group database.`,
    };
  },

  // -------------------------------------------------------------------------
  // Visitor: unlock a group by Memory ID + password
  // -------------------------------------------------------------------------
  verifyVisitorMemoryAccess: async (
    groupNameOrId: string,
    password: string
  ): Promise<VisitorGroupAccess> => {
    const query = groupNameOrId.trim();

    // Fetch group by memory_id or group_name
    const { data: groups, error } = await supabase
      .from('memory_groups')
      .select('*')
      .or(`memory_id.ilike.${query},group_name.ilike.${query}`)
      .limit(1);

    if (error || !groups || groups.length === 0) {
      throw new Error('Group Name or Memory ID not found. Please verify your group details.');
    }

    const grpRow = groups[0];
    const passwordMatch = await verifyPassword(password, grpRow.password_hash as string);
    if (!passwordMatch) {
      throw new Error('Incorrect group password. Please try again.');
    }

    return apiService.fetchGroupMediaAndAccess(grpRow);
  },

  setGroupAsDefault: async (groupId: string): Promise<void> => {
    const { data: groups, error: fetchError } = await supabase.from('memory_groups').select('id, theme_settings');
    if (fetchError || !groups) throw new Error(fetchError?.message ?? 'Failed to fetch groups');

    for (const group of groups) {
      const settings = group.theme_settings || {};
      if (group.id === groupId) {
        settings.isDefault = true;
      } else {
        if (settings.isDefault) {
          settings.isDefault = false;
        } else {
          continue; 
        }
      }
      await supabase.from('memory_groups').update({ theme_settings: settings }).eq('id', group.id);
    }
  },

  // -------------------------------------------------------------------------
  // Get all groups for dashboard
  // -------------------------------------------------------------------------
  getDefaultForPublicJourney: async (): Promise<VisitorGroupAccess> => {
    let { data, error } = await supabase
      .from('memory_groups')
      .select('*')
      .eq('memory_id', 'GLOBAL_FOR_ALL')
      .limit(1);

    if (error) {
      console.error('[getDefaultForPublicJourney] Supabase error:', error);
    }

    if (!data || data.length === 0) {
      const forAllId = await apiService.ensureForAllGroup();
      const res = await supabase.from('memory_groups').select('*').eq('id', forAllId).single();
      if (res.data) {
        return apiService.fetchGroupMediaAndAccess(res.data);
      }
      throw new Error('Failed to create or load public journey group.');
    }

    return apiService.fetchGroupMediaAndAccess(data[0]);
  },

  // -------------------------------------------------------------------------
  // Ensure "For All" Group Exists
  // -------------------------------------------------------------------------
  ensureForAllGroup: async (): Promise<string> => {
    const { data } = await supabase
      .from('memory_groups')
      .select('id')
      .eq('memory_id', 'GLOBAL_FOR_ALL')
      .limit(1);

    if (data && data.length > 0) {
      return data[0].id;
    }

    const { data: newGroup, error } = await supabase
      .from('memory_groups')
      .insert({
        group_name: 'For All (Global)',
        memory_id: 'GLOBAL_FOR_ALL',
        password_hash: 'NO_PASSWORD',
        theme_settings: { isDefault: true },
        theme: 'CinematicSpace',
        status: 'ACTIVE'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[ensureForAllGroup] Supabase insert error:', error);
      // If the insert failed due to a race condition (duplicate memory_id), fetch the existing group
      if (
        error.code === '23505' ||
        (error.message && error.message.toLowerCase().includes('duplicate'))
      ) {
        const { data: existing } = await supabase
          .from('memory_groups')
          .select('id')
          .eq('memory_id', 'GLOBAL_FOR_ALL')
          .limit(1);
        if (existing && existing.length > 0) {
          return existing[0].id;
        }
      }
      // RLS or other DB error — surface the real message
      throw new Error(`Failed to create For All group: ${error.message} (code: ${error.code})`);
    }
    return newGroup.id;
  },

  // -------------------------------------------------------------------------
  // Log Visitor Access
  // -------------------------------------------------------------------------
  logVisitorAccess: async (visitorName: string, groupId: string): Promise<void> => {
    try {
      await supabase.from('visitor_logs').insert({
        visitor_name: visitorName,
        group_id: groupId,
      });
    } catch (e) {
      console.error('Failed to log visitor access', e);
    }
  },

  // Helper to fetch media for a group and return VisitorGroupAccess
  fetchGroupMediaAndAccess: async (grpRow: any): Promise<VisitorGroupAccess> => {
    const groupId = grpRow.id as string;
    // This is now inside fetchGroupMediaAndAccess
    const [photosRes, videosRes, quotesRes, finalMsgRes] = await Promise.all([
      supabase
        .from('photos')
        .select('*')
        .eq('group_id', groupId)
        .order('display_order', { ascending: true }),
      supabase
        .from('videos')
        .select('*')
        .eq('group_id', groupId)
        .order('display_order', { ascending: true }),
      supabase
        .from('quotes')
        .select('*')
        .eq('group_id', groupId)
        .order('display_order', { ascending: true }),
      supabase
        .from('final_messages')
        .select('*')
        .eq('group_id', groupId)
        .limit(1),
    ]);

    // Helper to map 3D fields
    const map3DFields = (r: any) => ({
      positionX: r.position_x ?? 0,
      positionY: r.position_y ?? 0,
      positionZ: r.position_z ?? 0,
      rotationX: r.rotation_x ?? 0,
      rotationY: r.rotation_y ?? 0,
      rotationZ: r.rotation_z ?? 0,
      scale: r.scale ?? 1,
      frameStyle: r.frame_style ?? 'glass',
      glowStrength: r.glow_strength ?? 1,
      animationType: r.animation_type ?? 'float',
      coverPhotoUrl: r.theme_settings?.coverPhotoUrl ?? undefined,
    });

    const photos: PhotoItem[] = (photosRes.data ?? []).map((r) => ({
      id: r.id,
      groupId: r.group_id,
      imageUrl: r.image_url,
      caption: r.caption ?? '',
      displayOrder: r.display_order ?? 0,
      animationStyle: r.animation_style ?? undefined,
      date: r.date ?? undefined,
      location: r.location ?? undefined,
      ...map3DFields(r),
      createdAt: r.created_at,
    }));

    const videos: VideoItem[] = (videosRes.data ?? []).map((r) => ({
      id: r.id,
      groupId: r.group_id,
      videoUrl: r.video_url,
      title: r.title ?? undefined,
      displayOrder: r.display_order ?? 0,
      ...map3DFields(r),
      createdAt: r.created_at,
    }));

    const quotes: QuoteItem[] = (quotesRes.data ?? []).map((r) => ({
      id: r.id,
      groupId: r.group_id,
      quote: r.quote,
      author: r.author ?? '',
      displayOrder: r.display_order ?? 0,
      themeColor: r.theme_color ?? undefined,
      ...map3DFields(r),
      createdAt: r.created_at,
    }));

    const fmRow = finalMsgRes.data && finalMsgRes.data.length > 0 ? finalMsgRes.data[0] : null;
    const finalMessage: FinalMessageItem | undefined = fmRow
      ? { id: fmRow.id, groupId: fmRow.group_id, title: fmRow.title, message: fmRow.message }
      : undefined;

    return {
      groupId,
      groupName: grpRow.group_name as string,
      memoryId: grpRow.memory_id as string,
      theme: (grpRow.theme as string) ?? 'theme1',
      audioUrl: (grpRow.audio_url as string) ?? undefined, // legacy
      ambientAudio: (grpRow.ambient_audio as string) ?? undefined,
      endingAudio: (grpRow.ending_audio as string) ?? undefined,
      introQuote: (grpRow.intro_quote as string) ?? undefined,
      themeSettings: grpRow.theme_settings ?? undefined,
      allowDownload: (grpRow.allow_download as boolean) ?? false,
      allowShare: (grpRow.allow_share as boolean) ?? false,
      showWatermark: (grpRow.show_watermark as boolean) ?? true,
      accessGranted: true,
      unlockedAt: new Date().toISOString(),
      photos,
      videos,
      quotes,
      finalMessage,
    };
  },

  // -------------------------------------------------------------------------
  // Admin: Get all details for a group (no password check)
  // -------------------------------------------------------------------------
  getGroupDetails: async (groupId: string): Promise<Omit<VisitorGroupAccess, 'accessGranted' | 'unlockedAt'>> => {
    // 1. Get Group Core
    const { data: groups, error } = await supabase
      .from('memory_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error || !groups) throw new Error('Group not found');

    const [photosRes, videosRes, quotesRes, finalMsgRes] = await Promise.all([
      supabase.from('photos').select('*').eq('group_id', groupId).order('display_order', { ascending: true }),
      supabase.from('videos').select('*').eq('group_id', groupId).order('display_order', { ascending: true }),
      supabase.from('quotes').select('*').eq('group_id', groupId).order('display_order', { ascending: true }),
      supabase.from('final_messages').select('*').eq('group_id', groupId).limit(1),
    ]);

    const mapBaseProps = (r: any) => ({
      id: r.id,
      groupId: r.group_id,
      displayOrder: r.display_order ?? 0,
      positionX: r.position_x ?? 0,
      positionY: r.position_y ?? 0,
      positionZ: r.position_z ?? 0,
      rotationX: r.rotation_x ?? 0,
      rotationY: r.rotation_y ?? 0,
      rotationZ: r.rotation_z ?? 0,
      scale: r.scale ?? 1,
      frameStyle: r.frame_style ?? 'glass',
      glowStrength: r.glow_strength ?? 1,
      animationType: r.animation_type ?? 'float',
      layerIndex: r.layer_index ?? 0,
      isVisible: r.is_visible ?? true,
      animationSettings: r.animation_settings ?? {},
      audioSettings: r.audio_settings ?? {},
      themeSettings: r.theme_settings ?? {},
      coverPhotoUrl: r.theme_settings?.coverPhotoUrl ?? undefined,
      createdAt: r.created_at,
    });

    const photos: PhotoItem[] = (photosRes.data ?? []).map((r) => ({
      ...mapBaseProps(r),
      imageUrl: r.image_url,
      caption: r.caption ?? '',
    }));

    const videos: VideoItem[] = (videosRes.data ?? []).map((r) => ({
      ...mapBaseProps(r),
      videoUrl: r.video_url,
      title: r.title ?? undefined,
    }));

    const quotes: QuoteItem[] = (quotesRes.data ?? []).map((r) => ({
      ...mapBaseProps(r),
      quote: r.quote,
      author: r.author ?? '',
    }));

    const fmRow = finalMsgRes.data && finalMsgRes.data.length > 0 ? finalMsgRes.data[0] : null;
    const finalMessage: FinalMessageItem | undefined = fmRow
      ? { id: fmRow.id, groupId: fmRow.group_id, title: fmRow.title, message: fmRow.message }
      : undefined;

    return {
      groupId,
      groupName: groups.group_name as string,
      memoryId: groups.memory_id as string,
      theme: (groups.theme as string) ?? 'theme1',
      audioUrl: (groups.audio_url as string) ?? undefined, // legacy
      ambientAudio: (groups.ambient_audio as string) ?? undefined,
      endingAudio: (groups.ending_audio as string) ?? undefined,
      introQuote: (groups.intro_quote as string) ?? undefined,
      themeSettings: groups.theme_settings ?? undefined,
      allowDownload: (groups.allow_download as boolean) ?? false,
      allowShare: (groups.allow_share as boolean) ?? false,
      showWatermark: (groups.show_watermark as boolean) ?? true,
      photos,
      videos,
      quotes,
      finalMessage,
    };
  },

  // -------------------------------------------------------------------------
  // Admin Dashboard Summary
  // -------------------------------------------------------------------------
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const [groupsRes, photosRes, videosRes, quotesRes] = await Promise.all([
      supabase.from('memory_groups').select('id', { count: 'exact', head: true }),
      supabase.from('photos').select('id', { count: 'exact', head: true }),
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      supabase.from('quotes').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalGroups: groupsRes.count ?? 0,
      totalPhotos: photosRes.count ?? 0,
      totalVideos: videosRes.count ?? 0,
      totalQuotes: quotesRes.count ?? 0,
      activeSessions: 0,
    };
  },

  // -------------------------------------------------------------------------
  // Get All Groups (with counts from related tables)
  // -------------------------------------------------------------------------
  getGroups: async (): Promise<Group[]> => {
    const { data, error } = await supabase
      .from('memory_groups')
      .select(`
        *,
        members(id),
        photos(id),
        videos(id),
        quotes(id),
        final_messages(id, title, message)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => {
      const fmArr = row.final_messages as { id: string; title: string; message: string }[] | null;
      const fm = fmArr && fmArr.length > 0 ? fmArr[0] : null;
      return {
        id: row.id as string,
        memoryId: row.memory_id as string,
        groupName: row.group_name as string,
        status: (row.status as 'ACTIVE' | 'ARCHIVED') ?? 'ACTIVE',
        theme: (row.theme as string) ?? 'theme1',
        coverImage: (row.cover_image as string) ?? undefined,
        audioUrl: (row.audio_url as string) ?? undefined, // legacy
        ambientAudio: (row.ambient_audio as string) ?? undefined,
        endingAudio: (row.ending_audio as string) ?? undefined,
        introQuote: (row.intro_quote as string) ?? undefined,
        themeSettings: row.theme_settings as Record<string, any> ?? undefined,
        allowDownload: (row.allow_download as boolean) ?? false,
        allowShare: (row.allow_share as boolean) ?? false,
        showWatermark: (row.show_watermark as boolean) ?? true,
        createdBy: 'admin@memoryverse.com',
        members: (row.members as { id: string }[])?.map(() => '') ?? [],
        memberCount: (row.members as unknown[])?.length ?? 0,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        photoCount: (row.photos as unknown[])?.length ?? 0,
        videoCount: (row.videos as unknown[])?.length ?? 0,
        quoteCount: (row.quotes as unknown[])?.length ?? 0,
        hasFinalMessage: !!fm,
        finalMessageTitle: fm?.title ?? '',
        finalMessageText: fm?.message ?? '',
      };
    }).filter(g => !g.themeSettings?.isDefault);
  },

  // -------------------------------------------------------------------------
  // Create Group
  // -------------------------------------------------------------------------
  createGroup: async (data: {
    groupName: string;
    password: string;
    theme?: string;
    coverImage?: string;
    audioUrl?: string;
    ambientAudio?: string;
    endingAudio?: string;
    introQuote?: string;
    themeSettings?: any;
    allowDownload?: boolean;
    allowShare?: boolean;
    showWatermark?: boolean;
    allowAudioChange?: boolean;
    members?: string[];
    memberCount?: number;
  }): Promise<Group> => {
    // Check uniqueness
    const { data: existing } = await supabase
      .from('memory_groups')
      .select('id')
      .ilike('group_name', data.groupName.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error('A group with this name already exists.');
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const memoryId = `MV-${suffix}`;

    const { data: inserted, error } = await supabase
      .from('memory_groups')
      .insert({
        memory_id: memoryId,
        group_name: data.groupName.trim(),
        password_hash: data.password, // plain stored for now; swap for bcrypt via Edge Function in prod
        theme: data.theme || 'theme1',
        cover_image: data.coverImage ?? null,
        audio_url: data.audioUrl ?? null,
        ambient_audio: data.ambientAudio ?? null,
        ending_audio: data.endingAudio ?? null,
        intro_quote: data.introQuote ?? null,
        theme_settings: data.themeSettings ?? {},
        allow_download: data.allowDownload ?? false,
        allow_share: data.allowShare ?? false,
        show_watermark: data.showWatermark ?? true,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error || !inserted) throw new Error(error?.message ?? 'Failed to create group.');

    // Insert members if provided
    if (data.members && data.members.length > 0) {
      await supabase.from('members').insert(
        data.members.map((name) => ({ group_id: inserted.id, name }))
      );
    }

    return {
      id: inserted.id as string,
      memoryId: inserted.memory_id as string,
      groupName: inserted.group_name as string,
      status: 'ACTIVE',
      theme: (inserted.theme as string) || 'theme1',
      coverImage: (inserted.cover_image as string) ?? undefined,
      audioUrl: (inserted.audio_url as string) ?? undefined,
      createdBy: 'admin@memoryverse.com',
      members: data.members ?? [],
      memberCount: data.members?.length ?? data.memberCount ?? 0,
      createdAt: inserted.created_at as string,
      updatedAt: inserted.updated_at as string,
      photoCount: 0,
      videoCount: 0,
      quoteCount: 0,
      hasFinalMessage: false,
    };
  },

  // -------------------------------------------------------------------------
  // Update Group
  // -------------------------------------------------------------------------
  updateGroup: async (
    id: string,
    data: { 
      groupName?: string; 
      password?: string; 
      theme?: string; 
      coverImage?: string; 
      audioUrl?: string; 
      ambientAudio?: string;
      endingAudio?: string;
      introQuote?: string;
      themeSettings?: any;
      allowDownload?: boolean;
      allowShare?: boolean;
      showWatermark?: boolean;
    allowAudioChange?: boolean;
      status?: 'ACTIVE' | 'ARCHIVED' 
    }
  ): Promise<Group> => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.groupName) updates.group_name = data.groupName.trim();
    if (data.theme) updates.theme = data.theme;
    if (data.coverImage !== undefined) updates.cover_image = data.coverImage;
    if (data.audioUrl !== undefined) updates.audio_url = data.audioUrl;
    if (data.ambientAudio !== undefined) updates.ambient_audio = data.ambientAudio;
    if (data.endingAudio !== undefined) updates.ending_audio = data.endingAudio;
    if (data.introQuote !== undefined) updates.intro_quote = data.introQuote;
    if (data.themeSettings !== undefined) updates.theme_settings = data.themeSettings;
    if (data.allowDownload !== undefined) updates.allow_download = data.allowDownload;
    if (data.allowShare !== undefined) updates.allow_share = data.allowShare;
    if (data.showWatermark !== undefined) updates.show_watermark = data.showWatermark;
    if (data.allowAudioChange !== undefined) updates.allow_audio_change = data.allowAudioChange;
    if (data.status) updates.status = data.status;
    if (data.password) updates.password_hash = data.password;

    const { data: updated, error } = await supabase
      .from('memory_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) throw new Error(error?.message ?? 'Group not found.');

    return rowToGroup(updated as Record<string, unknown>);
  },

  // -------------------------------------------------------------------------
  // Delete Group (CASCADE will remove all related rows)
  // -------------------------------------------------------------------------
  deleteGroup: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('memory_groups').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // -------------------------------------------------------------------------
  // Upload Photo
  // -------------------------------------------------------------------------
  getAllPhotos: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('photos')
      .select('image_url')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    // Return unique URLs
    return Array.from(new Set((data ?? []).map((p) => p.image_url as string)));
  },

  uploadPhoto: async (groupId: string, photoUrl: string, caption: string): Promise<PhotoItem> => {
    const { count } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);

    const displayOrder = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from('photos')
      .insert({ group_id: groupId, image_url: photoUrl, caption, display_order: displayOrder })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to upload photo.');

    return {
      id: data.id,
      groupId: data.group_id,
      imageUrl: data.image_url,
      caption: data.caption ?? '',
      displayOrder: data.display_order ?? 0,
      createdAt: data.created_at,
    };
  },

  updatePhoto: async (photoId: string, caption: string): Promise<void> => {
    const { error } = await supabase.from('photos').update({ caption }).eq('id', photoId);
    if (error) throw new Error(error.message);
  },

  updatePhotoOrder: async (photoId: string, displayOrder: number): Promise<void> => {
    const { error } = await supabase.from('photos').update({ display_order: displayOrder }).eq('id', photoId);
    if (error) throw new Error(error.message);
  },


  deletePhoto: async (photoId: string): Promise<void> => {
    const { error } = await supabase.from('photos').delete().eq('id', photoId);
    if (error) throw new Error(error.message);
  },

  updateMemoryItem3DProps: async (
    table: 'photos' | 'videos' | 'quotes', 
    itemId: string, 
    props: Partial<{
      positionX: number;
      positionY: number;
      positionZ: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
      scale: number;
      frameStyle: string;
      glowStrength: number;
      animationType: string;
      layerIndex: number;
      isVisible: boolean;
      animationSettings: Record<string, any>;
      audioSettings: Record<string, any>;
      themeSettings: Record<string, any>;
      textContent: string;
      titleOrAuthor: string;
      displayOrder: number;
    }>
  ): Promise<void> => {
    const updateData: any = {};
    if (props.positionX !== undefined) updateData.position_x = props.positionX;
    if (props.positionY !== undefined) updateData.position_y = props.positionY;
    if (props.positionZ !== undefined) updateData.position_z = props.positionZ;
    if (props.rotationX !== undefined) updateData.rotation_x = props.rotationX;
    if (props.rotationY !== undefined) updateData.rotation_y = props.rotationY;
    if (props.rotationZ !== undefined) updateData.rotation_z = props.rotationZ;
    if (props.scale !== undefined) updateData.scale = props.scale;
    if (props.frameStyle !== undefined) updateData.frame_style = props.frameStyle;
    if (props.glowStrength !== undefined) updateData.glow_strength = props.glowStrength;
    if (props.animationType !== undefined) updateData.animation_type = props.animationType;
    if (props.layerIndex !== undefined) updateData.layer_index = props.layerIndex;
    if (props.isVisible !== undefined) updateData.is_visible = props.isVisible;
    if (props.animationSettings !== undefined) updateData.animation_settings = props.animationSettings;
    if (props.audioSettings !== undefined) updateData.audio_settings = props.audioSettings;
    if (props.themeSettings !== undefined) updateData.theme_settings = props.themeSettings;
    if (props.displayOrder !== undefined) updateData.display_order = props.displayOrder;

    if (props.textContent !== undefined) {
      if (table === 'photos') updateData.caption = props.textContent;
      if (table === 'quotes') updateData.quote = props.textContent;
    }
    
    if (props.titleOrAuthor !== undefined) {
      if (table === 'videos') updateData.title = props.titleOrAuthor;
      if (table === 'quotes') updateData.author = props.titleOrAuthor;
    }

    if (Object.keys(updateData).length === 0) return;

    const { error } = await supabase.from(table).update(updateData).eq('id', itemId);
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------------------------------
  // Upload Video
  // -------------------------------------------------------------------------
  uploadVideo: async (groupId: string, videoUrl: string, title?: string): Promise<VideoItem> => {
    const { count } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);

    const displayOrder = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from('videos')
      .insert({ group_id: groupId, video_url: videoUrl, display_order: displayOrder })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to upload video.');

    return {
      id: data.id,
      groupId: data.group_id,
      videoUrl: data.video_url,
      title: data.title ?? undefined,
      displayOrder: data.display_order ?? 0,
      createdAt: data.created_at,
    };
  },

  updateVideo: async (videoId: string, title: string): Promise<void> => {
    const { error } = await supabase.from('videos').update({ title }).eq('id', videoId);
    if (error) throw new Error(error.message);
  },

  updateVideoOrder: async (videoId: string, displayOrder: number): Promise<void> => {
    const { error } = await supabase.from('videos').update({ display_order: displayOrder }).eq('id', videoId);
    if (error) throw new Error(error.message);
  },


  deleteVideo: async (videoId: string): Promise<void> => {
    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------------------------------
  // Add Quote
  // -------------------------------------------------------------------------
  addQuote: async (groupId: string, quote: string, author: string): Promise<QuoteItem> => {
    const { count } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);

    const displayOrder = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from('quotes')
      .insert({ group_id: groupId, quote, author, display_order: displayOrder })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to add quote.');

    return {
      id: data.id,
      groupId: data.group_id,
      quote: data.quote,
      author: data.author ?? '',
      displayOrder: data.display_order ?? 0,
      createdAt: data.created_at,
    };
  },

  updateQuote: async (quoteId: string, quote: string, author: string): Promise<void> => {
    const { error } = await supabase.from('quotes').update({ quote, author }).eq('id', quoteId);
    if (error) throw new Error(error.message);
  },

  updateQuoteOrder: async (quoteId: string, displayOrder: number): Promise<void> => {
    const { error } = await supabase.from('quotes').update({ display_order: displayOrder }).eq('id', quoteId);
    if (error) throw new Error(error.message);
  },


  deleteQuote: async (quoteId: string): Promise<void> => {
    const { error } = await supabase.from('quotes').delete().eq('id', quoteId);
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------------------------------
  // Set / Upsert Final Message
  // -------------------------------------------------------------------------
  setFinalMessage: async (groupId: string, title: string, message: string): Promise<FinalMessageItem> => {
    const { data, error } = await supabase
      .from('final_messages')
      .upsert({ group_id: groupId, title, message }, { onConflict: 'group_id' })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to save final message.');

    return { id: data.id, groupId: data.group_id, title: data.title, message: data.message };
  },

  updateFinalMessage: async (groupId: string, title: string, message: string): Promise<FinalMessageItem> => {
    return apiService.setFinalMessage(groupId, title, message);
  },

  // -------------------------------------------------------------------------
  // Clear All Database Data (drops & recreates via truncation)
  // -------------------------------------------------------------------------
  clearAllDatabaseData: async (): Promise<boolean> => {
    // Truncate in reverse FK order; CASCADE handles children but we do it explicitly
    const tables = ['final_messages', 'quotes', 'videos', 'photos', 'members', 'memory_groups'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn(`Could not clear ${table}:`, error.message);
    }
    return true;
  },

  // -------------------------------------------------------------------------
  // Get Visitor Logs (for analytics)
  // -------------------------------------------------------------------------
  getVisitorLogs: async (): Promise<{
    id: string;
    visitorName: string;
    groupName: string;
    groupId: string;
    visitedAt: string;
  }[]> => {
    const { data, error } = await supabase
      .from('visitor_logs')
      .select('id, visitor_name, visited_at, group_id, memory_groups(group_name)')
      .order('visited_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[getVisitorLogs] error:', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      visitorName: row.visitor_name,
      groupId: row.group_id,
      groupName: row.memory_groups?.group_name ?? 'Unknown Group',
      visitedAt: row.visited_at,
    }));
  },
};

