import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text } from '../components/AppText';

/**
 * Revised Geneva Score (пересмотренная Женевская шкала, полная версия):
 * источник — Le Gal G. et al. Ann Intern Med 2006;144:165-171;
 * ESC 2019 (Konstantinides S.V. et al., Eur Heart J 2020;41:543-603), табл. 5;
 * русские формулировки — РЛС и Видаль (калькуляторы «Пересмотренная Женевская шкала»).
 *  +1  Возраст > 65 лет
 *  +3  ТГВ/ТЭЛА в анамнезе
 *  +2  Операция под общей анестезией или перелом нижней конечности за последний месяц
 *  +2  Активная злокачественная опухоль
 *  +3  Односторонняя боль в нижней конечности
 *  +2  Кровохарканье
 *  +3  ЧСС 75–94
 *  +5  ЧСС ≥95
 *  +4  Болезненность при пальпации по ходу глубоких вен И односторонний отёк
 *      нижней конечности (нужны оба признака; Le Gal 2006)
 *
 * Вероятность ТЭЛА (трёхуровневая схема; распространённость — Le Gal 2006,
 * валидационная выборка):
 *   0–3  — низкая (≈8%)
 *   4–10 — средняя (≈28%)
 *   ≥11  — высокая (≈74%)
 * Двухуровневая схема (ESC 2019, табл. 5): 0–5 — ТЭЛА маловероятна, ≥6 — вероятна.
 *
 * Применимость (ESC 2019, разд. 4 и 9.2): взрослые со стабильной гемодинамикой
 * (выборка Le Gal 2006 — взрослые пациенты отделений неотложной помощи).
 * При шоке/гипотензии — алгоритм ТЭЛА высокого риска без шкал.
 * У беременных — отдельный алгоритм ESC 2019 (рис. 7).
 */

// ESC 2019 табл. 5; формулировки — Le Gal 2006, РЛС
const BASE_ITEMS = [
  { id: 'age', pts: 1, label: 'Возраст > 65 лет' },
  { id: 'prev_vte', pts: 3, label: 'ТГВ/ТЭЛА в анамнезе' },
  // Le Gal 2006 (табл.), РЛС: «операция под общим наркозом или перелом нижних конечностей ≤1 мес.»
  {
    id: 'surgery',
    pts: 2,
    label: 'Операция под общей анестезией или перелом нижней конечности за последний месяц',
    hint: 'Ушиб, растяжение, травма без перелома не учитываются',
  },
  { id: 'cancer', pts: 2, label: 'Активная злокачественная опухоль' },
  // Le Gal 2006: «unilateral lower limb pain»
  { id: 'unilateral_pain', pts: 3, label: 'Односторонняя боль в нижней конечности' },
  { id: 'hemoptysis', pts: 2, label: 'Кровохарканье' },
  // ЧСС — см. отдельный блок (радио)
  // Le Gal 2006: «pain on lower limb deep venous palpation AND unilateral oedema» — оба признака
  {
    id: 'dvt_signs',
    pts: 4,
    label: 'Болезненность при пальпации по ходу глубоких вен И односторонний отёк нижней конечности',
    hint: 'Нужны оба признака. Только боль в ноге — отмечайте пункт «Односторонняя боль»',
  },
];

// Le Gal 2006: ЧСС — обязательный пункт; по умолчанию не выбрана (иначе сумма занижается)
const HR_OPTIONS = [
  { id: 'hr0', label: 'ЧСС < 75', pts: 0 },
  { id: 'hr1', label: 'ЧСС 75–94', pts: 3 },
  { id: 'hr2', label: 'ЧСС ≥ 95', pts: 5 },
];

// «балл / балла / баллов»
const ptsWord = (n) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'баллов';
  if (b === 1) return 'балл';
  if (b >= 2 && b <= 4) return 'балла';
  return 'баллов';
};

// Трёхуровневая схема и распространённость ТЭЛА — Le Gal 2006 (валидационная выборка);
// дальнейшая тактика — ESC 2019, алгоритм при стабильной гемодинамике (рис. 5)
const getRisk = (sum) => {
  if (sum >= 11) {
    return {
      level: 'Высокая',
      color: '#ef4444',
      prevalence: '≈74%',
      next: 'КТ-ангиопульмонография. Д-димер для исключения ТЭЛА не использовать.',
    };
  }
  if (sum >= 4) {
    return {
      level: 'Средняя',
      color: '#f59e0b',
      prevalence: '≈28%',
      next: 'Высокочувствительный Д-димер: норма — ТЭЛА исключена, повышен — КТ-ангиопульмонография.',
    };
  }
  return {
    level: 'Низкая',
    color: '#10b981',
    prevalence: '≈8%',
    next: 'Д-димер: норма — ТЭЛА исключена, повышен — КТ-ангиопульмонография.',
  };
};

// Двухуровневая схема — ESC 2019, табл. 5 (применяют при менее чувствительном Д-димере)
const getTwoLevel = (sum) => (sum >= 6
  ? { text: 'ТЭЛА вероятна (≥6)', next: 'сразу КТ-ангиопульмонография' }
  : { text: 'ТЭЛА маловероятна (0–5)', next: 'Д-димер' });

export default function GenevaScoreScreen() {
  const [flags, setFlags] = useState(() =>
    Object.fromEntries(BASE_ITEMS.map(i => [i.id, false]))
  );
  // null — ЧСС ещё не выбрана: итог не показываем (EBMcalc: все поля обязательны)
  const [hr, setHr] = useState(null); // одно из HR_OPTIONS или null

  const hrOpt = HR_OPTIONS.find(x => x.id === hr) ?? null;
  const complete = hrOpt !== null;

  const sum = useMemo(() => {
    const base = BASE_ITEMS.reduce((acc, i) => acc + (flags[i.id] ? i.pts : 0), 0);
    return base + (hrOpt ? hrOpt.pts : 0);
  }, [flags, hrOpt]);

  const risk = complete ? getRisk(sum) : null;
  const twoLevel = complete ? getTwoLevel(sum) : null;

  const toggle = (id) => setFlags(prev => ({ ...prev, [id]: !prev[id] }));
  const reset = () => {
    setFlags(Object.fromEntries(BASE_ITEMS.map(i => [i.id, false])));
    setHr(null);
  };

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
        <Text style={styles.title}>🫁 Шкала вероятности ТЭЛА</Text>
        <Text style={styles.subtitle}>Revised Geneva Score — полная версия (Le Gal, 2006)</Text>

        {/* Применимость — ESC 2019, разд. 4 и 9.2; Le Gal 2006 (выборка — взрослые) */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Для взрослых со стабильной гемодинамикой при подозрении на ТЭЛА.
            При шоке или гипотензии (САД {'<'} 90 мм рт. ст.) шкалу не используют: тактика ТЭЛА
            высокого риска — срочная ЭхоКГ или КТ-ангиопульмонография. У детей не валидирована.
            У беременных — отдельный алгоритм ESC 2019.
          </Text>
        </View>

        {/* Итог */}
        <View style={[styles.totalCard, { borderColor: risk ? risk.color : '#e2e8f0' }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalNum}>{complete ? sum : '—'}</Text>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Сумма баллов</Text>
              {risk ? (
                <Text style={[styles.totalRisk, { color: risk.color }]}>
                  Вероятность: {risk.level} (ТЭЛА {risk.prevalence})
                </Text>
              ) : (
                <Text style={[styles.totalRisk, styles.totalPending]}>Укажите ЧСС</Text>
              )}
            </View>
          </View>
          {risk && (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceText}>
                Двухуровневая схема: {twoLevel.text}.
              </Text>
              <Text style={styles.adviceText}>
                Дальше (ESC 2019): {risk.next}
              </Text>
              {/* ESC 2019: при 6–10 баллах схемы расходятся — с менее чувствительным Д-димером сразу КТ */}
              {sum >= 6 && sum < 11 && (
                <Text style={styles.adviceText}>
                  Если доступен только менее чувствительный Д-димер — по двухуровневой схеме:
                  {' '}{twoLevel.next}.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ЧСС — радио */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>
            Частота сердечных сокращений{complete ? '' : ' — выберите'}
          </Text>
          {HR_OPTIONS.map(opt => {
            const active = hr === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.8}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => setHr(opt.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${opt.label}, ${opt.pts} ${ptsWord(opt.pts)}`}
              >
                <View style={[styles.radio, active && styles.radioOn]} />
                <Text style={styles.rowText}>{opt.label}</Text>
                <Badge value={`+${opt.pts}`} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Остальные пункты — свитчи */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Клинические признаки</Text>
          {BASE_ITEMS.map(item => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTextInWrap}>{item.label}</Text>
                {item.hint ? <Text style={styles.rowHint}>{item.hint}</Text> : null}
              </View>
              <Badge value={`+${item.pts}`} />
              <Switch
                value={flags[item.id]}
                onValueChange={() => toggle(item.id)}
                accessibilityLabel={`${item.label}, ${item.pts} ${ptsWord(item.pts)}`}
                trackColor={{ false: '#2a2d36', true: '#374151' }}
                thumbColor={flags[item.id] ? '#60a5fa' : '#9aa0a6'}
                ios_backgroundColor="#2a2d36"
              />
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={reset} style={styles.resetBtn} activeOpacity={0.85}>
          <Text style={styles.resetText}>Сбросить</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Badge = ({ value }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{value}</Text>
  </View>
);

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
    marginBottom: 20
  },

  totalCard: {
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  totalNum: {
    color: '#1e293b',
    fontSize: 48,
    fontWeight: '900',
    marginRight: 16,
    letterSpacing: -1
  },
  totalInfo: {
    flex: 1,
  },
  totalPending: {
    color: '#64748b',
  },
  adviceBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 6,
  },
  adviceText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noteText: {
    color: '#92400e',
    fontSize: 13,
    lineHeight: 18,
  },
  totalLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500'
  },
  totalRisk: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700'
  },

  group: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  groupTitle: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rowActive: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  rowText: {
    color: '#374151',
    flex: 1,
    fontSize: 15,
    fontWeight: '500'
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTextInWrap: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500'
  },
  rowHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },

  badge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'android' ? 4 : 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 13
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 2,
    backgroundColor: '#ffffff',
  },
  radioOn: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6'
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
