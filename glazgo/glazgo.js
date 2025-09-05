import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

const E_OPTIONS = [
  { id: 'E4', score: 4, label: 'Произвольное' },
  { id: 'E3', score: 3, label: 'На речевую команду' },
  { id: 'E2', score: 2, label: 'На болевое раздражение' },
  { id: 'E1', score: 1, label: 'Отсутствует' },
];

const V_OPTIONS = [
  { id: 'V5', score: 5, label: 'Ориентирован, осмысленный ответ' },
  { id: 'V4', score: 4, label: 'Речевая спутанность' },
  { id: 'V3', score: 3, label: 'Отдельные слова/спонтанно' },
  { id: 'V2', score: 2, label: 'Нечленораздельные звуки' },
  { id: 'V1', score: 1, label: 'Отсутствует' },
];

const M_OPTIONS = [
  { id: 'M6', score: 6, label: 'Выполняет команды' },
  { id: 'M5', score: 5, label: 'Локализует боль' },
  { id: 'M4', score: 4, label: 'Отдёргивание на боль' },
  { id: 'M3', score: 3, label: 'Патол. сгибание (декортикация)' },
  { id: 'M2', score: 2, label: 'Патол. разгибание (децеребрация)' },
  { id: 'M1', score: 1, label: 'Нет ответа' },
];

const colorBySeverity = (sum) => {
  if (sum >= 13) return '#10B981'; // зелёный — лёгкая
  if (sum >= 9)  return '#F59E0B'; // жёлтый — средняя
  return '#EF4444';                // красный — тяжёлая
};

const verdict = (sum) => {
  if (sum >= 13) return 'Лёгкая ЧМТ (13–15)';
  if (sum >= 9)  return 'Средняя ЧМТ (9–12)';
  return 'Тяжёлая ЧМТ (≤8)';
};

const Section = ({ title, options, selectedId, onSelect }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.chipsWrap}>
      {options.map((opt) => {
        const active = selectedId === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt)}
            activeOpacity={0.8}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.chipRow}>
              <Text style={[styles.chipScore, active && styles.chipScoreActive]}>
                {opt.score}
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
  const [eye, setEye]       = useState(null); // {id, score, label}
  const [verbal, setVerbal] = useState(null);
  const [motor, setMotor]   = useState(null);

  const sum = useMemo(() => {
    const e = eye?.score ?? 0;
    const v = verbal?.score ?? 0;
    const m = motor?.score ?? 0;
    return e + v + m;
  }, [eye, verbal, motor]);

  const canInterpret = eye && verbal && motor;
  const sevColor = colorBySeverity(sum);

  const reset = () => {
    setEye(null);
    setVerbal(null);
    setMotor(null);
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
        <Text style={styles.title}>Шкала комы Глазго</Text>
        <Text style={styles.subtitle}>
          Выберите по одному пункту в каждой категории. Баллы считаются автоматически.
        </Text>

        {/* Итоговая панель */}
        <View style={[styles.scoreCard, { borderColor: sevColor }]}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreBig}>{sum}</Text>
            <View style={styles.scoreBreakdown}>
              <Text style={styles.scoreLine}>
                E: <Text style={styles.scoreBold}>{eye?.score ?? 0}</Text>
              </Text>
              <Text style={styles.scoreLine}>
                V: <Text style={styles.scoreBold}>{verbal?.score ?? 0}</Text>
              </Text>
              <Text style={styles.scoreLine}>
                M: <Text style={styles.scoreBold}>{motor?.score ?? 0}</Text>
              </Text>
            </View>
          </View>
          <Text style={[styles.verdict, { color: sevColor }]}>
            {canInterpret ? verdict(sum) : 'Выберите E, V и M, чтобы увидеть интерпретацию'}
          </Text>
        </View>

        <Section
          title="Открывание глаз (E)"
          options={E_OPTIONS}
          selectedId={eye?.id}
          onSelect={setEye}
        />
        <Section
          title="Речевая реакция (V)"
          options={V_OPTIONS}
          selectedId={verbal?.id}
          onSelect={setVerbal}
        />
        <Section
          title="Двигательная реакция (M)"
          options={M_OPTIONS}
          selectedId={motor?.id}
          onSelect={setMotor}
        />

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
    marginBottom: 20,
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
  scoreBreakdown: {
    flexDirection: 'column'
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
    fontSize: 14,
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
