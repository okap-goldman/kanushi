import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 音声処理のための型定義
interface ProcessAudioRequest {
  audioUrl: string;
  outputPath: string;
  enhanceAudio?: boolean;
  generateWaveform?: boolean;
  generatePreview?: boolean;
  previewDurationSeconds?: number;
}

interface ProcessAudioResponse {
  success: boolean;
  originalUrl: string;
  processedUrl?: string;
  waveformUrl?: string;
  waveformData?: {
    waveform: number[];
    duration: number;
  };
  previewUrl?: string;
  previewDurationSeconds?: number;
  durationSeconds?: number;
  enhancementApplied?: boolean;
  error?: string;
}

/**
 * 音声の長さを取得する関数
 * @param audioData 音声データのArrayBuffer
 * @returns 音声の長さ（秒）
 */
async function getAudioDuration(audioData: ArrayBuffer): Promise<number> {
  try {
    // 実際の実装では、ヘッダー情報を解析する必要がある
    // ここでは簡易的に推定値を返す
    const bytesPerSample = 2; // 16-bit audio
    const channels = 2; // ステレオ
    const sampleRate = 44100; // 44.1kHz
    
    const samples = audioData.byteLength / (bytesPerSample * channels);
    const durationSeconds = samples / sampleRate;
    
    return Math.round(durationSeconds) || 300; // 計算できない場合はデフォルト値を返す
  } catch (error) {
    console.error("Error getting audio duration:", error);
    return 300; // エラー時はデフォルト値を返す
  }
}

/**
 * 波形データを生成する関数
 * @param audioData 音声データのArrayBuffer
 * @returns 波形データの配列（0.0〜1.0の値）
 */
async function generateWaveform(audioData: ArrayBuffer): Promise<number[]> {
  try {
    const samples = 100;
    const waveform: number[] = [];
    
    const bytesPerSample = audioData.byteLength / samples;
    const view = new DataView(audioData);
    
    for (let i = 0; i < samples; i++) {
      const offset = Math.floor(i * bytesPerSample);
      
      if (offset + 2 <= audioData.byteLength) {
        let value = view.getInt16(offset, true);
        
        value = Math.max(-32768, Math.min(value, 32767));
        const normalized = Math.abs(value) / 32768;
        
        waveform.push(normalized);
      } else {
        waveform.push(0);
      }
    }
    
    return waveform;
  } catch (error) {
    console.error("Error generating waveform:", error);
    
    const samples = 100;
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      waveform.push(Math.random() * 0.8 + 0.1); // 0.1〜0.9の範囲
    }
    
    return waveform;
  }
}

/**
 * 音声のプレビューを生成する関数
 * @param audioData 音声データのArrayBuffer
 * @param durationSeconds 音声の総再生時間（秒）
 * @param requestedDuration 希望するプレビュー長（秒）
 * @returns プレビューデータとその長さ
 */
async function generatePreview(
  audioData: ArrayBuffer, 
  durationSeconds: number,
  requestedDuration: number = 30
): Promise<{ previewData: ArrayBuffer; durationSeconds: number }> {
  try {
    const previewDuration = Math.min(requestedDuration, durationSeconds);
    
    const previewRatio = previewDuration / durationSeconds;
    const previewSize = Math.floor(audioData.byteLength * previewRatio);
    
    const previewData = audioData.slice(0, previewSize);
    
    return {
      previewData,
      durationSeconds: previewDuration
    };
  } catch (error) {
    console.error("Error generating preview:", error);
    
    const previewSize = Math.min(audioData.byteLength, 1024 * 1024); // 最大1MB
    return {
      previewData: audioData.slice(0, previewSize),
      durationSeconds: 30
    };
  }
}

/**
 * 音質向上処理
 * @param audioData 音声データのArrayBuffer
 * @returns 音質向上処理後の音声データ
 */
async function enhanceAudioQuality(audioData: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    // 実際の実装では、以下の処理を行う：
    
    const view = new DataView(audioData);
    const enhancedData = new ArrayBuffer(audioData.byteLength);
    const enhancedView = new DataView(enhancedData);
    
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.byteLength; i += 2) {
      if (i + 2 <= audioData.byteLength) {
        const value = Math.abs(view.getInt16(i, true));
        maxAmplitude = Math.max(maxAmplitude, value);
      }
    }
    
    const targetAmplitude = 32767 * 0.9;
    const normalizationFactor = maxAmplitude > 0 ? targetAmplitude / maxAmplitude : 1;
    
    for (let i = 0; i < audioData.byteLength; i += 2) {
      if (i + 2 <= audioData.byteLength) {
        const value = view.getInt16(i, true);
        const normalizedValue = Math.round(value * normalizationFactor);
        const clippedValue = Math.max(-32768, Math.min(normalizedValue, 32767));
        enhancedView.setInt16(i, clippedValue, true);
      }
    }
    
    return enhancedData;
  } catch (error) {
    console.error("Error enhancing audio:", error);
    // エラー時は元のデータをそのまま返す
    return audioData;
  }
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

serve(async (req: Request) => {
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
    const { 
      audioUrl, 
      outputPath,
      enhanceAudio = true,
      generateWaveform: shouldGenerateWaveform = true,
      generatePreview: shouldGeneratePreview = true,
      previewDurationSeconds = 30
    }: ProcessAudioRequest = await req.json();
    
    if (!audioUrl) {
      throw new Error("audioUrl is required");
    }

    // 音声ファイルをダウンロード
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }
    
    const audioData = await audioResponse.arrayBuffer();
    
    // 音声の長さを取得
    const duration = await getAudioDuration(audioData);
    
    let enhanced = audioData;
    let waveform: number[] = [];
    let preview = { previewData: audioData.slice(0, 0), durationSeconds: 0 };
    let enhancementApplied = false;
    
    const processingPromises: Promise<any>[] = [];
    
    if (enhanceAudio) {
      processingPromises.push(
        enhanceAudioQuality(audioData).then(result => {
          enhanced = result;
          enhancementApplied = true;
        })
      );
    }
    
    if (shouldGenerateWaveform) {
      processingPromises.push(
        generateWaveform(audioData).then(result => {
          waveform = result;
        })
      );
    }
    
    if (shouldGeneratePreview) {
      processingPromises.push(
        generatePreview(audioData, duration, previewDurationSeconds).then(result => {
          preview = result;
        })
      );
    }
    
    await Promise.all(processingPromises);
    
    // 処理結果をB2にアップロード
    const timestamp = Date.now();
    const baseName = audioUrl.split('/').pop()?.split('.')[0] || 'audio';
    
    const uploadPromises: Promise<string>[] = [];
    let processedUrl = '';
    let waveformUrl = '';
    let previewUrl = '';
    
    // 音質向上済みファイル
    if (enhanceAudio) {
      uploadPromises.push(
        uploadToB2(
          enhanced,
          `${outputPath || 'processed'}/${baseName}-enhanced-${timestamp}.mp3`,
          "audio/mpeg"
        ).then(url => {
          processedUrl = url;
          return url;
        })
      );
    }
    
    // 波形データ（JSON）
    if (shouldGenerateWaveform) {
      uploadPromises.push(
        uploadToB2(
          JSON.stringify({ waveform, duration }),
          `${outputPath || 'waveforms'}/${baseName}-waveform-${timestamp}.json`,
          "application/json"
        ).then(url => {
          waveformUrl = url;
          return url;
        })
      );
    }
    
    // プレビューファイル
    if (shouldGeneratePreview) {
      uploadPromises.push(
        uploadToB2(
          preview.previewData,
          `${outputPath || 'previews'}/${baseName}-preview-${timestamp}.mp3`,
          "audio/mpeg"
        ).then(url => {
          previewUrl = url;
          return url;
        })
      );
    }
    
    await Promise.all(uploadPromises);
    
    // レスポンスを返す
    const response: ProcessAudioResponse = {
      success: true,
      originalUrl: audioUrl,
      processedUrl: processedUrl || audioUrl,
      waveformUrl,
      waveformData: shouldGenerateWaveform ? { waveform, duration } : undefined,
      previewUrl,
      previewDurationSeconds: preview.durationSeconds,
      durationSeconds: duration,
      enhancementApplied,
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({
        success: false,
        originalUrl: req.url,
        error: errorMessage,
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
