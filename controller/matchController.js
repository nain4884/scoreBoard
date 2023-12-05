// Controller.js
const ejs = require("ejs");
const { Router } = require("express");
const {
  getDataSource,
  AppDataSource,
} = require("../config/PostGresConnection.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const MatchSchema = require("../models/Match.entity");
const redisClient = require("../config/redisConnection");
const { getMatchByIdService } = require("../services/scoreService");
const { isAuthenticates } = require("../middleware/auth.js");
const app = Router();
const matchRepo = AppDataSource.getRepository(MatchSchema);

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
        value: "cricket",
        name: "Cricket",
      },
      {
        value: "tennis",
        name: "Tennis",
      },
      {
        value: "soccer",
        name: "Soccer",
      },
      {
        value: "ice",
        name: "Ice",
      },
      {
        value: "hockey",
        name: "Hockey",
      },
      {
        value: "volleyball",
        name: "Volleyball",
      },
      {
        value: "politics",
        name: "Politics",
      },
      {
        value: "basketball",
        name: "BasketBall",
      },
      {
        value: "tabletennis",
        name: "Table Tennis",
      },
      {
        value: "darts",
        name: "Darts",
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
    matchObj.teamAShort = body.teamAShort || alreadyMatchAdded.teamAShort;
    matchObj.teamBShort = body.teamBShort || alreadyMatchAdded.teamBShort;

    const newMatch = matchRepo.create(matchObj);
    const saveMatch = await matchRepo.save(newMatch);
    if (saveMatch) {
      let redisObj = {
        gameType: matchObj.gameType,
        teamA: matchObj.teamA,
        teamB: matchObj.teamB,
        teamAShort: matchObj.teamAShort,
        teamBShort: matchObj.teamBShort,
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
      await redisClient.expire(matchObj.marketId, 28800);
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

app.get(
  "/match/:marketId",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    const { marketId } = req.params;

    const matchContent = await ejs.renderFile(
      __dirname + "/../views/matchDetails.ejs",
      {
        marketId: marketId,
      }
    );

    res.render("layout/mainLayout", {
      title: "Match",
      body: matchContent,
    });
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
    const matchCount = await matchRepo
      .createQueryBuilder("match")
      .where("match.stopAt IS NULL")
      .getCount();

    const homeContent = await ejs.renderFile(__dirname + "/../views/home.ejs", {
      matchCount: matchCount,
    });

    res.render("layout/mainLayout", {
      title: "Home",
      body: homeContent,
    });
  })
);

app.get(
  "/match",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    const page = req.query.page || 1;
    let limit = 15;

    const match = await matchRepo
      .createQueryBuilder("match")
      .where("match.stopAt IS NULL")
      .orderBy("match.startAt", "DESC")
      .skip((parseInt(page) - 1) * limit)
      .take(limit)
      .getMany();

    return res.status(200).json({ match });
  })
);

app.post(
  "/match/over",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    const { marketId } = req.body;
    let currMatch = await matchRepo.findOne({
      where: { marketId: marketId },
    });
    if (!currMatch) {
      return res.status(400).send("Please add valid match");
    }
    if (!currMatch?.stopAt) {
      currMatch.stopAt = new Date();
      await redisClient.hSet(
        currMatch.marketId,
        "stopAt",
        JSON.stringify(new Date())
      );
      await redisClient.expire(currMatch.marketId, 28800);
    } else {
      currMatch.stopAt = null;
      await redisClient.hDel(currMatch.marketId, "stopAt");
    }
    await matchRepo.save(currMatch);
    return res.status(200).send("Match over successfully");
  })
);

module.exports = app;
