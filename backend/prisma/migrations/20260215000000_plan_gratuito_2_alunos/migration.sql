-- Plano gratuito: limite de 1 para 2 alunos
ALTER TABLE "personal_trainers" ALTER COLUMN "maxStudentsAllowed" SET DEFAULT 2;
UPDATE "personal_trainers" SET "maxStudentsAllowed" = 2 WHERE "maxStudentsAllowed" = 1;
