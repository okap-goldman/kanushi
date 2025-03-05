import axios from 'axios';

const SOUNDCLOUD_API_URL = 'https://api.soundcloud.com';
const SOUNDCLOUD_AUTH_URL = 'https://secure.soundcloud.com/oauth/token';

// SoundCloud API credentials
const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
const clientSecret = import.meta.env.VITE_SOUNDCLOUD_CLIENT_SECRET;

// Token storage
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

// Get access token using client credentials flow
export const getAccessToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    // Encode client credentials for basic auth
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    // Request new token
    const response = await axios.post(
      SOUNDCLOUD_AUTH_URL,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    // Store token and expiry
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    return accessToken;
  } catch (error) {
    console.error('SoundCloud authentication error:', error);
    throw new Error('SoundCloudの認証に失敗しました。');
  }
};

// Upload audio to SoundCloud
export const uploadToSoundCloud = async (file: File, title: string): Promise<string> => {
  try {
    const token = await getAccessToken();
    
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('track[title]', title || `Voice ${new Date().toISOString()}`);
    formData.append('track[asset_data]', file);
    
    // Upload to SoundCloud
    const response = await axios.post(
      `${SOUNDCLOUD_API_URL}/tracks`,
      formData,
      {
        headers: {
          'Authorization': `OAuth ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    // Return the permalink URL
    return response.data.permalink_url;
  } catch (error) {
    console.error('SoundCloud upload error:', error);
    throw new Error('SoundCloudへのアップロードに失敗しました。');
  }
};
