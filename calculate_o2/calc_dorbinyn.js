import React, { useState } from 'react';
import {View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert} from 'react-native';
import { Text, TextInput } from '../components/AppText';
import styles from './style_oxy';
import parseNum from '../utils/parseNum';

// Границы применимости, кг.
// Нижняя: при массе < 5 кг формула завышает МОД в 1,5–5 раз (норма новорождённых ≈ 200 мл/кг/мин);
// новорождённых вентилируют по давлению и частоте (ERC 2021, Newborn Life Support), а не по МОД.
// 5–30 кг — дети: показываем результат с оговоркой. Верхняя — проверка правдоподобия ввода.
export const WEIGHT_MIN = 5;
export const WEIGHT_CHILD = 30;
export const WEIGHT_MAX = 250;
// Поправка на утечку при масочной ИВЛ объёмным аппаратом: +2–3 л/мин
// (описание транспортного аппарата А-ИВЛ 2/20 «ТМТ», ambulance-russia.blogspot.com/2013/04/220.html —
// вторичный источник; применяем только у взрослых, для которых он написан).
export const MASK_LEAK_MIN = 2;
export const MASK_LEAK_MAX = 3;

// 8.5 → «8,5»; 8 → «8».
export const fmt = (x) => String(x).replace('.', ',');

// Формула Дарбиняна (Т.М. Дарбинян и соавт., 1976; учебное пособие «Анестезиология и реаниматология», 2016):
// МОД (л/мин) = масса (кг) / 10 + 1. Округляем до 0,1 л/мин, а не вниз до целого:
// Math.floor занижал МОД до 0,9 л/мин (у детей до 47%).
export const computeDarbinyan = (weight) => {
    if (!(weight > 0)) {
        return { error: 'Масса тела должна быть числом больше нуля' };
    }
    if (weight > WEIGHT_MAX) {
        return { error: `Масса больше ${WEIGHT_MAX} кг — проверьте ввод. При ожирении считайте по должной массе тела.` };
    }
    if (weight < WEIGHT_MIN) {
        return { error: `При массе меньше ${WEIGHT_MIN} кг формула Дарбиняна не применяется: она завышает МОД в 1,5–5 раз. Новорождённых вентилируют по давлению и частоте (ERC, NLS 2021); для детей — ДО 6–8 мл/кг × возрастная ЧДД (экран «Аппаратная ИВЛ»).` };
    }
    const mv = Math.round((weight / 10 + 1) * 10) / 10;
    const child = weight < WEIGHT_CHILD;
    return {
        mv,
        child,
        maskMin: child ? null : Math.round((mv + MASK_LEAK_MIN) * 10) / 10,
        maskMax: child ? null : Math.round((mv + MASK_LEAK_MAX) * 10) / 10,
    };
};

const Calc_dorbinyn = () => {
    const [weight, setWeight] = useState('');
    const [result, setResult] = useState(null);

    const calculateMv = () => {
        const r = computeDarbinyan(parseNum(weight));
        if (r.error) {
            setResult(null);
            Alert.alert('Проверьте данные', r.error);
            return;
        }
        setResult(r);
    };

    const resetFields = () => {
        setWeight('');
        setResult(null);
    };

    return (
        <SafeAreaView style={styles.container_2}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fbff" />
            <ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingBottom: 32 }]}>
                {/* Заголовок */}
                <Text style={styles.header}>Формула Дарбиняна</Text>

                {/* Описание */}
                <Text style={styles.subtitle}>
                    Расчет минутного объема дыхания (МОД) по массе тела пациента
                </Text>

                {/* Информационная карточка */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>📊 Информация</Text>
                    <Text style={styles.infoCardText}>
                        Формула Дарбиняна дает ориентировочный стартовый МОД (минутный объем вентиляции) для настройки ИВЛ
                    </Text>
                </View>

                {/* Форма ввода */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>⚖️ Масса тела пациента</Text>
                        <View style={styles.weightInputContainer}>
                            <TextInput
                                style={[styles.inputField, { flex: 1 }]}
                                value={weight}
                                onChangeText={(text) => {
                                    setWeight(text);
                                    setResult(null); // старый результат не должен относиться к новой массе
                                }}
                                keyboardType="numeric"
                                placeholder="Введите массу тела"
                                placeholderTextColor="#999"
                            />
                            <View style={styles.unitLabel}>
                                <Text style={styles.unitLabelText}>кг</Text>
                            </View>
                        </View>
                        {/* Расчёт по должной (предсказанной) массе тела — ARDSNet, NEJM 2000; КР ФАР «Диагностика и интенсивная терапия ОРДС», 2020. */}
                        <Text style={[styles.formulaText, { marginTop: 6 }]}>
                            При ожирении вводите должную массу тела (по росту и полу), а не фактическую.
                        </Text>
                    </View>
                </View>

                {/* Кнопки действий */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.calculateButton}
                        onPress={calculateMv}
                    >
                        <Text style={styles.calculateButtonText}>🧮 Рассчитать</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={resetFields}
                    >
                        <Text style={styles.resetButtonText}>🔄 Сбросить</Text>
                    </TouchableOpacity>
                </View>

                {/* Результат */}
                {result !== null && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>💨 Минутный объем дыхания (МОД)</Text>
                        <Text style={styles.resultValue}>{fmt(result.mv)} л/мин</Text>
                        <Text style={styles.resultDescription}>
                            Ориентировочный стартовый МОД. Корректируйте по экскурсии грудной клетки, SpO₂ и EtCO₂.
                        </Text>
                        {result.child ? (
                            <Text style={[styles.resultDescription, { marginTop: 8, color: '#c62828' }]}>
                                Масса меньше {WEIGHT_CHILD} кг: у детей это лишь ориентир. Сверьте с ДО 6–8 мл/кг × возрастная ЧДД (экран «Аппаратная ИВЛ»).
                            </Text>
                        ) : (
                            <Text style={[styles.resultDescription, { marginTop: 8 }]}>
                                При масочной ИВЛ объемным аппаратом прибавьте 2–3 л/мин на утечку: {fmt(result.maskMin)}–{fmt(result.maskMax)} л/мин.
                            </Text>
                        )}
                    </View>
                )}

                {/* Формула расчета */}
                <View style={styles.formulasSection}>
                    <Text style={styles.formulasTitle}>📋 Формула расчета</Text>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>Формула Дарбиняна:</Text>
                        <Text style={styles.formulaText}>
                            МОД (л/мин) = Масса тела (кг) / 10 + 1
                        </Text>
                        <Text style={styles.formulaText}>
                            Результат округляется до 0,1 л/мин
                        </Text>
                    </View>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>Пример расчета:</Text>
                        <Text style={styles.formulaText}>
                            Пациент весом 75 кг:{'\n'}
                            МОД = 75 / 10 + 1 = 8,5 л/мин{'\n'}
                            При масочной ИВЛ: 10,5–11,5 л/мин
                        </Text>
                    </View>
                </View>

                {/* Важная информация */}
                <View style={styles.warningCard}>
                    <Text style={styles.warningText}>
                        ℹ️ Формула является ориентировочной и применяется с массы {WEIGHT_MIN} кг.{'\n'}
                        Конкретные параметры вентиляции определяются врачом с учетом клинической ситуации.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Calc_dorbinyn;
