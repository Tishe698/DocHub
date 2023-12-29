// ModalStyles.js

import { StyleSheet } from 'react-native';


const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    position: 'relative',
    width: 400,

  },
  container_modal:{
    alignItems: "center",

  },

  searchInputWithIcon: {
    alignItems: 'center', // Установите выравнивание вводимого окна по центру
    textAlign: "center",
    height: 50, // Установите высоту поля ввода
    borderRadius: 17, // Скругление углов поля ввода
    width: 400,
    backgroundColor: "rgba(217, 217, 217, 1)"
  },

  crossIcon: {
    position: 'absolute',
    right: 10, // Расположение крестика справа
    top: '50%', // Позиция крестика по вертикали
    transform: [{ translateY: -10 }], // Сдвиг крестика вверх на половину его высоты
  },
  crossIcon2: {
    position: 'absolute',
    left: 10, // Расположение крестика справа
    top: '50%', // Позиция крестика по вертикали
    transform: [{ translateY: -10 }], // Сдвиг крестика вверх на половину его высоты
  },

  crossImage: {
    width: 24,
    height: 24,
  },
  Button_name_formula:{
    marginTop: 10,

  },
  modalContent: {
    backgroundColor: 'white',
    width: 350, // Установите желаемую ширину
    height: "50%", // Установите желаемую высоту
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    opacity: 1, // Добавлено в стили для поддержки анимации
    transform: [{ scale: 1 }], // Добавлено в стили для поддержки анимации
    gap: 10,
  },
  closeButton: {
    marginTop: 10,
  },
  inputField: {
    width: 200, // Установите желаемую ширину
    height: 50, // Установите желаемую высоту
    backgroundColor: "rgb(255,255,255)",
    borderWidth: 1,
    borderRadius: 26,
    textAlign: "center",
    alignItems:"center",
    marginTop: 10
  },
  Znachenie_rachet: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  formulaName_in_container: {
    fontSize: 20, // здесь указывается желаемый размер шрифта в пунктах
  },
  calculateButton: {
    marginVertical: 20,
    alignItems:"center"
  },
  resultsContainer: {
    marginTop: 10, // Пример отступа для разделения результатов от других элементов
  },
  resultItem: {
    marginBottom: 5, // Пример отступа между результатами (необязательно)
  },
  formulaTouchable: {
    color: '#FFF', // Устанавливает белый цвет текста
  },
  listContainer: {
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
    paddingHorizontal: 10
  },
});

export default styles;
