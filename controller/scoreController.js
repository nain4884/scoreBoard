const { Router } = require('express');
const app = Router();
const redis = require('./../config/redisConnection');
const MatchSchema = require("./../models/Match.entity");
const ScoreInning = require("./../models/ScoreInning.entity");
const { getDataSource } = require("./../config/PostGresConnection.js");
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ejs = require("ejs");


app.get('/getMatchScore/:marketId',catchAsyncErrors( async (req, res, next) => {
    const marketId = req.params.marketId;
    if (!marketId) {
        return res.status(500).send('Please send the market id for match.');
    }
    let isJson = false;
    if (req.query && req.query.isJson) {
        isJson = req.query.isJson;
    }
    const AppDataSource = await getDataSource();
    let gameType, teamA, teamB, title, stopAt, startAt, currentInning, striker, nonStriker, bowler, bowlerType;
    let matchDetails = await redis.hGetAll(marketId);
    if (matchDetails) {
        gameType = matchDetails.gameType;
        teamA = matchDetails.teamA;
        teamB = matchDetails.teamB;
        title = matchDetails.title;
        stopAt = matchDetails.stopAt;
        startAt = matchDetails.startAt;
        currentInning = matchDetails.currentInning || 1;
    } else {
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
    let inn1Score = 0, inn1Wicket = 0, inn1over = 0.0, inn1overRuns = '', inn1crr = 0.0, inn1rrr = 0.0, inn1Striker, inn1NonStriker, inn1Bowler, inn1BowlerType, inn1Message, inn1LastOver, inn1TeamName, customMsg;
    let inn1Redis = await redis.hGetAll(marketId + 'Inning1');
    if (inn1Redis) {
        inn1Score = inn1Redis.score;
        inn1over = inn1Redis.over;
        inn1Wicket = inn1Redis.wicket;
        inn1overRuns = inn1Redis.overRuns;
        inn1crr = inn1Redis.crr;
        inn1rrr = inn1Redis.rrr;
        inn1Striker = inn1Redis.striker;
        inn1NonStriker = inn1Redis.nonStriker;
        inn1Bowler = inn1Redis.bowler;
        inn1BowlerType = inn1Redis.bowlerType;
        inn1Message = inn1Redis.message;
        inn1LastOver = inn1Redis.lastOver;
        inn1TeamName = inn1Redis.teamName;
        cutomMsg = inn1Redis.customMsg;
    } else {
        const scoreInningRepo = AppDataSource.getRepository(ScoreInning);
        const scoreInning = await scoreInningRepo
            .createQueryBuilder("scoreInning")
            .where("scoreInning.marketId = :marketId and scoreInning.inningNumber = 1", { marketId })
            .getOne();
        inn1Score = scoreInning.score;
        inn1over = scoreInning.over;
        inn1Wicket = scoreInning.wicket;
        inn1overRuns = scoreInning.overRuns;
        inn1crr = scoreInning.crr;
        inn1rrr = scoreInning.rrr;
        inn1Striker = scoreInning.striker;
        inn1NonStriker = scoreInning.nonStriker;
        inn1Bowler = scoreInning.bowler;
        inn1BowlerType = scoreInning.bowlerType;
        inn1Message = scoreInning.message;
        inn1LastOver = scoreInning.lastOver;
        inn1TeamName = scoreInning.teamName;
        await redis.hSet(marketId + 'Inning1', scoreInning);
    }
    striker = inn1Striker; nonStriker = inn1NonStriker; bowler = inn1Bowler; bowlerType = inn1BowlerType;
    let inn2Score = 0, inn2Wicket = 0, inn2over = 0.0, inn2overRuns = '', inn2crr = 0.0, inn2rrr = 0.0, inn2Striker, inn2NonStriker, inn2Bowler, inn2BowlerType, inn2Message, inn2LastOver, inn2TeamName;
    if (currentInning == 2) {
        let inn2Redis = await redis.hGetAll(marketId + 'Inning2');
        if (inn2Redis) {
            inn2Score = inn2Redis.score;
            inn2over = inn2Redis.over;
            inn2Wicket = inn2Redis.wicket;
            inn2overRuns = inn2Redis.overRuns;
            inn2crr = inn2Redis.crr;
            inn2rrr = inn2Redis.rrr;
            inn2Striker = inn2Redis.striker;
            inn2NonStriker = inn2Redis.nonStriker;
            inn2Bowler = inn2Redis.bowler;
            inn2BowlerType = inn2Redis.bowlerType;
            inn2Message = inn2Redis.message;
            inn2LastOver = inn2Redis.lastOver;
            inn2TeamName = inn2Redis.teamName;
            cutomMsg = inn2Redis.customMsg;
        } else {
            const scoreInningRepo = AppDataSource.getRepository(ScoreInning);
            const scoreInning = await scoreInningRepo
                .createQueryBuilder("scoreInning")
                .where("scoreInning.marketId = :marketId and scoreInning.inningNumber = 2", { marketId })
                .getOne();
            inn2Score = scoreInning.score;
            inn2over = scoreInning.over;
            inn2Wicket = scoreInning.wicket;
            inn2overRuns = scoreInning.overRuns;
            inn2crr = scoreInning.crr;
            inn2rrr = scoreInning.rrr;
            inn2Striker = scoreInning.striker;
            inn2NonStriker = scoreInning.nonStriker;
            inn2Bowler = scoreInning.bowler;
            inn2BowlerType = scoreInning.bowlerType;
            inn2Message = scoreInning.message;
            inn2LastOver = scoreInning.lastOver;
            inn2TeamName = scoreInning.teamName;
            await redis.hSet(marketId + 'Inning2', scoreInning);
        }
        striker = inn2Striker; nonStriker = inn2NonStriker; bowler = inn2Bowler; bowlerType = inn2BowlerType;
    } else {
        inn2TeamName = inn1TeamName == teamA ? teamA : teamB;
    }

    if (isJson) {
        let jsonObj = {
            title, marketId, teamA, teamB, startAt, currentInning,
            innings: [
                { inn1TeamName, inn1Score, inn1over, inn1overRuns, inn1crr, inn1rrr, inn1Striker, inn1NonStriker, inn1Bowler, inn1BowlerType, inn1Message, inn1LastOver },
                { inn2TeamName, inn2Score, inn2over, inn2overRuns, inn2crr, inn2rrr, inn2Striker, inn2NonStriker, inn2Bowler, inn2BowlerType, inn2Message, inn2LastOver }
            ]
        }

        res.json(jsonObj);
        return;
    } else {
        let file = `<style>
        .container {
          background: linear-gradient(0deg, rgb(0 0 0 / 60%), rgb(0 0 0 / 60%)), url("https://www.stageandscreen.travel/sites/default/files/styles/large/public/LP%20-%20Cricket%20Australia.jpg?itok=dStxvjPW");
          background-repeat: no-repeat;
          background-size: cover;
          margin-right: auto;
          margin-left: auto;
          color: white;
          height: 80px;
          align-items: center;
          display: flex;
          justify-content: space-between;
          background-position: bottom;
          position: relative;
          padding: 1% 5%;
          overflow: hidden;
        }
      
        .score-container {
          font-weight: bold;
          text-align: center;
          font-size: 0.9em;
        }
      
        .ball-info {
          position: absolute;
          width: 100%;
          text-align: center;
          top: 5%;
          left: 1%;
          font-size: 1.2em;
          animation: text-animate 3s ease-out infinite;
          transform: translate(-50%, -50%)
        }
      
        .over-run {
          position: absolute;
          width: 100%;
          text-align: center;
          bottom: 5%;
          left: 1%;
        }
      
        @keyframes text-animate {
          0% {
            transform: scale(1);
          }
      
          50% {
            transform: scale(1.25);
          }
      
          100% {
            transform: scale(1);
          }
        }
      
        .striker {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 0.8em;
        }
      
        .bowler {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 0.8em;
        }
      
        @media only screen and (max-width: 767px) {
          .container {
            height: 105px !important;
            padding: 0px;
          }
      
          .score-container {
            width: 30%;
            text-align: center;
            font-size: 0.8em;
          }
        }
      </style>
      
      <div class="container">
        <div class="striker">
          Striker: ${striker}, Non-Striker: ${nonStriker}
        </div>
        <div class="ball-info">
          ${currentInning == 2 ? inn2Message : inn1Message}
        </div>
        <div class="bowler">
          Bowler: ${bowler}(${bowlerType})
        </div>
        <div class="score-container">
          <div>
            ${inn1TeamName}
          </div>
          <div>
            <span>${inn1Score}/${inn1Wicket}</span> <span>${inn1over}</span>
          </div>
          <div>
            CRR : ${inn1crr} | ${inn1rrr}
      
          </div>
        </div>
        <div class="score-container">
          <div>${customMsg}</div>
        </div>
        <div class="over-run">
          ${currentInning == 2 ? inn1overRuns : inn2overRuns}
      
        </div>
        <div class="score-container">
          <div>
            ${inn2TeamName}
          </div>
          <div>
            <span>${inn2Score}/${inn2Wicket}</span> <span>${inn2over}</span>
          </div>
          <div>
            CRR : ${inn2crr} | ${inn2rrr}
          </div>
        </div>
      </div>`;
        res.send(file);
        return;
    }
}));


app.get("/add/:marketId",catchAsyncErrors( async (req, res, next) => {
    const scoreContent = await ejs.renderFile(__dirname + "/../views/addScore.ejs");
  
      res.render("layout/mainLayout", {
        title: "Score",
        body: scoreContent,
      });
}));

app.get("/",catchAsyncErrors( async (req, res, next) => {
  
      res.render("score.ejs");
}));
module.exports = app;