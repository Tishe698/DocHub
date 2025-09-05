// SHOKSScreen.js
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

// --- Модель шкалы ШОКС (варианты и баллы) ---
const QUESTIONS = [
  {
    key: 'dyspnea',
    title: 'Одышка',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'При нагрузке', pts: 1 },
      { id: '2', label: 'В покое', pts: 2 },
    ],
  },
  {
    key: 'weight',
    title: 'Изменился ли за последнюю неделю вес',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Да', pts: 1 },
    ],
  },
  {
    key: 'palp',
    title: 'Жалобы на перебои в работе сердца',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Да', pts: 1 },
    ],
  },
  {
    key: 'position',
    title: 'В каком положении находится в постели',
    options: [
      { id: '0', label: 'Горизонтально', pts: 0 },
      { id: '1', label: 'Приподнятое изголовье (≈2 подушки)', pts: 1 },
      { id: '2', label: 'Приподнятое, просыпается от удушья', pts: 2 },
      { id: '3', label: 'Сидя', pts: 3 },
    ],
  },
  {
    key: 'jvp',
    title: 'Набухшие шейные вены',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'В положении лёжа', pts: 1 },
      { id: '2', label: 'Стоя', pts: 2 },
    ],
  },
  {
    key: 'rales',
    title: 'Хрипы в лёгких',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Нижние отделы (до 1/3)', pts: 1 },
      { id: '2', label: 'До лопаток (до 2/3)', pts: 2 },
      { id: '3', label: 'Над всей поверхностью лёгких', pts: 3 },
    ],
  },
  {
    key: 'gallop',
    title: 'Наличие ритма галопа',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Да', pts: 1 },
    ],
  },
  {
    key: 'liver',
    title: 'Печень',
    options: [
      { id: '0', label: 'Не увеличена', pts: 0 },
      { id: '1', label: 'Увеличена до 5 см', pts: 1 },
      { id: '2', label: 'Увеличена более 5 см', pts: 2 },
    ],
  },
  {
    key: 'edema',
    title: 'Отёки',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Пастозность', pts: 1 },
      { id: '2', label: 'Отёки', pts: 2 },
      { id: '3', label: 'Анасарка', pts: 3 },
    ],
  },
  {
    key: 'sbp',
    title: 'Систолическое АД',
    options: [
      { id: '0', label: '> 120 мм рт.ст.', pts: 0 },
      { id: '1', label: '100–120 мм рт.ст.', pts: 1 },
      { id: '2', label: '< 100 мм рт.ст.', pts: 2 },
    ],
  },
];

// интерпретация по сумме баллов (класс СН)
const interpret = (sum) => {
  if (sum === 0) return { cls: 'нет признаков СН', band: '0 баллов', color: '#10B981' };
  if (sum <= 3) return { cls: 'I функциональный класс', band: '≤ 3', color: '#22C55E' };
  if (sum <= 6) return { cls: 'II функциональный класс', band: '4–6', color: '#F59E0B' };
  if (sum <= 9) return { cls: 'III функциональный класс', band: '7–9', color: '#F97316' };
  if (sum >= 20) return { cls: 'Терминальная СН', band: '≈20', color: '#EF4444' };
  // >9 и <20
  return { cls: 'IV функциональный класс', band: '> 9', color: '#EF4444' };
};

const Chip = ({ active, onPress, label, pts }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    <View style={[styles.badge, active && styles.badgeActive]}>
      <Text style={[styles.badgeText, active && styles.badgeTextActive]}>+{pts}</Text>
    </View>
  </TouchableOpacity>
);

const Card = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={styles.cardBody}>{children}</View>
  </View>
);

export default function SHOKSScreen() {
  // по умолчанию везде «0» (первый вариант)
  const [answers, setAnswers] = useState(
    Object.fromEntries(QUESTIONS.map(q => [q.key, q.options[0].id])),
  );

  const total = useMemo(() => {
    return QUESTIONS.reduce((acc, q) => {
      const opt = q.options.find(o => o.id === answers[q.key]);
      return acc + (opt?.pts ?? 0);
    }, 0);
  }, [answers]);

  const info = interpret(total);

  const reset = () =>
    setAnswers(Object.fromEntries(QUESTIONS.map(q => [q.key, q.options[0].id])));

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
        <Text style={styles.title}>❤️ Шкала ШОКС</Text>
        <Text style={styles.subtitle}>Шкала оценки клинической симптоматики при сердечной недостаточности</Text>

        {/* Итоговая панель */}
        <View style={[styles.summary, { borderColor: info.color }]}>
          <View style={styles.sumLeft}>
            <Text style={styles.sumValue}>{total}</Text>
            <Text style={styles.sumLabel}>сумма баллов</Text>
          </View>
          <View style={styles.sumRight}>
            <Text style={[styles.sumBadge, { color: info.color }]}>
              {info.band}
            </Text>
            <Text style={styles.sumText}>Класс: {info.cls}</Text>
          </View>
        </View>

        {/* Вопросы */}
        {QUESTIONS.map((q) => (
          <Card key={q.key} title={q.title}>
            <View style={styles.chipsRow}>
              {q.options.map((opt) => {
                const active = answers[q.key] === opt.id;
                return (
                  <Chip
                    key={opt.id}
                    active={active}
                    label={opt.label}
                    pts={opt.pts}
                    onPress={() => setAnswers(prev => ({ ...prev, [q.key]: opt.id }))}
                  />
                );
              })}
            </View>
          </Card>
        ))}

        {/* Сброс */}
        <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.9}>
          <Text style={styles.resetText}>Сбросить</Text>
        </TouchableOpacity>

        {/* Пояснение */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Критерии интерпретации</Text>
          <Text style={styles.noteLine}>0 — отсутствуют клинические признаки СН</Text>
          <Text style={styles.noteLine}>≤3 — I ФК, 4–6 — II ФК, 7–9 — III ФК, &gt;9 — IV ФК</Text>
          <Text style={styles.noteLine}>≈20 — терминальная сердечная недостаточность</Text>
        </View>

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
    marginBottom: 20
  },

  summary: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderColor: '#e2e8f0'
  },
  sumLeft: {
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0'
  },
  sumValue: {
    color: '#1e293b',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1
  },
  sumLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4
  },
  sumRight: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center'
  },
  sumBadge: {
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 6
  },
  sumText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardTitle: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cardBody: {
    padding: 16
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
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
  chipText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  badge: {
    marginLeft: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'android' ? 3 : 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  badgeActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8'
  },
  badgeText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 13
  },
  badgeTextActive: {
    color: '#ffffff',
    fontWeight: '900'
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

  noteCard: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  noteTitle: {
    color: '#1e293b',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8
  },
  noteLine: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20
  },
});
