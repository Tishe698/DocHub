// ApgarScreen.js — шкала Апгар (заготовка; наполняется на следующем этапе, см. ARCH_SPEC §9)
import React from 'react';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';

export default function ApgarScreen() {
  return (
    <Screen scroll>
      <Text variant="title" accessibilityRole="header">
        Шкала Апгар
      </Text>
      <Text variant="body" color="textSecondary">
        Раздел в разработке
      </Text>
    </Screen>
  );
}
