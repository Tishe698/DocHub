// pediatric_norms_screen.js
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text } from '../components/AppText';

// --- ДАННЫЕ ИЗ ТАБЛИЦЫ ---
// Средние значения (weight, height, rr, hr, bp) — российские учебники педиатрии
// (Мазурин А.В., Воронцов И.М. «Пропедевтика детских болезней»), для обоих полов.
// Границы нормы (hrRange, rrRange, bpRange) — PALS (AHA) Provider Manual 2015/2020,
// таблицы «Normal heart rates / respiratory rates / blood pressures by age»,
// ЧСС — в бодрствовании. В РФ таких диапазонов в КР нет; где редакции PALS
// расходятся, взята более узкая граница (консервативно).
// Полосы PALS: новорождённый <28 дн; грудной 1–12 мес; 1–2 года; 3–5 лет;
// 6–11 лет (АД: 6–9 и 10–11 лет); 12–15 лет.
const NORMS = [
  // ЧДД новорождённого: верхняя граница 60 — КР МЗ РФ «Транзиторное тахипноэ
  // новорожденного» (2025, «Термины и определения»: тахипноэ — ЧДД > 60 в мин);
  // нижняя 30 — PALS. АД: объединены строки PALS «при рождении, 3 кг» (60–76/31–45)
  // и «4-е сутки» (67–84/35–53).
  { label: 'Новорожденные', months: 0,  weight: '3,5',   height: '50',    rr: '40–60', rrRange: '30–60', hr: '130–140', hrRange: '100–205', bp: '70/40',  bpRange: '60–84 / 31–53' },
  // Масса 3 мес: было 5 кг. APLS 2011 (0,5×мес+4) = 5,5 кг; Мазурин–Воронцов ≈ 5,8 кг;
  // медианы ВОЗ 2006: дев. 5,8, мал. 6,4 кг.
  // ЧСС до 1 года: PALS 2020 — 100–180 (в редакции 2015 — 100–190), взята более узкая.
  { label: '3 мес',          months: 3,  weight: '5,5–6', height: '60–62', rr: '35–40', rrRange: '30–53', hr: '120–130', hrRange: '100–180', bp: '85/40',  bpRange: '72–104 / 37–56' },
  // Масса 6 мес 7 кг = APLS 2011 (0,5×6+4), оставлена без изменений.
  { label: '6 мес',          months: 6,  weight: '7',     height: '67',    rr: '33–35', rrRange: '30–53', hr: '120–125', hrRange: '100–180', bp: '95/55',  bpRange: '72–104 / 37–56' },
  { label: '1 год',          months: 12, weight: '10',    height: '75',    rr: '30–32', rrRange: '22–37', hr: '120',     hrRange: '98–140',  bp: '92/56',  bpRange: '86–106 / 42–63' },
  { label: '2 года',         months: 24, weight: '12',    height: '87',    rr: '26–30', rrRange: '22–37', hr: '110–115', hrRange: '98–140',  bp: '94/56',  bpRange: '86–106 / 42–63' },
  // Новая строка 3 года: масса — APLS 2011 (2×3+8 = 14 кг) и Мазурин–Воронцов;
  // рост — медиана ВОЗ 2006 (дев. 95,1, мал. 96,1 см); ЧСС и ЧДД — между строками
  // 2 и 4 лет (внутри полос PALS); САД — 90+2n (Мазурин–Воронцов) = 96.
  { label: '3 года',         months: 36, weight: '14',    height: '95',    rr: '26–28', rrRange: '20–28', hr: '105–110', hrRange: '80–120',  bp: '96/56',  bpRange: '89–112 / 46–72' },
  { label: '4 года',         months: 48, weight: '16',    height: '101',   rr: '26',    rrRange: '20–28', hr: '100–105', hrRange: '80–120',  bp: '98/56',  bpRange: '89–112 / 46–72' },
  { label: '5 лет',          months: 60, weight: '19',    height: '109',   rr: '25–26', rrRange: '20–28', hr: '100',     hrRange: '80–120',  bp: '100/58', bpRange: '89–112 / 46–72' },
  { label: '6 лет',          months: 72, weight: '20',    height: '115',   rr: '25',    rrRange: '18–25', hr: '90–95',   hrRange: '75–118',  bp: '100/60', bpRange: '97–115 / 57–76' },
  // ЧСС 8 лет: было 78–80 (ниже, чем в 10 лет). Между 6 лет (90–95) и 10 лет (78–82):
  // Мазурин–Воронцов (5 лет — 100, 10 лет — 80), Fleming 2011 (медиана 6–8 лет 91, 8–12 лет 84).
  { label: '8 лет',          months: 96, weight: '25',    height: '129',   rr: '22–24', rrRange: '18–25', hr: '80–85',   hrRange: '75–118',  bp: '105/70', bpRange: '97–115 / 57–76' },
  { label: '10 лет',         months:120, weight: '30',    height: '140',   rr: '20–22', rrRange: '18–25', hr: '78–82',   hrRange: '75–118',  bp: '105/70', bpRange: '102–120 / 61–80' },
  // Масса 12 лет: было 33–35 кг. Мазурин–Воронцов 5n−20 = 40 кг;
  // медианы CDC 2000: мал. 40,7, дев. 41,8 кг.
  { label: '12 лет',         months:144, weight: '40–42', height: '151',   rr: '18–20', rrRange: '12–20', hr: '75–82',   hrRange: '60–100',  bp: '110/70', bpRange: '110–131 / 64–83' },
  // Масса 14 лет: было «до 45» (подавалось как верхняя граница). Мазурин–Воронцов
  // 5n−20 = 50 кг; медианы CDC 2000: дев. 49,5, мал. 51,2 кг.
  { label: '14 лет',         months:168, weight: '50',    height: '161',   rr: '16–20', rrRange: '12–20', hr: '72–78',   hrRange: '60–100',  bp: '120/70', bpRange: '110–131 / 64–83' },
];

// --- ХЕЛПЕРЫ ---
// Порог гипотензии (САД, мм рт. ст.) — PALS (AHA) 2015/2020:
// 0–28 дней < 60; 1–12 мес < 70; 1–10 лет < 70 + 2 × возраст (годы); старше 10 лет < 90.
function hypotensionSbp(months) {
  if (months < 1) return 60;
  if (months < 12) return 70;
  if (months <= 120) return 70 + 2 * Math.floor(months / 12);
  return 90;
}

// Подпись возраста для бейджа: «до 28 дней», «3 мес», «1 год», «2 года», «5 лет»
function ageBadge(months) {
  if (months < 1) return 'до 28 дней';
  if (months < 12) return `${months} мес`;
  const y = Math.floor(months / 12);
  return `${y} ${plural(y, 'год', 'года', 'лет')}`;
}

function Metric({ label, value, range, fullWidth }) {
  return (
    <View style={[styles.metric, fullWidth && styles.metricFullWidth]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRight}>
        <Text style={styles.metricValue}>{value}</Text>
        {range ? <Text style={styles.metricRange}>{range}</Text> : null}
      </View>
    </View>
  );
}

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
              <Text style={styles.resultBadge}>{ageBadge(selectedNorm.months)}</Text>
            </View>

            <View style={styles.metricsGrid}>
              <Metric label="Масса тела (средняя)" value={`${selectedNorm.weight} кг`} />
              <Metric label="Рост (средний)" value={`${selectedNorm.height} см`} />
              <Metric
                label="ЧДД"
                value={`${selectedNorm.rr} в мин`}
                range={`норма ${selectedNorm.rrRange}`}
              />
              <Metric
                label="ЧСС"
                value={`${selectedNorm.hr} в мин`}
                range={`норма ${selectedNorm.hrRange} (бодрствование)`}
              />
              <Metric
                label="АД"
                value={`${selectedNorm.bp} мм рт. ст.`}
                range={`норма ${selectedNorm.bpRange}`}
              />
              <View style={[styles.metric, styles.metricFullWidth, styles.metricAlert]}>
                <Text style={styles.metricLabel}>Гипотензия</Text>
                <Text style={styles.metricAlertValue}>
                  САД {'<'} {hypotensionSbp(selectedNorm.months)} мм рт. ст.
                </Text>
              </View>
            </View>

            <Text style={styles.disclaimer}>
              Основное значение — среднее для обоих полов (Мазурин А.В., Воронцов И.М.; масса —
              медианы ВОЗ/CDC). В калькуляторах масса по возрасту оценивается по APLS и для
              6–12 лет может быть выше табличной. «Норма» — границы по PALS (AHA) 2015/2020; где источники
              расходятся, взята более узкая граница. Гипотензия — по PALS. Значения
              ориентировочные и не заменяют клиническую оценку врача.
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

  metricRight: {
    alignItems: 'flex-end',
    flexShrink: 1,
    marginLeft: 12
  },
  metricRange: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right'
  },
  metricAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  metricAlertValue: {
    color: '#b91c1c',
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
