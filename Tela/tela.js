import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

/**
 * Revised Geneva Score (пересмотренная Женева):
 *  +1  Возраст > 65 лет
 *  +3  ТГВ/ТЭЛА в анамнезе
 *  +2  Операция/травма за последний месяц
 *  +2  Активная злокачественная опухоль
 *  +3  Боль в одной ноге
 *  +2  Кровохарканье
 *  +3  ЧСС 75–94
 *  +5  ЧСС ≥95
 *  +4  Болезненность при пальпации глубоких вен и/или односторонний отёк голени
 *
 * Вероятность ТЭЛА:
 *   0–3  — низкая
 *   4–10 — средняя
 *   ≥11  — высокая
 */

const BASE_ITEMS = [
  { id: 'age', pts: 1, label: 'Возраст > 65 лет' },
  { id: 'prev_vte', pts: 3, label: 'ТГВ/ТЭЛА в анамнезе' },
  { id: 'surgery', pts: 2, label: 'Операция или травма в течение 1 месяца' },
  { id: 'cancer', pts: 2, label: 'Активная злокачественная опухоль' },
  { id: 'unilateral_pain', pts: 3, label: 'Боль в одной ноге' },
  { id: 'hemoptysis', pts: 2, label: 'Кровохарканье' },
  // ЧСС — см. отдельный блок (радио)
  { id: 'dvt_signs', pts: 4, label: 'Болезненность/отёк одной нижней конечности' },
];

const HR_OPTIONS = [
  { id: 'hr0', label: 'ЧСС < 75', pts: 0 },
  { id: 'hr1', label: 'ЧСС 75–94', pts: 3 },
  { id: 'hr2', label: 'ЧСС ≥ 95', pts: 5 },
];

const getRisk = (sum) => {
  if (sum >= 11) return { level: 'Высокая', color: '#ef4444' };
  if (sum >= 4)  return { level: 'Средняя', color: '#f59e0b' };
  return { level: 'Низкая', color: '#10b981' };
};

export default function GenevaScoreScreen() {
  const [flags, setFlags] = useState(() =>
    Object.fromEntries(BASE_ITEMS.map(i => [i.id, false]))
  );
  const [hr, setHr] = useState('hr0'); // одно из HR_OPTIONS

  const sum = useMemo(() => {
    const base = BASE_ITEMS.reduce((acc, i) => acc + (flags[i.id] ? i.pts : 0), 0);
    const hrPts = HR_OPTIONS.find(x => x.id === hr)?.pts ?? 0;
    return base + hrPts;
  }, [flags, hr]);

  const risk = getRisk(sum);

  const toggle = (id) => setFlags(prev => ({ ...prev, [id]: !prev[id] }));
  const reset = () => {
    setFlags(Object.fromEntries(BASE_ITEMS.map(i => [i.id, false])));
    setHr('hr0');
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
        <Text style={styles.subtitle}>Revised Geneva Score</Text>

        {/* Итог */}
        <View style={[styles.totalCard, { borderColor: risk.color }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalNum}>{sum}</Text>
            <View>
              <Text style={styles.totalLabel}>Сумма баллов</Text>
              <Text style={[styles.totalRisk, { color: risk.color }]}>
                Вероятность: {risk.level}
              </Text>
            </View>
          </View>
        </View>

        {/* ЧСС — радио */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Частота сердечных сокращений</Text>
          {HR_OPTIONS.map(opt => {
            const active = hr === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.8}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => setHr(opt.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
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
              <Text style={styles.rowText}>{item.label}</Text>
              <Badge value={`+${item.pts}`} />
              <Switch
                value={flags[item.id]}
                onValueChange={() => toggle(item.id)}
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
