import React, { useState } from 'react';
import {
    Text,
    TextInput,
    View,
    Modal,
    TouchableOpacity,
    Image,
    TouchableWithoutFeedback,Keyboard,
    Platform,
} from 'react-native';
import { styles_tube_calculate } from '../../css/Tube calculation/Tube calculation_css';
import { calculateIntubationTubeLogic } from './CalculateIntubationTube';

const IntubationTubeCalculation = ({ navigation }) => {
    const [patientWeight, setPatientWeight] = useState('');
    const [tubeInnerDiameter, setTubeInnerDiameter] = useState('');
    const [tubeInsertionDepth, setTubeInsertionDepth] = useState('');
    const [tubeSizeGroup, setTubeSizeGroup] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    const calculateIntubationTube = () => {
        const weight = parseFloat(patientWeight);
        const { innerDiameter, insertionDepth, sizeGroup } = calculateIntubationTubeLogic(weight);

        setTubeInnerDiameter(innerDiameter.toString());
        setTubeInsertionDepth(insertionDepth.toString());
        setTubeSizeGroup(sizeGroup.toString());
        setModalVisible(true);
    };

    const closeModals = () => {
        setModalVisible(false);
        setImageModalVisible(false);
    };

    const openImageModal = () => {
        setImageModalVisible(true);
    };
    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };
    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles_tube_calculate.container}>
                <TouchableOpacity onPress={openImageModal}>
                    <Image
                        source={require('./intub_img.png')}
                        style={{
                            width: 300,
                            height: 300,
                            resizeMode: 'contain',
                            marginTop: 10,
                        }}
                    />
                </TouchableOpacity>

                <View style={styles_tube_calculate.inputContainer}>
                    <View style={styles_tube_calculate.inputContainer1}>
                        <Text style={{ fontSize: 18, marginTop: 10 }}>Введите массу пациента:</Text>
                        <View style={styles_tube_calculate.inputContainer2}>
                            <TextInput
                                onChangeText={(text) => setPatientWeight(text)}
                                value={patientWeight}
                                keyboardType="numeric"
                                style={styles_tube_calculate.input}
                            />
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ marginLeft: 5, fontSize: 18 }}>кг</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity onPress={calculateIntubationTube} style={styles_tube_calculate.button_Tube_calc}>
                    <Text style={{ fontSize: 18, textAlign: 'center', color: '#363636', fontWeight: '300' }}>
                        Рассчитать интубационную трубку
                    </Text>
                </TouchableOpacity>

                <Modal visible={modalVisible} onRequestClose={closeModals}>
                    <View style={styles_tube_calculate.modalContainer}>
                        <View style={styles_tube_calculate.modalContent}>
                            <Text style={{ fontSize: 18 }}>Внутренний диаметр трубки: {tubeInnerDiameter}</Text>
                            <Text style={{ fontSize: 18 }}>Глубина введения: {tubeInsertionDepth}</Text>
                            <Text style={{ fontSize: 18 }}>Размерная группа: {tubeSizeGroup}</Text>
                            <TouchableOpacity onPress={closeModals} style={styles_tube_calculate.closeButton_1}>
                                <Text style={styles_tube_calculate.closeButtonText}>Закрыть</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal visible={imageModalVisible} transparent={true} onRequestClose={closeModals}>
                    <View style={styles_tube_calculate.imageModalContainer}>
                        <TouchableOpacity onPress={closeModals} style={styles_tube_calculate.closeButton}>
                            <Text style={styles_tube_calculate.closeButtonText}>Закрыть</Text>
                        </TouchableOpacity>
                        <Image
                            source={require('./intub_img.png')}
                            style={{
                                width: '90%',
                                height: '90%',
                                resizeMode: 'contain',
                            }}
                        />
                    </View>
                </Modal>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default IntubationTubeCalculation;

