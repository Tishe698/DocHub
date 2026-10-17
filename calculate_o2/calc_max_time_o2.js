import React, {useState} from 'react';
import {View, Button, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert} from 'react-native';
import { Text, TextInput } from '../components/AppText';
import styles from './style_oxy';
import parseNum from '../utils/parseNum';
const Calc_max_time_o2 = () => {
    const [volume, setVolume] = useState('');
    const [pressure, setPressure] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('ATM'); // По умолчанию атмосферы
    const [flowRate, setFlowRate] = useState('');
    const [result, setResult] = useState(null);

    const calculateTime = () => {
        const volumeValue = parseNum(volume);
        let pressureValue = parseNum(pressure);
        const flowValue = parseNum(flowRate);
        if (!(volumeValue > 0) || !(pressureValue > 0) || !(flowValue > 0)) {
            setResult(null);
            Alert.alert('Проверьте данные', 'Объём, давление и скорость потока должны быть числами больше нуля');
            return;
        }
        if (selectedUnit === 'MPa') {
            pressureValue *= 10; // Умножаем на 10, если выбраны мегапаскали
        }
        const time = (volumeValue * pressureValue) / flowValue;
        setResult(Math.floor(time)); // Округление до целого числа
    };
    const resetFields = () => {
        setVolume('');
        setPressure('');
        setSelectedUnit('ATM');
        setFlowRate('');
        setResult(null);
    };

    return (
        <SafeAreaView style={styles.container_2}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fbff" />
            <ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingBottom: 32 }]}>
                {/* Заголовок */}
                <Text style={styles.header}>Максимальное время ингаляции</Text>

                {/* Описание */}
                <Text style={styles.subtitle}>
                    Расчет продолжительности кислородотерапии на основе параметров баллона
                </Text>

                {/* Информационная карточка */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>💡 Информация</Text>
                    <Text style={styles.infoCardText}>
                        Расчет основан на объеме баллона, давлении и скорости потока кислорода
                    </Text>
                </View>

                {/* Форма ввода */}
                <View style={styles.formContainer}>
                    {/* Объем баллона */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>📏 Объем баллона кислорода</Text>
                        <TextInput
                            style={styles.inputField}
                            value={volume}
                            onChangeText={(text) => setVolume(text)}
                            keyboardType="numeric"
                            placeholder="Введите объем в литрах"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Показание манометра */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>📊 Показание манометра</Text>
                        <View style={styles.pressureInputContainer}>
                            <TextInput
                                style={styles.inputField}
                                value={pressure}
                                onChangeText={(text) => setPressure(text)}
                                keyboardType="numeric"
                                placeholder="Введите давление"
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                style={[
                                    styles.unitButton,
                                    selectedUnit === 'ATM' && styles.unitButtonActive
                                ]}
                                onPress={() =>
                                    setSelectedUnit(selectedUnit === 'ATM' ? 'MPa' : 'ATM')
                                }
                            >
                                <Text style={[
                                    styles.unitButtonText,
                                    selectedUnit === 'ATM' && styles.unitButtonTextActive
                                ]}>
                                    {selectedUnit}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Скорость потока */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>💨 Скорость потока</Text>
                        <TextInput
                            style={styles.inputField}
                            value={flowRate}
                            onChangeText={(text) => setFlowRate(text)}
                            keyboardType="numeric"
                            placeholder="Литры в минуту"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Кнопки действий */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.calculateButton}
                        onPress={calculateTime}
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
                        <Text style={styles.resultTitle}>⏱️ Результат расчета</Text>
                        <Text style={styles.resultValue}>{result} минут</Text>
                        <Text style={styles.resultDescription}>
                            Максимальное время непрерывной ингаляции кислорода
                        </Text>
                    </View>
                )}

                {/* Формулы расчета */}
                <View style={styles.formulasSection}>
                    <Text style={styles.formulasTitle}>📋 Формулы расчета</Text>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>В мегапаскалях (MPa):</Text>
                        <Text style={styles.formulaText}>
                            Объем × 10 × Давление ÷ Скорость потока
                        </Text>
                    </View>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>В атмосферах (ATM):</Text>
                        <Text style={styles.formulaText}>
                            Объем × Давление ÷ Скорость потока
                        </Text>
                    </View>
                </View>

                {/* Предупреждение */}
                <View style={styles.warningCard}>
                    <Text style={styles.warningText}>
                        ⚠️ Учитывайте запас кислорода для экстренных ситуаций.{'\n'}
                        Рекомендуется иметь резервный баллон.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


export default Calc_max_time_o2;
