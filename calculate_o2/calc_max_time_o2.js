import React, {useState} from 'react';
import {View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert} from 'react-native';
import { Text, TextInput } from '../components/AppText';
import styles from './style_oxy';
import parseNum from '../utils/parseNum';

// Резерв давления по умолчанию, атм. Клинического норматива неснижаемого остатка O2 в РФ
// не найдено: ГОСТ 5583-78, п. 4.3 требует остаток в возвратном баллоне не ниже 0,05 МПа —
// это защита баллона, а не запас для пациента. Поэтому взят консервативный вариант практики СМП:
// 200 psi ≈ 13,8 атм ≈ 14 атм (Texas A&M EMS «Oxygen Duration»; protrainings.uk, «How long does
// an oxygen cylinder last?»). Значение можно изменить на экране.
export const DEFAULT_RESERVE_ATM = 14;

// Пределы правдоподобия ввода. Медицинские баллоны РФ: вместимость 1–40 л, номинальное давление
// 14,7 ± 0,5 или 19,6 ± 1,0 МПа (ГОСТ 5583-78, п. 4.1) — значит, больше 30 МПа (300 атм) не бывает.
export const LIMITS = {
    volumeMin: 0.5, volumeMax: 50,   // л
    pressureMaxAtm: 300,             // атм (бар, кгс/см²)
    pressureMaxMPa: 30,              // МПа
    flowMin: 0.1, flowMax: 60,       // л/мин; выше 25 л/мин — только с предупреждением
    flowWarn: 25,
};

// 1 МПа = 10 бар; с физ. атм (9,87) и кгс/см² (10,2) расхождение ≤ 2%, клинически незначимо.
const MPA_TO_ATM = 10;

// 0.5 → «0,5» для текстов на экране.
const fmt = (x) => String(Math.round(x * 10) / 10).replace('.', ',');

// Склонение слова «минута»: 1 минута, 2–4 минуты, 5–20 минут (с учётом 11–14).
export const pluralMinutes = (n) => {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a >= 11 && a <= 14) return 'минут';
    if (b === 1) return 'минута';
    if (b >= 2 && b <= 4) return 'минуты';
    return 'минут';
};

// «750 минут (12 ч 30 мин)» — часы показываем при 60 минутах и больше.
export const formatMinutes = (min) => {
    const base = `${min} ${pluralMinutes(min)}`;
    if (min < 60) return base;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${base} (${h} ч ${m} мин)`;
};

// Чистый расчёт без интерфейса. Возвращает { error } или результат.
// T = V × (P − Pрезерв) ÷ Q — время до резерва; V × P ÷ Q — теоретический максимум до нуля.
export const computeO2Time = ({ volume, pressure, unit, flow, reserveAtm }) => {
    if (!(volume > 0) || !(pressure > 0) || !(flow > 0)) {
        return { error: 'Объём, давление и скорость потока должны быть числами больше нуля' };
    }
    if (!(reserveAtm >= 0)) {
        return { error: 'Резерв давления должен быть числом не меньше нуля (0 — без резерва)' };
    }
    if (volume < LIMITS.volumeMin || volume > LIMITS.volumeMax) {
        return { error: `Вместимость баллона — от ${fmt(LIMITS.volumeMin)} до ${LIMITS.volumeMax} л (медицинские баллоны 1–40 л)` };
    }
    if (unit === 'MPa' && pressure > LIMITS.pressureMaxMPa) {
        return { error: `Давление больше ${LIMITS.pressureMaxMPa} МПа не бывает. Возможно, давление указано в атм? Переключите единицу на «атм».` };
    }
    if (unit === 'ATM' && pressure > LIMITS.pressureMaxAtm) {
        return { error: `Давление больше ${LIMITS.pressureMaxAtm} атм не бывает. Проверьте показание манометра.` };
    }
    if (flow < LIMITS.flowMin || flow > LIMITS.flowMax) {
        return { error: `Скорость потока — от ${fmt(LIMITS.flowMin)} до ${LIMITS.flowMax} л/мин` };
    }
    const pressureAtm = unit === 'MPa' ? pressure * MPA_TO_ATM : pressure;
    if (reserveAtm >= LIMITS.pressureMaxAtm) {
        return { error: 'Резерв давления больше рабочего давления баллона. Проверьте значение.' };
    }
    // Время округляем вниз — в безопасную сторону.
    const maxMinutes = Math.floor((volume * pressureAtm) / flow);
    const usableAtm = pressureAtm - reserveAtm;
    const empty = usableAtm <= 0;
    const minutes = empty ? 0 : Math.floor((volume * usableAtm) / flow);
    return {
        minutes,
        maxMinutes,
        empty,
        pressureAtm,
        reserveAtm,
        highFlow: flow > LIMITS.flowWarn,
    };
};

const Calc_max_time_o2 = () => {
    const [volume, setVolume] = useState('');
    const [pressure, setPressure] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('ATM'); // По умолчанию атмосферы
    const [flowRate, setFlowRate] = useState('');
    const [reserve, setReserve] = useState(String(DEFAULT_RESERVE_ATM));
    const [result, setResult] = useState(null);

    // Любое изменение ввода сбрасывает старый результат, чтобы он не относился к другим данным.
    const onInput = (setter) => (text) => {
        setter(text);
        setResult(null);
    };
    const selectUnit = (unit) => {
        setSelectedUnit(unit);
        setResult(null);
    };

    const calculateTime = () => {
        const r = computeO2Time({
            volume: parseNum(volume),
            pressure: parseNum(pressure),
            unit: selectedUnit,
            flow: parseNum(flowRate),
            reserveAtm: parseNum(reserve),
        });
        if (r.error) {
            setResult(null);
            Alert.alert('Проверьте данные', r.error);
            return;
        }
        setResult(r);
    };
    const resetFields = () => {
        setVolume('');
        setPressure('');
        setSelectedUnit('ATM');
        setFlowRate('');
        setReserve(String(DEFAULT_RESERVE_ATM));
        setResult(null);
    };

    const unitSegment = (unit, label) => {
        const active = selectedUnit === unit;
        return (
            <TouchableOpacity
                key={unit}
                style={[styles.unitButton, active && styles.unitButtonActive]}
                onPress={() => selectUnit(unit)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
            >
                <Text style={[styles.unitButtonText, active && styles.unitButtonTextActive]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container_2}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fbff" />
            <ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingBottom: 32 }]}>
                {/* Заголовок */}
                <Text style={styles.header}>Время работы баллона</Text>

                {/* Описание */}
                <Text style={styles.subtitle}>
                    Расчет продолжительности кислородотерапии на основе параметров баллона
                </Text>

                {/* Информационная карточка */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>💡 Информация</Text>
                    <Text style={styles.infoCardText}>
                        Расчет основан на вместимости баллона, показании манометра и скорости потока. Время считается до резерва давления, который не расходуют.
                    </Text>
                </View>

                {/* Форма ввода */}
                <View style={styles.formContainer}>
                    {/* Объем баллона */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>📏 Объем баллона кислорода, л</Text>
                        <TextInput
                            style={styles.inputField}
                            value={volume}
                            onChangeText={onInput(setVolume)}
                            keyboardType="numeric"
                            placeholder="Вместимость, л (обычно 1–40)"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Показание манометра */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>📊 Показание манометра</Text>
                        <View style={styles.pressureInputContainer}>
                            <TextInput
                                style={[styles.inputField, { flex: 1 }]}
                                value={pressure}
                                onChangeText={onInput(setPressure)}
                                keyboardType="numeric"
                                placeholder={selectedUnit === 'MPa' ? 'Давление, МПа' : 'Давление, атм'}
                                placeholderTextColor="#999"
                            />
                            {unitSegment('ATM', 'атм')}
                            {unitSegment('MPa', 'МПа')}
                        </View>
                        <Text style={[styles.formulaText, { marginTop: 6 }]}>
                            атм = кгс/см² ≈ бар; 1 МПа = 10 атм
                        </Text>
                    </View>

                    {/* Скорость потока */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>💨 Скорость потока, л/мин</Text>
                        <TextInput
                            style={styles.inputField}
                            value={flowRate}
                            onChangeText={onInput(setFlowRate)}
                            keyboardType="numeric"
                            placeholder="Литры в минуту"
                            placeholderTextColor="#999"
                        />
                        {/* Расход пневмоприводного аппарата ИВЛ не равен МОД: часть O2 идёт на привод,
                            в режиме Air Mix расход меньше МОД (эксплуатационная документация аппаратов). */}
                        <Text style={[styles.formulaText, { marginTop: 6 }]}>
                            При ИВЛ от баллона вводите расход O₂ аппаратом по его паспорту (с учетом привода и режима Air Mix), а не МОД.
                        </Text>
                    </View>

                    {/* Резерв давления */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>🛑 Резерв (не расходовать), атм</Text>
                        <TextInput
                            style={styles.inputField}
                            value={reserve}
                            onChangeText={onInput(setReserve)}
                            keyboardType="numeric"
                            placeholder="0 — без резерва"
                            placeholderTextColor="#999"
                        />
                        <Text style={[styles.formulaText, { marginTop: 6 }]}>
                            Норматива РФ нет. По умолчанию {DEFAULT_RESERVE_ATM} атм (≈200 psi) — консервативная практика СМП. Укажите резерв вашей службы.
                        </Text>
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
                        {result.empty ? (
                            <>
                                <Text style={[styles.resultValue, { color: '#c62828', fontSize: 24, textAlign: 'center' }]}>
                                    Баллон на резерве
                                </Text>
                                <Text style={styles.resultDescription}>
                                    Давление {fmt(result.pressureAtm)} атм не выше резерва {fmt(result.reserveAtm)} атм. Замените баллон.
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.resultValue, { textAlign: 'center' }]}>
                                    {formatMinutes(result.minutes)}
                                </Text>
                                <Text style={styles.resultDescription}>
                                    Расчётное время непрерывной ингаляции до резерва {fmt(result.reserveAtm)} атм
                                </Text>
                            </>
                        )}
                        <Text style={[styles.resultDescription, { marginTop: 8 }]}>
                            До нуля на манометре (теоретический максимум): {formatMinutes(result.maxMinutes)}
                        </Text>
                        {result.highFlow && (
                            <Text style={[styles.resultDescription, { marginTop: 8, color: '#c62828' }]}>
                                Поток выше {LIMITS.flowWarn} л/мин — проверьте, что редуктор его обеспечивает.
                            </Text>
                        )}
                    </View>
                )}

                {/* Формулы расчета */}
                <View style={styles.formulasSection}>
                    <Text style={styles.formulasTitle}>📋 Формулы расчета</Text>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>Давление в атм (кгс/см², бар):</Text>
                        <Text style={styles.formulaText}>
                            Время (мин) = Объем (л) × (Давление − Резерв) ÷ Поток (л/мин)
                        </Text>
                    </View>

                    <View style={styles.formulaCard}>
                        <Text style={styles.formulaTitle}>Давление в МПа:</Text>
                        <Text style={styles.formulaText}>
                            Время (мин) = Объем × (Давление × 10 − Резерв в атм) ÷ Поток
                        </Text>
                    </View>
                </View>

                {/* Предупреждение */}
                <View style={styles.warningCard}>
                    <Text style={styles.warningText}>
                        ⚠️ Готовьте замену баллона заранее, когда давление приближается к резерву.{'\n'}
                        Рекомендуется иметь резервный баллон.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


export default Calc_max_time_o2;
