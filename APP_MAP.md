# 🗺️ Карта приложения DocHub

Описание соответствует коду ветки на момент обновления. Расчёты справочные и требуют клинической
проверки перед применением; источники значений указаны комментариями в коде (см. также
[README](README.md#-клинические-источники)).

## 📱 Навигационная структура

### Главный экран (`Home` → ButtonApp)
```
🏠 main_screen/button_app.js
├── Шапка: «Медицинские расчёты»
├── 12 карточек-модулей (FlatList)
└── Сетка: 1 колонка при ширине ≤ 450 или крупном системном шрифте, иначе 2
```
Статистики использования и настроек нет.

### 1. 💊 Расчёт лекарств (`Расчет лекарств` → WelcomeScreen)
```
📋 js_button_preparation/calculate_button.js
├── Шапка: число записей и число расчётов (считаются из formulas.js)
├── Поиск по МНН, синонимам (анальгин, адреналин…) и описанию
├── Окно препарата: форма выпуска, поля ввода, «Рассчитать»
├── Проверка ввода: пределы правдоподобия, сверка массы с возрастом (APLS)
├── Результат: доза/объём с единицами, отметка о пределе (limits), предупреждения
└── «📋 Копировать» — результат в буфер обмена (expo-clipboard)
```
Справочные записи (без полей и расчёта) показываются без кнопки «Рассчитать».
Результат не сохраняется: окно закрыто — данные сброшены.

### 2. 🫁 Трубки (`Tabnav` → TabnavTube)
```
🫁 button_two/navigate_button/TabnavTube.js
├── Эндотрахеальная (`IntubationTubeCalculation`)
│   ├── button_intub/IntubationTubeCalculation.js — экран
│   └── button_intub/CalculateIntubationTube.js — расчёт
│       ├── новорождённый < 1 мес с массой → таблица по массе (NRP)
│       ├── рост 46,8–143,3 см → зона Broselow
│       ├── 1–12 лет → формулы по возрасту (PALS/ERC/APLS)
│       ├── до 1 года → зона Broselow по массе
│       ├── 13–15 лет или рост > 143,3 см без возраста → по возрасту и росту, не больше взрослых (пол)
│       └── ≥ 16 лет → взрослые размеры по полу
│       Вывод: метод, ID (мм), альтернативы ±0,5 мм, глубина оральная/назальная
└── Ларингеальная (`Button_Tube_Calculation` → LaryngealTubeCalculation)
    ├── button_laring/LaryngealTubeCalculation.js — экран
    └── button_laring/CalculateTube.js — таблица VBM LT / LTS-D (IFU 2017)
        Ребёнок — по массе (> 25 кг — по росту), взрослый — по росту.
        Вывод: размер, цвет коннектора, объём манжеты, макс. давление 60 см вод. ст., дренаж LTS-D
```
Таблиц размеров и иллюстраций на экранах трубок нет. Таблица ларингеальной трубки к ларингеальной
маске и i-gel не относится.

### 3. ❤️ Шоковый индекс (`CalcShockIndexScreen`)
```
💓 shock_index_algovera/shock_algov_app.js — экран
💓 shock_index_algovera/calculateShockIndex.js — расчёт
├── Ввод: пульс, САД, возраст (лет + мес), «Беременность / после родов», «Травма»
├── SI = пульс / САД
├── Режимы: взрослые; дети 1–16 лет (SIPA); дети < 1 года (не интерпретируется);
│   беременность / послеродовой период (КР МЗ РФ 2021)
├── Гипотензия для возраста у детей (PALS 2020)
└── Ориентировочная кровопотеря (взрослые — % ОЦК, беременные — качественно)
```

### 4. 🤰 Беременность (`Date_pregnancy`)
```
👶 pregnancy/pregnancy.js
├── Ввод ДПМ: дд.мм.гггг или календарь
├── Срок (нед + дн), ПДР = ДПМ + 280 дней
├── Отметка: 22⁰–36⁶ преждевременные роды, 37⁰–41⁶ доношенный, ≥ 42⁰ переношенная
└── Информационное видео (g.mp4, expo-video)
```
Параметров плода, графиков и рекомендаций нет.

### 5. 🫁 Кислород (`Tabnav_oxy`)
```
🫁 calculate_o2/tabnav_oxy.js
├── ⏱️ Время работы баллона (`Calc_max_time_o2` → calc_max_time_o2.js)
│   ├── Ввод: объём (л), давление (атм или МПа), поток (л/мин), резерв (атм, по умолчанию 14)
│   └── Вывод: время до резерва = V × (P − Pрез) / Q и максимум до нуля = V × P / Q
├── 📊 Формула Дарбиняна (`Calc_dorbinyn` → calc_dorbinyn.js)
│   ├── Ввод: только масса тела (кг)
│   └── МОД = масса / 10 + 1 л/мин; < 5 кг — не применяется; маска у взрослых +2–3 л/мин
└── 🏥 Аппаратная ИВЛ (`Calc_aparat_IVL` → calc_aparat_IVl.js)
    ├── Аппарат: MEDUMAT Standard², MEDUMAT Standard, А-ИВЛ/ВВЛ/ВЧп-4/40
    ├── Сценарий: СЛР / без остановки или ROSC; трубка/НВУ или маска; взрослый/ребёнок
    ├── Масса: идеальная по росту и полу (ARDSNet) или по возрасту (APLS)
    └── Вывод: ДО, минутная вентиляция, время вдоха/выдоха, проверка пределов аппарата
```

## 🔧 Шкалы и справочники

### 📋 МКБ-10 (`MKBScreen` → ICDSearchScreen)
```
📋 mkb10/mkbscreen.js + mkb10/mkb_data.json (≈ 11 800 записей)
├── Поиск по коду (в т.ч. на русской раскладке) и по названию, подсветка совпадений
├── Просмотр списка с подгрузкой страницами
└── Примечания к части кодов; коды вне МКБ-10 — только при точном вводе, помечены
```

### 👶 Физиологические нормы (`PediatricNormsScreen`)
```
👶 fiz_norm/pediatric_norms_screen.js
├── Возраст: новорождённые, 3 и 6 мес, 1–6 лет, 8, 10, 12, 14 лет
└── Масса и рост (средние), ЧДД, ЧСС, АД — средние и границы нормы (PALS), порог гипотензии
```

### 🩸 Группа крови (`BloodGroupScreen`)
```
🩸 blood_group/blood_group_screen.js
├── Реакции «− / ± / +»: анти-A, анти-B, анти-AB, контроль 0,9% NaCl, анти-D
├── Результат: группа AB0 и резус (D), предупреждения
└── Справка: первичное определение, подтверждение в лаборатории (приказ МЗ РФ № 1134н, № 363)
```
Таблицы совместимости и правил переливания нет.

### 🧠 Шкала комы Глазго (`GCScreen`)
```
🧠 glazgo/glazgo.js
├── Режим: взрослые и дети ≥ 4 лет / дети < 4 лет
├── E (1–4), V (1–5), M (1–6), варианты «не оценивается» (сумма тогда не считается)
├── Сумма 3–15, уровень сознания, тяжесть ЧМТ (13–15 / 9–12 / 3–8)
└── ШКГ-З (зрачки) — только во взрослом режиме
```

### 🫁 Шкала ТЭЛА (`GenevaScoreScreen`)
```
🫁 Tela/tela.js — пересмотренная Женевская шкала (Le Gal 2006)
├── 8 критериев, ЧСС — обязательный выбор (< 75 / 75–94 / ≥ 95)
├── Трёхуровневая оценка: 0–3 / 4–10 / ≥ 11
├── Двухуровневая (ESC 2019): 0–5 / ≥ 6
└── Следующий шаг обследования (Д-димер или КТ-ангиопульмонография)
```

### ❤️ ШОКС (`SHOKSScreen`)
```
❤️ shoks/shoks.js — шкала оценки клинического состояния при ХСН (Мареев В.Ю.)
├── 10 пунктов (КР МЗ РФ «ХСН» 2024, приложение Г1)
├── Сумма 0–20 баллов
└── ФК ХСН: 0 — нет признаков; ≤ 3 — I; 4–6 — II; 7–9 — III; > 9 — IV
```
Это не qSOFA и не шкала сепсиса.

### 💉 Норадреналин (`NorepinephrineScreen`)
```
💉 Norepinephrine/NorepinephrineScreen.js
├── Ввод: масса, доза (мкг/кг/мин по основанию)
├── Шприцевой насос: мг основания + итоговый объём → концентрация, мл/ч, приготовление, запас
├── Капельница: мг основания + растворитель, 20 или 60 кап/мл → кап/мин
├── Максимум дозы: дети (< 40 кг) 2, взрослые 2,5 мкг/кг/мин основания
└── Предупреждения: неразведённый концентрат, скорость насоса, точность капельницы
```

## 🎨 Стили

```
🎨 theme.js — цвета, отступы, типографика, пределы масштаба шрифта (fontScaling)
📁 css/
├── calculate_preparation/ (calculates_css.js, WelcomeScreenStyles.js)
├── main_screen/styles.js
├── Intubation calculation/
├── Tube calculation/
└── tabnavtube/
calculate_o2/style_oxy.js — стили кислородных экранов
```
Интерфейс светлый, тёмной темы нет.

## 🔧 Техническая архитектура

### Навигация (React Navigation Stack, `App.js`)
| Маршрут | Компонент | Файл |
|---|---|---|
| `Home` | ButtonApp | main_screen/button_app.js |
| `Расчет лекарств` | WelcomeScreen | js_button_preparation/calculate_button.js |
| `Tabnav` | Tabnav | button_two/navigate_button/TabnavTube.js |
| `IntubationTubeCalculation` | IntubationTubeCalculation | button_two/button_intub/IntubationTubeCalculation.js |
| `Button_Tube_Calculation` | LaryngealTubeCalculation | button_two/button_laring/LaryngealTubeCalculation.js |
| `CalcShockIndexScreen` | CalcShockIndexScreen | shock_index_algovera/shock_algov_app.js |
| `Date_pregnancy` | Date_pregnancy | pregnancy/pregnancy.js |
| `Tabnav_oxy` | Tabnav_oxy | calculate_o2/tabnav_oxy.js |
| `Calc_max_time_o2` | Calc_max_time_o2 | calculate_o2/calc_max_time_o2.js |
| `Calc_dorbinyn` | Calc_dorbinyn | calculate_o2/calc_dorbinyn.js |
| `Calc_aparat_IVL` | Calc_aparat_IVL | calculate_o2/calc_aparat_IVl.js |
| `MKBScreen` | ICDSearchScreen | mkb10/mkbscreen.js |
| `PediatricNormsScreen` | PediatricNormsScreen | fiz_norm/pediatric_norms_screen.js |
| `BloodGroupScreen` | BloodGroupScreen | blood_group/blood_group_screen.js |
| `GCScreen` | GCScreen | glazgo/glazgo.js |
| `GenevaScoreScreen` | GenevaScoreScreen | Tela/tela.js |
| `SHOKSScreen` | SHOKSScreen | shoks/shoks.js |
| `NorepinephrineScreen` | NorepinephrineScreen | Norepinephrine/NorepinephrineScreen.js |

### Компоненты и утилиты
```
components/AppText.js      — Text и TextInput с общими пределами масштаба шрифта
components/FontScaling.js  — ScaledText, AdaptiveText, ScaledTextInput, хуки масштабирования
utils/parseNum.js          — разбор числа из поля (запятая или точка, некорректный ввод → undefined)
```

### Состояние
```
📊 Только локальное состояние экранов (useState / useMemo)
├── Поля ввода
└── Результаты расчётов
```
Постоянного хранения (AsyncStorage, файлы) нет: истории и сохранения результатов нет.

## 📊 Данные

### Препараты
```
📋 js_button_preparation/formulas.js — собирает список из formula_groups/:
toxicology, resuscitation, infusion, respiratory_analgesia, nmb_hematology,
antibiotics_antiallergic, emergency_misc_1, emergency_misc_2, adult_only
```
Каждая запись: `name`, `description` (форма выпуска), `inputs` (поля), `formula` (расчёт,
возвращает `result1…resultN`; примечания о пределах — строками в тех же полях), `units`, `limits` (пределы доз для отметки на экране).
На момент обновления: 81 запись, 59 с расчётом, 22 справочные.

### Справочные данные внутри экранов
```
mkb10/mkb_data.json                — МКБ-10 ({ meta, items: [{ code, name, note?, ext?, src? }] })
fiz_norm/pediatric_norms_screen.js — таблица педиатрических норм
button_two/button_laring/CalculateTube.js — таблица VBM LT / LTS-D
```
Картинки `shock_index_algovera/image2.png`, `button_intub/intub_img.png`,
`button_laring/ларинг_изображ.png`, `main_screen/logo.png`, `main_screen/title.png` в коде
не используются.

## 🔄 Рабочие процессы

### Добавление модуля
```
1. Папка модуля и компонент экрана
2. Stack.Screen в App.js
3. Карточка в main_screen/button_app.js
4. Комментарий с источником у каждого клинического значения
5. Проверка на типичных и граничных значениях
6. Обновление README, USER_GUIDE и этой карты
```

### Процесс расчёта
```
1. Ввод параметров
2. Проверка ввода (пределы правдоподобия)
3. Расчёт и ограничение установленными максимумами
4. Вывод с единицами, пределами и предупреждениями
```
