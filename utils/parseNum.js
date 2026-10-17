// Аккуратный парсер числа из поля ввода: поддерживает запятую и точку, но не обе сразу.
// Возвращает undefined для пустой строки и любого некорректного ввода ("abc", "1.2.3", "1,5.0").
// Разделитель на конце допустим: «70,» и «5.» — это 70 и 5 (поле не краснеет, пока дробь набирается).
const parseNum = (v) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  if (s.includes(',') && s.includes('.')) return undefined;
  const normalized = s.replace(',', '.');
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return undefined;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};

export default parseNum;
