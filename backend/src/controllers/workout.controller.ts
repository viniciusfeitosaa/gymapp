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
                  imageUrl: ex.imageUrl || null,
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
      const { exercises, ...rest } = req.body;

      const workout = await prisma.workout.findFirst({
        where: {
          id,
          student: { personalTrainerId: personalId },
        },
      });

      if (!workout) {
        return res.status(404).json({ error: 'Treino não encontrado' });
      }

      const workoutData: { name?: string; dayOfWeek?: string; description?: string | null; studentId?: string; isActive?: boolean } = {};
      if (rest.name !== undefined) workoutData.name = String(rest.name);
      if (rest.dayOfWeek !== undefined) workoutData.dayOfWeek = String(rest.dayOfWeek);
      if (rest.description !== undefined) workoutData.description = rest.description === '' ? null : String(rest.description);
      if (rest.studentId !== undefined) workoutData.studentId = String(rest.studentId);
      if (rest.isActive !== undefined) workoutData.isActive = Boolean(rest.isActive);

      const updatedWorkout = await prisma.$transaction(async (tx) => {
        if (Object.keys(workoutData).length > 0) {
          await tx.workout.update({
            where: { id },
            data: workoutData,
          });
        }

        if (exercises && Array.isArray(exercises)) {
          await tx.exercise.deleteMany({ where: { workoutId: id } });
          if (exercises.length > 0) {
            await tx.exercise.createMany({
              data: exercises.map((ex: any, i: number) => ({
                workoutId: id,
                name: String(ex.name ?? ''),
                sets: Math.max(1, Number(ex.sets) || 1),
                reps: String(ex.reps ?? ''),
                rest: ex.rest ? String(ex.rest) : null,
                weight: ex.weight ? String(ex.weight) : null,
                notes: ex.notes ? String(ex.notes) : null,
                videoUrl: ex.videoUrl ? String(ex.videoUrl) : null,
                imageUrl: ex.imageUrl ? String(ex.imageUrl) : null,
                order: Number(ex.order) >= 0 ? Number(ex.order) : i,
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
      res.status(500).json({ error: (error as Error)?.message || 'Erro ao atualizar treino' });
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

  // Aluno: estatísticas de ofensiva (streak) e pontos (estilo Duolingo)
  async getStreakStats(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;

      const [logs, workouts] = await Promise.all([
        prisma.workoutLog.findMany({
          where: { studentId, completed: true },
          select: { date: true },
          orderBy: { date: 'desc' },
          take: 500,
        }),
        prisma.workout.findMany({
          where: { studentId, isActive: true },
          select: { dayOfWeek: true },
        }),
      ]);

      const toDateKey = (d: Date) => {
        const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
        return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      };
      const dateToWeekday = (d: Date) => d.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab

      const datesSet = new Set(logs.map((l) => toDateKey(new Date(l.date))));
      const expectedWeekdays = new Set(
        workouts.map((w) => DAYS_OF_WEEK.indexOf(w.dayOfWeek)).filter((i) => i >= 0)
      );

      const POINTS_PER_WORKOUT = 50;
      const PENALTY_PER_MISSED = 15;
      const LOOKBACK_DAYS = 7;

      let missedLast7 = 0;
      const check = new Date();
      for (let i = 0; i < LOOKBACK_DAYS; i++) {
        const key = toDateKey(check);
        const weekday = dateToWeekday(check);
        if (expectedWeekdays.size > 0 && expectedWeekdays.has(weekday) && !datesSet.has(key)) missedLast7++;
        check.setDate(check.getDate() - 1);
      }

      const earned = logs.length * POINTS_PER_WORKOUT;
      const penalty = missedLast7 * PENALTY_PER_MISSED;
      const points = Math.max(0, earned - penalty);

      let now = new Date();
      const todayKey = toDateKey(now);
      const hasToday = datesSet.has(todayKey);
      let ref = new Date(now);
      if (!hasToday) ref.setDate(ref.getDate() - 1);
      let streak = 0;
      const refKey = toDateKey(ref);
      if (datesSet.has(refKey)) {
        let cur = new Date(ref);
        while (true) {
          const key = toDateKey(cur);
          if (!datesSet.has(key)) break;
          streak++;
          cur.setDate(cur.getDate() - 1);
          if (streak >= 500) break;
        }
      }

      res.json({ streak, points, totalWorkouts: logs.length, missedLast7 });
    } catch (error) {
      console.error('Get streak stats error:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
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

  // Personal: logs recentes dos alunos (últimas 24h por padrão; ?days=7 para gráfico)
  async getRecentLogs(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const days = Math.min(30, Math.max(1, parseInt(String(req.query.days), 10) || 1));
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const logs = await prisma.workoutLog.findMany({
        where: {
          completed: true,
          date: { gte: since },
          student: { personalTrainerId: personalId },
        },
        include: {
          workout: { select: { id: true, name: true, dayOfWeek: true } },
          student: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: days === 1 ? 50 : 200,
      });

      res.json(logs);
    } catch (error) {
      console.error('Get recent logs error:', error);
      res.status(500).json({ error: 'Erro ao buscar atividades' });
    }
  }
}
