// button_app.js — главный экран DocHub (маршрут Home, без шапки навигатора).
// Пациент (PatientBar), разделы с карточками (данные — menuConfig.js), выбор темы.
// Системный StatusBar рисует только App.js.
import React, { useCallback } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { hideFromA11y } from '../components/a11y';
import { ChoiceChips, Note, Section } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { useTheme, useThemedStyles } from '../theme/index';
import MenuCard from './MenuCard';
import { MENU_SECTIONS, THEME_MODE_OPTIONS, gridColumns } from './menuConfig';

export default function ButtonApp({ navigation }) {
  const { mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width, fontScale } = useWindowDimensions();
  const columns = gridColumns(width, fontScale);

  const open = useCallback((route) => navigation.navigate(route), [navigation]);

  return (
    <Screen noHeader scroll keyboardAvoiding={false} testID="home-screen">
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark} {...hideFromA11y}>
            <Text style={styles.brandMarkText}>✚</Text>
          </View>
          <Text variant="title" accessibilityRole="header" style={styles.brandTitle}>
            DocHub
          </Text>
        </View>
        <Text variant="body" color="textSecondary">
          Расчёты и шкалы для бригад СМП и педиатрии. Работает без интернета.
        </Text>
      </View>

      <PatientBar />

      {MENU_SECTIONS.map((section) => (
        <Section key={section.key} title={section.title} testID={`home-section-${section.key}`}>
          <View style={columns > 1 ? styles.grid : null}>
            {section.cards.map((card) => (
              <View key={card.route} style={columns > 1 ? styles.cell : null}>
                <MenuCard
                  card={card}
                  onPress={() => open(card.route)}
                  style={columns > 1 ? styles.cellCard : null}
                  testID={`home-card-${card.route}`}
                />
              </View>
            ))}
          </View>
        </Section>
      ))}

      <Section title="Оформление">
        <ChoiceChips
          label="Тема"
          options={THEME_MODE_OPTIONS}
          value={mode}
          onChange={setMode}
          hint="Переключает светлую и тёмную тему приложения"
          testID="home-theme-mode"
        />
      </Section>

      <Note level="info">
        Расчёты справочные: сверяйте результат с состоянием пациента, клиническими рекомендациями и
        инструкцией к препарату или аппарату.
      </Note>
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, radius, typography }) => ({
  hero: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  brandMark: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  brandMarkText: { ...typography.heading, color: colors.onPrimary },
  brandTitle: { flexShrink: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  cell: { width: '50%', paddingHorizontal: spacing.xs },
  cellCard: { flexGrow: 1 },
});
