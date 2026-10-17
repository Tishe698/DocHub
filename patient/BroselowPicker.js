// BroselowPicker.js — выбор зоны ленты Broselow-Luten (2017): цвет ленты, масса, длина,
// ориентировочный возраст. Выбор зоны записывает в пациента broselowZone, массу
// (середина диапазона зоны) и weightSource: 'broselow'. Кнопка «?» у заголовка — краткая справка,
// зачем нужна лента (BroselowHelp).
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/AppText';
import { hideFromA11y, announce } from '../components/a11y';
import { HelpButton, Note } from '../components/ui';
import { usePatient } from './PatientContext';
import {
  BROSELOW_MAX_LENGTH_CM,
  BROSELOW_MIN_LENGTH_CM,
  BROSELOW_VERSION,
  BROSELOW_ZONES,
  zoneByHeight,
} from './estimates';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../theme/index';

const fmt = (n) => String(n).replace('.', ',');

// Текст справки «?»: что за лента и зачем она в приложении. Границы — из таблицы зон
export const BROSELOW_HELP = [
  `Цветная мерная лента для детей ростом ${fmt(BROSELOW_MIN_LENGTH_CM)}–${fmt(BROSELOW_MAX_LENGTH_CM)} см (масса примерно ${BROSELOW_ZONES[0].weightMinKg}–${BROSELOW_ZONES[BROSELOW_ZONES.length - 1].weightMaxKg} кг). Ребёнка кладут на спину вдоль ленты: красный край — у макушки, цвет у пяток — его зона.`,
  'Зачем: почти все детские дозы считаются на килограмм, а точный вес в экстренной ситуации часто неизвестен. Масса по длине тела точнее, чем по возрасту, — особенно у полных и худых детей.',
  'В приложении зона подставляет массу во все калькуляторы и подсказывает размер эндотрахеальной трубки.',
  'Ленты нет — введите рост: зона определится сама. Вес известен — введите фактический, он точнее.',
  `Версия ${BROSELOW_VERSION} года: зоны пересчитаны под современных детей.`,
];

export function BroselowHelp({ testID = 'broselow-help' }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <HelpButton
      title="Лента Broselow"
      accessibilityLabel="Что такое лента Broselow"
      testID={testID}
    >
      {BROSELOW_HELP.map((p) => (
        <Text key={p} variant="body" style={styles.helpText}>
          {p}
        </Text>
      ))}
    </HelpButton>
  );
}

export default function BroselowPicker({ onSelect, style }) {
  const { broselow } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { patient, setPatient } = usePatient();
  const selectedKey = patient.broselowZone;
  const byHeight = zoneByHeight(patient.heightCm);

  const select = (zone) => {
    setPatient({ broselowZone: zone.key, weightKg: zone.weightKg, weightSource: 'broselow' });
    announce(`Зона ${zone.name}, масса ${fmt(zone.weightKg)} килограмма, оценка по ленте Broselow`);
    if (onSelect) onSelect(zone);
  };

  return (
    <View style={style}>
      <View style={styles.titleRow}>
        <Text variant="heading" accessibilityRole="header" style={styles.titleText}>
          Лента Broselow ({BROSELOW_VERSION})
        </Text>
        <BroselowHelp />
      </View>
      <Text variant="caption" color="textSecondary" style={styles.caption}>
        Измерьте длину ребёнка лентой и выберите зону. Масса оценена по ленте Broselow: середина
        диапазона зоны.
        {byHeight ? ` По введённому росту — зона «${byHeight.name}».` : ''}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Зона ленты Broselow"
        style={styles.grid}
      >
        {BROSELOW_ZONES.map((zone) => {
          const c = broselow[zone.key];
          const selected = zone.key === selectedKey;
          const suggested = byHeight && byHeight.key === zone.key;
          return (
            <Pressable
              key={zone.key}
              onPress={() => select(zone)}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={
                `Зона ${zone.name}: масса ${zone.weightMinKg}–${zone.weightMaxKg} кг, ` +
                `длина ${fmt(zone.lengthMinCm)}–${fmt(zone.lengthMaxCm)} см, ${zone.typicalAge}` +
                (suggested ? ', совпадает с ростом' : '')
              }
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: c.bg, borderColor: c.border },
                selected && styles.tileSelected,
                pressed && styles.tilePressed,
              ]}
            >
              <View style={styles.tileHeader}>
                <Text variant="bodyStrong" style={[styles.flex, { color: c.text }]}>
                  {zone.name}
                </Text>
                {selected ? (
                  <View {...hideFromA11y}>
                    <Ionicons name="checkmark-circle" size={20} color={c.text} />
                  </View>
                ) : null}
              </View>
              <Text variant="bodyStrong" style={{ color: c.text }}>
                {`${fmt(zone.weightKg)} кг (${zone.weightMinKg}–${zone.weightMaxKg})`}
              </Text>
              <Text variant="caption" style={{ color: c.text }}>
                {`${fmt(zone.lengthMinCm)}–${fmt(zone.lengthMaxCm)} см`}
              </Text>
              <Text variant="caption" style={{ color: c.text }}>
                {zone.typicalAge}
                {suggested ? ' · по росту' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {patient.weightSource === 'broselow' ? (
        <Note level="info">
          Масса оценена по ленте Broselow — при возможности уточните фактическую.
        </Note>
      ) : null}
    </View>
  );
}

const makeStyles = ({ colors, spacing, radius }) => ({
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  titleText: { flexShrink: 1 },
  helpText: { marginBottom: spacing.sm },
  caption: { marginBottom: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: MIN_TOUCH,
    margin: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  tileSelected: { borderWidth: 4, borderColor: colors.text },
  tilePressed: { opacity: 0.85 },
  tileHeader: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
