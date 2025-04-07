/**
 * ユーザー関連のコントローラーモジュール
 * 
 * ユーザー情報の取得、更新、およびフォロー関連の機能を提供します。
 * ユーザープロフィール、フォロー/フォロワーリストなどの操作をサポートしています。
 */
import { Request, Response } from 'express';

/**
 * ユーザー情報を取得するコントローラー関数
 * 
 * 指定されたユーザーIDに基づいてユーザー情報を取得します。
 * 現在はモックデータを返していますが、実際のアプリケーションではデータベースから取得します。
 * 
 * @param {Request} req - リクエストオブジェクト
 * @param {Response} res - レスポンスオブジェクト
 * @returns {Promise<Response>} ユーザー情報またはエラーメッセージを含むレスポンス
 */
export const getUserInfo = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id || isNaN(Number(user_id))) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid user ID format'
    });
  }

  if (user_id === '999999') {
    return res.status(404).json({
      statusCode: 404,
      message: 'User not found'
    });
  }

  res.status(200).json({
    user_id: 1,
    user_name: 'Test User',
    email: 'test@example.com',
    profile_icon_url: 'https://example.com/icon.jpg',
    profile_audio_url: 'https://example.com/audio.mp3',
    shop_link_url: 'https://example.com/shop',
    is_shop_link: true,
    introduction: 'Test introduction',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
};

/**
 * ユーザーのフォロー一覧を取得するコントローラー関数
 * 
 * 指定されたユーザーIDがフォローしているユーザーのリストを取得します。
 * 現在はモックデータを返していますが、実際のアプリケーションではデータベースから取得します。
 * 
 * @param {Request} req - リクエストオブジェクト
 * @param {Response} res - レスポンスオブジェクト
 * @returns {Promise<Response>} フォロー一覧またはエラーメッセージを含むレスポンス
 */
export const getUserFollowing = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id || isNaN(Number(user_id))) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid user ID format'
    });
  }

  if (user_id === '999999') {
    return res.status(404).json({
      statusCode: 404,
      message: 'User not found'
    });
  }

  if (user_id === '123') {
    return res.status(200).json({
      following: [{
        follow_id: 1,
        follower_id: 123,
        followee_id: 456,
        follow_type: 'family',
        reason: 'Test reason',
        created_at: new Date().toISOString()
      }]
    });
  }

  res.status(200).json({
    following: []
  });
};

/**
 * ユーザー情報を更新するコントローラー関数
 * 
 * 指定されたユーザーIDのユーザー情報を更新します。
 * ユーザー名、プロフィールアイコンURL、ショップリンク、ショップリンク表示フラグなどを更新できます。
 * 
 * @param {Request} req - リクエストオブジェクト
 * @param {Response} res - レスポンスオブジェクト
 * @returns {Promise<Response>} 更新されたユーザー情報またはエラーメッセージを含むレスポンス
 */
export const updateUserInfo = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { user_name, profile_icon_url, shop_link_url, is_shop_link } = req.body;

  if (!user_id || isNaN(Number(user_id))) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid user ID format'
    });
  }

  if (!user_name || user_name.trim() === '') {
    return res.status(400).json({
      statusCode: 400,
      message: 'User name is required'
    });
  }

  if (profile_icon_url && !profile_icon_url.startsWith('https://')) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid profile icon URL format'
    });
  }

  if (typeof is_shop_link !== 'boolean') {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid is_shop_link format'
    });
  }

  res.status(200).json({
    user_id: Number(user_id),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
};

/**
 * ユーザーのフォロワー一覧を取得するコントローラー関数
 * 
 * 指定されたユーザーIDをフォローしているユーザーのリストを取得します。
 * 現在はモックデータを返していますが、実際のアプリケーションではデータベースから取得します。
 * 
 * @param {Request} req - リクエストオブジェクト
 * @param {Response} res - レスポンスオブジェクト
 * @returns {Promise<Response>} フォロワー一覧またはエラーメッセージを含むレスポンス
 */
export const getUserFollowers = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id || isNaN(Number(user_id))) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid user ID format'
    });
  }

  if (user_id === '999999') {
    return res.status(404).json({
      statusCode: 404,
      message: 'User not found'
    });
  }

  if (user_id === '123') {
    return res.status(200).json({
      followers: [{
        follow_id: 1,
        follower_id: 456,
        followee_id: 123,
        follow_type: 'family',
        reason: 'Test reason',
        created_at: new Date().toISOString()
      }]
    });
  }

  res.status(200).json({
    followers: []
  });
};
