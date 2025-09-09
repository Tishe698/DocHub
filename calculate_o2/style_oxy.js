import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    button_container: {
        flexDirection: "row",
        gap: 30
    },
    buttonReset: {
        backgroundColor: '#2196f3', // Белый фон
        borderRadius: 23,
        shadowColor: '#000',
        shadowOffset: {
            width: 4,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 28,
        elevation: 5,
        paddingHorizontal: 10,
        width: 150,
        height: 40,
        justifyContent: "center",
        marginVertical: 50,
    },
    // Голубой медицинский вариант текста
    buttonText: {
        color: '#1565c0',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'left',
        lineHeight: 22,
        letterSpacing: 0.5,
    },

    container: {
        minHeight:"100%",
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        paddingHorizontal: "10%",
    },
    // Медицинский голубой вариант
    container_2: {
        flex: 1,
        minHeight: "auto",
        backgroundColor: '#f8fbff',
        paddingTop: 20,
    },
    label: {
        fontSize: 18,
        marginBottom: 10,
    },
    label_1: {
        fontSize: 18,
        marginBottom: 5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 200, // Добавлено для растяжения по ширине экрана
        marginBottom: 20, // Подстраиваем отступ под дизайн
    },
    input: {
        width: 60, // Добавлено значение ширины для ввода
        height: 34,
        borderColor: 'gray',
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 15,
    },

    result: {
        marginTop: 10,
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 30
    },
    result_1:{
      fontSize:24
    },
    header1: {
        fontSize: 29,
        fontWeight: '300',
        // Это значение будет автоматически интерпретировано как пиксели в React Native
        color: '#333',
        opacity: 0.7,
        marginVertical: "10%"
    },
    header1_ivl: {
        fontSize: 29,
        fontWeight: '300',
        // Это значение будет автоматически интерпретировано как пиксели в React Native
        color: '#333',
        opacity: 0.7,
        marginVertical: "5%"
    },
    buttonoxygen: {
        backgroundColor: '#FFF', // Белый фон
        borderRadius: 23,
        shadowColor: '#000',
        shadowOffset: {
            width: 4,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 28,
        elevation: 5,
        paddingHorizontal: 10,
        width: 150,
        height: 40,
        justifyContent: "center",
        marginVertical: 50,

    },
    // Медицинский голубой вариант кнопок
    buttonoxygen_2: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#4a90e2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        paddingHorizontal: 20,
        paddingVertical: 18,
        width: '90%',
        minHeight: 85,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 8,
        borderWidth: 2,
        borderColor: '#e3f2fd',
    },
    scrollViewContent: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 20,
        paddingHorizontal: 20,
        minHeight: '100%',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#666666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 25,
        width: '90%',
        borderWidth: 1,
        borderColor: '#e3f2fd',
        shadowColor: '#4a90e2',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 8,
    },
    infoCardText: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
    },
    buttonGroup: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    buttonIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    buttonTextContainer: {
        flex: 1,
    },
    buttonSubtext: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
        lineHeight: 16,
    },
    footerInfo: {
        backgroundColor: '#fff3cd',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        width: 'auto',
        borderWidth: 1,
        borderColor: '#ffeaa7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#856404',
        textAlign: 'center',
        lineHeight: 18,
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 25,
    },
    inputGroup: {
        width: '90%',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1565c0',
        marginBottom: 8,
        lineHeight: 22,
    },
    inputField: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e3f2fd',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        shadowColor: '#4a90e2',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    pressureInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    unitButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 60,
        alignItems: 'center',
    },
    unitButtonActive: {
        backgroundColor: '#2196f3',
        borderColor: '#1976d2',
    },
    unitButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    unitButtonTextActive: {
        color: '#ffffff',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
        marginBottom: 25,
    },
    calculateButton: {
        backgroundColor: '#4caf50',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 14,
        shadowColor: '#4caf50',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    calculateButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    resetButton: {
        backgroundColor: '#f44336',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 14,
        shadowColor: '#f44336',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    resetButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    resultCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 25,
        width: '90%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4caf50',
        shadowColor: '#4caf50',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2e7d32',
        marginBottom: 12,
    },
    resultValue: {
        fontSize: 36,
        fontWeight: '700',
        color: '#4caf50',
        marginBottom: 8,
    },
    resultDescription: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 20,
    },
    formulasSection: {
        width: '90%',
        marginBottom: 25,
    },
    formulasTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1565c0',
        marginBottom: 15,
        textAlign: 'center',
    },
    formulaCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e3f2fd',
        shadowColor: '#4a90e2',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    formulaTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 8,
    },
    formulaText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        fontWeight: '500',
    },
    warningCard: {
        backgroundColor: '#fff3cd',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        width: '90%',
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },
    warningText: {
        fontSize: 14,
        color: '#856404',
        textAlign: 'center',
        lineHeight: 20,
    },
    weightInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    unitLabel: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        minWidth: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#bbdefb',
    },
    unitLabelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976d2',
    },
    // Голубой медицинский вариант заголовка
    header: {
        fontSize: 28,
        fontWeight: '600',
        color: '#1976d2',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
        letterSpacing: 0.5,
    },
    kg_input:{
        flexDirection:"row",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        gap:5,

    },
    cacl_formula:{
        marginVertical: 40,
        gap:10,
    },
    cacl_formula_ivl:{

        gap:10,
    },
    cacl_formula_text:{
        fontSize : 19,
        fontWeight: "500"
    },
    cacl_formula_text_ivl1:{
        fontSize : 22,
        fontWeight: "500"
    },
    cacl_formula_text_ivl:{
        fontSize : 19,
        fontWeight: "300",
        opacity: 0.7,
        lineHeight: 34
    },
    cacl_formula_text_1:{
        fontSize : 26,
        fontWeight: "300"
    }
});
export default styles;