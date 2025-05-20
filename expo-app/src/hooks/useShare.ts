import { Share } from 'react-native';

export async function shareContent(message: string, url?: string) {
  try {
    await Share.share({
      message: url ? `${message} ${url}` : message,
    });
  } catch (error) {
    console.error('Share error:', error);
  }
}
