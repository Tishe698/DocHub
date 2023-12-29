import React from 'react';
import { TouchableOpacity, SafeAreaView, ScrollView, Text, } from 'react-native';
import styles from './style_oxy'
const Tabnav_oxy = ({ navigation }) => {
    const handleButtonPress = (screenName) => {
        navigation.navigate(screenName);
    };

    return (
        <SafeAreaView style={styles.container_2}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <TouchableOpacity
                    style={styles.buttonoxygen_2}
                    onPress={() => handleButtonPress('Calc_max_time_o2')}
                >
                    <Text style={styles.buttonText}>Рассчет максимального времени ингаляции</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buttonoxygen_2}
                    onPress={() => handleButtonPress('Calc_dorbinyn')}
                >
                    <Text style={styles.buttonText}>Рассчет по формуле Дарбиняна</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buttonoxygen_2}
                    onPress={() => handleButtonPress('Calc_aparat_IVL')}
                >
                    <Text style={styles.buttonText}>Проведение аппаратной ИВЛ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buttonoxygen_2}
                    onPress={() => handleButtonPress('Calc_auxiliary_IVL')}
                >
                    <Text style={styles.buttonText}>Проведение вспомогательной ИВЛ</Text>
                </TouchableOpacity>
                {/* Add more TouchableOpacity elements if needed */}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Tabnav_oxy;
