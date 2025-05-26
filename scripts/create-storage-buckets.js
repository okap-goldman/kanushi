import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBuckets() {
  console.log('Creating storage buckets...');

  const buckets = [
    {
      name: 'posts',
      public: true,
      fileSizeLimit: 50000000 // 50MB (Supabase max)
    },
    {
      name: 'avatars',
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5 * 1024 * 1024 // 5MB
    },
    {
      name: 'stories',
      public: true,
      allowedMimeTypes: ['image/*', 'video/*'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    },
    {
      name: 'products',
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB
    }
  ];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some(b => b.name === bucket.name);

      if (bucketExists) {
        console.log(`Bucket '${bucket.name}' already exists, skipping...`);
        continue;
      }

      // Create bucket
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: bucket.fileSizeLimit
      });

      if (error) {
        console.error(`Error creating bucket '${bucket.name}':`, error);
      } else {
        console.log(`Created bucket '${bucket.name}'`);
      }
    } catch (error) {
      console.error(`Error processing bucket '${bucket.name}':`, error);
    }
  }

  console.log('Done!');
}

createBuckets().catch(console.error);