import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

const BloodGroupScreen = () => {
  const [imageSizeMultiplier, setImageSizeMultiplier] = useState(1);

  const handleImagePress = () => {
    setImageSizeMultiplier(prevMultiplier => prevMultiplier === 1 ? 2 : 1);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleImagePress}>
        <Image
          source={require('../assets/bloodgroup.jpeg')}
          style={[
            styles.image,
            { 
              width: 400, 
              height: 400 
            },
          ]}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {}}>
        <Image
          source={require('../assets/rh.jpeg')} 
          style={styles.image}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 400, // Пример ширины второго изображения
    height: 400, // Пример высоты второго изображения
    resizeMode: 'contain',
    marginVertical: 10,
  },
});

export default BloodGroupScreen;
