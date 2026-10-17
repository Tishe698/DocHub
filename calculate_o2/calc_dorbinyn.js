// Формула Дарбиняна: минутный объём дыхания по массе тела. Расчёт — calculate_o2/darbinyanCalc.js.
// Масса, рост и пол — из общего пациента (patient/PatientContext.js).
import React, { useState } from 'react';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { ChoiceChips, NumberField, ResultCard, Section, Card, Note } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient, usePatientNumber } from '../patient/PatientContext';
import parseNum from '../utils/parseNum';
import { useOxyStyles } from './style_oxy';
import { WEIGHT_CHILD, WEIGHT_MIN, computeDarbinyan, darbinyanFor, fmt } from './darbinyanCalc';
import { HEIGHT_MAX, HEIGHT_MIN } from './ventilatorCalc';

// Для совместимости со старыми импортами экрана
export { WEIGHT_MIN, WEIGHT_CHILD, computeDarbinyan, fmt };

const BASIS_OPTIONS = [
  { value: 'actual', label: 'Фактическая масса' },
  {
    value: 'pbw',
    label: 'Должная (рост и пол)',
    accessibilityLabel: 'Должная масса по росту и полу',
  },
];
const SEX_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];
const SEX_SHORT = { male: 'муж.', female: 'жен.' };

const Calc_dorbinyn = () => {
  const styles = useOxyStyles();
  const { patient, setPatient, derived } = usePatient();
  const weight = usePatientNumber('weightKg');
  const height = usePatientNumber('heightCm');
  const [basis, setBasis] = useState('actual');

  // Мусор в поле роста («17,5,») тоже не попадает в контекст: должную массу по старому росту
  // не считаем — рост для расчёта пустой, под полем ошибка
  const heightNotNumber = height.text.trim() !== '' && !(parseNum(height.text) >= 0);
  const r = darbinyanFor({
    weightKg: weight.value,
    heightCm: heightNotNumber ? null : height.value,
    sex: patient.sex,
    basis,
  });
  const weightTyped = weight.text.trim() !== '';
  // Мусор в поле не попадает в контекст — результат по старой массе не показываем
  const weightNotNumber = weightTyped && !(parseNum(weight.text) >= 0);
  const ok = r.mv !== undefined && !(basis === 'actual' && weightNotNumber);

  const weightError =
    basis === 'actual'
      ? weightNotNumber
        ? 'Введите число, например 75 или 7,5'
        : r.error || undefined
      : undefined;
  const heightOutOfRange =
    !heightNotNumber &&
    height.value !== null &&
    (height.value < HEIGHT_MIN || height.value > HEIGHT_MAX);
  const heightError = heightNotNumber
    ? 'Введите число, например 175'
    : heightOutOfRange
      ? `Рост — от ${HEIGHT_MIN} до ${HEIGHT_MAX} см`
      : undefined;

  const basisText =
    r.basis === 'pbw' && r.pbw
      ? `по должной массе ${fmt(r.massKg)} кг (рост ${fmt(height.value)} см, ${SEX_SHORT[r.pbw.sex]})`
      : `по фактической массе ${fmt(r.massKg)} кг${derived.weightIsEstimate ? ' (оценка)' : ''}`;

  return (
    <Screen scroll>
      <PatientBar />
      <Text variant="body" color="textSecondary" style={styles.intro}>
        Ориентировочный стартовый минутный объём дыхания (МОД) для настройки ИВЛ по массе тела.
      </Text>

      <Section title="Масса тела">
        <NumberField
          label="Масса тела"
          unit="кг"
          value={weight.text}
          onChangeText={weight.onChangeText}
          badge={derived.weightIsEstimate ? 'оценка' : null}
          error={weightError}
          testID="darbinyan-weight"
        />
        {/* Расчёт по должной (предсказанной) массе тела — ARDSNet, NEJM 2000;
            КР ФАР «Диагностика и интенсивная терапия ОРДС», 2020. */}
        <ChoiceChips
          label="Считать по массе"
          options={BASIS_OPTIONS}
          value={basis}
          onChange={setBasis}
          hint="При ожирении считайте по должной массе тела"
        />
        {basis === 'pbw' ? (
          <>
            <ChoiceChips
              label="Пол"
              options={SEX_OPTIONS}
              value={patient.sex}
              onChange={(sex) => setPatient({ sex })}
            />
            <NumberField
              label="Рост"
              unit="см"
              value={height.text}
              onChangeText={height.onChangeText}
              error={heightError}
              testID="darbinyan-height"
            />
            {r.pbw ? (
              <Text variant="bodyStrong" style={styles.paragraph}>
                {`Должная масса: ${fmt(r.pbw.kg)} кг`}
              </Text>
            ) : null}
            {derived.isChild ? (
              <Note level="warning" title="Пациент младше 18 лет">
                Формула должной массы ARDSNet выведена для взрослых — у ребёнка это лишь ориентир.
              </Note>
            ) : null}
          </>
        ) : (
          <Text variant="caption" color="textSecondary">
            При ожирении выберите «Должная (рост и пол)»: расчёт пойдёт по росту и полу, а не по
            фактической массе.
          </Text>
        )}
      </Section>

      {basis === 'pbw' && r.error && !heightNotNumber ? (
        <Note level="info" title="Нужны данные">
          {r.error}
        </Note>
      ) : null}

      {ok ? (
        <ResultCard
          title="Минутный объём дыхания (МОД)"
          value={fmt(r.mv)}
          unit="л/мин"
          level={r.child ? 'warning' : undefined}
          levelLabel={r.child ? `Масса меньше ${WEIGHT_CHILD} кг — только ориентир` : undefined}
          announceText={`МОД ${fmt(r.mv)} литра в минуту, ${basisText}`}
        >
          <Text variant="caption" color="textSecondary">
            {`Расчёт ${basisText}.`}
          </Text>
          <Text variant="body" style={styles.paragraph}>
            Ориентировочный стартовый МОД. Корректируйте по экскурсии грудной клетки, SpO₂ и EtCO₂.
          </Text>
          {r.child ? (
            <Text variant="body" color="warning" style={styles.paragraph}>
              У детей это лишь ориентир. Сверьте с ДО 6–8 мл/кг × возрастная ЧДД (экран «Аппаратная
              ИВЛ»).
            </Text>
          ) : (
            <Text variant="body" style={styles.paragraph}>
              {`При масочной ИВЛ объёмным аппаратом прибавьте 2–3 л/мин на утечку: ${fmt(r.maskMin)}–${fmt(r.maskMax)} л/мин.`}
            </Text>
          )}
        </ResultCard>
      ) : basis === 'actual' && !weightTyped ? (
        <Text variant="caption" color="textSecondary" style={styles.intro}>
          Введите массу тела — результат появится автоматически.
        </Text>
      ) : null}

      <Section title="Формула">
        <Card>
          <Text variant="bodyStrong">Формула Дарбиняна</Text>
          <Text style={styles.formulaLine}>МОД (л/мин) = Масса тела (кг) / 10 + 1</Text>
          <Text variant="caption" color="textSecondary" style={styles.paragraph}>
            Результат округляется до 0,1 л/мин.
          </Text>
        </Card>
        <Card>
          <Text variant="bodyStrong">Пример</Text>
          <Text style={styles.formulaLine}>Пациент 75 кг: МОД = 75 / 10 + 1 = 8,5 л/мин</Text>
          <Text style={styles.formulaLine}>При масочной ИВЛ: 10,5–11,5 л/мин</Text>
        </Card>
      </Section>

      <Note level="info" title="Ограничения">
        {`Формула ориентировочная и применяется с массы ${WEIGHT_MIN} кг. Конкретные параметры вентиляции определяет врач с учётом клинической ситуации.`}
      </Note>
    </Screen>
  );
};

export default Calc_dorbinyn;
