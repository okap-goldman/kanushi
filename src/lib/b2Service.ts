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
 * Upload a file to Backblaze B2 storage via Supabase Edge Function
 * @param file - The file to upload
 * @param path - Optional path prefix for the file (defaults to "uploads")
 * @returns Promise with upload result
 */
export async function uploadToB2(file: File, path?: string): Promise<UploadResponse> {
  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be authenticated to upload files');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    if (path) {
      formData.append('path', path);
    }

    // Get the Supabase URL from the client
    const supabaseUrl = (supabase as any).supabaseUrl;

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/upload-to-b2`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Error uploading to B2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload multiple files to B2 in parallel
 * @param files - Array of files to upload
 * @param path - Optional path prefix for the files
 * @returns Promise with array of upload results
 */
export async function uploadMultipleToB2(files: File[], path?: string): Promise<UploadResponse[]> {
  const uploadPromises = files.map((file) => uploadToB2(file, path));
  return Promise.all(uploadPromises);
}

/**
 * Get file types allowed for upload based on path
 * @param path - The upload path
 * @returns Object with accept string and max file size
 */
export function getUploadConstraints(path: string): { accept: string; maxSize: number } {
  const constraints: Record<string, { accept: string; maxSize: number }> = {
    avatars: {
      accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    posts: {
      accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/quicktime',
      maxSize: 100 * 1024 * 1024, // 100MB
    },
    stories: {
      accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4',
      maxSize: 50 * 1024 * 1024, // 50MB
    },
    products: {
      accept: 'image/jpeg,image/jpg,image/png,image/webp',
      maxSize: 10 * 1024 * 1024, // 10MB
    },
    messages: {
      accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,application/pdf',
      maxSize: 25 * 1024 * 1024, // 25MB
    },
    default: {
      accept: '*',
      maxSize: 50 * 1024 * 1024, // 50MB
    },
  };

  return constraints[path] || constraints.default;
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @param path - The upload path for constraint checking
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateFile(file: File, path: string): { isValid: boolean; error?: string } {
  const constraints = getUploadConstraints(path);

  // Check file size
  if (file.size > constraints.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${constraints.maxSize / 1024 / 1024}MB`,
    };
  }

  // Check file type if constraints are specified
  if (constraints.accept !== '*') {
    const allowedTypes = constraints.accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${constraints.accept}`,
      };
    }
  }

  return { isValid: true };
}
