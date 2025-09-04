// CalculateIntubationTube.js
// EMS-friendly ETT sizing with priority: Height (Broselow) → Weight (neonates) → Age.
// Includes depth suggestions and alternatives ±0.5 mm.
// DISCLAIMER: Clinical guidance only. Confirm placement clinically (EtCO2, auscultation, chest rise, CXR if indicated).

const roundToHalf = (x) => Math.round(x * 2) / 2;

const HEIGHT_TABLE = [
  // min (inclusive), max (exclusive), tube ID, approx weight (for info only)
  { min: 50,  max: 60,  id: 3.5, w: "3–5" },
  { min: 60,  max: 70,  id: 4.0, w: "6–8" },
  { min: 70,  max: 80,  id: 4.5, w: "9–10" },
  { min: 80,  max: 90,  id: 5.0, w: "11–15" },
  { min: 90,  max: 100, id: 5.5, w: "15–18" },
  { min: 100, max: 110, id: 6.0, w: "18–20" },
  { min: 110, max: 120, id: 6.5, w: "20–25" },
  { min: 120, max: 130, id: 7.0, w: "25–30" },
  { min: 130, max: 140, id: 7.5, w: "30–35" },
  { min: 140, max: 150, id: 8.0, w: "35–45" },
  // ≥150 см — подростки/взрослые: базово 8.0 мм, альтернативы ±0.5
];

/**
 * Calculate by height (Broselow-like). Returns null if height is out of plausible range (<40cm).
 * @param {number} heightCm
 * @param {"oral"|"nasal"|"both"} route
 * @returns object|null
 */
function calculateByHeight(heightCm, route = "both") {
  if (typeof heightCm !== "number" || !isFinite(heightCm) || heightCm < 40) {
    return null;
  }

  let id, zone, approxWeight;
  for (const row of HEIGHT_TABLE) {
    if (heightCm >= row.min && heightCm < row.max) {
      id = row.id;
      zone = `${row.min}-${row.max} см`;
      approxWeight = row.w;
      break;
    }
  }
  if (!id) {
    // For ≥150 см pick 8.0 mm default
    if (heightCm >= 150 && heightCm <= 210) {
      id = 8.0;
      zone = "≥150 см";
      approxWeight = "подросток";
    } else {
      return null; // out-of-range (too small/too large)
    }
  }

  const tubeID = roundToHalf(id);
  const altDown = roundToHalf(tubeID - 0.5);
  const altUp = roundToHalf(tubeID + 0.5);
  const oralDepth = roundToHalf(tubeID * 3);
  const nasalDepth = roundToHalf(oralDepth + 1);

  return {
    method: "height",
    inputs: { heightCm, route },
    broselowZone: zone,
    approxWeightKg: approxWeight,
    tubeIDmm: tubeID,
    alternativesMm: [altDown, altUp],
    depthOralCm: oralDepth,
    depthNasalCm: nasalDepth,
    recommendedDepthCm: route === "oral" ? oralDepth : (route === "nasal" ? nasalDepth : undefined),
    notes: [
      "Скорая помощь: приоритет расчёта по росту (Broselow).",
      "Глубина через рот ≈ 3 × ID (см); назальная на ~1 см глубже."
    ],
  };
}

/**
 * Neonatal/infant weight-based calculation (<1 year)
 */
function calculateForNeonate({ weightKg, route = "both" }) {
  if (typeof weightKg !== "number" || isNaN(weightKg) || weightKg <= 0) {
    throw new Error("weightKg (неонатальный режим) должен быть положительным числом.");
  }

  let tubeID;
  if (weightKg < 1) tubeID = 2.5;
  else if (weightKg < 2) tubeID = 3.0;
  else if (weightKg < 3) tubeID = 3.5;
  else if (weightKg < 4) tubeID = 3.5;
  else tubeID = 4.0;

  // Neonatal depth heuristic
  const oralDepth = roundToHalf(6 + weightKg);
  const nasalDepth = roundToHalf(oralDepth + 1);

  return {
    method: "weight",
    inputs: { weightKg, route },
    tubeIDmm: tubeID,
    alternativesMm: [roundToHalf(tubeID - 0.5), roundToHalf(tubeID + 0.5)],
    depthOralCm: oralDepth,
    depthNasalCm: nasalDepth,
    recommendedDepthCm: route === "oral" ? oralDepth : (route === "nasal" ? nasalDepth : undefined),
    notes: [
      "Младенцы <1 года: размер по весу.",
      "Оральная глубина ≈ 6 + вес(кг) см; назальная на ~1 см глубже."
    ],
  };
}

/**
 * Age-based calculation (≥1 year), cuffed vs uncuffed
 */
function calculateByAge({ ageYears, weightKg, cuffed = false, route = "both" }) {
  if (typeof ageYears !== "number" || isNaN(ageYears)) {
    throw new Error("ageYears должен быть числом для возрастного расчёта.");
  }
  const id = cuffed ? (ageYears / 4) + 3.5 : (ageYears / 4) + 4.0;
  const tubeID = Math.max(3.5, roundToHalf(id));
  const altDown = roundToHalf(tubeID - 0.5);
  const altUp = roundToHalf(tubeID + 0.5);
  const oralDepth = roundToHalf(tubeID * 3);
  const nasalDepth = roundToHalf(oralDepth + 1);

  return {
    method: "age",
    inputs: { ageYears, weightKg, cuffed, route },
    tubeIDmm: tubeID,
    alternativesMm: [altDown, altUp],
    depthOralCm: oralDepth,
    depthNasalCm: nasalDepth,
    recommendedDepthCm: route === "oral" ? oralDepth : (route === "nasal" ? nasalDepth : undefined),
    notes: [
      "Формула (с манжеткой): возраст/4 + 3.5 мм; без манжетки: возраст/4 + 4 мм.",
      "Глубина через рот ≈ 3 × ID (см); назальная на ~1 см глубже."
    ],
  };
}

/**
 * Main calculator (EMS priority)
 * @param {object|number} params
 * @param {number} [params.heightCm] - Height in centimeters. If provided & valid → used with highest priority.
 * @param {number} [params.ageYears]
 * @param {number} [params.ageMonths]
 * @param {number} [params.weightKg]
 * @param {boolean} [params.cuffed=false]
 * @param {"oral"|"nasal"|"both"} [params.route="both"]
 */
export const calculateIntubationTubeLogic = (params) => {
  // Backward compatibility: number → neonatal weight
  if (typeof params === "number") {
    return calculateForNeonate({ weightKg: params });
  }

  const {
    heightCm,
    ageYears: _ageYears,
    ageMonths,
    weightKg,
    cuffed = false,
    route = "both",
  } = params || {};

  let ageYears = _ageYears;
  if ((ageYears === undefined || ageYears === null) && typeof ageMonths === "number") {
    ageYears = ageMonths / 12;
  }

  // 1) HEIGHT first (EMS/Broselow)
  if (typeof heightCm === "number" && isFinite(heightCm)) {
    const viaHeight = calculateByHeight(heightCm, route);
    if (viaHeight) return viaHeight;
  }

  // 2) WEIGHT for neonates/infants (<1 year or small known weight)
  if ((typeof ageYears === "number" && ageYears < 1) || (typeof weightKg === "number" && weightKg <= 10)) {
    return calculateForNeonate({ weightKg, route });
  }

  // 3) AGE for ≥1 year
  if (typeof ageYears === "number" && isFinite(ageYears)) {
    return calculateByAge({ ageYears, weightKg, cuffed, route });
  }

  // If nothing suitable
  throw new Error("Укажите хотя бы рост (см), либо вес для неонатов, либо возраст для детей ≥ 1 года.");
};

export default calculateIntubationTubeLogic;