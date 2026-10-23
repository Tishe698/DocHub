# MedRush — архитектура для разработчика

Краткое руководство по общей инфраструктуре: тема, контейнер экрана, доступность,
UI-компоненты, общий пациент, пути введения в калькуляторе препаратов, тесты и линтер.
Стек: Expo SDK 54, React Native 0.81, React 19.1, React Navigation 7 (native-stack), JavaScript.

## 1. Тема и токены (`theme/`)

| Файл | Что внутри |
| --- | --- |
| `palette.js` | `palette.light` и `palette.dark` — семантические цвета с одинаковыми ключами |
| `broselow.js` | физические цвета зон ленты Broselow: `{ bg, text, border }`, одинаковы в обеих темах |
| `bloodDrop.js` | физические цвета рисунка капли на экране группы крови (кровь, плазма, хлопья, блик), одинаковы в обеих темах |
| `tokens.js` | `spacing`, `radius`, `typography`, `fontScaling`, `MIN_TOUCH` |
| `ThemeProvider.js` | провайдер темы и режима `system / light / dark` |
| `index.js` | публичный API |

**Импорт.** Тема импортируется явно: `import { useTheme } from '../theme/index'`.

### API

```js
import { useTheme, useThemedStyles, makeNavigationTheme, ThemeProvider, MIN_TOUCH } from '../theme/index';

const theme = useTheme();
// { scheme: 'light'|'dark', mode: 'system'|'light'|'dark', setMode(mode), isDark,
//   colors, spacing, radius, typography, fontScaling, minTouch, broselow }

const styles = useThemedStyles(makeStyles); // мемоизированный StyleSheet.create(makeStyles(theme))
const makeStyles = ({ colors, spacing, radius, typography, isDark }) => ({ … }); // вне компонента!
```

- `setMode('dark')` сохраняет режим в AsyncStorage (`dochub.themeMode`); ошибки хранилища
  перехватываются, по умолчанию `system` (схема берётся из `useColorScheme()`).
- `useTheme()` вне провайдера возвращает светлую тему (компонент не падает в тестах).
- `makeNavigationTheme(theme)` — тема для `NavigationContainer`.

### Цвета (`theme.colors`)

- фон: `bg`, `surface`, `surfaceAlt`, `surfaceRaised`, `overlay`;
- линии: `border`, `borderStrong`, `divider`;
- текст: `text`, `textSecondary`, `textMuted`, `textInverse` — все ≥ 4.5:1 на любой поверхности;
- бренд: `primary`, `primaryPressed`, `onPrimary`, `primarySoft`, `onPrimarySoft`;
- состояния: `success | warning | danger | info` + `*Soft` (мягкий фон) + `on*` (текст на сплошной
  заливке: `onSuccess`, `onWarning`, `onDanger`, `onInfo`). Цвет состояния читаем как текст на
  surface, bg и своём `*Soft`; `text` тоже читаем на `*Soft`;
- поля: `inputBg`, `inputBorder`, `inputBorderFocus`, `inputBorderError`, `placeholder`;
- `focusRing`, `shadow` (в тёмной теме `transparent` — тени не рисуем, выделяем `surfaceRaised` и границей);
- `section.<ключ>` — акцент раздела главного экрана: `drugs`, `airway`, `shock`, `pregnancy`,
  `oxygen`, `icd`, `pediatrics`, `blood`, `gcs`, `pe`, `chf`, `norepinephrine`, `news`, `apgar`, `defib`
  (≥ 4.5:1 на surface и bg — можно и для текста, и для иконок).

Правила: никаких литералов цвета вне `theme/`; цвет никогда не единственный носитель смысла —
рядом всегда слово («Высокий риск», «выше макс.»).

### Токены (`theme/tokens.js`)

- `spacing`: `xs 4, sm 8, md 12, lg 16, xl 24, xxl 32`;
- `radius`: `sm 6, md 10, lg 14, pill 999`;
- `typography`: `title`, `heading`, `body`, `bodyStrong`, `caption`, `number` (tabular-nums);
- `fontScaling`: `{ enabled: true, maxScale: 1.5, minScale: 0.8 }`; `MIN_TOUCH = 48`.

## 2. Навигация и системные полосы (`App.js`)

`SafeAreaProvider → ThemeProvider → PatientProvider → NavigationContainer (theme) → native-stack`.
Шапка: фон `surface`, кнопки `primary`, заголовок `text`, фон экранов `bg`, подпись «Назад»
скрыта (`headerBackButtonDisplayMode: 'minimal'`); справа в шапке каждого экрана — `ThemeToggle`
(`headerRight`, переключатель светлой и тёмной темы). Имена маршрутов не меняются; новые:
`NewsScreen` («NEWS2»), `ApgarScreen` («Шкала Апгар»), `DefibrillatorScreen` («Дефибриллятор»). Заголовки короткие, без эмодзи.
`StatusBar` (expo-status-bar) один, в корне; экраны свой не рисуют и не прячут.

## 3. Контейнер экрана и safe area (`components/Screen.js`)

```js
import Screen from '../components/Screen';
<Screen scroll>…</Screen>
```

Пропсы: `scroll` (ScrollView, `keyboardShouldPersistTaps="handled"`), `noHeader` (добавляет
верхний край для экрана без шапки), `edges` (по умолчанию `['left','right','bottom']`),
`padded` (отступ `spacing.lg`, по умолчанию `true`), `keyboardAvoiding` (по умолчанию `true`,
iOS — `padding`, смещение считается по фактической позиции экрана в окне), `style`,
`contentContainerStyle`, `scrollRef`, `scrollProps`, `testID`. Экраны используют `Screen`
вместо `SafeAreaView` из `react-native`.

## 4. Доступность и UI-компоненты

### `components/AppText.js`

`Text`, `TextInput` с `allowFontScaling` и `maxFontSizeMultiplier = 1.5`. Новый код задаёт стиль
токенами: `<Text variant="heading">`, `<Text variant="caption" color="textSecondary">`
(`variant` — ключ `typography`, `color` — ключ `colors`, по умолчанию `colors.text`). Без
`variant`/`color` стиль не добавляется. Вёрстка обязана выдерживать масштаб 1.5: без
фиксированных высот у контейнеров с текстом, `flexWrap` в строках, `numberOfLines` — только
с `adjustsFontSizeToFit` и `minimumFontScale`.

### `components/a11y.js`

- `announce(text)` — озвучить через `AccessibilityInfo.announceForAccessibility`;
- `hideFromA11y` — пропсы для декоративных элементов: `<View {...hideFromA11y}><Ionicons …/></View>`;
- `stripEmoji(text)` — подпись без эмодзи: `accessibilityLabel={stripEmoji('💉 Норадреналин')}`;
- `a11yLabel(...parts)` — склейка частей подписи через запятую с пропуском пустых.

### `components/ui/` (`import { Button, … } from '../components/ui'`)

| Компонент | Пропсы |
| --- | --- |
| `Button` | `title, onPress, variant ('primary'|'secondary'|'ghost'|'danger'), disabled, icon (Ionicons), fullWidth, selected, accessibilityLabel, accessibilityHint, style, testID` |
| `ChoiceChips` | `label, options [{ value, label, accessibilityLabel?, disabled? }], value, onChange(value), disabled, hint, style, testID` |
| `NumberField` | `label, unit, value (строка), onChangeText(text), onChangeNumber(num|undefined), error, hint, badge, badgeLevel, placeholder, editable, returnKeyType, onSubmitEditing, onFocus, onBlur, style, inputStyle, testID`; поддерживает `ref` |
| `SwitchRow` | `label, description, value, onValueChange(bool), disabled, accessibilityHint, style, testID` |
| `Card` | `children, onPress?, padded, accessibilityLabel, accessibilityHint, disabled, style, testID` |
| `Section` | `title (role header), description, right, children, style, testID` |
| `ResultCard` | `title, value, unit, level, levelLabel, children, announceText, announceEnabled, style, testID` |
| `Badge` | `level ('success'|'warning'|'danger'|'info'|'neutral'), label | children, icon, accessibilityLabel, style` |
| `Note` | `level ('info'|'warning'|'danger'|'success'), title, children, icon, style, testID` |
| `HelpButton` | `title, accessibilityLabel, children, style, testID` — кнопка «?» со справкой в модальном окне |
| `ThemeToggle` | `style, testID` — переключатель «Тёмная тема» (луна / солнце), role `switch` + `aria-checked`; долгое нажатие и действие диктора `followSystem` — режим `system` |

Роли и состояния: `Button` — `button` + `disabled` (+ `selected`, если передан); `ChoiceChips` —
`radiogroup` с подписью и `radio` с `selected/checked`, выбранный вариант отмечен галочкой;
`NumberField` — `accessibilityLabel` «подпись, единица», ошибка — в `accessibilityHint` и видимым
текстом, `keyboardType="decimal-pad"`, разбор — `utils/parseNum`; `SwitchRow` — `switch` +
`checked`, нажимается вся строка; `ResultCard` — `accessibilityLiveRegion="polite"` и
`announce()` (iOS — при каждом новом результате; Android — при первом появлении, дальше live
region), озвучка отложена на 700 мс, чтобы не читать каждую набранную цифру. Все нажимаемые
элементы — не меньше 48×48.

Правила для экранов: у нажимаемого элемента роль, подпись по-русски и состояние; эмодзи и
декоративные иконки скрыты; результат озвучивается; порядок фокуса — сверху вниз.

## 5. Общий пациент (`patient/`)

Хранится только в памяти: `PatientProvider` в `App.js`.

```js
import { usePatient, usePatientNumber, usePatientAge } from '../patient/PatientContext';

const { patient, setPatient, resetPatient, derived, resetCount } = usePatient();
// patient: { weightKg, weightSource ('entered'|'broselow'|'age'|null), ageMonths, sex ('male'|'female'|null),
//            heightCm, broselowZone }
// setPatient(partial | (prev) => partial) — слияние; weightKg без weightSource → 'entered' и сброс зоны
// derived: { ageYears, isNeonate, isChild, estimatedWeightKg, zone, weightIsEstimate, hasData }
//   (null, если данных нет; zone — по росту, иначе выбранная зона, иначе по массе)
// resetCount — растёт при «Новый пациент»

const weight = usePatientNumber('weightKg'); // 'weightKg' | 'heightCm' | 'ageMonths'
<NumberField label="Вес" unit="кг" value={weight.text} onChangeText={weight.onChangeText}
             badge={derived.weightIsEstimate ? 'оценка' : null} />
// weight.value — число из контекста или null

const age = usePatientAge(); // возраст «лет + мес»
// { years: { text, onChangeText, value }, months: { … }, ageMonths, setNeonate() }
```

Поля записей калькулятора препаратов: `weight` ↔ `usePatientNumber('weightKg')`,
`ageYears` и `ageMonths` — из возраста пациента: если у записи есть оба поля, в formula идут
полные годы и месяцы сверх лет (0–11); если только `ageYears` — полные годы, а до 1 года доля
по месяцам (6 мес → 0,5); если только `ageMonths` — полный возраст в месяцах;
`heightCm` ↔ `usePatientNumber('heightCm')`, `sex` ↔ `patient.sex` + `setPatient({ sex })`.

`patient/estimates.js` (чистые функции):
`estimateWeightApls(ageMonths)`, `BROSELOW_ZONES` (`key, name, lengthMinCm, lengthMaxCm,
weightMinKg, weightMaxKg, weightKg, typicalAge, typicalAgeMonths`), `zoneByHeight(cm)`,
`zoneByWeight(kg)`, `zoneByKey`, `zoneIndex`, `zoneByAge`, `formatAge(ageMonths)`,
`composeAgeMonths(years, months)`, `splitAgeMonths`, `yearsWord`,
`ageWeightMismatch(ageMonths, weightKg)` → `null | { mismatch, diff, expectedZone, weightZone, direction }`.
Источники таблицы Broselow-Luten 2017 и формул APLS — в комментарии файла.

Компоненты: `<PatientBar />` (сводка, «Изменить»/«Указать», «Новый пациент»; сам открывает
редактор), `<PatientEditor visible onClose />`, `<BroselowPicker onSelect? />`.
Функция `patientSummary(patient, derived)` из `PatientBar.js` даёт строку для копируемого текста.

## 6. Пути введения в калькуляторе (`js_button_preparation/routes.js`)

```js
import { routeInput, choiceInput, ROUTES, routeLabel, isChoiceInput, inputLabel, choiceLabel } from '../routes';

inputs: {
  weight: 'Вес (кг)',
  route: routeInput(['iv', 'io', 'im'], 'iv'),          // { label: 'Путь введения', choices, default }
  indication: choiceInput('Показание', [
    { value: 'cpr', label: 'СЛР' }, { value: 'anaphylaxis', label: 'Анафилаксия' },
  ], 'cpr'),
},
formula: ({ weight, route, indication }) => …          // route === 'iv'
```

Коды: `iv` в/в, `io` в/к (внутрикостно), `im` в/м, `sc` п/к, `po` внутрь, `pr` ректально,
`in` интраназально, `buccal` защёчно, `sl` под язык, `inh` ингаляционно (небулайзер),
`mdi` ингаляционно (ДАИ), `et` эндотрахеально. Неизвестный код, пустой список или значение по
умолчанию вне вариантов — исключение при загрузке модуля (ловится тестами группы). Путь, для
которого у препарата нет утверждённой дозы, не предлагается.

Группы, добавленные после исходного списка, регистрируются в конце `formulas.js` в таком порядке:
`analgesics_steroids.js`, `cardio_endocrine_misc.js`, `thrombolytics_antiplatelets.js`,
`antiarrhythmics_vasopressors.js`, `bronchodilators_rsi.js`, `electrolytes_solutions.js`,
`antidotes_local_analgesia.js`, затем вторая очередь — `antimicrobials_antihistamines.js`,
`neuro_cardio_volume.js`, `nebulized_pediatrics.js`. Синонимы-показания («судороги», «круп»,
«менингит») есть и у препаратов первой линии (словарь `SYNONYMS` в `engine.js`): при равном
балле поиска выше та запись, что раньше в списке.

## 7. «Перед началом работы» и политика (`about/`)

- `aboutText.js` — единый источник текстов: назначение, ответственность, данные пациента
  (`NOTICE_POINTS`) и политика конфиденциальности (`PRIVACY_SECTIONS`). `PRIVACY.md` в корне
  повторяет политику дословно — это проверяет `about/__tests__/notice.test.js`.
- `NoticeGate.js` оборачивает навигатор в `App.js`: при первом запуске показывает экран
  «Перед началом работы». Принятие сохраняется в AsyncStorage (`dochub.noticeAccepted`) номером
  версии текста; при существенной правке текста увеличьте `NOTICE_VERSION`, и экран покажется снова.
- `AboutModal.js` — окно «О приложении» (с главного экрана) и окно политики (с экрана уведомления).
- Назначение приложения во всех текстах (приложение, README, карточка RuStore) описывается
  одинаково: справочно-информационное, решение принимает медицинский работник.

## 8. Тесты и линтер

- `npx jest` (пресет `jest-expo`), тесты — рядом с кодом в `__tests__/`:
  `theme/__tests__/contrast.test.js` (контраст WCAG для обеих тем и ленты Broselow),
  `patient/__tests__/estimates.test.js`, `js_button_preparation/__tests__/routes.test.js`,
  `utils/__tests__/parseNum.test.js`.
- `npx eslint <файлы>` — 0 ошибок; предупреждения `react-hooks/exhaustive-deps` исправлять.
- Сборка: `CI=1 npx expo export --platform all --output-dir <каталог>`.
- Prettier запускается один раз в конце этапа отдельным коммитом.
