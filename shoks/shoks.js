// shoks.js — экран «Шкала ШОКС» (оценка клинического состояния при ХСН, Мареев В.Ю., 2000).
// Пункты, подсчёт и интерпретация — в shoks/shoksScore.js (чистые функции, тесты в __tests__).
// Данные общего пациента шкала не использует; «Новый пациент» очищает ответы.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce } from '../components/a11y';
import { Button, Card, ChoiceChips, ResultCard } from '../components/ui';
import { usePatient } from '../patient/PatientContext';
import { useThemedStyles } from '../theme/index';
import {
  MAX_SCORE,
  QUESTIONS,
  computeShoks,
  emptyAnswers,
  ptsWord,
  shoksSummary,
} from './shoksScore';

// Варианты ChoiceChips для каждого пункта: балл виден в подписи и звучит для диктора
const CHOICES = Object.fromEntries(
  QUESTIONS.map((q) => [
    q.key,
    q.options.map((o) => ({
      value: o.id,
      label: `${o.label} (+${o.pts})`,
      accessibilityLabel: `${o.label}, ${o.pts} ${ptsWord(o.pts)}`,
    })),
  ]),
);

export default function SHOKSScreen() {
  const styles = useThemedStyles(makeStyles);
  const { resetCount } = usePatient();
  // По умолчанию ничего не выбрано: итог имеет смысл только после оценки всех 10 пунктов
  const [answers, setAnswers] = useState(emptyAnswers);

  // «Новый пациент» — очищаем ответы
  const lastReset = useRef(resetCount);
  useEffect(() => {
    if (resetCount === lastReset.current) return;
    lastReset.current = resetCount;
    setAnswers(emptyAnswers());
  }, [resetCount]);

  const result = useMemo(() => computeShoks(answers), [answers]);
  const { total, answered, count, complete, interpretation, missingTitles } = result;

  const pick = (key) => (id) => setAnswers((prev) => ({ ...prev, [key]: id }));

  const onReset = () => {
    setAnswers(emptyAnswers());
    announce('Ответы ШОКС сброшены');
  };

  return (
    <Screen scroll>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        Шкала ШОКС
      </Text>
      {/* официальное название — КР «ХСН» 2024, Прил. Г1 */}
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        Шкала оценки клинического состояния пациента с ХСН (Мареев В.Ю., 2000). Ответьте на все 10
        пунктов.
      </Text>

      {QUESTIONS.map((q, idx) => (
        <Card key={q.key} style={styles.question}>
          <ChoiceChips
            label={`${idx + 1}. ${q.title}`}
            options={CHOICES[q.key]}
            value={answers[q.key]}
            onChange={pick(q.key)}
            style={styles.chips}
            testID={`shoks-${q.key}`}
          />
        </Card>
      ))}

      <ResultCard
        title={complete ? 'Сумма баллов' : `Предварительно: отвечено ${answered} из ${count}`}
        value={answered > 0 ? String(total) : null}
        unit={answered > 0 ? ptsWord(total) : null}
        level={interpretation ? interpretation.badge : null}
        levelLabel={interpretation ? `${interpretation.cls} (${interpretation.band})` : null}
        announceText={shoksSummary(result)}
        testID="shoks-result"
      >
        {complete ? null : (
          <Text variant="body" color="textSecondary">
            {answered === 0
              ? 'Нет данных: выберите вариант в каждом пункте.'
              : `Класс не определяется, пока не оценены все пункты. Не заполнено: ${missingTitles.join('; ')}.`}
          </Text>
        )}
      </ResultCard>

      <Button
        title="Сбросить"
        variant="secondary"
        icon="refresh"
        onPress={onReset}
        testID="shoks-reset"
      />

      <Card style={styles.note}>
        <Text variant="heading" accessibilityRole="header">
          Критерии интерпретации
        </Text>
        <Text variant="body" color="textSecondary" style={styles.line}>
          0 — отсутствуют клинические признаки СН
        </Text>
        <Text variant="body" color="textSecondary" style={styles.line}>
          ≤ 3 — I ФК, 4–6 — II ФК, 7–9 — III ФК, &gt; 9 — IV ФК
        </Text>
        <Text variant="body" color="textSecondary" style={styles.line}>
          {`${MAX_SCORE} (максимум) — терминальная ХСН (IV ФК)`}
        </Text>
        {/* назначение шкалы — КР «ХСН» 2024, Прил. Г1 */}
        <Text variant="body" color="textSecondary" style={styles.line}>
          Только для пациентов с установленной ХСН: тяжесть и динамика лечения. Не для диагностики
          СН и не для оценки острой СН.
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.line}>
          Источник: КР МЗ РФ «Хроническая сердечная недостаточность», 2024, Приложение Г1.
        </Text>
      </Card>
    </Screen>
  );
}

const makeStyles = ({ spacing }) => ({
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  question: { paddingBottom: spacing.sm },
  chips: { marginBottom: 0 },
  note: { marginTop: spacing.xl },
  line: { marginTop: spacing.sm },
});
