import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export class MessageController {
  // Enviar mensagem
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { studentId, content } = req.body;
      const userId = req.userId!;
      const userType = req.userType!;

      let personalTrainerId: string;
      let finalStudentId: string;
      let fromPersonal: boolean;

      if (userType === 'personal') {
        // Personal enviando para aluno
        personalTrainerId = userId;
        finalStudentId = studentId;
        fromPersonal = true;

        // Verificar se aluno pertence ao Personal
        const student = await prisma.student.findFirst({
          where: { id: studentId, personalTrainerId },
        });

        if (!student) {
          return res.status(404).json({ error: 'Aluno não encontrado' });
        }
      } else {
        // Aluno enviando para Personal
        const student = await prisma.student.findUnique({
          where: { id: userId },
          select: { personalTrainerId: true },
        });

        if (!student) {
          return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        personalTrainerId = student.personalTrainerId;
        finalStudentId = userId;
        fromPersonal = false;
      }

      const message = await prisma.message.create({
        data: {
          content,
          studentId: finalStudentId,
          personalTrainerId,
          fromPersonal,
        },
        include: {
          student: {
            select: { name: true },
          },
          personalTrainer: {
            select: { name: true },
          },
        },
      });

      res.status(201).json({
        message: 'Mensagem enviada com sucesso!',
        data: message,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  }

  // Buscar mensagens
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const userId = req.userId!;
      const userType = req.userType!;

      let messages;

      if (userType === 'personal') {
        // Personal buscando mensagens com um aluno
        messages = await prisma.message.findMany({
          where: {
            studentId,
            personalTrainerId: userId,
          },
          include: {
            student: {
              select: { name: true },
            },
            personalTrainer: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        });
      } else {
        // Aluno buscando mensagens com seu Personal
        messages = await prisma.message.findMany({
          where: { studentId: userId },
          include: {
            student: {
              select: { name: true },
            },
            personalTrainer: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      res.json({ messages });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
  }

  // Marcar mensagem como lida
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const message = await prisma.message.update({
        where: { id },
        data: { read: true },
      });

      res.json({ message: 'Mensagem marcada como lida', data: message });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Erro ao marcar mensagem como lida' });
    }
  }
}
