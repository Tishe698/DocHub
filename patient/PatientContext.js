// PatientContext.js — общий пациент: вес, возраст, пол, рост вводятся один раз
// и подставляются во все калькуляторы. Хранится только в памяти (без AsyncStorage),
// чтобы данные прошлого вызова не попали к следующему пациенту.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import parseNum from '../utils/parseNum';
import {
  composeAgeMonths,
  estimateWeightApls,
  splitAgeMonths,
  zoneByHeight,
  zoneByKey,
  zoneByWeight,
} from './estimates';

export const EMPTY_PATIENT = Object.freeze({
  weightKg: null, // number | null
  weightSource: null, // 'entered' | 'broselow' | 'age' | null
  ageMonths: null, // полный возраст в месяцах; новорождённый (до 1 мес) — 0
  sex: null, // 'male' | 'female' | null
  heightCm: null, // number | null
  broselowZone: null, // ключ зоны из estimates.BROSELOW_ZONES | null
});

export const NUMBER_KEYS = ['weightKg', 'ageMonths', 'heightCm'];
const ADULT_MONTHS = 216; // 18 лет

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Применяет частичное изменение. Чистая функция (экспортируется для тестов).
//  - weightKg без явного weightSource → 'entered' (или null, если масса стёрта),
//    а выбранная зона Broselow сбрасывается: масса больше не взята с ленты;
//  - некорректные числа (NaN, отрицательные) превращаются в null.
export function applyPatientPatch(prev, partial) {
  if (!partial || typeof partial !== 'object') return prev;
  const next = { ...prev };
  for (const key of Object.keys(EMPTY_PATIENT)) {
    if (!(key in partial)) continue;
    let v = partial[key];
    if (NUMBER_KEYS.includes(key)) v = isNum(v) && v >= 0 ? v : null;
    next[key] = v === undefined ? null : v;
  }
  if ('weightKg' in partial && !('weightSource' in partial)) {
    next.weightSource = next.weightKg === null ? null : 'entered';
    if (!('broselowZone' in partial)) next.broselowZone = null;
  }
  if (next.weightKg === null) next.weightSource = null;
  const changed = Object.keys(EMPTY_PATIENT).some((k) => next[k] !== prev[k]);
  return changed ? next : prev;
}

// Производные значения. Чистая функция.
export function derivePatient(p) {
  const hasAge = isNum(p.ageMonths);
  const zone = zoneByHeight(p.heightCm) || zoneByKey(p.broselowZone) || zoneByWeight(p.weightKg);
  return {
    ageYears: hasAge ? p.ageMonths / 12 : null,
    isNeonate: hasAge ? p.ageMonths === 0 : null,
    isChild: hasAge ? p.ageMonths < ADULT_MONTHS : null,
    estimatedWeightKg: hasAge ? estimateWeightApls(p.ageMonths) : null,
    zone,
    // масса — оценка (по ленте Broselow или по возрасту), а не взвешивание/слова родителей
    weightIsEstimate: isNum(p.weightKg) && p.weightSource !== 'entered',
    hasData: Object.keys(EMPTY_PATIENT).some((k) => p[k] !== null),
  };
}

const noop = () => {};
const PatientContext = createContext({
  patient: EMPTY_PATIENT,
  setPatient: noop,
  resetPatient: noop,
  derived: derivePatient(EMPTY_PATIENT),
  resetCount: 0,
});

export function PatientProvider({ children, initialPatient }) {
  const [state, setState] = useState(() => ({
    patient: applyPatientPatch(EMPTY_PATIENT, initialPatient),
    resetCount: 0,
  }));

  const setPatient = useCallback((partial) => {
    setState((s) => {
      const patch = typeof partial === 'function' ? partial(s.patient) : partial;
      const next = applyPatientPatch(s.patient, patch);
      return next === s.patient ? s : { ...s, patient: next };
    });
  }, []);

  const resetPatient = useCallback(() => {
    setState((s) => ({ patient: EMPTY_PATIENT, resetCount: s.resetCount + 1 }));
  }, []);

  const value = useMemo(
    () => ({
      patient: state.patient,
      setPatient,
      resetPatient,
      derived: derivePatient(state.patient),
      // растёт при каждом «Новый пациент» — экраны могут сбрасывать свои поля
      resetCount: state.resetCount,
    }),
    [state, setPatient, resetPatient],
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

// { patient, setPatient(partial | (prev) => partial), resetPatient(), derived, resetCount }
export function usePatient() {
  return useContext(PatientContext);
}

const toText = (v) => (isNum(v) ? String(v) : '');

// Синхронизирует локальную строку поля со значением в контексте.
// Внешнее изменение (сброс, выбор зоны) перезаписывает строку; собственный ввод — нет.
function useSyncedText(value, format) {
  const [text, setText] = useState(() => format(value));
  const lastWritten = useRef(value);
  useEffect(() => {
    if (value !== lastWritten.current) {
      lastWritten.current = value;
      setText(format(value));
    }
  }, [value, format]);
  return [text, setText, lastWritten];
}

// Поле ввода, связанное с числовым полем пациента: 'weightKg' | 'heightCm' | 'ageMonths'.
// Возвращает { text, onChangeText, value }:
//  - text — строка для TextInput (набор «5,» не стирается);
//  - валидное число пишется в контекст, пустая строка — null, мусор — контекст не меняется;
//  - value — текущее число из контекста (или null).
export function usePatientNumber(key) {
  if (!NUMBER_KEYS.includes(key)) {
    throw new Error(
      `usePatientNumber: неизвестное поле «${key}», ожидается ${NUMBER_KEYS.join(', ')}`,
    );
  }
  const { patient, setPatient } = usePatient();
  const value = patient[key];
  const [text, setText, lastWritten] = useSyncedText(value, toText);

  const onChangeText = useCallback(
    (t) => {
      setText(t);
      const s = String(t ?? '').trim();
      if (!s) {
        lastWritten.current = null;
        setPatient({ [key]: null });
        return;
      }
      const n = parseNum(s);
      if (n === undefined || n < 0) return;
      const v = key === 'ageMonths' ? Math.floor(n) : n;
      lastWritten.current = v;
      setPatient({ [key]: v });
    },
    [key, setPatient, setText, lastWritten],
  );

  return { text, onChangeText, value };
}

// Возраст «лет + мес» двумя полями, связанными с patient.ageMonths.
// Возвращает { years: { text, onChangeText, value }, months: { … }, ageMonths, setNeonate() }.
// years.value / months.value — части полного возраста (5 лет 3 мес → 5 и 3).
export function usePatientAge() {
  const { patient, setPatient } = usePatient();
  const ageMonths = patient.ageMonths;
  const [texts, setTexts] = useState(() => splitToTexts(ageMonths));
  // textsRef — актуальные строки обоих полей (для склейки «лет + мес» без устаревшего замыкания)
  const textsRef = useRef(texts);
  const lastWritten = useRef(ageMonths);

  useEffect(() => {
    if (ageMonths !== lastWritten.current) {
      lastWritten.current = ageMonths;
      const next = splitToTexts(ageMonths);
      textsRef.current = next;
      setTexts(next);
    }
  }, [ageMonths]);

  const write = useCallback(
    (nextTexts) => {
      textsRef.current = nextTexts;
      setTexts(nextTexts);
      const yEmpty = !String(nextTexts.years).trim();
      const mEmpty = !String(nextTexts.months).trim();
      const y = yEmpty ? null : parseNum(nextTexts.years);
      const m = mEmpty ? null : parseNum(nextTexts.months);
      if (y === undefined || m === undefined) return; // набор не закончен или ошибка
      const total = composeAgeMonths(y, m);
      lastWritten.current = total;
      setPatient({ ageMonths: total });
    },
    [setPatient],
  );

  const onYears = useCallback((t) => write({ ...textsRef.current, years: t }), [write]);
  const onMonths = useCallback((t) => write({ ...textsRef.current, months: t }), [write]);
  const setNeonate = useCallback(() => write({ years: '0', months: '0' }), [write]);

  const parts = splitAgeMonths(ageMonths);
  return {
    years: { text: texts.years, onChangeText: onYears, value: parts ? parts.years : null },
    months: { text: texts.months, onChangeText: onMonths, value: parts ? parts.months : null },
    ageMonths,
    setNeonate,
  };
}

function splitToTexts(ageMonths) {
  const parts = splitAgeMonths(ageMonths);
  return parts
    ? { years: String(parts.years), months: String(parts.months) }
    : { years: '', months: '' };
}

export default PatientContext;
