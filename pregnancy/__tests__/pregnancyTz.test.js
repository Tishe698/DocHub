// Расчёт срока в разных часовых поясах, включая переход на летнее/зимнее время и пояса,
// где при переходе нет полуночи (America/Sao_Paulo 2018, Asia/Tehran 2021).
// Jest не позволяет сменить часовой пояс внутри процесса, поэтому модуль запускается
// в дочернем процессе node с переменной TZ. Эталон — арифметика в UTC (сутки всегда 24 ч).
const { execFileSync } = require('child_process');
const fs = require('fs');
const { transformSync } = require('@babel/core');

const SRC = fs.readFileSync(require.resolve('../pregnancyCalc'), 'utf8');
const { code: MODULE_CODE } = transformSync(SRC, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

// Выполняется в дочернем процессе: M — экспорты pregnancyCalc.js
const HARNESS = `
const DAY = 86400000;
const utc = (y, m, d) => new Date(Date.UTC(y, m, d));
const ymd = (d) => [d.getFullYear(), d.getMonth(), d.getDate()].join('-');
const uymd = (d) => [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()].join('-');
const local = (u, h) => new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(), h || 0);
// прежний алгоритм (через миллисекунды, без округления) — для проверки, что тест чувствителен к DST
const oldDays = (a, b) => Math.floor((b.getTime() - a.getTime()) / DAY);

const OFFSETS = [0, 1, 6, 7, 14, 153, 154, 258, 259, 279, 280, 281, 293, 294, 315, 316];
const failures = [];
let oldFailures = 0;
let checked = 0;
for (const startYear of [2018, 2021, 2026]) {
  for (let i = 0; i < 366; i++) {
    const uLmp = utc(startYear, 0, 1 + i);
    for (const k of OFFSETS) {
      const uToday = utc(startYear, 0, 1 + i + k);
      // время суток в датах — разное: результат от него зависеть не должен
      const lmp = local(uLmp, 0);
      const today = local(uToday, 13);
      const r = M.calcPregnancy(lmp, today);
      const expDue = uymd(new Date(uLmp.getTime() + 280 * DAY));
      const expCat = k < 154 ? 'early' : k < 259 ? 'preterm' : k < 294 ? 'term' : 'postterm';
      const ok =
        r.daysSinceLMP === k &&
        r.weeks === Math.floor(k / 7) &&
        r.days === k % 7 &&
        ymd(r.due) === expDue &&
        r.daysToDue === 280 - k &&
        r.category === expCat &&
        r.tooLong === (k > 315) &&
        M.daysBetween(local(uLmp, 23), local(uToday, 0)) === k &&
        ymd(M.addDays(lmp, k)) === uymd(uToday) &&
        ymd(M.startOfDay(today)) === uymd(uToday);
      checked++;
      if (!ok && failures.length < 5) failures.push({ lmp: uymd(uLmp), k, r: { ...r, due: ymd(r.due) }, expDue });
      if (oldDays(local(uLmp, 0), local(uToday, 0)) !== k) oldFailures++;
    }
  }
}
// разбор введённой даты в этом поясе: день, в который нет полуночи, не съезжает
const parsed = [
  M.parseDDMMYYYY('04.11.2018', new Date(2018, 10, 10)),
  M.parseDDMMYYYY('22.03.2021', new Date(2021, 2, 30)),
  M.parseDDMMYYYY('29.03.2026', new Date(2026, 2, 29, 23, 59)),
].map((p) => (p.date ? ymd(p.date) : p.error));
process.stdout.write(JSON.stringify({
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  checked, failures, oldFailures, parsed,
}));
`;

function runInTz(tz) {
  const script = `const M = {}; (function (exports, module) {\n${MODULE_CODE}\n})(M, { exports: M });\n${HARNESS}`;
  const out = execFileSync(process.execPath, ['-'], {
    input: script,
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
  });
  return JSON.parse(out);
}

const ZONES = [
  'Europe/Moscow',
  'Asia/Vladivostok',
  'Europe/London',
  'America/New_York',
  'America/Sao_Paulo', // 2018: переход на летнее время в 00:00 — полуночи 04.11.2018 нет
  'Asia/Tehran', // 2021: переход в 00:00 — полуночи 22.03.2021 нет
  'Australia/Lord_Howe', // сдвиг на 30 минут
  'Pacific/Kiritimati', // UTC+14
  'Pacific/Pago_Pago', // UTC−11
  'UTC',
];

describe.each(ZONES)('часовой пояс %s', (tz) => {
  let res;
  beforeAll(() => {
    res = runInTz(tz);
  });

  test('пояс действительно применён', () => {
    expect(res.tz).toEqual(tz === 'UTC' ? expect.stringMatching(/^(UTC|Etc\/UTC)$/) : tz);
  });

  test('срок, ПДР и категория совпадают с эталоном в календарных днях', () => {
    expect(res.checked).toBe(3 * 366 * 16);
    expect(res.failures).toEqual([]);
  });

  test('введённая дата не сдвигается', () => {
    expect(res.parsed).toEqual(['2018-10-4', '2021-2-22', '2026-2-29']);
  });
});

test('проверка чувствительна к переходу на летнее время (старый расчёт через мс ошибался бы)', () => {
  expect(runInTz('America/New_York').oldFailures).toBeGreaterThan(0);
  expect(runInTz('UTC').oldFailures).toBe(0);
});
