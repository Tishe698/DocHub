
import {View, Text, ScrollView} from 'react-native';
import styles from './style_oxy';

const Calc_auxiliary_IVL = () => {



    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header1_ivl}>Проведение вспомогательной {'\n'}ИВЛ</Text>

            <View style={styles.cacl_formula_ivl}>
                <Text style={styles.cacl_formula_text_ivl1}>
                    Аппарат серии А-ИВЛ/ВВЛ
                </Text>
                <Text style={styles.cacl_formula_text_ivl}>
                    -Режим ВВЛ {'\n'}
                    -FiO2: 50-100%;{'\n'}
                    -ДО: 6-8мл/кг;{'\n'}
                    -продолжительность вдоха: 1,2-1,4;{'\n'}
                    -пауза: 4-6с;{'\n'}
                    -максимально допустимое давление в контуре:{'\n'}
                    30 мм вод столба;{'\n'}
                    -ПДКВ: 5-10 мм вод столба{'\n'}
                </Text>
            </View>

            <View style={styles.cacl_formula}>
                <Text style={styles.cacl_formula_text_ivl1}>
                    Аппарат типа MEDUMAT
                </Text>
                <Text style={styles.cacl_formula_text_ivl}>
                    -FiO2-50-100%(Air mix/no air mix);{'\n'}
                    -ЧДД: 14-16;{'\n'}
                    -ДО: 6 - 8 мл/кг;{'\n'}
                    -Установить минутный объем дыхания{'\n'}
                    (МОД = ДО × ЧДД){'\n'}
                    -максимально допустимое давление в контуре:{'\n'}
                    30 мм вод столба;{'\n'}
                    -ПДКВ: 5-10 мм вод столба;{'\n'}
                    -нажать кнопку ASSIST{'\n'}
                </Text>
            </View>
        </ScrollView>
    );
};

export default Calc_auxiliary_IVL;