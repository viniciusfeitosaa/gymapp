import { prisma } from '../config/database';

export class TrainingBlockedError extends Error {
  code = 'TRAINING_BLOCKED';
  status = 403;

  constructor(
    message = 'Pagamento mensal pendente. O acesso aos treinos foi bloqueado automaticamente pelo sistema.'
  ) {
    super(message);
    this.name = 'TrainingBlockedError';
  }
}

export async function assertStudentCanAccessTraining(studentId: string): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { isTrainingBlocked: true },
  });

  if (student?.isTrainingBlocked) {
    throw new TrainingBlockedError();
  }
}
