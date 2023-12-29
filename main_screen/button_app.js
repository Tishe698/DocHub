// ButtonApp.js
import React from 'react';
import { TouchableOpacity, Image, SafeAreaView, FlatList,Text } from 'react-native';
import buttonStyles from '../css/main_screen/styles';


const ButtonApp = ({ navigation }) => {
    const data = [
        { screenName: 'WelcomeScreen', imageSource: require('./Icon1.png'),buttonText: 'Рассчитать \n' +
                'лекарства' },
        { screenName: 'Tabnav', imageSource: require('./Icon2.png'),buttonText: 'Расчет размера \n' +
                'трубок ' },
        { screenName: 'CalcShockIndexScreen', imageSource: require('./icon3.png'),buttonText: 'Рассчитать шоковый \n' +
                'индекс Альговера' },
        { screenName: 'Date_pregnancy', imageSource: require('./icon4.png'),buttonText: 'Рассчитать срок\n' +
                'беременности' },
        { screenName: 'Mkb', imageSource: require('./Icon6.png'),buttonText: 'МКБ-10' },
        { screenName: 'CalculateNormScreen', imageSource: require('./Icon5.png'),buttonText: "Возрастные физиологические нормы для детей "},
        { screenName: 'Tabnav_oxy', imageSource: require('./Icon7.png'),buttonText: 'Рассчет кислорода' },
    ];

    const handleButtonPress = (screenName) => {
        navigation.navigate(screenName);
    };

    const renderButton = ({ item }) => (
        <TouchableOpacity
            style={buttonStyles.buttonContainer}
            onPress={() => handleButtonPress(item.screenName)}
        >
            <Image
                source={item.imageSource}
                style={buttonStyles.imageStyle}
            />
            <Text style={buttonStyles.imageCaption}>{item.buttonText}</Text>

        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 1);' }}>
            <FlatList
                data={data}
                renderItem={renderButton}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2} // Количество колонок в гриде (2 в данном случае)
                contentContainerStyle={buttonStyles.buttonContainer_main_screen}
            />
        </SafeAreaView>
    );
};

export default ButtonApp;
