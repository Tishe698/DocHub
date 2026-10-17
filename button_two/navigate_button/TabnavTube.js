import React from 'react';
import { TouchableOpacity, SafeAreaView, View, Image, ScrollView } from 'react-native';
import { Text } from '../../components/AppText';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { ScaledText } from '../../components/FontScaling';

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
                borderColor: 'rgba(37, 99, 235, 0.2)',
                minHeight: 140,
                width: '100%',
                maxWidth: 320,
                justifyContent: 'center',
                alignItems: 'center',
            }}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
        >
            {icon ? (
                <Image
                    source={icon}
                    style={{ width: 80, height: 80, marginBottom: spacing.sm }}
                    resizeMode="contain"
                />
            ) : (
                <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>
                    🫁
                </Text>
            )}
            <Text style={[typography.h3, {
                color: colors.light.primary,
                marginBottom: spacing.xs,
                textAlign: 'center'
            }]}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}>
                {title}
            </Text>
            <Text style={[typography.body2, {
                color: colors.light.text.secondary,
                textAlign: 'center',
                lineHeight: 20
            }]}
            allowFontScaling={false}
            maxFontSizeMultiplier={1.2}>
                {subtitle}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.light.background }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    padding: spacing.lg,
                    paddingBottom: spacing.xl
                }}
            >
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                    <Text style={[typography.h1, { color: colors.light.primary, marginBottom: spacing.sm }]}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.2}>
                        🫁 Расчет трубок
                    </Text>
                    <Text style={[typography.body1, { color: colors.light.text.secondary, textAlign: 'center' }]}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.2}>
                        Выберите тип трубки для расчета
                    </Text>
                </View>

                {/* Options */}
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: spacing.lg
                }}>
                    <TubeOption
                        title="Эндотрахеальная"
                        subtitle="Дети — по длине тела, возрасту или массе; 13–15 лет — по возрасту и росту; с 16 лет — по полу"
                        icon={require('./1.jpeg')}
                        onPress={() => handleButtonPress('IntubationTubeCalculation')}
                        accessibilityLabel="Перейти к расчету эндотрахеальной трубки"
                    />

                    <TubeOption
                        title="Ларингеальная"
                        subtitle="VBM LT / LTS-D: дети — по массе, взрослые — по росту. Не для ларингеальной маски"
                        icon={require('./2.jpeg')}
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
                    }]}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.2}>
                        {/* PALS (AHA) 2020: при интубации ребёнка держать наготове трубки на 0,5 мм меньше и больше
                            (их же выводит экран ЭТТ — «Альтернативы»). Положение трубки подтверждают
                            капнографией EtCO2 вместе с клинической оценкой (AHA 2020, ERC 2021). */}
                        • ЭТТ: держите наготове трубки на 0,5 мм меньше и больше{'\n'}
                        • Положение трубки подтверждайте капнографией (EtCO₂) и аускультацией{'\n'}
                        • Ларингеальная трубка: размер и объём манжеты — по инструкции производителя
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Tabnav;
