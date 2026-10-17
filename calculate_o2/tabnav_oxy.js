// tabnav_oxy.js — подменю «Кислород»: время работы баллона, формула Дарбиняна, ИВЛ.
// Данные карточек — main_screen/menuConfig.js (OXYGEN_MENU). Свой StatusBar не рисуем.
import React from 'react';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { Note } from '../components/ui';
import { useThemedStyles } from '../theme/index';
import MenuCard from '../main_screen/MenuCard';
import { OXYGEN_MENU } from '../main_screen/menuConfig';

const Tabnav_oxy = ({ navigation }) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        Выберите расчёт
      </Text>

      {OXYGEN_MENU.map((card) => (
        <MenuCard
          key={card.route}
          card={card}
          onPress={() => navigation.navigate(card.route)}
          testID={`oxy-card-${card.route}`}
        />
      ))}

      <Note level="warning" title="Расчёты справочные" style={styles.note}>
        Перед применением проверьте их по состоянию пациента и инструкции к аппарату.
      </Note>
    </Screen>
  );
};

const makeStyles = ({ spacing }) => ({
  subtitle: { marginBottom: spacing.lg },
  note: { marginTop: spacing.md },
});

export default Tabnav_oxy;
