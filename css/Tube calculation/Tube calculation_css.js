// styles.js
import { StyleSheet } from 'react-native';

export const styles_tube_calculate = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  button_Tube_calc:{
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
    width: 300,
    height: 80,
    textAlign: "center",
    justifyContent:"center",
    marginVertical: 10
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: 'white',
    width: 400, // Установите желаемую ширину
    height: 350, // Установите желаемую высоту
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    opacity: 1, // Добавлено в стили для поддержки анимации
    transform: [{ scale: 1 }], // Добавлено в стили для поддержки анимации
    gap: 30,
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  Button_name_formula:{
    marginTop: 10,
  },
  inputContainer1:{
    width:270,
    alignItems: 'flex-start',
    flexDirection:"column",
    marginTop: 10,

  },
  inputContainer2:{
    flexDirection:"row",
  },
  input:{
    width: 117, // Размер по вашему усмотрению
    height: 34,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom : 30,
    fontSize: 24,
    backgroundColor: 'rgb(255,255,255)',
    borderWidth: 1
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
  closeButton_1:{
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 5,
    zIndex: 1, // Добавлено свойство zIndex
    borderWidth: 1
  },
  closeButtonText: {
    color: "black",
    fontWeight: "bold",
  },
});