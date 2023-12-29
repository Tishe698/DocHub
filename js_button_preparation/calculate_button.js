import React, { useState } from 'react';
import {
    View,
    Text,
    Button,
    Modal,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import styles from '../css/calculate_preparation/WelcomeScreenStyles';
import modalStyles from '../css/calculate_preparation/calculates_css';
import formulas from './formulas';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [inputs, setInputs] = useState({});
    const [results, setResults] = useState({});
    const [selectedFormula, setSelectedFormula] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

    const showModal = (formula) => {
        setSelectedFormula(formula);
        setModalVisible(true);
        setInputs({});
        setResults({});
    };

    const hideModal = () => {
        setModalVisible(false);
        setSelectedFormula(null);
        setInputs({});
        setResults({});
    };

    const calculateResult = () => {
        if (selectedFormula) {
            if (selectedFormula.inputs) {
                const hasAllInputs = Object.keys(selectedFormula.inputs).every(
                    (input) => inputs[input] !== undefined
                );

                if (hasAllInputs) {
                    const formulaResults = selectedFormula.formula(inputs);
                    setResults({
                        'Масса препарата': formulaResults.result1,
                        'Объем препарата': formulaResults.result2,
                    });
                } else {
                    setResults({ Ошибка: 'Пожалуйста, введите все необходимые значения.' });
                }
            } else {
                const formulaResults = selectedFormula.formula(Object.values(inputs)[0]);
                setResults({
                    'Масса препарата': formulaResults.result1,
                    'Объем препарата': formulaResults.result2,
                });
            }
        }
    };

    const activateSearch = () => {
        setIsSearchActive(true);
    };

    const deactivateSearch = () => {
        setIsSearchActive(false);
        setSearchTerm('');
    };

    const handleInputChange = (inputName, text) => {
        setInputs({ ...inputs, [inputName]: parseFloat(text) || 0 });
    };

    const renderMedications = () => {
        return (
            <ScrollView style={modalStyles.listContainer}>
                <View style={modalStyles.Button_name_formula}>
                    {isSearchActive
                        ? formulas
                            .filter((formula) =>
                                formula.name.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((formula) => (
                                <View key={formula.name}>
                                    <TouchableOpacity onPress={() => showModal(formula)}>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: 'rgba(51, 51, 51, 1)',
                                                    width: 200,
                                                    fontSize: 18,
                                                    marginTop: 10,
                                                }}
                                            >
                                                {formula.name}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: 'rgba(173, 173, 173, 1)',
                                                    width: 200,
                                                    fontSize: 15,
                                                    marginTop: 10,
                                                }}
                                            >
                                                {formula.description}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))
                        : formulas.map((formula) => (
                            <View key={formula.name}>
                                <TouchableOpacity onPress={() => showModal(formula)}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: 'rgba(51, 51, 51, 1)',
                                                width: 200,
                                                fontSize: 18,
                                                marginTop: 10,
                                            }}
                                        >
                                            {formula.name}
                                        </Text>
                                        <Text
                                            style={{
                                                color: 'rgba(173, 173, 173, 1)',
                                                width: 200,
                                                fontSize: 15,
                                                marginTop: 10,
                                            }}
                                        >
                                            {formula.description}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))}
                </View>
            </ScrollView>
        );
    };

    const renderInputFields = () => {
        if (!selectedFormula) return null;

        const renderWarnings = () => {
            if (selectedFormula.warnings && selectedFormula.warnings.length > 0) {
                return selectedFormula.warnings.map((warning, index) => (
                    <Text key={`warning-${index}`} style={modalStyles.warningText}>
                        Внимание!: {warning}
                    </Text>
                ));
            }
            return null;
        };

        const hasFormulaToCalculate = selectedFormula.formula !== undefined;

        // Проверяем наличие формулы для расчета перед отображением кнопки "Рассчитать"
        return (
            <View style={modalStyles.container_modal}>
                {renderWarnings()}
                {Object.keys(selectedFormula.inputs || {}).map((inputName) => (
                    <TextInput
                        key={inputName}
                        style={modalStyles.inputField}
                        onChangeText={(text) => handleInputChange(inputName, text)}
                        value={inputs[inputName]?.toString() || ''}
                        keyboardType="numeric"
                        placeholder={selectedFormula.inputs[inputName]}
                    />
                ))}

                {hasFormulaToCalculate && (
                    <View style={modalStyles.calculateButton}>
                        <Button
                            title="Рассчитать"
                            onPress={calculateResult}
                        />
                    </View>
                )}
            </View>
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.welcomeText}>
                Введите название препарата или выберите из списка
            </Text>
            <View style={modalStyles.inputContainer}>
                <TextInput
                    style={modalStyles.searchInputWithIcon}
                    placeholder="Поиск формул"
                    placeholderTextColor="#999"
                    onChangeText={(text) => setSearchTerm(text)}
                    value={searchTerm}
                />
                <TouchableOpacity onPress={deactivateSearch} style={modalStyles.crossIcon}>
                    <Image source={require('./Крестик.png')} style={modalStyles.crossImage} />
                </TouchableOpacity>
                {!isSearchActive && (
                    <TouchableOpacity onPress={activateSearch} style={modalStyles.crossIcon2}>
                        <Image source={require('./Лупа.png')} style={modalStyles.crossImage} />
                    </TouchableOpacity>
                )}
            </View>

            {renderMedications()}

            <Modal visible={modalVisible} transparent animationType="slide">
        <View style={modalStyles.modalContainer}>
            <View style={modalStyles.modalContent}>
                {selectedFormula && (
                    <Text style={modalStyles.formulaName_in_container}>
                        {selectedFormula.name}
                    </Text>
                )}
                <Text style={styles.Znachenie_rachet}>Введите значение для расчета:</Text>

                {renderInputFields()}

                {Object.keys(results).map((resultName) => (
                    <Text key={resultName}>
                        {resultName}: {results[resultName]}
                    </Text>
                ))}

                <Button title="Закрыть окно" onPress={hideModal}/>
            </View>
        </View>
    </Modal>
</SafeAreaView>
)
    ;
};

export default WelcomeScreen;