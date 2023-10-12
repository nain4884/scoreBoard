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

functions.calculateCurrRate = (totalRuns, totalOvers, ballsPerOver) => {
    let totalBalls = functions.convertOverToBall(totalOvers, ballsPerOver);
    if(totalBalls == 0) return 0;
    const runRate = (totalRuns / totalBalls) * ballsPerOver;
    return runRate.toFixed(2); // Round to 2 decimal places for a cleaner output
}

functions.calculateRequiredRunRate = (reqRuns, remainingBall, ballsPerOver) => {
    const runRate = (reqRuns / remainingBall) * ballsPerOver;
    return runRate.toFixed(2); // Round to 2 decimal places for a cleaner output
}

module.exports = functions;
