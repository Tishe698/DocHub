// formulas.js

const formulas = [
  {
    name: 'Анальгин',
    description: 'sol. analgini 500 mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 10, // мг
      result2: mass * 0.02, // мл
    }),
  },
  {
    name: 'адреналин',
    description: 'sol. adrenalini 1mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: 0.01 * mass, // мг
      result2: (0.01 * mass) / 1, // мл
    }),
  },
  {
    name: 'Амиадарон',
    description: 'sol.Amiodaroni 50 mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 5, // мг
      result2: mass * 5 / 50, // мл
    }),
    warnings: ["максимальная  cуточная доза (1200 мг)"],
  },  
  {
    name: 'Аскарбиновая кислота',
    description: 'Acidi ascorbinici 50 mg/ml - 2ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 7, // мг
      result2: mass * 7 / 50, // мл
    }),
    warnings: ["максимальная суточная доза (500 мг)"],
  },
  {
    name: 'активированный уголь',
    description: 'tab. Carbonis activati 250 mg',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 0.05, // граммы
      result2: (mass * 0.05 * 1000) / 250, // таблеток
    }),
  },
  {
    name: 'Аспирин',
    description: 'tab.Acidi acetylsalicylici acidi 500 mg',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 30, // граммы
      result2: mass * 30 / 500, // таблеток
    }),
    warnings: ["максимальная разовая доза (1000 мг) старше 16 лет!"],
  },
  {
    name: 'Атропин',
    description: 'sol.Atropini sulfatis 1 mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 0.02, // мг
      result2: mass * 0.02, // мл
    }),
  },
  {
    name: 'Вальпроевая кислота',
    description: 'Sol. Acidi valproici 100 mg/ml - 5 ml',
    inputs: { ageYears: 'Возраст (лет)', ageMonths: 'Возраст (месяцы)', weight: 'Вес (кг)' },
    formula: ({ ageYears, ageMonths, weight }) => {
      const totalAge = parseFloat(ageYears) + parseFloat(ageMonths) / 12; // Переводим в общий возраст в годах
      if (totalAge >= 0.5 && weight > 0) {
        let result1;
        if (totalAge >= 0.5 && totalAge < 10) {
          result1 = weight * 50; // Для возраста от полугода до 10 лет
        } else if (totalAge >= 10) {
          result1 = weight * 15; // Для возраста старше 10 лет
        } else {
          return { error: 'Недопустимый возраст для расчета' };
        }
  
        const result2 = result1 / 100; // Разведение 100 мг/мл
  
        return {
          result1: result1, // мг
          result2: result2, // мл
        };
      } else {
        return { error: 'Недопустимые данные для расчета' };
      }
    },
    warnings: ["все поля должны быть заполнены (если возраст менее года указывать в графе (лет) 0)"],
  },  
  {
    name: 'Верапамил',
    description: 'sol.Verapamili 2.5 mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 0.1, // мг
      result2: mass * 0.1 / 2.5, // мл
    }),
    warnings: ["максимальная доза (10 мг)"],
  },
  {
    name: 'Дексаметазон',
    description: 'Sol. Dexamethasoni 4 mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 0.6, // мг
      result2: mass * 0.6 / 4, // мл
    }),
  },
  {
    name: 'Дротаверин',
    description: 'sol.Drotaverini  20 mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 0.2, // мг
      result2: mass * 0.2 / 20, // мл
    }),
    warnings: ["Расчет производиться на детей до 12 лет, более 12 лет 2 мл"],
  },
  {
    name: 'Кальция глюконат',
    description: 'Sol. Calcii gluconici  100 mg/ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => ({
      result1: mass * 0.2, // мл
    }),
    warnings: ["Введение только в/в МЕДЛЕННО! 1% р-р нагретый до температуры тела, максимальная доза 10мл"],
  },
  {
    name: 'Карбоксим',
    description: ' Sol. "Carboxim" 150 mg/ml - 1 ml',
    inputs: { age: 'Возраст' },
    formula: ({ age }) => ({
      result1: 0.1 * age, // мл
    }),
    warnings: ["Введение в/м , при отравление ФОС"],
  },
  {
    name: 'Кетамин',
    description: 'Sol. Ketamini 50 mg/ml-2 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 3;
      const result2 = result1 / 50;

      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Запрещенно при Артериальной гипертнзии, ОИМ (меньше 6 мес.) , ОНМК в анамнезе , Эпилепсия, Эклампсия, Неизвестные наркотики, РАСЧЕТ ПО МАКС.ДОЗЕ 1-3 МГ/КГ"],
  },
  {
    name: 'Кеторолак',
    description: ' Sol. "Ketorolac 30mg/ml- 1ml',

    warnings: ["Введение только с 16 лет , 1мл в/м или в/в"],
  },
  {
    name: 'Клопидогрел',
    description: ' tab.Clopidogrel 75мг',

    warnings: ["При ОКС Пациентам до 75 лет - 300мг , после 75лет - 75мг"],
  },
  {
    name: 'Клофелин',
    description: '  Sol. "Clophelin" 0,1 mg/ml - 1 ml',

    warnings: ["Только с 18 лет максимальная разовая доза 3мл, суточкая 2"],
  },
  {
    name: 'Лидокаин',
    description: 'Sol. Lidocaini 20mg/ml-2 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 1;
      const result2 = result1 / 20;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["при кардиологической паталогии вводят в/в болюсно в течении 3-4 минуты , максимальная разовая доза 100 мг"],
  },
  {
    name: 'Магния сульфат',
    description: 'Sol. Magnesii sulfatis 250mg/ml-10 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 50;
      const result2 = result1 / 250;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["50мг/кг: 13мл в разведении NaCl 0.9% -250ml в/в кап. 2 кап./кг в мин - строго 30 минут"],
  },
  {
    name: 'Мезатон',
    description: 'Solutionis Phenylephrini 10mg/ml-1ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 0.1;
      const result2 = result1 /10;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Ограничений нет по возрасту"],
  },
  {
    name: 'Мексидол',
    description: ' Sol. Aethylmethylhydroxypyridini succinatis 50mg/ml',
    warnings: ["До 18 лет не вводиться , Максимальная суточная доза не должна превышать 1200 мг"],
  },
  {
    name: 'Метопролол',
    description: ' Sol. "Metoprolol" 1mg/ml - 5 ml',
    warnings: ["До 18 лет не вводиться ,ХОБЛ, АСТМА (заболевание легких вызывает бронхо-спазм) кардиогенный шок, нельзя при приеме антидепресантов, тяжелые нарушения периферического кровообращения, в том числе и при угрозе гангрены, артериальная гипотензия. "],
  },
  {
    name: 'Морфин',
    description: 'Sol. Morphini hydrochloridi  10 mg/ml – 1ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 0.2;
      const result2 = result1 /10;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["От 2 лет, Травма головы, эпилептический статус,острая алкогольная интексикация,нельзя при приеме антидепресантов,  Введение дробное (возможность угнетение дыхания) антидот налоксон"],
  },
  {
    name: 'Налоксон',
    description: 'Sol. "Naloxon" 0,4 mg/ml - 1 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 0.02;
      const result2 = result1 /0.4;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["вводят в/в медленно (в течение 2-3 мин), с осторожностью при травмах головы, эпилептических препадках(усиливает отек мозга).При необходимости дозу можно повторно ввести через 2-3 мин"],
  },
  {
    name: 'АТФ - Натрия аденозинтрифосфат',
    description: ' Sol. Nalrii adenosintriphosphatis 10 mg/ml- 1ml',
    warnings: ["До 18 лет не вводиться , Индивидуальная повышенная чувствительность к препарату,острый инфаркт миокарда,артериальная гипотензия,декомпенсированная стадия сердечной недостаточности,хронические обструктивные заболевания легких (например, бронхиальная астма);беременность,синдром пролонгации QT, "],
  },
  {
    name: 'Нивалин',
    description: 'Sol. "Nivalin" 2.5 mg/ml - 1 ml',
    inputs: { age: 'Возраст' },
    formula: ({ age }) => {
      if (age >= 1) {
        let dosage;
        if (age >= 1 && age < 5) {
          dosage = 1; // Для возраста от 1 года до 5 лет
        } else if (age >= 5) {
          dosage = 5; // Для возраста от 5 лет и старше
        }
  
        const result1 = dosage; // мг
        const result2 = dosage / 2.5; // мл
  
        return { result1, result2 };
      } else {
        return { error: 'Недопустимый возраст для расчета' };
      }
    },
  },
  {
    name: 'Новокаинамид',
    description: 'Sol. "Novocainamide" 100mg/ml-5 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 15;
      const result2 = result1 /100;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Ограничений нет"],
  },
  {
    name: 'Платифилин',
    description: 'Sol. Platyphyllini hydrotartratis 2mg/ml - 1 ml',
    inputs: { ageYears: 'Возраст (лет)', ageMonths: 'Возраст (месяцы)', weight: 'Вес (кг)' },
    formula: ({ ageYears, ageMonths, weight }) => {
      const totalAge = parseFloat(ageYears) + parseFloat(ageMonths) / 12; // Переводим в общий возраст в годах и месяцах
      if (totalAge >= 0 && weight > 0) {
        let result;
        if (totalAge < 1) {
          result = weight * 0.035; // До 1 года
        } else if (totalAge >= 1 && totalAge <= 5) {
          result = weight * 0.03; // 1-5 лет
        } else if (totalAge >= 6 && totalAge <= 10) {
          result = weight * 0.025; // 6-10 лет
        } else if (totalAge >= 11 && totalAge <= 14) {
          result = weight * 0.02; // 11-14 лет
        } else {
          return { error: 'Недопустимый возраст для расчета' };
        }
  
        return {
          result: result, // мг
          resultInMl: (result / 2), // мл
        };
      } else {
        return { error: 'Недопустимые данные для расчета' };
      }
    },
    warnings: ["все поля должны быть заполнены (если возраст менее года, указывать в графе (лет) 0)"],
  },
  {
    name: 'Парацетамол',
    description: 'tab. Paracetamoli 500 mg',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 15;
      
      return {
        result1: result1, // мг
      };
    },
    warnings: ["старше 1 месяца,варикозно раширенные вены пишевода "],
  },
  {
    name: 'Перлинганит',
    description: ' Sol. Perlinganiti 1mg/ml - 10 ml',
    warnings: ["Старше 18 лет, В/в через перфузор 2-8 мг/ч под контролем АД, ЭКГ "],
  },
  {
    name: 'Преднизолон',
    description: ' Sol. Prednisoloni 30mg/ml -1ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 5;
      const result2 = result1 /30;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Ограничений нет, для скорой помощи максимальное разовое введение по алгоритмам СМП 120 мг(4 ампулы)"],
  },
  {
    name: 'Сальбутамол',
    description: ' Sol. "Salbutamol" 1 mg/ml -2,5 ml',
    warnings: ["Старше2 лет, 2,5 мг "],
  },
  {
    name: 'Сибазон',
    description: ' Sol. Sibazoni (Diazepami) 5 mg/ml - 2ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 0.5;
      const result2 = result1 /5;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Макс разовая доза:  до 5 лет 5 мг, старше 5 лет 10мг, В/В ВВОДИТЬ МЕДЛЕННО НЕ МЕНЕЕ 2 МИНУТ,Повторное введение возможно через 10 минут, максимальная суточная доза 8 мл"],
  },
  {
    name: 'Спазмалин',
    description: ' Sol.Spasmalini  0,1 mg-5ml',
    warnings: ["(Спазматон, спазган), старше 3 месяцев "],
  },
  {
    name: 'Сульфацил натрия',
    description: ' Sol. Sulfacyli natrii 20% - 10,0 ml.',
    warnings: ["1-2 капли в глаз, ограничений нет (Сульфацетамид)"],
  },
  {
    name: 'Тиамин',
    description: ' Sol. Thiamini 50mg/ml - 1 ml',
    inputs: { age: 'Возраст' },
    formula: ({ age }) => ({
      result1: 0.1 * age, // мл
    }),
    warnings: ["Ограничений нет"],
  },
  {
    name: 'Тиосульфат натрия',
    description: 'Sol. Natrii thiosulfatis 300mg/ml-10',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 1;
      
      return {
        result2: result1, // мл
      };
    },
    warnings: ["ограничений по возрасту нет , максимальная доза 50 мл"],
  },
  {
    name: 'Трамадол',
    description: ' Sol. Sibazoni (Diazepami) 50 mg/ml - 2ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 2;
      const result2 = result1 /50;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Старше 1 года, Допустимо введение не более 100 мг каждые 6 часов"],
  },
  {
    name: 'Транексам',
    description: ' Sol. Acidi tranexamici 50mg/ml - 5 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 15;
      const result2 = result1 /50;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Старше 2 лет"],
  },
  {
    name: 'Унитилол',
    description: ' Sol. "Unithiol" 50mg/ml - 5 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = (mass * 50) / 10;
      const result2 = result1 /50;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Старше 18 лет"],
  },
  {
    name: 'Урапедил',
    description: ' Sol. Urapidili 5mg/ml - 10 ml',
    warnings: ["(Эбрантил)В/в или в/в капельно в положении лежа по контролем АД, ЭКГ 10-50 мг, эффект наступает в течение 5 минут. При недостаточном эффекте возможно повторное введение "],
  },
  {
    name: 'Фентанил',
    description: 'Sol. Phentanyli 50 mcg/ml-2 ml',
    inputs: { weight: 'Масса (кг)' },
    formula: ({ weight }) => {
      const dose = weight * 1; // 4 мкг на кг
      const concentration = 50; // Концентрация: 50 мкг/мл
      const volume = dose / concentration; // Рассчитываем объем
    
      return {
        dose: dose, // мкг
        volume: volume, // мл
      };
    },
    warnings: ["расчет производиться для указанного весса по минимальной дозе 1мкг/кг (возможнное введение от 1мкг/кг - 4мкг/кг)"],
  },
  {
    name: 'Феназепам',
    description: ' Tab. "Lignin hydrolised" 400mg',
    warnings: [" До 1 года 1/2 таб; 1-7 лет 1 таб; 7-12 лет 2 таб; от 12 лет 3 таб. Принимать внутрь, предварительно измельчив и растворив в 1 стакане воды"],
  },
  {
    name: 'Фуросемид',
    description: ' Sol. Furosemidi 10mg/ml - 2 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 2;
      const result2 = result1 /10;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Суточная доза до 160 мг взрослым, Детям 6 мг/кг/сут"],
  },
  {
    name: 'Хлорапирамин',
    description: ' Sol. Chloropyramini 20mg/ml - 1 ml',
    inputs: { age: 'Масса' },
    formula: ({ age }) => {
      const result1 = age * 0.1;
      const result2 = result1 /10;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["максимально 1 мл;(супрастин)"],
  },
  {
    name: 'Метоклопромид',
    description: ' Sol. Mеtoclopramidi 5mg/ml-2ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 0.1;
      const result2 = result1 /5;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["старше 2 лет, от 12 лет макс доза 2 мл"],
  },
  {
    name: 'Цефтриаксон',
    description: ' Ceftriaxoni 500 mg in flac.',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 50;
      const result2 = result1 /50;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["Суточная доза до 4 г, для в/в 1г цифтриаксона растовряют в 20 мл одного из инфуз. р-р (без содержания кальция) вводят с помощью перфузора в теч 30 минут (при минингите предварительно инфузионная терапия)"],
  },
  {
    name: 'Цитофлавин',
    description: ' Sol. "Cytoflavin" 10 ml',
    warnings: ["(Янтарная кислота) в/в кап 100-200 мл на S.NaCl 0.9% или S.Dextrosae 5-10% , При последствиях ОНМК; ЦВБ; диабетической полинейропатии и др."],
  },
  {
    name: 'Энап',
    description: ' Sol. "Enalaprilat" 1,25mg/ml - 1 ml',
    warnings: ["Вводят в дозе 1.25 мг каждые 6 ч в/в струйно медленно (в течение 5 мин) или капельно, Если через 1 ч после введения терапевтический эффект неудовлетворительный, то введение можно повторить в дозе 1.25 мг"],
  },
  {
    name: 'Эноксопарин',
    description: ' Sol. Enoxaparini natrii 10000 ME/ml 0,4 ml',
    warnings: ["(Клексан, Квадрапарин, Эноксопарин натрия, Эниксум), Старше 18 лет,Вводят в/в в разведение Nacl или подкожно ВВЕДЕНИЕ ВНУТРИМЫШЕЧНО ЗАПРЕЩЕНО!Запрещено смешивать с другими препаратами  (катетер перед введением промыть)"],
  },
  {
    name: 'Этамзилат',
    description: ' Sol. Etamsylati 125mg/ml – 2ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 12.5;
      const result2 = result1 /125;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["(Викасол, Дицинон,) Запрещено при тромбозах и тромбоэмболиях "],
  },
  {
    name: 'Эуфиллин',
    description: ' Sol. Euphyllini 24mg/ml– 10 ml',
    inputs: { mass: 'Масса' },
    formula: ({ mass }) => {
      const result1 = mass * 5;
      const result2 = result1 /24;
      
      return {
        result1: result1, // мг
        result2: result2, // мл
      };
    },
    warnings: ["(Аминофиллин) в/в в разведении Nacl . Запрещено при тахиаритмии , эпилепсия , гипотония , язвенная болезнь в стад.обострения, кровоизлияние в сетчатку глаза. Максимальная разовая доза 500 мг взрослому и 7 мг/кг ребенку"],
  },
];

export default formulas;