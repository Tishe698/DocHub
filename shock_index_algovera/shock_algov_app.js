import React, {useEffect, useState} from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    Image,
    Modal,
    TouchableOpacity,
    View
} from "react-native";
import calculateShockIndex from "./calculateShockIndex";

const CalcShockIndexScreen = ({navigation}) => {
    const [systolicBP, setSystolicBP] = useState(120);
    const [pulse, setPulse] = useState(100);
    const [shockIndexInfo, setShockIndexInfo] = useState({
        shockIndex: 0,
        bloodLossVolume: '',
        decreaseInCO: ''
    });
    const [imageModalVisible, setImageModalVisible] = useState(false);

    useEffect(() => {
        const shockInfo = calculateShockIndex(systolicBP, pulse);
        setShockIndexInfo(shockInfo);
    }, [systolicBP, pulse]);
    const closeImageModal = () => {
        setImageModalVisible(false);
    };

    const openImageModal = () => {
        setImageModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container_container}>
            <View style={styles.container}>
                <Text style={{fontSize: 27,}}>
                    Шоковый индекс Альговера
                </Text>
                <Text style={{fontSize: 15, color: '#363636', opacity: 0.7}}>
                    Предназначен для оценки тяжести шока. С его помощью можно уточнить объем кровопотери у больного.
                </Text>
                <Text style={{fontSize: 18,}}>
                    Индекс Альговера = П / САД
                </Text>
            </View>

            <View style={styles.container_znacheniy}>
                <View style={styles.container_znacheniy1}>
                    <Text style={styles.znacheniy_text1}>Введите пульс</Text>
                    <View style={styles.container_znacheniy2}>
                        <TextInput
                            onChangeText={(text) => setPulse(parseInt(text))}
                            style={styles.input}
                        />
                        <Text style={styles.znacheniy_text}>уд. в мин.</Text>
                    </View>
                </View>
                <View style={styles.container_znacheniy1}>
                    <Text style={styles.znacheniy_text1}>Введите Систолическое АД</Text>
                    <View style={styles.container_znacheniy2}>
                        <TextInput
                            onChangeText={(text) => setSystolicBP(parseInt(text))}
                            style={styles.input}
                        />
                        <Text style={styles.znacheniy_text}>мм рт.ст</Text>
                    </View>
                </View>
            </View>
            <View style={styles.container_result}>
                <Text style={styles.result}>Шоковый индекс равен: {shockIndexInfo.shockIndex.toFixed(2)}</Text>
                <Text style={styles.result}>Объем кровопотери: {shockIndexInfo.bloodLossVolume}</Text>
                <Text style={styles.result}>Снижение ОЦК: {shockIndexInfo.decreaseInCO}</Text>
            </View>
            <TouchableOpacity onPress={openImageModal}>
                <View style={styles.container1}>
                    <Image
                        source={require("./image2.png")}
                        style={styles.image}
                    />
                </View>
            </TouchableOpacity>
            {/* Модальное окно с изображением */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                onRequestClose={closeImageModal}
            >
                <View style={styles.imageModalContainer}>
                    <TouchableOpacity onPress={closeImageModal} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Закрыть</Text>
                    </TouchableOpacity>
                    <Image
                        source={require("./image2.png")}
                        style={styles.modalImage}
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container_container:{
        backgroundColor: '#fff',
        height: "100%"
    },
    container: {
        justifyContent: "flex-start",
        alignItems: "flex-start",
        marginHorizontal:20,
        backgroundColor: '#fff',
    },
    container1: {
        marginTop: 40
    },
    znacheniy_text: {
        color: "rgba(51, 51, 51, 1)",
        fontFamily: 'Mangrove',
        fontWeight: "bold",
        fontSize: 15,
    },
    znacheniy_text1: {
        color: "rgba(51, 51, 51, 1)",
        fontFamily: 'Mangrove',
        fontWeight: "bold",
        fontSize: 17
    },
    container_result:{
    justifyContent: "flex-start",
        width: 400,
        marginHorizontal: 20,
        backgroundColor: '#fff',
    },
    image: {
        width: "100%",
        height: 400,
        resizeMode: "contain",

    },
    container_znacheniy: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 20,
        backgroundColor: '#fff',
    },
    container_znacheniy1: {
        flexDirection: "column"

    },
    container_znacheniy2: {
        flexDirection: "row",
        alignItems: "center",

    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    input: {
        width: 90,
        height: 40,
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 17,
        fontSize: 15,
        borderWidth: 1,
    },
    result: {
        fontSize: 18,
        textAlign: "left",
        marginVertical: 5,
        fontFamily: 'Mangrove',
        fontWeight: "bold",
    },
    imageModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)'
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
        backgroundColor: "white",
        padding: 20,
        borderRadius: 5,
        zIndex: 1, // Добавлено свойство zIndex
    },
    closeButtonText: {
        color: "black",
        fontWeight: "bold",
    },
});

export default CalcShockIndexScreen;
