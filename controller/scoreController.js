const { Router } = require('express'); 
const app = Router(); 
const redis = require('./../config/redisConnection');
const MatchSchema = require("./../models/Match.entity");
const ScoreInning = require("./../models/ScoreInning.entity");
  
app.get('/getMatchScore/:marketId', async (req, res, next) => { 
    const marketId = req.params.marketId;
    if(!marketId){
        return res.status(500).send('Please send the market id for match.');
    }
    let gameType, teamA, teamB, title, stopAt, startAt, currentInning;
    let matchDetails = await redis.hGetAll(marketId);
    if(matchDetails){
        gameType = matchDetails.gameType;
        teamA = matchDetails.teamA;
        teamB = matchDetails.teamB;
        title = matchDetails.title;
        stopAt = matchDetails.stopAt;
        startAt = matchDetails.startAt;
        currentInning = matchDetails.currentInning;
    } else {
        const AppDataSource = await getDataSource();
        const matchRepo = AppDataSource.getRepository(MatchSchema);
        const matchDetails = await matchRepo
        .createQueryBuilder("match")
        .where("match.marketId = :marketId", { marketId })
        .getOne();
        gameType = matchDetails.gameType;
        teamA = matchDetails.teamA;
        teamB = matchDetails.teamB;
        title = matchDetails.title;
        stopAt = matchDetails.stopAt;
        startAt = matchDetails.startAt;
        currentInning = matchDetails.currentInning;
        await redis.hSet(marketId, matchDetails);
    }
    let teamAScore,teamAover, teamAoverRuns, teamAcrr, teamArrr, teamAStriker, teamANonStriker, teamABowler, teamABowlerType, teamAMessage, teamALastOver;
    let teamARedis

    res.send(marketId);
}); 
  
module.exports = app;