import fs from 'fs/promises';
import path from 'path';

const LOGO_DIR = path.join(process.cwd(), 'uploads', 'logos');
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function personalLogoPublicPath(filename: string): string {
  return `/api/uploads/logos/${filename}`;
}

export async function ensureLogoDir(): Promise<void> {
  await fs.mkdir(LOGO_DIR, { recursive: true });
}

export function parseLogoDataUrl(dataUrl: string): { buffer: Buffer; ext: string; mime: string } {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) {
    throw new Error('Formato de imagem inválido. Use JPEG, PNG ou WebP.');
  }

  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error('Tipo de imagem não permitido. Use JPEG, PNG ou WebP.');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) {
    throw new Error('Imagem vazia.');
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error('Imagem muito grande. Máximo 2 MB.');
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return { buffer, ext, mime };
}

export async function savePersonalLogo(personalId: string, dataUrl: string): Promise<string> {
  await ensureLogoDir();
  const { buffer, ext } = parseLogoDataUrl(dataUrl);
  const filename = `${personalId}.${ext}`;
  const filepath = path.join(LOGO_DIR, filename);

  await fs.writeFile(filepath, buffer);
  await removeOtherLogoVariants(personalId, ext);

  return personalLogoPublicPath(filename);
}

async function removeOtherLogoVariants(personalId: string, keepExt: string): Promise<void> {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    if (ext === keepExt || (keepExt === 'jpg' && ext === 'jpeg')) continue;
    const p = path.join(LOGO_DIR, `${personalId}.${ext}`);
    await fs.unlink(p).catch(() => undefined);
  }
}

export async function deletePersonalLogoFiles(personalId: string): Promise<void> {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = path.join(LOGO_DIR, `${personalId}.${ext}`);
    await fs.unlink(p).catch(() => undefined);
  }
}

export function getUploadsRoot(): string {
  return path.join(process.cwd(), 'uploads');
}
