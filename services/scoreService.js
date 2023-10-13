const { getDataSource } = require("../config/PostGresConnection");
const redisClient = require("../config/redisConnection");
const MatchSchema = require("../models/Match.entity");

exports.getMatchByIdService = async (res,marketId) => {
  let gameType,
    teamA,
    teamB,
    title,
    stopAt,
    startDate,
    currentInning,
    overType,
    totalOver,
    noBallRun;
  let matchDetails = await redisClient.hGetAll(marketId);
  if (matchDetails && Object.keys(matchDetails).length) {
    gameType = matchDetails.gameType;
    teamA = matchDetails.teamA;
    teamB = matchDetails.teamB;
    title = matchDetails.title;
    stopAt = matchDetails.stopAt;
    startDate = matchDetails.startDate;
    overType = matchDetails.overType;
    noBallRun = matchDetails.noBallRun;
    totalOver = matchDetails.totalOver;
    currentInning = matchDetails.currentInning || 1;
  } else {
    const AppDataSource = await getDataSource();
    const matchRepo = AppDataSource.getRepository(MatchSchema);
    let matchDetails = await matchRepo
      .createQueryBuilder("match")
      .where({ marketId })
      .getOne();
    if (!matchDetails) {
      throw "Match Not Found";
    }
    gameType = matchDetails.gameType;
    teamA = matchDetails.teamA;
    teamB = matchDetails.teamB;
    title = matchDetails.title;
    stopAt = matchDetails.stopAt;
    startDate = matchDetails.startDate;
    overType = matchDetails.overType;
    noBallRun = matchDetails.noBallRun;
    totalOver = matchDetails.totalOver;
    currentInning = matchDetails.currentInning || 1;
    let redisObj = {
      gameType: gameType,
      teamA: teamA,
      teamB: teamB,
      title: title,
      currentInning: currentInning,
      startDate: startDate.toString(),
      overType: overType,
      noBallRun: noBallRun,
      totalOver: totalOver,
    };
    if (stopAt) {
      redisObj.stopAt = stopAt.toString();
    }
    await redisClient.hSet(marketId, redisObj);
  }

  return {
    gameType,
    teamA,
    teamB,
    title,
    stopAt,
    startDate,
    overType,
    noBallRun,
    currentInning,
    totalOver,
  };
};
