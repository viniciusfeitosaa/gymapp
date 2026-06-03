/**
 * Gera capacitor.config.json a partir de CAPACITOR_SERVER_URL (frontend/.env).
 * CAPACITOR_USE_BUNDLED=1 → usa dist local (IAP + UI nova); sem server.url.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) return;
  const content = readFileSync(p, 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const appId = (process.env.CAPACITOR_APP_ID || 'com.gymcode.app').trim();
const appName = (process.env.CAPACITOR_APP_NAME || 'Gym Code').trim();
const useBundled = process.env.CAPACITOR_USE_BUNDLED === '1';
let serverUrl = (process.env.CAPACITOR_SERVER_URL || 'https://mygymcode.com/login').trim();

if (serverUrl.startsWith('http://')) {
  serverUrl = serverUrl.replace(/^http:\/\//, 'https://');
}

const config = {
  appId,
  appName,
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

if (!useBundled) {
  config.server = {
    url: serverUrl,
    cleartext: false,
    allowNavigation: ['mygymcode.com', '*.mygymcode.com', 'www.mygymcode.com'],
  };
}

const out = resolve(root, 'capacitor.config.json');
writeFileSync(out, JSON.stringify(config, null, 2) + '\n', 'utf8');
console.log(
  '[write-capacitor-config]',
  out,
  useBundled ? '(modo bundled — dist local)' : `(server.url=${serverUrl})`
);
