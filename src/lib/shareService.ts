/**
 * 投稿共有機能を提供するサービス
 */
import { supabase } from './supabase';
import type { ServiceResult } from './data';

export interface ShareUrlResult {
  deepLink: string;
  webUrl: string;
  qrCodeUrl?: string;
}

export interface ShareService {
  generateShareUrl(postId: string): Promise<ServiceResult<ShareUrlResult>>;
  validatePostExists(postId: string): Promise<ServiceResult<boolean>>;
}

export function createShareService(supabaseClient = supabase): ShareService {
  return {
    async generateShareUrl(postId: string): Promise<ServiceResult<ShareUrlResult>> {
      try {
        if (!postId || postId.trim() === '') {
          return {
            success: false,
            data: null,
            error: new Error('投稿IDが無効です')
          };
        }

        const validationResult = await this.validatePostExists(postId);
        if (!validationResult.success) {
          return {
            success: false,
            data: null,
            error: validationResult.error
          };
        }

        const deepLink = `kanushi://post/${postId}`;
        const webUrl = `https://app.kanushi.tld/post/${postId}`;
        
        return {
          success: true,
          data: {
            deepLink,
            webUrl,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(deepLink)}`
          },
          error: null
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error : new Error('シェアURL生成に失敗しました')
        };
      }
    },

    async validatePostExists(postId: string): Promise<ServiceResult<boolean>> {
      try {
        const { data, error } = await supabaseClient
          .from('posts')
          .select('id')
          .eq('id', postId)
          .eq('deleted_at', null)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          return {
            success: false,
            data: null,
            error: new Error('投稿が見つかりません')
          };
        }

        return {
          success: true,
          data: true,
          error: null
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error : new Error('投稿確認に失敗しました')
        };
      }
    }
  };
}

export const shareService = createShareService();
