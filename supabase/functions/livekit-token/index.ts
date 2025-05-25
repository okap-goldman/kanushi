import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import jwt from 'https://esm.sh/jsonwebtoken@9.0.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  action: 'create' | 'join';
  roomName?: string;
  identity: string;
  permissions?: {
    canPublish: boolean;
    canSubscribe: boolean;
  };
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

    const { action, roomName, identity, permissions } = await req.json() as TokenRequest;

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }

    let token;

    switch (action) {
      case 'create':
        // ルーム作成はホストのみ
        const createAt = Math.floor(Date.now() / 1000);
        const exp = createAt + 60 * 60 * 24; // 24時間有効

        token = jwt.sign({
          iss: apiKey,
          sub: identity,
          iat: createAt,
          exp: exp,
          jti: identity,
          video: {
            roomCreate: true,
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
          }
        }, apiSecret, {
          algorithm: 'HS256',
        });
        break;

      case 'join':
        // ルーム参加
        const joinAt = Math.floor(Date.now() / 1000);
        const joinExp = joinAt + 60 * 60 * 4; // 4時間有効

        token = jwt.sign({
          iss: apiKey,
          sub: identity,
          iat: joinAt,
          exp: joinExp,
          jti: identity,
          video: {
            room: roomName,
            roomJoin: true,
            canPublish: permissions?.canPublish ?? false,
            canSubscribe: permissions?.canSubscribe ?? true,
            canPublishData: permissions?.canPublish ?? false,
          }
        }, apiSecret, {
          algorithm: 'HS256',
        });
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
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