-- Add Asaas subscription ID for self-service cancellation
ALTER TABLE "personal_trainers" ADD COLUMN IF NOT EXISTS "asaasSubscriptionId" TEXT;
