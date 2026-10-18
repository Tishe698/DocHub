// menuConfig.js — данные меню: разделы главного экрана и подменю «Интубация» и «Кислород».
// Чистые данные без React: проверяются тестом main_screen/__tests__/menuConfig.test.js
// (у каждой карточки маршрут из App.js, цвет раздела из theme.colors.section,
// иконка есть в наборе Ionicons).
//
// Поля карточки:
//   route   — имя маршрута в App.js (не менять: на него ссылается навигатор);
//   title   — короткое название без эмодзи (эмодзи диктор читает вслух);
//   description — одна строка-пояснение;
//   icon    — имя значка Ionicons (декоративный, скрыт от диктора);
//   section — ключ theme.colors.section (цвет полоски и значка).

export const THEME_MODE_OPTIONS = [
  { value: 'system', label: 'Авто', accessibilityLabel: 'Авто, как в настройках телефона' },
  { value: 'light', label: 'Светлая', accessibilityLabel: 'Светлая тема' },
  { value: 'dark', label: 'Тёмная', accessibilityLabel: 'Тёмная тема' },
];

export const MENU_SECTIONS = [
  {
    key: 'drugs',
    title: 'Препараты',
    cards: [
      {
        route: 'Расчет лекарств',
        title: 'Расчёт препаратов',
        description: 'Дозы, объёмы и пути введения',
        icon: 'medkit-outline',
        section: 'drugs',
      },
      {
        route: 'NorepinephrineScreen',
        title: 'Норадреналин',
        description: 'Скорость инфузии',
        icon: 'water-outline',
        section: 'norepinephrine',
      },
    ],
  },
  {
    key: 'resus',
    title: 'Реанимация',
    cards: [
      {
        route: 'DefibrillatorScreen',
        title: 'Дефибриллятор',
        description: 'Когда разряд, какая энергия, кардиоверсия',
        icon: 'flash-outline',
        section: 'defib',
      },
    ],
  },
  {
    key: 'airway',
    title: 'Дыхательные пути и кислород',
    cards: [
      {
        route: 'Tabnav',
        title: 'Интубация',
        description: 'Эндотрахеальная и ларингеальная трубки',
        icon: 'git-branch-outline',
        section: 'airway',
      },
      {
        route: 'Tabnav_oxy',
        title: 'Кислород и ИВЛ',
        description: 'Баллон, минутный объём, параметры ИВЛ',
        icon: 'cloud-outline',
        section: 'oxygen',
      },
    ],
  },
  {
    key: 'scores',
    title: 'Шкалы и индексы',
    cards: [
      {
        route: 'NewsScreen',
        title: 'NEWS2',
        description: 'Ранняя оценка тяжести у взрослых',
        icon: 'analytics-outline',
        section: 'news',
      },
      {
        route: 'GCScreen',
        title: 'Шкала Глазго',
        description: 'Оценка уровня сознания',
        icon: 'eye-outline',
        section: 'gcs',
      },
      {
        route: 'CalcShockIndexScreen',
        title: 'Шоковый индекс',
        description: 'Индекс Альговера',
        icon: 'pulse-outline',
        section: 'shock',
      },
      {
        route: 'GenevaScoreScreen',
        title: 'Шкала ТЭЛА',
        description: 'Пересмотренная Женевская шкала',
        icon: 'fitness-outline',
        section: 'pe',
      },
      {
        route: 'SHOKSScreen',
        title: 'Шкала ШОКС',
        description: 'Клиническое состояние при ХСН',
        icon: 'heart-half-outline',
        section: 'chf',
      },
    ],
  },
  {
    key: 'pediatrics',
    title: 'Педиатрия и неонатология',
    cards: [
      {
        route: 'PediatricNormsScreen',
        title: 'Нормы в педиатрии',
        description: 'Физиологические показатели по возрасту',
        icon: 'body-outline',
        section: 'pediatrics',
      },
      {
        route: 'ApgarScreen',
        title: 'Шкала Апгар',
        description: 'Оценка новорождённого на 1-й и 5-й минуте',
        icon: 'happy-outline',
        section: 'apgar',
      },
    ],
  },
  {
    key: 'reference',
    title: 'Справочники',
    cards: [
      {
        route: 'MKBScreen',
        title: 'МКБ-10',
        description: 'Поиск диагноза по коду и названию',
        icon: 'book-outline',
        section: 'icd',
      },
      {
        route: 'BloodGroupScreen',
        title: 'Группа крови',
        description: 'AB0 и резус цоликлонами',
        icon: 'flask-outline',
        section: 'blood',
      },
      {
        route: 'Date_pregnancy',
        title: 'Срок беременности',
        description: 'Срок и предполагаемая дата родов',
        icon: 'calendar-outline',
        section: 'pregnancy',
      },
    ],
  },
];

// Подменю «Интубация» (button_two/navigate_button/TabnavTube.js)
export const TUBE_MENU = [
  {
    route: 'IntubationTubeCalculation',
    title: 'Эндотрахеальная трубка',
    description:
      'Дети — по длине тела, возрасту или массе; 13–15 лет — по возрасту и росту; с 16 лет — по полу',
    image: 'ett',
    section: 'airway',
  },
  {
    route: 'Button_Tube_Calculation',
    title: 'Ларингеальная трубка',
    description: 'VBM LT / LTS-D: дети — по массе, взрослые — по росту. Не для ларингеальной маски',
    image: 'lt',
    section: 'airway',
  },
];

// Подменю «Кислород» (calculate_o2/tabnav_oxy.js)
export const OXYGEN_MENU = [
  {
    route: 'Calc_max_time_o2',
    title: 'Время работы баллона',
    description: 'По объёму, давлению и потоку — до резерва давления',
    icon: 'timer-outline',
    section: 'oxygen',
  },
  {
    route: 'Calc_dorbinyn',
    title: 'Формула Дарбиняна',
    description: 'Минутный объём дыхания по массе тела',
    icon: 'stats-chart-outline',
    section: 'oxygen',
  },
  {
    route: 'Calc_aparat_IVL',
    title: 'Аппаратная ИВЛ',
    description: 'Стартовые параметры: MEDUMAT, А-ИВЛ/ВВЛ/ВЧп-4/40',
    icon: 'options-outline',
    section: 'oxygen',
  },
];

// Подпись карточки для диктора: «Название, пояснение»
export function cardA11yLabel(card) {
  return [card.title, card.description].filter(Boolean).join(', ');
}

// Все карточки главного экрана одним списком
export function allMainCards(sections = MENU_SECTIONS) {
  return sections.flatMap((s) => s.cards);
}

// Число столбцов сетки: 2 — только на широком экране и без крупного шрифта
// (при масштабе ≥ 1.3 две колонки не помещают переносимые строки).
export function gridColumns(width, fontScale = 1) {
  if (!Number.isFinite(width)) return 1;
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  return width >= 600 && scale < 1.3 ? 2 : 1;
}
