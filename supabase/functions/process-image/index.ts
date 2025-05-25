import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// 画像処理のための型定義
interface ProcessImageRequest {
  imageUrl: string;
  outputPath?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface ProcessImageResponse {
  success: boolean;
  originalUrl: string;
  processedUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size?: number;
  error?: string;
}

// 画像のメタデータを取得
async function getImageMetadata(
  imageData: ArrayBuffer
): Promise<{ width: number; height: number }> {
  // 実際の実装では、画像フォーマットに応じた解析が必要
  // ここでは簡易的に固定値を返す
  return { width: 1920, height: 1080 };
}

// 画像をリサイズする関数（簡易版）
async function resizeImage(
  imageData: ArrayBuffer,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<ArrayBuffer> {
  // 実際の実装では、Sharp、ImageMagick、またはブラウザのCanvas APIを使用
  // ここでは元データをそのまま返す（簡易版）
  return imageData;
}

// サムネイル画像を生成
async function generateThumbnail(imageData: ArrayBuffer): Promise<ArrayBuffer> {
  // 実際の実装では、画像を小さくリサイズ
  // ここでは元データの一部を返す（簡易版）
  return imageData.slice(0, Math.min(imageData.byteLength, 100 * 1024)); // 最大100KB
}

// 画像を最適化する関数
async function optimizeImage(imageData: ArrayBuffer, format: string): Promise<ArrayBuffer> {
  // 実際の実装では、画像圧縮、メタデータ削除などを実行
  // ここでは元データをそのまま返す
  return imageData;
}

// B2にアップロードする関数
async function uploadToB2(
  data: ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const uploadUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/upload-to-b2';
  const authToken = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // FormDataを作成
  const formData = new FormData();
  formData.append('file', new Blob([data], { type: contentType }), fileName);
  formData.append('path', 'images');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.url;
}

// 画像フォーマットを判定
function getImageFormat(contentType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return typeMap[contentType] || 'jpg';
}

Deno.serve(async (req: Request) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    // リクエストボディを解析
    const {
      imageUrl,
      outputPath,
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 85,
    }: ProcessImageRequest = await req.json();

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    // 画像ファイルをダウンロード
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageData = await imageResponse.arrayBuffer();

    // 画像処理を実行
    const [metadata, resized, thumbnail, optimized] = await Promise.all([
      getImageMetadata(imageData),
      resizeImage(imageData, maxWidth, maxHeight, quality),
      generateThumbnail(imageData),
      optimizeImage(imageData, contentType),
    ]);

    // 処理結果をB2にアップロード
    const timestamp = Date.now();
    const baseName = imageUrl.split('/').pop()?.split('.')[0] || 'image';
    const format = getImageFormat(contentType);

    const [processedUrl, thumbnailUrl] = await Promise.all([
      // リサイズ・最適化済み画像
      uploadToB2(
        optimized,
        `${outputPath || 'processed'}/${baseName}-optimized-${timestamp}.${format}`,
        contentType
      ),
      // サムネイル画像
      uploadToB2(
        thumbnail,
        `${outputPath || 'thumbnails'}/${baseName}-thumb-${timestamp}.${format}`,
        contentType
      ),
    ]);

    // レスポンスを返す
    const response: ProcessImageResponse = {
      success: true,
      originalUrl: imageUrl,
      processedUrl,
      thumbnailUrl,
      width: metadata.width,
      height: metadata.height,
      size: optimized.byteLength,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        originalUrl: req.url,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
