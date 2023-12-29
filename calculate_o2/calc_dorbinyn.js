import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView} from 'react-native';
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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header1}>Рассчет по формуле {'\n'}Дарбиняна</Text>
            <Text style={styles.label}>Введите массу тела пациента:</Text>
            <View style={styles.kg_input}>
            <TextInput
                style={styles.input}
                value={volume}
                onChangeText={(text) => setVolume(text)}
                keyboardType="numeric"
            />
            <Text style={styles.label_1}>кг</Text>
            </View>
            <View style={styles.button_container}>
                <TouchableOpacity
                    style={styles.buttonoxygen}
                    onPress={calculateTime}
                >
                    <Text style={styles.buttonText}>Рассчитать</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buttonReset}
                    onPress={resetFields}
                >
                    <Text style={{
                        color: "#fff", fontSize: 19,
                        fontWeight: '300',
                        textAlign: 'center',
                    }}>Сбросить</Text>
                </TouchableOpacity>
            </View>
            {result !== null && (
                <Text style={styles.result}>
                    Минутный объем вдоха:{'\n'}
                    <Text style={styles.result_1}>{result}  л/мин</Text>
                </Text>
            )}
            <View style={styles.cacl_formula}>
                <Text style={styles.cacl_formula_text}>
                    Рассчет по формуле
                </Text>
                <Text style={styles.cacl_formula_text_1}>
                    МОВ=Масса/10+1
                </Text>
            </View>
        </ScrollView>
    );
};

export default Calc_dorbinyn;
