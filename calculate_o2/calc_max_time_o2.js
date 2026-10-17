// Время работы кислородного баллона. Расчёт — calculate_o2/oxygenCalc.js.
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce } from '../components/a11y';
import {
  Button,
  ChoiceChips,
  NumberField,
  ResultCard,
  Section,
  Card,
  Note,
} from '../components/ui';
import parseNum from '../utils/parseNum';
import { useOxyStyles } from './style_oxy';
import {
  DEFAULT_RESERVE_ATM,
  LIMITS,
  UNITS,
  computeO2Time,
  fmt1,
  formatMinutes,
  pluralMinutes,
  validateO2Fields,
} from './oxygenCalc';

// Для совместимости со старыми импортами экрана
export { DEFAULT_RESERVE_ATM, LIMITS, computeO2Time, formatMinutes, pluralMinutes };

const UNIT_OPTIONS = [
  { value: UNITS.ATM, label: 'атм', accessibilityLabel: 'атмосферы' },
  { value: UNITS.MPA, label: 'МПа', accessibilityLabel: 'мегапаскали' },
];

const hoursText = (min) => (min >= 60 ? `${Math.floor(min / 60)} ч ${min % 60} мин` : null);

const Calc_max_time_o2 = () => {
  const styles = useOxyStyles();
  const [volume, setVolume] = useState('');
  const [pressure, setPressure] = useState('');
  const [unit, setUnit] = useState(UNITS.ATM);
  const [flow, setFlow] = useState('');
  const [reserve, setReserve] = useState(String(DEFAULT_RESERVE_ATM));

  const input = useMemo(
    () => ({
      volume: parseNum(volume),
      pressure: parseNum(pressure),
      unit,
      flow: parseNum(flow),
      reserveAtm: parseNum(reserve),
    }),
    [volume, pressure, unit, flow, reserve],
  );

  // Ошибки показываем только у заполненных полей; текст, который не разобрался как число, — тоже ошибка
  const errors = useMemo(() => {
    const e = validateO2Fields(input);
    const notNumber = 'Введите число, например 10 или 10,5';
    if (volume.trim() && input.volume === undefined) e.volume = notNumber;
    if (pressure.trim() && input.pressure === undefined) e.pressure = notNumber;
    if (flow.trim() && input.flow === undefined) e.flow = notNumber;
    if (reserve.trim() && input.reserveAtm === undefined) e.reserve = notNumber;
    return e;
  }, [input, volume, pressure, flow, reserve]);

  const hasErrors = Object.keys(errors).length > 0;
  const ready =
    input.volume !== undefined &&
    input.pressure !== undefined &&
    input.flow !== undefined &&
    input.reserveAtm !== undefined;
  const result = useMemo(() => {
    if (!ready || hasErrors) return null;
    const r = computeO2Time(input);
    return r.error ? null : r;
  }, [ready, hasErrors, input]);

  const resetFields = () => {
    setVolume('');
    setPressure('');
    setUnit(UNITS.ATM);
    setFlow('');
    setReserve(String(DEFAULT_RESERVE_ATM));
    announce('Поля очищены');
  };

  const unitLabel = unit === UNITS.MPA ? 'МПа' : 'атм';
  const reserveFmt = result ? fmt1(result.reserveAtm) : '';

  return (
    <Screen scroll>
      <Text variant="body" color="textSecondary" style={styles.intro}>
        Продолжительность кислородотерапии по вместимости баллона, показанию манометра и скорости
        потока. Время считается до резерва давления, который не расходуют.
      </Text>

      <Section title="Баллон и поток">
        <NumberField
          label="Вместимость баллона"
          unit="л"
          value={volume}
          onChangeText={setVolume}
          placeholder="обычно 1–40"
          error={errors.volume}
          testID="o2-volume"
        />
        <ChoiceChips
          label="Единица давления"
          options={UNIT_OPTIONS}
          value={unit}
          onChange={setUnit}
        />
        <NumberField
          label="Показание манометра"
          unit={unitLabel}
          value={pressure}
          onChangeText={setPressure}
          placeholder={unit === UNITS.MPA ? 'например 15' : 'например 150'}
          error={errors.pressure}
          hint="атм = кгс/см² ≈ бар; 1 МПа = 10 атм"
          testID="o2-pressure"
        />
        {/* Расход пневмоприводного аппарата ИВЛ не равен МОД: часть O2 идёт на привод,
            в режиме Air Mix расход меньше МОД (эксплуатационная документация аппаратов). */}
        <NumberField
          label="Скорость потока"
          unit="л/мин"
          value={flow}
          onChangeText={setFlow}
          error={errors.flow}
          hint="При ИВЛ от баллона вводите расход O₂ аппаратом по его паспорту (с учётом привода и режима Air Mix), а не МОД."
          testID="o2-flow"
        />
        <NumberField
          label="Резерв (не расходовать)"
          unit="атм"
          value={reserve}
          onChangeText={setReserve}
          placeholder="0 — без резерва"
          error={errors.reserve}
          hint={`Норматива РФ нет. По умолчанию ${DEFAULT_RESERVE_ATM} атм (≈ 200 psi) — консервативная практика СМП. Укажите резерв вашей службы.`}
          testID="o2-reserve"
        />
        <View style={styles.actions}>
          <Button
            title="Сбросить"
            variant="secondary"
            icon="refresh"
            onPress={resetFields}
            accessibilityHint="Очистить поля и вернуть резерв по умолчанию"
            style={styles.action}
          />
        </View>
      </Section>

      {result ? (
        result.empty ? (
          <ResultCard
            title="Время до резерва"
            value="0"
            unit="минут"
            level="danger"
            levelLabel="Баллон на резерве — замените баллон"
            announceText={`Баллон на резерве. Давление ${fmt1(result.pressureAtm)} атмосфер не выше резерва ${reserveFmt}. Замените баллон.`}
          >
            <Text variant="body">
              {`Давление ${fmt1(result.pressureAtm)} атм не выше резерва ${reserveFmt} атм. Замените баллон.`}
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.paragraph}>
              {`До нуля на манометре (теоретический максимум): ${formatMinutes(result.maxMinutes)}`}
            </Text>
          </ResultCard>
        ) : (
          <ResultCard
            title={`Время до резерва ${reserveFmt} атм`}
            value={String(result.minutes)}
            unit={pluralMinutes(result.minutes)}
            announceText={`Время до резерва: ${formatMinutes(result.minutes)}. До нуля: ${formatMinutes(result.maxMinutes)}.`}
          >
            {hoursText(result.minutes) ? (
              <Text variant="bodyStrong">{`= ${hoursText(result.minutes)}`}</Text>
            ) : null}
            <Text variant="caption" color="textSecondary" style={styles.paragraph}>
              Расчётное время непрерывной ингаляции; округлено вниз.
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.paragraph}>
              {`До нуля на манометре (теоретический максимум): ${formatMinutes(result.maxMinutes)}`}
            </Text>
          </ResultCard>
        )
      ) : (
        <Text variant="caption" color="textSecondary" style={styles.intro}>
          Заполните все поля — результат появится автоматически.
        </Text>
      )}

      {result && result.highFlow ? (
        <Note level="warning" title={`Поток выше ${LIMITS.flowWarn} л/мин`}>
          Проверьте, что редуктор его обеспечивает.
        </Note>
      ) : null}

      <Section title="Формулы">
        <Card>
          <Text variant="bodyStrong">Давление в атм (кгс/см², бар)</Text>
          <Text style={styles.formulaLine}>
            Время (мин) = Объём (л) × (Давление − Резерв) ÷ Поток (л/мин)
          </Text>
        </Card>
        <Card>
          <Text variant="bodyStrong">Давление в МПа</Text>
          <Text style={styles.formulaLine}>
            Время (мин) = Объём × (Давление × 10 − Резерв в атм) ÷ Поток
          </Text>
        </Card>
      </Section>

      <Note level="warning" title="Замена баллона">
        Готовьте замену заранее, когда давление приближается к резерву. Рекомендуется иметь
        резервный баллон.
      </Note>
    </Screen>
  );
};

export default Calc_max_time_o2;
