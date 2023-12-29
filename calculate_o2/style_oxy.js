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
    buttonText: {
        color: '#333',
        fontSize: 19,
        fontWeight: '300',
        textAlign: 'center',
    },

    container: {
        minHeight:"100%",
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        paddingHorizontal: "10%",
    },
    container_2: {
        minHeight:"100%",
        backgroundColor: '#fff',

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
    buttonoxygen_2: {
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
        width: 400,
        height: 80,
        justifyContent: "center",
        marginVertical: 20,
    },
    scrollViewContent: {
        alignItems: 'center',
        justifyContent: 'center',
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