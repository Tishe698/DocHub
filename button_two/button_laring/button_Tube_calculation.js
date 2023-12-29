import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, View, Modal, Button, TouchableOpacity, Image,TouchableWithoutFeedback,Keyboard } from 'react-native';
import { styles_tube_calculate } from '../../css/Tube calculation/Tube calculation_css';
import calculateTubeLogic from './CalculateTube';

const Button_Tube_Calculation = ({ navigation }) => {
    const [patientWeight, setPatientWeight] = useState('');
    const [patientHeight, setPatientHeight] = useState('');
    const [tubeSize, setTubeSize] = useState('');
    const [tubeColor, setTubeColor] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    const calculateTube = () => {
        const weight = parseFloat(patientWeight);
        const height = parseFloat(patientHeight);

        const { tubeSize: calculatedTubeSize, tubeColor: calculatedTubeColor } = calculateTubeLogic(weight, height);

        setTubeSize(calculatedTubeSize);
        setTubeColor(calculatedTubeColor);
        setModalVisible(true);
    };

    const openImageModal = () => {
        setImageModalVisible(true);
    };

    const closeModals = () => {
        setModalVisible(false);
        setImageModalVisible(false);
    };

    const closeImageModal = () => {
        setImageModalVisible(false);
    };
    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };
    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <SafeAreaView style={styles_tube_calculate.container}>
            <TouchableOpacity onPress={openImageModal}>
                <Image
                    source={require('./ларинг_изображ.png')}
                    style={{
                        width: 400,
                        height: 340,
                        resizeMode: 'contain'
                    }}
                />
            </TouchableOpacity>
            <View style={{...styles_tube_calculate.inputContainer, width: '80%'}}>
                <View style={styles_tube_calculate.inputContainer1}>
                    <Text style={{ fontSize: 18 }}>Введите массу пациента:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            onChangeText={(text) => setPatientWeight(text)}
                            value={patientWeight}
                            keyboardType="numeric"
                            style={styles_tube_calculate.input}
                        />
                        <Text style={{ marginLeft: 5, fontSize: 18 }}>кг</Text>
                    </View>
                </View>
            </View>

            <View style={{...styles_tube_calculate.inputContainer, width: '80%'}}>
                <View style={styles_tube_calculate.inputContainer1}>
                <Text style={{ fontSize: 18 }}>Введите рост пациента:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                        style={styles_tube_calculate.input}
                        onChangeText={(text) => setPatientHeight(text)}
                        value={patientHeight}
                        keyboardType="numeric"
                    />
                    <Text style={{ marginLeft: 5, fontSize: 18 }}>см</Text>
                </View>
            </View>
            </View>


            <TouchableOpacity
                style={styles_tube_calculate.button_Tube_calc}
                onPress={calculateTube}
            >
                <Text style={{ fontSize: 18, textAlign: "center", color: "#363636", fontWeight: "300"}}>Рассчитать трубку</Text>
            </TouchableOpacity>


            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModals}
            >
                <View style={styles_tube_calculate.modalContainer}>
                    <View style={styles_tube_calculate.modalContent}>
                        <Text style={{ fontSize: 18 }}>Размер трубки: {tubeSize}</Text>
                        <Text style={{ fontSize: 18 }}>Цвет трубки: {tubeColor}</Text>
                        <TouchableOpacity onPress={closeModals} style={styles_tube_calculate.closeButton_1}>
                            <Text style={styles_tube_calculate.closeButtonText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={imageModalVisible}
                transparent={true}
                onRequestClose={closeImageModal}
            >
                <View style={styles_tube_calculate.imageModalContainer}>
                    <TouchableOpacity onPress={closeImageModal} style={styles_tube_calculate.closeButton}>
                        <Text style={styles_tube_calculate.closeButtonText}>Закрыть</Text>
                    </TouchableOpacity>
                    <Image
                        source={require('./ларинг_изображ.png')}
                        style={{
                            width: '90%',
                            height: '90%',
                            resizeMode: 'contain'
                        }}
                    />
                </View>
            </Modal>
        </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default Button_Tube_Calculation;
