import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ProgressController {
  // Personal criar registro de evolução
  async createProgress(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const personalId = req.userId!;

      // Verificar se aluno pertence ao Personal
      const student = await prisma.student.findFirst({
        where: { id: studentId, personalTrainerId: personalId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      const progress = await prisma.progressRecord.create({
        data: {
          studentId,
          ...req.body,
        },
      });

      res.status(201).json({
        message: 'Registro de evolução criado com sucesso!',
        progress,
      });
    } catch (error) {
      console.error('Create progress error:', error);
      res.status(500).json({ error: 'Erro ao criar registro de evolução' });
    }
  }

  // Personal buscar evolução de um aluno
  async getStudentProgress(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const personalId = req.userId!;

      // Verificar se aluno pertence ao Personal
      const student = await prisma.student.findFirst({
        where: { id: studentId, personalTrainerId: personalId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      const progress = await prisma.progressRecord.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
      });

      res.json({ progress });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ error: 'Erro ao buscar evolução' });
    }
  }

  // Aluno ver sua própria evolução
  async getMyProgress(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;

      const progress = await prisma.progressRecord.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
      });

      res.json({ progress });
    } catch (error) {
      console.error('Get my progress error:', error);
      res.status(500).json({ error: 'Erro ao buscar evolução' });
    }
  }
}
