import React from 'react';
import { TouchableOpacity, SafeAreaView, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

const Tabnav = ({ navigation }) => {
    const handleButtonPress = (screenName) => {
        navigation.navigate(screenName);
    };

    const TubeOption = ({ title, subtitle, icon, onPress, accessibilityLabel }) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: colors.light.surface,
                borderRadius: borderRadius.xl,
                padding: spacing.xl,
                marginBottom: spacing.lg,
                ...shadows.md,
                borderWidth: 2,
                borderColor: colors.light.primary + '20',
                minHeight: 140,
                justifyContent: 'center',
                alignItems: 'center',
            }}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
        >
            <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>
                {icon}
            </Text>
            <Text style={[typography.h3, {
                color: colors.light.primary,
                marginBottom: spacing.xs,
                textAlign: 'center'
            }]}>
                {title}
            </Text>
            <Text style={[typography.body2, {
                color: colors.light.text.secondary,
                textAlign: 'center',
                lineHeight: 20
            }]}>
                {subtitle}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.light.background }}>
            <View style={{ flex: 1, padding: spacing.lg }}>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                    <Text style={[typography.h1, { color: colors.light.primary, marginBottom: spacing.sm }]}>
                        🫁 Расчет трубок
                    </Text>
                    <Text style={[typography.body1, { color: colors.light.text.secondary, textAlign: 'center' }]}>
                        Выберите тип трубки для расчета
                    </Text>
                </View>

                {/* Options */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <TubeOption
                        title="Эндотрахеальная"
                        subtitle="Расчет по весу ребенка"
                        icon="🫁"
                        onPress={() => handleButtonPress('IntubationTubeCalculation')}
                        accessibilityLabel="Перейти к расчету эндотрахеальной трубки"
                    />

                    <TubeOption
                        title="Ларингеальная"
                        subtitle="Расчет по весу и росту"
                        icon="🫁"
                        onPress={() => handleButtonPress('Button_Tube_Calculation')}
                        accessibilityLabel="Перейти к расчету ларингеальной трубки"
                    />
                </View>

                {/* Info */}
                <View style={{
                    backgroundColor: colors.light.surface,
                    borderRadius: borderRadius.xl,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: colors.light.divider,
                }}>
                    <Text style={[typography.caption, {
                        color: colors.light.text.secondary,
                        textAlign: 'center',
                        lineHeight: 18
                    }]}>
                        • Всегда проверяйте размер перед использованием{'\n'}
                        • Следуйте инструкциям производителя{'\n'}
                        • При сомнениях используйте меньший размер
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Tabnav;
