#!/usr/bin/env tsx

import { createMigrationClient } from '../src/lib/db/drizzle-client';

const checkSchema = async () => {
  const client = createMigrationClient();
  
  try {
    // profileテーブルのスキーマ確認
    const columns = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profile' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('Profile table schema:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
};

checkSchema();