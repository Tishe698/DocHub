// a11y.js — помощники доступности (TalkBack / VoiceOver).
import { AccessibilityInfo } from 'react-native';

// Озвучить текст экранным диктором (результат расчёта, сброс формы и т. п.).
// Пустой текст игнорируется; ошибки платформы не роняют экран.
export function announce(text) {
  if (text === null || text === undefined) return;
  const s = String(text).trim();
  if (!s) return;
  try {
    AccessibilityInfo.announceForAccessibility(s);
  } catch {
    // диктор недоступен — ничего не делаем
  }
}

// Пропсы для декоративных элементов (иконки, эмодзи, разделители): диктор их пропускает.
// Использование: <Ionicons name="..." {...hideFromA11y} />
export const hideFromA11y = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
};

// Удаляет эмодзи и пиктограммы из строки — для accessibilityLabel заголовков вида «💉 Норадреналин».
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

export function stripEmoji(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(EMOJI_RE, '').replace(/\s+/g, ' ').trim();
}

// Склеивает части подписи, пропуская пустые: a11yLabel('Вес', '20', 'кг') → 'Вес, 20, кг'
export function a11yLabel(...parts) {
  return parts
    .flat()
    .filter((p) => p !== null && p !== undefined && String(p).trim() !== '')
    .map((p) => String(p).trim())
    .join(', ');
}
