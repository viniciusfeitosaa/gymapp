import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  phone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
});

export class PersonalController {
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const body = updateProfileSchema.parse(req.body);

      const data: { name?: string; phone?: string | null; taxId?: string | null } = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.phone !== undefined) data.phone = body.phone || null;
      if (body.taxId !== undefined) data.taxId = body.taxId ? body.taxId.replace(/\D/g, '') : null;

      const personal = await prisma.personalTrainer.update({
        where: { id: personalId },
        data,
        select: { id: true, name: true, email: true, phone: true, taxId: true, cref: true },
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
}
