// Calc_aparat_IVL_pretty.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- THEME ---
const theme = {
  bg: '#0EA5E9',
  bgDark: '#0284C7',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#475569',
  line: '#E2E8F0',
  good: '#10B981',
  bad: '#EF4444',
};

// --- SMALL UI ---
const Header = () => (
  <View style={styles.header}>
    <View style={styles.headerOverlay} />
    <Text style={styles.headerTitle}>Проведение аппаратной {'\n'}ИВЛ</Text>
    <Text style={styles.headerSub}>Расчёты для СМП: MEDUMAT и А-ИВЛ/ВВЛ/ВЧп-4/40</Text>
  </View>
);

const Card = ({ title, children, right }) => (
  <View style={styles.card}>
    <View style={styles.cardHead}>
      <Text style={styles.cardTitle}>{title}</Text>
      {right}
    </View>
    {children}
  </View>
);

const Seg = ({ items, value, onChange }) => (
  <View style={styles.segWrap}>
    {items.map((it) => {
      const active = it.value === value;
      return (
        <Pressable
          key={it.value}
          onPress={() => onChange(it.value)}
          android_ripple={{ color: '#e2e8f0' }}
          style={[styles.segBtn, active && styles.segBtnActive]}
        >
          <Text style={[styles.segText, active && styles.segTextActive]}>{it.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const Row = ({ children, style }) => (
  <View style={[{ flexDirection: 'row', gap: 10, alignItems: 'center' }, style]}>{children}</View>
);

const Field = ({ label, value, onChangeText, unit, keyboard='numeric', flex=1, placeholder='-' }) => (
  <View style={{ flex }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <TextInput
        style={styles.input}
        keyboardType={keyboard}
        value={String(value ?? '')}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.line}
      />
      {!!unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
  </View>
);

const Stat = ({ label, value, tone='default' }) => {
  const color = tone === 'good' ? theme.good : tone === 'bad' ? theme.bad : theme.text;
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
};

// --- HELPERS ---
const parseNum = (s) => {
  if (s === '' || s === null || s === undefined) return undefined;
  const v = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(v) ? v : undefined;
};

// Возможности устройств (сводно)
const CAPS = {
  medumat: {
    vtMin: 50, vtMax: 2000,           // мл
    rrMin: 5, rrMax: 50,              // /мин
    veMin: 0.25, veMax: 20,           // л/мин
    pmaxMin: 10, pmaxMax: 65,         // см H2O
    peepMin: 0, peepMax: 20,          // см H2O (в ряде конфигураций до ~30)
    fio2: ['Air Mix', '100% O\u2082'],
  },
  ivl440: {
    vtMin: 50, vtMax: 2000,           // ориентир
    rrMin: 10, rrMax: 360,
    pmaxMin: 15, pmaxMax: 50,
    peepMin: 0, peepMax: 20,
    fio2: ['21–100%'],
  },
};

// Пресеты
const PRESETS = {
  arrest: {
    name: 'ИВЛ (остановка)',
    vtPerKg: 6,     // мл/кг
    rr: 10,         // /мин
    peep: 5,        // см H2O
    pmax: 30,       // см H2O
    fio2: 100,      // %
    ie: '1:2',
  },
  nonArrest: {
    name: 'ВВЛ (без остановки)',
    vtPerKg: 6,     // 6–8 мл/кг
    rr: 14,         // 12–16/мин
    peep: 5,        // 5–10 см H2O
    pmax: 30,       // ≤30–35 см H2O
    fio2: 100,      // старт 100%, далее титровать к SpO₂ 94–98%
    ie: '1:2',
  },
};

export default function Calc_aparat_IVL_pretty() {
  // Памятки (исправлены единицы давления на см вод. ст.)
  const original1 = 'ИВЛ (остановка кровообращения)';
  const original1Body =
    '-FiO2: 100%;\n' +
    '-ДО: 6 мл/кг;\n' +
    '-ЧДД: 10;\n' +
    '-максимально допустимое давление в контуре: ~30 см вод. ст.;\n' +
    '-ПДКВ: 5–10 см вод. ст.';

  const original2 = 'ВВЛ (без остановки)';
  const original2Body =
    '-FiO2: 100% (затем титровать);\n' +
    '-ДО: 8 мл/кг;\n' +
    '-ЧДД: 14–16;\n' +
    '-максимально допустимое давление в контуре: ~30 см вод. ст.;\n' +
    '-ПДКВ: 5–10 см вод. ст.';

  const [device, setDevice] = useState('medumat'); // 'medumat' | 'ivl440'
  const [scenario, setScenario] = useState('arrest'); // 'arrest' | 'nonArrest'
  const p = PRESETS[scenario];

  // Inputs
  const [weight, setWeight] = useState('70');         // кг
  const [vtPerKg, setVtPerKg] = useState(String(p.vtPerKg));
  const [rr, setRr] = useState(String(p.rr));
  const [peep, setPeep] = useState(String(p.peep));
  const [pmax, setPmax] = useState(String(p.pmax));
  const [fio2, setFio2] = useState(String(p.fio2));
  const [ie, setIe] = useState(p.ie);

  // При смене сценария — подставляем пресет
  useEffect(() => {
    setVtPerKg(String(p.vtPerKg));
    setRr(String(p.rr));
    setPeep(String(p.peep));
    setPmax(String(p.pmax));
    setFio2(String(p.fio2));
    setIe(p.ie);
  }, [scenario]);

  // Расчёты
  const w = parseNum(weight) ?? 0;
  const vt = Math.round((parseNum(vtPerKg) ?? 0) * w); // мл
  const vtL = vt / 1000;
  const rrN = parseNum(rr) ?? 0;
  const ve = Math.round(vtL * rrN * 100) / 100;        // л/мин

  // Времена вдоха/выдоха из I:E
  const [iRatio, eRatio] = (ie || '1:2').split(':').map((x) => parseFloat(x) || 1);
  const cycleT = rrN > 0 ? 60 / rrN : 0;
  const inspT = Math.round((cycleT * (iRatio / (iRatio + eRatio))) * 10) / 10;
  const expT  = Math.round((cycleT - inspT) * 10) / 10;

  // Контроль диапазонов устройства
  const caps = CAPS[device];
  const vtTone  = vt < caps.vtMin || vt > caps.vtMax ? 'bad' : 'default';
  const rrTone  = rrN < caps.rrMin || rrN > caps.rrMax ? 'bad' : 'default';
  const peepN = parseNum(peep) ?? 0;
  const pmaxN = parseNum(pmax) ?? 0;
  const peepTone = peepN < caps.peepMin || peepN > caps.peepMax ? 'bad' : 'default';
  const pmaxTone = pmaxN < caps.pmaxMin || pmaxN > caps.pmaxMax ? 'bad' : 'default';
  const veTone   = ve < caps.veMin || ve > caps.veMax ? 'bad' : 'default';

  const hintDevice = useMemo(() => {
    if (device === 'medumat') {
      return 'MEDUMAT: Vt 50–2000 мл, ЧДД 5–50/мин, Pmax 10–65, ПДКВ 0–20 (в ряде конфигураций до ~30).';
    }
    return 'А-ИВЛ/ВВЛ/ВЧп-4/40: ЧДД 10–360/мин, I:E 1:2–2:1, ПДКВ 0–20, Pmax 15–50.';
  }, [device]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Header />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Памятки */}
        <Card
          title={original1}
          right={<MaterialCommunityIcons name="alert-decagram-outline" size={20} color={theme.bgDark} />}
        >
          <Text style={styles.memoBody}>{original1Body}</Text>
        </Card>

        <Card
          title={original2}
          right={<MaterialCommunityIcons name="clipboard-text-outline" size={20} color={theme.bgDark} />}
        >
          <Text style={styles.memoBody}>{original2Body}</Text>
        </Card>

        {/* Калькулятор */}
        <Card
          title="Интерактивный калькулятор"
          right={<MaterialCommunityIcons name="calculator-variant" size={20} color={theme.bgDark} />}
        >
          <Text style={styles.help}>Выберите аппарат и сценарий — параметры подставятся автоматически, можно менять вручную.</Text>

          <Text style={styles.label}>Аппарат</Text>
          <Seg
            items={[
              { label: 'MEDUMAT', value: 'medumat' },
              { label: 'ИВЛ/ВВЛ 4/40', value: 'ivl440' },
            ]}
            value={device}
            onChange={setDevice}
          />

          <View style={{ height: 8 }} />

          <Text style={styles.label}>Сценарий</Text>
          <Seg
            items={[
              { label: 'ИВЛ (остановка)', value: 'arrest' },
              { label: 'ВВЛ (без остановки)', value: 'nonArrest' },
            ]}
            value={scenario}
            onChange={setScenario}
          />
          <Text style={styles.help}>{hintDevice}</Text>

          <View style={{ height: 10 }} />

          <Row>
            <Field label="Масса" value={weight} onChangeText={setWeight} unit="кг" />
            <Field label="ДО" value={vtPerKg} onChangeText={setVtPerKg} unit="мл/кг" />
          </Row>
          <Row>
            <Field label="ЧДД" value={rr} onChangeText={setRr} unit="/мин" />
            <Field label="FiO₂" value={fio2} onChangeText={setFio2} unit="%" />
          </Row>
          <Row>
            <Field label="ПДКВ" value={peep} onChangeText={setPeep} unit="см H₂O" />
            <Field label="Pmax" value={pmax} onChangeText={setPmax} unit="см H₂O" />
          </Row>
          <Row>
            <Field label="I:E" value={ie} onChangeText={setIe} unit="" keyboard="default" placeholder="1:2" />
          </Row>
        </Card>

        {/* Результаты */}
        <Card
          title="Полученные параметры"
          right={<MaterialCommunityIcons name="chart-areaspline" size={20} color={theme.bgDark} />}
        >
          <Row style={{ flexWrap: 'wrap' }}>
            <Stat label="Дых. объём (VT)" value={`${vt} мл`} tone={vtTone} />
            <Stat label="Минутная вентиляция (V̇E)" value={`${ve} л/мин`} />
            <Stat label="Вдох" value={`${inspT} с`} />
            <Stat label="Выдох" value={`${expT} с`} />
          </Row>

          <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 10 }}>
            <Row style={{ flexWrap: 'wrap' }}>
              <Stat label="ЧДД" value={`${rrN}/мин`} tone={rrTone} />
              <Stat label="ПДКВ" value={`${peepN} см`} tone={peepTone} />
              <Stat label="Pmax" value={`${pmaxN} см`} tone={pmaxTone} />
              <Stat label="FiO₂" value={`${fio2}%`} />
            </Row>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.help}>
              Советы: защитно ДО 6–8 мл/кг и ПДКВ ≈5 см вод. ст.; при СЛР — ЧДД ≈10/мин и FiO₂ 100%. После ROSC — титровать FiO₂ к SpO₂ 94–98%.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 18, paddingBottom: 22, paddingHorizontal: 16,
    backgroundColor: theme.bg, overflow: 'hidden',
  },
  headerOverlay: { position: 'absolute', inset: 0, backgroundColor: theme.bgDark, opacity: 0.18 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  card: {
    backgroundColor: theme.card, borderRadius: 16, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: theme.line,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, color: theme.text, fontWeight: '800' },

  segWrap: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 999, padding: 4, marginBottom: 8 },
  segBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 6 },
  segBtnActive: { backgroundColor: '#fff' },
  segText: { color: theme.sub, fontWeight: '700' },
  segTextActive: { color: '#111827' },

  label: { color: theme.sub, marginBottom: 6, fontWeight: '700' },
  inputWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 10, height: 48, alignItems: 'center', flexDirection: 'row' },
  input: { flex: 1, fontSize: 16, color: theme.text },
  unit: { color: theme.sub, marginLeft: 8 },

  memoBody: { color: theme.text, lineHeight: 22 },

  stat: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: theme.line, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, minWidth: '46%', flex: 1, marginBottom: 10,
  },
  statLabel: { color: theme.sub, marginBottom: 4 },
  statValue: { fontWeight: '800', fontSize: 18 },
  help: { color: theme.sub, marginTop: 8 },
});
