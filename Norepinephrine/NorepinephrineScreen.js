// NorepinephrineScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, TextInput } from '../components/AppText';

// --- утилиты ---
// Только десятичная запись (запятая или точка); '0x1', '1e-1' и т. п. не принимаются
const NUM_RE = /^(\d+([.,]\d*)?|[.,]\d+)$/;
const parseNum = (v) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (s === '' || !NUM_RE.test(s)) return undefined;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

// Формат результата: малые значения — 2 значащие цифры (а не «0.00»),
// число знаков выбирается по уже округлённому значению (99.95 → «100», а не «100.0»)
const fmt = (v, d = 2) => {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs < 0.1) return String(Number(v.toPrecision(2)));
  let digits = abs >= 100 ? 0 : abs >= 10 ? Math.min(1, d) : d;
  let s = v.toFixed(digits);
  if (digits > 0 && Math.abs(Number(s)) >= 100) s = v.toFixed(0);
  else if (digits > 1 && Math.abs(Number(s)) >= 10) s = v.toFixed(1);
  return s;
};

// Эхо введённого числа без лишних нулей (1.5, а не «1.50»)
const echo = (v) => String(Number(v.toFixed(3)));

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

// --- константы препарата и пределы ---
// Инструкция РФ «Норэпинефрин» (МЭЗ, ГРЛС): 1 мл концентрата = 2 мг норэпинефрина битартрата
// = 1 мг основания; ампула 4 мл. Общее решение приложения: доза и мг — по основанию.
const BASE_MG_PER_ML = 1;       // мг основания в 1 мл концентрата
const AMPOULE_ML = 4;           // мл в ампуле (= 4 мг основания, 8 мг тартрата)
const TARTRATE_PER_BASE = 2;    // 2 мг тартрата = 1 мг основания

export const NOREPI_LIMITS = {
  // Диапазон массы для отсечения опечаток (аудит DocHub: ≈0,4–250 кг)
  weightMinKg: 0.4,
  weightMaxKg: 250,
  // Ниже — вероятная опечатка (неонатальные протоколы начинают с 0,01 мкг/кг/мин)
  doseLowWarn: 0.01,
  // PALS 2020: детям до 2; взрослым обычно 0,05–0,5 — выше 1 проверяем ввод
  doseSoftWarn: 1,
  // Инструкция «Норадреналин Агетан» (ГРЛС): максимум до 3–5 мкг/кг/мин тартрата = 1,5–2,5 основания
  doseMaxAdult: 2.5,
  // AHA PALS 2020: детям 0,1–2 мкг/кг/мин (масса < 40 кг считаем детской)
  doseMaxChild: 2,
  childWeightKg: 40,
  // Шаг стандартного шприцевого насоса 0,1 мл/ч
  pumpMinMlh: 0.1,
  pumpLowMlh: 1,
  pumpHighMlh: 30,
  // Самотёк неточен при редких каплях; очень частые — проверить разведение
  gttLow: 5,
  gttHigh: 60,
};

// Расчёт вынесен в чистую функцию: все проверки выполняются при каждом изменении ввода
export function calcNorepinephrine({ weight, dose, drugMg, syrVol, bagMg, bagDiluent, dropFactor }) {
  const L = NOREPI_LIMITS;
  const W = parseNum(weight);
  const D = parseNum(dose);       // мкг/кг/мин основания
  const M = parseNum(drugMg);     // мг основания в шприце
  const V = parseNum(syrVol);     // мл — итоговый объём раствора в шприце
  const BM = parseNum(bagMg);     // мг основания в пакете
  const BV = parseNum(bagDiluent); // мл растворителя в пакете
  const F = dropFactor === 60 ? 60 : 20;

  const errors = [];
  if (!(W > 0)) errors.push('Введите массу тела (кг).');
  else if (W < L.weightMinKg || W > L.weightMaxKg) {
    errors.push(`Масса ${echo(W)} кг вне диапазона 0,4–250 кг — проверьте ввод.`);
  }
  if (!(D > 0)) errors.push('Введите дозу (мкг/кг/мин основания).');
  if (errors.length) return { ok: false, errors };

  // Доза: ограничение установленным максимумом
  const isChild = W < L.childWeightKg;
  const doseMax = isChild ? L.doseMaxChild : L.doseMaxAdult;
  const Dcalc = Math.min(D, doseMax);
  const doseWarnings = [];
  if (D > doseMax) {
    doseWarnings.push({
      level: 'error',
      text: isChild
        ? `Доза ${echo(D)} выше предела для детей (2 мкг/кг/мин основания, PALS 2020; масса < 40 кг). Расчёт выполнен для 2. Проверьте ввод.`
        : `Доза ${echo(D)} выше максимума инструкции РФ (2,5 мкг/кг/мин основания = 5 тартрата). Расчёт выполнен для 2,5. Проверьте ввод.`,
    });
  } else if (D > L.doseSoftWarn) {
    doseWarnings.push({
      level: 'warn',
      text: `Доза ${echo(D)} выше 1 мкг/кг/мин основания (обычно взрослым 0,05–0,5) — проверьте ввод.`,
    });
  } else if (D < L.doseLowWarn) {
    doseWarnings.push({
      level: 'warn',
      text: 'Очень малая доза (< 0,01 мкг/кг/мин) — проверьте ввод.',
    });
  }

  const mcgMin = Dcalc * W;                 // мкг/мин основания
  const mgH = (mcgMin * 60) / 1000;         // мг/ч основания
  const doseInfo = {
    D, Dcalc, doseMax, isChild,
    mcgMin, mgH,
    doseTartrate: Dcalc * TARTRATE_PER_BASE,
    warnings: doseWarnings,
  };

  // --- ШПРИЦ-ПОМПА: M мг основания, итоговый объём V мл ---
  let syringe = null;
  if (M > 0 && V > 0) {
    const concMl = M / BASE_MG_PER_ML;      // мл концентрата
    const w = [];
    let ok = true;
    if (concMl > V) {
      ok = false;
      w.push({ level: 'error', text: `${echo(M)} мг основания — это ${echo(concMl)} мл концентрата, больше итогового объёма ${echo(V)} мл. Проверьте мг и объём.` });
    }
    if (ok) {
      const conc = (M * 1000) / V;          // мкг/мл основания
      const mlph = (mcgMin * 60) / conc;    // мл/ч
      // Инструкция РФ «Норэпинефрин»: концентрат вводят только после разведения в 5% декстрозе
      if (concMl === V) w.push({ level: 'warn', text: 'Концентрат не разведён — вводят только после разведения (инструкция РФ).' });
      if (!Number.isFinite(mlph)) ok = false;
      else if (mlph < L.pumpMinMlh) {
        w.push({ level: 'error', text: `Скорость ${fmt(mlph)} мл/ч ниже шага насоса (0,1 мл/ч) — разведите слабее (меньше мг или больше объём).` });
      } else if (mlph < L.pumpLowMlh) {
        w.push({ level: 'warn', text: `Скорость ${fmt(mlph)} мл/ч — меньше 1 мл/ч, точность насоса ниже. Лучше развести слабее.` });
      } else if (mlph > L.pumpHighMlh) {
        w.push({ level: 'warn', text: `Скорость ${fmt(mlph)} мл/ч — выше 30 мл/ч, шприца хватит на ${fmt(V / mlph, 1)} ч. Проверьте массу, дозу и мг; при верных данных можно развести концентрированнее.` });
      }
      syringe = {
        ok, conc, mlph, concMl,
        diluentMl: V - concMl,
        ampoules: concMl / AMPOULE_ML,
        tartrateMg: M * TARTRATE_PER_BASE,
        hoursPerSyringe: V / mlph,
        warnings: w,
      };
    } else {
      syringe = { ok: false, warnings: w };
    }
  }

  // --- КАПЕЛЬНИЦА: BM мг основания + BV мл растворителя (объём концентрата учитывается) ---
  let bag = null;
  if (BM > 0 && BV > 0) {
    const concMl = BM / BASE_MG_PER_ML;
    const total = BV + concMl;
    const conc = (BM * 1000) / total;       // мкг/мл основания
    const mlph = (mcgMin * 60) / conc;      // мл/ч
    const gttExact = (mlph / 60) * F;       // кап/мин
    const gtt = Math.round(gttExact);
    const w = [];
    if (gttExact < L.gttLow) {
      w.push({ level: 'warn', text: `${gttExact < 1 ? 'Меньше 1' : gtt} кап/мин — капельница неточна. Используйте шприцевой насос или разведите слабее.` });
    } else if (gttExact > L.gttHigh) {
      w.push({ level: 'warn', text: `${gtt} кап/мин (${fmt(mlph)} мл/ч) — много жидкости. Проверьте ввод или разведите концентрированнее.` });
    }
    bag = {
      ok: Number.isFinite(mlph),
      conc, mlph, total, concMl, gttExact, gtt, F,
      ampoules: concMl / AMPOULE_ML,
      warnings: w,
    };
  }

  return { ok: true, errors: [], dose: doseInfo, syringe, bag };
}

const WarnBox = ({ items }) =>
  items && items.length ? (
    <View style={{ marginTop: 8 }}>
      {items.map((it, i) => (
        <View
          key={i}
          style={[styles.warnBox, it.level === 'error' ? styles.warnError : it.level === 'warn' ? styles.warnWarn : styles.warnInfo]}
        >
          <Text style={[styles.warnText, it.level === 'error' ? { color: '#991b1b' } : { color: '#92400e' }]}>{it.text}</Text>
        </View>
      ))}
    </View>
  ) : null;

const Row = ({ label, value }) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={styles.resultValue}>{value}</Text>
  </View>
);

const Field = ({ label, value, onChange, placeholder, unit, hint }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#8b8b91"
        keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
        style={styles.input}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
    {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
  </View>
);

const Chips = ({ options, value, onChange, format = (o) => String(o) }) => (
  <View style={styles.chips}>
    {options.map((o) => {
      const active = String(o) === String(value);
      return (
        <TouchableOpacity key={String(o)} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(o)}>
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{format(o)}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function NorepinephrineScreen() {
  // Масса не подставляется заранее: забытый ввод у ребёнка не должен давать «взрослую» скорость
  const [weight, setWeight]   = useState('');     // кг
  const [dose, setDose]       = useState('0.1');  // мкг/кг/мин основания (= 0,2 тартрата, старт по инструкции РФ 0,1–0,3 тартрата)
  // Инструкция РФ «Норэпинефрин»: 2 мл концентрата (2 мг основания) + 48 мл 5% декстрозы = 40 мкг/мл основания
  const [drugMg, setDrugMg]   = useState('2');    // мг основания в шприце
  const [syrVol, setSyrVol]   = useState('50');   // мл — итоговый объём раствора
  // Инструкция РФ «Норэпинефрин»: 20 мл концентрата (20 мг основания) + 480 мл 5% декстрозы = 40 мкг/мл основания
  const [bagMg, setBagMg]     = useState('20');   // мг основания в пакете
  const [bagDil, setBagDil]   = useState('480');  // мл растворителя
  const [dropFactor, setDropFactor] = useState(20); // кап/мл

  const r = useMemo(
    () => calcNorepinephrine({ weight, dose, drugMg, syrVol, bagMg, bagDiluent: bagDil, dropFactor }),
    [weight, dose, drugMg, syrVol, bagMg, bagDil, dropFactor]
  );

  const reset = () => {
    setWeight(''); setDose(''); setDrugMg(''); setSyrVol(''); setBagMg(''); setBagDil('');
  };

  const s = r.ok ? r.syringe : null;
  const b = r.ok ? r.bag : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>💉 Норадреналин — расчёт инфузии</Text>
        <Text style={styles.subtitle}>
          Норадреналина тартрат 2 мг/мл = 1 мг/мл основания (ампула 4 мл = 4 мг основания).
          Доза и мг — по основанию.
        </Text>

        <Section title="Входные данные">
          <Field label="Масса тела" value={weight} onChange={setWeight} placeholder="кг" unit="кг" />
          <Field
            label="Доза (по основанию)"
            value={dose}
            onChange={setDose}
            placeholder="мкг/кг/мин"
            unit="мкг/кг/мин"
            hint="Инструкции РФ дают дозу по тартрату: старт 0,1–0,3 тартрата = 0,05–0,15 основания."
          />

          <Text style={styles.groupTitle}>Шприцевой насос</Text>
          <Field
            label="Норадреналин в шприце, мг основания"
            value={drugMg}
            onChange={setDrugMg}
            placeholder="мг"
            unit="мг"
            hint="1 мг основания = 1 мл концентрата (2 мг тартрата)."
          />
          <Field
            label="Итоговый объём раствора в шприце"
            value={syrVol}
            onChange={setSyrVol}
            placeholder="мл"
            unit="мл"
            hint="Концентрат + растворитель (5% глюкоза)."
          />

          <Text style={styles.groupTitle}>Капельница (пакет)</Text>
          <Field
            label="Норадреналин в пакете, мг основания"
            value={bagMg}
            onChange={setBagMg}
            placeholder="мг"
            unit="мг"
          />
          <Field
            label="Растворитель в пакете"
            value={bagDil}
            onChange={setBagDil}
            placeholder="мл"
            unit="мл"
            hint="5% глюкоза или 0,9% NaCl. Объём концентрата добавляется к растворителю."
          />
          <Chips options={[200, 250, 400, 480, 500]} value={bagDil} onChange={(o) => setBagDil(String(o))} format={(o) => `${o} мл`} />
          <Text style={[styles.label, { marginTop: 12 }]}>Капельная система</Text>
          <Chips options={[20, 60]} value={dropFactor} onChange={setDropFactor} format={(o) => `${o} кап/мл`} />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondary} onPress={reset}>
              <Text style={styles.secondaryText}>Сбросить</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Результаты">
          {!r.ok ? (
            <WarnBox items={r.errors.map((t) => ({ level: 'error', text: t }))} />
          ) : (
            <>
              <Row label="Доза в минуту (основание)" value={`${fmt(r.dose.mcgMin)} мкг/мин`} />
              <Row label="Доза в час (основание)" value={`${fmt(r.dose.mgH)} мг/ч`} />
              <Row label="То же по тартрату" value={`${fmt(r.dose.doseTartrate)} мкг/кг/мин`} />
              <WarnBox items={r.dose.warnings} />

              {/* Шприцевой насос */}
              <Text style={styles.groupTitle}>Шприцевой насос, в/в</Text>
              {!s ? (
                <Text style={styles.hint}>Введите мг и объём шприца.</Text>
              ) : (
                <>
                  {s.ok && (
                    <>
                      <Row label="Концентрация (основание)" value={`${fmt(s.conc)} мкг/мл`} />
                      <Row label="Скорость насоса" value={`${fmt(s.mlph)} мл/ч`} />
                      <Row
                        label="Приготовление"
                        value={`${fmt(s.concMl)} мл конц. (${fmt(s.ampoules)} амп. по 4 мл) + ${fmt(s.diluentMl)} мл`}
                      />
                      <Row label="Шприца хватит на" value={`${fmt(s.hoursPerSyringe, 1)} ч`} />
                    </>
                  )}
                  <WarnBox items={s.warnings} />
                </>
              )}

              {/* Капельница */}
              <Text style={styles.groupTitle}>Капельница, в/в</Text>
              {!b ? (
                <Text style={styles.hint}>Введите мг и объём растворителя.</Text>
              ) : (
                <>
                  <Row label="Общий объём" value={`${fmt(b.total, 1)} мл (${fmt(b.concMl)} мл конц., ${fmt(b.ampoules)} амп. по 4 мл)`} />
                  <Row label="Концентрация (основание)" value={`${fmt(b.conc)} мкг/мл`} />
                  <Row label="Скорость" value={`${fmt(b.mlph)} мл/ч`} />
                  <Row
                    label={`Капли в минуту (${b.F} кап/мл)`}
                    value={b.gttExact < 1 ? '< 1 кап/мин' : `${b.gtt} кап/мин`}
                  />
                  <WarnBox items={b.warnings} />
                </>
              )}
            </>
          )}

          <Text style={styles.hint}>
            Формула: мл/ч = доза (мкг/кг/мин) × масса × 60 / концентрация (мкг/мл), всё по основанию.{'\n'}
            {/* Инструкция РФ «Норэпинефрин» (МЭЗ): титрование шагом 0,05–0,1 мкг/кг/мин тартрата, центральный венозный доступ */}
            Титровать по АД шагом 0,05–0,1 мкг/кг/мин тартрата (0,025–0,05 основания).
            Предпочтительно шприцевой насос и центральная вена (инструкция РФ).{'\n'}
            Пример по инструкции: 2 мл концентрата + 48 мл 5% глюкозы = 40 мкг/мл основания.
          </Text>
        </Section>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- стили ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 32 },
  title: {
    color: '#1e293b', fontSize: 24, fontWeight: '800',
    letterSpacing: -0.5, textAlign: 'center', marginBottom: 8,
  },
  subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', fontWeight: '500', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#1e293b', fontWeight: '800', fontSize: 18, marginBottom: 12, letterSpacing: -0.3 },
  groupTitle: { color: '#1e293b', fontWeight: '700', fontSize: 16, marginTop: 12, marginBottom: 8 },
  card: {
    backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 16, padding: 16,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  row: { marginBottom: 16 },
  label: { color: '#374151', marginBottom: 8, fontWeight: '600', fontSize: 15 },
  fieldHint: { color: '#64748b', marginTop: 4, fontSize: 13 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderColor: '#d1d5db', borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  input: { flex: 1, color: '#1e293b', fontSize: 16, fontWeight: '500', paddingVertical: 0 },
  unit: { color: '#64748b', marginLeft: 8, fontWeight: '600', fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  chipActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  chipText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#1d4ed8' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'center' },
  secondary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  secondaryText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  resultLabel: { color: '#374151', fontWeight: '600', flex: 1, paddingRight: 12, fontSize: 15 },
  resultValue: { color: '#059669', fontWeight: '800', fontSize: 16, flexShrink: 1, textAlign: 'right' },
  warnBox: { borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 6 },
  warnError: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  warnWarn: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  warnInfo: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
  warnText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  hint: { color: '#64748b', marginTop: 12, fontStyle: 'italic', fontSize: 14, lineHeight: 20 },
});
