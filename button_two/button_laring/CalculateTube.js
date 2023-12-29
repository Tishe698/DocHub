    // CalculateTube.js
const calculateTubeLogic = (weight, height) => {
    let tubeSize = '';
    let tubeColor = '';

    if (weight < 5) {
        tubeSize = '0';
        tubeColor = 'Прозрачный';
    } else if (weight >= 5 && weight < 12) {
        tubeSize = '1';
        tubeColor = 'Белый';
    } else if (weight >= 12 && weight <= 25) {
        tubeSize = '2';
        tubeColor = 'Зеленый';
    } else if (height >= 125 && height <= 150) {
        tubeSize = '2.5';
        tubeColor = 'Оранжевый';
    } else if (height < 150) {
        tubeSize = '3';
        tubeColor = 'Желтый';
    } else if (height >= 155 && height <= 180) {
        tubeSize = '4';
        tubeColor = 'Красный';
    } else if (height > 180) {
        tubeSize = '5';
        tubeColor = 'Фиолетовый';
    } else {
        // Добавьте обработку других случаев, если нужно
    }

    return { tubeSize, tubeColor };
};

export default calculateTubeLogic;
