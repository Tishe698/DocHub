// calculateShockIndex.js
// Shock Index (Allgöwer) for EMS use: SI = HR / SBP
// Adds pediatric SIPA thresholds, pregnancy note, and trauma flags.
// NOTE: Clinical decision support only — always correlate clinically.

export function calcSI(hr, sbp) {
    if (typeof hr !== 'number' || !isFinite(hr) || hr <= 0) throw new Error('Недопустимый пульс.');
    if (typeof sbp !== 'number' || !isFinite(sbp) || sbp <= 0) throw new Error('Недопустимое САД.');
    const si = hr / sbp;
    return Math.round(si * 100) / 100;
  }
  
  /**
   * Get classic adult categorization
   * Returns {label, color, level} where level 0..4
   */
  function adultCategory(si) {
    if (si < 0.5) return { label: 'ниже нормы (перепроверьте данные)', color: '#6B7280', level: 0 };
    if (si < 0.7) return { label: 'норма', color: '#10B981', level: 1 };
    if (si < 0.9) return { label: 'пограничный', color: '#F59E0B', level: 2 };
    if (si < 1.3) return { label: 'высокий риск шока', color: '#EF4444', level: 3 };
    return { label: 'тяжёлый, вероятен шок', color: '#B91C1C', level: 4 };
  }
  
  /**
   * Pediatric SIPA cutoff by age (years)
   * Classic SIPA thresholds:
   * 1–3: 1.2, 4–6: 1.2, 7–12: 1.0, 13–16: 0.9
   * If age <1 → SIPA не применяется.
   */
  function sipaCutoff(ageYears) {
    if (typeof ageYears !== 'number' || !isFinite(ageYears) || ageYears < 1) return null;
    if (ageYears < 4) return 1.2;
    if (ageYears < 7) return 1.2;
    if (ageYears < 13) return 1.0;
    if (ageYears <= 16) return 0.9;
    return null;
  }
  
  /**
   * Main calculator
   * @param {object} params
   * @param {number} params.sbp - systolic blood pressure (mmHg)
   * @param {number} params.hr - heart rate (bpm)
   * @param {number} [params.ageYears]
   * @param {boolean} [params.pregnant=false]
   * @param {boolean} [params.trauma=false]
   */
  const calculateShockIndex = (params) => {
    const { sbp, hr, ageYears, pregnant = false, trauma = false } = params || {};
    const si = calcSI(hr, sbp);
  
    // Pediatric mode (SIPA)
    const cutoff = sipaCutoff(ageYears);
    let category, interpretation, sipaState = null;
  
    if (cutoff) {
      const ok = si <= cutoff;
      sipaState = { cutoff };
      category = ok
        ? { label: 'SIPA в норме', color: '#10B981', level: 1 }
        : { label: 'SIPA повышен', color: '#EF4444', level: 3 };
      interpretation = ok
        ? `Для возраста ~${ageYears} лет нормой считается SI ≤ ${cutoff}.`
        : `Для возраста ~${ageYears} лет SI > ${cutoff} — подозрение на гиповолемию/шок.`;
    } else {
      // Adult (or no pediatric cutoff)
      category = adultCategory(si);
      interpretation = 'Нормальные значения у взрослых: ~0.5–0.7; рост индекса указывает на ухудшение гемодинамики.';
    }
  
    // Pregnancy note
    let pregnancyFlag = false, pregnancyNote = null;
    if (pregnant) {
      // Физиологически SI у беременных выше; SI ≥1 требует повышенного внимания.
      pregnancyFlag = si >= 1.0;
      pregnancyNote = pregnancyFlag
        ? 'Беременность: SI ≥ 1 — тревожный признак (оцените кровопотерю/PPH, сопр.)'
        : 'Беременность: умеренно повышенный SI возможен физиологически; наблюдение.';
    }
  
    // Trauma flag
    let traumaFlag = false;
    if (trauma) {
      traumaFlag = si >= 0.9; // часто используют ≥0.9 как маркер риска
    }
  
    // Heuristic blood loss band (very rough, informational only)
    let bloodLoss = null;
    if (si < 0.7) bloodLoss = 'вероятно минимальная';
    else if (si < 0.9) bloodLoss = 'возможна лёгкая';
    else if (si < 1.3) bloodLoss = 'вероятна умеренная';
    else bloodLoss = 'возможна массивная';
  
    return {
      si,
      category,
      interpretation,
      pediatric: sipaState,
      flags: {
        pregnancyConcern: pregnant && pregnancyFlag,
        traumaHighRisk: trauma && traumaFlag,
      },
      bloodLossHint: bloodLoss,
      thresholds: {
        adult: { normalLow: 0.5, normalHigh: 0.7, elevated: 0.9, severe: 1.3 },
        sipa: sipaState ? sipaState.cutoff : null,
        pregnancyActionSI: 1.0,
        traumaActionSI: 0.9,
      },
      notes: [
        'Шоковый индекс Альговера: SI = Пульс / САД (мм рт. ст.).',
        'Педиатрия: используйте SIPA (возраст-скорректированные пороги).',
        'Беременность: SI физиологически выше; SI ≥ 1 требует пристального внимания.',
        'Травма: SI ≥ 0.9 ассоциирован с необходимостью раннего вмешательства.',
      ],
    };
  };
  
  export default calculateShockIndex;