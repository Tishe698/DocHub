
import {View, Text, ScrollView} from 'react-native';
import styles from './style_oxy';

const Calc_aparat_IVL = () => {



    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header1_ivl}>Проведение аппаратной  {'\n'}ИВЛ</Text>

            <View style={styles.cacl_formula_ivl}>
                <Text style={styles.cacl_formula_text_ivl1}>
                    При остановке кровообращения
                </Text>
                <Text style={styles.cacl_formula_text_ivl}>
                    -FiO2: 100%;{'\n'}-ДО: 6мл*кг;{'\n'}-ЧДД: 10;{'\n'}-максимально допустимое давление{'\n'} в контуре: 30 мм вод столба;{'\n'}-ПДКВ: 5-10 мм вод столба
                </Text>
            </View>

            <View style={styles.cacl_formula}>
                <Text style={styles.cacl_formula_text_ivl1}>
                    При остановке кровообращения
                </Text>
                <Text style={styles.cacl_formula_text_ivl}>
                    -FiO2: 50-100%;{'\n'}-ДО: 8мл*кг;{'\n'}-ЧДД: 14-16;{'\n'}-максимально допустимое давление{'\n'} в контуре: 30 мм вод столба;{'\n'}-ПДКВ: 5-10 мм вод столба
                </Text>
            </View>
        </ScrollView>
    );
};

export default Calc_aparat_IVL;