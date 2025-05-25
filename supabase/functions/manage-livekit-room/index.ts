import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoomRequest {
  action: 'create' | 'delete';
  roomName: string;
  emptyTimeout?: number;
  maxParticipants?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 認証チェック
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, roomName, emptyTimeout, maxParticipants } = await req.json() as RoomRequest;

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const wsUrl = Deno.env.get('LIVEKIT_WS_URL');

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error('LiveKit credentials not configured');
    }

    // LiveKit API URLを構築
    const url = new URL(wsUrl);
    const apiUrl = `${url.protocol}//${url.host}`;

    switch (action) {
      case 'create':
        // ルーム作成（LiveKit APIを直接呼び出す）
        const createResponse = await fetch(`${apiUrl}/twirp/livekit.RoomService/CreateRoom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${generateManagementToken(apiKey, apiSecret)}`,
          },
          body: JSON.stringify({
            name: roomName,
            emptyTimeout: emptyTimeout || 300, // デフォルト5分
            maxParticipants: maxParticipants || 100,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.text();
          throw new Error(`Failed to create room: ${error}`);
        }

        const room = await createResponse.json();
        return new Response(
          JSON.stringify({ room }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      case 'delete':
        // ルーム削除
        const deleteResponse = await fetch(`${apiUrl}/twirp/livekit.RoomService/DeleteRoom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${generateManagementToken(apiKey, apiSecret)}`,
          },
          body: JSON.stringify({
            room: roomName,
          }),
        });

        if (!deleteResponse.ok) {
          const error = await deleteResponse.text();
          throw new Error(`Failed to delete room: ${error}`);
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// LiveKit管理トークン生成
function generateManagementToken(apiKey: string, apiSecret: string): string {
  // 簡略化のため、実際の実装では適切なJWT生成ライブラリを使用
  return `${apiKey}:${apiSecret}`;
}