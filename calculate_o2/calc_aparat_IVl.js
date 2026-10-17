// Аппаратная ИВЛ: стартовые параметры для MEDUMAT и А-ИВЛ/ВВЛ/ВЧп-4/40.
// Расчёт — calculate_o2/ventilatorCalc.js; масса, рост, пол и возраст — из общего пациента.
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { a11yLabel, hideFromA11y } from '../components/a11y';
import { Badge, Card, ChoiceChips, Note, NumberField, ResultCard, Section } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient, usePatientAge, usePatientNumber } from '../patient/PatientContext';
import { useOxyStyles } from './style_oxy';
import {
  CAPS,
  DEVICE_KEYS,
  PRESETS,
  childAgeFieldErrors,
  computeIvl,
  deviceHint,
  effectiveCaps,
  fio2OptionsFor,
  fmt,
  groupForAge,
  ieOptionsFor,
  pmaxPresetFor,
  ratioText,
  rrPresetFor,
  scenarioMemo,
} from './ventilatorCalc';

// Для совместимости со старыми импортами экрана
export { deviceHint, pmaxPresetFor, rrPresetFor, effectiveCaps, computeIvl };

// Подписи аппаратов для диктора (без надстрочных знаков и дробей)
const DEVICE_SPOKEN = {
  medumat2: 'MEDUMAT Standard 2',
  medumatStd: 'MEDUMAT Standard',
  ivl440: 'А-ИВЛ ВВЛ 4/40',
};
const DEVICE_OPTIONS = DEVICE_KEYS.map((k) => ({
  value: k,
  label: CAPS[k].short,
  accessibilityLabel: DEVICE_SPOKEN[k] || CAPS[k].label,
}));
const SCENARIO_OPTIONS = [
  { value: 'arrest', label: PRESETS.arrest.seg },
  { value: 'nonArrest', label: PRESETS.nonArrest.seg },
];
const AIRWAY_OPTIONS = [
  {
    value: 'tube',
    label: 'Трубка / НВУ',
    accessibilityLabel: 'Трубка или надгортанное устройство',
  },
  { value: 'mask', label: 'Маска' },
];
const GROUP_OPTIONS = [
  { value: 'adult', label: 'Взрослый' },
  { value: 'child', label: 'Ребёнок' },
];
const SEX_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];
const O2_OPTIONS = [
  { value: 'o2', label: '100 % O₂', accessibilityLabel: '100 процентов кислород' },
  { value: 'airmix', label: 'Air Mix', accessibilityLabel: 'Air Mix, меньше 100 процентов' },
];

// Поле с пресетом: пока человек не правил значение, показывается пресет; правка действует,
// пока не сменится key (сценарий, аппарат, возрастная группа, «Новый пациент») — тогда снова пресет.
function usePresetText(presetText, key) {
  const [edit, setEdit] = useState(null);
  const text = edit && edit.key === key ? edit.text : presetText;
  const onChange = useCallback((t) => setEdit({ key, text: t }), [key]);
  return [text, onChange];
}

// Плитка показателя. Выход за пределы — рамка и словами «вне пределов» (не только цветом).
function Stat({ label, value, bad, styles }) {
  return (
    <View
      style={[styles.stat, bad && styles.statBad]}
      accessible
      accessibilityLabel={a11yLabel(label, value, bad ? 'вне допустимых пределов' : null)}
    >
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="heading" color={bad ? 'danger' : 'text'} style={styles.statValue}>
        {value}
      </Text>
      {bad ? <Badge level="danger" label="вне пределов" style={styles.statBadge} /> : null}
    </View>
  );
}

function Bullets({ items, styles, color }) {
  return items.map((t) => (
    <View key={t} style={styles.bulletRow}>
      <Text variant="body" color={color} style={styles.bullet} {...hideFromA11y}>
        •
      </Text>
      <Text variant="body" color={color} style={styles.bulletText}>
        {t}
      </Text>
    </View>
  ));
}

export default function Calc_aparat_IVL() {
  const styles = useOxyStyles();
  const { patient, setPatient, derived, resetCount } = usePatient();
  const weight = usePatientNumber('weightKg');
  const height = usePatientNumber('heightCm');
  const age = usePatientAge();

  const [device, setDevice] = useState('medumat2'); // 'medumat2' | 'medumatStd' | 'ivl440'
  const [scenario, setScenario] = useState('arrest'); // 'arrest' | 'nonArrest'
  const [airway, setAirway] = useState('tube'); // 'tube' | 'mask'
  const p = PRESETS[scenario];

  // Группа — по возрасту пациента (до 18 лет — ребёнок; без возраста: масса по Broselow — ребёнок,
  // иначе взрослый); можно переключить вручную до следующей смены возраста.
  const autoGroup =
    groupForAge(patient.ageMonths) || (patient.weightSource === 'broselow' ? 'child' : 'adult');
  const [group, setGroup] = usePresetText(autoGroup, `${patient.ageMonths}|${resetCount}`);

  // Ошибка в полях возраста ребёнка (мес ≥ 12 при годах, нечисловой ввод) — возраст не берём:
  // ЧДД и масса по возрасту не подставляются, ошибка показана под полем
  const ageErrors =
    group === 'child'
      ? childAgeFieldErrors(age.years.text, age.months.text)
      : { years: null, months: null };
  const ageInvalid = !!(ageErrors.years || ageErrors.months);
  const months =
    group === 'child' && patient.ageMonths !== null && !ageInvalid ? patient.ageMonths : undefined;
  const rrPreset = rrPresetFor(scenario, group, months);
  const pmaxPreset = pmaxPresetFor(scenario, airway, effectiveCaps(device, group, months));

  // Пресеты сценария (как раньше: смена сценария подставляет значения заново)
  const sKey = `${scenario}|${resetCount}`;
  const [vtPerKg, setVtPerKg] = usePresetText(String(p.vtPerKg), sKey);
  const [peep, setPeep] = usePresetText(String(p.peep), sKey);
  const [o2Mode, setO2Mode] = usePresetText('o2', sKey);
  const [fio2, setFio2] = usePresetText(String(p.fio2), `${sKey}|${device}`);
  const [ie, setIe] = usePresetText(p.ie, `${sKey}|${device}`);
  // ЧДД — по сценарию и возрасту; не введён возраст ребёнка — поле пустое (просьба ввести возраст)
  const [rr, setRr] = usePresetText(
    rrPreset === null ? '' : String(rrPreset),
    `${sKey}|${group}|${rrPreset}`,
  );
  // Pmax — по дыхательным путям и пределам аппарата
  const [pmax, setPmax] = usePresetText(String(pmaxPreset), `${sKey}|${pmaxPreset}`);

  const r = useMemo(
    () =>
      computeIvl({
        device,
        group,
        sex: patient.sex,
        // строки полей: некорректный ввод не попадает в контекст, но и не должен считаться старым числом
        heightCm: height.text,
        weightKg: weight.text,
        weightSource: patient.weightSource,
        ageMonths: patient.ageMonths,
        ageInvalid,
        vtPerKg,
        rr,
        peep,
        pmax,
        fio2,
        o2Mode,
        ie,
      }),
    [
      device,
      group,
      patient.sex,
      patient.weightSource,
      patient.ageMonths,
      ageInvalid,
      height.text,
      weight.text,
      vtPerKg,
      rr,
      peep,
      pmax,
      fio2,
      o2Mode,
      ie,
    ],
  );
  const caps = r.caps;
  const ieOptions = useMemo(
    () => ieOptionsFor(device).map((v) => ({ value: v, label: v })),
    [device],
  );
  const fio2Options = useMemo(
    () =>
      fio2OptionsFor(device).map((v) => ({
        value: v,
        label: `${v} %`,
        accessibilityLabel: `${v} процентов`,
      })),
    [device],
  );

  const massText = r.mass === null ? '—' : `${fmt(r.mass)} кг`;
  const basisText = r.massBasisText;
  const anyBad = Object.values(r.tones).some((t) => t === 'bad');
  const announceText =
    r.vt === null
      ? undefined
      : a11yLabel(
          `ДО ${r.vt} миллилитров`,
          r.ve === null ? null : `МОД ${fmt(r.ve)} литра в минуту`,
          r.rrN === undefined ? null : `ЧДД ${fmt(r.rrN)} в минуту`,
          anyBad ? 'есть значения вне пределов' : null,
        );

  return (
    <Screen scroll>
      <PatientBar />
      <Text variant="body" color="textSecondary" style={styles.intro}>
        Стартовые параметры для СМП: MEDUMAT и А-ИВЛ/ВВЛ/ВЧп-4/40. Выберите аппарат, сценарий и
        пациента — значения подставятся автоматически, их можно менять вручную.
      </Text>

      <Section title="Аппарат и сценарий">
        <ChoiceChips label="Аппарат" options={DEVICE_OPTIONS} value={device} onChange={setDevice} />
        <Text variant="caption" color="textSecondary" style={styles.intro}>
          {deviceHint(device)}
        </Text>
        <ChoiceChips
          label="Сценарий"
          options={SCENARIO_OPTIONS}
          value={scenario}
          onChange={setScenario}
        />
        <ChoiceChips
          label="Дыхательные пути"
          options={AIRWAY_OPTIONS}
          value={airway}
          onChange={setAirway}
        />
      </Section>

      <Section title="Пациент">
        <ChoiceChips label="Группа" options={GROUP_OPTIONS} value={group} onChange={setGroup} />
        {group === 'adult' ? (
          <>
            <ChoiceChips
              label="Пол"
              options={SEX_OPTIONS}
              value={patient.sex}
              onChange={(sex) => setPatient({ sex })}
            />
            <View style={styles.row}>
              <NumberField
                label="Рост"
                unit="см"
                value={height.text}
                onChangeText={height.onChangeText}
                style={styles.col}
                testID="ivl-height"
              />
              <NumberField
                label="Масса факт."
                unit="кг"
                value={weight.text}
                onChangeText={weight.onChangeText}
                badge={derived.weightIsEstimate ? 'оценка' : null}
                style={styles.col}
                testID="ivl-weight"
              />
            </View>
            <Text variant="caption" color="textSecondary">
              ДО считается на должную (идеальную) массу по росту и полу (ARDSNet). Фактическая масса
              — только если рост не введён.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <NumberField
                label="Возраст"
                unit="лет"
                value={age.years.text}
                onChangeText={age.years.onChangeText}
                error={ageErrors.years}
                style={styles.col}
                testID="ivl-age-years"
              />
              <NumberField
                label="+ месяцев"
                unit="мес"
                value={age.months.text}
                onChangeText={age.months.onChangeText}
                error={ageErrors.months}
                style={styles.col}
                testID="ivl-age-months"
              />
            </View>
            <View style={styles.row}>
              <NumberField
                label="Масса"
                unit="кг"
                value={weight.text}
                onChangeText={weight.onChangeText}
                placeholder="по возрасту"
                badge={derived.weightIsEstimate ? 'оценка' : null}
                style={styles.col}
                testID="ivl-weight"
              />
              <NumberField
                label="Рост"
                unit="см"
                value={height.text}
                onChangeText={height.onChangeText}
                style={styles.col}
                testID="ivl-height"
              />
            </View>
            <ChoiceChips
              label="Пол"
              options={SEX_OPTIONS}
              value={patient.sex}
              onChange={(sex) => setPatient({ sex })}
            />
            <Text variant="caption" color="textSecondary">
              Пустая масса — оценка по возрасту (APLS). При росте от 130 см ДО считается на меньшую
              из фактической и должной массы по росту и полу (PALICC-2, PEMVECC) — у подростков
              введите рост. ЧДД при СЛР — по возрасту (ERC 2021); вне остановки — нижняя граница
              возрастной нормы, далее по EtCO₂/SpO₂.
            </Text>
          </>
        )}
      </Section>

      <Section title="Параметры вентиляции">
        <View style={styles.row}>
          <NumberField
            label="ДО"
            unit="мл/кг"
            value={vtPerKg}
            onChangeText={setVtPerKg}
            style={styles.col}
            testID="ivl-vt"
          />
          <NumberField
            label="ЧДД"
            unit="/мин"
            value={rr}
            onChangeText={setRr}
            style={styles.col}
            testID="ivl-rr"
          />
        </View>
        {caps.o2Switch ? (
          <ChoiceChips label="FiO₂" options={O2_OPTIONS} value={o2Mode} onChange={setO2Mode} />
        ) : (
          <ChoiceChips label="FiO₂" options={fio2Options} value={fio2} onChange={setFio2} />
        )}
        <View style={styles.row}>
          <NumberField
            label="ПДКВ"
            unit="см H₂O"
            value={peep}
            onChangeText={setPeep}
            style={styles.col}
            testID="ivl-peep"
          />
          <NumberField
            label="Pmax"
            unit="см H₂O"
            value={pmax}
            onChangeText={setPmax}
            style={styles.col}
            testID="ivl-pmax"
          />
        </View>
        {caps.ieFixed ? (
          <Text variant="body" style={styles.intro}>
            {`I:E на этом аппарате фиксировано ${ratioText(caps.ieFixed)}.`}
          </Text>
        ) : (
          <ChoiceChips
            label="Соотношение вдох : выдох (I:E)"
            options={ieOptions}
            value={ie}
            onChange={setIe}
          />
        )}
        <Text variant="caption" color="textSecondary">
          {airway === 'mask'
            ? 'Через маску Pmax ≈ 20 см вод. ст. — профилактика раздувания желудка (Weinmann).'
            : 'Pmax — предел давления аппарата: на 5–10 см вод. ст. выше пикового давления при заданном ДО. Защитная цель — Pplat ≤ 30.'}
        </Text>
      </Section>

      <ResultCard
        title="Дыхательный объём (VT)"
        value={r.vt === null ? null : String(r.vt)}
        unit="мл"
        level={anyBad ? 'danger' : undefined}
        levelLabel={anyBad ? 'Есть значения вне пределов — см. ниже' : undefined}
        announceText={announceText}
        announceEnabled={r.vt !== null}
      >
        {r.vt === null ? (
          <Text variant="body" color="textSecondary">
            {group === 'adult'
              ? 'Введите рост и пол (или массу) — ДО будет рассчитан.'
              : 'Введите возраст, массу или рост ребёнка — ДО будет рассчитан.'}
          </Text>
        ) : null}
        <View style={styles.statGrid}>
          <Stat styles={styles} label="Масса для расчёта" value={massText} />
          <Stat styles={styles} label="Основа" value={basisText} bad={r.tones.mass === 'bad'} />
          <Stat
            styles={styles}
            label="ДО (VT)"
            value={r.vt === null ? '—' : `${r.vt} мл`}
            bad={r.tones.vt === 'bad'}
          />
          <Stat
            styles={styles}
            label="Минутная вентиляция (V̇E)"
            value={r.ve === null ? '—' : `${fmt(r.ve)} л/мин`}
            bad={r.tones.ve === 'bad'}
          />
          <Stat
            styles={styles}
            label="Вдох"
            value={r.inspT === null ? '—' : `${fmt(r.inspT)} с`}
            bad={r.tones.ie === 'bad'}
          />
          <Stat
            styles={styles}
            label="Выдох"
            value={r.expT === null ? '—' : `${fmt(r.expT)} с`}
            bad={r.tones.ie === 'bad'}
          />
        </View>
        <View style={styles.divider} {...hideFromA11y} />
        <View style={styles.statGrid}>
          <Stat
            styles={styles}
            label="ЧДД"
            value={r.rrN === undefined ? '—' : `${fmt(r.rrN)}/мин`}
            bad={r.tones.rr === 'bad'}
          />
          <Stat
            styles={styles}
            label="ПДКВ"
            value={r.peepN === undefined ? '—' : `${fmt(r.peepN)} см H₂O`}
            bad={r.tones.peep === 'bad'}
          />
          <Stat
            styles={styles}
            label="Pmax"
            value={r.pmaxN === undefined ? '—' : `${fmt(r.pmaxN)} см H₂O`}
            bad={r.tones.pmax === 'bad'}
          />
          <Stat styles={styles} label="FiO₂" value={r.fio2Text} bad={r.tones.fio2 === 'bad'} />
        </View>
      </ResultCard>

      {r.setting ? (
        <Note level="info" title="Что выставить на аппарате">
          {r.setting}
        </Note>
      ) : null}

      {r.warnings.length > 0 ? (
        <Note level="warning" title="Проверьте">
          <Bullets items={r.warnings} styles={styles} />
        </Note>
      ) : null}

      <Note level="info" title="Советы">
        ДО 6–8 мл/кг идеальной массы, Pplat ≤ 30, ПДКВ ≈ 5 см вод. ст.; при СЛР — FiO₂ 100 %, ЧДД
        10/мин у взрослых, у детей по возрасту. После ROSC — SpO₂ 94–98 %, PaCO₂ 35–45 мм рт. ст.
        (ERC-ESICM 2021).
      </Note>

      <Section title="Памятки">
        <Card>
          <Text variant="bodyStrong" accessibilityRole="header">
            {PRESETS.arrest.title}
          </Text>
          <Bullets items={scenarioMemo('arrest')} styles={styles} />
        </Card>
        <Card>
          <Text variant="bodyStrong" accessibilityRole="header">
            {PRESETS.nonArrest.title}
          </Text>
          <Bullets items={scenarioMemo('nonArrest')} styles={styles} />
        </Card>
      </Section>
    </Screen>
  );
}
