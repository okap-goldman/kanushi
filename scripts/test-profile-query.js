const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileQuery() {
  console.log('Testing profile table query...\n');

  // Test 1: Query profile table directly
  console.log('1. Testing direct profile table query:');
  const { data: profiles, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .limit(5);

  if (profileError) {
    console.error('Error querying profile table:', profileError);
  } else {
    console.log('Found profiles:', profiles?.length || 0);
    if (profiles?.length > 0) {
      console.log('Sample profile:', {
        id: profiles[0].id,
        display_name: profiles[0].display_name,
        profile_image_url: profiles[0].profile_image_url
      });
    }
  }

  // Test 2: Query posts with profile join
  console.log('\n2. Testing post table with profile join:');
  const { data: posts, error: postError } = await supabase
    .from('post')
    .select(`
      *,
      profile!post_user_id_fkey (id, display_name, profile_image_url)
    `)
    .limit(5);

  if (postError) {
    console.error('Error querying posts with profile:', postError);
  } else {
    console.log('Found posts:', posts?.length || 0);
    if (posts?.length > 0) {
      console.log('Sample post with profile:', {
        post_id: posts[0].id,
        content_type: posts[0].content_type,
        profile: posts[0].profile
      });
    }
  }

  // Test 3: Check table structure
  console.log('\n3. Checking table names in database:');
  const { data: tables, error: tableError } = await supabase
    .rpc('get_table_names');

  if (tableError) {
    console.log('Note: get_table_names function might not exist, but queries above show actual table names.');
  } else {
    console.log('Tables:', tables);
  }
}

testProfileQuery().catch(console.error);