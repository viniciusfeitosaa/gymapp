import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const createStudentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  birthDate: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  trainingDays: z.array(z.string()).optional(),
});

// Letras maiúsculas A–Z (26). Código: 4 números + 1 letra → 10⁴ × 26 × 5 pos = 1.300.000 combinações
const UPPERCASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export class StudentController {
  // Gerar código único: 4 números + 1 letra maiúscula (posição aleatória)
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      const digits = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 0000–9999
      const letter = UPPERCASE_LETTERS[Math.floor(Math.random() * UPPERCASE_LETTERS.length)];
      const pos = Math.floor(Math.random() * 5); // 0 a 4: posição da letra
      code = digits.slice(0, pos) + letter + digits.slice(pos);
      const student = await prisma.student.findUnique({ where: { accessCode: code } });
      exists = !!student;
    }

    return code!;
  }

  // Criar aluno (Personal) — bloqueado se atingir limite do plano (não assinante = 1 aluno)
  async createStudent(req: AuthRequest, res: Response) {
    try {
      const data = createStudentSchema.parse(req.body);
      const personalId = req.userId!;

      let maxStudentsAllowed = 1;
      try {
        const personal = await prisma.personalTrainer.findUnique({
          where: { id: personalId },
          select: { maxStudentsAllowed: true },
        });
        if (personal?.maxStudentsAllowed != null) maxStudentsAllowed = personal.maxStudentsAllowed;
      } catch {
        // Coluna maxStudentsAllowed pode não existir se a migration ainda não foi aplicada
      }

      const currentCount = await prisma.student.count({
        where: { personalTrainerId: personalId },
      });
      if (currentCount >= maxStudentsAllowed) {
        return res.status(403).json({
          error: 'Limite de alunos do plano gratuito atingido. Assine para cadastrar mais alunos.',
          code: 'SUBSCRIPTION_LIMIT',
          maxStudentsAllowed,
        });
      }

      const student = await prisma.student.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          weight: data.weight,
          height: data.height,
          trainingDays: data.trainingDays || [],
          accessCode: await this.generateUniqueCode(),
          personalTrainerId: personalId,
        },
      });

      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Create student error:', error);
      res.status(500).json({ error: 'Erro ao cadastrar aluno' });
    }
  }

  // Listar alunos do Personal (inclui info de assinatura para o frontend)
  async getStudents(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;

      const students = await prisma.student.findMany({
        where: { personalTrainerId: personalId },
        orderBy: { createdAt: 'desc' },
      });

      let maxAllowed = 1;
      try {
        const personal = await prisma.personalTrainer.findUnique({
          where: { id: personalId },
          select: { maxStudentsAllowed: true },
        });
        if (personal?.maxStudentsAllowed != null) maxAllowed = personal.maxStudentsAllowed;
      } catch {
        // Coluna maxStudentsAllowed pode não existir se a migration ainda não foi aplicada
      }

      const atLimit = students.length >= maxAllowed;

      res.json({
        students,
        subscription: {
          maxStudentsAllowed: maxAllowed,
          currentCount: students.length,
          atLimit,
          canAddMore: !atLimit,
        },
      });
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({ error: 'Erro ao buscar alunos' });
    }
  }

  // Buscar aluno por ID
  async getStudentById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;

      const student = await prisma.student.findFirst({
        where: {
          id,
          personalTrainerId: personalId,
        },
        include: {
          workouts: {
            include: {
              exercises: true,
            },
          },
          progressRecords: {
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      res.json({ student });
    } catch (error) {
      console.error('Get student error:', error);
      res.status(500).json({ error: 'Erro ao buscar aluno' });
    }
  }

  // Atualizar aluno
  async updateStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;

      // Verificar se aluno pertence ao Personal
      const student = await prisma.student.findFirst({
        where: { id, personalTrainerId: personalId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      const updatedStudent = await prisma.student.update({
        where: { id },
        data: req.body,
      });

      res.json({
        message: 'Aluno atualizado com sucesso!',
        student: updatedStudent,
      });
    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
  }

  // Deletar aluno
  async deleteStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;

      // Verificar se aluno pertence ao Personal
      const student = await prisma.student.findFirst({
        where: { id, personalTrainerId: personalId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      await prisma.student.delete({ where: { id } });

      res.json({ message: 'Aluno deletado com sucesso!' });
    } catch (error) {
      console.error('Delete student error:', error);
      res.status(500).json({ error: 'Erro ao deletar aluno' });
    }
  }

  // Gerar novo código de acesso
  async generateAccessCode(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const personalId = req.userId!;

      // Verificar se aluno pertence ao Personal
      const student = await prisma.student.findFirst({
        where: { id, personalTrainerId: personalId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      const newCode = await this.generateUniqueCode();

      const updatedStudent = await prisma.student.update({
        where: { id },
        data: { accessCode: newCode },
      });

      res.json({
        message: 'Código gerado com sucesso!',
        accessCode: updatedStudent.accessCode,
      });
    } catch (error) {
      console.error('Generate code error:', error);
      res.status(500).json({ error: 'Erro ao gerar código' });
    }
  }

  // Aluno ver seu próprio perfil
  async getMyProfile(req: AuthRequest, res: Response) {
    try {
      const studentId = req.userId!;

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          personalTrainer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          progressRecords: {
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      });

      if (!student) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      res.json({ student });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }
}
