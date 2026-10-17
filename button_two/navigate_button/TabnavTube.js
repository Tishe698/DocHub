// TabnavTube.js — подменю «Интубация»: выбор эндотрахеальной или ларингеальной трубки.
// Данные карточек — main_screen/menuConfig.js (TUBE_MENU).
import React from 'react';
import Screen from '../../components/Screen';
import { Text } from '../../components/AppText';
import { Note } from '../../components/ui';
import { useThemedStyles } from '../../theme/index';
import MenuCard from '../../main_screen/MenuCard';
import { TUBE_MENU } from '../../main_screen/menuConfig';

// Фото трубок — декоративные (MenuCard скрывает их от диктора)
const IMAGES = {
  ett: require('./1.jpeg'),
  lt: require('./2.jpeg'),
};

const Tabnav = ({ navigation }) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        Выберите тип трубки для расчёта
      </Text>

      {TUBE_MENU.map((card) => (
        <MenuCard
          key={card.route}
          card={card}
          image={IMAGES[card.image]}
          onPress={() => navigation.navigate(card.route)}
          testID={`tube-card-${card.route}`}
        />
      ))}

      {/* PALS (AHA) 2020: при интубации ребёнка держать наготове трубки на 0,5 мм меньше и больше
          (их же выводит экран ЭТТ — «Альтернативы»). Положение трубки подтверждают
          капнографией EtCO2 вместе с клинической оценкой (AHA 2020, ERC 2021). */}
      <Note level="info" title="Перед интубацией" style={styles.note}>
        <Text variant="body" style={styles.noteLine}>
          • ЭТТ: держите наготове трубки на 0,5 мм меньше и больше
        </Text>
        <Text variant="body" style={styles.noteLine}>
          • Положение трубки подтверждайте капнографией (EtCO₂) и аускультацией
        </Text>
        <Text variant="body" style={styles.noteLine}>
          • Ларингеальная трубка: размер и объём манжеты — по инструкции производителя
        </Text>
      </Note>
    </Screen>
  );
};

const makeStyles = ({ spacing }) => ({
  subtitle: { marginBottom: spacing.lg },
  note: { marginTop: spacing.md },
  noteLine: { marginTop: spacing.xs },
});

export default Tabnav;
