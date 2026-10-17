// WelcomeScreen.jsx — адаптировано под большие шрифты/иконки (доступность), без налезаний
import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, TextInput } from "../components/AppText";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, animation, borderRadius, shadows, typography } from "../theme";
import styles from "../css/calculate_preparation/WelcomeScreenStyles";
import modalStyles from "../css/calculate_preparation/calculates_css";
import formulas from "./formulas";
import parseNum from "../utils/parseNum";
// ✅ Правильный импорт Clipboard
import * as Clipboard from "expo-clipboard";

const { height: screenHeight } = Dimensions.get("window");

/** ======================= Движок расчёта: чистые функции (без React) ======================= **/

// Число в тексте подсказок — с запятой: 0.3 → «0,3»
const ru = (n) => String(n).replace(".", ",");

// Поле со свободным текстом (путь введения и т.п.), остальные — числовые
const getInputType = (inputName, inputLabel) => {
  const lowerName = (inputName || "").toLowerCase();
  const lowerLabel = (inputLabel || "").toLowerCase();
  if (
    lowerName.includes("route") ||
    lowerName.includes("маршрут") ||
    lowerName.includes("путь") ||
    lowerLabel.includes("route") ||
    lowerLabel.includes("маршрут") ||
    lowerLabel.includes("путь") ||
    lowerLabel.includes("введение") ||
    lowerLabel.includes("метод")
  ) {
    return "text";
  }
  return "numeric";
};

// Единица поля — из последних скобок подписи: «Вес (кг)» → «кг», «Возраст (мес)» → «мес»,
// «Скорость (мкг/кг/мин)» → «мкг/кг/мин». Подстроки («рост» в «скорость») больше не ищем.
const unitFromLabel = (label) => {
  const all = String(label || "").match(/\(([^()]+)\)/g);
  if (!all || !all.length) return null;
  return all[all.length - 1].slice(1, -1).trim() || null;
};

// Подпись поля без единицы: «Вес (кг)» → «Вес»
const labelBase = (label) => String(label || "").replace(/\s*\([^()]*\)\s*$/, "").trim();

// Пределы правдоподобия ввода — защита от опечаток, а не клинические границы.
// Вес 0,3–250 кг: от глубоко недоношенного новорождённого до морбидного ожирения;
// возраст 0–120 лет (0 — новорождённый, допустим). Скорость, масса препарата и объём — заведомо
// недостижимые на практике значения. Запись может сузить пределы полем inputLimits: { key: { min, max, warnMin, warnMax } }.
const FIELD_RULES = {
  weight: { min: 0.3, max: 250 },
  ageYears: { min: 0, max: 120, allowZero: true },
  ageMonths: { min: 0, max: 1440, allowZero: true },
  rate: { max: 50 },
  drugMg: { max: 2000 },
  volume: { max: 5000 },
};
// Те же правила по единице из скобок — для новых полей с другими ключами
const UNIT_RULES = {
  "кг": FIELD_RULES.weight,
  "лет": FIELD_RULES.ageYears,
  "мес": FIELD_RULES.ageMonths,
  "мкг/кг/мин": FIELD_RULES.rate,
  "мл": FIELD_RULES.volume,
};

const getFieldRule = (key, label, formula) => {
  const unit = unitFromLabel(label);
  const base = FIELD_RULES[key] || UNIT_RULES[unit] || {};
  const own = (formula && formula.inputLimits && formula.inputLimits[key]) || {};
  return { ...base, ...own, unit };
};

// Проверка одного поля: { value } или { error }, плюс необязательное мягкое предупреждение { warning }
const validateField = (key, label, raw, formula) => {
  const type = getInputType(key, label);
  if (type === "text") {
    const s = raw === undefined || raw === null ? "" : String(raw).trim();
    return s ? { value: s } : { error: `${label}: заполните поле` };
  }
  const n = parseNum(raw);
  const rule = getFieldRule(key, label, formula);
  const u = rule.unit ? ` ${rule.unit}` : "";
  if (n === undefined) return { error: `${label}: введите число` };
  if (n < 0) return { error: `${label}: не может быть отрицательным` };
  if (n === 0 && !rule.allowZero) return { error: `${label}: должно быть больше 0` };
  const rangeText =
    Number.isFinite(rule.min) && Number.isFinite(rule.max)
      ? `допустимо ${ru(rule.min)}–${ru(rule.max)}${u}`
      : Number.isFinite(rule.max)
        ? `допустимо не более ${ru(rule.max)}${u}`
        : `допустимо не менее ${ru(rule.min)}${u}`;
  if (Number.isFinite(rule.min) && n < rule.min) return { error: `${label}: ${rangeText} — проверьте ввод` };
  if (Number.isFinite(rule.max) && n > rule.max) return { error: `${label}: ${rangeText} — проверьте ввод` };
  let warning;
  if (Number.isFinite(rule.warnMax) && n > rule.warnMax)
    warning = `${labelBase(label)} ${ru(n)}${u} — выше обычного предела ${ru(rule.warnMax)}${u}. Проверьте ввод.`;
  else if (Number.isFinite(rule.warnMin) && n < rule.warnMin)
    warning = `${labelBase(label)} ${ru(n)}${u} — ниже обычного предела ${ru(rule.warnMin)}${u}. Проверьте ввод.`;
  return { value: n, warning };
};

// Ожидаемая масса по возрасту — APLS 2011 (единая формула для приложения):
// 0–12 мес: 0,5 × мес + 4; 1–5 лет: 2 × лет + 8; 6–12 лет: 3 × лет + 7. Старше 12 лет — не оцениваем.
const expectedWeightApls = (months) => {
  if (!Number.isFinite(months) || months < 0) return undefined;
  if (months < 12) return 0.5 * months + 4;
  const years = Math.floor(months / 12);
  if (years <= 5) return 2 * years + 8;
  if (years <= 12) return 3 * years + 7;
  return undefined;
};

// Возраст в месяцах из полей формулы (ageYears, ageMonths или оба: «полных лет + месяцев»)
const ageMonthsFromClean = (clean, inputsMap) => {
  const hasY = "ageYears" in inputsMap && Number.isFinite(clean.ageYears);
  const hasM = "ageMonths" in inputsMap && Number.isFinite(clean.ageMonths);
  if (hasY && hasM) return clean.ageYears * 12 + clean.ageMonths;
  if (hasY) return clean.ageYears * 12;
  if (hasM) return clean.ageMonths;
  return undefined;
};

// Мягкая проверка «вес ↔ возраст»: ловит ошибку в разряде (7 → 70 кг), которую диапазон 0,3–250 кг не видит.
// Порог ×2 / ×0,4 от массы по APLS — только предупреждение, расчёт не блокируется.
// Нижний порог — с 1 года: у недоношенных младенцев масса законно бывает вдвое ниже формулы.
const ageWeightWarning = (clean, inputsMap) => {
  if (!("weight" in inputsMap) || !Number.isFinite(clean.weight)) return null;
  const months = ageMonthsFromClean(clean, inputsMap);
  const exp = expectedWeightApls(months);
  if (!exp) return null;
  const ratio = clean.weight / exp;
  if (ratio <= 2 && (months < 12 || ratio >= 0.4)) return null;
  const ageText = months < 12 ? `${ru(Math.round(months * 10) / 10)} мес` : `${Math.floor(months / 12)} лет`;
  return `Вес ${ru(clean.weight)} кг необычен для возраста ${ageText} (ожидаемо около ${ru(Math.round(exp))} кг по APLS). Проверьте ввод — нет ли ошибки в разряде.`;
};

// Проверка всех полей записи: { ok, errors, clean, notes }
const validateAll = (formula, rawInputs) => {
  const errors = [];
  const clean = {};
  const notes = [];
  const map = formula.inputs || {};
  Object.keys(map).forEach((key) => {
    const label = map[key] || key;
    const r = validateField(key, label, rawInputs[key], formula);
    if (r.error) errors.push(r.error);
    else {
      clean[key] = r.value;
      if (r.warning) notes.push(r.warning);
    }
  });
  if (!errors.length) {
    const w = ageWeightWarning(clean, map);
    if (w) notes.push(w);
  }
  return { ok: errors.length === 0, errors, clean, notes };
};

// Формат числа: убрать хвостовые нули дробной части («12.50» → «12.5», «20.0» → «20»)
const trimZeros = (s) => (s.includes(".") ? s.replace(/\.?0+$/, "") : s);
// toFixed, который не превращает ненулевое значение в «0.00»: тогда 2 значащие цифры
const fixedNZ = (v, d) => {
  const s = v.toFixed(d);
  return Number(s) === 0 && v !== 0 ? String(Number(v.toPrecision(2))) : s;
};

const RATE_UNITS = ["мкг/мин", "мкг/ч", "мг/ч", "мл/ч", "МЕ/ч", "ЕД/ч", "мкг/мл", "мг/мл", "мкг/кг/мин", "мг/кг/ч"];

// Округление на экране (контракт движка):
// мг/мкг/ЕД/МЕ: < 10 — 2 знака; 10–100 — 1 знак (чтобы доза совпадала с объёмом: 12.5 мг ↔ 0.25 мл);
//   ≥ 100 — целые; мг < 0,1 — 3 знака (0.035 мг); мг < 0,01 — в мкг («5 мкг (0.005 мг)»).
// мл: < 0,01 — 2 значащие цифры (0.0025 мл); < 0,1 — 3 знака (0.015 мл); < 1 — 2 знака; иначе 1 знак.
// г и скорости: 2/1/0 знаков, меньше 0,1 — 2 значащие цифры.
// Ненулевое значение никогда не выводится как «0.00».
const fmtValue = (v, unit) => {
  if (unit === "таб") {
    const quarters = Math.round(v * 4 + Number.EPSILON) / 4;
    if (quarters === 0 && v > 0) return `${String(Number(v.toPrecision(2)))} ${unit} (меньше 1/4)`;
    return `${quarters} ${unit}`;
  }
  if (unit === "кап") {
    const r = Math.round(v);
    return r === 0 && v > 0 ? `меньше 1 ${unit}` : `${r} ${unit}`;
  }
  if (unit === "мл") {
    if (v < 0.01) return `${String(Number(v.toPrecision(2)))} ${unit}`;
    if (v < 0.1) return `${trimZeros(v.toFixed(3))} ${unit}`;
    return v < 1 ? `${v.toFixed(2)} ${unit}` : `${v.toFixed(1)} ${unit}`;
  }
  if (unit === "мг" && v > 0 && v < 0.01) {
    // Доза меньше 0,01 мг — в мкг, иначе на экране было бы «0.00 мг»
    return `${fmtValue(v * 1000, "мкг")} (${String(Number(v.toPrecision(2)))} мг)`;
  }
  if (unit === "мкг" || unit === "мг" || unit === "ЕД" || unit === "МЕ") {
    if (v < 0.1) return `${unit === "мг" ? trimZeros(fixedNZ(v, 3)) : String(Number(v.toPrecision(2)))} ${unit}`;
    if (v < 10) return `${v.toFixed(2)} ${unit}`;
    if (v < 100) return `${trimZeros(v.toFixed(1))} ${unit}`;
    return `${v.toFixed(0)} ${unit}`;
  }
  // Граммы и скорости инфузии: до сотых, на десятках — до десятых, чтобы не терять точность;
  // меньше 0,1 — 2 значащие цифры (0.005 мкг/мин, а не «0.01»)
  if (unit === "г" || RATE_UNITS.includes(unit)) {
    if (v < 0.1) return `${String(Number(v.toPrecision(2)))} ${unit}`;
    return v < 10 ? `${v.toFixed(2)} ${unit}` : v < 100 ? `${v.toFixed(1)} ${unit}` : `${v.toFixed(0)} ${unit}`;
  }
  // Прочие единицы: убираем «хвост» плавающей точки (0.30000000000000004 → 0.3), единицу не теряем
  const s = String(Number(v.toPrecision(4)));
  return unit ? `${s} ${unit}` : s;
};

// Ключи результатов по порядку номера: result1, result2, …, result10
const resultKeys = (raw) =>
  Object.keys(raw || {})
    .filter((k) => /^result\d+$/.test(k))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));

// Статус значения относительно limits: ok | high (выше макс.) | atmax (= предел) | low (ниже мин.)
const limitStatus = (val, lim) => {
  if (!lim) return "ok";
  if (Number.isFinite(lim.max)) {
    const eps = Math.max(1e-9, Math.abs(lim.max) * 1e-6);
    if (val > lim.max + eps) return "high";
    if (Math.abs(val - lim.max) <= eps) return "atmax";
  }
  if (Number.isFinite(lim.min)) {
    const eps = Math.max(1e-9, Math.abs(lim.min) * 1e-6);
    if (val < lim.min - eps) return "low";
  }
  return "ok";
};

// Сборка строк результата из ответа формулы
const buildItems = (raw, formula, clean) => {
  const units = formula.units || {};
  const labels = formula.labels || {};
  let limits = {};
  try {
    limits = (typeof formula.limits === "function" ? formula.limits(clean) : formula.limits) || {};
  } catch {
    limits = {};
  }
  const items = [];
  resultKeys(raw).forEach((key) => {
    const val = raw[key];
    if (typeof val === "number") {
      const unit = units[key];
      const name =
        labels[key] || (unit ? (unit === "мл" ? "Объём" : "Доза") : `Результат ${key.replace("result", "")}`);
      if (!Number.isFinite(val) || val <= 0) {
        // Нулевая/отрицательная/нечисловая доза — не результат: явно говорим, что не определена
        items.push({ key, name, unit, value: null, text: "—", status: "zero", badge: "не определена для введённых данных" });
        return;
      }
      const lim = limits[key] || {};
      const status = limitStatus(val, lim);
      const badge =
        status === "high"
          ? `↑ выше макс. ${fmtValue(lim.max, unit)}`
          : status === "atmax"
            ? `= предел ${fmtValue(lim.max, unit)}`
            : status === "low"
              ? `↓ ниже мин. ${fmtValue(lim.min, unit)}`
              : null;
      items.push({ key, name, unit, value: val, text: fmtValue(val, unit), status, badge });
    } else if (typeof val === "string" && val.trim()) {
      items.push({ key, name: labels[key] || "Примечание", unit: "", value: null, text: val.trim(), status: "info", badge: null });
    }
  });

  // Объём < 0,1 мл точно не набрать без разведения — напоминаем, если формула сама об этом не сказала
  // (ни в примечании, ни в подписи разведённого объёма). Меньше 0,05 мл не набрать даже шприцем 1 мл:
  // при делении 0,01 мл ошибка 20% и больше — только разведение.
  const smallest = items
    .filter((i) => i.unit === "мл" && i.value !== null && i.value < 0.1 && !/развед/i.test(i.name))
    .reduce((m, i) => Math.min(m, i.value), Infinity);
  const said = items.some(
    (i) => (i.status === "info" && /0[,.]1\s*мл|развед|развест/i.test(i.text)) || (i.unit === "мл" && /развед/i.test(i.name))
  );
  if (smallest < 0.1 && !said) {
    items.push({
      key: "engine-small-volume",
      name: "Малый объём",
      unit: "",
      value: null,
      text:
        smallest < 0.05
          ? "Объём меньше 0,05 мл точно не набрать: развести (например, 1:10 — 1 мл препарата + 9 мл 0,9% NaCl) и пересчитать объём на разведённый раствор."
          : "Объём меньше 0,1 мл: набирать шприцем 1 мл с делением 0,01 мл; точнее — развести и пересчитать объём на разведённый раствор.",
      status: "info",
      badge: null,
    });
  }
  return items;
};

// Введённые данные одной строкой: «Вес — 20 кг · Возраст — 5 лет»
const inputsSummary = (formula, clean) =>
  Object.keys(formula.inputs || {})
    .filter((k) => clean[k] !== undefined)
    .map((k) => {
      const label = formula.inputs[k] || k;
      const unit = unitFromLabel(label);
      return `${labelBase(label) || k} — ${ru(clean[k])}${unit ? ` ${unit}` : ""}`;
    })
    .join(" · ");

// Время расчёта «ЧЧ:ММ» — без зависимости от локали устройства
const nowText = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// Полный расчёт записи: результат для экрана (ошибка ввода | «расчёт не выполняется» | успех)
const computeResult = (formula, rawInputs) => {
  const { ok, errors, clean, notes } = validateAll(formula, rawInputs || {});
  if (!ok) {
    return { error: true, type: "validation", message: errors.join("\n") };
  }
  try {
    const raw = formula.formula(clean) || {};
    const items = buildItems(raw, formula, clean);
    const base = {
      formula: formula.name,
      description: formula.description || "",
      inputsText: inputsSummary(formula, clean),
      notes,
      warnings: formula.warnings || [],
      timestamp: nowText(),
    };
    // Формула вернула {} — расчёт для этих данных не предусмотрен: показываем предупреждения записи, а не «ошибку»
    if (!items.length) return { ...base, info: true, message: "Для введённых данных расчёт не выполняется. См. указания ниже." };
    return { ...base, success: true, items };
  } catch (error) {
    return {
      error: true,
      type: "calculation",
      message: `Ошибка при выполнении расчёта: ${error.message}.`,
    };
  }
};

// Справочная запись: нет полей ввода и формула ничего не возвращает
const isReferenceOnly = (formula) => {
  if (!formula) return false;
  if (typeof formula.formula !== "function") return true;
  if (Object.keys(formula.inputs || {}).length > 0) return false;
  try {
    return resultKeys(formula.formula({}) || {}).length === 0;
  } catch {
    return true;
  }
};

// Текст для копирования: препарат, форма выпуска, введённые данные, результат, предупреждения, время
const buildCopyText = (results) => {
  const lines = [`📝 ${results.formula}`];
  if (results.description) lines.push(`Форма выпуска: ${results.description}`);
  if (results.inputsText) lines.push(`Данные: ${results.inputsText}`);
  (results.notes || []).forEach((n) => lines.push(`⚠️ ${n}`));
  if (results.info) lines.push(results.message);
  (results.items || []).forEach((i) => lines.push(`${i.name}: ${i.text}${i.badge ? ` (${i.badge})` : ""}`));
  (results.warnings || []).forEach((w) => lines.push(`⚠️ ${w}`));
  lines.push(`Рассчитано: ${results.timestamp}. Расчёт справочный — сверьте с инструкцией к препарату.`);
  return lines.join("\n");
};

/** ------------------------------ Поиск ------------------------------ **/

// Нормализация: нижний регистр, ё → е
const norm = (s) => String(s || "").toLowerCase().replace(/ё/g, "е").trim();
const splitWords = (s) => norm(s).split(/[\s\-()/+,;:«»"'—–.]+/).filter(Boolean);

// Торговые и привычные в СМП РФ названия → начало МНН в названии записи.
// Запись может добавить свои синонимы полем synonyms: ['…'].
const SYNONYMS = [
  ["метамизол", ["анальгин", "баралгин"]],
  ["дифенгидрамин", ["димедрол"]],
  ["хлоропирамин", ["супрастин"]],
  ["диазепам", ["реланиум", "релиум", "сибазон", "седуксен", "валиум"]],
  ["мидазолам", ["дормикум", "фулсед"]],
  ["флумазенил", ["анексат"]],
  ["дротаверин", ["но-шпа", "ношпа"]],
  ["амиодарон", ["кордарон"]],
  ["верапамил", ["изоптин", "финоптин"]],
  ["магния сульфат", ["магнезия", "магний", "кормагнезин"]],
  ["норэпинефрин", ["норадреналин"]],
  ["эпинефрин", ["адреналин"]],
  ["допамин", ["дофамин"]],
  ["добутамин", ["добутрекс"]],
  ["метоклопрамид", ["церукал", "реглан"]],
  ["хлорпромазин", ["аминазин"]],
  ["кальция глюконат", ["кальций"]],
  ["калия хлорид + натрия ацетат", ["ацесоль", "калий"]],
  ["калия хлорид + кальция хлорид", ["рингер", "раствор рингера", "калий"]],
  ["натрия хлорид 0", ["физраствор", "физиологический раствор"]],
  ["глюкоза", ["декстроза"]],
  ["кеторолак", ["кеторол", "кетанов"]],
  ["трамадол", ["трамал"]],
  ["пропофол", ["диприван"]],
  ["кетамин", ["калипсол"]],
  ["суксаметони", ["дитилин", "листенон"]],
  ["пипекурони", ["ардуан"]],
  ["транексамов", ["транексам", "тхк"]],
  ["этамзилат", ["дицинон"]],
  ["ацетилцистеин", ["ацц", "флуимуцил"]],
  ["активированный уголь", ["уголь", "карболен"]],
  ["сальбутамол", ["вентолин"]],
  ["ипратропия бромид + фенотерол", ["беродуал"]],
  ["будесонид", ["пульмикорт"]],
  ["меглюмина натрия сукцинат", ["реамберин"]],
  ["вальпроев", ["депакин", "конвулекс"]],
  ["хлорамфеникол", ["левомицетин"]],
  ["цефтриаксон", ["роцефин"]],
  ["налоксон", ["наркан"]],
  ["эналаприлат", ["энап-р"]],
  ["нифедипин", ["коринфар", "кордафлекс"]],
  ["пропранолол", ["анаприлин", "обзидан"]],
  ["каптоприл", ["капотен"]],
  ["моксонидин", ["физиотенз"]],
  ["клонидин", ["клофелин"]],
  ["урапидил", ["эбрантил"]],
  ["эноксапарин", ["клексан"]],
  ["эсмолол", ["бревиблок"]],
  ["метопролол", ["беталок", "эгилок"]],
  ["клопидогрел", ["плавикс"]],
  ["изосорбида динитрат", ["изокет"]],
  ["инозин + никотинамид", ["цитофлавин"]],
  ["сульфацетамид", ["альбуцид"]],
  ["этилметилгидроксипиридина", ["мексидол"]],
  ["натрия гидрокарбонат", ["сода"]],
  ["гэк", ["волювен", "гидроксиэтилкрахмал"]],
  ["фильтрум", ["лигнин"]],
  ["пиридоксин", ["витамин в6", "витамин b6"]],
  ["тиамин", ["витамин в1", "витамин b1"]],
];

// МНН ищем по началу слова, а не подстрокой: «эпинефрин» не должен цеплять «норэпинефрин»
const synonymsOf = (formula) => {
  const name = ` ${splitWords(formula.name).join(" ")}`;
  const own = Array.isArray(formula.synonyms) ? formula.synonyms.map(norm) : [];
  const dict = SYNONYMS.filter(([mnn]) => name.includes(` ${splitWords(mnn).join(" ")}`)).flatMap(([, list]) => list.map(norm));
  return [...new Set([...own, ...dict])];
};

// Служебные токены запроса (дозы, единицы, проценты) в пословном сравнении не участвуют
const SERVICE_TOKENS = new Set(["мл", "мг", "мкг", "г", "ед", "ме", "р-р", "раствор", "амп", "ампула", "%"]);
const queryTokens = (term) => {
  const all = norm(term).split(/[\s,;]+/).filter(Boolean);
  const sig = all.filter((t) => t.length >= 2 && !SERVICE_TOKENS.has(t) && !/^[\d.,]+%?$/.test(t));
  return sig.length ? sig : all;
};

// Совпадение слова запроса со словом названия: начало слова; основа (без 2 последних букв) для падежей
// у слов от 6 букв («магний» → «магния»); слово запроса длиннее слова названия («адреналина»).
const wordHit = (token, words) =>
  words.some(
    (w) =>
      w.startsWith(token) ||
      (token.length >= 6 && w.startsWith(token.slice(0, -2))) ||
      (w.length >= 4 && token.startsWith(w))
  );

// Ранжирование: точное название → начало названия → начало слова названия → синоним →
// все слова запроса в названии/синонимах → подстрока названия → описание. При равенстве — порядок списка.
const scoreFormula = (formula, q, tokens) => {
  const name = norm(formula.name);
  const desc = norm(formula.description);
  const syns = synonymsOf(formula);
  const nameWords = splitWords(formula.name);
  const synWords = syns.flatMap(splitWords);
  if (name === q) return { score: 100 };
  if (name.startsWith(q)) return { score: 90 };
  if (nameWords.some((w) => w.startsWith(q))) return { score: 85 };
  const syn = syns.find((s) => s === q || s.startsWith(q));
  if (syn && q.length >= 2) return { score: 80, synonym: syn };
  if (tokens.every((t) => wordHit(t, nameWords) || wordHit(t, synWords))) {
    const viaSyn = !tokens.every((t) => wordHit(t, nameWords));
    return { score: 70, synonym: viaSyn ? syns.find((s) => tokens.some((t) => wordHit(t, splitWords(s)))) : undefined };
  }
  // Запрос из 1–2 букв — только по началу слов, иначе подстрока «ам»/«мл» находит полсписка
  if (q.length < 3) return { score: 0 };
  if (name.includes(q)) return { score: 60 };
  const descWords = splitWords(formula.description);
  if (tokens.every((t) => name.includes(t) || wordHit(t, nameWords) || wordHit(t, synWords) || wordHit(t, descWords)))
    return { score: 40 };
  if (desc.includes(q)) return { score: 30 };
  return { score: 0 };
};

// Поиск: [{ formula, synonym }] по убыванию релевантности
const searchFormulas = (list, term) => {
  const q = norm(term);
  if (!q) return list.map((formula) => ({ formula }));
  const tokens = queryTokens(term);
  return list
    .map((formula, index) => ({ formula, index, ...scoreFormula(formula, q, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ formula, synonym }) => ({ formula, synonym }));
};

// Слова для подсветки: вся фраза и каждое значимое слово запроса
const highlightTerms = (term) => {
  const q = norm(term);
  if (!q) return [];
  return [...new Set([q, ...queryTokens(term).filter((t) => t.length >= 2)])].sort((a, b) => b.length - a.length);
};

/** ===================== Настройки масштабирования шрифтов ===================== **/
const FONT_LIMIT = {
  h1: 1.25,   // большие заголовки
  h2: 1.2,    // подзаголовки/крупные кнопки
  body: 1.15, // обычный текст
  small: 1.1, // подписи/бейджи
  emoji: 1.0, // декоративные эмодзи не масштабируем
};

/** ============================== BottomSheet ============================== **/
const BottomSheet = ({ visible, onClose, children, isDark, selectedFormula, onBack }) => {
  const translateY = useSharedValue(screenHeight * 0.05);
  const backdropOpacity = useSharedValue(0);

  const showSheet = () => {
    // Выезд снизу в основное положение
    translateY.value = withTiming(screenHeight * 0.05, { duration: 300 }, () => {
      // Первый прыжок чуть вверх
      translateY.value = withTiming(screenHeight * 0.03, { duration: 150 }, () => {
        // Второй прыжок вниз и стоп
        translateY.value = withTiming(screenHeight * 0.05, { duration: 150 });
      });
    });
  
    // Фон затемняется параллельно
    backdropOpacity.value = withTiming(1, { duration: 300 });
  };

  const hideSheet = () => {
    translateY.value = withSpring(screenHeight, { damping: 15 });
    backdropOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => runOnJS(onClose)(), 300);
  };

  React.useEffect(() => {
    if (visible) showSheet();
    else hideSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1000,
        },
        backdropStyle,
      ]}
      pointerEvents="auto"
    >
      {/* Шторка с контентом */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: screenHeight * 0.95,
            backgroundColor: '#ffffff', // Белый фон для основного контейнера
            borderTopLeftRadius: borderRadius.xxl,
            borderTopRightRadius: borderRadius.xxl,
            ...shadows.lg,
          },
          sheetStyle,
        ]}
      >
        {/* Кнопка закрытия (угол) */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 80,
            height: 60,
            backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
            borderBottomLeftRadius: borderRadius.xl,
            borderWidth: 1,
            borderTopWidth: 0,
            borderRightWidth: 0,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            zIndex: 15,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={hideSheet}
            style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 8, paddingRight: 8 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Закрыть окно расчётов"
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
              }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h2}
            >
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        {/* Кнопка назад (угол) */}
        {selectedFormula && onBack && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 80,
              height: 60,
              backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
              borderBottomRightRadius: borderRadius.xl,
              borderWidth: 1,
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderColor: isDark ? colors.dark.border : colors.light.border,
              zIndex: 15,
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={onBack}
              style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 8, paddingLeft: 8 }}
              activeOpacity={0.7}
              accessibilityLabel="Вернуться к списку препаратов"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.h2}
              >
                ←
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Перетягиваемая полоска */}
        <TouchableOpacity
          onPress={hideSheet}
          style={{
            alignSelf: "center",
            width: 40,
            height: 4,
            backgroundColor: '#e5e7eb', // Серый цвет для разделителя
            borderRadius: 2,
            marginTop: spacing.sm,
            marginBottom: spacing.md,
          }}
          accessibilityRole="button"
          accessibilityLabel="Закрыть окно"
        />

        {children}
      </Animated.View>
    </Animated.View>
  );
};

/** ============================== Экран ============================== **/
const WelcomeScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [modalVisible, setModalVisible] = useState(false);
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState({});
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef(null);

  // Справочная запись (нет полей и формула ничего не возвращает) — кнопки «Рассчитать» нет
  const referenceOnly = isReferenceOnly(selectedFormula);
  const hasFormulaToCalculate = !!selectedFormula && typeof selectedFormula.formula === "function" && !referenceOnly;

  // Динамические цифры: всего записей и записей с расчётом (справочные не считаются)
  const totalDrugs = formulas.length;
  const totalCalcs = React.useMemo(() => formulas.filter((f) => !isReferenceOnly(f)).length, []);

  /** ============================== UI-хелперы ============================== **/
  const showModal = (formula) => {
    setSelectedFormula(formula ?? null);
    setModalVisible(true);
    setInputs({});
    setResults({});
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedFormula(null);
    setInputs({});
    setResults({});
    setSearchTerm("");
  };

  const highlightSearchTerm = (text, term) => {
    const terms = highlightTerms(term);
    if (!terms.length) return <Text allowFontScaling maxFontSizeMultiplier={FONT_LIMIT.body}>{text}</Text>;
    // Подсвечиваем и всю фразу, и каждое слово запроса
    const safe = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const re = new RegExp(`(${safe})`, "i");
    const parts = String(text).split(re);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <Text
          key={i}
          style={{
            backgroundColor: '#dbeafe', // Светло-синий фон для выделения
            fontWeight: "600",
            color: '#1e40af', // Темно-синий для выделенного текста
          }}
          allowFontScaling
          maxFontSizeMultiplier={FONT_LIMIT.body}
        >
          {part}
        </Text>
      ) : (
        <Text key={i} allowFontScaling maxFontSizeMultiplier={FONT_LIMIT.body}>
          {part}
        </Text>
      )
    );
  };

  // Любое изменение ввода делает прежний результат неактуальным — сбрасываем его,
  // чтобы на экране и в буфере не осталась доза для старого веса
  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
    setResults((prev) => (Object.keys(prev).length ? {} : prev));
  };

  /** ============================== Расчёт и копирование ============================== **/
  const copyResults = async () => {
    try {
      if (!results?.success && !results?.info) return;
      await Clipboard.setStringAsync(buildCopyText(results)); // ✅ корректный метод
      Alert.alert("Скопировано", "Результаты скопированы в буфер обмена");
    } catch {
      Alert.alert("Ошибка", "Не удалось скопировать результаты");
    }
  };

  const calculateResult = () => {
    if (!selectedFormula) return;
    setResults(computeResult(selectedFormula, inputs));
  };

  /** ============================== Поиск ============================== **/
  const filtered = React.useMemo(() => searchFormulas(formulas, searchTerm), [searchTerm]);

  /** ============================== Рендер ============================== **/
  return (
    <SafeAreaView style={[styles.container, isDark && styles.container_dark]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: spacing.xl * 2,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(animation.normal)}>
          <View style={{ alignItems: "center", marginBottom: spacing.md, paddingHorizontal: spacing.lg }}>
            <Text
              style={[styles.welcomeText, isDark && styles.welcomeText_dark, { fontSize: 24, color: 'rgb(31, 41, 55)' }]}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h1}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ color: 'rgb(31, 41, 55)' }}>🏥 </Text>
              Медицинские расчёты
            </Text>

            <Text
              style={[styles.subtitle, isDark && styles.subtitle_dark, { fontSize: 16, marginBottom: spacing.sm, color: 'rgb(31, 41, 55)' }]}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h2}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ color: 'rgb(31, 41, 55)' }}>💉 </Text>
              Профессиональный калькулятор дозировок
            </Text>
          </View>

          {/* Stats (резиновая сетка) */}
          <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.lg }}>
            <Animated.View entering={FadeInUp.delay(100).duration(animation.normal)}>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  rowGap: spacing.xs,
                  columnGap: spacing.xs,
                  marginBottom: spacing.lg,
                }}
              >
                {/* Карта 1 */}
                <View
                  style={{
                    backgroundColor: 'rgb(59, 130, 246)', // Синий фон для блока Препараты
                    borderRadius: borderRadius.lg,
                    padding: spacing.sm,
                    alignItems: "center",
                    flexBasis: "45%",
                    minWidth: 140,
                    minHeight: 80,
                    ...shadows.sm,
                    borderWidth: 1,
                    borderColor: '#d1d5db', // Серый цвет границ
                  }}
                >
                  <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 20, marginBottom: spacing.xs }}>
                    💊
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                      textAlign: "center",
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.small}
                    numberOfLines={1}
                  >
                    Препараты
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    numberOfLines={1}
                  >
                    {totalDrugs}
                  </Text>
                </View>

                {/* Карта 2 */}
                <View
                  style={{
                    backgroundColor: 'rgb(59, 130, 246)', // Синий фон для блока «С расчётом»
                    borderRadius: borderRadius.lg,
                    padding: spacing.sm,
                    alignItems: "center",
                    flexBasis: "45%",
                    minWidth: 140,
                    minHeight: 80,
                    ...shadows.sm,
                    borderWidth: 1,
                    borderColor: '#d1d5db', // Серый цвет границ
                  }}
                >
                  <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 20, marginBottom: spacing.xs }}>
                    🧮
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                      textAlign: "center",
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.small}
                    numberOfLines={1}
                  >
                    С расчётом дозы
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    numberOfLines={1}
                  >
                    {totalCalcs}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Главный CTA */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(animation.normal)}
          style={{
            marginBottom: spacing.xl,
            paddingHorizontal: spacing.lg,
            flexShrink: 0,
          }}
        >
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: isDark ? colors.dark.primary : colors.light.primary,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              alignItems: "center",
              marginBottom: spacing.lg,
              alignSelf: "stretch",
              minHeight: 112,
              flexShrink: 0,
              ...shadows.lg,
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Открыть медицинский калькулятор"
          >
            <Text
              style={{ color: colors.light.surface, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm, textAlign: "center" }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h2}
              numberOfLines={2}
              {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji}>💊 </Text>
              Медицинский калькулятор
            </Text>

            <Text
              style={{ color: colors.light.surface, fontSize: 16, opacity: 0.9, textAlign: "center", lineHeight: 22 }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.body}
              numberOfLines={3}
              {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
            >
              Расчёт дозировок препаратов и объёмов растворов для точного лечения
            </Text>
          </TouchableOpacity>

          {/* Быстрый доступ */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: spacing.xl }}>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                alignItems: "center",
                minWidth: 200,
                maxWidth: "90%",
                alignSelf: "center",
                marginHorizontal: spacing.sm,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
                flexShrink: 0,
              }}
              activeOpacity={0.7}
              accessibilityLabel="Открыть поиск препаратов"
              accessibilityRole="button"
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 24, marginBottom: spacing.sm }}>
                🔍
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: '#1f2937', // Темно-серый для текста кнопки поиска
                  textAlign: "center",
                  fontWeight: "600",
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.body}
                numberOfLines={1}
              >
                Поиск
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Safety */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(animation.normal)}
          style={{
            marginBottom: spacing.xl,
            paddingHorizontal: spacing.lg,
            flexShrink: 0,
          }}
        >
          <View
            style={{
              backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderWidth: 2,
              borderColor: isDark ? "#6B7280" : "#9CA3AF",
              borderLeftWidth: 6,
            }}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: '#d1d5db', // Серый цвет границы
              }}
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 32, marginBottom: spacing.sm }}>
                🛡️
              </Text>
              <Text
                style={{
                  ...typography.h5,
                  color: isDark ? "#374151" : "#6B7280",
                  fontWeight: "700",
                  textAlign: "center",
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.h2}
                numberOfLines={1}
                {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
              >
                Безопасность превыше всего
              </Text>
            </View>

            <Text
              style={{
                ...typography.body2,
                color: '#1f2937', // Темно-серый для текста безопасности
                lineHeight: 22,
                textAlign: "center",
                fontWeight: "500",
              }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.body}
            >
              Все расчеты носят рекомендательный характер.{"\n"}Консультируйтесь с лечащим врачом перед{"\n"}применением препаратов.
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: spacing.md,
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.dark.border : colors.light.border,
              }}
            >
              <Text
                style={{ ...typography.caption, color: isDark ? "#10B981" : "#059669", fontWeight: "600" }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.small}
                numberOfLines={1}
              >
                ⚕️ Медицинская ответственность
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* BottomSheet */}
      <BottomSheet
        visible={modalVisible}
        onClose={hideModal}
        isDark={isDark}
        selectedFormula={selectedFormula}
        onBack={() => {
          setSelectedFormula(null);
          setInputs({});
          setResults({});
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, paddingHorizontal: spacing.lg }}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.xl * 2, flexGrow: 1, minHeight: screenHeight * 0.85 }}
            scrollEventThrottle={16}
            bounces
            alwaysBounceVertical
            pointerEvents="auto"
            nestedScrollEnabled
          >
            {/* Header внутри модалки */}
            <View style={[modalStyles.modalHeader, { marginTop: spacing.xl }]}>
              {selectedFormula ? (
                <>
                  <Text
                    style={[modalStyles.modalTitle, isDark && modalStyles.modalTitle_dark, { fontSize: 24 }]}
                    numberOfLines={2}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                  >
                    <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji}>💊 </Text>
                    {selectedFormula.name}
                  </Text>
                  <Text
                    style={[modalStyles.modalSubtitle, isDark && modalStyles.modalSubtitle_dark]}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.body}
                    numberOfLines={2}
                  >
                    {referenceOnly
                      ? "📖 Справочная запись: расчёт не предусмотрен"
                      : Object.keys(selectedFormula.inputs || {}).length
                        ? "🩺 Введите необходимые значения"
                        : "🩺 Фиксированная доза: нажмите «Рассчитать»"}
                  </Text>
                  {/* Форма выпуска и концентрация, на которую считается объём — полностью, без обрезки */}
                  {!!selectedFormula.description && (
                    <View
                      style={{
                        marginTop: spacing.sm,
                        padding: spacing.sm,
                        borderRadius: borderRadius.md,
                        backgroundColor: '#eff6ff', // Светло-голубой фон для формы выпуска
                        borderWidth: 1,
                        borderColor: '#bfdbfe',
                        alignSelf: "stretch",
                      }}
                    >
                      <Text
                        style={{ fontSize: 14, color: '#1e3a8a', lineHeight: 20 }}
                        allowFontScaling
                        maxFontSizeMultiplier={FONT_LIMIT.body}
                        accessibilityLabel={`Форма выпуска: ${selectedFormula.description}`}
                      >
                        <Text style={{ fontWeight: "700" }}>💉 Форма выпуска: </Text>
                        {selectedFormula.description}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text
                    style={[modalStyles.modalTitle, isDark && modalStyles.modalTitle_dark, { fontSize: 24 }]}
                    numberOfLines={2}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                  >
                    <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji}>💊 </Text>
                    Калькулятор препаратов
                  </Text>
                  <Text
                    style={[modalStyles.modalSubtitle, isDark && modalStyles.modalSubtitle_dark]}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.body}
                    numberOfLines={2}
                  >
                    🔍 Поиск и расчет дозировок
                  </Text>
                </>
              )}
            </View>

            {/* Поиск */}
            {!selectedFormula && (
              <View style={modalStyles.searchContainer}>
                <TextInput
                  style={[modalStyles.searchInputWithIcon, isDark && modalStyles.searchInputWithIcon_dark]}
                  placeholder="🔍 Поиск препаратов (анальгин, адреналин...)"
                  placeholderTextColor={isDark ? colors.dark.text.tertiary : colors.light.text.tertiary}
                  onChangeText={setSearchTerm}
                  value={searchTerm}
                  accessibilityLabel="Поле поиска формул"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  allowFontScaling
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchTerm("")}
                    style={modalStyles.crossIcon}
                    accessibilityLabel="Очистить поиск"
                    accessibilityRole="button"
                  >
                    <Text style={modalStyles.crossImage} allowFontScaling maxFontSizeMultiplier={FONT_LIMIT.h2}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Список формул */}
            {!selectedFormula && (
              <View style={[modalStyles.listContainer, isDark && modalStyles.listContainer_dark]}>
                {filtered.length === 0 && searchTerm.trim() !== "" && (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xl }}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                        textAlign: "center",
                      }}
                      allowFontScaling
                      maxFontSizeMultiplier={FONT_LIMIT.body}
                    >
                      🔍 Препараты не найдены{"\n"}Попробуйте другой поисковый запрос
                    </Text>
                  </View>
                )}

                {searchTerm.trim() !== "" && (
                  <Animated.View
                    entering={FadeIn.duration(animation.fast)}
                    style={{
                      padding: spacing.sm,
                      backgroundColor: isDark ? colors.dark.surfaceVariant : colors.light.surfaceVariant,
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.md,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{ color: isDark ? colors.dark.text.secondary : colors.light.text.secondary, fontSize: 14 }}
                      allowFontScaling
                      maxFontSizeMultiplier={FONT_LIMIT.small}
                      numberOfLines={1}
                    >
                      🔍 Найдено: {filtered.length} из {formulas.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSearchTerm("")}
                      style={{
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      <Text
                        style={{
                          color: '#1f2937', // Темно-серый для основного текста на белом фоне
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                        allowFontScaling
                        maxFontSizeMultiplier={FONT_LIMIT.small}
                      >
                        ✕ Очистить
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {filtered.length > 0 &&
                  filtered.map(({ formula, synonym }, index) => (
                    <Animated.View key={formula.name} entering={FadeInUp.delay(index * 50).duration(animation.fast)}>
                      <TouchableOpacity
                        onPress={() => showModal(formula)}
                        style={[
                          modalStyles.formulaTouchable,
                          isDark && modalStyles.formulaTouchablePressed_dark,
                          {
                            backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                            borderWidth: 1,
                            borderColor: '#d1d5db', // Серый цвет границ
                            marginBottom: spacing.sm,
                            borderRadius: borderRadius.lg,
                            padding: spacing.md,
                          },
                        ]}
                        accessibilityLabel={`Выбрать препарат ${formula.name}`}
                        accessibilityRole="button"
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flex: 1, paddingRight: spacing.sm }}>
                            <Text
                              style={[modalStyles.formulaName, isDark && modalStyles.formulaName_dark]}
                              allowFontScaling
                              maxFontSizeMultiplier={FONT_LIMIT.h2}
                              numberOfLines={2}
                              {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                            >
                              {highlightSearchTerm(formula.name, searchTerm)}
                            </Text>
                            {!!formula.description && (
                              <Text
                                style={[modalStyles.formulaDescription, isDark && modalStyles.formulaDescription_dark]}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.body}
                                numberOfLines={2}
                              >
                                {highlightSearchTerm(formula.description, searchTerm)}
                              </Text>
                            )}
                            {/* Найдено по торговому/привычному названию — показываем, по какому */}
                            {!!synonym && (
                              <Text
                                style={{ marginTop: 2, fontSize: 12, color: '#1e40af', fontWeight: "600" }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.small}
                                numberOfLines={1}
                              >
                                🔁 Найдено по названию: {synonym}
                              </Text>
                            )}
                          </View>
                          {formula.warnings && formula.warnings.length > 0 && (
                            <Text
                              style={{ fontSize: 16, color: colors.light.warning }}
                              allowFontScaling={false}
                              maxFontSizeMultiplier={FONT_LIMIT.emoji}
                            >
                              ⚠️
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
              </View>
            )}

            {/* Контент формулы */}
            {selectedFormula && (
              <View style={modalStyles.modalInner}>
                <View style={modalStyles.inputContainer}>
                  {/* Предупреждения */}
                  {selectedFormula.warnings && selectedFormula.warnings.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      {selectedFormula.warnings.map((warning, index) => (
                        <Animated.Text
                          key={`warning-${index}`}
                          entering={FadeInUp.delay(index * 50).duration(animation.fast)}
                          style={[modalStyles.warningText, isDark && { color: colors.dark.danger }]}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.body}
                        >
                          ⚠️ Внимание: {warning}
                        </Animated.Text>
                      ))}
                    </View>
                  )}

                  {/* Поля ввода */}
                  {Object.keys(selectedFormula.inputs || {}).map((inputName, index) => {
                    const label = selectedFormula.inputs[inputName] || inputName;
                    const type = getInputType(inputName, label);
                    const raw = inputs[inputName];

                    const hasValue = type === "text" ? !!(raw && String(raw).trim() !== "") : raw !== undefined && String(raw) !== "";
                    // Та же проверка, что и перед расчётом: диапазон правдоподобия, 0 допустим для возраста
                    const check = hasValue ? validateField(inputName, label, raw, selectedFormula) : {};
                    const isValid = hasValue && !check.error;

                    // Единица — из скобок подписи: «(кг)», «(лет)», «(мес)», «(мкг/кг/мин)», «(мл)»
                    const unitHint = unitFromLabel(label);
                    // Подсказка для возраста в годах без отдельного поля месяцев
                    const ageHint =
                      unitHint === "лет" && !("ageMonths" in (selectedFormula.inputs || {}))
                        ? "Новорождённый — 0; до 1 года — дробью (6 мес = 0,5)"
                        : null;

                    return (
                      <Animated.View key={inputName} entering={FadeInUp.delay(index * 100).duration(animation.normal)} style={{ marginBottom: spacing.md }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: '#1f2937', // Темно-серый для основного текста на белом фоне
                            marginBottom: spacing.xs,
                          }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.small}
                          numberOfLines={2}
                        >
                          📝 {label}
                        </Text>

                        <View style={{ position: "relative" }}>
                          <TextInput
                            style={{
                              backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                              borderRadius: borderRadius.lg,
                              padding: spacing.md,
                              paddingRight: Math.max(spacing.xxxl, 24 + (unitHint ? unitHint.length * 8 : 0)),
                              fontSize: 16,
                              color: '#1f2937', // Темно-серый для основного текста на белом фоне
                              borderWidth: 2,
                              borderColor: hasValue
                                ? (isValid ? colors.light.success : colors.light.danger)
                                : (isDark ? colors.dark.border : colors.light.border),
                              ...shadows.sm,
                            }}
                            onChangeText={(text) => handleInputChange(inputName, text)}
                            value={raw !== undefined && raw !== null ? String(raw) : ""}
                            keyboardType={type === "numeric" ? "decimal-pad" : "default"}
                            placeholder={`Введите ${label.toLowerCase()}`}
                            placeholderTextColor={isDark ? colors.dark.text.tertiary : colors.light.text.tertiary}
                            accessibilityLabel={`Введите ${label}`}
                            autoCapitalize={type === "text" ? "none" : "sentences"}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.body}
                          />

                          {/* Подсказка единицы */}
                          {type === "numeric" && unitHint && (
                            <View
                              style={{
                                position: "absolute",
                                right: spacing.md,
                                top: "50%",
                                transform: [{ translateY: -10 }],
                                backgroundColor: isDark ? colors.dark.surfaceVariant : colors.light.surfaceVariant,
                                borderRadius: borderRadius.sm,
                                paddingHorizontal: spacing.xs,
                                paddingVertical: 2,
                              }}
                              pointerEvents="none"
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                                }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.small}
                              >
                                {unitHint}
                              </Text>
                            </View>
                          )}

                          {/* Индикатор валидности */}
                          {hasValue && (
                            <View
                              style={{
                                position: "absolute",
                                right: -8,
                                top: "50%",
                                transform: [{ translateY: -8 }],
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                                backgroundColor: isValid ? colors.light.success : colors.light.danger,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                              pointerEvents="none"
                            >
                              <Text style={{ fontSize: 10, color: "#FFFFFF", fontWeight: "bold" }} allowFontScaling={false}>
                                {isValid ? "✓" : "!"}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Ошибка или предупреждение по полю — сразу под ним */}
                        {hasValue && (check.error || check.warning) ? (
                          <Text
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              fontWeight: "600",
                              color: check.error ? colors.light.danger : '#B45309', // Красный — ошибка, янтарный — предупреждение
                            }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.small}
                          >
                            {check.error ? `⛔ ${check.error}` : `⚠️ ${check.warning}`}
                          </Text>
                        ) : ageHint ? (
                          <Text
                            style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.small}
                          >
                            {ageHint}
                          </Text>
                        ) : null}
                      </Animated.View>
                    );
                  })}

                  {/* Кнопки действий */}
                  {hasFormulaToCalculate && (
                    <Animated.View entering={FadeInUp.delay(300).duration(animation.normal)} style={{ marginTop: spacing.lg }}>
                      <TouchableOpacity
                        onPress={calculateResult}
                        style={{
                          backgroundColor: isDark ? colors.dark.primary : colors.light.primary,
                          borderRadius: borderRadius.xl,
                          padding: spacing.lg,
                          alignItems: "center",
                          marginBottom: spacing.md,
                          ...shadows.md,
                        }}
                        activeOpacity={0.8}
                        accessibilityLabel="Выполнить расчет"
                        accessibilityRole="button"
                      >
                        <Text
                          style={{ color: colors.light.surface, fontSize: 18, fontWeight: "700", textAlign: "center" }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.h2}
                          numberOfLines={1}
                        >
                          🧮 Рассчитать
                        </Text>
                        <Text
                          style={{ color: colors.light.surface, fontSize: 14, opacity: 0.9, marginTop: spacing.xs, textAlign: "center" }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.small}
                          numberOfLines={2}
                        >
                          Нажмите для получения результата
                        </Text>
                      </TouchableOpacity>

                      {(Object.keys(inputs).length > 0 || Object.keys(results).length > 0) && (
                        <TouchableOpacity
                          onPress={() => {
                            setInputs({});
                            setResults({});
                          }}
                          style={{
                            backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                            borderRadius: borderRadius.lg,
                            padding: spacing.md,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)",
                          }}
                          activeOpacity={0.7}
                          accessibilityLabel="Очистить все поля и результаты"
                          accessibilityRole="button"
                        >
                          <Text
                            style={{ color: isDark ? "#FCA5A5" : "#DC2626", fontSize: 16, fontWeight: "600", textAlign: "center" }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.body}
                            numberOfLines={1}
                          >
                            🗑️ Очистить всё
                          </Text>
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                  )}
                </View>

                {/* Результаты */}
                {Object.keys(results).length > 0 && (
                  <View style={{ marginTop: spacing.lg }}>
                    {/* Ошибки */}
                    {results.error && (
                      <Animated.View
                        entering={FadeInUp.duration(animation.fast)}
                        style={{
                          backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                          borderRadius: borderRadius.lg,
                          padding: spacing.lg,
                          borderWidth: 1,
                          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)",
                          marginBottom: spacing.md,
                        }}
                      >
                        <Text
                          style={{ fontSize: 16, fontWeight: "600", color: isDark ? "#FCA5A5" : "#DC2626", textAlign: "center", marginBottom: spacing.xs }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.h2}
                          numberOfLines={1}
                        >
                          ⚠️ {results.type === "validation" ? "Проверьте введённые данные" : "Ошибка расчёта"}
                        </Text>
                        <Text
                          style={{ fontSize: 14, color: isDark ? "#FCA5A5" : "#DC2626", textAlign: "center", lineHeight: 20 }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.body}
                        >
                          {results.message}
                        </Text>
                      </Animated.View>
                    )}

                    {/* Успех или «расчёт не выполняется» */}
                    {(results.success || results.info) && (
                      <Animated.View
                        entering={FadeInUp.duration(animation.normal)}
                        style={[modalStyles.resultsContainer, isDark && modalStyles.resultsContainer_dark]}
                      >
                        {/* Header */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
                          <Text
                            style={{ flexShrink: 1, fontSize: 18, fontWeight: "700", color: isDark ? colors.dark.primary : colors.light.primary }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.h2}
                            numberOfLines={1}
                          >
                            {results.info ? "ℹ️ Расчёт не выполняется" : "🧮 Результат расчёта"}
                          </Text>

                          <View style={{ flexDirection: "row" }}>
                            <TouchableOpacity
                              onPress={copyResults}
                              style={{
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.xs,
                                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                borderRadius: borderRadius.md,
                                marginRight: spacing.xs,
                              }}
                              accessibilityRole="button"
                              accessibilityLabel="Копировать результат"
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                                  fontWeight: "500",
                                }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.small}
                                numberOfLines={1}
                              >
                                📋 Копировать
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setResults({})}
                              style={{
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.xs,
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                borderRadius: borderRadius.md,
                              }}
                              accessibilityRole="button"
                              accessibilityLabel="Сбросить результат"
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                                  fontWeight: "500",
                                }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.small}
                                numberOfLines={1}
                              >
                                ✕ Сбросить
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Инфо о расчёте: препарат, форма выпуска, введённые данные, время */}
                        <Text
                          style={{
                            fontSize: 14,
                            color: '#475569', // Темно-серый для хорошей видимости на белом фоне
                            marginBottom: spacing.xs,
                            fontStyle: "italic",
                          }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.small}
                        >
                          📝 {results.formula}
                          {results.description ? `\n💉 ${results.description}` : ""}
                        </Text>
                        {!!results.inputsText && (
                          <Text
                            style={{ fontSize: 14, fontWeight: "600", color: '#1f2937', marginBottom: spacing.xs }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.small}
                          >
                            📥 Рассчитано для: {results.inputsText}
                          </Text>
                        )}
                        <Text
                          style={{ fontSize: 12, color: '#64748b', marginBottom: spacing.md }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.small}
                          numberOfLines={1}
                        >
                          🕒 {results.timestamp}
                        </Text>

                        {/* Мягкие предупреждения по вводу (вес не по возрасту и т.п.) */}
                        {(results.notes || []).map((note, index) => (
                          <Text
                            key={`note-${index}`}
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: '#B45309', // Янтарный — предупреждение
                              backgroundColor: 'rgba(245, 158, 11, 0.08)',
                              borderRadius: borderRadius.md,
                              padding: spacing.sm,
                              marginBottom: spacing.sm,
                            }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.body}
                          >
                            ⚠️ {note}
                          </Text>
                        ))}

                        {/* Формула вернула {} — показываем указания записи вместо «ошибки» */}
                        {results.info && (
                          <View style={{ marginBottom: spacing.sm }}>
                            <Text
                              style={{ fontSize: 15, fontWeight: "600", color: '#1f2937', marginBottom: spacing.xs }}
                              allowFontScaling
                              maxFontSizeMultiplier={FONT_LIMIT.body}
                            >
                              {results.message}
                            </Text>
                            {(results.warnings || []).map((w, index) => (
                              <Text
                                key={`info-w-${index}`}
                                style={{ fontSize: 14, color: '#1f2937', lineHeight: 20, marginBottom: 4 }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.body}
                              >
                                • {w}
                              </Text>
                            ))}
                          </View>
                        )}

                        {/* Строки результатов */}
                        {(results.items || []).map((row, index) => {
                          const alert = row.status === "high" || row.status === "zero";
                          const amber = row.status === "low" || row.status === "atmax";
                          const border = alert
                            ? (isDark ? "#F87171" : "#DC2626")
                            : amber
                            ? (isDark ? "#FBBF24" : "#D97706")
                            : (isDark ? colors.dark.border : colors.light.border);

                          const valueColor = alert
                            ? (isDark ? "#F87171" : "#DC2626")
                            : amber
                            ? (isDark ? "#FBBF24" : "#D97706")
                            : (isDark ? colors.dark.primary : colors.light.primary);

                          const isNote = row.status === "info";

                          return (
                            <Animated.View
                              key={`${row.key || row.name}-${index}`}
                              entering={FadeInUp.delay(index * 80).duration(animation.fast)}
                              style={{
                                flexDirection: isNote ? "column" : "row",
                                alignItems: isNote ? "stretch" : "center",
                                justifyContent: "space-between",
                                backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                                borderRadius: borderRadius.lg,
                                padding: spacing.md,
                                marginBottom: spacing.sm,
                                borderWidth: 1,
                                borderColor: border,
                                ...shadows.sm,
                              }}
                            >
                              <View style={isNote ? { marginBottom: 4 } : { flex: 1, paddingRight: spacing.sm }}>
                                <Text
                                  style={{ fontSize: isNote ? 14 : 16, fontWeight: "600", color: isDark ? colors.dark.text.primary : colors.light.text.primary }}
                                  allowFontScaling
                                  maxFontSizeMultiplier={FONT_LIMIT.body}
                                >
                                  {row.name}
                                </Text>
                                {!!row.badge && (
                                  <Text
                                    style={{ marginTop: 4, fontSize: 12, fontWeight: "600", color: valueColor }}
                                    allowFontScaling
                                    maxFontSizeMultiplier={FONT_LIMIT.small}
                                  >
                                    {row.badge}
                                  </Text>
                                )}
                              </View>
                              {/* Примечание — обычным текстом во всю ширину, без сжатия в одну строку */}
                              {isNote ? (
                                <Text
                                  style={{ fontSize: 14, lineHeight: 20, color: '#1f2937' }}
                                  allowFontScaling
                                  maxFontSizeMultiplier={FONT_LIMIT.body}
                                >
                                  {row.text}
                                </Text>
                              ) : (
                                <Text
                                  style={{ flexShrink: 0, maxWidth: "55%", fontSize: 18, fontWeight: "700", color: valueColor, textAlign: "right" }}
                                  allowFontScaling
                                  maxFontSizeMultiplier={FONT_LIMIT.h2}
                                >
                                  {row.text}
                                </Text>
                              )}
                            </Animated.View>
                          );
                        })}
                      </Animated.View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Отступ */}
            <View style={{ height: spacing.xl }} />

            {/* Футер */}
            <View style={{ height: 200, justifyContent: "center", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6b7280', // Серый для мелкого текста на белом фоне
                  textAlign: "center",
                  paddingHorizontal: spacing.lg,
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.small}
              >
                📱 Для дополнительной информации обратитесь к лечащему врачу
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
