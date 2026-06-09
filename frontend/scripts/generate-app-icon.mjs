/**
 * Gera icon.png e splash.png do Gym Code a partir do favicon.svg
 * para uso com @capacitor/assets (iOS + Android).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const svgPath = path.join(root, 'public', 'favicon.svg');

fs.mkdirSync(assetsDir, { recursive: true });

const svg = fs.readFileSync(svgPath);

const iconPath = path.join(assetsDir, 'icon.png');
await sharp(svg).resize(1024, 1024).png().toFile(iconPath);

const logo = await sharp(svg).resize(640, 640).png().toBuffer();
const splashPath = path.join(assetsDir, 'splash.png');
await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: { r: 249, g: 115, b: 22, alpha: 1 },
  },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(splashPath);

console.log('Gerado:', iconPath);
console.log('Gerado:', splashPath);
