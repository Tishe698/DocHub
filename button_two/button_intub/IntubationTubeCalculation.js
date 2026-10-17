import React, { useState } from 'react';
import { View, Switch, TouchableOpacity, ScrollView } from 'react-native';
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
    keyboardType="decimal-pad"
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
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
    <Text style={{ color: '#6B7280', flexShrink: 1 }}>{label}</Text>
    <Text style={{ fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
  </View>
);

const METHOD_LABELS = {
  neonate: 'новорождённый, по массе (NRP)',
  broselowHeight: 'по длине тела (Broselow)',
  broselowWeight: 'по массе (зона Broselow)',
  infantAge: 'младенец, по возрасту (масса по APLS)',
  age: 'по возрасту (PALS/ERC)',
  teen: 'подросток 13–15 лет: по возрасту и росту, не больше взрослых',
  adult: 'взрослые размеры (с 16 лет), по полу',
};

const fmtNum = (x) => String(x).replace('.', ',');
const fmtMm = (x) => Number(x).toFixed(1).replace('.', ',');

const IntubationTubeCalculation = () => {
  const [heightCm, setHeightCm] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sex, setSex] = useState(null);
  const [cuffed, setCuffed] = useState(false);
  const [route, setRoute] = useState('both');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Любое изменение ввода сбрасывает прежний результат, чтобы на экране не оставался
  // расчёт для других данных.
  const withReset = (setter) => (value) => {
    setter(value);
    setResult(null);
    setError(null);
  };

  const onCalculate = () => {
    setError(null);
    try {
      // Строгий разбор: «1.2.3» или «12кг» — ошибка ввода, а не 1,2 / 12.
      const num = (s) => (s && s.trim() ? Number(s.trim().replace(',', '.')) : undefined);
      const h = num(heightCm);
      const ageY = num(ageYears);
      const ageM = num(ageMonths);
      const w = num(weightKg);

      const bad = [
        [heightCm, h, 'Рост'],
        [ageYears, ageY, 'Годы'],
        [ageMonths, ageM, 'Месяцы'],
        [weightKg, w, 'Масса'],
      ].find(([, val]) => val !== undefined && !isFinite(val));
      if (bad) throw new Error(`${bad[2]}: введите число.`);

      const res = calculateIntubationTubeLogic({
        heightCm: isFinite(h) ? h : undefined,
        ageYears: isFinite(ageY) ? ageY : undefined,
        ageMonths: isFinite(ageM) ? ageM : undefined,
        weightKg: isFinite(w) ? w : undefined,
        sex: sex || undefined,
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
    setSex(null);
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
        <Label>Рост / длина тела (см) — приоритетно (лента Broselow 46,8–143,3 см)</Label>
        <Row>
          <NumberInput value={heightCm} onChangeText={withReset(setHeightCm)} placeholder="Напр. 92" />
        </Row>

        <View style={{ height: 12 }} />

        <Label>Возраст</Label>
        <Row>
          <NumberInput value={ageYears} onChangeText={withReset(setAgeYears)} placeholder="Годы" />
          <NumberInput value={ageMonths} onChangeText={withReset(setAgeMonths)} placeholder="Месяцы" />
        </Row>

        <View style={{ height: 12 }} />

        <Label>Масса (кг)</Label>
        <Row>
          <NumberInput value={weightKg} onChangeText={withReset(setWeightKg)} placeholder="Напр. 3,2" />
        </Row>

        <View style={{ height: 12 }} />

        <Label>Пол (нужен с 13 лет и при росте &gt;143 см)</Label>
        <Row>
          <Pill active={sex === 'female'} onPress={() => withReset(setSex)(sex === 'female' ? null : 'female')}>Женский</Pill>
          <Pill active={sex === 'male'} onPress={() => withReset(setSex)(sex === 'male' ? null : 'male')}>Мужской</Pill>
        </Row>

        <View style={{ height: 12 }} />

        <Label>Манжетка</Label>
        <Row>
          <Text>Без манжетки</Text>
          <Switch value={cuffed} onValueChange={withReset(setCuffed)} />
          <Text>С манжеткой</Text>
        </Row>

        <View style={{ height: 12 }} />

        <Label>Путь</Label>
        <Row>
          <Pill active={route === 'oral'} onPress={() => withReset(setRoute)('oral')}>Оральная</Pill>
          <Pill active={route === 'nasal'} onPress={() => withReset(setRoute)('nasal')}>Назальная</Pill>
          <Pill active={route === 'both'} onPress={() => withReset(setRoute)('both')}>Обе</Pill>
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
            Порядок: новорождённый (&lt;1 мес) с массой → по массе; рост 46,8–143,3 см → лента Broselow;
            1–12 лет → по возрасту; до 1 года → по массе (или по возрасту); 13–15 лет и рост &gt;143 см без возраста →
            по возрасту и росту, не больше взрослых (нужен пол); с 16 лет → взрослые размеры по полу.
          </Text>
        </Box>
      )}

      {result && (
        <Box>
          <Text style={{ fontWeight: '800', marginBottom: 8 }}>Результаты</Text>
          <ResultRow label="Метод" value={METHOD_LABELS[result.method] || result.method} />
          {result.broselowZone && (
            <ResultRow label="Зона Broselow" value={`${result.broselowZone}, ${result.zoneRange}`} />
          )}
          {result.approxWeightKg && <ResultRow label="Масса зоны (кг)" value={String(result.approxWeightKg)} />}
          <ResultRow label="Тип трубки" value={result.tubeType} />
          <ResultRow label="Внутренний диаметр (мм)" value={fmtMm(result.tubeIDmm)} />
          <ResultRow label="Альтернативы (мм)" value={result.alternativesMm.map(fmtMm).join(' / ')} />
          {(route === 'oral' || route === 'both') && (
            <ResultRow label="Глубина через рот (см)" value={fmtNum(result.depthOralCm)} />
          )}
          {(route === 'nasal' || route === 'both') && (
            <ResultRow label="Глубина назальная (см)" value={fmtNum(result.depthNasalCm)} />
          )}
          {!!result?.used?.length && (
            <Text style={{ color: '#374151', fontSize: 12, marginBottom: 2 }}>Учтено: {result.used.join(', ')}</Text>
          )}
          {!!result?.ignored?.length && (
            <Text style={{ color: '#374151', fontSize: 12, marginBottom: 2 }}>Не использовано: {result.ignored.join('; ')}</Text>
          )}
          {!!result?.warnings?.length && (
            <View style={{ marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 8 }}>
              {result.warnings.map((n, i) => (
                <Text key={i} style={{ color: '#92400E', fontSize: 13, marginBottom: 2 }}>⚠️ {n}</Text>
              ))}
            </View>
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