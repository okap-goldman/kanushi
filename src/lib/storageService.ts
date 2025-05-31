import { supabase } from './supabase';

interface UploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  size?: number;
  contentType?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage (fallback for B2)
 * @param file - The file to upload
 * @param path - Storage bucket path
 * @returns Promise with upload result
 */
export async function uploadToSupabaseStorage(file: File, path: string = 'posts'): Promise<UploadResponse> {
  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be authenticated to upload files');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || '';
    const fileName = `${timestamp}-${randomString}.${extension}`;

    // Check if bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === path);
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(path, {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
      });
      
      if (createError) {
        console.warn('Could not create bucket:', createError.message);
        // Continue with upload even if bucket creation fails
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(path)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(path)
      .getPublicUrl(fileName);

    return {
      success: true,
      fileName: data.path,
      url: publicUrl,
      size: file.size,
      contentType: file.type,
    };
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param path - The file path in storage
 * @param bucket - The storage bucket name
 * @returns Promise with deletion result
 */
export async function deleteFromSupabaseStorage(path: string, bucket: string = 'posts'): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting from Supabase Storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}