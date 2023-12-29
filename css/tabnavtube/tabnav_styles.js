import { StyleSheet, Dimensions } from "react-native";

const windowWidth = Dimensions.get('window').width;

const buttonStyles = StyleSheet.create({
    container: {
        flexDirection: "column",
        justifyContent:"center",
        backgroundColor: '#fff',
        height: "100%",
        alignItems: 'center',

    },
    button: {
        width: 300,
        height: 120,
    },
    image: {
        flex: 1,
        width: undefined,
        height: undefined,
        resizeMode: 'contain',
    },
});

export default buttonStyles;
