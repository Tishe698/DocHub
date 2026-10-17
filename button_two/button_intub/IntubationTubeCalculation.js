import React, { useState } from 'react';
import { View, Switch, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Text, TextInput } from '../../components/AppText';
import { calculateIntubationTubeLogic } from './CalculateIntubationTube';

const Label = ({ children }) => (
  <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>{children}</Text>
);

const Box = ({ children }) => (
  <View style={{
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12
  }}>{children}</View>
);

const Row = ({ children }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{children}</View>
);

const Pill = ({ active, onPress, children }) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Выбрать: ${children}`}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: active ? '#2563EB' : '#E5E7EB'
    }}
  >
    <Text style={{ color: active ? '#FFFFFF' : '#111827', fontWeight: '600' }}>{children}</Text>
  </TouchableOpacity>
);

const NumberInput = ({ value, onChangeText, placeholder }) => (
  <TextInput
    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'number-pad'}
    value={value || ''}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#9CA3AF"
    textAlignVertical="center"
    style={{
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 10,
      padding: 10,
      fontSize: 16,
      flex: 1
    }}
  />
);

const ResultRow = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
    <Text style={{ color: '#6B7280' }}>{label}</Text>
    <Text style={{ fontWeight: '700' }}>{value}</Text>
  </View>
);

const IntubationTubeCalculation = () => {
  const [heightCm, setHeightCm] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [cuffed, setCuffed] = useState(false);
  const [route, setRoute] = useState('both');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onCalculate = () => {
    setError(null);
    try {
      const h = heightCm ? parseFloat(heightCm.replace(',', '.')) : undefined;
      const ageY = ageYears ? parseFloat(ageYears.replace(',', '.')) : undefined;
      const ageM = ageMonths ? parseFloat(ageMonths.replace(',', '.')) : undefined;
      const w = weightKg ? parseFloat(weightKg.replace(',', '.')) : undefined;

      const res = calculateIntubationTubeLogic({
        heightCm: isFinite(h) ? h : undefined,
        ageYears: isFinite(ageY) ? ageY : undefined,
        ageMonths: isFinite(ageM) ? ageM : undefined,
        weightKg: isFinite(w) ? w : undefined,
        cuffed,
        route,
      });
      setResult(res);
    } catch (e) {
      setResult(null);
      setError(e?.message || 'Ошибка расчёта');
    }
  };

  const clearAll = () => {
    setHeightCm('');
    setAgeYears('');
    setAgeMonths('');
    setWeightKg('');
    setCuffed(false);
    setRoute('both');
    setResult(null);
    setError(null);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F3F4F6' }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 16,
        paddingBottom: 32,
      }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
    >
      <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 12 }}>
        Расчёт эндотрахеальной трубки (Скорая помощь)
      </Text>

      <Box>
        <Label>Рост (см) — приоритетно для СМП (Broselow)</Label>
        <Row>
          <NumberInput value={heightCm} onChangeText={setHeightCm} placeholder="Напр. 92" />
        </Row>

        <View style={{ height: 12 }} />

        <Label>Возраст</Label>
        <Row>
          <NumberInput value={ageYears} onChangeText={setAgeYears} placeholder="Годы" />
          <NumberInput value={ageMonths} onChangeText={setAgeMonths} placeholder="Месяцы" />
        </Row>

        <View style={{ height: 12 }} />

        <Label>Вес (кг)</Label>
        <Row>
          <NumberInput value={weightKg} onChangeText={setWeightKg} placeholder="Напр. 3.2" />
        </Row>

        <View style={{ height: 12 }} />

        <Label>Манжетка</Label>
        <Row>
          <Text>Без манжетки</Text>
          <Switch value={cuffed} onValueChange={setCuffed} />
          <Text>С манжеткой</Text>
        </Row>

        <View style={{ height: 12 }} />

        <Label>Путь</Label>
        <Row>
          <Pill active={route === 'oral'} onPress={() => setRoute('oral')}>Оральная</Pill>
          <Pill active={route === 'nasal'} onPress={() => setRoute('nasal')}>Назальная</Pill>
          <Pill active={route === 'both'} onPress={() => setRoute('both')}>Обе</Pill>
        </Row>
      </Box>

      <Row>
        <TouchableOpacity
          onPress={onCalculate}
          style={{ backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>🔢 Рассчитать</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={clearAll}
          style={{ backgroundColor: '#E5E7EB', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 }}
        >
          <Text style={{ color: '#111827', fontWeight: '700' }}>♻️ Очистить</Text>
        </TouchableOpacity>
      </Row>

      {error && (
        <Box>
          <Text style={{ color: '#B91C1C' }}>Ошибка: {error}</Text>
          <Text style={{ color: '#6B7280', marginTop: 6, fontSize: 12 }}>
            Приоритет расчёта: Рост → Вес (&lt;1 года) → Возраст (≥1 года).
          </Text>
        </Box>
      )}

      {result && (
        <Box>
          <Text style={{ fontWeight: '800', marginBottom: 8 }}>Результаты</Text>
          <ResultRow label="Метод" value={
            result.method === 'height' ? 'по росту (Broselow)' :
            result.method === 'weight' ? 'по весу' : 'по возрасту'
          } />
          {result.broselowZone && <ResultRow label="Зона Broselow" value={result.broselowZone} />}
          {result.approxWeightKg && <ResultRow label="Примерный вес (кг)" value={String(result.approxWeightKg)} />}
          <ResultRow label="Рекомендуемый диаметр (мм)" value={String(result.tubeIDmm)} />
          <ResultRow label="Альтернативы (мм)" value={`${result.alternativesMm[0]} / ${result.alternativesMm[1]}`} />
          {(route === 'oral' || route === 'both') && (
            <ResultRow label="Глубина оральная (см)" value={`${result.depthOralCm}`} />
          )}
          {(route === 'nasal' || route === 'both') && (
            <ResultRow label="Глубина назальная (см)" value={`${result.depthNasalCm}`} />
          )}
          {!!result?.notes?.length && (
            <View style={{ marginTop: 8 }}>
              {result.notes.map((n, i) => (
                <Text key={i} style={{ color: '#6B7280', fontSize: 12, marginBottom: 2 }}>• {n}</Text>
              ))}
            </View>
          )}
        </Box>
      )}
    </ScrollView>
  );
};

export default IntubationTubeCalculation;