// LaryngealTubeCalculation.js - Расчет ларингеальных трубок
import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { Text, TextInput } from '../../components/AppText';
import calculateTubeLogic from './CalculateTube';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import parseNum from '../../utils/parseNum';

const LaryngealTubeCalculation = () => {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [results, setResults] = useState(null);

    const handleCalculate = () => {
        const weightNum = parseNum(weight);
        const heightNum = parseNum(height);

        if (!weightNum || weightNum <= 0) {
            Alert.alert('Ошибка', 'Пожалуйста, введите корректный вес');
            return;
        }

        if (!heightNum || heightNum <= 0) {
            Alert.alert('Ошибка', 'Пожалуйста, введите корректный рост');
            return;
        }

        const calculationResults = calculateTubeLogic(weightNum, heightNum);
        setResults(calculationResults);
    };

    const clearResults = () => {
        setWeight('');
        setHeight('');
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
                        🫁 Расчет ларингеальной трубки
                    </Text>
                    <Text style={[typography.body1, { color: colors.light.text.secondary, textAlign: 'center' }]}>
                        Определение размера по весу и росту пациента
                    </Text>
                </View>

                {/* Weight Input */}
                <View style={{ marginBottom: spacing.lg }}>
                    <Text style={[typography.body1, { color: colors.light.text.primary, marginBottom: spacing.sm }]}>
                        Вес пациента (кг)
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
                        accessibilityLabel="Поле ввода веса пациента"
                    />
                </View>

                {/* Height Input */}
                <View style={{ marginBottom: spacing.lg }}>
                    <Text style={[typography.body1, { color: colors.light.text.primary, marginBottom: spacing.sm }]}>
                        Рост пациента (см)
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
                        placeholder="Введите рост в см"
                        placeholderTextColor={colors.light.text.tertiary}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        accessibilityLabel="Поле ввода роста пациента"
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
                                    Размер трубки
                                </Text>
                                <Text style={[typography.body1, {
                                    color: colors.light.primary,
                                    fontWeight: '600'
                                }]}>
                                    {results.tubeSize}
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
                                    Цвет трубки
                                </Text>
                                <Text style={[typography.body1, {
                                    color: colors.light.primary,
                                    fontWeight: '600'
                                }]}>
                                    {results.tubeColor}
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
                        • Расчет производится на основе веса и роста пациента{'\n'}
                        • Цвет трубки соответствует стандартам ASA{'\n'}
                        • Всегда проверяйте размер перед использованием{'\n'}
                        • Следуйте инструкциям производителя
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default LaryngealTubeCalculation;
