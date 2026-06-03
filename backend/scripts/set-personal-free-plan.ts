/**
 * Rebaixa um personal para o plano gratuito (testes de assinatura).
 * Uso: cd backend && npx tsx scripts/set-personal-free-plan.ts viniciusalves919@gmail.com
 */
import { PrismaClient } from '@prisma/client';

const FREE_PLAN_STUDENTS = 2;
const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Uso: npx tsx scripts/set-personal-free-plan.ts <email>');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const personal = await prisma.personalTrainer.findUnique({ where: { email } });
  if (!personal) {
    console.error(`Personal não encontrado: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.personalTrainer.update({
    where: { id: personal.id },
    data: { maxStudentsAllowed: FREE_PLAN_STUDENTS, storeSubscriptionId: null },
    select: { email: true, maxStudentsAllowed: true, storeSubscriptionId: true },
  });

  console.log('Plano gratuito aplicado:', updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
