import React from 'react';
import { TouchableOpacity, SafeAreaView, ScrollView, StatusBar, View } from 'react-native';
import { Text } from '../components/AppText';
import styles from './style_oxy'

const Tabnav_oxy = ({ navigation }) => {
    const handleButtonPress = (screenName) => {
        navigation.navigate(screenName);
    };

    return (
        <SafeAreaView style={styles.container_2}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fbff" />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 32 }}
            >
                {/* Заголовок */}
                <Text style={styles.header}>Кислородные расчеты</Text>

                {/* Описание */}
                <Text style={styles.subtitle}>
                    Выберите необходимый тип расчета для проведения кислородной терапии
                </Text>
                {/* Кнопки с иконками */}
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.buttonoxygen_2}
                        onPress={() => handleButtonPress('Calc_max_time_o2')}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonIcon}>⏱️</Text>
                            <View style={styles.buttonTextContainer}>
                                <Text style={styles.buttonText}>Максимальное время ингаляции</Text>
                                <Text style={styles.buttonSubtext}>Расчет продолжительности кислородотерапии</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonoxygen_2}
                        onPress={() => handleButtonPress('Calc_dorbinyn')}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonIcon}>📊</Text>
                            <View style={styles.buttonTextContainer}>
                                <Text style={styles.buttonText}>Формула Дарбиняна</Text>
                                <Text style={styles.buttonSubtext}>Расчет по классической методике</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonoxygen_2}
                        onPress={() => handleButtonPress('Calc_aparat_IVL')}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonIcon}>🏥</Text>
                            <View style={styles.buttonTextContainer}>
                                <Text style={styles.buttonText}>Аппаратная ИВЛ</Text>
                                <Text style={styles.buttonSubtext}>Расчет параметров искусственной вентиляции</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Дополнительная информация внизу */}
                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>
                        ⚠️ Все расчеты носят рекомендательный характер.{'\n'}
                        Обратитесь к врачу для точной диагностики.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default Tabnav_oxy;
