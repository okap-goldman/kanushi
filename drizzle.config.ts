import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema/index.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
} satisfies Config;
