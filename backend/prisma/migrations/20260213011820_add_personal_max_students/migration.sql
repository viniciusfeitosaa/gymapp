-- Coluna já criada em 20260212000000; idempotente para homelab
ALTER TABLE "personal_trainers" ADD COLUMN IF NOT EXISTS "maxStudentsAllowed" INTEGER NOT NULL DEFAULT 1;
