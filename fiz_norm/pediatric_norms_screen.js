// pediatric_norms_screen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text, TextInput } from '../components/AppText';

// --- ДАННЫЕ ИЗ ТАБЛИЦЫ ---
const NORMS = [
  { label: 'Новорожденные', months: 0,  weight: '3,5',   height: '50',    rr: '40–60', hr: '130–140', bp: '70/40', parseValue: '0' },
  { label: '3 мес',          months: 3,  weight: '5',     height: '60–62', rr: '35–40', hr: '120–130', bp: '85/40', parseValue: '3 мес' },
  { label: '6 мес',          months: 6,  weight: '7',     height: '67',    rr: '33–35', hr: '120–125', bp: '95/55', parseValue: '6 мес' },
  { label: '1 год',          months: 12, weight: '10',    height: '75',    rr: '30–32', hr: '120',     bp: '92/56', parseValue: '1' },
  { label: '2 года',         months: 24, weight: '12',    height: '87',    rr: '26–30', hr: '110–115', bp: '94/56', parseValue: '2' },
  { label: '4 года',         months: 48, weight: '16',    height: '101',   rr: '26',    hr: '100–105', bp: '98/56', parseValue: '4' },
  { label: '5 лет',          months: 60, weight: '19',    height: '109',   rr: '25–26', hr: '100',     bp: '100/58', parseValue: '5' },
  { label: '6 лет',          months: 72, weight: '20',    height: '115',   rr: '25',    hr: '90–95',   bp: '100/60', parseValue: '6' },
  { label: '8 лет',          months: 96, weight: '25',    height: '129',   rr: '22–24', hr: '78–80',   bp: '105/70', parseValue: '8' },
  { label: '10 лет',         months:120, weight: '30',    height: '140',   rr: '20–22', hr: '78–82',   bp: '105/70', parseValue: '10' },
  { label: '12 лет',         months:144, weight: '33–35', height: '151',   rr: '18–20', hr: '75–82',   bp: '110/70', parseValue: '12' },
  { label: '14 лет',         months:168, weight: 'до 45', height: '161',   rr: '16–20', hr: '72–78',   bp: '120/70', parseValue: '14' },
];

// --- ХЕЛПЕРЫ ---
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Парсим строку возраста в месяцы:
// поддерживает варианты: "1.5", "1,5", "1 г", "1 г 6 мес", "18 мес", "0.5 г", "6 m", "6 мес", "0"
const parseAgeToMonths = (input) => {
  if (!input) return undefined;
  const s = String(input).toLowerCase().replace(',', '.').trim();

  // Специальный случай для новорожденных
  if (s === '0') {
    return 0;
  }

  // "X г Y мес"
  const yMatch = s.match(/(\d+(?:\.\d+)?)\s*г/);
  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*м/);
  if (yMatch || mMatch) {
    const years = yMatch ? parseFloat(yMatch[1]) : 0;
    const months = mMatch ? parseFloat(mMatch[1]) : 0;
    if (!isFinite(years) && !isFinite(months)) return undefined;
    return clamp(Math.round(years * 12 + months), 0, 12 * 18); // ограничим до 18 лет на всякий
  }

  // Просто число: считаем ГОДЫ по умолчанию (подсказку даём в UI)
  const num = Number(s);
  if (Number.isFinite(num)) {
    return clamp(Math.round(num * 12), 0, 12 * 18);
  }

  return undefined;
};

// Находим ближайшую строку из NORMS по возрасту в месяцах
const findClosestNorm = (months) => {
  if (!Number.isFinite(months)) return undefined;
  let best = NORMS[0];
  let bestDiff = Math.abs(months - best.months);
  for (let i = 1; i < NORMS.length; i++) {
    const diff = Math.abs(months - NORMS[i].months);
    if (diff < bestDiff) {
      best = NORMS[i];
      bestDiff = diff;
    }
  }
  return { item: best, diffMonths: bestDiff };
};

export default function PediatricNormsScreen() {
  const [selectedNorm, setSelectedNorm] = useState(null);

  const handleNormPress = (norm) => {
    setSelectedNorm(norm);
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
      >
        <View style={styles.header}>
          <Text style={styles.title}>👶 Нормы для детей</Text>
          <Text style={styles.subtitle}>Выберите возраст для просмотра норм</Text>
        </View>

        {/* Быстрые кнопки возрастов - вверху */}
        <View style={styles.buttonsGrid}>
          {NORMS.map((n) => (
            <TouchableOpacity
              key={n.months}
              style={[
                styles.ageButton,
                selectedNorm?.months === n.months && styles.ageButtonSelected
              ]}
              onPress={() => handleNormPress(n)}
            >
              <Text style={[
                styles.ageButtonText,
                selectedNorm?.months === n.months && styles.ageButtonTextSelected
              ]}>
                {n.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Результат */}
        {selectedNorm && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{selectedNorm.label}</Text>
              <Text style={styles.resultBadge}>
                {Math.floor(selectedNorm.months / 12)} {selectedNorm.months < 12 ? 'мес' : 'лет'}
              </Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Масса тела</Text>
                <Text style={styles.metricValue}>{selectedNorm.weight} кг</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Рост</Text>
                <Text style={styles.metricValue}>{selectedNorm.height} см</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>ЧДД</Text>
                <Text style={styles.metricValue}>{selectedNorm.rr} в мин</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>ЧСС</Text>
                <Text style={styles.metricValue}>{selectedNorm.hr} в мин</Text>
              </View>
              <View style={[styles.metric, styles.metricFullWidth]}>
                <Text style={styles.metricLabel}>АД</Text>
                <Text style={styles.metricValue}>{selectedNorm.bp} мм рт. ст.</Text>
              </View>
            </View>

            <Text style={styles.disclaimer}>
              Значения ориентировочные и не заменяют клиническую оценку врача.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Служебная функция склонения
function plural(n, form1, form2, form5) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return form5;
  if (b > 1 && b < 5) return form2;
  if (b === 1) return form1;
  return form5;
}

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

  searchBox: {
    paddingHorizontal: 20,
    marginBottom: 16
  },
  inputContainer: {
    position: 'relative',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },
  helper: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500'
  },
  helperBold: {
    color: '#059669',
    fontWeight: '700'
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    color: '#9ca3af',
    fontSize: 18
  },

  card: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#059669',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3
  },
  cardBadge: {
    color: '#64748b',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  key: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500'
  },
  val: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700'
  },

  note: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 16,
    lineHeight: 18,
    fontStyle: 'italic',
    textAlign: 'center'
  },

  placeholder: {
    marginTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20
  },
  placeholderText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500'
  },

  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 70,
    alignItems: 'center'
  },
  quickBtnPressed: {
    backgroundColor: '#f1f5f9',
    borderColor: '#059669',
    shadowOpacity: 0.1
  },
  quickText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600'
  },

  // Новые стили для кнопок в виде сетки
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20
  },
  ageButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e2e8f0'
  },
  ageButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  ageButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  ageButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '700'
  },

  // Стили для карточки результата
  resultCard: {
    marginHorizontal: 20,
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  resultTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700'
  },
  resultBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600'
  },

  // Сетка метрик
  metricsGrid: {
    marginBottom: 16
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  metricFullWidth: {
    marginBottom: 0
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500'
  },
  metricValue: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700'
  },

  disclaimer: {
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16
  },
});
