import React, {useState} from 'react';
import {View, Text, TextInput, Button, TouchableOpacity, ScrollView} from 'react-native';
import styles from './style_oxy';
const Calc_max_time_o2 = () => {
    const [volume, setVolume] = useState('');
    const [pressure, setPressure] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('ATM'); // По умолчанию атмосферы
    const [flowRate, setFlowRate] = useState('');
    const [result, setResult] = useState(null);

    const calculateTime = () => {
        if (volume && pressure && flowRate) {
            let pressureValue = parseFloat(pressure);
            if (selectedUnit === 'MPa') {
                pressureValue *= 10; // Умножаем на 10, если выбраны мегапаскали
            }
            const time = (parseFloat(volume) * pressureValue) / parseFloat(flowRate);
            setResult(Math.floor(time)); // Округление до целого числа
        }
    };
    const resetFields = () => {
        setVolume('');
        setPressure('');
        setSelectedUnit('ATM');
        setFlowRate('');
        setResult(null);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header1}>Рассчет максимального{'\n'}времени ингаляции</Text>
            <Text style={styles.label}>Введите объем баллона кислорода (литры):</Text>
            <TextInput
                style={styles.input}
                value={volume}
                onChangeText={(text) => setVolume(text)}
                keyboardType="numeric"
            />
            <Text style={styles.label}>Введите показание манометра:</Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={pressure}
                    onChangeText={(text) => setPressure(text)}
                    keyboardType="numeric"
                />
                <Button
                    title={selectedUnit === 'ATM' ? 'ATM' : 'MPa'}
                    onPress={() =>
                        setSelectedUnit(selectedUnit === 'ATM' ? 'MPa' : 'ATM')
                    }
                />
            </View>
            <Text style={styles.label}>Введите скорость потока (литры в минуту):</Text>
            <TextInput
                style={styles.input}
                value={flowRate}
                onChangeText={(text) => setFlowRate(text)}
                keyboardType="numeric"
            />
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
                    Максимальное время ингаляции:{'\n'}
                    <Text>{result} минут</Text>
                </Text>
            )}
            <View style={styles.cacl_formula}>
                <Text style={styles.cacl_formula_text}>
                    Рассчет по формуле (в мРа)
                </Text>
                <Text style={styles.cacl_formula_text_1}>
                    Объем баллона*10*показания манометра/скорость потока
                </Text>
            </View>
            <View style={styles.cacl_formula}>
                <Text style={styles.cacl_formula_text}>
                    Рассчет по формуле (в атм)
                </Text>
                <Text style={styles.cacl_formula_text_1}>
                    Объем баллона*показания манометра/скорость потока
                </Text>
            </View>
        </ScrollView>
    );
};


export default Calc_max_time_o2;
