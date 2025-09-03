// IntubationTubeCalculation.js - Расчет эндотрахеальных трубок
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { calculateIntubationTubeLogic } from './CalculateIntubationTube';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

const IntubationTubeCalculation = () => {
    const [weight, setWeight] = useState('');
    const [results, setResults] = useState(null);

    const handleCalculate = () => {
        const weightNum = parseFloat(weight);

        if (!weightNum || weightNum <= 0) {
            Alert.alert('Ошибка', 'Пожалуйста, введите корректный вес ребенка');
            return;
        }

        const calculationResults = calculateIntubationTubeLogic(weightNum);
        setResults(calculationResults);
    };

    const clearResults = () => {
        setWeight('');
        setResults(null);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.light.background }}>
            <ScrollView
                style={{ flex: 1, padding: spacing.lg }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                    <Text style={[typography.h2, { color: colors.light.primary, marginBottom: spacing.sm }]}>
                        🫁 Расчет эндотрахеальной трубки
                    </Text>
                    <Text style={[typography.body1, { color: colors.light.text.secondary, textAlign: 'center' }]}>
                        Определение размера трубки по весу ребенка
                    </Text>
                </View>

                {/* Weight Input */}
                <View style={{ marginBottom: spacing.lg }}>
                    <Text style={[typography.body1, { color: colors.light.text.primary, marginBottom: spacing.sm }]}>
                        Вес ребенка (кг)
                    </Text>
                    <TextInput
                        style={{
                            backgroundColor: colors.light.surface,
                            borderRadius: borderRadius.lg,
                            height: 56,
                            paddingHorizontal: spacing.lg,
                            fontSize: 16,
                            color: colors.light.text.primary,
                            borderWidth: 1,
                            borderColor: colors.light.border,
                        }}
                        placeholder="Введите вес в кг"
                        placeholderTextColor={colors.light.text.tertiary}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        accessibilityLabel="Поле ввода веса ребенка"
                    />
                </View>

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
                        borderColor: colors.light.primary + '20',
                        ...shadows.md,
                    }}>
                        <Text style={[typography.h3, {
                            color: colors.light.primary,
                            marginBottom: spacing.md,
                            textAlign: 'center'
                        }]}>
                            📊 Результаты расчета
                        </Text>

                        <View style={{ gap: spacing.sm }}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: spacing.sm,
                                paddingHorizontal: spacing.md,
                                backgroundColor: colors.light.surfaceVariant,
                                borderRadius: borderRadius.md,
                            }}>
                                <Text style={[typography.body1, { color: colors.light.text.secondary }]}>
                                    Внутренний диаметр
                                </Text>
                                <Text style={[typography.body1, {
                                    color: colors.light.primary,
                                    fontWeight: '600'
                                }]}>
                                    {results.innerDiameter} мм
                                </Text>
                            </View>

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: spacing.sm,
                                paddingHorizontal: spacing.md,
                                backgroundColor: colors.light.surfaceVariant,
                                borderRadius: borderRadius.md,
                            }}>
                                <Text style={[typography.body1, { color: colors.light.text.secondary }]}>
                                    Глубина введения
                                </Text>
                                <Text style={[typography.body1, {
                                    color: colors.light.primary,
                                    fontWeight: '600'
                                }]}>
                                    {results.insertionDepth} см
                                </Text>
                            </View>

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: spacing.sm,
                                paddingHorizontal: spacing.md,
                                backgroundColor: colors.light.surfaceVariant,
                                borderRadius: borderRadius.md,
                            }}>
                                <Text style={[typography.body1, { color: colors.light.text.secondary }]}>
                                    Размер группы
                                </Text>
                                <Text style={[typography.body1, {
                                    color: colors.light.primary,
                                    fontWeight: '600'
                                }]}>
                                    {results.sizeGroup}
                                </Text>
                            </View>
                        </View>

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
                    <Text style={[typography.caption, {
                        color: colors.light.text.secondary,
                        lineHeight: 18
                    }]}>
                        • Расчет производится на основе веса ребенка{'\n'}
                        • Всегда проверяйте размер трубки визуально перед использованием{'\n'}
                        • При сомнениях используйте меньший размер{'\n'}
                        • Консультируйтесь с инструкциями производителя
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default IntubationTubeCalculation;
