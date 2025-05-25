# Backblaze B2 + Cloudflare CDN Setup Guide

This guide explains how to set up Backblaze B2 storage with Cloudflare CDN for your Kanushi application.

## Prerequisites

- Backblaze B2 account
- Cloudflare account
- Domain configured in Cloudflare

## Setup Steps

### 1. Backblaze B2 Configuration

1. **Create a B2 Bucket**
   - Log in to your Backblaze account
   - Navigate to B2 Cloud Storage
   - Click "Create a Bucket"
   - Bucket Name: `kanushi-media` (or your preferred name)
   - Files in Bucket: **Public**
   - Default Encryption: Disabled (optional)
   - Object Lock: Disabled

2. **Generate Application Key**
   - Go to "App Keys" in B2 settings
   - Click "Add a New Application Key"
   - Name: `kanushi-app`
   - Allow access to: Select your bucket
   - Type of Access: Read and Write
   - Save the keyID and applicationKey

### 2. Cloudflare Configuration

1. **Add CNAME Record**
   ```
   Type: CNAME
   Name: cdn (or your preferred subdomain)
   Target: f000.backblazeb2.com
   Proxy status: Proxied (orange cloud)
   ```

2. **Configure Page Rules**
   - Go to Rules > Page Rules
   - Create a new rule:
     ```
     URL: cdn.yourdomain.com/*
     Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: 1 year
     ```

3. **Set Up Transform Rules (Optional)**
   - Go to Rules > Transform Rules > Modify Response Header
   - Create rule to add CORS headers:
     ```
     When: Hostname equals "cdn.yourdomain.com"
     Then: Add header
     - Access-Control-Allow-Origin: *
     - Access-Control-Allow-Methods: GET, HEAD
     ```

### 3. Environment Variables

Add these to your `.env.local` file:

```env
# Backblaze B2 Configuration
B2_KEY_ID=your_actual_key_id
B2_APPLICATION_KEY=your_actual_application_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=kanushi-media

# Cloudflare CDN Configuration
CLOUDFLARE_CDN_URL=https://cdn.yourdomain.com
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### 4. Deploy Edge Function

Deploy the B2 upload function to Supabase:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref dpmrgzjvljaacdwggnaf

# Set environment variables
supabase secrets set B2_KEY_ID=your_actual_key_id
supabase secrets set B2_APPLICATION_KEY=your_actual_application_key
supabase secrets set B2_BUCKET_ID=your_bucket_id
supabase secrets set B2_BUCKET_NAME=kanushi-media
supabase secrets set CLOUDFLARE_CDN_URL=https://cdn.yourdomain.com

# Deploy the function
supabase functions deploy upload-to-b2
```

## Usage

### Client-side Upload

```typescript
import { uploadToB2 } from '@/lib/b2Service';

// Upload a single file
const file = event.target.files[0];
const result = await uploadToB2(file, 'avatars');

if (result.success) {
  console.log('File uploaded:', result.url);
} else {
  console.error('Upload failed:', result.error);
}

// Upload multiple files
const files = Array.from(event.target.files);
const results = await uploadMultipleToB2(files, 'posts');
```

### File Validation

```typescript
import { validateFile } from '@/lib/b2Service';

const validation = validateFile(file, 'posts');
if (!validation.isValid) {
  alert(validation.error);
  return;
}
```

## URL Structure

Files uploaded through this system will be accessible at:
```
https://cdn.yourdomain.com/file/kanushi-media/[path]/[timestamp]-[random].[extension]
```

Example:
```
https://cdn.yourdomain.com/file/kanushi-media/avatars/1735123456789-abc123def.jpg
```

## Security Considerations

1. **CORS Configuration**: The Edge Function allows CORS from any origin. Restrict this in production.
2. **Authentication**: Files are uploaded through authenticated Edge Function calls.
3. **Rate Limiting**: Consider implementing rate limiting on the Edge Function.
4. **File Validation**: Always validate file types and sizes before upload.

## Cost Optimization

1. **Cloudflare Caching**: Files are cached at edge locations reducing B2 bandwidth costs
2. **Image Optimization**: Consider using Cloudflare Images for automatic optimization
3. **Lifecycle Rules**: Set up B2 lifecycle rules to delete old temporary files

## Monitoring

1. **B2 Dashboard**: Monitor storage usage and bandwidth
2. **Cloudflare Analytics**: Track CDN performance and cache hit rates
3. **Supabase Logs**: Monitor Edge Function execution and errors

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure Cloudflare transform rules are properly configured
   - Check Edge Function CORS headers

2. **Upload Failures**
   - Verify B2 credentials are correct
   - Check Edge Function logs in Supabase dashboard
   - Ensure bucket is set to public

3. **CDN Not Working**
   - Verify CNAME record is proxied through Cloudflare
   - Clear Cloudflare cache if needed
   - Check B2 bucket permissions