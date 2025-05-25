import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// 音声処理のための型定義
interface ProcessAudioRequest {
  audioUrl: string;
  outputPath: string;
}

interface ProcessAudioResponse {
  success: boolean;
  originalUrl: string;
  processedUrl?: string;
  waveformUrl?: string;
  previewUrl?: string;
  durationSeconds?: number;
  error?: string;
}

// 音声の長さを取得する関数（簡易版）
async function getAudioDuration(audioData: ArrayBuffer): Promise<number> {
  // 実際の実装では、音声フォーマットに応じた解析が必要
  // ここでは簡易的に固定値を返す
  return 300; // 5分
}

// 波形データを生成する関数（簡易版）
async function generateWaveform(audioData: ArrayBuffer): Promise<number[]> {
  // 実際の実装では、FFmpegやWeb Audio APIを使用
  // ここでは簡易的なサンプリングデータを生成
  const samples = 100;
  const waveform: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    // ランダムな波形データを生成（実際は音声データから抽出）
    waveform.push(Math.random());
  }
  
  return waveform;
}

// 音声のプレビューを生成する関数（最初の20-30秒）
async function generatePreview(audioData: ArrayBuffer): Promise<ArrayBuffer> {
  // 実際の実装では、FFmpegを使用して音声をトリミング
  // ここでは元データの一部を返す（簡易版）
  const previewDuration = 30; // 30秒
  const previewSize = Math.min(audioData.byteLength, 1024 * 1024); // 最大1MB
  return audioData.slice(0, previewSize);
}

// 音質向上処理（簡易版）
async function enhanceAudioQuality(audioData: ArrayBuffer): Promise<ArrayBuffer> {
  // 実際の実装では、ノイズリダクション、音量正規化などを実行
  // ここでは元データをそのまま返す
  return audioData;
}

// B2にアップロードする関数
async function uploadToB2(
  data: ArrayBuffer | string,
  fileName: string,
  contentType: string
): Promise<string> {
  const uploadUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/upload-to-b2";
  const authToken = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // データをBlobに変換
  const blob = typeof data === "string" 
    ? new Blob([data], { type: contentType })
    : new Blob([data], { type: contentType });
  
  // FormDataを作成
  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("path", "audio");
  
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.url;
}

Deno.serve(async (req: Request) => {
  // CORS対応
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    // リクエストボディを解析
    const { audioUrl, outputPath }: ProcessAudioRequest = await req.json();
    
    if (!audioUrl) {
      throw new Error("audioUrl is required");
    }

    // 音声ファイルをダウンロード
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }
    
    const audioData = await audioResponse.arrayBuffer();
    
    // 音声処理を実行
    const [duration, waveform, preview, enhanced] = await Promise.all([
      getAudioDuration(audioData),
      generateWaveform(audioData),
      generatePreview(audioData),
      enhanceAudioQuality(audioData),
    ]);
    
    // 処理結果をB2にアップロード
    const timestamp = Date.now();
    const baseName = audioUrl.split('/').pop()?.split('.')[0] || 'audio';
    
    const [processedUrl, waveformUrl, previewUrl] = await Promise.all([
      // 音質向上済みファイル
      uploadToB2(
        enhanced,
        `${outputPath || 'processed'}/${baseName}-enhanced-${timestamp}.mp3`,
        "audio/mpeg"
      ),
      // 波形データ（JSON）
      uploadToB2(
        JSON.stringify({ waveform, duration }),
        `${outputPath || 'waveforms'}/${baseName}-waveform-${timestamp}.json`,
        "application/json"
      ),
      // プレビューファイル
      uploadToB2(
        preview,
        `${outputPath || 'previews'}/${baseName}-preview-${timestamp}.mp3`,
        "audio/mpeg"
      ),
    ]);
    
    // レスポンスを返す
    const response: ProcessAudioResponse = {
      success: true,
      originalUrl: audioUrl,
      processedUrl,
      waveformUrl,
      previewUrl,
      durationSeconds: duration,
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Audio processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        originalUrl: req.url,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});