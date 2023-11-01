const { Router } = require("express");
const app = Router();
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ejs = require("ejs");
const { getMatchByIdService } = require("../services/scoreService");
const { isAuthenticates } = require("../middleware/auth");
const redisClient = require("../config/redisConnection");
const { AppDataSource } = require("../orm.config");
const ScoreInning = require("../models/ScoreInning.entity");
const MatchSchema = require("../models/Match.entity");

const matchRepo = AppDataSource.getRepository(MatchSchema);
const scoreInningRepo = AppDataSource.getRepository(ScoreInning);

app.get(
    "/:marketId",
  isAuthenticates,

    catchAsyncErrors(async (req, res, next) => {
      const { marketId } = req.params;
      const matchData = await getMatchByIdService(res, marketId);
  
      const tossContent = await ejs.renderFile(
        __dirname + "/../views/addToss.ejs",
        {
            matchData: matchData,
            marketId:marketId
        }
      );
      res.render("layout/mainLayout", {
        title: "Toss",
        body: tossContent,
      });
    })
  );

  app.post(
    "/addToss",
    isAuthenticates,
  
    catchAsyncErrors(async (req, res, next) => {
      let { marketId, teamName, firstChoose } = req.body;
      if (!(marketId && teamName && firstChoose)) {
      }
      let matchDetails = await redisClient.hGetAll(marketId);
      matchDetails.tossWin = teamName;
      matchDetails.currentInning = 1;
      if (firstChoose.toLowerCase() == "ball") {
        matchDetails.firstBatTeam =
          matchDetails.teamA == teamName
            ? matchDetails.teamB
            : matchDetails.teamA;
      } else {
        matchDetails.firstBatTeam =
          matchDetails.teamA == teamName
            ? matchDetails.teamA
            : matchDetails.teamB;
      }
  
      let scoreInning = await scoreInningRepo
        .createQueryBuilder("scoreInning")
        .where(
          "scoreInning.marketId = :marketId and scoreInning.inningNumber = 1",
          { marketId }
        )
        .getOne();
      let newInning;
      if (scoreInning) {
        newInning = {
          score: scoreInning.score,
          over: scoreInning.over,
          wicket: scoreInning.wicket,
          overRuns: scoreInning.overRuns,
          crr: scoreInning.crr,
          rrr: scoreInning.rrr,
          striker: scoreInning.striker,
          nonStriker: scoreInning.nonStriker,
          bowler: scoreInning.bowler,
          bowlerType: scoreInning.bowlerType,
          teamName: matchDetails.firstBatTeam,
          message: scoreInning.message,
          lastOver: scoreInning.lastOver,
        };
        scoreInning.teamName = matchDetails.firstBatTeam;
        scoreInning.currentInning = 1;
        scoreInning.startAt = new Date();
        scoreInning.gameType = "Cricket";
        await scoreInningRepo.save(scoreInning);
      } else {
        newInning = {
          score: 0,
          over: 0,
          wicket: 0,
          overRuns: "",
          crr: 0,
          rrr: 0,
          striker: "",
          nonStriker: "",
          bowler: "",
          bowlerType: "",
          teamName: matchDetails.firstBatTeam,
          message: "",
          lastOver: "",
        };
        newInning.inningNumber = 1;
        newInning.marketId = marketId;
        newInning.title = matchDetails.title;
        newInning.gameType = "Cricket";
        await scoreInningRepo.save(newInning);
      }
      newInning.startAt = new Date();
      newInning.startAt = newInning.startAt.toString();
      newInning.stopAt = newInning.stopAt?.toString() || "";
      newInning.message = `Toss won by ${teamName} and choose first ${firstChoose}`;
      await redisClient.hSet(marketId + "Inning1", newInning);
      matchRepo.update(
        { marketId: marketId },
        { tossWin: matchDetails.tossWin, firstBatTeam: matchDetails.firstBatTeam }
      );
      res.send("toss save");
    })
  );
module.exports = app;
