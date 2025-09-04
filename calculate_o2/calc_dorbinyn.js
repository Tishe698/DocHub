import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StatusBar} from 'react-native';
import styles from './style_oxy';

const Calc_dorbinyn = () => {
    const [volume, setVolume] = useState('');
    const [result, setResult] = useState(null);

    const calculateTime = () => {
        if (volume) {
            const time = parseFloat(volume) / 10 + 1 ; // Пример формулы: умножение объема на 2
            setResult(Math.floor(time));
        }
    };

    const resetFields = () => {
        setVolume('');
        setResult(null);
    };

    return (
        <SafeAreaView style={styles.container_2}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fbff" />
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Заголовок */}
                <Text style={styles.header}>Формула Дарбиняна</Text>

                {/* Описание */}
                <Text style={styles.subtitle}>
                    Расчет минутного объема вдоха на основе массы тела пациента
                </Text>

                {/* Информационная карточка */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>📊 Информация</Text>
                    <Text style={styles.infoCardText}>
                        Формула Дарбиняна используется для определения оптимального минутного объема вентиляции легких
                    </Text>
                </View>

                {/* Форма ввода */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>⚖️ Масса тела пациента</Text>
                        <View style={styles.weightInputContainer}>
                            <TextInput
                                style={styles.inputField}
                                value={volume}
                                onChangeText={(text) => setVolume(text)}
                                keyboardType="numeric"
                                placeholder="Введите массу тела"
                                placeholderTextColor="#999"
                            />
                            <View style={styles.unitLabel}>
                                <Text style={styles.unitLabelText}>кг</Text>
                            </View>
                        </View>
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
                        <Text style={styles.resultTitle}>💨 Минутный объем вдоха</Text>
                        <Text style={styles.resultValue}>{result} л/мин</Text>
                        <Text style={styles.resultDescription}>
                            Оптимальный объем вентиляции для данного пациента
                        </Text>
                    </View>
                )}

                {/* Формула расчета */}
                <View style={styles.formulasSection}>
                    <Text style={styles.formulasTitle}>📋 Формула расчета</Text>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>Формула Дарбиняна:</Text>
                        <Text style={styles.formulaText}>
                            МОВ = Масса тела / 10 + 1
                        </Text>
                        <Text style={styles.formulaText}>
                            Где МОВ измеряется в литрах в минуту
                        </Text>
                    </View>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>Пример расчета:</Text>
                        <Text style={styles.formulaText}>
                            Пациент весом 70 кг:{'\n'}
                            МОВ = 70 / 10 + 1 = 8 л/мин
                        </Text>
                    </View>
                </View>

                {/* Важная информация */}
                <View style={styles.warningCard}>
                    <Text style={styles.warningText}>
                        ℹ️ Формула является ориентировочной.{'\n'}
                        Конкретные параметры вентиляции определяются врачом с учетом клинической ситуации.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Calc_dorbinyn;
