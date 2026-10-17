// Токсикология и противосудорожные
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    // --- ТОКСИКОЛОГИЯ И ПРОТИВОСУДОРОЖНЫЕ ---
  
    {
      name: 'Активированный уголь',
      description: 'Порошок/суспензия (разовая доза)',
      inputs: { weight: 'Вес (кг)' }, // 1 г/кг, практич. максимум 50 г у детей
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const g = Math.min(w * 1, 50);
        const mg = g * 1000;
        return { result1: mg, result2: g };
        },
        units: { result1: 'мг', result2: 'г' },
      labels: { result1: 'Доза (мг)', result2: 'Доза (г)' },
      warnings: ['Обычно 1 г/кг однократно; оценить риск аспирации и показания.'],
      },
  
    {
        name: 'Ацетилцистеин',
      description: 'Раствор 100 мг/мл — 3 мл (в/в нагрузка при отравлении парацетамолом)',
      inputs: { weight: 'Вес (кг)' }, // нагрузка 150 мг/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
          const mg = w * 150;
          return { result1: mg, result2: mg / 100 };
        },
        units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (нагрузка)', result2: 'Объём' },
      warnings: ['Дальнейшие этапы инфузии — по локальному протоколу.'],
      },
  
    {
        name: 'Диазепам',
      description: 'Раствор 5 мг/мл — 2 мл (IV при судорогах)',
      inputs: { weight: 'Вес (кг)' }, // 0.2 мг/кг, макс 10 мг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 0.2, 10);
        const ml = mg / 5;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['IV 0.2 мг/кг, макс 10 мг; вводить медленно, возможен повтор через 5–10 мин.'],
      },
  
    {
        name: 'Мидазолам',
      description: 'Раствор 5 мг/мл — 1 мл (IV при судорогах)',
      inputs: { weight: 'Вес (кг)' }, // IV 0.1 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 5;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (IV)', result2: 'Объём' },
      warnings: ['Судороги: IV 0.1 мг/кг; IN 0.2 мг/кг; титровать по эффекту.'],
      },
  
    {
        name: 'Флумазенил',
        description: 'Раствор 0.1 мг/мл — 5 мл',
        inputs: { weight: 'Вес (кг)' }, // 0.01 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.01;
          return { result1: mg, result2: mg / 0.1 };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 года. Антагонист бензодиазепинов; риск судорог при ТЦА.'],
    },
  
];

export default group;
