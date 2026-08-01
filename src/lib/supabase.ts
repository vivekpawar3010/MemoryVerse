import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

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
    let fileToUpload = file;
    // Compress image if it's an image
    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 0.5, // Compress to ~500KB max
        maxWidthOrHeight: 1280, // Downscale to 1280px max dimension
        useWebWorker: true,
        fileType: 'image/webp' // Convert to WebP client-side if possible
      };
      try {
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.warn('Image compression failed, uploading original', error);
      }
    }

    if (
      supabaseUrl !== 'https://placeholder.supabase.co' &&
      supabaseAnonKey !== 'placeholder-key'
    ) {
      const actualExt = fileToUpload.name.split('.').pop() || file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${actualExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('Supabase storage upload returned error:', error.message);
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      if (data) {
        const transformOptions = file.type.startsWith('image/') 
          ? { transform: { format: 'webp', quality: 80 } as any } 
          : undefined;

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath, transformOptions);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }
  } catch (err: any) {
    console.warn('Supabase storage error:', err);
    if (supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key') {
      throw err;
    }
  }

  // Fallback to lightweight Object URL for local/offline preview (never huge base64 strings)
  return URL.createObjectURL(fileToUpload);
}
