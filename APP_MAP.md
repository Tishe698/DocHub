# Карта приложения DocHub

Карта описывает код ветки на момент обновления документации: экраны, маршруты, модули расчёта
и данные. Устройство общей инфраструктуры (тема, компоненты, доступность, общий пациент, пути
введения) описано в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Расчёты справочные и требуют
клинической проверки. Источник каждого значения указан комментарием в коде, сводная таблица
источников — в [README](README.md#клинические-источники).

## Корень приложения (`App.js`)

```
SafeAreaProvider
└── ThemeProvider                тема «Авто / Светлая / Тёмная», режим хранится в AsyncStorage
    └── PatientProvider          общий пациент, только в памяти
        └── NavigationContainer  тема навигации из makeNavigationTheme(theme)
            ├── StatusBar        один на приложение; экраны свой не рисуют и не прячут
            └── native-stack     Home без шапки + маршруты из массива ROUTES
```

Шапка экранов: фон `surface`, кнопки `primary`, подпись «Назад» скрыта, справа — переключатель
темы `ThemeToggle` (луна / солнце). Заголовки короткие, без эмодзи.

## Маршруты

| Маршрут | Заголовок | Компонент | Файл |
|---|---|---|---|
| `Home` | — (без шапки) | ButtonApp | main_screen/button_app.js |
| `Расчет лекарств` | Расчёт препаратов | WelcomeScreen | js_button_preparation/calculate_button.js |
| `NorepinephrineScreen` | Норадреналин | NorepinephrineScreen | Norepinephrine/NorepinephrineScreen.js |
| `Tabnav` | Интубация | Tabnav | button_two/navigate_button/TabnavTube.js |
| `IntubationTubeCalculation` | Эндотрахеальная трубка | IntubationTubeCalculation | button_two/button_intub/IntubationTubeCalculation.js |
| `Button_Tube_Calculation` | Ларингеальная трубка | LaryngealTubeCalculation | button_two/button_laring/LaryngealTubeCalculation.js |
| `Tabnav_oxy` | Кислород | Tabnav_oxy | calculate_o2/tabnav_oxy.js |
| `Calc_max_time_o2` | Время работы баллона | Calc_max_time_o2 | calculate_o2/calc_max_time_o2.js |
| `Calc_dorbinyn` | Минутный объём дыхания | Calc_dorbinyn | calculate_o2/calc_dorbinyn.js |
| `Calc_aparat_IVL` | Настройка ИВЛ | Calc_aparat_IVL | calculate_o2/calc_aparat_IVl.js |
| `NewsScreen` | NEWS2 | NewsScreen | news/NewsScreen.js |
| `GCScreen` | Шкала Глазго | GCScreen | glazgo/glazgo.js |
| `CalcShockIndexScreen` | Шоковый индекс | CalcShockIndexScreen | shock_index_algovera/shock_algov_app.js |
| `GenevaScoreScreen` | Вероятность ТЭЛА | GenevaScoreScreen | Tela/tela.js |
| `SHOKSScreen` | Шкала ШОКС | SHOKSScreen | shoks/shoks.js |
| `PediatricNormsScreen` | Нормы в педиатрии | PediatricNormsScreen | fiz_norm/pediatric_norms_screen.js |
| `ApgarScreen` | Шкала Апгар | ApgarScreen | apgar/ApgarScreen.js |
| `DefibrillatorScreen` | Дефибриллятор | DefibrillatorScreen | defibrillation/DefibrillatorScreen.js |
| `MKBScreen` | МКБ-10 | ICDSearchScreen | mkb10/mkbscreen.js |
| `BloodGroupScreen` | Группа крови | BloodGroupScreen | blood_group/blood_group_screen.js |
| `Date_pregnancy` | Срок беременности | Date_pregnancy | pregnancy/pregnancy.js |

Имена маршрутов не меняются: на них ссылаются `navigation.navigate` и `menuConfig.js`.

## Главный экран (`Home`)

```
main_screen/button_app.js
├── Заголовок DocHub и подпись
├── PatientBar — сводка пациента, «Изменить» / «Указать», «Новый пациент»
├── Разделы (данные — main_screen/menuConfig.js → MENU_SECTIONS, карточка — MenuCard.js)
│   ├── Препараты .................. Расчёт препаратов, Норадреналин
│   ├── Реанимация ................. Дефибриллятор
│   ├── Дыхательные пути и кислород  Интубация, Кислород и ИВЛ
│   ├── Шкалы и индексы ............ NEWS2, Шкала Глазго, Шоковый индекс, Шкала ТЭЛА, Шкала ШОКС
│   ├── Педиатрия и неонатология ... Нормы в педиатрии, Шкала Апгар
│   └── Справочники ................ МКБ-10, Группа крови, Срок беременности
├── Справа от заголовка DocHub — ThemeToggle: нажатие — светлая / тёмная, долгое — как в телефоне
└── Напоминание: расчёты справочные
```

- Сетка: 2 столбца только при ширине от 600 и масштабе шрифта меньше 1,3, иначе 1 столбец
  (`gridColumns(width, fontScale)`).
- Подменю «Интубация» и «Кислород» описаны в том же файле: `TUBE_MENU`, `OXYGEN_MENU`.
- Чтобы добавить экран в меню, добавьте запись в `menuConfig.js`: `route` из `ROUTES` в
  `App.js`, `section` — ключ `theme.colors.section`, `icon` — имя Ionicons.
  `main_screen/__tests__/menuConfig.test.js` проверяет, что у каждого маршрута `App.js` есть
  карточка на главном экране или в подменю.

## Общий пациент (`patient/`)

```
PatientContext.js  — PatientProvider, usePatient, usePatientNumber, usePatientAge
                     patient: weightKg, weightSource (entered | broselow | age), ageMonths, sex,
                              heightCm, broselowZone
                     derived: ageYears, isNeonate, isChild, estimatedWeightKg, zone, weightIsEstimate
                     resetCount — растёт при «Новый пациент», экраны по нему сбрасывают свои поля
estimates.js       — оценка массы по APLS, зоны Broselow-Luten 2017 по росту / массе / возрасту,
                     сверка массы с возрастом
PatientBar.js      — полоса пациента и patientSummary() для копируемого текста
PatientEditor.js   — окно: масса и возраст, «Новорождённый (до 1 мес)», пол и рост, лента Broselow
BroselowPicker.js  — выбор зоны ленты (цвета зон одинаковы в обеих темах, рядом подпись)
```

Пациент хранится только в памяти: после перезапуска приложения данных нет.

| Экран | Что берёт из пациента |
|---|---|
| Расчёт препаратов | масса, возраст (лет + мес), рост, пол — и пишет их обратно |
| Норадреналин | масса (в обе стороны), возраст — для детского предела |
| Эндотрахеальная трубка | рост, зона Broselow, возраст, масса, пол |
| Ларингеальная трубка | масса, рост; категория по возрасту (младше 18 лет — ребёнок) |
| Формула Дарбиняна, Аппаратная ИВЛ | масса, рост, пол, возраст |
| NEWS2 | возраст — для предупреждения «младше 16 лет» |
| Шкала Глазго | возраст — детская шкала при возрасте меньше 48 мес |
| Шоковый индекс | возраст; переключатель беременности скрыт у мужчин |
| Шкала ТЭЛА | возраст — пункт «старше 65 лет» с 65 лет 1 мес, предупреждение до 18 лет |
| Нормы в педиатрии | возраст — выбор строки |
| Время работы баллона, ШОКС, Апгар, МКБ-10, Группа крови, Срок беременности | не используют (ШОКС только сбрасывается по «Новый пациент») |

## Препараты

### Экран «Расчёт препаратов» (`Расчет лекарств`)

```
js_button_preparation/calculate_button.js — только интерфейс
├── PatientBar
├── Поиск по МНН, синонимам и описанию (searchFormulas, подсветка highlightParts)
├── Список: «Найдено: N из 128», отметки «Справочно» и «Есть предупреждения»
└── Карточка препарата (на том же экране; Android «Назад» возвращает к списку)
    ├── «К списку препаратов», название, форма выпуска, предупреждения «Внимание»
    ├── «Расшифровка сокращений (N)» — свёрнутый блок: сокращения этой записи и её результата
    │   (словарь abbreviations.js)
    ├── Поля: масса, возраст (лет + мес), рост, пол — из общего пациента;
    │   «Новорождённый (до 1 мес)»; путь введения и показание — кнопки ChoiceChips
    ├── «Рассчитать» и «Очистить поля препарата» (пациента не трогает)
    └── Результат (ResultCard): строки с единицами и отметками о пределах, примечания,
        «Копировать», «Сбросить»
```

```
js_button_preparation/engine.js — чистые функции
├── computeResult(formula, rawInputs, { age, weightNote, now })
│     → { error, type, message, errors } | { info, message } |
│       { success, items, choices, inputsText, notes, warnings, timestamp }
├── validateField — пределы правдоподобия (масса, возраст, рост 20–250 см и др.)
├── resolveAge — возраст «лет + мес» в нужную запись: полные годы, доля года до 1 года, месяцы
├── buildCopyText, resultSpoken, itemSpoken, resultLevel
├── searchFormulas, highlightParts
└── isReferenceOnly — запись без полей, формула ничего не возвращает
js_button_preparation/routes.js — routeInput, choiceInput, ROUTES, routeLabel, choiceLabel
js_button_preparation/formulas.js — сборка списка из formula_groups/
```

Копируемый текст без эмодзи: «Препарат: …», «Путь введения: …», «Показание: …», «Данные: …»,
строки результата, «Внимание: …», «Рассчитано: ЧЧ:ММ».

### Группы препаратов (`js_button_preparation/formula_groups/`)

| Файл | Записей | Состав |
|---|---|---|
| toxicology.js | 5 | активированный уголь, ацетилцистеин, диазепам, мидазолам, флумазенил |
| resuscitation.js | 8 | эпинефрин — СЛР; эпинефрин — анафилаксия в/м; атропин; амиодарон; верапамил; норэпинефрин; добутамин; допамин |
| infusion.js | 8 | ГЭК 6%, декстран 40, NaCl 0,9%, глюкоза 10%, глюкоза 40%, вода для инъекций, ацесоль, раствор Рингера |
| respiratory_analgesia.js | 9 | будесонид, ипратропия бромид + фенотерол, сальбутамол, кеторолак, трамадол, морфин, фентанил, пропофол, тиопентал натрия |
| nmb_hematology.js | 5 | суксаметоний, пипекурония бромид, гепарин натрия, этамзилат, транексамовая кислота |
| antibiotics_antiallergic.js | 5 | цефтриаксон, хлорамфеникол, стрептомицин, хлоропирамин, дифенгидрамин |
| emergency_misc_1.js | 8 | кальция глюконат, магния сульфат, кетамин, метамизол натрия, метоклопрамид, дроперидол, хлорпромазин, галоперидол |
| emergency_misc_2.js | 10 | дротаверин, платифиллин, налоксон, вальпроевая кислота, пиридоксин, тиамин, фильтрум, меглюмина натрия сукцинат, парафин жидкий, унитиол |
| adult_only.js | 21 | препараты для взрослых: гипотензивные, антиангинальные, антиагреганты и антикоагулянты, окситоцин, натрия тиосульфат, натрия гидрокарбонат 5%, антисептики и др. |
| analgesics_steroids.js | 5 | парацетамол, ибупрофен, преднизолон, дексаметазон, гидрокортизон |
| cardio_endocrine_misc.js | 7 | лидокаин, АТФ, ацетилсалициловая кислота — ОКС, фуросемид, инсулин короткого действия — ДКА, глюкагон, ондансетрон |
| thrombolytics_antiplatelets.js | 8 | алтеплаза — ИМпST, инсульт, ТЭЛА; тенектеплаза; проурокиназа; фортелизин — ИМпST и инсульт; тикагрелор |
| antiarrhythmics_vasopressors.js | 3 | прокаинамид, пропафенон, фенилэфрин |
| bronchodilators_rsi.js | 3 | аминофиллин, рокурония бромид, сугаммадекс |
| electrolytes_solutions.js | 5 | калия хлорид, кальция хлорид, Рингер-лактат, Стерофундин, калия и магния аспарагинат |
| antidotes_local_analgesia.js | 8 | этанол, протамина сульфат, цинка бисвинилимидазола диацетат, галантамин (справочно), карбоксим, закись азота, кетопрофен, прокаин |
| antimicrobials_antihistamines.js | 3 | клемастин, цефотаксим, бензилпенициллин |
| neuro_cardio_volume.js | 5 | леветирацетам, феназепам, маннитол, дигоксин, желатин сукцинилированный |
| nebulized_pediatrics.js | 2 | эпинефрин — круп (ингаляция), гипертонический раствор натрия хлорида 3% — бронхиолит (справочно) |

Всего 128 записей: у 122 есть расчёт, 6 справочных (глюкоза 40% у взрослых, вазелиновое масло,
хлоргексидин 0,05%, альбуцид 20%, галантамин, натрия хлорид 3% при бронхиолите). Полный список с путями введения и показаниями —
в [USER_GUIDE.md](USER_GUIDE.md#список-препаратов).

Поля записи: `name`, `description` (форма выпуска), `synonyms` (необязательно), `inputs`,
`formula(inputs)` → `{ result1 … resultN }`, `labels`, `units`, `limits` (объект или функция
от введённых данных), `warnings`. Путь введения — `routeInput([...], default)`, показание
и другие выборы — `choiceInput(label, options, default)`. Если у записи несколько путей или
показаний, у каждого варианта свой диапазон ключей результата, и подпись строки называет путь.
В `adult_only.js` расчёт идёт только с 18 лет. Младше 18 лет формула возвращает `{}`, и экран
показывает предупреждения препарата.

Тесты групп — `formula_groups/__tests__/<группа>.test.js`, движка и экрана —
`js_button_preparation/__tests__/`.

### Норадреналин (`NorepinephrineScreen`)

```
Norepinephrine/NorepinephrineScreen.js — экран, PatientBar
Norepinephrine/norepinephrineCalc.js   — calcNorepinephrine({ weight, dose, drugMg, syrVol,
                                          bagMg, bagDiluent, dropFactor, ageMonths })
                                          → { ok, errors, fieldErrors, dose, syringe, bag }
├── Шприцевой насос: концентрация, мл/ч, приготовление, на сколько хватит шприца
├── Капельница 20 или 60 кап/мл: кап/мин
└── Предел дозы: 2 мкг/кг/мин основания при массе меньше 40 кг или возрасте до 18 лет, иначе 2,5
```

## Дыхательные пути и кислород

### Интубация (`Tabnav` → подменю `TUBE_MENU`)

```
Эндотрахеальная трубка (IntubationTubeCalculation)
├── IntubationTubeCalculation.js — экран: пациент, зона Broselow (серая зона — подзона 3, 4 или 5 кг),
│   манжета, путь (рот, нос, оба); расчёт сразу при вводе, итог через ResultCard
├── intubationFromPatient.js — сборка ввода из пациента, подписи методов, текст для озвучивания
└── CalculateIntubationTube.js — логика:
    рост → выбранная зона Broselow → возраст, масса, пол;
    calculateIntubationTubeByZone({ zoneKey, greySubzone, ageYears, ageMonths, cuffed, route });
    если зона расходится с ростом — расчёт по росту и предупреждение
    Вывод: метод, внутренний диаметр, альтернативы ±0,5 мм, глубина через рот и через нос

Ларингеальная трубка (Button_Tube_Calculation)
├── LaryngealTubeCalculation.js — экран: категория по возрасту (можно сменить), масса, рост
├── laryngealFromPatient.js
└── CalculateTube.js — таблица VBM LT / LTS-D (IFU 2017): ребёнок по массе (больше 25 кг — по
    росту), взрослый по росту; размер, цвет коннектора, объём манжеты, давление 60 см вод. ст.,
    зонд для дренажного канала LTS-D
```

### Кислород и ИВЛ (`Tabnav_oxy` → подменю `OXYGEN_MENU`)

```
calculate_o2/
├── calc_max_time_o2.js → oxygenCalc.js      Время работы баллона: объём, давление (атм или МПа),
│                                             поток, резерв (по умолчанию 14 атм)
├── calc_dorbinyn.js    → darbinyanCalc.js   МОД = масса / 10 + 1 по фактической или должной массе;
│                                             меньше 5 кг — не применяется; PatientBar
├── calc_aparat_IVl.js  → ventilatorCalc.js  Аппарат, сценарий, дыхательные пути, взрослый / ребёнок;
│                                             PBW (должная масса), пресеты и пределы аппаратов,
│                                             computeIvl, CHILD_OVERWEIGHT_RATIO = 1.2; PatientBar
├── tabnav_oxy.js                             подменю
└── style_oxy.js                              makeOxyStyles, useOxyStyles (без экспорта по умолчанию)
```

Все три экрана считают сразу при вводе, без кнопки «Рассчитать».

## Шкалы и индексы

| Экран | Файлы | Что считает |
|---|---|---|
| NEWS2 | news/NewsScreen.js, news/newsScore.js | `computeNews2(input)` → баллы по 7 параметрам, сумма, «3 балла по одному параметру», уровень риска (`RISK`: none / low / lowMedium / medium / high), частота наблюдения и реакция; `ageWarning`, `summaryText` |
| Шкала Глазго | glazgo/glazgo.js, glazgo/gcsScore.js | E, V, M, сумма 3–15, тяжесть ЧМТ, ШКГ-З; детская шкала при возрасте меньше 4 лет |
| Шоковый индекс | shock_index_algovera/shock_algov_app.js, calculateShockIndex.js | SI = пульс / САД; взрослые, SIPA у детей 1–16 лет, беременность и роды; гипотензия для возраста; кровопотеря |
| Шкала ТЭЛА | Tela/tela.js, Tela/genevaScore.js | пересмотренная Женевская шкала; три и два уровня вероятности, следующий шаг |
| Шкала ШОКС | shoks/shoks.js, shoks/shoksScore.js | 10 пунктов, 0–20 баллов, ФК ХСН I–IV |

Итог на экранах шкал стоит после полей ввода, чтобы фокус диктора шёл сверху вниз.

## Педиатрия и неонатология

```
fiz_norm/pediatric_norms_screen.js + normsData.js
├── Строки: новорождённые, 3 и 6 мес, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14 лет
├── normForAge: ближайшая младшая строка в той же полосе PALS; 1–2 мес → «3 мес»;
│   15–17 лет → «14 лет» (ориентировочно); с 18 лет — не применяется
└── Ручной выбор сбрасывается при смене возраста пациента и «Новый пациент»

defibrillation/DefibrillatorScreen.js + defibLogic.js + devices.js
├── «Что на мониторе?»: ФЖ / ЖТ без пульса, ЖТ с пульсом, ФП, ТП / НЖТ, брадикардия, асистолия / ЭАБП
│   («?» — расшифровка и признаки нестабильности)
├── Взрослый / Ребёнок (по возрасту; без возраста — масса меньше 40 кг), масса — из поля с проверкой
├── Аппарат: LIFEPAK 15, ZOLL R Series, Аксион, Philips, Mindray, Nihon Kohden, corpuls3, ZOLL AED Plus,
│   другой бифазный, монофазный — энергия на ступени аппарата (shockPlan, pickStep)
├── ResultCard: энергия, режим (без синхронизации / SYNC), повторные разряды, расчёт Дж/кг
└── Электроды, действия по шагам (stepsFor), безопасность (safetyFor), особые случаи (SPECIAL)

apgar/ApgarScreen.js + apgarScore.js
├── Секундомер от рождения: «Ребёнок родился — запустить», сдвиг ±1 мин, «Сбросить»
├── Оценка: минута, пять признаков по 0–2 балла, «На фоне реанимационных мероприятий»
├── Обязательные минуты 1 и 5; 10-я — если реанимация продолжается после 5-й минуты;
│   10, 15, 20-я — если на 5-й минуте меньше 7 баллов (оба правила применяются вместе)
├── Интерпретация (МКБ-10 P21): 8–10 удовлетворительное, 4–7 умеренная асфиксия, 0–3 тяжёлая
└── «Скопировать», «Новая оценка»; данные только в состоянии экрана
```

## Справочники

```
mkb10/mkbscreen.js + icdSearch.js + mkb_data.json (11 841 запись)
├── mkb_data.json загружается при первом открытии (с индикатором), индекс кэшируется до перезапуска
├── Поиск по коду (в т. ч. на русской раскладке: «Ш21.0» → I21.0) и по названию, подсветка
├── Без запроса: «Всего N кодов. Список прокручивается.»
└── Примечания к части кодов; коды вне МКБ-10 — только при точном вводе, с пометкой

blood_group/blood_group_screen.js + bloodGroupLogic.js + ReactionTable.js + BloodDrop.js
├── Таблица AB0 с рисунками капель (анти-А, анти-В, анти-АВ): нажатием выбирают строку 0(I)–AB(IV)
├── Таблица резуса (анти-D супер): Rh(+) / Rh(−)
└── Итог «A(II) Rh(+)», для AB(IV) — напоминание о контроле с 0,9% NaCl

pregnancy/pregnancy.js + pregnancyCalc.js
├── ДПМ: дд.мм.гггг или календарь; ошибки под полем, озвучиваются
├── Срок (нед + дн), ПДР = ДПМ + 280 дней, отметка о сроке; дни — по календарной дате (Date.UTC)
└── Видео g.mp4 (expo-video) ниже расчёта: свои кнопки Пуск / Пауза, Звук, На весь экран
```

## Общие модули

```
theme/        palette.js (светлая и тёмная палитры), tokens.js, broselow.js, ThemeProvider.js, index.js
components/   Screen.js, AppText.js, a11y.js, ui/ (Button, ChoiceChips, NumberField, SwitchRow, Card,
              Section, ResultCard, Badge, Note, HelpButton, ThemeToggle)
utils/        parseNum.js — разбор числа (запятая или точка; некорректный ввод → undefined)
```

## Состояние и хранение

| Что | Где | Срок жизни |
|---|---|---|
| Режим темы | AsyncStorage, ключ `dochub.themeMode` | сохраняется между запусками |
| Пациент | PatientProvider (память) | до закрытия приложения или «Новый пациент» |
| Поля и результаты экранов | локальное состояние экрана | до ухода с экрана |
| Индекс МКБ-10 | кэш модуля | до перезапуска приложения |

Истории расчётов и передачи данных нет.

## Тесты

Jest с пресетом `jest-expo`, тесты лежат в `__tests__/` рядом с кодом:

- чистые модули: `engine`, `routes`, все группы `formula_groups`, `CalculateIntubationTube`,
  `intubationFromPatient`, `CalculateTube`, `oxygenCalc`, `darbinyanCalc`, `ventilatorCalc`,
  `norepinephrineCalc`, `newsScore`, `gcsScore`, `calculateShockIndex`, `genevaScore`,
  `shoksScore`, `normsData`, `apgarScore`, `icdSearch`, `bloodGroupLogic`, `pregnancyCalc`
  (и отдельный тест часовых поясов `pregnancyTz.test.js`), `estimates`, `parseNum`, `menuConfig`;
- контраст цветов обеих тем и ленты Broselow: `theme/__tests__/contrast.test.js`;
- рендер экранов: главный экран и подменю, препараты, трубки, кислород, NEWS2, Глазго, шоковый
  индекс, ТЭЛА, ШОКС, нормы, Апгар, МКБ-10, группа крови, беременность, норадреналин.

Команды и CI — в [README](README.md#разработка-тесты-линтер-форматирование-ci).

## Процесс расчёта

```
1. Ввод (поля экрана и общий пациент)
2. Проверка ввода: пределы правдоподобия, ошибка под полем и для диктора
3. Расчёт в чистом модуле, ограничение максимумами
4. Вывод: единицы, отметки о пределах, предупреждения; озвучивание через ResultCard или announce
```
