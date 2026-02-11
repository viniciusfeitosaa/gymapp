import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export class WorkoutController {
  // Criar treino (Personal)
  async createWorkout(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const { studentId, name, dayOfWeek, description, exercises } = req.body;

      const student = await prisma.student.findFirst({
        where: { id: studentId, personalTrainerId: personalId },
      });
      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      const workout = await prisma.workout.create({
        data: {
          studentId,
          name,
          dayOfWeek,
          description: description || null,
          exercises: exercises?.length
            ? {
                create: exercises.map((ex: any, i: number) => ({
                  name: ex.name,
                  sets: ex.sets,
                  reps: ex.reps,
                  rest: ex.rest || null,
                  weight: ex.weight || null,
                  notes: ex.notes || null,
                  videoUrl: ex.videoUrl || null,
                  order: ex.order ?? i,
                })),
              }
            : undefined,
        },
        include: {
          exercises: true,
        },
      });

      res.status(201).json(workout);
    } catch (error) {
      console.error('Create workout error:', error);
      res.status(500).json({ error: 'Erro ao criar treino' });
    }
  }

  // Buscar todos os treinos do Personal
  async getAllWorkouts(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;

      const workouts = await prisma.workout.findMany({
        where: {
          student: {
            personalTrainerId: personalId,
          },
        },
        include: {
          exercises: { orderBy: { order: 'asc' } },
          student: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(workouts);
    } catch (error) {
      console.error('Get all workouts error:', error);
      res.status(500).json({ error: 'Erro ao buscar treinos' });
    }
  }

  // Buscar treinos de um aluno (Personal)
  async getStudentWorkouts(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const { studentId } = req.params;

      const student = await prisma.student.findFirst({
        where: { id: studentId, personalTrainerId: personalId },
      });
      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      const workouts = await prisma.workout.findMany({
        where: { studentId },
        include: {
          exercises: { orderBy: { order: 'asc' } },
        },
        orderBy: { dayOfWeek: 'asc' },
      });

      res.json(workouts);
    } catch (error) {
      console.error('Get student workouts error:', error);
      res.status(500).json({ error: 'Erro ao buscar treinos' });
    }
  }

  // Atualizar treino (Personal)
  async updateWorkout(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;
      const { exercises, ...workoutData } = req.body;

      const workout = await prisma.workout.findFirst({
        where: {
          id,
          student: { personalTrainerId: personalId },
        },
      });

      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }

      const updatedWorkout = await prisma.$transaction(async (tx) => {
        await tx.workout.update({
          where: { id },
          data: workoutData,
        });

        if (exercises && Array.isArray(exercises)) {
          await tx.exercise.deleteMany({ where: { workoutId: id } });
          if (exercises.length > 0) {
            await tx.exercise.createMany({
              data: exercises.map((ex: any, i: number) => ({
                workoutId: id,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rest: ex.rest || null,
                weight: ex.weight || null,
                notes: ex.notes || null,
                videoUrl: ex.videoUrl || null,
                order: ex.order ?? i,
              })),
            });
          }
        }

        return await tx.workout.findUnique({
          where: { id },
          include: { exercises: { orderBy: { order: 'asc' } } },
        });
      });

      res.json(updatedWorkout);
    } catch (error) {
      console.error('Update workout error:', error);
      res.status(500).json({ error: 'Erro ao atualizar treino' });
    }
  }

  // Excluir treino (Personal)
  async deleteWorkout(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;

      const workout = await prisma.workout.findFirst({
        where: {
          id,
          student: { personalTrainerId: personalId },
        },
      });

      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }

      await prisma.workout.delete({ where: { id } });
      res.json({ message: 'Treino excluído com sucesso' });
    } catch (error) {
      console.error('Delete workout error:', error);
      res.status(500).json({ error: 'Erro ao excluir treino' });
    }
  }

  // Aluno: listar meus treinos
  async getMyWorkouts(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;

      const workouts = await prisma.workout.findMany({
        where: { studentId },
        include: {
          exercises: { orderBy: { order: 'asc' } },
        },
        orderBy: { dayOfWeek: 'asc' },
      });

      res.json(workouts);
    } catch (error) {
      console.error('Get my workouts error:', error);
      res.status(500).json({ error: 'Erro ao buscar treinos' });
    }
  }

  // Aluno: treino do dia
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
          exercises: { orderBy: { order: 'asc' } },
        },
      });

      res.json(workout);
    } catch (error) {
      console.error('Get today workout error:', error);
      res.status(500).json({ error: 'Erro ao buscar treino do dia' });
    }
  }

  // Aluno: listar meus logs de treino (para exibir selo "Concluído")
  async getMyLogs(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;

      const logs = await prisma.workoutLog.findMany({
        where: { studentId, completed: true },
        include: {
          workout: { select: { id: true, name: true, dayOfWeek: true } },
        },
        orderBy: { date: 'desc' },
        take: 100,
      });

      res.json(logs);
    } catch (error) {
      console.error('Get my logs error:', error);
      res.status(500).json({ error: 'Erro ao buscar registros' });
    }
  }

  // Aluno: registrar treino realizado
  async logWorkout(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;
      const { workoutId } = req.params;
      const { duration, notes } = req.body;

      const workout = await prisma.workout.findFirst({
        where: { id: workoutId, studentId },
      });
      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }

      const log = await prisma.workoutLog.create({
        data: {
          studentId,
          workoutId,
          completed: true,
          duration: duration || null,
          notes: notes || null,
        },
      });

      res.status(201).json(log);
    } catch (error) {
      console.error('Log workout error:', error);
      res.status(500).json({ error: 'Erro ao registrar treino' });
    }
  }

  // Personal: logs recentes dos alunos (para Atividades Recentes)
  async getRecentLogs(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;

      const logs = await prisma.workoutLog.findMany({
        where: {
          completed: true,
          student: { personalTrainerId: personalId },
        },
        include: {
          workout: { select: { id: true, name: true, dayOfWeek: true } },
          student: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: 20,
      });

      res.json(logs);
    } catch (error) {
      console.error('Get recent logs error:', error);
      res.status(500).json({ error: 'Erro ao buscar atividades' });
    }
  }
}
