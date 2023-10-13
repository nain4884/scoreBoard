const { Router } = require("express");
const { getDataSource } = require("../config/PostGresConnection");
const PlayerSchema = require("../models/Player.entity");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { getMatchByIdService } = require("../services/scoreService");
const ejs = require("ejs");

const app = Router();

app.post(
  "/add",
  catchAsyncErrors(async (req, res, next) => {
    let body = req.body;

    const AppDataSource = await getDataSource();
    const playerRepo = AppDataSource.getRepository(PlayerSchema);

    let playerObject = {};

    if (body.id) {
      playerObject = await playerRepo.findOne({
        where: { id: body.id },
      });

      if (!playerObject) {
        return res.status(400).send("Please provide valid id");
      }

      playerObject.marketId = body.marketId;
      playerObject.gameType = body.gameType;
      playerObject.teamName = body.teamName;
      playerObject.playerName = body.playerName;
      playerObject.playerType = body.playerType;
      playerObject.bowlerType = body.bowlerType;
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

    console.log(playerObject)

    const savePlayer = await playerRepo.save(playerObject);
    if (savePlayer) {
      return res.json(savePlayer);
    } else {
      return req.status(500).send("Error while saving data");
    }
  })
);

app.get(
  "/add/:marketId",
  catchAsyncErrors(async (req, res, next) => {
    const { marketId } = req.params;
    let matchData = null;

    if (marketId) {
      matchData = await getMatchByIdService(marketId);
    }

    const addPlayerContent = await ejs.renderFile(
      __dirname + "/../views/addPlayer.ejs",
      { matchData: matchData, edit: false }
    );

    res.render("layout/mainLayout", {
      title: "Add Player",
      body: addPlayerContent,
    });
  })
);

module.exports = app;
