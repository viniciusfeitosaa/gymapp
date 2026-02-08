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

export class StudentController {
  // Gerar código único de 5 dígitos
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      const student = await prisma.student.findUnique({ where: { accessCode: code } });
      exists = !!student;
    }

    return code!;
  }

  // Criar aluno (Personal)
  async createStudent(req: AuthRequest, res: Response) {
    try {
      const data = createStudentSchema.parse(req.body);
      const personalId = req.userId!;

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

      res.status(201).json({
        message: 'Aluno cadastrado com sucesso!',
        student,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Create student error:', error);
      res.status(500).json({ error: 'Erro ao cadastrar aluno' });
    }
  }

  // Listar alunos do Personal
  async getStudents(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;

      const students = await prisma.student.findMany({
        where: { personalTrainerId: personalId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ students });
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
