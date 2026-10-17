// ApgarScreen.js — шкала Апгар (ARCH_SPEC §9): секундомер от рождения с отметками,
// оценки на 1-й и 5-й минуте; при реанимации, продолжающейся после 5-й минуты, — на 10-й
// (МЗ РФ 2010, 2020); при < 7 баллов на 5-й — на 10-й, 15-й и 20-й минуте (AAP/ACOG 2015).
// Расчёты и правила — в apgarScore.js (источники — в комментарии модуля).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce, a11yLabel } from '../components/a11y';
import { Badge, Button, Card, ChoiceChips, Note, ResultCard, Section, SwitchRow } from '../components/ui';
import { useThemedStyles } from '../theme/index';
import {
  APGAR_SIGNS,
  apgarTotal,
  assessmentLine,
  completeTotal,
  elapsedMs,
  crossedMarks,
  emptyAssessment,
  formatClock,
  formatElapsed,
  formatPoints,
  interpretApgar,
  markState,
  minuteLabel,
  minuteLabelOn,
  minuteShort,
  needsRepeat,
  nextMark,
  pointsWord,
  resuscitationAfterFive,
  setSign,
  shortRecord,
  spokenElapsed,
  summaryText,
  visibleMinutes,
} from './apgarScore';

const TICK_MS = 1000;
const MINUTE_MS = 60000;

// В react-native-web Alert.alert ничего не делает: там — системные window.confirm/alert
const browserWindow = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window : null);

// Подтверждение действий, которые стирают данные (защита от случайного касания)
function confirmAction(title, message, actionLabel, onConfirm) {
  const w = browserWindow();
  if (w) {
    if (typeof w.confirm !== 'function' || w.confirm(message ? `${title}\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

// Сообщение после действия: диктору — всегда, на экране — Alert (на web — window.alert)
function notify(title, message) {
  announce(`${title}. ${message}`);
  const w = browserWindow();
  if (w) {
    if (typeof w.alert === 'function') w.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

// ---------- Секундомер от рождения ----------
// Тикает только этот компонент, чтобы раз в секунду не перерисовывать весь экран.
function BirthStopwatch({ birthAt, onStart, onShift, onReset, assessments, minutes, onMark }) {
  const styles = useThemedStyles(makeStyles);
  const [now, setNow] = useState(() => Date.now());
  const onMarkRef = useRef(onMark);
  const minutesRef = useRef(minutes);
  useEffect(() => {
    onMarkRef.current = onMark;
    minutesRef.current = minutes;
  });

  useEffect(() => {
    if (!Number.isFinite(birthAt)) return undefined;
    // Отметки до момента запуска/сдвига не объявляем — только пройденные дальше.
    // Время считается от метки рождения, поэтому после возврата из фона оно верное.
    let prev = elapsedMs(birthAt, Date.now());
    setNow(Date.now());
    const id = setInterval(() => {
      const t = Date.now();
      const ms = elapsedMs(birthAt, t);
      const crossed = crossedMarks(prev, ms, minutesRef.current);
      prev = ms;
      setNow(t);
      if (crossed.length && onMarkRef.current) onMarkRef.current(crossed[crossed.length - 1]);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [birthAt]);

  if (!Number.isFinite(birthAt)) {
    return (
      <Section
        title="Секундомер от рождения"
        description="Запустите в момент рождения: экран подскажет время оценок на 1-й, 5-й и при необходимости 10-й, 15-й, 20-й минуте. Если ребёнок родился до вашего прибытия — запустите и сдвиньте время рождения кнопками «−1 мин»."
      >
        <Button
          title="Ребёнок родился — запустить"
          icon="timer-outline"
          onPress={onStart}
          fullWidth
          accessibilityHint="Запускает секундомер от момента рождения"
          testID="apgar-start"
        />
      </Section>
    );
  }

  const ms = elapsedMs(birthAt, now);
  const next = nextMark(ms, minutes);

  return (
    <Section title="Секундомер от рождения">
      <Card>
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`От рождения прошло ${spokenElapsed(ms)}. Рождение в ${formatClock(birthAt)}`}
        >
          <Text variant="number" style={styles.clock}>
            {formatElapsed(ms)}
          </Text>
          <Text variant="caption" color="textSecondary">
            Рождение в {formatClock(birthAt)} · минуты:секунды жизни
          </Text>
        </View>
        {next ? (
          <Text variant="bodyStrong" style={styles.next}>
            Следующая оценка: {minuteLabel(next.minute)}, через {formatElapsed(next.remainingMs)}
          </Text>
        ) : null}
        <View style={styles.marks}>
          {minutes.map((m) => {
            const state = markState(m, ms, assessments[m]);
            const total = completeTotal(assessments[m]);
            const band = total === null ? null : interpretApgar(total);
            let level = 'neutral';
            let label = `в ${formatElapsed(m * MINUTE_MS)}`;
            if (state === 'done') {
              level = band ? band.level : 'neutral';
              label = `оценено: ${formatPoints(total)}`;
            } else if (state === 'due') {
              level = 'warning';
              label = 'пора оценить';
            }
            return (
              <View key={m} style={styles.markRow}>
                <Text variant="body" style={styles.markName}>
                  {minuteShort(m)}
                </Text>
                <Badge level={level} label={label} accessibilityLabel={`${minuteLabel(m)}: ${label}`} />
              </View>
            );
          })}
        </View>
        <View style={styles.buttonsRow}>
          <Button
            title="−1 мин"
            variant="secondary"
            onPress={() => onShift(-MINUTE_MS)}
            accessibilityLabel="Сдвинуть время рождения на 1 минуту раньше"
            style={styles.rowButton}
          />
          <Button
            title="+1 мин"
            variant="secondary"
            onPress={() => onShift(MINUTE_MS)}
            disabled={ms < MINUTE_MS}
            accessibilityLabel="Сдвинуть время рождения на 1 минуту позже"
            style={styles.rowButton}
          />
          <Button
            title="Сбросить"
            variant="ghost"
            onPress={onReset}
            accessibilityLabel="Сбросить секундомер"
            accessibilityHint="Попросит подтверждения; оценки сохранятся"
            style={styles.rowButton}
          />
        </View>
      </Card>
    </Section>
  );
}

// ---------- Экран ----------
export default function ApgarScreen() {
  const styles = useThemedStyles(makeStyles);
  const [assessments, setAssessments] = useState({});
  const [selectedMinute, setSelectedMinute] = useState(1);
  const [birthAt, setBirthAt] = useState(null);

  const minutes = useMemo(() => visibleMinutes(assessments), [assessments]);
  const minute = minutes.includes(selectedMinute) ? selectedMinute : minutes[0];
  const current = assessments[minute] || emptyAssessment();
  const progress = apgarTotal(current);
  const total = progress.complete ? progress.total : null;
  const band = total === null ? null : interpretApgar(total);
  const repeat = needsRepeat(assessments);
  const resusAfterFive = resuscitationAfterFive(assessments);
  const record = shortRecord(assessments);

  const updateSign = (key, value) => setAssessments((prev) => setSign(prev, minute, key, value));
  const toggleResuscitation = (value) =>
    setAssessments((prev) => setSign(prev, minute, 'duringResuscitation', value));

  // Отметка секундомера: переключиться на оценку этой минуты и подсказать диктором
  const onMark = useCallback(
    (m) => {
      if (!minutes.includes(m)) return;
      setSelectedMinute(m);
      announce(`Прошла ${minuteLabel(m)} — оцените по шкале Апгар`);
    },
    [minutes]
  );

  const startTimer = () => {
    setBirthAt(Date.now());
    announce('Секундомер запущен');
  };
  const shiftBirth = (deltaMs) => {
    setBirthAt((prev) => {
      if (!Number.isFinite(prev)) return prev;
      return Math.min(Date.now(), prev + deltaMs);
    });
  };
  const resetTimer = () =>
    confirmAction('Сбросить секундомер?', 'Оценки по Апгар сохранятся.', 'Сбросить', () => {
      setBirthAt(null);
      announce('Секундомер сброшен');
    });
  const clearCurrent = () =>
    confirmAction(`Очистить оценку: ${minuteLabel(minute)}?`, '', 'Очистить', () => {
      setAssessments((prev) => {
        const next = { ...prev };
        delete next[minute];
        return next;
      });
      announce(`Оценка ${minuteLabelOn(minute)} очищена`);
    });
  const resetAll = () =>
    confirmAction('Начать новую оценку?', 'Все оценки и секундомер будут очищены.', 'Очистить всё', () => {
      setAssessments({});
      setSelectedMinute(1);
      setBirthAt(null);
      announce('Данные очищены');
    });
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(summaryText(assessments, birthAt));
      notify('Скопировано', 'Оценка по Апгар скопирована в буфер обмена.');
    } catch {
      notify('Не удалось скопировать', 'Перепишите результат вручную.');
    }
  };

  const minuteOptions = minutes.map((m) => {
    const t = completeTotal(assessments[m]);
    return {
      value: m,
      label: t === null ? minuteShort(m) : `${minuteShort(m)} · ${t}`,
      accessibilityLabel: a11yLabel(minuteLabel(m), t === null ? 'не оценено' : formatPoints(t)),
    };
  });

  const missingLabels = APGAR_SIGNS.filter((s) => progress.missing.includes(s.key)).map((s) => s.label);

  let nextStep = null;
  if (total !== null) {
    if (minute === 1) nextStep = 'Следующая оценка — на 5-й минуте.';
    else if (minute === 5 && total < 7)
      nextStep = 'На 5-й минуте меньше 7 баллов: повторяйте оценку каждые 5 минут — на 10-й, 15-й и 20-й минуте.';
    else if (minute === 5 && resusAfterFive)
      nextStep = 'Реанимационные мероприятия продолжаются после 5-й минуты: оцените на 10-й минуте.';
    else if (minute === 5)
      nextStep =
        'На 5-й минуте 7 баллов и более: дополнительные оценки не обязательны. Если реанимационные мероприятия продолжаются, включите «На фоне реанимационных мероприятий» — понадобится оценка на 10-й минуте.';
    else if (minute < 20 && repeat) nextStep = `Следующая оценка — на ${minute + 5}-й минуте.`;
  }

  const lines = minutes.map((m) => assessmentLine(m, assessments[m])).filter(Boolean);

  return (
    <Screen scroll>
      <Note level="warning" title="Оценка по Апгар не используется для решения о начале реанимации">
        Реанимационные мероприятия начинают сразу — по дыханию, ЧСС и мышечному тонусу, не дожидаясь оценки
        на 1-й минуте. Шкала Апгар описывает состояние и ответ на помощь.
      </Note>

      <BirthStopwatch
        birthAt={birthAt}
        onStart={startTimer}
        onShift={shiftBirth}
        onReset={resetTimer}
        assessments={assessments}
        minutes={minutes}
        onMark={onMark}
      />

      <Section title="Оценка" description="Отметьте по одному варианту у каждого из пяти признаков.">
        <ChoiceChips
          label="Минута оценки"
          options={minuteOptions}
          value={minute}
          onChange={setSelectedMinute}
          testID="apgar-minute"
        />

        {APGAR_SIGNS.map((sign) => (
          <React.Fragment key={sign.key}>
            <ChoiceChips
              label={sign.fullLabel}
              options={sign.options.map((o) => ({
                value: o.score,
                label: `${o.score} — ${o.label}`,
                accessibilityLabel: `${o.label}, ${formatPoints(o.score)}`,
              }))}
              value={current[sign.key]}
              onChange={(v) => updateSign(sign.key, v)}
              testID={`apgar-sign-${sign.key}`}
            />
            {/* Методическое письмо Минздравсоцразвития России от 21.04.2010 № 15-4/10/2-3204:
                при оценке по Апгар на фоне ИВЛ учитывают только наличие спонтанных дыхательных
                усилий ребёнка — вдохи аппарата/мешка не считаются «хорошим» дыханием. */}
            {sign.key === 'respiration' && current.duringResuscitation ? (
              <Note level="info" title="Дыхание на фоне ИВЛ" style={styles.signNote}>
                Оценивайте только собственные дыхательные усилия ребёнка. Вдохи аппарата или мешка не
                учитываются: нет своих вдохов — 0 баллов.
              </Note>
            ) : null}
          </React.Fragment>
        ))}

        <SwitchRow
          label="На фоне реанимационных мероприятий"
          description={
            minute === 5
              ? 'ИВЛ, СЛР, кислород. Если помощь продолжается после 5-й минуты, нужна оценка на 10-й минуте. При ИВЛ дыхание оценивают только по собственным вдохам ребёнка'
              : 'ИВЛ, СЛР, кислород — для документации: оценка отражает состояние на фоне помощи. При ИВЛ дыхание оценивают только по собственным вдохам ребёнка'
          }
          value={!!current.duringResuscitation}
          onValueChange={toggleResuscitation}
          style={styles.switchRow}
          testID="apgar-resuscitation"
        />

        {total !== null ? (
          <ResultCard
            title={`Апгар ${minuteLabelOn(minute)}`}
            value={String(total)}
            unit={pointsWord(total)}
            level={band ? band.level : 'neutral'}
            levelLabel={band ? band.label : null}
            announceText={a11yLabel(
              `Апгар ${minuteLabelOn(minute)}: ${formatPoints(total)}`,
              band ? band.label : null,
              nextStep
            )}
            testID="apgar-result"
          >
            {nextStep ? <Text variant="body">{nextStep}</Text> : null}
          </ResultCard>
        ) : (
          <Card>
            <Text variant="bodyStrong">
              Отмечено {progress.filled} из 5 признаков
              {progress.filled > 0 ? ` · пока ${formatPoints(progress.total)}` : ''}
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.missing}>
              Не отмечены: {missingLabels.join(', ')}
            </Text>
          </Card>
        )}

        {progress.filled > 0 ? (
          <Button
            title="Очистить эту оценку"
            variant="ghost"
            onPress={clearCurrent}
            accessibilityLabel={`Очистить оценку: ${minuteLabel(minute)}`}
          />
        ) : null}
      </Section>

      <Section title="Итог">
        {lines.length ? (
          <View accessible accessibilityLabel={a11yLabel(lines, record ? `Итог ${record}` : null)}>
            {lines.map((line) => (
              <Text key={line} variant="body" style={styles.summaryLine}>
                {line}
              </Text>
            ))}
            {record ? (
              <Text variant="bodyStrong" style={styles.summaryLine}>
                Запись: {record}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text variant="body" color="textSecondary">
            Пока нет завершённых оценок.
          </Text>
        )}

        {repeat ? (
          <Note level="warning" title="На 5-й минуте меньше 7 баллов" style={styles.repeatNote}>
            Оценивайте каждые 5 минут до 20-й минуты: на 10-й, 15-й и 20-й. Продолжайте помощь по алгоритму
            реанимации новорождённого.
          </Note>
        ) : null}

        {!repeat && resusAfterFive ? (
          <Note
            level="warning"
            title="Реанимационные мероприятия продолжаются после 5-й минуты"
            style={styles.repeatNote}
          >
            Проведите третью оценку по Апгар на 10-й минуте после рождения.
          </Note>
        ) : null}

        <View style={styles.buttonsRow}>
          <Button
            title="Скопировать"
            icon="copy-outline"
            onPress={copy}
            disabled={!lines.length}
            accessibilityLabel="Скопировать оценку по Апгар"
            style={styles.rowButton}
          />
          <Button
            title="Новая оценка"
            variant="secondary"
            onPress={resetAll}
            accessibilityHint="Очищает все оценки и секундомер, попросит подтверждения"
            style={styles.rowButton}
          />
        </View>
      </Section>

      <Section title="Как оценивать">
        <Note level="info" title="Время оценки">
          На 1-й и 5-й минуте жизни. Если реанимационные мероприятия продолжаются после 5-й минуты — ещё
          на 10-й минуте (методические письма Минздрава России). Если на 5-й минуте меньше 7 баллов —
          каждые 5 минут до 20-й минуты (AAP/ACOG). Приложение учитывает оба правила.
        </Note>
        <Note level="info" title="Интерпретация">
          8–10 баллов — удовлетворительное состояние; 4–7 — умеренная асфиксия; 0–3 — тяжёлая асфиксия. По
          МКБ-10 (P21.0, P21.1) степень асфиксии относят к оценке на 1-й минуте. Низкая оценка — клиническая
          находка, а не диагноз: асфиксию не диагностируют по одной шкале Апгар.
        </Note>
        <Note level="info" title="Недоношенные дети">
          Мышечный тонус, рефлексы и окраска кожи зависят от срока гестации: оценка может быть ниже без
          асфиксии.
        </Note>
        <Text variant="caption" color="textSecondary" style={styles.sources}>
          Источники: методическое письмо Минздрава России «Реанимация и стабилизация состояния новорождённых
          детей в родильном зале» (2020); методическое письмо Минздравсоцразвития России «Первичная и
          реанимационная помощь новорождённым детям» (21.04.2010 № 15-4/10/2-3204); МКБ-10, рубрика P21; AAP/ACOG «The Apgar Score» (Pediatrics,
          2015).
        </Text>
      </Section>
    </Screen>
  );
}

const makeStyles = ({ spacing }) => ({
  clock: { marginBottom: spacing.xs },
  next: { marginTop: spacing.md },
  marks: { marginTop: spacing.md },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: spacing.xs,
  },
  markName: { minWidth: 72, marginRight: spacing.sm },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    marginHorizontal: -spacing.xs,
  },
  rowButton: { margin: spacing.xs, flexGrow: 1 },
  switchRow: { marginBottom: spacing.md },
  signNote: { marginBottom: spacing.md },
  missing: { marginTop: spacing.xs },
  summaryLine: { marginBottom: spacing.xs },
  repeatNote: { marginTop: spacing.md },
  sources: { marginTop: spacing.sm },
});
