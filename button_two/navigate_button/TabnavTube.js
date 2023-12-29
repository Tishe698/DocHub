import React from 'react';
import { TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';
import buttonStyles from '../../css/tabnavtube/tabnav_styles';

const Tabnav = ({ navigation }) => {
    const handleButtonPress = (screenName) => {
        navigation.navigate(screenName);
    };

    return (
        <SafeAreaView style={buttonStyles.container}>
            <ScrollView contentContainerStyle={{ justifyContent: 'center',marginVertical: "50%" }}>
                <TouchableOpacity
                    style={buttonStyles.button}
                    onPress={() => handleButtonPress('IntubationTubeCalculation')}
                >
                    <Image
                        style={buttonStyles.image}
                        source={require('./Эндтрубки.png')}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={buttonStyles.button}
                    onPress={() => handleButtonPress('Button_Tube_Calculation')}
                >
                    <Image
                        style={buttonStyles.image}
                        source={require('./Лтрубки.png')}
                    />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Tabnav;
