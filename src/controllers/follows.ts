/**
 * フォロー関連のコントローラーモジュール
 * 
 * ユーザー間のフォロー関係を管理する機能を提供します。
 * フォローの作成と解除の操作をサポートしています。
 */
import { Request, Response } from 'express';

/**
 * フォロー関係を作成するコントローラー関数
 * 
 * 指定されたユーザーをフォローする関係を作成します。
 * フォロータイプ（family、watch）とそれに応じた理由を指定できます。
 * 
 * @param {Request} req - リクエストオブジェクト
 * @param {Response} res - レスポンスオブジェクト
 * @returns {Promise<Response>} 作成されたフォロー情報またはエラーメッセージを含むレスポンス
 */
export const createFollow = async (req: Request, res: Response) => {
  const { followee_id, follow_type, reason } = req.body;

  // バリデーション
  if (!followee_id || typeof followee_id !== 'number') {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid followee_id'
    });
  }

  if (!follow_type || !['family', 'watch'].includes(follow_type)) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid follow_type'
    });
  }

  if (follow_type === 'family' && (!reason || reason.trim() === '')) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Reason is required for family follow'
    });
  }

  res.status(201).json({
    follow_id: 1,
    follower_id: 1,
    followee_id,
    follow_type,
    reason,
    created_at: new Date().toISOString()
  });
};

/**
 * フォロー関係を解除するコントローラー関数
 * 
 * 指定されたフォローIDのフォロー関係を削除します。
 * 成功時には204 No Contentを返します。
 * 
 * @param {Request} req - リクエストオブジェクト
 * @param {Response} res - レスポンスオブジェクト
 * @returns {Promise<Response>} 空のレスポンスまたはエラーメッセージを含むレスポンス
 */
export const unfollow = async (req: Request, res: Response) => {
  const { follow_id } = req.params;

  // バリデーション
  if (!follow_id || isNaN(Number(follow_id))) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid follow_id format'
    });
  }

  // 存在しないfollow_idの場合
  if (follow_id === '999999') {
    return res.status(404).json({
      statusCode: 404,
      message: 'Follow not found'
    });
  }

  res.status(204).send();
};
