const calculateShockIndex = (systolicBP, pulse) => {
    const index = pulse / systolicBP;

    let bloodLossVolume = '';
    let decreaseInCO = '';

    if (index < 0.8) {
        bloodLossVolume = '0-500 мл';
        decreaseInCO = '0-10%';
    } else if (index >= 0.8 && index <= 1) {
        const bloodLoss = (index - 0.8) * 625 + 500;
        bloodLossVolume = `${Math.round(bloodLoss)} мл`;
        const decrease = (index - 0.8) * 12.5 + 10;
        decreaseInCO = `${Math.round(decrease)}%`;
    } else if (index > 1 && index <= 1.2) {
        const bloodLoss = (index - 1) * 833.33 + 1000;
        bloodLossVolume = `${Math.round(bloodLoss)} мл`;
        const decrease = (index - 1) * 16.67 + 20;
        decreaseInCO = `${Math.round(decrease)}%`;
    } else if (index > 1.2 && index <= 1.5) {
        const bloodLoss = (index - 1.2) * 625 + 1250;
        bloodLossVolume = `${Math.round(bloodLoss)} мл`;
        const decrease = (index - 1.2) * 12.5 + 30;
        decreaseInCO = `${Math.round(decrease)}%`;
    } else if (index > 1.5) {
        const bloodLoss = (index - 1.5) * 500 + 1750;
        bloodLossVolume = `${Math.round(bloodLoss)} мл и более`;
        const decrease = (index - 1.5) * 10 + 40;
        decreaseInCO = `${Math.round(decrease)}% и более`;
    }

    return { shockIndex: index, bloodLossVolume, decreaseInCO };
};

export default calculateShockIndex;
