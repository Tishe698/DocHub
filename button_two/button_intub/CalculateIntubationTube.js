// CalculateIntubationTube.js
export const calculateIntubationTubeLogic = (weight) => {
    let innerDiameter, insertionDepth, sizeGroup;

    if (weight < 0.7) {
        innerDiameter = 2;
        insertionDepth = 5;
        sizeGroup = 5;
    } else if (weight < 1) {
        innerDiameter = 2.5;
        insertionDepth = 5.5;
        sizeGroup = 5;
    } else if (weight < 2) {
        innerDiameter = 3;
        insertionDepth = 6;
        sizeGroup = 6;
    } else if (weight < 3) {
        innerDiameter = 3;
        insertionDepth = 8.5;
        sizeGroup = 7;
    } else if (weight < 3.5) {
        innerDiameter = 3.5;
        insertionDepth = 9;
        sizeGroup = 8;
    } else if (weight < 6) {
        innerDiameter = 3.5;
        insertionDepth = 10;
        sizeGroup = 8;
    } else if (weight < 10) {
        innerDiameter = 4;
        insertionDepth = 11;
        sizeGroup = 8;
    } else if (weight < 12) {
        innerDiameter = 4.5;
        insertionDepth = 12;
        sizeGroup = 8;
    } else if (weight < 14) {
        innerDiameter = 4.5;
        insertionDepth = 13;
        sizeGroup = 8;
    } else if (weight < 16) {
        innerDiameter = 5;
        insertionDepth = 14;
        sizeGroup = 10;
    } else if (weight < 20) {
        innerDiameter = 5.5;
        insertionDepth = 15;
        sizeGroup = 10;
    } else if (weight < 24) {
        innerDiameter = 6;
        insertionDepth = 16;
        sizeGroup = 10;
    } else if (weight < 30) {
        innerDiameter = 6.5;
        insertionDepth = 17;
        sizeGroup = 12;
    } else if (weight < 38) {
        innerDiameter = 7;
        insertionDepth = 18;
        sizeGroup = 12;
    } else if (weight < 50) {
        innerDiameter = 7.5;
        insertionDepth = 19;
        sizeGroup = 12;
    } else if (weight <= 60) {
        innerDiameter = 7.5;
        insertionDepth = 19;
        sizeGroup = 12;
    } else if (weight <= 70) {
        innerDiameter = 8;
        insertionDepth = 20;
        sizeGroup = 12;
    } else {
        innerDiameter = 9;
        insertionDepth = 21;
        sizeGroup = 12;
    }

    return { innerDiameter, insertionDepth, sizeGroup };
};
