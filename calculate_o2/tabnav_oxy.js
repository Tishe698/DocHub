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
                    Выберите расчёт
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
                                <Text style={styles.buttonText}>Время работы баллона</Text>
                                <Text style={styles.buttonSubtext}>По объёму, давлению и потоку — до резерва давления</Text>
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
                                <Text style={styles.buttonSubtext}>Минутный объём дыхания по массе тела</Text>
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
                                <Text style={styles.buttonSubtext}>Стартовые параметры: MEDUMAT, А-ИВЛ/ВВЛ/ВЧп-4/40</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Дополнительная информация внизу */}
                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>
                        ⚠️ Расчёты справочные.{'\n'}
                        Перед применением проверьте их по состоянию пациента и инструкции к аппарату.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default Tabnav_oxy;
