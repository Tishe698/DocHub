// styles.js
import { StyleSheet, Dimensions } from "react-native";

const windowWidth = Dimensions.get('window').width; // Получаем ширину экрана


const buttonStyles = StyleSheet.create({
    buttonContainer_main_screen: {
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop:'1%'
    },
    buttonContainer: {
        borderRadius: 10,
        width: windowWidth * 0.44, // Пример: 40% от ширины экрана
        aspectRatio: 1.07, // Устанавливаем соотношение сторон 1:1 для квадратных кнопок
        marginBottom: 20,
        marginLeft: 10,
        position: "relative",

        justifyContent: "flex-start",
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
    imageStyle: {
        width: '100%', // Изменяем ширину изображения на 50% от родительского контейнера
        height: '70%', // Изменяем высоту изображения на 50% от родительского контейнера
        resizeMode: 'cover',
        position: "absolute",
        top: 0, // Положение сверху
        borderRadius:16
    },
    imageCaption: {
        fontSize: 15,
        bottom: '2%',
        position: "absolute",
        fontWeight: "300",
        paddingHorizontal: '5%',
        fontFamily: 'Mangrove',
        lineHeight: 16,
        opacity: 0.8,
    },



});

export default buttonStyles;
