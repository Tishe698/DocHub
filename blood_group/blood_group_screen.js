// blood_group_screen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

const Option = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.opt, active && styles.optActive]}
    activeOpacity={0.8}
  >
    <Text style={[styles.optText, active && styles.optTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// Двухпозиционный выбор: − / +
const ReactionPicker = ({ title, value, onChange, hint }) => {
  // value: null | 0 | 1
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.row}>
        <Option
          label="−"
          active={value === 0}
          onPress={() => onChange(0)}
        />
        <Option
          label="+"
          active={value === 1}
          onPress={() => onChange(1)}
        />
      </View>

      {/* Визуализация лунки */}
      <View style={styles.wellRow}>
        <Well label={title.includes('Anti-A') ? "Anti-A" : "Anti-B"} active={value === 1} />
      </View>
    </View>
  );
};

// «Лунка» — кружок: пустой / с агглютинацией
const Well = ({ label, active }) => {
  return (
    <View style={styles.well}>
      <View style={[styles.wellCircle, active && styles.wellCircleActive]}>
        {active ? <Text style={styles.dots}>····</Text> : null}
      </View>
      <Text style={styles.wellLabel}>{label}</Text>
    </View>
  );
};

export default function BloodGroupScreen() {
  const [antiA, setAntiA] = useState(null); // null | 0 | 1
  const [antiB, setAntiB] = useState(null);

  const { abo, note, ready } = useMemo(() => {
    const aSet = antiA !== null;
    const bSet = antiB !== null;

    // Определяем ABO
    const aPos = aSet ? antiA === 1 : null;
    const bPos = bSet ? antiB === 1 : null;

    let aboText = '—';
    if (aSet && bSet) {
      if (!aPos && !bPos) aboText = '0 (I)';
      else if (aPos && !bPos) aboText = 'A (II)';
      else if (!aPos && bPos) aboText = 'B (III)';
      else aboText = 'AB (IV)';
    }

    return {
      abo: aboText,
      ready: aSet && bSet,
      note: null,
    };
  }, [antiA, antiB]);

  const resetAll = () => {
    setAntiA(null);
    setAntiB(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Определение группы крови</Text>
          <Text style={styles.subtitle}>Цоликлоны: Anti-A и Anti-B</Text>
        </View>

      <ReactionPicker
        title="Anti-A (α) — реакция"
        value={antiA}
        onChange={setAntiA}
        hint="Агглютинация с Anti-A → наличие антигена A"
      />

      <ReactionPicker
        title="Anti-B (β) — реакция"
        value={antiB}
        onChange={setAntiB}
        hint="Агглютинация с Anti-B → наличие антигена B"
      />

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Результат</Text>
        <Row label="Группа крови (ABO)" value={abo} />
        {!ready && (
          <Text style={styles.noteDim}>
            Укажите реакции в обеих лунках, чтобы получить результат.
          </Text>
        )}
        {ready && note ? <Text style={styles.noteWarn}>⚠️ {note}</Text> : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={resetAll} style={styles.resetBtn} activeOpacity={0.8}>
          <Text style={styles.resetText}>Сбросить</Text>
        </TouchableOpacity>
      </View>

        <Text style={styles.disclaimer}>
          Данные рассчитаны для учебных/справочных целей. Окончательное определение — по стандартам ЛПО.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Row = ({ label, value }) => (
  <View style={styles.rowLine}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 20
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center'
  },
  title: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500'
  },

  block: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4
  },
  blockTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4
  },
  hint: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500'
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  opt: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  optActive: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  optText: {
    color: '#64748b',
    fontSize: 20,
    fontWeight: '700'
  },
  optTextActive: {
    color: '#ef4444',
    fontWeight: '800'
  },

  wellRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center'
  },
  well: {
    alignItems: 'center',
    flex: 1
  },
  wellCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    borderWidth: 3,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  wellCircleActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  dots: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '900'
  },
  wellLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center'
  },

  resultCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  resultTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center'
  },
  rowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  rowLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500'
  },
  rowValue: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700'
  },

  noteDim: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  noteWarn: {
    color: '#f59e0b',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a'
  },

  actions: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center'
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  resetText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },

  disclaimer: {
    color: '#6b7280',
    fontSize: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16
  },
});
