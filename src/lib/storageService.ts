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

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(path)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw error;
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