-- Add ref_source column for share-link attribution
-- Populated when a user arrives via ?ref={assessmentId}
ALTER TABLE assessment_results ADD COLUMN ref_source TEXT;
