import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserProfile() {
  const userId = 'bc7f2a4c-4b00-494c-b34e-592896039391';
  
  // Check if user exists in auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  
  if (authError) {
    console.error('Error checking auth user:', authError);
  } else {
    console.log('Auth user found:', authUser ? 'Yes' : 'No');
    if (authUser) {
      console.log('Auth user email:', authUser.user.email);
    }
  }
  
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('Profile found:', profile ? 'Yes' : 'No');
    if (profile) {
      console.log('Profile details:', profile);
    }
  }
  
  // If auth user exists but profile doesn't, create profile
  if (authUser && !profile) {
    console.log('Creating missing profile...');
    const { error: createError } = await supabase.from('profile').insert({
      id: userId,
      displayName: authUser.user.email?.split('@')[0] || 'User',
      profileImageUrl: 'https://via.placeholder.com/150',
      profileText: '',
    });
    
    if (createError) {
      console.error('Error creating profile:', createError);
    } else {
      console.log('Profile created successfully');
    }
  }
}

checkUserProfile().catch(console.error);