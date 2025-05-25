-- Add E2E encryption key fields to profiles table
ALTER TABLE public.profile
ADD COLUMN public_key TEXT,
ADD COLUMN key_generated_at TIMESTAMPTZ;

-- Add indexes for key lookups
CREATE INDEX idx_profile_public_key ON public.profile (public_key) WHERE public_key IS NOT NULL;
CREATE INDEX idx_profile_key_generated_at ON public.profile (key_generated_at) WHERE key_generated_at IS NOT NULL;

-- Add encrypted flag to direct messages
ALTER TABLE public.direct_message
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN encrypted_key TEXT,
ADD COLUMN encryption_iv TEXT;

-- Add indexes for encrypted messages
CREATE INDEX idx_direct_message_is_encrypted ON public.direct_message (is_encrypted) WHERE is_encrypted = TRUE;