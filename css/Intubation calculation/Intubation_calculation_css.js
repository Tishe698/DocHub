import { StyleSheet } from 'react-native';

export const styles_intubation_calculation = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', // Фон контейнера
    },
    backButton: {
        // Стили для кнопки назад (HeaderBackButton)
        // Определите здесь свои стили
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginTop: 10,
        marginBottom: 10,
        alignSelf: 'center',
        textAlign: 'center',
        borderColor: '#ccc', // Цвет границы поля ввода
    },
    buttonStyle: {
        marginTop: 10,
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Затемнение фона модального окна
    },
    modalContent: {
        backgroundColor: '#fff',
        width: 250,
        height: 250,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
