import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { z } from 'zod';

// Schemas de validação
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  phone: z.string().optional(),
  cref: z.string().optional(),
});

const loginPersonalSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const loginStudentSchema = z.object({
  accessCode: z.string().length(5, 'Código deve ter 5 dígitos'),
});

export class AuthController {
  // Cadastro de Personal Trainer
  async registerPersonal(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);

      // Verificar se email já existe
      const existingPersonal = await prisma.personalTrainer.findUnique({
        where: { email: data.email },
      });

      if (existingPersonal) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Criar Personal Trainer
      const personal = await prisma.personalTrainer.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          cref: data.cref,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          cref: true,
          createdAt: true,
        },
      });

      // Gerar token JWT
      const token = jwt.sign(
        { userId: personal.id, userType: 'personal' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Personal Trainer cadastrado com sucesso!',
        user: personal,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Register error:', error);
      res.status(500).json({ error: 'Erro ao cadastrar Personal Trainer' });
    }
  }

  // Login de Personal Trainer
  async loginPersonal(req: Request, res: Response) {
    try {
      const data = loginPersonalSchema.parse(req.body);

      // Buscar Personal Trainer
      const personal = await prisma.personalTrainer.findUnique({
        where: { email: data.email },
      });

      if (!personal) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(data.password, personal.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { userId: personal.id, userType: 'personal' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso!',
        user: {
          id: personal.id,
          name: personal.name,
          email: personal.email,
          phone: personal.phone,
          cref: personal.cref,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  // Login de Aluno (com código de 5 dígitos)
  async loginStudent(req: Request, res: Response) {
    try {
      const data = loginStudentSchema.parse(req.body);

      // Buscar aluno pelo código
      const student = await prisma.student.findUnique({
        where: { accessCode: data.accessCode },
        include: {
          personalTrainer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      if (!student) {
        return res.status(401).json({ error: 'Código inválido' });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { userId: student.id, userType: 'student' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso!',
        user: {
          id: student.id,
          name: student.name,
          trainingDays: student.trainingDays,
          personalTrainer: student.personalTrainer,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Student login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }
}
