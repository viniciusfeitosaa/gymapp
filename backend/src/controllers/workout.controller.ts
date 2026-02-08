import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export class WorkoutController {
  // Criar treino (Personal)
  async createWorkout(req: AuthRequest, res: Response) {
    try {
      const { studentId, name, dayOfWeek, description, exercises } = req.body;
      const personalId = req.userId!;

      // Verificar se o aluno pertence ao Personal
      const student = await prisma.student.findFirst({
        where: { id: studentId, personalTrainerId: personalId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      // Criar treino com exercícios
      const workout = await prisma.workout.create({
        data: {
          name,
          dayOfWeek,
          description,
          studentId,
          exercises: {
            create: exercises || [],
          },
        },
        include: {
          exercises: true,
        },
      });

      res.status(201).json({
        message: 'Treino criado com sucesso!',
        workout,
      });
    } catch (error) {
      console.error('Create workout error:', error);
      res.status(500).json({ error: 'Erro ao criar treino' });
    }
  }

  // Buscar treinos de um aluno (Personal)
  async getStudentWorkouts(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const personalId = req.userId!;

      // Verificar se o aluno pertence ao Personal
      const student = await prisma.student.findFirst({
        where: { id: studentId, personalTrainerId: personalId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      const workouts = await prisma.workout.findMany({
        where: { studentId },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ workouts });
    } catch (error) {
      console.error('Get workouts error:', error);
      res.status(500).json({ error: 'Erro ao buscar treinos' });
    }
  }

  // Atualizar treino (Personal)
  async updateWorkout(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;

      // Verificar se o treino pertence a um aluno do Personal
      const workout = await prisma.workout.findFirst({
        where: {
          id,
          student: {
            personalTrainerId: personalId,
          },
        },
      });

      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }

      const updatedWorkout = await prisma.workout.update({
        where: { id },
        data: req.body,
        include: {
          exercises: true,
        },
      });

      res.json({
        message: 'Treino atualizado com sucesso!',
        workout: updatedWorkout,
      });
    } catch (error) {
      console.error('Update workout error:', error);
      res.status(500).json({ error: 'Erro ao atualizar treino' });
    }
  }

  // Deletar treino (Personal)
  async deleteWorkout(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;

      // Verificar se o treino pertence a um aluno do Personal
      const workout = await prisma.workout.findFirst({
        where: {
          id,
          student: {
            personalTrainerId: personalId,
          },
        },
      });

      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }

      await prisma.workout.delete({ where: { id } });

      res.json({ message: 'Treino deletado com sucesso!' });
    } catch (error) {
      console.error('Delete workout error:', error);
      res.status(500).json({ error: 'Erro ao deletar treino' });
    }
  }

  // Aluno ver seus treinos
  async getMyWorkouts(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;

      const workouts = await prisma.workout.findMany({
        where: { studentId },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { dayOfWeek: 'asc' },
      });

      res.json({ workouts });
    } catch (error) {
      console.error('Get my workouts error:', error);
      res.status(500).json({ error: 'Erro ao buscar treinos' });
    }
  }

  // Aluno ver treino do dia
  async getTodayWorkout(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;
      const today = new Date().getDay();
      const dayOfWeek = DAYS_OF_WEEK[today];

      const workout = await prisma.workout.findFirst({
        where: {
          studentId,
          dayOfWeek,
          isActive: true,
        },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!workout) {
        return res.json({
          message: 'Nenhum treino programado para hoje',
          workout: null,
        });
      }

      res.json({ workout });
    } catch (error) {
      console.error('Get today workout error:', error);
      res.status(500).json({ error: 'Erro ao buscar treino do dia' });
    }
  }

  // Aluno registrar treino completo
  async logWorkout(req: AuthRequest, res: Response) {
    try {
      const { workoutId } = req.params;
      const { completed, duration, notes } = req.body;
      const studentId = req.userId!;

      // Verificar se o treino pertence ao aluno
      const workout = await prisma.workout.findFirst({
        where: { id: workoutId, studentId },
      });

      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }

      const workoutLog = await prisma.workoutLog.create({
        data: {
          studentId,
          workoutId,
          completed,
          duration,
          notes,
        },
      });

      res.status(201).json({
        message: 'Treino registrado com sucesso!',
        workoutLog,
      });
    } catch (error) {
      console.error('Log workout error:', error);
      res.status(500).json({ error: 'Erro ao registrar treino' });
    }
  }
}
