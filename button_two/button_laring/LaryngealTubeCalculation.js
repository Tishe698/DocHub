// LaryngealTubeCalculation.js - Подбор ларингеальной трубки VBM LT / LTS-D
// Таблица и пределы — в CalculateTube.js (VBM LTS-D IFU G3082-06/04.2017, с. 11).
import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { Text, TextInput } from '../../components/AppText';
import calculateTubeLogic, {
    isHeightRequired,
    validateTubeInput,
    LT_MAX_CUFF_PRESSURE_CMH2O,
} from './CalculateTube';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import parseNum from '../../utils/parseNum';

const inputStyle = {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    height: 56,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.light.text.primary,
    borderWidth: 1,
    borderColor: colors.light.border,
};

const rowStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.light.surfaceVariant,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
};

const ResultRow = ({ label, value }) => (
    <View style={rowStyle}>
        <Text style={[typography.body1, { color: colors.light.text.secondary, flexShrink: 1 }]}>
            {label}
        </Text>
        <Text style={[typography.body1, {
            color: colors.light.primary,
            fontWeight: '600',
            textAlign: 'right',
            flexShrink: 1,
        }]}>
            {value}
        </Text>
    </View>
);

const CATEGORIES = [
    { key: 'child', label: 'Ребёнок' },
    { key: 'adult', label: 'Взрослый' },
];

const LaryngealTubeCalculation = () => {
    const [category, setCategory] = useState(null);
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [results, setResults] = useState(null);

    const weightNum = parseNum(weight);
    // Рост нужен взрослым всегда, детям — только при массе > 25 кг (VBM: #0–#2 по массе).
    const heightNeeded = category ? isHeightRequired(category, weightNum) : false;

    const selectCategory = (key) => {
        setCategory(key);
        setResults(null);
    };

    const handleCalculate = () => {
        const w = category === 'child' ? parseNum(weight) : undefined;
        const h = parseNum(height);

        const error = validateTubeInput(category, w, h);
        if (error) {
            Alert.alert('Ошибка', error);
            return;
        }
        setResults(calculateTubeLogic(w, h, category));
    };

    const clearResults = () => {
        setWeight('');
        setHeight('');
        setResults(null);
    };

    const hasSize = !!(results && results.tubeSize);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.light.background }}>
            <ScrollView
                style={{ flex: 1, padding: spacing.lg }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                    <Text style={[typography.h2, { color: colors.light.primary, marginBottom: spacing.sm, textAlign: 'center' }]}>
                        🫁 Подбор ларингеальной трубки
                    </Text>
                    <Text style={[typography.body1, { color: colors.light.text.secondary, textAlign: 'center' }]}>
                        VBM LT / LTS-D. Дети — по массе (при массе &gt; 25 кг — по росту), взрослые — по росту
                    </Text>
                </View>

                {/* Category */}
                <View style={{ marginBottom: spacing.lg }}>
                    <Text style={[typography.body1, { color: colors.light.text.primary, marginBottom: spacing.sm }]}>
                        Категория пациента
                    </Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        {CATEGORIES.map((c) => {
                            const active = category === c.key;
                            return (
                                <TouchableOpacity
                                    key={c.key}
                                    onPress={() => selectCategory(c.key)}
                                    style={{
                                        flex: 1,
                                        height: 48,
                                        borderRadius: borderRadius.lg,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: active ? colors.light.primary : colors.light.border,
                                        backgroundColor: active ? colors.light.primary : colors.light.surface,
                                    }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: active }}
                                    accessibilityLabel={`Категория: ${c.label}`}
                                >
                                    <Text style={[typography.button, {
                                        color: active ? colors.light.surface : colors.light.text.primary,
                                    }]}>
                                        {c.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Weight Input — только для детей: у взрослых таблица VBM использует рост */}
                {category === 'child' && (
                    <View style={{ marginBottom: spacing.lg }}>
                        <Text style={[typography.body1, { color: colors.light.text.primary, marginBottom: spacing.sm }]}>
                            Масса ребёнка (кг)
                        </Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Введите массу в кг"
                            placeholderTextColor={colors.light.text.tertiary}
                            value={weight}
                            onChangeText={(t) => { setWeight(t); setResults(null); }}
                            keyboardType="numeric"
                            accessibilityLabel="Поле ввода массы ребёнка"
                        />
                    </View>
                )}

                {/* Height Input */}
                {category && (
                    <View style={{ marginBottom: spacing.lg }}>
                        <Text style={[typography.body1, { color: colors.light.text.primary, marginBottom: spacing.sm }]}>
                            {heightNeeded ? 'Рост пациента (см)' : 'Рост пациента (см) — не обязателен'}
                        </Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Рост в сантиметрах, например 165"
                            placeholderTextColor={colors.light.text.tertiary}
                            value={height}
                            onChangeText={(t) => { setHeight(t); setResults(null); }}
                            keyboardType="numeric"
                            accessibilityLabel="Поле ввода роста пациента в сантиметрах"
                        />
                        {category === 'child' && !heightNeeded && (
                            <Text style={[typography.caption, { color: colors.light.text.secondary, marginTop: spacing.xs }]}>
                                При массе до 25 кг размер выбирается по массе
                            </Text>
                        )}
                    </View>
                )}

                {/* Calculate Button */}
                <TouchableOpacity
                    onPress={handleCalculate}
                    style={{
                        backgroundColor: colors.light.primary,
                        borderRadius: borderRadius.lg,
                        height: 56,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: spacing.lg,
                        ...shadows.md,
                    }}
                    accessibilityLabel="Рассчитать размер трубки"
                    accessibilityRole="button"
                >
                    <Text style={[typography.button, { color: colors.light.surface }]}>
                        🔢 Рассчитать
                    </Text>
                </TouchableOpacity>

                {/* Results */}
                {results && (
                    <View style={{
                        backgroundColor: colors.light.surface,
                        borderRadius: borderRadius.xl,
                        padding: spacing.lg,
                        marginBottom: spacing.lg,
                        borderWidth: 2,
                        borderColor: hasSize ? colors.light.primary + '20' : colors.light.warning,
                        ...shadows.md,
                    }}>
                        <Text style={[typography.h3, {
                            color: hasSize ? colors.light.primary : colors.light.warning,
                            marginBottom: spacing.md,
                            textAlign: 'center'
                        }]}>
                            {hasSize ? '📊 Результаты расчета' : '⚠️ Размер не определён'}
                        </Text>

                        {hasSize && (
                            <View style={{ gap: spacing.sm }}>
                                <ResultRow label="Размер трубки" value={`#${results.tubeSize}`} />
                                <ResultRow label="Цвет коннектора" value={results.tubeColor} />
                                <ResultRow label="Объём манжеты (рекоменд.)" value={results.cuffVolume} />
                                <ResultRow label="Макс. давление в манжете" value={results.maxCuffPressure} />
                                <ResultRow label="Желудочный зонд через дренаж (LTS-D)" value={`до ${results.drainFr}`} />
                                <Text style={[typography.caption, { color: colors.light.text.secondary }]}>
                                    Основание: {results.basis}
                                </Text>
                            </View>
                        )}

                        {!!results.warning && (
                            <View style={{
                                marginTop: hasSize ? spacing.sm : 0,
                                padding: spacing.md,
                                borderRadius: borderRadius.md,
                                backgroundColor: colors.light.warning + '15',
                            }}>
                                <Text style={[typography.body2, { color: colors.light.text.primary }]}>
                                    {results.warning}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={clearResults}
                            style={{
                                marginTop: spacing.md,
                                padding: spacing.sm,
                                alignSelf: 'center',
                                backgroundColor: colors.light.surfaceVariant,
                                borderRadius: borderRadius.md,
                            }}
                            accessibilityLabel="Очистить результаты"
                            accessibilityRole="button"
                        >
                            <Text style={[typography.caption, { color: colors.light.text.secondary }]}>
                                🔄 Очистить
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Section */}
                <View style={{
                    backgroundColor: colors.light.surface,
                    borderRadius: borderRadius.xl,
                    padding: spacing.lg,
                    marginBottom: spacing.lg,
                    borderWidth: 1,
                    borderColor: colors.light.divider,
                }}>
                    <Text style={[typography.h4, {
                        color: colors.light.primary,
                        marginBottom: spacing.sm,
                        textAlign: 'center'
                    }]}>
                        ℹ️ Важная информация
                    </Text>
                    {/* Формулировки — по VBM LTS-D IFU G3082-06/04.2017, с. 9–11 */}
                    <Text style={[typography.caption, {
                        color: colors.light.text.secondary,
                        lineHeight: 18
                    }]}>
                        • Таблица производителя VBM для ларингеальной трубки LT/LTS-D (инструкция 2017). К ларингеальной маске и i-gel не применять{'\n'}
                        • Цвет — маркировка 15-мм коннектора производителя VBM; у других устройств те же цвета означают другие размеры{'\n'}
                        • Дети: #0 — &lt; 5 кг, #1 — 5–12 кг, #2 — 12–25 кг; при массе &gt; 25 кг — по росту (#2.5 — 125–150 см){'\n'}
                        • Взрослые: #3 — рост &lt; 155 см, #4 — 155–180 см, #5 — &gt; 180 см{'\n'}
                        • Манжету раздуть рекомендуемым объёмом, затем снизить давление до минимального, при котором нет утечки; не выше {LT_MAX_CUFF_PRESSURE_CMH2O} см вод. ст., контроль манометром. Перераздувание вызывает отёк языка{'\n'}
                        • Сверяйте с инструкцией к вашей партии трубок
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default LaryngealTubeCalculation;
