CREATE TYPE match_scoring_status AS ENUM ('pending', 'processing', 'completed', 'error');

ALTER TABLE matches 
ADD COLUMN scoring_status match_scoring_status NOT NULL DEFAULT 'pending',
ADD COLUMN scoring_started_at timestamptz,
ADD COLUMN scoring_completed_at timestamptz;

-- Set completed for matches that are already finished
UPDATE matches 
SET scoring_status = 'completed', 
    scoring_completed_at = NOW() 
WHERE status = 'finished';
