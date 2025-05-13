-- First drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

-- Create more permissive policies for development
CREATE POLICY "Allow anyone to insert likes" 
  ON likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anyone to delete likes"
  ON likes FOR DELETE
  USING (true);

-- Note: In production, you should revert to stricter policies like:
-- CREATE POLICY "Authenticated users can insert likes"
--   ON likes FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete own likes"
--   ON likes FOR DELETE
--   USING (auth.uid() = user_id);