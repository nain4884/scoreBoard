const functions = {};

functions.numberToWords = (number) => {
    const numberWords = ['NO RUN', 'SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR', 'FIVE', 'SIX'];
    // Handle numbers 0 to 10
    if (number >= 0 && number <= 6) {
        return numberWords[number];
    } else {
        return number
    }
}

functions.convertOverToBall = (totalOvers, ballsPerOver) => {
    const wholeOver = Math.floor(totalOvers);
    const OverInBall = (totalOvers % 1).toFixed(1);
    const totalBalls = wholeOver * ballsPerOver + OverInBall * 10;
    return totalBalls;
}

module.exports = functions;
