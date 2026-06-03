import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { deletePersonalLogoFiles, savePersonalLogo } from '../utils/personalLogo';

const personalProfileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  taxId: true,
  cref: true,
  maxStudentsAllowed: true,
  logoUrl: true,
  address: true,
  addressNumber: true,
  complement: true,
  province: true,
  postalCode: true,
} as const;

const DELETE_CONFIRMATION = 'EXCLUIR';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
  confirmation: z.literal(DELETE_CONFIRMATION, {
    errorMap: () => ({ message: `Digite ${DELETE_CONFIRMATION} para confirmar` }),
  }),
});

const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  phone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
});

const uploadLogoSchema = z.object({
  logo: z.string().min(50, 'Imagem inválida'),
});

export class PersonalController {
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const body = updateProfileSchema.parse(req.body);

      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.phone !== undefined) data.phone = body.phone || null;
      if (body.taxId !== undefined) data.taxId = body.taxId ? body.taxId.replace(/\D/g, '') : null;
      if (body.address !== undefined) data.address = body.address || null;
      if (body.addressNumber !== undefined) data.addressNumber = body.addressNumber || null;
      if (body.complement !== undefined) data.complement = body.complement || null;
      if (body.province !== undefined) data.province = body.province || null;
      if (body.postalCode !== undefined) data.postalCode = body.postalCode ? body.postalCode.replace(/\D/g, '') : null;

      const personal = await prisma.personalTrainer.update({
        where: { id: personalId },
        data,
        select: personalProfileSelect,
      });

      res.json(personal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Update personal profile error:', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }

  async uploadLogo(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const { logo } = uploadLogoSchema.parse(req.body);
      const logoUrl = await savePersonalLogo(personalId, logo);

      const personal = await prisma.personalTrainer.update({
        where: { id: personalId },
        data: { logoUrl },
        select: personalProfileSelect,
      });

      res.json(personal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      if (error instanceof Error && error.message) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Upload personal logo error:', error);
      res.status(500).json({ error: 'Erro ao enviar logo' });
    }
  }

  async deleteLogo(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      await deletePersonalLogoFiles(personalId);

      const personal = await prisma.personalTrainer.update({
        where: { id: personalId },
        data: { logoUrl: null },
        select: personalProfileSelect,
      });

      res.json(personal);
    } catch (error) {
      console.error('Delete personal logo error:', error);
      res.status(500).json({ error: 'Erro ao remover logo' });
    }
  }

  async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const { password } = deleteAccountSchema.parse(req.body);

      const personal = await prisma.personalTrainer.findUnique({
        where: { id: personalId },
        select: { id: true, email: true, password: true, _count: { select: { students: true } } },
      });

      if (!personal) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      const passwordValid = await bcrypt.compare(password, personal.password);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      await deletePersonalLogoFiles(personalId);

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { email: personal.email } }),
        prisma.personalTrainer.delete({ where: { id: personalId } }),
      ]);

      res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Delete personal account error:', error);
      res.status(500).json({ error: 'Erro ao excluir conta' });
    }
  }
}
