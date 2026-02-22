import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export class WorkoutController {
  // Buscar sugestões de imagens por termo (Pexels com fallback Wikimedia Commons)
  async getImageSuggestions(req: AuthRequest, res: Response) {
    try {
      const rawQuery = String(req.query.q || '').trim();
      const maxResults = Math.min(12, Math.max(1, Number(req.query.maxResults) || 8));

      if (!rawQuery) {
        return res.status(400).json({ error: 'Parâmetro q é obrigatório' });
      }

      const pexelsApiKey = process.env.PEXELS_API_KEY;

      // 1) Preferência: Pexels (uso comercial-friendly) se houver chave
      if (pexelsApiKey) {
        const params = new URLSearchParams({
          query: `${rawQuery} gym exercise`,
          per_page: String(maxResults),
          orientation: 'landscape',
          size: 'medium',
        });

        const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
          headers: {
            Authorization: pexelsApiKey,
          },
        });

        if (response.ok) {
          const data = await response.json() as any;
          const images = (data.photos || []).map((p: any) => ({
            id: String(p.id),
            title: p.alt || 'Imagem de exercício',
            imageUrl: p?.src?.large2x || p?.src?.large || p?.src?.original || '',
            thumbUrl: p?.src?.medium || p?.src?.small || '',
            source: 'pexels',
            author: p?.photographer || 'Pexels',
          })).filter((i: any) => i.imageUrl && i.thumbUrl);

          return res.json({ images });
        }
      }

      // 2) Fallback sem chave: Wikimedia Commons
      const wikiParams = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: `${rawQuery} exercise gym`,
        gsrnamespace: '6', // File namespace
        gsrlimit: String(maxResults),
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: '640',
        format: 'json',
      });

      const wikiResponse = await fetch(`https://commons.wikimedia.org/w/api.php?${wikiParams.toString()}`);
      if (!wikiResponse.ok) {
        const text = await wikiResponse.text();
        return res.status(wikiResponse.status).json({
          error: 'Falha ao buscar imagens',
          details: text,
        });
      }

      const wikiData = await wikiResponse.json() as any;
      const pages = Object.values(wikiData?.query?.pages || {}) as any[];
      const images = pages.map((page: any) => {
        const info = page?.imageinfo?.[0];
        return {
          id: String(page.pageid),
          title: String(page.title || 'Imagem'),
          imageUrl: String(info?.url || ''),
          thumbUrl: String(info?.thumburl || info?.url || ''),
          source: 'wikimedia',
          author: 'Wikimedia Commons',
        };
      }).filter((i) => i.imageUrl && i.thumbUrl);

      res.json({ images });
    } catch (error) {
      console.error('Get image suggestions error:', error);
      res.status(500).json({ error: 'Erro ao buscar sugestões de imagem' });
    }
  }

  // Buscar sugestões de vídeos no YouTube (API v3)
  async getYoutubeSuggestions(req: AuthRequest, res: Response) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const rawQuery = String(req.query.q || '').trim();
      const maxResults = Math.min(10, Math.max(1, Number(req.query.maxResults) || 8));

      if (!rawQuery) {
        return res.status(400).json({ error: 'Parâmetro q é obrigatório' });
      }

      if (!apiKey) {
        return res.status(503).json({
          error: 'YOUTUBE_API_KEY não configurada no servidor',
        });
      }

      const q = `${rawQuery} como fazer academia`;
      const params = new URLSearchParams({
        key: apiKey,
        part: 'snippet',
        q,
        type: 'video',
        maxResults: String(maxResults),
        videoEmbeddable: 'true',
        safeSearch: 'moderate',
        relevanceLanguage: 'pt',
      });

      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          error: 'Falha ao consultar YouTube API',
          details: text,
        });
      }

      const data = await response.json() as any;
      const videos = (data.items || []).map((item: any) => {
        const videoId = item?.id?.videoId;
        const snippet = item?.snippet || {};
        return {
          id: videoId,
          title: snippet.title || 'Vídeo',
          channelTitle: snippet.channelTitle || 'Canal',
          thumbnailUrl:
            snippet?.thumbnails?.medium?.url ||
            snippet?.thumbnails?.high?.url ||
            snippet?.thumbnails?.default?.url ||
            '',
          watchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
          embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : '',
        };
      }).filter((v: any) => v.id);

      res.json({ videos });
    } catch (error) {
      console.error('Get YouTube suggestions error:', error);
      res.status(500).json({ error: 'Erro ao buscar sugestões de vídeo' });
    }
  }

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
