// shock_algov_app.js
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Switch, Pressable, ScrollView, Platform } from 'react-native';
import calculateShockIndex from './calculateShockIndex';

const theme = {
  bg: '#111827',
  accent: '#6366F1',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#475569',
  line: '#E2E8F0',
  danger: '#EF4444',
  ok: '#10B981',
  warn: '#F59E0B',
};

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

const Header = ({ title, subtitle }) => (
  <View style={{ padding: 22, backgroundColor: theme.bg }}>
    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{title}</Text>
    {!!subtitle && <Text style={{ color: 'rgba(255,255,255,0.9)', marginTop: 6 }}>{subtitle}</Text>}
  </View>
);

const Section = ({ title, children }) => (
  <View style={[{ backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.line }, shadow]}>
    {!!title && <Text style={{ fontSize: 14, color: theme.sub, marginBottom: 8, fontWeight: '700' }}>{title}</Text>}
    {children}
  </View>
);

const Row = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>
);

const Input = ({ value, onChangeText, placeholder }) => (
  <TextInput
    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={theme.line}
    style={{ flex: 1, borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, color: theme.text, backgroundColor: '#fff' }}
  />
);

const Button = ({ title, onPress, type = 'primary' }) => {
  const bg = type === 'primary' ? theme.accent : '#E5E7EB';
  const fg = type === 'primary' ? '#fff' : theme.text;
  return (
    <Pressable onPress={onPress} android_ripple={{ color: '#cbd5e1' }} style={{ backgroundColor: bg, paddingVertical: 14, borderRadius: 14, alignItems: 'center', flex: 1 }}>
      <Text style={{ color: fg, fontWeight: '800' }}>{title}</Text>
    </Pressable>
  );
};

const Chip = ({ label, color }) => (
  <View style={{ backgroundColor: color, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 }}>
    <Text style={{ color: '#fff', fontWeight: '800' }}>{label}</Text>
  </View>
);

const CalcShockIndexScreen = () => {
  const [sbp, setSbp] = useState('');
  const [hr, setHr] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [pregnant, setPregnant] = useState(false);
  const [trauma, setTrauma] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);

  const subtitle = useMemo(() => 'Индекс Альговера (SI = Пульс / САД). EMS: взрослые, SIPA, беременность, травма.', []);

  const parse = (s) => {
    if (!s) return undefined;
    const v = parseFloat(String(s).replace(',', '.'));
    return Number.isFinite(v) ? v : undefined;
  };

  const doCalc = () => {
    setErr(null);
    try {
      const out = calculateShockIndex({
        sbp: parse(sbp),
        hr: parse(hr),
        ageYears: parse(ageYears),
        pregnant,
        trauma,
      });
      setRes(out);
    } catch (e) {
      setRes(null);
      setErr(e?.message || 'Ошибка расчёта');
    }
  };

  const doClear = () => {
    setSbp('');
    setHr('');
    setAgeYears('');
    setPregnant(false);
    setTrauma(false);
    setRes(null);
    setErr(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Header title="Шоковый индекс Альговера" subtitle={subtitle} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Section title="Входные данные">
          <Row>
            <Input value={hr} onChangeText={setHr} placeholder="Пульс (уд/мин)" />
            <Input value={sbp} onChangeText={setSbp} placeholder="САД (мм рт. ст.)" />
          </Row>

          <View style={{ height: 12 }} />

          <Row>
            <Input value={ageYears} onChangeText={setAgeYears} placeholder="Возраст (лет, опц.)" />
          </Row>

          <View style={{ height: 12 }} />

          <Row>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: theme.sub }}>Беременность</Text>
              <Switch
                value={pregnant}
                onValueChange={setPregnant}
                trackColor={{
                  false: Platform.OS === 'android' ? '#E5E7EB' : undefined,
                  true: Platform.OS === 'android' ? theme.accent : undefined
                }}
                thumbColor={Platform.OS === 'android' ? (pregnant ? '#FFFFFF' : '#F9FAFB') : undefined}
              />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: theme.sub }}>Травма</Text>
              <Switch
                value={trauma}
                onValueChange={setTrauma}
                trackColor={{
                  false: Platform.OS === 'android' ? '#E5E7EB' : undefined,
                  true: Platform.OS === 'android' ? theme.accent : undefined
                }}
                thumbColor={Platform.OS === 'android' ? (trauma ? '#FFFFFF' : '#F9FAFB') : undefined}
              />
            </View>
          </Row>
        </Section>

        <Row>
          <Button title="🔢 Рассчитать" onPress={doCalc} />
          <Button title="♻️ Очистить" onPress={doClear} type="secondary" />
        </Row>

        {err && (
          <Section title="Ошибка">
            <Text style={{ color: theme.danger, fontWeight: '700' }}>{err}</Text>
          </Section>
        )}

        {res && (
          <Section title="Результат">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: theme.sub }}>SI = Пульс / САД</Text>
              <Chip label={`SI = ${res.si.toFixed(2)}`} color={res.category.color} />
            </View>

            <View style={{ height: 8 }} />
            <Text style={{ fontWeight: '800', marginBottom: 6 }}>Интерпретация</Text>
            <Text style={{ color: theme.text, marginBottom: 4 }}>{res.category.label}</Text>
            <Text style={{ color: theme.sub }}>{res.interpretation}</Text>

            <View style={{ height: 12 }} />

            {res.pediatric && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.sub }}>SIPA-порог для возраста: ≤ {res.pediatric.cutoff}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <Chip label={`Потеря крови: ${res.bloodLossHint}`} color="#64748B" />
              {res.flags.pregnancyConcern && <Chip label="Беременность: SI ≥ 1" color={theme.danger} />}
              {res.flags.traumaHighRisk && <Chip label="Травма: SI ≥ 0.9" color={theme.warn} />}
            </View>

            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 12 }}>
              {res.notes.map((n, i) => (
                <Text key={i} style={{ color: theme.sub, marginBottom: 4 }}>• {n}</Text>
              ))}
            </View>
          </Section>
        )}
      </ScrollView>
    </View>
  );
};

export default CalcShockIndexScreen;