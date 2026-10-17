// NorepinephrineScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, TextInput } from '../components/AppText';

// --- утилиты ---
const parseNum = (v) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const fmt = (v, d = 2) => {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 10) return v.toFixed(1);
  return v.toFixed(d);
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

// Постоянный объём пакета для варианта с капельницей
const BAG_VOL_ML = 250;

export default function NorepinephrineScreen() {
  // разумные дефолты
  const [weight, setWeight]   = useState('70');   // кг
  const [dose, setDose]       = useState('0.1');  // мкг/кг/мин
  const [drugMg, setDrugMg]   = useState('8');    // мг в шприце/пакете
  const [syrVol, setSyrVol]   = useState('20');   // мл шприца

  const result = useMemo(() => {
    const W = parseNum(weight);
    const D = parseNum(dose);      // мкг/кг/мин
    const M = parseNum(drugMg);    // мг
    const V = parseNum(syrVol);    // мл

    const ok = [W, D, M, V].every(n => Number.isFinite(n) && n > 0);
    if (!ok) return { ok: false };

    // --- ШПРИЦ-ПОМПА (как введено: M мг в V мл) ---
    const conc_syr_mcg_ml = (M * 1000) / V;                // мкг/мл
    const mlph_syr = (D * W * 60) / conc_syr_mcg_ml;       // мл/ч

    // --- КАПЕЛЬНИЦА (тот же M мг, но разведено в 250 мл 5% глюкозы) ---
    const conc_bag_mcg_ml = (M * 1000) / BAG_VOL_ML;       // мкг/мл
    const mlph_bag = (D * W * 60) / conc_bag_mcg_ml;       // мл/ч
    const gtt20 = (mlph_bag / 60) * 20;                    // кап/мин для 20 кап/мл

    return {
      ok: true,
      conc_syr_mcg_ml,
      mlph_syr,
      conc_bag_mcg_ml,
      mlph_bag,
      gtt20,
    };
  }, [weight, dose, drugMg, syrVol]);

  const reset = () => {
    setWeight(''); setDose(''); setDrugMg(''); setSyrVol('');
  };

  const warnIfWeird = () => {
    if (!result.ok) return;
    // предупреждение только по скорости шприца
    if (result.mlph_syr < 0.1 || result.mlph_syr > 30) {
      Alert.alert(
        'Проверьте данные',
        'Получилась необычная скорость инфузии. Часто виновата масса (например, введено 2100 вместо 21.0).'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>💉 Норадреналин — расчёт инфузии</Text>
        <Text style={styles.subtitle}>
          Скорость по дозе (мкг/кг/мин) и концентрации. Капли — для разведения в 250 мл 5% глюкозы.
        </Text>

        <Section title="Входные данные">
          <View style={styles.row}>
            <Text style={styles.label}>Масса тела</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="кг"
                placeholderTextColor="#8b8b91"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                style={styles.input}
              />
              <Text style={styles.unit}>кг</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Дозировка</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={dose}
                onChangeText={setDose}
                placeholder="мкг/кг/мин"
                placeholderTextColor="#8b8b91"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                style={styles.input}
              />
              <Text style={styles.unit}>мкг/кг/мин</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Норадреналин (в растворе)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={drugMg}
                onChangeText={setDrugMg}
                placeholder="мг"
                placeholderTextColor="#8b8b91"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                style={styles.input}
              />
              <Text style={styles.unit}>мг</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Объём шприца</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={syrVol}
                onChangeText={setSyrVol}
                placeholder="мл"
                placeholderTextColor="#8b8b91"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                style={styles.input}
              />
              <Text style={styles.unit}>мл</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondary} onPress={reset}>
              <Text style={styles.secondaryText}>Сбросить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primary} onPress={warnIfWeird}>
              <Text style={styles.primaryText}>Проверить</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Результаты">
          {/* Шприц-помпа */}
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Конц. шприца</Text>
            <Text style={styles.resultValue}>
              {result.ok ? `${fmt(result.conc_syr_mcg_ml)} мкг/мл` : '—'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Скорость (шприц-помпа)</Text>
            <Text style={styles.resultValue}>
              {result.ok ? `${fmt(result.mlph_syr)} мл/ч` : '—'}
            </Text>
          </View>

          {/* Капельница 250 мл */}
          <View style={[styles.resultRow, { borderTopColor: '#e2e8f0', borderTopWidth: 1, marginTop: 8 }]}>
            <Text style={[styles.resultLabel, { color: '#475569' }]}>
              Если развести в {BAG_VOL_ML} мл 5% глюкозы
            </Text>
            <Text style={[styles.resultValue, { color: '#475569' }]} />
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Конц. раствора</Text>
            <Text style={styles.resultValue}>
              {result.ok ? `${fmt(result.conc_bag_mcg_ml)} мкг/мл` : '—'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Скорость (мл/ч)</Text>
            <Text style={styles.resultValue}>
              {result.ok ? `${fmt(result.mlph_bag)} мл/ч` : '—'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Капли в минуту (20 кап/мл)</Text>
            <Text style={styles.resultValue}>
              {result.ok ? `${fmt(result.gtt20, 1)} кап/мин` : '—'}
            </Text>
          </View>

          <Text style={styles.hint}>
            Формула: мл/ч = (доза мкг/кг/мин × масса × 60) / (концентрация мкг/мл).{'\n'}
            «Капли/мин» считаются для раствора, разведённого в 250 мл (стандартный пакет) с капельностью 20 кап/мл.
          </Text>
        </Section>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- стили ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 32 },
  title: {
    color: '#1e293b', fontSize: 24, fontWeight: '800',
    letterSpacing: -0.5, textAlign: 'center', marginBottom: 8,
  },
  subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', fontWeight: '500', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#1e293b', fontWeight: '800', fontSize: 18, marginBottom: 12, letterSpacing: -0.3 },
  card: {
    backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 16, padding: 16,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  row: { marginBottom: 16 },
  label: { color: '#374151', marginBottom: 8, fontWeight: '600', fontSize: 15 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderColor: '#d1d5db', borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  input: { flex: 1, color: '#1e293b', fontSize: 16, fontWeight: '500', paddingVertical: 0 },
  unit: { color: '#64748b', marginLeft: 8, fontWeight: '600', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'center' },
  primary: {
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#3b82f6', borderRadius: 16,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  secondary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  secondaryText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  resultLabel: { color: '#374151', fontWeight: '600', flex: 1, paddingRight: 12, fontSize: 15 },
  resultValue: { color: '#059669', fontWeight: '800', fontSize: 16 },
  hint: { color: '#64748b', marginTop: 12, fontStyle: 'italic', fontSize: 14, lineHeight: 20 },
});
