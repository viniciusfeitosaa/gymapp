import jwt, { SignOptions } from 'jsonwebtoken';

type AuthPayload = {
  userId: string;
  userType: 'personal' | 'student';
};

/** Emite JWT de sessão. Sem JWT_EXPIRES_IN no .env, o token não expira. */
export function signAuthToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN?.trim();
  if (expiresIn) {
    return jwt.sign(payload, secret, { expiresIn } as SignOptions);
  }

  return jwt.sign(payload, secret);
}
