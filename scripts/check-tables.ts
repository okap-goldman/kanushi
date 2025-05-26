#!/usr/bin/env tsx

import { createMigrationClient } from '../src/lib/db/drizzle-client';

const checkTables = async () => {
  const client = createMigrationClient();
  
  try {
    const result = await client`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    
    console.log('Available tables:');
    result.forEach(table => {
      console.log(`- ${table.tablename}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
};

checkTables();