// blood_group_screen.js
// Первичное определение группы крови AB0 и резус-принадлежности цоликлонами на плоскости.
// Источники:
//  - Приказ МЗ РФ от 20.10.2020 №1134н, п. 6 (первичное определение AB0 и резуса),
//    п. 11 (подтверждение в лаборатории), п. 19 (контрольная проверка перед трансфузией),
//    приложение (совместимость при вариантах D). Действует до 01.01.2027 (п. 2) —
//    после замены приказа (сообщается о №730н от 17.08.2026) ссылки пересмотреть.
//  - Приказ МЗ РФ от 25.11.2002 №363 «Инструкция по применению компонентов крови»,
//    разд. «Определение группы крови AB0» и «Определение резус-принадлежности»
//    (учёт через 3 мин; при агглютинации со всеми реагентами — контроль с 0,9% NaCl,
//    AB(IV) только при его отрицательном результате). Методика совпадает с инструкциями
//    производителей цоликлонов анти-A, анти-B, анти-AB, анти-D.
import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text } from '../components/AppText';

// Значения реакции: null — не отмечено, 0 — нет агглютинации,
// 1 — агглютинация, 2 — слабая / сомнительная.
const NEG = 0;
const POS = 1;
const WEAK = 2;

const OPTIONS = [
  { value: NEG, label: '−', a11y: 'агглютинации нет' },
  { value: WEAK, label: '±', a11y: 'слабая или сомнительная агглютинация' },
  { value: POS, label: '+', a11y: 'агглютинация есть' },
];

const Option = ({ label, active, onPress, a11yLabel }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.opt, active && styles.optActive]}
    activeOpacity={0.8}
    accessibilityRole="radio"
    accessibilityLabel={a11yLabel}
    accessibilityState={{ selected: !!active, checked: !!active }}
  >
    <Text style={[styles.optText, active && styles.optTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// Выбор реакции: − / ± / +. Метка лунки передаётся явно (reagent).
const ReactionPicker = ({ title, reagent, value, onChange, hint }) => {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.row} accessibilityRole="radiogroup">
        {OPTIONS.map((o) => (
          <Option
            key={o.value}
            label={o.label}
            a11yLabel={`${reagent}: ${o.a11y}`}
            active={value === o.value}
            onPress={() => onChange(o.value)}
          />
        ))}
      </View>

      {/* Визуализация лунки */}
      <View style={styles.wellRow}>
        <Well label={reagent} value={value} />
      </View>
    </View>
  );
};

// «Лунка» — кружок: пустой / с агглютинацией / со слабой агглютинацией
const Well = ({ label, value }) => {
  const pos = value === POS;
  const weak = value === WEAK;
  return (
    <View style={styles.well}>
      <View
        style={[
          styles.wellCircle,
          pos && styles.wellCircleActive,
          weak && styles.wellCircleWeak,
        ]}
      >
        {pos ? <Text style={styles.dots}>····</Text> : null}
        {weak ? <Text style={styles.dotsWeak}>· ·</Text> : null}
      </View>
      <Text style={styles.wellLabel}>{label}</Text>
    </View>
  );
};

// Интерпретация реакций. Возвращает группу AB0, резус и предупреждения.
// Таблица AB0 (анти-A / анти-B / анти-AB): 0(I) − − −; A(II) + − +; B(III) − + +;
// AB(IV) + + + — приказ МЗ РФ №363 (2002), табл. 1; инструкции к цоликлонам.
export function interpretBloodGroup({ antiA, antiB, antiAB = null, antiD = null, control = null }) {
  const warnings = [];
  const infos = [];
  const UNDET = 'Не определена';
  const LAB = 'Направьте образец в лабораторию.';

  const aSet = antiA !== null && antiA !== undefined;
  const bSet = antiB !== null && antiB !== undefined;
  const aboReady = aSet && bSet;

  // Агглютинация в контроле (эритроциты + 0,9% NaCl) — неспецифическая
  // (аутоагглютинация, холодовые антитела, полиагглютинация): любые положительные
  // реакции недостоверны (приказ №363, 2002).
  const controlPos = control === POS || control === WEAK;

  let abo = '—';
  let aboPending = false; // AB(IV) до выполнения контроля

  if (controlPos) {
    abo = UNDET;
    warnings.push(
      'Агглютинация в контроле с 0,9% NaCl — неспецифическая (аутоагглютинация, холодовые антитела). ' +
        'Группа и резус не определяются. ' + LAB
    );
  } else if (aboReady) {
    if (antiA === WEAK || antiB === WEAK || antiAB === WEAK) {
      // Слабые варианты A/B агглютинируют позже и слабее (инструкции к цоликлонам)
      abo = UNDET;
      warnings.push(
        'Слабая или сомнительная реакция: возможен слабый вариант антигена A или B. ' + LAB
      );
    } else {
      const aPos = antiA === POS;
      const bPos = antiB === POS;
      let base;
      if (!aPos && !bPos) base = '0 (I)';
      else if (aPos && !bPos) base = 'A (II)';
      else if (!aPos && bPos) base = 'B (III)';
      else base = 'AB (IV)';

      // Согласованность с анти-AB: должен быть «+» при A или B и «−» при 0(I)
      const abExpected = aPos || bPos ? POS : NEG;
      if (antiAB !== null && antiAB !== abExpected) {
        abo = UNDET;
        warnings.push(
          antiAB === POS
            ? 'Агглютинация только с анти-AB: возможен слабый вариант A или B. ' + LAB
            : 'Нет агглютинации с анти-AB при агглютинации с анти-A/анти-B — реакции противоречат друг другу. ' + LAB
        );
      } else if (base === 'AB (IV)' && control !== NEG) {
        // AB(IV) устанавливают только при отсутствии агглютинации в контроле
        // с 0,9% NaCl (приказ №363, 2002)
        abo = 'AB (IV)?';
        aboPending = true;
        warnings.push(
          'Агглютинация с анти-A и анти-B: выполните контроль — капля эритроцитов + капля 0,9% NaCl. ' +
            'AB (IV) — только если в контроле агглютинации нет.'
        );
      } else {
        abo = base;
        if (base === '0 (I)' && antiAB === null) {
          // Анти-AB входит в стандартный набор и выявляет слабые A/B
          infos.push('Для 0 (I) подтвердите цоликлоном анти-AB: агглютинации быть не должно.');
        }
      }
    }
  }

  // Резус-принадлежность: анти-D (IgM) на плоскости, учёт через 3 мин
  // (приказ №363, 2002; 1134н п. 6, 11)
  let rh = '—';
  if (controlPos) {
    rh = UNDET;
  } else if (antiD === POS) {
    // При неисключённой неспецифической агглютинации (все реакции «+», контроль
    // не выполнен) положительный анти-D тоже может быть ложным
    rh = aboPending ? 'Rh(+)?' : 'Rh(+) положительный';
  } else if (antiD === NEG) {
    rh = 'Rh(−) отрицательный';
  } else if (antiD === WEAK) {
    rh = UNDET;
    // Вариант D уточняют в лаборатории анти-D IgG (1134н п. 11). До уточнения —
    // как резус-отрицательный: D-отрицательные компоненты совместимы и при слабом,
    // и при парциальном D (1134н, приложение) — наиболее безопасный вариант.
    warnings.push(
      'Слабая или сомнительная реакция с анти-D: возможен вариант D. ' + LAB +
        ' До уточнения считать резус-отрицательным (безопасно при любом варианте D).'
    );
  }

  const anyResult = aboReady || antiD !== null || controlPos;

  return {
    abo,
    rh,
    aboReady,
    anyResult,
    warnings,
    infos,
  };
}

export default function BloodGroupScreen() {
  const [antiA, setAntiA] = useState(null); // null | 0 | 1 | 2
  const [antiB, setAntiB] = useState(null);
  const [antiAB, setAntiAB] = useState(null);
  const [control, setControl] = useState(null);
  const [antiD, setAntiD] = useState(null);

  const result = useMemo(
    () => interpretBloodGroup({ antiA, antiB, antiAB, antiD, control }),
    [antiA, antiB, antiAB, antiD, control]
  );

  const resetAll = () => {
    setAntiA(null);
    setAntiB(null);
    setAntiAB(null);
    setControl(null);
    setAntiD(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Определение группы крови</Text>
          <Text style={styles.subtitle}>
            Первичное определение AB0 и резуса цоликлонами на плоскости
          </Text>
        </View>

        {/* Методика: приказ №363 (2002); инструкции к цоликлонам */}
        <View style={styles.methodCard}>
          <Text style={styles.methodText}>
            Капля реагента 0,1 мл + рядом капля крови 0,01–0,03 мл, перемешать, покачивать
            при 15–25 °C. Результат учитывать через 3 мин: слабые варианты A и B агглютинируют
            позже.
          </Text>
          <Text style={styles.methodText}>
            − нет агглютинации · ± слабая / сомнительная · + агглютинация
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Группа AB0</Text>

        <ReactionPicker
          title="Анти-A"
          reagent="Анти-A"
          value={antiA}
          onChange={setAntiA}
          hint="Агглютинация → есть антиген A"
        />

        <ReactionPicker
          title="Анти-B"
          reagent="Анти-B"
          value={antiB}
          onChange={setAntiB}
          hint="Агглютинация → есть антиген B"
        />

        <ReactionPicker
          title="Анти-AB"
          reagent="Анти-AB"
          value={antiAB}
          onChange={setAntiAB}
          hint="Входит в стандартный набор: «+» при A, B, AB; «−» при 0 (I). Выявляет слабые A и B."
        />

        <ReactionPicker
          title="Контроль: эритроциты + 0,9% NaCl"
          reagent="Контроль NaCl"
          value={control}
          onChange={setControl}
          hint="Обязателен при агглютинации с анти-A и анти-B. Агглютинации быть не должно."
        />

        <Text style={styles.sectionTitle}>Резус-принадлежность</Text>

        <ReactionPicker
          title="Анти-D (IgM)"
          reagent="Анти-D"
          value={antiD}
          onChange={setAntiD}
          hint="Агглютинация → резус-положительный; нет → резус-отрицательный"
        />

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Результат</Text>
          <Row label="Группа AB0" value={result.abo} />
          <Row label="Резус (D)" value={result.rh} />
          {!result.anyResult && (
            <Text style={styles.noteDim}>
              Отметьте реакции с анти-A и анти-B для группы и с анти-D для резуса.
            </Text>
          )}
          {result.anyResult && result.abo === '—' ? (
            <Text style={styles.noteDim}>Для группы AB0 отметьте анти-A и анти-B.</Text>
          ) : null}
          {result.anyResult && result.rh === '—' ? (
            <Text style={styles.noteDim}>Для резуса отметьте реакцию с анти-D.</Text>
          ) : null}
          {result.warnings.map((w) => (
            <Text key={w} style={styles.noteWarn}>⚠️ {w}</Text>
          ))}
          {result.infos.map((t) => (
            <Text key={t} style={styles.noteDim}>{t}</Text>
          ))}
          {result.anyResult ? (
            <Text style={styles.notePrimary}>
              Результат первичный: нужно подтверждение в лаборатории.
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={resetAll}
            style={styles.resetBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Сбросить все реакции"
          >
            <Text style={styles.resetText}>Сбросить</Text>
          </TouchableOpacity>
        </View>

        {/* Приказ МЗ РФ №1134н (2020), п. 6, 11, 19 */}
        <Text style={styles.disclaimer}>
          Первичное определение (приказ МЗ РФ №1134н, п. 6). Группу AB0 и резус подтверждает
          лаборатория медицинской организации (п. 11). Перед трансфузией обязательны контрольная
          проверка AB0 и резуса реципиента и донора и проба на совместимость (п. 19). Результат
          этого экрана не основание для выбора компонента крови.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Неокончательный результат («?», «Не определена») выделяется жёлтым
const Row = ({ label, value }) => {
  const doubtful = value.includes('?') || value.startsWith('Не ');
  return (
    <View style={styles.rowLine}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, doubtful && styles.rowValueWarn]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 20
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center'
  },
  title: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500'
  },

  sectionTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '800',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4
  },
  methodCard: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  methodText: {
    color: '#1e3a8a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 4
  },

  block: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4
  },
  blockTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4
  },
  hint: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500'
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  opt: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  optActive: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  optText: {
    color: '#64748b',
    fontSize: 20,
    fontWeight: '700'
  },
  optTextActive: {
    color: '#ef4444',
    fontWeight: '800'
  },

  wellRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center'
  },
  well: {
    alignItems: 'center',
    flex: 1
  },
  wellCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    borderWidth: 3,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  wellCircleActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  wellCircleWeak: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b'
  },
  dots: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '900'
  },
  dotsWeak: {
    color: '#f59e0b',
    fontSize: 20,
    fontWeight: '900'
  },
  wellLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center'
  },

  resultCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  resultTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center'
  },
  rowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  rowLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500'
  },
  rowValue: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    marginLeft: 8,
    textAlign: 'right'
  },
  rowValueWarn: {
    color: '#b45309'
  },

  noteDim: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  notePrimary: {
    color: '#334155',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  noteWarn: {
    color: '#92400e',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a'
  },

  actions: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center'
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  resetText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },

  disclaimer: {
    color: '#6b7280',
    fontSize: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16
  },
});
