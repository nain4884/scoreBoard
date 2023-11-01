const { Router } = require("express");
const { AppDataSource } = require("../config/PostGresConnection");
const PlayerSchema = require("../models/Player.entity");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { getMatchByIdService } = require("../services/scoreService");
const ejs = require("ejs");
const { Not } = require("typeorm");
const { isAuthenticates } = require("../middleware/auth");

const app = Router();
const playerRepo = AppDataSource.getRepository(PlayerSchema);

app.post(
  "/add",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    try {
      let body = req.body;
      let playerObject = {};
      if (body.id) {
        playerObject = await playerRepo.findOne({
          where: { id: body.id },
        });
        if (!playerObject) {
          return res.status(400).send("Please provide valid id");
        }
        playerObject.marketId = body.marketId || playerObject.marketId;
        playerObject.gameType = body.gameType || playerObject.gameType;
        playerObject.teamName = body.teamName || playerObject.teamName;
        playerObject.playerName = body.playerName || playerObject.playerName;
        playerObject.playerType = body.playerType || playerObject.playerType;
        playerObject.bowlerType = body.bowlerType || playerObject.bowlerType;
      } else {
        playerObject = {
          marketId: body.marketId,
          gameType: body.gameType,
          teamName: body.teamName,
          playerName: body.playerName,
          playerType: body.playerType,
          bowlerType: body.bowlerType,
        };
      }

      const savePlayer = await playerRepo.save(playerObject);
      if (savePlayer) {
        return res.json(savePlayer);
      } else {
        return req.status(500).send("Error while saving data");
      }
    } catch (error) {
      res.status(500).send("error while adding player ", error);
    }
  })
);

app.get(
  "/add/:marketId",
  isAuthenticates,

  catchAsyncErrors(async (req, res, next) => {
    const { marketId } = req.params;
    let matchData = null;
    if (marketId) {
      matchData = await getMatchByIdService(res, marketId);
    }
    const addPlayerContent = await ejs.renderFile(
      __dirname + "/../views/addPlayer.ejs",
      { matchData: matchData, edit: false, marketId: marketId }
    );
    res.render("layout/mainLayout", {
      title: "Add Player",
      body: addPlayerContent,
    });
  })
);

app.post(
  "/getPlayerByMatch",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    let {
      marketId,
      teamName,
      gameType,
      findBowler = false,
      outPlayer = true,
    } = req.body;
    let whereObj = { marketId, gameType };
    let sortObj = { playerName: "ASC" };
    if (findBowler) {
      sortObj = { playerType: "DESC", playerName: "ASC" };
    } else {
      if (!outPlayer) {
        whereObj.isPlayerOut = false;
      }
    }
    if (teamName) {
      whereObj.teamName = teamName;
    }
    let player = await playerRepo.find({ where: whereObj, order: sortObj });
    let returnData = {};
    if (!findBowler) {
      returnData.batsman = player;
      let bowler = await playerRepo.find({
        where: { marketId, gameType, teamName: Not(teamName) },
        order: { playerType: "DESC", bowlerType: "ASC", playerName: "ASC" },
      });
      returnData.bowler = bowler;
    } else {
      returnData.bowler = player;
    }
    res.json(returnData);
  })
);

module.exports = app;
