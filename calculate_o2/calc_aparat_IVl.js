// Calc_aparat_IVL_pretty.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput } from '../components/AppText';
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

// I:E в виде «1:2» или «1/2» (дробные части — через точку или запятую); null, если ввод некорректен
const parseIE = (s) => {
  const parts = String(s ?? '').split(/[:/]/).map(parseNum);
  return parts.length === 2 && parts.every((x) => x > 0) ? parts : null;
};

// Число с десятичной запятой; '—', если значения нет
const fmt = (x) => (x === null || x === undefined || !Number.isFinite(x) ? '—' : String(x).replace('.', ','));

// Время вдоха/выдоха: до 0,5 с — две цифры после запятой, иначе одна (Ttot = 60 / ЧДД)
const roundT = (t) => (t < 0.5 ? Math.round(t * 100) / 100 : Math.round(t * 10) / 10);

// Защитный ДО: 6–8 мл/кг идеальной массы (ERC-ESICM 2021 Post-resuscitation care; ARDSNet, NEJM 2000);
// у детей 5–8 мл/кг (PEMVECC 2017). Вне 4–8 мл/кг — предупреждение.
const VT_PER_KG_MIN = 4;
const VT_PER_KG_MAX = 8;
// Pplat ≤ 30 см вод. ст. — защитная цель (ARDSNet, NEJM 2000)
const PPLAT_MAX = 30;
// Pmax должен быть выше ПДКВ хотя бы на 10 см вод. ст. — иначе аппарат не доставит ДО
const PMAX_PEEP_MARGIN = 10;

// Идеальная (предсказанная) масса тела взрослого — ARDSNet, NEJM 2000:
// муж 50 + 0,91 × (рост − 152,4); жен 45,5 + 0,91 × (рост − 152,4). Рост 130–230 см.
const HEIGHT_MIN = 130;
const HEIGHT_MAX = 230;
const idealBodyWeight = (sex, heightCm) => {
  if (!Number.isFinite(heightCm) || heightCm < HEIGHT_MIN || heightCm > HEIGHT_MAX) return undefined;
  return (sex === 'f' ? 45.5 : 50) + 0.91 * (heightCm - 152.4);
};

// Ожидаемая масса по возрасту — APLS 2011 (единая формула для приложения):
// 0–12 мес: 0,5 × мес + 4; 1–5 лет: 2 × лет + 8; 6–12 лет: 3 × лет + 7. Старше 12 лет — не оцениваем.
const expectedWeightApls = (months) => {
  if (!Number.isFinite(months) || months < 0) return undefined;
  if (months < 12) return 0.5 * months + 4;
  const years = Math.floor(months / 12);
  if (years <= 5) return 2 * years + 8;
  if (years <= 12) return 3 * years + 7;
  return undefined;
};

// ЧДД при СЛР у интубированного ребёнка (вентиляция асинхронно с компрессиями) —
// ERC 2021 Paediatric Life Support (НСР 2021): до 1 года 25, 1–8 лет 20, 8–12 лет 15, старше 12 лет 10/мин.
const childArrestRr = (months) => {
  if (months < 12) return 25;
  if (months <= 96) return 20;
  if (months <= 144) return 15;
  return 10;
};

// ЧДД ребёнка вне остановки — нижняя граница возрастной нормы (таблица «Физиологические нормы»
// приложения, fiz_norm/pediatric_norms_screen.js); далее титровать по EtCO₂/PaCO₂.
// Отдельной возрастной ЧДД для старта ИВЛ в КР МЗ РФ, ERC 2021 и PEMVECC 2017 нет — взят возрастной минимум.
const childNonArrestRr = (months) => {
  if (months < 3) return 40;
  if (months < 6) return 35;
  if (months < 12) return 33;
  if (months < 24) return 30;
  if (months < 60) return 26;
  if (months < 96) return 25;
  if (months < 120) return 22;
  if (months < 144) return 20;
  if (months < 168) return 18;
  return 16;
};

// Возможности аппаратов — по паспортам производителей
const CAPS = {
  // MEDUMAT Standard² (Weinmann), брошюра, Technical data: Vt 50–2000 мл, f 5–50/мин, Pmax 10–65 мбар,
  // PEEP 0–30 мбар, I:E 1:4–4:1, поток до 80 л/мин (паспортного предела МОД нет). FiO₂: 100 % O₂ или Air Mix.
  medumat2: {
    label: 'MEDUMAT Standard²', short: 'Standard²',
    vtMin: 50, vtMax: 2000,           // мл
    rrMin: 5, rrMax: 50,              // /мин
    pmaxMin: 10, pmaxMax: 65,         // см H2O (1 мбар ≈ 1 см H2O)
    peepMin: 0, peepMax: 30,          // см H2O
    ieMin: 1 / 4, ieMax: 4,           // отношение I/E
    o2Switch: true,
  },
  // MEDUMAT Standard (Weinmann, прежняя модель), руководство EN, раздел 11: f 8–40/мин, МОД 3–20 л/мин,
  // Pmax 20–60 мбар, I:E фиксировано 1:1,67, ПДКВ — только внешним клапаном. На аппарате задают МОД и f.
  medumatStd: {
    label: 'MEDUMAT Standard', short: 'Standard',
    rrMin: 8, rrMax: 40,
    veMin: 3, veMax: 20,              // л/мин
    pmaxMin: 20, pmaxMax: 60,
    ieFixed: [1, 1.67],
    peepExternal: true,
    setsMinuteVolume: true,
    o2Switch: true,
  },
  // А-ИВЛ/ВВЛ/ВЧп-4/40 («Медпром», medprom.spb.ru/products/4-40): ИВЛ 10–60/мин (ВЧ 90–360/мин —
  // отдельный режим, I:E 1:1, расчёт по мл/кг к нему не применяется); МОД 1–30 л/мин; ограничение давления
  // 15–50 см вод. ст.; I:E 1:2; 1:1,5; 1:1; 1,5:1; 2:1; FiO₂ 50/60/70/80/100 %; для пациентов от 1 года.
  // У детей 1–6 лет: давление 9–36 см вод. ст., МОД 0,7–10 л/мин. ДО в режиме ИВЛ отдельно не нормирован.
  ivl440: {
    label: 'А-ИВЛ/ВВЛ/ВЧп-4/40', short: 'ИВЛ 4/40',
    rrMin: 10, rrMax: 60,
    veMin: 1, veMax: 30,
    pmaxMin: 15, pmaxMax: 50,
    // ПДКВ в паспорте аппарата не нормировано (medprom.spb.ru/products/4-40) — только внешним клапаном.
    peepExternal: true,
    ieList: [[1, 2], [1, 1.5], [1, 1], [1.5, 1], [2, 1]],
    fio2List: [50, 60, 70, 80, 100],
    minAgeMonths: 12,
    setsMinuteVolume: true,
    // Дети 1–6 лет (до 7 лет — консервативно, более узкие пределы)
    child: { maxAgeMonths: 83, pmaxMin: 9, pmaxMax: 36, veMin: 0.7, veMax: 10 },
  },
};

// Сценарии
const PRESETS = {
  arrest: {
    title: 'ИВЛ при остановке кровообращения (СЛР)',
    seg: 'Остановка (СЛР)',
    vtPerKg: 6,     // мл/кг ИМТ; ERC 2021 ALS/BLS — 6–7 мл/кг (≈500–600 мл у взрослого)
    rrAdult: 10,    // /мин; ERC 2021 ALS — 10/мин при протекции дыхательных путей
    peep: 5,        // см H2O; ERC/AHA ПДКВ при СЛР не задают, экспертно 0–5 (Orso и соавт., Respir Care 2021)
    pmaxTube: 45,   // см H2O; руководство Weinmann MEDUMAT Standard, с. 24: интубация — 45 мбар (компрессии повышают давление)
    pmaxMask: 20,   // см H2O; там же: маска — 20 мбар (профилактика раздувания желудка)
    fio2: 100,      // % (ERC 2021)
    ie: '1:2',
  },
  nonArrest: {
    title: 'ИВЛ без остановки / после ROSC',
    seg: 'Без остановки / ROSC',
    vtPerKg: 6,     // 6–8 мл/кг ИМТ, старт 6 (ERC-ESICM 2021 Post-resuscitation care)
    rrAdult: 14,    // 12–16/мин, далее по PaCO₂ 35–45 мм рт. ст. (ERC-ESICM 2021)
    peep: 5,        // 5–10 см H2O
    pmaxTube: 30,   // предел пикового давления; Pplat ≤ 30 (ARDSNet) — консервативный старт
    pmaxMask: 20,   // маска — 20 мбар (руководство Weinmann MEDUMAT Standard, с. 24)
    fio2: 100,      // старт 100 %, далее к SpO₂ 94–98 % (ERC-ESICM 2021)
    ie: '1:2',
  },
};

const ratioText = ([i, e]) => `${fmt(i)}:${fmt(e)}`;

// Подсказка по аппарату — из CAPS
export const deviceHint = (key) => {
  const c = CAPS[key];
  const parts = [];
  if (c.vtMin !== undefined) parts.push(`Vt ${c.vtMin}–${c.vtMax} мл`);
  else parts.push('Vt отдельно не задаётся — выставляют МОД и ЧДД');
  parts.push(`ЧДД ${c.rrMin}–${c.rrMax}/мин${key === 'ivl440' ? ' (ВЧ 90–360 — отдельный режим, расчёт по мл/кг не применим)' : ''}`);
  if (c.veMin !== undefined) parts.push(`МОД ${fmt(c.veMin)}–${c.veMax} л/мин`);
  parts.push(`Pmax ${c.pmaxMin}–${c.pmaxMax}`);
  parts.push(c.peepExternal ? 'ПДКВ — только внешним клапаном' : `ПДКВ ${c.peepMin}–${c.peepMax}`);
  if (c.ieFixed) parts.push(`I:E фиксировано ${ratioText(c.ieFixed)}`);
  else if (c.ieList) parts.push(`I:E ${c.ieList.map(ratioText).join('; ')}`);
  else parts.push(`I:E 1:${1 / c.ieMin}–${c.ieMax}:1`);
  if (c.fio2List) parts.push(`FiO₂ ${c.fio2List.join('/')} %`);
  if (c.o2Switch) parts.push('FiO₂: 100 % O₂ или Air Mix');
  if (c.child) parts.push(`дети 1–6 лет: Pmax ${c.child.pmaxMin}–${c.child.pmaxMax}, МОД ${fmt(c.child.veMin)}–${c.child.veMax} л/мин; от 1 года`);
  return `${c.label}: ${parts.join(', ')}.`;
};

// Пресет давления: маска или трубка/НВУ, не выше возможностей аппарата
export const pmaxPresetFor = (scenario, airway, caps) => {
  const p = PRESETS[scenario];
  const base = airway === 'mask' ? p.pmaxMask : p.pmaxTube;
  return Math.max(caps.pmaxMin, Math.min(base, caps.pmaxMax));
};

// Пресет ЧДД: взрослые — из сценария, дети — по возрасту; null, если возраст ребёнка не введён
export const rrPresetFor = (scenario, group, months) => {
  if (group === 'adult') return PRESETS[scenario].rrAdult;
  if (!Number.isFinite(months)) return null;
  return scenario === 'arrest' ? childArrestRr(months) : childNonArrestRr(months);
};

// Возраст ребёнка в месяцах из полей «лет» и «мес»
export const ageMonthsFrom = (ageY, ageM) => {
  const y = parseNum(ageY);
  const m = parseNum(ageM);
  if (y === undefined && m === undefined) return undefined;
  if ((y !== undefined && (y < 0 || y > 17)) || (m !== undefined && (m < 0 || m > 11))) return NaN;
  return (y ?? 0) * 12 + (m ?? 0);
};

// Эффективные пределы аппарата с учётом детских ограничений
export const effectiveCaps = (device, group, months) => {
  const c = CAPS[device];
  if (c.child && group === 'child' && Number.isFinite(months) && months <= c.child.maxAgeMonths) {
    return { ...c, ...c.child, childLimits: true };
  }
  return c;
};

// Основной расчёт (без React): возвращает значения, подсветку и предупреждения
export const computeIvl = (s) => {
  const warnings = [];
  const months = s.group === 'child' ? ageMonthsFrom(s.ageY, s.ageM) : undefined;
  const caps = effectiveCaps(s.device, s.group, months);

  // Масса для расчёта ДО
  let mass;
  let massBasis = null; // 'ibw' | 'actual' | 'apls'
  const wActual = parseNum(s.weight);
  const wOk = wActual !== undefined && wActual > 0 && wActual <= 250;
  if (wActual !== undefined && !wOk) warnings.push('Масса вне 0–250 кг — проверьте ввод.');

  if (s.group === 'adult') {
    const h = parseNum(s.height);
    const ibw = idealBodyWeight(s.sex, h);
    if (ibw !== undefined) {
      mass = ibw; massBasis = 'ibw';
    } else {
      if (h !== undefined) warnings.push(`Рост вне ${HEIGHT_MIN}–${HEIGHT_MAX} см — идеальная масса не рассчитана.`);
      if (wOk) {
        mass = wActual; massBasis = 'actual';
        warnings.push('ДО рассчитан на фактическую массу — при ожирении завышен. Введите рост и пол: расчёт пойдёт по идеальной массе.');
      }
    }
    if (wOk && wActual < 40) warnings.push('Масса < 40 кг — проверьте группу: для детей выберите «Ребёнок».');
  } else {
    if (Number.isNaN(months)) warnings.push('Возраст: лет 0–17, мес 0–11 — проверьте ввод.');
    else if (months === undefined) warnings.push('Введите возраст ребёнка — от него зависят ЧДД и пределы аппарата.');
    if (wOk) {
      mass = wActual; massBasis = 'actual';
    } else {
      const est = expectedWeightApls(months);
      if (est !== undefined) { mass = est; massBasis = 'apls'; }
      else if (Number.isFinite(months)) warnings.push('Старше 12 лет масса по возрасту не оценивается — введите массу.');
    }
    if (mass !== undefined) warnings.push('У ребёнка ДО считается на фактическую массу (или по возрасту, APLS); при ожирении — на должную массу по росту.');
  }

  const vtPerKgN = parseNum(s.vtPerKg);
  const vt = mass !== undefined && vtPerKgN > 0 ? Math.round(vtPerKgN * mass) : null; // мл
  const rrN = parseNum(s.rr);
  const rrOk = rrN !== undefined && rrN > 0;
  const ve = vt !== null && rrOk ? Math.round((vt / 1000) * rrN * 100) / 100 : null; // л/мин

  // Времена вдоха/выдоха из I:E (Ttot = 60 / ЧДД); без молчаливой подстановки 1:2
  const ieParts = caps.ieFixed || parseIE(s.ie);
  let inspT = null;
  let expT = null;
  if (ieParts && rrOk) {
    const cycleT = 60 / rrN;
    const ti = cycleT * (ieParts[0] / (ieParts[0] + ieParts[1]));
    inspT = roundT(ti);
    expT = roundT(cycleT - ti);
  }
  if (!caps.ieFixed && !ieParts) warnings.push('I:E не распознано — введите в виде 1:2.');

  // Подсветка: выход за возможности аппарата и за клинически безопасные пределы
  const out = (x, lo, hi) => x !== null && x !== undefined && ((lo !== undefined && x < lo) || (hi !== undefined && x > hi));

  let vtTone = 'default';
  if (vt !== null) {
    if (out(vt, caps.vtMin, caps.vtMax)) {
      vtTone = 'bad';
      warnings.push(`ДО ${vt} мл вне возможностей аппарата (${caps.vtMin}–${caps.vtMax} мл).`);
    }
    if (vtPerKgN < VT_PER_KG_MIN || vtPerKgN > VT_PER_KG_MAX) {
      vtTone = 'bad';
      warnings.push(`ДО ${fmt(vtPerKgN)} мл/кг вне защитного диапазона ${VT_PER_KG_MIN}–${VT_PER_KG_MAX} мл/кг (рекомендуется 6–8 мл/кг идеальной массы).`);
    }
  }

  const veTone = out(ve, caps.veMin, caps.veMax) ? 'bad' : 'default';
  if (veTone === 'bad') warnings.push(`МОД ${fmt(ve)} л/мин вне возможностей аппарата (${fmt(caps.veMin)}–${caps.veMax} л/мин).`);

  const rrTone = !rrOk || out(rrN, caps.rrMin, caps.rrMax) ? 'bad' : 'default';
  if (rrOk && rrTone === 'bad') warnings.push(`ЧДД ${fmt(rrN)}/мин вне возможностей аппарата (${caps.rrMin}–${caps.rrMax}/мин).`);

  const peepN = parseNum(s.peep);
  const pmaxN = parseNum(s.pmax);
  const peepTone = peepN === undefined || peepN < 0 || (!caps.peepExternal && out(peepN, caps.peepMin, caps.peepMax)) ? 'bad' : 'default';
  if (peepN !== undefined && peepTone === 'bad') {
    warnings.push(caps.peepExternal
      ? 'ПДКВ не может быть отрицательным.'
      : `ПДКВ ${fmt(peepN)} вне возможностей аппарата (${caps.peepMin}–${caps.peepMax} см вод. ст.).`);
  }
  if (caps.peepExternal) warnings.push('ПДКВ на этом аппарате — только внешним клапаном ПДКВ.');

  let pmaxTone = pmaxN === undefined || out(pmaxN, caps.pmaxMin, caps.pmaxMax) ? 'bad' : 'default';
  if (pmaxN !== undefined && pmaxTone === 'bad') {
    warnings.push(`Pmax ${fmt(pmaxN)} вне возможностей аппарата (${caps.pmaxMin}–${caps.pmaxMax} см вод. ст.${caps.childLimits ? ', дети до 7 лет' : ''}).`);
  }
  if (pmaxN !== undefined && peepN !== undefined && pmaxN < peepN + PMAX_PEEP_MARGIN) {
    pmaxTone = 'bad';
    warnings.push(`Pmax должен быть выше ПДКВ хотя бы на ${PMAX_PEEP_MARGIN} см вод. ст. — иначе ДО не будет доставлен.`);
  }

  // I:E по возможностям аппарата; инверсия — риск ауто-ПДКВ
  let ieTone = 'default';
  if (ieParts && !caps.ieFixed) {
    const r = ieParts[0] / ieParts[1];
    const inList = caps.ieList ? caps.ieList.some(([i, e]) => Math.abs(i / e - r) < 0.01) : true;
    if (!inList || out(r, caps.ieMin, caps.ieMax)) {
      ieTone = 'bad';
      warnings.push(`I:E ${ratioText(ieParts)} аппарат не поддерживает.`);
    }
    if (r > 1) warnings.push('Вдох длиннее выдоха (инверсия I:E) — риск ауто-ПДКВ и падения АД.');
  }

  // FiO₂
  let fio2Text;
  let fio2Tone = 'default';
  if (caps.o2Switch) {
    fio2Text = s.o2Mode === 'airmix' ? 'Air Mix (< 100 %)' : '100 % O₂';
  } else {
    const f = parseNum(s.fio2);
    fio2Text = f === undefined ? '—' : `${fmt(f)} %`;
    if (f === undefined || f < 21 || f > 100) {
      fio2Tone = 'bad';
      warnings.push('FiO₂ — от 21 до 100 %.');
    } else if (caps.fio2List && !caps.fio2List.includes(f)) {
      fio2Tone = 'bad';
      warnings.push(`FiO₂ на этом аппарате — только ${caps.fio2List.join(', ')} %.`);
    }
  }

  // Ограничения по возрасту для аппарата
  if (caps.minAgeMonths !== undefined && s.group === 'child') {
    const tooYoung = Number.isFinite(months) ? months < caps.minAgeMonths : (wOk && wActual < 10);
    if (tooYoung) warnings.push(`${caps.label} предназначен для пациентов от 1 года.`);
  }
  if (caps.childLimits) warnings.push(`Ребёнок до 7 лет: детские пределы аппарата (Pmax ${caps.pmaxMin}–${caps.pmaxMax}, МОД ${fmt(caps.veMin)}–${fmt(caps.veMax)} л/мин).`);

  // Что выставлять на аппаратах, где задают МОД и ЧДД
  if (caps.setsMinuteVolume && ve !== null && rrOk) {
    warnings.unshift(`На аппарате задают МОД ${fmt(ve)} л/мин и ЧДД ${fmt(rrN)}/мин (ДО = МОД / ЧДД).`);
  }

  return {
    caps, months, mass: mass === undefined ? null : Math.round(mass * 10) / 10, massBasis,
    vt, ve, rrN, inspT, expT, peepN, pmaxN, fio2Text,
    tones: { vt: vtTone, ve: veTone, rr: rrTone, peep: peepTone, pmax: pmaxTone, ie: ieTone, fio2: fio2Tone },
    warnings,
  };
};

const MASS_BASIS = { ibw: 'идеальная', actual: 'фактическая', apls: 'по возрасту (APLS)' };

export default function Calc_aparat_IVL_pretty() {
  // Памятки формируются из PRESETS, чтобы не расходиться с пресетами
  const A = PRESETS.arrest;
  const N = PRESETS.nonArrest;
  const original1Body =
    `-FiO₂: ${A.fio2} %;\n` +
    `-ДО: ${A.vtPerKg} мл/кг идеальной массы (ERC 2021: 6–7 мл/кг);\n` +
    `-ЧДД: взрослые ${A.rrAdult}/мин; дети: до 1 года 25, 1–8 лет 20, 8–12 лет 15, старше 12 лет 10/мин (ERC 2021);\n` +
    `-Pmax (предел давления аппарата): трубка/НВУ ${A.pmaxTube}, маска ${A.pmaxMask} см вод. ст. (Weinmann) — компрессии повышают давление в контуре;\n` +
    '-ПДКВ: 0–5 см вод. ст. (ERC/AHA ПДКВ при СЛР не задают — экспертное мнение).';

  const original2Body =
    `-FiO₂: ${N.fio2} % на старте, затем к SpO₂ 94–98 %;\n` +
    `-ДО: 6–8 мл/кг идеальной массы (старт ${N.vtPerKg});\n` +
    `-ЧДД: взрослые 12–16 (старт ${N.rrAdult}), дети — по возрастной норме; цель PaCO₂ 35–45 мм рт. ст.;\n` +
    `-Pplat ≤ ${PPLAT_MAX} см вод. ст. — защитная цель;\n` +
    `-Pmax (предел аппарата): на 5–10 выше пикового давления при заданном ДО; старт ${N.pmaxTube}, маска ${N.pmaxMask} см вод. ст.;\n` +
    `-ПДКВ: 5–10 см вод. ст. (старт ${N.peep}).`;

  const [device, setDevice] = useState('medumat2'); // 'medumat2' | 'medumatStd' | 'ivl440'
  const [scenario, setScenario] = useState('arrest'); // 'arrest' | 'nonArrest'
  const [group, setGroup] = useState('adult');        // 'adult' | 'child'
  const [airway, setAirway] = useState('tube');       // 'tube' | 'mask'
  const p = PRESETS[scenario];

  // Inputs
  const [sex, setSex] = useState('m');
  const [height, setHeight] = useState('');           // см
  const [weight, setWeight] = useState('70');         // кг (у взрослых — фактическая, справочно)
  const [ageY, setAgeY] = useState('');
  const [ageM, setAgeM] = useState('');
  const [vtPerKg, setVtPerKg] = useState(String(p.vtPerKg));
  const [rr, setRr] = useState(String(p.rrAdult));
  const [peep, setPeep] = useState(String(p.peep));
  const [pmax, setPmax] = useState(String(p.pmaxTube));
  const [fio2, setFio2] = useState(String(p.fio2));
  const [o2Mode, setO2Mode] = useState('o2');         // MEDUMAT: 'o2' | 'airmix'
  const [ie, setIe] = useState(p.ie);

  const months = group === 'child' ? ageMonthsFrom(ageY, ageM) : undefined;
  const rrPreset = rrPresetFor(scenario, group, months);
  const pmaxPreset = pmaxPresetFor(scenario, airway, effectiveCaps(device, group, months));

  // При смене сценария — подставляем пресет
  useEffect(() => {
    setVtPerKg(String(p.vtPerKg));
    setPeep(String(p.peep));
    setFio2(String(p.fio2));
    setO2Mode('o2');
    setIe(p.ie);
  }, [scenario]);

  // При смене группы: у ребёнка масса пустая (оценка по возрасту), у взрослого — 70 кг справочно
  useEffect(() => {
    setWeight(group === 'adult' ? '70' : '');
  }, [group]);

  // ЧДД — по сценарию и возрасту; Pmax — по дыхательным путям и пределам аппарата
  useEffect(() => {
    // Возраст ребёнка не введён — ЧДД не подставляем (на экране «—» и просьба ввести возраст)
    setRr(rrPreset === null ? '' : String(rrPreset));
  }, [rrPreset, scenario]);
  useEffect(() => {
    setPmax(String(pmaxPreset));
  }, [pmaxPreset, scenario]);

  const r = useMemo(
    () => computeIvl({ device, group, sex, height, weight, ageY, ageM, vtPerKg, rr, peep, pmax, fio2, o2Mode, ie }),
    [device, group, sex, height, weight, ageY, ageM, vtPerKg, rr, peep, pmax, fio2, o2Mode, ie]
  );
  const caps = r.caps;
  const hintDevice = useMemo(() => deviceHint(device), [device]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Header />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Памятки */}
        <Card
          title={A.title}
          right={<MaterialCommunityIcons name="alert-decagram-outline" size={20} color={theme.bgDark} />}
        >
          <Text style={styles.memoBody}>{original1Body}</Text>
        </Card>

        <Card
          title={N.title}
          right={<MaterialCommunityIcons name="clipboard-text-outline" size={20} color={theme.bgDark} />}
        >
          <Text style={styles.memoBody}>{original2Body}</Text>
        </Card>

        {/* Калькулятор */}
        <Card
          title="Интерактивный калькулятор"
          right={<MaterialCommunityIcons name="calculator-variant" size={20} color={theme.bgDark} />}
        >
          <Text style={styles.help}>Выберите аппарат, сценарий и пациента — параметры подставятся автоматически, можно менять вручную.</Text>

          <Text style={styles.label}>Аппарат</Text>
          <Seg
            items={Object.keys(CAPS).map((k) => ({ label: CAPS[k].short, value: k }))}
            value={device}
            onChange={setDevice}
          />
          <Text style={styles.help}>{hintDevice}</Text>

          <View style={{ height: 8 }} />

          <Text style={styles.label}>Сценарий</Text>
          <Seg
            items={[
              { label: PRESETS.arrest.seg, value: 'arrest' },
              { label: PRESETS.nonArrest.seg, value: 'nonArrest' },
            ]}
            value={scenario}
            onChange={setScenario}
          />

          <Text style={styles.label}>Дыхательные пути</Text>
          <Seg
            items={[
              { label: 'Трубка / НВУ', value: 'tube' },
              { label: 'Маска', value: 'mask' },
            ]}
            value={airway}
            onChange={setAirway}
          />

          <Text style={styles.label}>Пациент</Text>
          <Seg
            items={[
              { label: 'Взрослый', value: 'adult' },
              { label: 'Ребёнок', value: 'child' },
            ]}
            value={group}
            onChange={setGroup}
          />

          <View style={{ height: 6 }} />

          {group === 'adult' ? (
            <>
              <Text style={styles.label}>Пол</Text>
              <Seg
                items={[
                  { label: 'Мужской', value: 'm' },
                  { label: 'Женский', value: 'f' },
                ]}
                value={sex}
                onChange={setSex}
              />
              <Row>
                <Field label="Рост" value={height} onChangeText={setHeight} unit="см" />
                <Field label="Масса факт." value={weight} onChangeText={setWeight} unit="кг" />
              </Row>
              <Text style={styles.help}>ДО считается на идеальную массу по росту и полу (ARDSNet). Фактическая масса — только если рост не введён.</Text>
            </>
          ) : (
            <>
              <Row>
                <Field label="Возраст" value={ageY} onChangeText={setAgeY} unit="лет" />
                <Field label="+ месяцев" value={ageM} onChangeText={setAgeM} unit="мес" />
              </Row>
              <Row>
                <Field label="Масса" value={weight} onChangeText={setWeight} unit="кг" placeholder="по возрасту" />
              </Row>
              <Text style={styles.help}>Пустая масса — оценка по возрасту (APLS). ЧДД при СЛР — по возрасту (ERC 2021); вне остановки — нижняя граница возрастной нормы, далее по EtCO₂/SpO₂.</Text>
            </>
          )}

          <Row>
            <Field label="ДО" value={vtPerKg} onChangeText={setVtPerKg} unit="мл/кг" />
            <Field label="ЧДД" value={rr} onChangeText={setRr} unit="/мин" />
          </Row>
          {caps.o2Switch ? (
            <>
              <Text style={styles.label}>FiO₂</Text>
              <Seg
                items={[
                  { label: '100 % O₂', value: 'o2' },
                  { label: 'Air Mix', value: 'airmix' },
                ]}
                value={o2Mode}
                onChange={setO2Mode}
              />
            </>
          ) : (
            <Row>
              <Field label="FiO₂" value={fio2} onChangeText={setFio2} unit="%" />
            </Row>
          )}
          <Row>
            <Field label="ПДКВ" value={peep} onChangeText={setPeep} unit="см H₂O" />
            <Field label="Pmax" value={pmax} onChangeText={setPmax} unit="см H₂O" />
          </Row>
          {caps.ieFixed ? (
            <Text style={styles.help}>I:E на этом аппарате фиксировано {ratioText(caps.ieFixed)}.</Text>
          ) : (
            <Row>
              <Field label="I:E" value={ie} onChangeText={setIe} unit="" keyboard="default" placeholder="1:2" />
            </Row>
          )}
          <Text style={styles.help}>
            {airway === 'mask'
              ? 'Через маску Pmax ≈20 см вод. ст. — профилактика раздувания желудка (Weinmann).'
              : 'Pmax — предел давления аппарата: на 5–10 см вод. ст. выше пикового давления при заданном ДО. Защитная цель — Pplat ≤ 30.'}
          </Text>
        </Card>

        {/* Результаты */}
        <Card
          title="Полученные параметры"
          right={<MaterialCommunityIcons name="chart-areaspline" size={20} color={theme.bgDark} />}
        >
          <Row style={{ flexWrap: 'wrap' }}>
            <Stat label="Масса для расчёта" value={r.mass === null ? '—' : `${fmt(r.mass)} кг`} />
            <Stat label="Основа" value={r.massBasis ? MASS_BASIS[r.massBasis] : '—'} tone={r.massBasis === 'actual' && group === 'adult' ? 'bad' : 'default'} />
            <Stat label="Дых. объём (VT)" value={r.vt === null ? '—' : `${r.vt} мл`} tone={r.tones.vt} />
            <Stat label="Минутная вентиляция (V̇E)" value={r.ve === null ? '—' : `${fmt(r.ve)} л/мин`} tone={r.tones.ve} />
            <Stat label="Вдох" value={r.inspT === null ? '—' : `${fmt(r.inspT)} с`} tone={r.tones.ie} />
            <Stat label="Выдох" value={r.expT === null ? '—' : `${fmt(r.expT)} с`} tone={r.tones.ie} />
          </Row>

          <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 10 }}>
            <Row style={{ flexWrap: 'wrap' }}>
              <Stat label="ЧДД" value={r.rrN === undefined ? '—' : `${fmt(r.rrN)}/мин`} tone={r.tones.rr} />
              <Stat label="ПДКВ" value={r.peepN === undefined ? '—' : `${fmt(r.peepN)} см`} tone={r.tones.peep} />
              <Stat label="Pmax" value={r.pmaxN === undefined ? '—' : `${fmt(r.pmaxN)} см`} tone={r.tones.pmax} />
              <Stat label="FiO₂" value={r.fio2Text} tone={r.tones.fio2} />
            </Row>
          </View>

          {r.warnings.length > 0 && (
            <View style={{ marginTop: 6 }}>
              {r.warnings.map((w) => (
                <Text key={w} style={styles.warn}>• {w}</Text>
              ))}
            </View>
          )}

          <View style={{ marginTop: 10 }}>
            <Text style={styles.help}>
              Советы: ДО 6–8 мл/кг идеальной массы, Pplat ≤ 30, ПДКВ ≈5 см вод. ст.; при СЛР — FiO₂ 100 %, ЧДД 10/мин у взрослых, у детей по возрасту. После ROSC — SpO₂ 94–98 %, PaCO₂ 35–45 мм рт. ст. (ERC-ESICM 2021).
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
  warn: { color: theme.bad, marginTop: 4 },
});
