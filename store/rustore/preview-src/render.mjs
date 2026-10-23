// Рендер превью для RuStore и Google Play (1080×1920) из template.html через Google Chrome без окна.
// Запуск из корня репозитория: node store/rustore/preview-src/render.mjs
// Результат: store/rustore/previews/0N-*.png. Шрифты грузятся из Google Fonts — нужен интернет.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'previews');
const template = pathToFileURL(path.join(here, 'template.html')).href;

const SLIDES = [
  '01-dose',
  '02-patient',
  '03-defibrillator',
  '04-broselow',
  '05-intubation',
  '06-scores',
  '07-blood-group',
  '08-offline',
];

mkdirSync(outDir, { recursive: true });
SLIDES.forEach((name, idx) => {
  const out = path.join(outDir, `${name}.png`);
  const r = spawnSync(
    CHROME,
    [
      '--headless=new',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1080,1920',
      '--virtual-time-budget=8000',
      '--allow-file-access-from-files',
      `--screenshot=${out}`,
      `${template}?i=${idx + 1}`,
    ],
    { stdio: 'inherit' },
  );
  if (r.status !== 0) {
    console.error(`Не удалось отрисовать ${name}`);
    process.exit(1);
  }
});
// Обложка Google Play (feature graphic) 1024×500
const banner = path.join(outDir, 'google-play-feature-1024x500.png');
const b = spawnSync(
  CHROME,
  [
    '--headless=new',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1024,500',
    '--virtual-time-budget=8000',
    '--allow-file-access-from-files',
    `--screenshot=${banner}`,
    pathToFileURL(path.join(here, 'banner.html')).href,
  ],
  { stdio: 'inherit' },
);
if (b.status !== 0) {
  console.error('Не удалось отрисовать обложку');
  process.exit(1);
}
console.log(`Готово: ${SLIDES.length} превью и обложка в ${outDir}`);
