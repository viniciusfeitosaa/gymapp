-- AlterTable
ALTER TABLE "personal_trainers" ADD COLUMN IF NOT EXISTS "maxStudentsAllowed" INTEGER NOT NULL DEFAULT 1;
