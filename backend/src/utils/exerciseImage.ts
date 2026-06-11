import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { parseLogoDataUrl } from './personalLogo';

const EXERCISE_DIR = path.join(process.cwd(), 'uploads', 'exercises');

export function exerciseImagePublicPath(filename: string): string {
  return `/api/uploads/exercises/${filename}`;
}

export async function ensureExerciseImageDir(): Promise<void> {
  await fs.mkdir(EXERCISE_DIR, { recursive: true });
}

export async function saveExerciseImage(dataUrl: string): Promise<string> {
  await ensureExerciseImageDir();
  const { buffer, ext } = parseLogoDataUrl(dataUrl);
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(EXERCISE_DIR, filename), buffer);
  return exerciseImagePublicPath(filename);
}
