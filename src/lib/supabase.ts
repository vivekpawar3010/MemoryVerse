import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string> }).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file (photo or video) to Supabase Storage bucket ('media').
 * If Supabase bucket is not configured, gracefully falls back to Data URL / Blob URL for instant preview.
 */
export async function uploadMediaToSupabaseBucket(
  file: File,
  bucketName = 'media'
): Promise<string> {
  try {
    if (
      supabaseUrl !== 'https://placeholder.supabase.co' &&
      supabaseAnonKey !== 'placeholder-key'
    ) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('Supabase storage upload returned error, using object URL fallback:', error.message);
      } else if (data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }
  } catch (err) {
    console.warn('Supabase storage error:', err);
  }

  // Local Data URL fallback for instant preview when offline or before bucket creation
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}
