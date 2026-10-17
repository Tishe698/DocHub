// oxygenCalc.js — время работы кислородного баллона (чистые функции, без React).
//
// T (мин) = V (л) × (P − Pрезерв) (атм) ÷ Q (л/мин) — время до резерва давления;
// V × P ÷ Q — теоретический максимум до нуля на манометре.
// Значения перенесены без изменений из ветки fix/clinical-audit (calc_max_time_o2.js).

// Резерв давления по умолчанию, атм. Клинического норматива неснижаемого остатка O2 в РФ
// не найдено: ГОСТ 5583-78, п. 4.3 требует остаток в возвратном баллоне не ниже 0,05 МПа —
// это защита баллона, а не запас для пациента. Поэтому взят консервативный вариант практики СМП:
// 200 psi ≈ 13,8 атм ≈ 14 атм (Texas A&M EMS «Oxygen Duration»; protrainings.uk, «How long does
// an oxygen cylinder last?»). Значение можно изменить на экране.
export const DEFAULT_RESERVE_ATM = 14;

// Пределы правдоподобия ввода. Медицинские баллоны РФ: вместимость 1–40 л, номинальное давление
// 14,7 ± 0,5 или 19,6 ± 1,0 МПа (ГОСТ 5583-78, п. 4.1) — значит, больше 30 МПа (300 атм) не бывает.
export const LIMITS = Object.freeze({
  volumeMin: 0.5, // л
  volumeMax: 50, // л
  pressureMaxAtm: 300, // атм (бар, кгс/см²)
  pressureMaxMPa: 30, // МПа
  flowMin: 0.1, // л/мин
  flowMax: 60, // л/мин
  flowWarn: 25, // л/мин; выше — только с предупреждением (возможности редуктора)
});

// 1 МПа = 10 бар; с физ. атм (9,87) и кгс/см² (10,2) расхождение ≤ 2 %, клинически незначимо.
export const MPA_TO_ATM = 10;

export const UNITS = Object.freeze({ ATM: 'ATM', MPA: 'MPa' });

// 0.5 → «0,5» (одна цифра после запятой) для текстов на экране.
export const fmt1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',');

// Перевод показания манометра в атм.
export const toAtm = (pressure, unit) => (unit === UNITS.MPA ? pressure * MPA_TO_ATM : pressure);

// Склонение слова «минута»: 1 минута, 2–4 минуты, 5–20 минут (с учётом 11–14).
export const pluralMinutes = (n) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a >= 11 && a <= 14) return 'минут';
  if (b === 1) return 'минута';
  if (b >= 2 && b <= 4) return 'минуты';
  return 'минут';
};

// «750 минут (12 ч 30 мин)» — часы показываем при 60 минутах и больше.
export const formatMinutes = (min) => {
  const base = `${min} ${pluralMinutes(min)}`;
  if (min < 60) return base;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${base} (${h} ч ${m} мин)`;
};

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Ошибки отдельных полей — только для введённых значений (undefined/null = поле пустое,
// ошибку не показываем, пока человек не начал ввод).
// Возвращает { volume?, pressure?, flow?, reserve? } — тексты ошибок.
export function validateO2Fields({ volume, pressure, unit, flow, reserveAtm }) {
  const errors = {};
  if (isNum(volume)) {
    if (!(volume > 0)) errors.volume = 'Вместимость должна быть больше нуля';
    else if (volume < LIMITS.volumeMin || volume > LIMITS.volumeMax) {
      errors.volume = `Вместимость баллона — от ${fmt1(LIMITS.volumeMin)} до ${LIMITS.volumeMax} л (медицинские баллоны 1–40 л)`;
    }
  }
  if (isNum(pressure)) {
    if (!(pressure > 0)) errors.pressure = 'Давление должно быть больше нуля';
    else if (unit === UNITS.MPA && pressure > LIMITS.pressureMaxMPa) {
      errors.pressure = `Давление больше ${LIMITS.pressureMaxMPa} МПа не бывает. Возможно, давление указано в атм? Переключите единицу на «атм».`;
    } else if (unit !== UNITS.MPA && pressure > LIMITS.pressureMaxAtm) {
      errors.pressure = `Давление больше ${LIMITS.pressureMaxAtm} атм не бывает. Проверьте показание манометра.`;
    }
  }
  if (isNum(flow)) {
    if (!(flow > 0)) errors.flow = 'Скорость потока должна быть больше нуля';
    else if (flow < LIMITS.flowMin || flow > LIMITS.flowMax) {
      errors.flow = `Скорость потока — от ${fmt1(LIMITS.flowMin)} до ${LIMITS.flowMax} л/мин`;
    }
  }
  if (isNum(reserveAtm)) {
    if (reserveAtm < 0) errors.reserve = 'Резерв не может быть отрицательным (0 — без резерва)';
    else if (reserveAtm >= LIMITS.pressureMaxAtm) {
      errors.reserve = 'Резерв давления больше рабочего давления баллона. Проверьте значение.';
    }
  }
  return errors;
}

// Полный расчёт. Возвращает { error } (первая ошибка) или
// { minutes, maxMinutes, empty, pressureAtm, reserveAtm, highFlow }.
// Время округляется вниз — в безопасную сторону.
export function computeO2Time({ volume, pressure, unit, flow, reserveAtm }) {
  if (!(volume > 0) || !(pressure > 0) || !(flow > 0)) {
    return { error: 'Объём, давление и скорость потока должны быть числами больше нуля' };
  }
  if (!(reserveAtm >= 0)) {
    return { error: 'Резерв давления должен быть числом не меньше нуля (0 — без резерва)' };
  }
  const errors = validateO2Fields({ volume, pressure, unit, flow, reserveAtm });
  const first = errors.volume || errors.pressure || errors.flow || errors.reserve;
  if (first) return { error: first };

  const pressureAtm = toAtm(pressure, unit);
  const maxMinutes = Math.floor((volume * pressureAtm) / flow);
  const usableAtm = pressureAtm - reserveAtm;
  const empty = usableAtm <= 0;
  const minutes = empty ? 0 : Math.floor((volume * usableAtm) / flow);
  return {
    minutes,
    maxMinutes,
    empty,
    pressureAtm,
    reserveAtm,
    highFlow: flow > LIMITS.flowWarn,
  };
}
