// Controller.js
const ejs = require("ejs");
const { Router } = require("express");
const { getDataSource } = require("../config/PostGresConnection.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const MatchSchema = require("../models/Match.entity");
const redisClient = require("../config/redisConnection");
const { getMatchByIdService } = require("../services/scoreService");
const { isAuthenticates } = require("../middleware/auth.js");
const app = Router();

app.get(
  "/addmatch",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    const { marketId } = req.query;
    let matchData = null;

    if (marketId) {
      matchData = await getMatchByIdService(res, marketId);
    }

    const gameType = [
      {
        id: "1",
        name: "Cricket",
      },
    ];

    const addMatchContent = await ejs.renderFile(
      __dirname + "/../views/addMatch.ejs",
      {
        gameType: gameType,
        edit: marketId ? true : false,
        matchData: matchData,
      }
    );

    res.render("layout/mainLayout", {
      title: "Add Match",
      body: addMatchContent,
    });
  })
);

app.post(
  "/addMatch",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    let body = req.body;
    if (!body.id && checkCricketRequiredFileds(body)) {
      return res.status(500).send("Add all required fields for add matches");
    }
    const AppDataSource = await getDataSource();
    const matchRepo = AppDataSource.getRepository(MatchSchema);

    let alreadyMatchAdded = await matchRepo.findOne({
      where: { marketId: body.marketId },
    });
    if (!body.id && alreadyMatchAdded) {
      return res.status(500).send("Match already exist.");
    }

    let matchObj = {};
    if (!body.id) {
      matchObj.marketId = body.marketId;
      matchObj.eventId = body.eventId;
      matchObj.competitionId = body.competitionId;
      matchObj.competitionName = body.competitionName;
      matchObj.gameType = body.gameType;
      matchObj.teamA = body.teamA;
      matchObj.teamB = body.teamB;
      matchObj.teamC = body.teamC;
      matchObj.title = body.title;
    } else {
      matchObj = alreadyMatchAdded;
    }
    matchObj.startAt = body.startAt
      ? new Date(body.startAt)
      : alreadyMatchAdded.startAt;
    matchObj.overType = body.overType || alreadyMatchAdded.overType;
    matchObj.totalOver = body.totalOver || alreadyMatchAdded.totalOver;
    matchObj.noBallRun = body.noBallRun || alreadyMatchAdded.noBallRun;

    const newMatch = matchRepo.create(matchObj);
    const saveMatch = await matchRepo.save(newMatch);
    if (saveMatch) {
      let redisObj = {
        gameType: matchObj.gameType,
        teamA: matchObj.teamA,
        teamB: matchObj.teamB,
        title: matchObj.title,
        currentInning: matchObj.currentInning || 1,
        startAt: matchObj?.startAt?.toString(),
        overType: matchObj.overType,
        noBallRun: matchObj.noBallRun,
        totalOver: matchObj.totalOver,
      };
      if (matchObj.stopAt) {
        redisObj.stopAt = matchObj.stopAt.toString();
      }
      await redisClient.hSet(matchObj.marketId, redisObj);
      return res.json(saveMatch);
    } else {
      return req.status(500).send("Error while saving data");
    }
  })
);
app.get(
  "/getMatchById/:marketId",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    const marketId = req.params.marketId;
    const matchData = await getMatchByIdService(res, marketId);
    return res.json(matchData);
  })
);

function checkCricketRequiredFileds(body) {
  let cricketRequiredFileds = [
    "gameType",
    "title",
    "marketId",
    "teamA",
    "teamB",
    "startAt",
    "eventId",
    "overType",
    "noBallRun",
  ];
  return cricketRequiredFileds.some((key) => {
    if (!body[key]) {
      return true;
    }
  });
}

app.get(
  "/",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    const AppDataSource = await getDataSource();
    const matchRepo = AppDataSource.getRepository(MatchSchema);

    const match = await matchRepo
      .createQueryBuilder("match")
      .orderBy("match.startAt", "DESC")
      .getMany();

    const homeContent = await ejs.renderFile(__dirname + "/../views/home.ejs", {
      match,
    });

    res.render("layout/mainLayout", {
      title: "Home",
      body: homeContent,
    });
  })
);

module.exports = app;
