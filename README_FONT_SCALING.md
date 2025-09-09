# Система управления масштабированием шрифтов DocHub

## Обзор

В приложении DocHub реализована система жесткого отключения системного масштабирования шрифтов для обеспечения стабильной верстки на всех устройствах и настройках. Система позволяет точечно включать масштабирование там, где это необходимо.

## Глобальные настройки

### Отключение по умолчанию
```javascript
// В App.js
import { Text, TextInput } from 'react-native';
import { fontScaling } from './theme';

// Глобальное отключение масштабирования
Text.defaultProps = {
  allowFontScaling: fontScaling.default, // false
  maxFontSizeMultiplier: fontScaling.maxScale, // 1.2
  minFontSizeMultiplier: fontScaling.minScale, // 0.8
};
```

### Конфигурация в theme.js
```javascript
export const fontScaling = {
  default: false,      // Глобально отключено
  enabled: true,       // Для точечного включения
  maxScale: 1.2,       // Максимальный множитель
  minScale: 0.8,       // Минимальный множитель
};
```

## Компоненты для управления масштабированием

### ScaledText (рекомендуется для большинства случаев)
```javascript
import { ScaledText } from '../components/FontScaling';

// Масштабирование отключено по умолчанию
<ScaledText style={styles.title}>
  Стабильный заголовок
</ScaledText>

// Явное отключение (эквивалентно ScaledText)
<ScaledText allowFontScaling={false}>
  Заголовок без масштабирования
</ScaledText>
```

### AdaptiveText (для специальных случаев)
```javascript
import { AdaptiveText } from '../components/FontScaling';

// Масштабирование включено
<AdaptiveText style={styles.adaptiveText}>
  Адаптивный текст с масштабированием
</AdaptiveText>

// Явное включение
<AdaptiveText allowFontScaling={true}>
  Текст с системным масштабированием
</AdaptiveText>
```

### ScaledTextInput
```javascript
import { ScaledTextInput } from '../components/FontScaling';

<ScaledTextInput
  placeholder="Стабильный input"
  allowFontScaling={false}
/>
```

## Хуки для стилей

### useFontScaling
```javascript
import { useFontScaling } from '../components/FontScaling';

const MyComponent = () => {
  const fontProps = useFontScaling(); // { allowFontScaling: false, ... }

  return (
    <Text {...fontProps} style={styles.text}>
      Стабильный текст
    </Text>
  );
};
```

### useAdaptiveFontScaling
```javascript
import { useAdaptiveFontScaling } from '../components/FontScaling';

const MyComponent = () => {
  const adaptiveProps = useAdaptiveFontScaling(); // { allowFontScaling: true, ... }

  return (
    <Text {...adaptiveProps} style={styles.text}>
      Адаптивный текст
    </Text>
  );
};
```

## Правила использования

### ✅ Когда использовать ScaledText (масштабирование отключено):
- Заголовки и навигация
- Названия кнопок и карточек
- Важные UI элементы
- Тексты в табах и меню
- Подписи к формам

### ✅ Когда использовать AdaptiveText (масштабирование включено):
- Длинные текстовые контенты
- Статьи и описания
- Тексты с accessibility требованиями
- Пользовательский контент
- Тексты, которые должны адаптироваться к настройкам пользователя

### ✅ Прямое использование props:
```javascript
// Для обычных Text компонентов
<Text allowFontScaling={false} maxFontSizeMultiplier={1.2}>
  Стабильный текст
</Text>

// Для TextInput
<TextInput allowFontScaling={false} maxFontSizeMultiplier={1.2}>
  Стабильный input
</TextInput>
```

## Примеры из кода

### В button_app.js (главный экран)
```javascript
// Заголовки карточек - масштабирование отключено
<Animated.Text
  allowFontScaling={false}
  maxFontSizeMultiplier={1.2}
>
  {item.title}
</Animated.Text>
```

### В TabnavTube.js (экран выбора трубок)
```javascript
// Названия кнопок - масштабирование отключено
<Text
  allowFontScaling={false}
  maxFontSizeMultiplier={1.2}
>
  {title}
</Text>
```

## Преимущества системы

1. **Стабильная верстка** - интерфейс не ломается на экстремальных настройках шрифта
2. **Предсказуемость** - все размеры остаются консистентными
3. **Производительность** - меньше перерасчетов при изменении настроек
4. **Гибкость** - возможность точечного включения масштабирования
5. **Доступность** - баланс между стабильностью и доступностью

## Миграция существующих компонентов

При добавлении новых компонентов:

1. Используйте `ScaledText` для большинства текстов
2. Используйте `AdaptiveText` только для контента, требующего адаптации
3. Для анимированных текстов добавляйте `allowFontScaling={false}`
4. Проверяйте визуально на разных размерах экрана

## Тестирование

Проверяйте интерфейс на:
- Минимальных настройках шрифта (0.8x)
- Максимальных настройках шрифта (1.2x)
- Разных размерах экрана
- Разных плотностях пикселей

## Контакты

При добавлении новых компонентов или изменении существующих - учитывайте эту систему масштабирования для поддержания консистентности интерфейса.
