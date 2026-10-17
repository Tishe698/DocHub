// NumberField — числовое поле: подпись, поле, единица, ошибка.
// Диктор читает «<подпись>, <единица>»; ошибка — accessibilityHint и видимый текст.
// Разбор числа — utils/parseNum (запятая и точка). Поле хранит строку — её держит экран
// (или usePatientNumber), чтобы «5,» не стиралось при наборе.
//
//   <NumberField label="Вес" unit="кг" value={text} onChangeText={setText}
//                onChangeNumber={(n) => …} error={err} badge="оценка" />
import React, { forwardRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput } from '../AppText';
import { a11yLabel, hideFromA11y } from '../a11y';
import Badge from './Badge';
import parseNum from '../../utils/parseNum';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../../theme/index';

const NumberField = forwardRef(function NumberField(
  {
    label,
    unit,
    value,
    onChangeText,
    onChangeNumber,
    error,
    hint,
    badge,
    badgeLevel = 'info',
    placeholder,
    editable = true,
    returnKeyType = 'done',
    onSubmitEditing,
    onFocus,
    onBlur,
    style,
    inputStyle,
    testID,
  },
  ref,
) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.inputBorderError
    : focused
      ? colors.inputBorderFocus
      : colors.inputBorder;

  const handleChange = (text) => {
    if (onChangeText) onChangeText(text);
    if (onChangeNumber) onChangeNumber(parseNum(text));
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.labelRow}>
        <Text variant="bodyStrong" style={styles.label} {...hideFromA11y}>
          {label}
        </Text>
        {badge ? <Badge level={badgeLevel} label={badge} style={styles.badge} /> : null}
      </View>
      <View
        style={[
          styles.field,
          { borderColor, borderWidth: focused || error ? 2 : 1 },
          !editable && styles.fieldDisabled,
        ]}
      >
        <TextInput
          ref={ref}
          value={value === null || value === undefined ? '' : String(value)}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          editable={editable}
          accessibilityLabel={a11yLabel(label, unit, badge)}
          accessibilityHint={error || hint}
          accessibilityState={{ disabled: !editable }}
          onFocus={(e) => {
            setFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
          style={[styles.input, inputStyle]}
          testID={testID}
        />
        {unit ? (
          <Text variant="body" color="textSecondary" style={styles.unit} {...hideFromA11y}>
            {unit}
          </Text>
        ) : null}
      </View>
      {error ? (
        <View style={styles.messageRow} {...hideFromA11y}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} style={styles.msgIcon} />
          <Text variant="caption" color="danger" style={styles.messageText}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" color="textSecondary" style={styles.hint} {...hideFromA11y}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export default NumberField;

const makeStyles = ({ colors, spacing, radius, typography }) => ({
  wrap: { marginBottom: spacing.md },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  label: { flexShrink: 1, marginRight: spacing.sm },
  badge: { marginVertical: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.md,
  },
  fieldDisabled: { backgroundColor: colors.surfaceAlt },
  input: {
    ...typography.body,
    flex: 1,
    // На web у <input> своя ширина по умолчанию: без minWidth поле в узкой колонке
    // не сжимается и выталкивает единицу за край экрана
    minWidth: 0,
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH - 4,
  },
  unit: { marginLeft: spacing.sm },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.xs },
  msgIcon: { marginRight: spacing.xs, marginTop: 1 },
  messageText: { flex: 1 },
  hint: { marginTop: spacing.xs },
});
