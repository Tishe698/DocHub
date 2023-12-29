import React, { useState, useEffect, useRef } from "react";
import { View, Text, Button, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,TouchableWithoutFeedback,Keyboard, Platform } from "react-native";
import { Video } from 'expo-av';
import DateTimePicker from '@react-native-community/datetimepicker';

const Date_pregnancy = () => {
    const secondVideo = useRef(null);
    const [statusSecondVideo, setStatusSecondVideo] = useState({});
    const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [manualDateInput, setManualDateInput] = useState('');
    const [week, setWeek] = useState(null);
    const [dueDate, setDueDate] = useState(null);
    const [isTyping, setIsTyping] = useState(false); // Состояние для отслеживания ввода текста

    useEffect(() => {
        const calculateWeekAndDueDate = () => {
            if (lastMenstrualPeriod) {
                const today = new Date();
                const daysSinceLMP = (today - lastMenstrualPeriod) / (1000 * 60 * 60 * 24);
                const calculatedWeek = Math.floor(daysSinceLMP / 7);
                setWeek(calculatedWeek);

                const dueDateInMilliseconds = lastMenstrualPeriod.getTime() + (40 * 7 * 24 * 60 * 60 * 1000);
                const dueDate = new Date(dueDateInMilliseconds);
                setDueDate(dueDate);
            }
        };

        calculateWeekAndDueDate();
    }, [lastMenstrualPeriod]);

    const formatRussianDate = (date) => {
        return new Intl.DateTimeFormat('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    const formatInputDate = (value) => {
        if (value.length <= 10) {
            let formattedDate = value.replace(/\D/g, '');
            if (formattedDate.length > 2) {
                formattedDate = `${formattedDate.slice(0, 2)}.${formattedDate.slice(2)}`;
            }
            if (formattedDate.length > 5) {
                formattedDate = `${formattedDate.slice(0, 5)}.${formattedDate.slice(5)}`;
            }
            return formattedDate;
        }
        return value.substring(0, 10);
    };

    const handleManualDateChange = (text) => {
        const formattedDate = formatInputDate(text);
        setManualDateInput(formattedDate);
        setIsTyping(!!text); // Обновляем состояние isTyping на основе наличия текста

        if (formattedDate.length === 10) {
            const dateArray = formattedDate.split('.').map(Number);
            const selectedDate = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);
            setLastMenstrualPeriod(selectedDate);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        setLastMenstrualPeriod(selectedDate || new Date());
    };

    const handleRecalculate = () => {
        setLastMenstrualPeriod(null);
        setManualDateInput('');
    };
    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };
    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : null}
        >
            <View style={styles.container}>
                <View style={styles.container_video}>
                    <Text style={styles.embrion_text}>Инфармационное видео о поэтапном развитии ребенка в утробе матери</Text>
                    <Video
                        ref={secondVideo}
                        style={styles.video}
                        source={require("../g.mp4")}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        onPlaybackStatusUpdate={setStatusSecondVideo}
                    />
                </View>
                <View style={styles.container_date}>
                    {showDatePicker && (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={lastMenstrualPeriod || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        </View>
                    )}
                    {!lastMenstrualPeriod && (
                        <View style={styles.container_button}>
                            <Text style={styles.las_day_menstr}>
                                {'Введите первый день  \n' +
                                    'последней менструации'}
                            </Text>
                            <TextInput
                                placeholder="Введите дату в формате дд.мм.гггг"
                                value={manualDateInput}
                                onChangeText={(text) => {
                                    handleManualDateChange(text);
                                    setIsTyping(!!text); // Обновляем состояние isTyping на основе наличия текста
                                }}
                                style={styles.input}
                                keyboardType="numeric"
                                onFocus={() => setIsTyping(true)} // Обновляем состояние isTyping при фокусе
                                onBlur={() => setIsTyping(false)} // Сбрасываем состояние isTyping при потере фокуса
                            />
                            {!isTyping && ( // Показываем кнопку только если не происходит ввод текста
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.las_day_menstr}>Открыть каледарь</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    {lastMenstrualPeriod && (
                        <View>
                            <Text style={styles.result_pregnancy}>Неделя беременности: {week}</Text>
                            {dueDate && (
                                <Text style={styles.result_pregnancy}>Предполагаемая дата родов: {formatRussianDate(dueDate)}</Text>
                            )}
                            <TouchableOpacity style={styles.button} onPress={handleRecalculate}>
                                <Text style={styles.las_day_menstr_1}>Повторный расчет</Text>
                            </TouchableOpacity>

                        </View>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    result_pregnancy: {
        fontSize : 25,
        fontWeight: "normal",
        marginVertical: 20
    },
    container_button: {
        alignItems: "center"
    },
    container_video: {
        flex: 1,
        alignSelf: 'stretch',
        alignItems: "center",
        justifyContent:"flex-start",
        marginHorizontal: '1%',
        resizeMode:"contain",
        marginTop: 20

    },
    video: {
        width: '100%',
        aspectRatio: 16 / 9, // или соотношение сторон вашего видео
        resizeMode: 'cover' // или 'contain' в зависимости от желаемого эффекта
    },
    buttons_video: {
        margin: 16
    },
    container_date: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    input: {
        backgroundColor: '#FFF', // Белый фон
        borderRadius: 17,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
        paddingHorizontal: 10,
        width: '40%',
        height: '25%'
    },
    button: {
        backgroundColor: '#FFF', // Белый фон
        borderRadius: 17,
        shadowColor: '#000',
        shadowOffset: {
            width: 4,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 28,
        elevation: 5,
        paddingHorizontal: 10,
        width: 250,
        height: '15%',
        textAlign: "center",
        justifyContent:"center",
        marginVertical: 50
    },
    las_day_menstr: {
        fontSize: 19,
        marginVertical: 10,
        fontWeight: "500",
        textAlign: "center"
    },
    las_day_menstr_1: {
        fontSize: 19,
        marginVertical: 10,
        fontWeight: "300",
        textAlign: "center"
    },
    embrion_text:{
        fontSize: 18,
        marginBottom:10,
        textAlign: "center"
    }
});

export default Date_pregnancy;
