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
  accessCode: z.string().length(5, 'Código deve ter 5 caracteres (4 números + 1 letra)'),
});

// Bloqueio após 2 tentativas erradas: 5 minutos
const MAX_LOGIN_ATTEMPTS = 2;
const LOCKOUT_MINUTES = 5;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;

type LockoutEntry = { count: number; blockedUntil: number };
const loginLockout = new Map<string, LockoutEntry>();

function normalizeIp(ip: string | undefined): string {
  if (!ip) return 'unknown';
  const trimmed = ip.trim();
  if (trimmed === '::1' || trimmed === '::ffff:127.0.0.1') return '127.0.0.1';
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7);
  return trimmed;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return normalizeIp(forwarded.split(',')[0]?.trim());
  }
  const ip = req.ip ?? (req as any).socket?.remoteAddress ?? (req as any).connection?.remoteAddress;
  return normalizeIp(ip);
}

function isLockedOut(key: string): { locked: boolean; remainingMs?: number } {
  const entry = loginLockout.get(key);
  if (!entry) return { locked: false };
  if (Date.now() < entry.blockedUntil) {
    return { locked: true, remainingMs: entry.blockedUntil - Date.now() };
  }
  loginLockout.delete(key);
  return { locked: false };
}

function recordFailedAttempt(key: string): void {
  const entry = loginLockout.get(key);
  const now = Date.now();
  if (!entry) {
    loginLockout.set(key, { count: 1, blockedUntil: 0 });
    return;
  }
  const count = entry.count + 1;
  const blockedUntil = count >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_MS : 0;
  loginLockout.set(key, { count, blockedUntil });
}

function clearLockout(key: string): void {
  loginLockout.delete(key);
}

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
      const lockKey = `personal:${data.email.toLowerCase()}`;

      const lock = isLockedOut(lockKey);
      if (lock.locked && lock.remainingMs !== undefined) {
        const minutes = Math.ceil(lock.remainingMs / 60000);
        return res.status(429).json({
          error: 'Muitas tentativas de login. Aguarde 5 minutos para tentar novamente.',
          lockoutMinutes: minutes,
        });
      }

      // Buscar Personal Trainer
      const personal = await prisma.personalTrainer.findUnique({
        where: { email: data.email },
        select: { id: true, name: true, email: true, phone: true, taxId: true, cref: true, password: true },
      });

      if (!personal) {
        recordFailedAttempt(lockKey);
        return res.status(400).json({ error: 'Email ou senha incorretos' });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(data.password, personal.password);

      if (!validPassword) {
        recordFailedAttempt(lockKey);
        return res.status(400).json({ error: 'Email ou senha incorretos' });
      }

      clearLockout(lockKey);

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
          taxId: personal.taxId ?? undefined,
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

  // Login de Aluno (código: 4 números + 1 letra maiúscula)
  async loginStudent(req: Request, res: Response) {
    try {
      const data = loginStudentSchema.parse(req.body);
      const ip = getClientIp(req);
      const lockKey = `student:${ip}`;

      const lock = isLockedOut(lockKey);
      if (lock.locked && lock.remainingMs !== undefined) {
        const minutes = Math.ceil(lock.remainingMs / 60000);
        return res.status(429).json({
          error: 'Muitas tentativas de login. Aguarde 5 minutos para tentar novamente.',
          lockoutMinutes: minutes,
        });
      }

      // Buscar aluno pelo código
      const student = await prisma.student.findUnique({
        where: { accessCode: data.accessCode.toUpperCase() },
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
        recordFailedAttempt(lockKey);
        return res.status(400).json({ error: 'Código inválido' });
      }

      clearLockout(lockKey);

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
