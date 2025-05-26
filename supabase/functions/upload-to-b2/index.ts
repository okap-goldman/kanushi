import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { encodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

// Backblaze B2 API endpoints
const B2_API_URL = 'https://api.backblazeb2.com/b2api/v2';
const B2_AUTH_URL = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';

interface B2AuthResponse {
  accountId: string;
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  allowed: {
    bucketId: string;
    bucketName: string;
    capabilities: string[];
    namePrefix: string | null;
  };
}

interface B2UploadUrlResponse {
  bucketId: string;
  uploadUrl: string;
  authorizationToken: string;
}

// Authorize with B2
async function authorizeB2(keyId: string, applicationKey: string): Promise<B2AuthResponse> {
  const authString = encodeBase64(`${keyId}:${applicationKey}`);

  const response = await fetch(B2_AUTH_URL, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authString}`,
    },
  });

  if (!response.ok) {
    throw new Error(`B2 authorization failed: ${response.statusText}`);
  }

  return await response.json();
}

// Get upload URL from B2
async function getUploadUrl(
  apiUrl: string,
  authToken: string,
  bucketId: string
): Promise<B2UploadUrlResponse> {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.statusText}`);
  }

  return await response.json();
}

// Upload file to B2
async function uploadToB2(
  uploadUrl: string,
  authToken: string,
  fileName: string,
  fileData: Uint8Array,
  contentType: string
): Promise<{ fileId: string; fileName: string }> {
  // Calculate SHA-1 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-1', fileData);
  const sha1Hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': contentType,
      'Content-Length': fileData.length.toString(),
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'X-Bz-Content-Sha1': sha1Hex,
    },
    body: fileData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    // Get environment variables
    const B2_KEY_ID = Deno.env.get('B2_KEY_ID');
    const B2_APPLICATION_KEY = Deno.env.get('B2_APPLICATION_KEY');
    const B2_BUCKET_ID = Deno.env.get('B2_BUCKET_ID');

    if (!B2_KEY_ID || !B2_APPLICATION_KEY || !B2_BUCKET_ID) {
      throw new Error('Missing required B2 environment variables');
    }

    // Parse request body
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = (formData.get('path') as string) || 'uploads';

    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || '';
    const fileName = `${path}/${timestamp}-${randomString}.${extension}`;

    // Read file data
    const fileData = new Uint8Array(await file.arrayBuffer());

    // Authorize with B2
    const authResponse = await authorizeB2(B2_KEY_ID, B2_APPLICATION_KEY);

    // Get upload URL
    const uploadUrlResponse = await getUploadUrl(
      authResponse.apiUrl,
      authResponse.authorizationToken,
      B2_BUCKET_ID
    );

    // Upload file
    const uploadResult = await uploadToB2(
      uploadUrlResponse.uploadUrl,
      uploadUrlResponse.authorizationToken,
      fileName,
      fileData,
      file.type || 'application/octet-stream'
    );

    // Construct CDN URL
    const cdnUrl = Deno.env.get('CLOUDFLARE_CDN_URL') || authResponse.downloadUrl;
    const fileUrl = `${cdnUrl}/file/${Deno.env.get('B2_BUCKET_NAME')}/${fileName}`;

    return new Response(
      JSON.stringify({
        success: true,
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        url: fileUrl,
        size: file.size,
        contentType: file.type,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
