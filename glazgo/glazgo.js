import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text } from '../components/AppText';

// Источники экрана:
// - КР МЗ РФ «Черепно-мозговая травма у детей», 2025 (ID 493_3): прил. Г1 (ШКГ),
//   прил. Г2 (педиатрическая ШКГ, дети младше 4 лет), ключ интерпретации суммы,
//   тяжесть ЧМТ 13–15 / 9–12 / 3–8.
// - Teasdale G. et al., Lancet Neurol 2014: компоненты записываются отдельно (E·V·M),
//   при неоцениваемом компоненте (NT) сумма не указывается.
// - Modified GCS for Infants and Children (MSD Manual; James 1986) — формулировки
//   двигательного ответа для доречевых детей.
// - Brennan P.M. et al., J Neurosurg 2018;128:1612 — ШКГ-З (GCS-Pupils).

// Режим шкалы. Взрослая ШКГ — у взрослых и детей от 4 лет;
// педиатрическая — у детей младше 4 лет (КР «ЧМТ у детей», 2025, прил. Г2).
const MODES = [
  { id: 'adult', label: 'Взрослые и дети ≥ 4 лет' },
  { id: 'child', label: 'Дети < 4 лет' },
];

// Варианты «не оценивается» (NT): компонент нельзя оценить из-за местной причины.
// Обозначения C (глаза закрыты) и T (интубация) — Teasdale 2014; сумма при NT не считается.
const E_NT = { id: 'EC', nt: true, code: 'EC', label: 'Не оценить: глаза закрыты (отёк, повязка) — C' };
const V_NT_TUBE = { id: 'VT', nt: true, code: 'VT', label: 'Не оценить: интубация, трахеостома — T' };
const V_NT_OTHER = { id: 'VNT', nt: true, code: 'V-НО', label: 'Не оценить: афазия, глухота, языковой барьер' };
const M_NT = { id: 'MNT', nt: true, code: 'M-НО', label: 'Не оценить: миорелаксанты, травма спинного мозга' };

// Открывание глаз — одинаково для обеих шкал (КР «ЧМТ у детей», 2025, прил. Г1/Г2).
const E_OPTIONS = [
  { id: 'E4', score: 4, label: 'Произвольное' },
  // Было «На речевую команду»: в КР и в версии 2014 — «на звук» (обращение), не команда.
  { id: 'E3', score: 3, label: 'На звук (обращение, голос)' },
  { id: 'E2', score: 2, label: 'На болевое раздражение' },
  { id: 'E1', score: 1, label: 'Отсутствует' },
  E_NT,
];

const V_OPTIONS_ADULT = [
  { id: 'V5', score: 5, label: 'Ориентирован, осмысленный ответ' },
  { id: 'V4', score: 4, label: 'Речевая спутанность' },
  { id: 'V3', score: 3, label: 'Отдельные слова/спонтанно' },
  { id: 'V2', score: 2, label: 'Нечленораздельные звуки' },
  { id: 'V1', score: 1, label: 'Отсутствует' },
  V_NT_TUBE,
  V_NT_OTHER,
];

// Речевой ответ у детей младше 4 лет — КР «ЧМТ у детей», 2025, прил. Г2.
const V_OPTIONS_CHILD = [
  { id: 'V5', score: 5, label: 'Улыбается, реагирует на звук, следит за предметами, контактен' },
  { id: 'V4', score: 4, label: 'Плачет, но успокаивается; контакт неполный' },
  { id: 'V3', score: 3, label: 'Успокаивается ненадолго, стонет' },
  { id: 'V2', score: 2, label: 'Не успокаивается, беспокоен' },
  { id: 'V1', score: 1, label: 'Отсутствует' },
  V_NT_TUBE,
];

const M_OPTIONS_ADULT = [
  { id: 'M6', score: 6, label: 'Выполняет команды' },
  { id: 'M5', score: 5, label: 'Локализует боль' },
  { id: 'M4', score: 4, label: 'Отдёргивание на боль' },
  { id: 'M3', score: 3, label: 'Патол. сгибание (декортикация)' },
  { id: 'M2', score: 2, label: 'Патол. разгибание (децеребрация)' },
  { id: 'M1', score: 1, label: 'Нет ответа' },
  M_NT,
];

// Двигательный ответ у детей младше 4 лет: КР «ЧМТ у детей», 2025, прил. Г2
// (6 — выполнение инструкций, 5 — локализация боли); для доречевых детей эквиваленты
// 6 и 5 — по Modified GCS for Infants (MSD Manual; James 1986).
const M_OPTIONS_CHILD = [
  { id: 'M6', score: 6, label: 'Выполняет инструкции; младенец — спонтанные целенаправленные движения' },
  { id: 'M5', score: 5, label: 'Локализует боль; младенец — отдёргивает при прикосновении' },
  { id: 'M4', score: 4, label: 'Отдёргивание на боль' },
  { id: 'M3', score: 3, label: 'Патол. сгибание (декортикация)' },
  { id: 'M2', score: 2, label: 'Патол. разгибание (децеребрация)' },
  { id: 'M1', score: 1, label: 'Нет ответа' },
  M_NT,
];

// Реакция зрачков на свет для ШКГ-З (Brennan 2018): баллы вычитаются из ШКГ.
const P_OPTIONS = [
  { id: 'P0', score: 0, label: 'Оба зрачка реагируют' },
  { id: 'P1', score: 1, label: 'Один зрачок не реагирует' },
  { id: 'P2', score: 2, label: 'Оба зрачка не реагируют' },
];

const NEUTRAL = '#94a3b8';

// --- Расчёт (чистые функции) ---

// Итог по выбранным компонентам. Сумма считается только когда оценены все три
// компонента и ни один не отмечен как «не оценивается» (Teasdale 2014).
const computeGcs = (eye, verbal, motor) => {
  const parts = [
    { key: 'E', opt: eye },
    { key: 'V', opt: verbal },
    { key: 'M', opt: motor },
  ];
  const notation = parts
    .map(({ key, opt }) => (!opt ? `${key}–` : opt.nt ? opt.code : `${key}${opt.score}`))
    .join(' ');
  const complete = parts.every(({ opt }) => !!opt);
  const hasNT = parts.some(({ opt }) => opt?.nt);
  const scorable = complete && !hasNT;
  const sum = scorable ? eye.score + verbal.score + motor.score : null;
  return { complete, hasNT, scorable, sum, notation };
};

// Уровень сознания по сумме — КР «ЧМТ у детей», 2025, прил. Г1/Г2 (ключ один для обеих шкал).
// Соответствие условное: в других российских источниках границы сдвинуты на 1 балл.
const consciousnessLevel = (sum) => {
  if (sum === 15) return 'Ясное сознание (15)';
  if (sum >= 13)  return 'Умеренное оглушение (13–14)';
  if (sum >= 11)  return 'Глубокое оглушение (11–12)';
  if (sum >= 9)   return 'Сопор (9–10)';
  if (sum >= 7)   return 'Умеренная кома (7–8)';
  if (sum >= 4)   return 'Глубокая кома (4–6)';
  return 'Терминальная кома (3)';
};

// Тяжесть ЧМТ по сумме — КР «ЧМТ у детей», 2025: 13–15 лёгкая, 9–12 среднетяжёлая, 3–8 тяжёлая.
const tbiSeverity = (sum) => {
  if (sum >= 13) return 'Тяжесть при ЧМТ: лёгкая (13–15)';
  if (sum >= 9)  return 'Тяжесть при ЧМТ: среднетяжёлая (9–12)';
  return 'Тяжесть при ЧМТ: тяжёлая (3–8)';
};

// Цвет совпадает с тяжестью ЧМТ: ≤8 — красный, 9–12 — жёлтый, 13–14 — синий, 15 — зелёный.
const colorBySeverity = (sum) => {
  if (sum === 15) return '#10B981';
  if (sum >= 13) return '#3B82F6';
  if (sum >= 9)  return '#F59E0B';
  return '#EF4444';
};

// Пациент с M6 выполняет команды и по определению не в сопоре и не в коме
// (glasgowcomascale.org: «8 может быть и E2V2M4, и E1V1M6»). Глубокое оглушение (11–12) выполнение
// простых команд допускает, поэтому предупреждаем только при сумме ≤ 10 (E + V ≤ 4) — повод
// проверить, не мешает ли оценке местная причина.
const commandsWarning = (motor, sum) => motor?.id === 'M6' && sum !== null && sum <= 10;

// ШКГ-З = ШКГ − баллы зрачков, диапазон 1–15 (Brennan 2018). Только при полной сумме.
const gcsPupils = (sum, pupils) => (sum === null || !pupils ? null : sum - pupils.score);

// --- Интерфейс ---

const Section = ({ title, options, selectedId, onSelect }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.chipsWrap}>
      {options.map((opt) => {
        const active = selectedId === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            // Повторное нажатие снимает выбор компонента.
            onPress={() => onSelect(active ? null : opt)}
            activeOpacity={0.8}
            style={[styles.chip, opt.nt && styles.chipNT, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.chipRow}>
              <Text style={[styles.chipScore, active && styles.chipScoreActive]}>
                {opt.nt ? 'НО' : opt.score}
              </Text>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {opt.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default function GCScreen() {
  const [mode, setMode]     = useState('adult');
  const [eye, setEye]       = useState(null); // {id, score, label} или NT-вариант
  const [verbal, setVerbal] = useState(null);
  const [motor, setMotor]   = useState(null);
  const [pupils, setPupils] = useState(null);

  const isChild = mode === 'child';
  const vOptions = isChild ? V_OPTIONS_CHILD : V_OPTIONS_ADULT;
  const mOptions = isChild ? M_OPTIONS_CHILD : M_OPTIONS_ADULT;

  const result = useMemo(() => computeGcs(eye, verbal, motor), [eye, verbal, motor]);
  const { complete, hasNT, scorable, sum, notation } = result;

  // Цвет тяжести — только при полной сумме; иначе нейтральная рамка.
  const sevColor = scorable ? colorBySeverity(sum) : NEUTRAL;
  const showCommandsWarning = commandsWarning(motor, sum);
  // ШКГ-З выведена на взрослых с ЧМТ — у детей < 4 лет не показываем.
  const gcsP = isChild ? null : gcsPupils(sum, pupils);

  const reset = () => {
    setEye(null);
    setVerbal(null);
    setMotor(null);
    setPupils(null);
  };

  const switchMode = (id) => {
    if (id === mode) return;
    setMode(id);
    // Формулировки V и M различаются — выбор по другой шкале не переносим.
    setVerbal(null);
    setMotor(null);
    setPupils(null);
  };

  let hint;
  if (!complete) hint = 'Оценка неполная: выберите E, V и M';
  else if (hasNT) hint = 'Сумма не определяется: компонент не оценивается. Запишите компоненты';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Шкала комы Глазго</Text>
        <Text style={styles.subtitle}>
          Выберите по одному пункту в каждой категории. Повторное нажатие снимает выбор.
        </Text>

        {/* Выбор шкалы по возрасту */}
        <View style={styles.modeRow}>
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => switchMode(m.id)}
                activeOpacity={0.8}
                style={[styles.modeBtn, active && styles.modeBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.modeNote}>
          {isChild
            ? 'Педиатрическая ШКГ — для детей младше 4 лет (КР «ЧМТ у детей», 2025).'
            : 'Взрослая ШКГ — для взрослых и детей от 4 лет. У детей младше 4 лет она занижает оценку.'}
        </Text>

        {/* Итоговая панель */}
        <View style={[styles.scoreCard, { borderColor: sevColor }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreBig, !scorable && styles.scoreBigMuted]}>
              {scorable ? sum : '—'}
            </Text>
            <View style={styles.scoreBreakdown}>
              <Text style={styles.scoreNotation}>
                {scorable ? `${notation} = ${sum}` : notation}
              </Text>
              {gcsP !== null && (
                <Text style={styles.scoreLine}>
                  ШКГ-З (с зрачками): <Text style={styles.scoreBold}>{gcsP}</Text>
                </Text>
              )}
            </View>
          </View>

          {scorable ? (
            <>
              <Text style={[styles.verdict, { color: sevColor }]}>
                {showCommandsWarning ? `По сумме: ${consciousnessLevel(sum)}` : consciousnessLevel(sum)}
              </Text>
              <Text style={styles.verdictSub}>{tbiSeverity(sum)}</Text>
              {sum <= 8 && (
                <Text style={styles.alertText}>
                  ≤ 8 баллов — оцените необходимость защиты дыхательных путей (интубация).
                </Text>
              )}
              {showCommandsWarning && (
                <Text style={styles.warnText}>
                  Выполняет команды (M6) — это не сопор и не кома. Низкая сумма за счёт E или V:
                  проверьте, не мешают ли оценке отёк век, интубация или афазия (отметьте «НО»).
                </Text>
              )}
              <Text style={styles.footnote}>
                Соответствие баллов уровню сознания условное (КР «ЧМТ у детей», 2025, прил. Г1);
                в других источниках границы отличаются на 1 балл. В карту записывайте компоненты.
              </Text>
            </>
          ) : (
            <Text style={[styles.verdict, { color: '#64748b' }]}>{hint}</Text>
          )}
        </View>

        <Section
          title="Открывание глаз (E)"
          options={E_OPTIONS}
          selectedId={eye?.id}
          onSelect={setEye}
        />
        <Section
          title="Речевая реакция (V)"
          options={vOptions}
          selectedId={verbal?.id}
          onSelect={setVerbal}
        />
        <Section
          title="Двигательная реакция (M)"
          options={mOptions}
          selectedId={motor?.id}
          onSelect={setMotor}
        />

        {!isChild && (
          <Section
            title="Реакция зрачков на свет (необязательно, для ШКГ-З при ЧМТ)"
            options={P_OPTIONS}
            selectedId={pupils?.id}
            onSelect={setPupils}
          />
        )}

        <TouchableOpacity onPress={reset} style={styles.resetBtn} activeOpacity={0.8}>
          <Text style={styles.resetText}>Сбросить</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20,
    paddingBottom: 32
  },
  title: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },

  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  modeBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  modeText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  modeNote: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },

  scoreCard: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderColor: '#e2e8f0'
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  scoreBig: {
    color: '#1e293b',
    fontSize: 48,
    fontWeight: '900',
    marginRight: 16,
    letterSpacing: -1
  },
  scoreBigMuted: {
    color: '#94a3b8',
  },
  scoreBreakdown: {
    flexDirection: 'column',
    flex: 1,
  },
  scoreNotation: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 2,
  },
  scoreLine: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
    marginVertical: 2
  },
  scoreBold: {
    color: '#059669',
    fontWeight: '700'
  },
  verdict: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center'
  },
  verdictSub: {
    marginTop: 4,
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertText: {
    marginTop: 10,
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  warnText: {
    marginTop: 10,
    color: '#b45309',
    fontSize: 14,
    fontWeight: '600',
  },
  footnote: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 12,
  },

  section: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },

  chipsWrap: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  chip: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  chipNT: {
    borderStyle: 'dashed',
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  chipScore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#64748b',
    fontWeight: '800',
    fontSize: 12,
    marginRight: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    ...Platform.select({
      android: { lineHeight: 24 },
    }),
  },
  chipScoreActive: {
    color: '#ffffff',
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  chipLabel: {
    color: '#374151',
    flex: 1,
    fontSize: 14,
    fontWeight: '500'
  },
  chipLabelActive: {
    color: '#ffffff',
    fontWeight: '600'
  },

  resetBtn: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  resetText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14
  },
});
