const { Router } = require("express");
const app = Router();
const redisClient = require("./../config/redisConnection");
const MatchSchema = require("./../models/Match.entity");
const ScoreInning = require("./../models/ScoreInning.entity");
const PlayerSchema = require("../models/Player.entity");
const {
  getDataSource,
  AppDataSource,
} = require("./../config/PostGresConnection.js");
const {
  numberToWords,
  convertOverToBall,
  calculateCurrRate,
  calculateRequiredRunRate,
} = require("./../config/utils.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ejs = require("ejs");
const { getMatchByIdService } = require("../services/scoreService");
const { isAuthenticates } = require("../middleware/auth");

const matchRepo = AppDataSource.getRepository(MatchSchema);
const scoreInningRepo = AppDataSource.getRepository(ScoreInning);
const playerRepo = AppDataSource.getRepository(PlayerSchema);

app.get(
  "/getMatchScore/:marketId",
  catchAsyncErrors(async (req, res, next) => {
    const marketId = req.params.marketId;
    if (!marketId) {
      return res.status(500).send("Please send the market id for match.");
    }
    let isJson = false;
    if (req.query && req.query.isJson) {
      isJson = req.query.isJson;
    }
    let gameType,
      teamA,
      teamB,
      title,
      stopAt,
      startAt,
      currentInning,
      striker,
      nonStriker,
      bowler,
      bowlerType,
      overType,
      totalOver,
      noBallRun,
      tossWin,
      firstBatTeam;
    let matchDetails = await redisClient.hGetAll(marketId);
    if (matchDetails && Object.keys(matchDetails).length) {
      gameType = matchDetails.gameType;
      teamA = matchDetails.teamA;
      teamB = matchDetails.teamB;
      title = matchDetails.title;
      stopAt = matchDetails.stopAt;
      startAt = matchDetails.startAt;
      totalOver = matchDetails.totalOver;
      currentInning = matchDetails.currentInning || 1;
      tossWin = matchDetails.tossWin;
      firstBatTeam = matchDetails.firstBatTeam;
    } else {
      matchDetails = await matchRepo
        .createQueryBuilder("match")
        .where({ marketId })
        .getOne();
      if (!matchDetails) {
        return res.status(500).send("Match not found.");
      }
      gameType = matchDetails.gameType;
      teamA = matchDetails.teamA;
      teamB = matchDetails.teamB;
      title = matchDetails.title;
      stopAt = matchDetails.stopAt;
      startAt = matchDetails.startAt;
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
        startAt: startAt.toString(),
        overType: overType,
        noBallRun: noBallRun,
        totalOver: totalOver,
      };
      if (stopAt) {
        redisObj.stopAt = stopAt.toString();
      }
      if (matchDetails.tossWin) {
        redisObj.tossWin = matchDetails.tossWin;
        tossWin = matchDetails.tossWin;
        redisObj.firstBatTeam = matchDetails.firstBatTeam;
        firstBatTeam = matchDetails.firstBatTeam;
      }
      await redisClient.hSet(marketId, redisObj);
    }
    let inn1Score = 0,
      inn1Wicket = 0,
      inn1over = 0.0,
      inn1overRuns = "",
      inn1crr = 0.0,
      inn1rrr = 0.0,
      inn1Striker,
      inn1NonStriker,
      inn1Bowler,
      inn1BowlerType,
      inn1Message,
      inn1LastOver,
      inn1TeamName,
      customMsg;
    let inn1Redis = await redisClient.hGetAll(marketId + "Inning1");
    if (inn1Redis && Object.keys(inn1Redis).length) {
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
      customMsg = inn1Redis.customMsg || "";
    } else {
      let scoreInning = await scoreInningRepo
        .createQueryBuilder("scoreInning")
        .where(
          "scoreInning.marketId = :marketId and scoreInning.inningNumber = 1",
          { marketId }
        )
        .getOne();
      if (!scoreInning) {
        let redisObj = {
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
          teamName: matchDetails.teamA,
          message: "",
          lastOver: "",
        };
        const newInning = scoreInningRepo.create(redisObj);
        newInning.inningNumber = 1;
        newInning.marketId = marketId;
        newInning.title = matchDetails.title;
        newInning.startAt = new Date();
        newInning.gameType = "Cricket";
        scoreInning = newInning;
        await scoreInningRepo.save(newInning);
      }
      inn1Score = scoreInning.score || inn1Score;
      inn1over = scoreInning.over || inn1over;
      inn1Wicket = scoreInning.wicket || inn1Wicket;
      inn1overRuns = scoreInning.overRuns || "";
      inn1crr = scoreInning.crr || inn1crr;
      inn1rrr = scoreInning.rrr || inn1rrr;
      inn1Striker = scoreInning.striker || "";
      inn1NonStriker = scoreInning.nonStriker || "";
      inn1Bowler = scoreInning.bowler || "";
      inn1BowlerType = scoreInning.bowlerType || "";
      inn1Message = scoreInning.message || "";
      inn1LastOver = scoreInning.lastOver || "";
      inn1TeamName = scoreInning.teamName || firstBatTeam || teamA;
      let redisObj = {
        score: inn1Score,
        over: inn1over,
        wicket: inn1Wicket,
        overRuns: inn1overRuns,
        crr: inn1crr,
        rrr: inn1rrr,
        striker: inn1Striker,
        nonStriker: inn1NonStriker,
        bowler: inn1Bowler,
        bowlerType: inn1BowlerType,
        teamName: inn1TeamName,
        message: inn1Message,
        lastOver: inn1LastOver,
      };
      await redisClient.hSet(marketId + "Inning1", redisObj);
    }
    striker = inn1Striker;
    nonStriker = inn1NonStriker;
    bowler = inn1Bowler;
    bowlerType = inn1BowlerType;

    let inn2Score = 0,
      inn2Wicket = 0,
      inn2over = 0.0,
      inn2overRuns = "",
      inn2crr = 0.0,
      inn2rrr = 0.0,
      inn2Striker,
      inn2NonStriker,
      inn2Bowler,
      inn2BowlerType,
      inn2Message,
      inn2LastOver,
      inn2TeamName;
    if (parseInt(currentInning) == 2) {
      let inn2Redis = await redisClient.hGetAll(marketId + "Inning2");
      if (inn2Redis && Object.keys(inn2Redis).length) {
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
        customMsg = inn2Redis.customMsg || "";
      } else {
        let scoreInning = await scoreInningRepo
          .createQueryBuilder("scoreInning")
          .where(
            "scoreInning.marketId = :marketId and scoreInning.inningNumber = 2",
            { marketId }
          )
          .getOne();
        if (!scoreInning) {
          let redisObj = {
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
            teamName: matchDetails.teamB,
            message: "",
            lastOver: "",
          };
          const newInning = scoreInningRepo.create(redisObj);
          newInning.inningNumber = 2;
          newInning.marketId = marketId;
          newInning.title = matchDetails.title;
          newInning.startAt = new Date();
          newInning.gameType = "Cricket";
          scoreInning = newInning;
          await scoreInningRepo.save(newInning);
        }
        inn2Score = scoreInning.score || inn2Score;
        inn2over = scoreInning.over || inn2over;
        inn2Wicket = scoreInning.wicket || inn2Wicket;
        inn2overRuns = scoreInning.overRuns || "";
        inn2crr = scoreInning.crr || inn2crr;
        inn2rrr = scoreInning.rrr || inn2rrr;
        inn2Striker = scoreInning.striker || "";
        inn2NonStriker = scoreInning.nonStriker || "";
        inn2Bowler = scoreInning.bowler || "";
        inn2BowlerType = scoreInning.bowlerType || "";
        inn2Message = scoreInning.message || "";
        inn2LastOver = scoreInning.lastOver || "";
        inn2TeamName =
          scoreInning.teamName ||
          (firstBatTeam && firstBatTeam == teamA ? teamA : teamB);

        let redisObj = {
          score: inn2Score,
          over: inn1over,
          wicket: inn1Wicket,
          overRuns: inn1overRuns,
          crr: inn1crr,
          rrr: inn1rrr,
          striker: inn1Striker,
          nonStriker: inn1NonStriker,
          bowler: inn1Bowler,
          bowlerType: inn1BowlerType,
          teamName: inn1TeamName,
          message: inn2Message,
          lastOver: inn2LastOver,
        };
        await redisClient.hSet(marketId + "Inning2", redisObj);
      }
      striker = inn2Striker;
      nonStriker = inn2NonStriker;
      bowler = inn2Bowler;
      bowlerType = inn2BowlerType;
    } else {
      inn2TeamName = inn1TeamName == teamA ? teamB : teamA;
    }

    if (isJson) {
      let jsonObj = {
        title,
        marketId,
        teamA,
        teamB,
        startAt,
        currentInning,
        innings: [
          {
            inn1TeamName,
            inn1Score,
            inn1over,
            inn1overRuns,
            inn1crr,
            inn1rrr,
            inn1Striker,
            inn1NonStriker,
            inn1Bowler,
            inn1BowlerType,
            inn1Message,
            inn1LastOver,
          },
          {
            inn2TeamName,
            inn2Score,
            inn2over,
            inn2overRuns,
            inn2crr,
            inn2rrr,
            inn2Striker,
            inn2NonStriker,
            inn2Bowler,
            inn2BowlerType,
            inn2Message,
            inn2LastOver,
          },
        ],
      };

      res.json(jsonObj);
      return;
    } else {
      let file = `<style>
      html,body{ padding: 0; margin: 0; }
      .container-main {
      padding: 10;
      background: linear-gradient(0deg, rgb(0 0 0 / 39%), rgb(0 0 0 / 30%)),url(https://www.stageandscreen.travel/sites/default/files/styles/large/public/LP%20-%20Cricket%20Australia.jpg?itok=dStxvjPW);
      background-repeat: no-repeat;
      background-size: cover;
      margin-right: auto;
      margin-left: auto;
      color: white;
      height: 15vh;
      align-items: center;
      display: grid;
      background-position: bottom;
      position: relative;
      }
      @media only screen and (max-width: 767px) {
      .container-main {
      height: 105px !important;
      }
      }
      .row-ctm {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 0px 0;
      }
      .team {
      flex: 0 0 25%;
      max-width: 25%;
      text-align: center;
      }
      .match_status {
      flex: 0 0 50%;
      max-width: 50%;
      text-align: center;
      text-transform: uppercase;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0px;
      padding: 4px 0;
      }
      .inn1 {
      font-size: 10px;
      font-weight: 600;
      font-style: italic;
      color: #fff;
      width: max-content;
      margin: 0 auto;
      padding: 5px;
      }
      .curr_inn {
      font-size: 12px;
      font-weight: 600;
      }
      .team_name {
      text-transform: capitalize;
      font-size: 14px;
      margin: 0;
      font-weight: 600;
      }
      .day {
      width: 100%;
      display: block;
      text-transform: capitalize;
      font-size: 10px;
      }
      .status {
      width: 100%;
      }
      .day:before {
      color: #fff;
      margin: 0 5px;
      }
      .day:after {
      color: #fff;
      margin: 0 5px;
      }
      .team_name img {
      padding-left: 5px;
      vertical-align: middle;
      }
      .score-over ul {
      padding: 0;
      margin:0;
      }
      .score-over ul li {
      display: inline-block;
      color: #fff;
      }
      .score-over ul li p{
      margin: 0;
      }
      .six-balls{
      padding : 2px;
      font-size : 17px;
      }
      .target{
        font-size : 9px;
        margin-top:25px;
        margin-bottom:5px;
      }
      .commantry {
        -webkit-animation: txt 3s ease-out infinite;
        animation: txt 3s ease-out infinite;
        font-family: tahomabd;
        font-size: 12px;
        width: 50%;
        display:block;
        position: absolute;
        top: 5%;
        -webkit-transform: translate(-50%,-50%);
        transform: translate(-50%,-50%)
      }
      @-webkit-keyframes txt {
        0% {
            -webkit-transform: scale(1);
            transform: scale(1)
        }
      
        50% {
            -webkit-transform: scale(1.25);
            transform: scale(1.25)
        }
      
        100% {
            -webkit-transform: scale(1);
            transform: scale(1)
        }
      
      }
      
      @keyframes txt {
        0% {
          -webkit-transform: scale(1);
          transform: scale(1)
      }
      
      50% {
          -webkit-transform: scale(1.25);
          transform: scale(1.25)
      }
      
      100% {
          -webkit-transform: scale(1);
          transform: scale(1)
      }
      }
      
      .striker {
        flex: 0 0 25%;
        max-width: 50%;
        text-align: center;
      }
    
      .bowler {
        flex: 0 0 25%;
        max-width: 25%;
        text-align: center;
}
      }
      </style>
              <div class="container-main">
              <div class="row-ctm"> 
              <div class="team">
                <div>
                  Striker: ${striker}, Non-Striker: ${nonStriker}
                </div>
              </div>
              <div class="match_status"></div>
              <div class="team">
                <div>
                  Bowler: ${bowler}(${bowlerType})
                </div>
              </div>
              </div>
              <div class="row-ctm">
              ${
                parseInt(currentInning) == 1
                  ? `<div class="team">
                  <div class="team_name">${inn1TeamName}</div>
                  <div class="curr_inn">
                      <span class="run">${inn1Score}/${inn1Wicket}</span>
                      <span class="over">(${inn1over})</span>
                      <br>
                          <span class="over">CRR : ${inn1crr} | RRR: ${inn1rrr}</span>
                  </div>
                  
              </div>`
                  : `<div class="team">
              <div class="team_name">${inn2TeamName}</div>
              <div class="curr_inn">
                  <span class="run">${inn2Score}/${inn2Wicket}</span>
                  <span class="over">(${inn2over})</span>
                  <br>
                      <span class="over">CRR : ${inn2crr} | RRR: ${inn2rrr}</span>
              </div>
              
          </div>`
              }
              <div class="match_status">
                  <span class="commantry">${
                    parseInt(currentInning) == 2 ? inn2Message : inn1Message
                  }</span>
                  <p class="target">${customMsg || ""}</p>
                  <span class="day"><div class="score-over">
                          <ul><li class="six-balls ">
                            ${
                              parseInt(currentInning) == 2
                                ? inn2overRuns
                                : inn1overRuns
                            }
                          </li><li class="six-balls "></ul>
                    </div></span>
                  </div>
                  ${
                    parseInt(currentInning) == 2
                      ? `<div class="team">
                      <div class="team_name">${inn1TeamName}</div>
                      <div class="curr_inn">
                          <span class="run">${inn1Score}/${inn1Wicket}</span>
                          <span class="over">(${inn1over})</span>
                          <br>
                              <span class="over">CRR : ${inn1crr} | RRR: ${inn1rrr}</span>
                      </div>
                      
                  </div>`
                      : `<div class="team">
                  <div class="team_name">${inn2TeamName}</div>
                  <div class="curr_inn">
                      <span class="run">${inn2Score}/${inn2Wicket}</span>
                      <span class="over">(${inn2over})</span>
                      <br>
                          <span class="over">CRR : ${inn2crr} | RRR: ${inn2rrr}</span>
                  </div>
                  
              </div>`
                  }
              </div>
              </div>`;
      res.send(file);
      return;
    }
  })
);

app.get(
  "/add/:marketId",
  catchAsyncErrors(async (req, res, next) => {
    const { marketId } = req.params;
    const matchData = await getMatchByIdService(res, marketId);

    const scoreContent = await ejs.renderFile(
      __dirname + "/../views/addScore.ejs",
      {
        data: matchData,
      }
    );
    res.render("layout/mainLayout", {
      title: "Score",
      body: scoreContent,
    });
  })
);

app.get(
  "/",
  catchAsyncErrors(async (req, res, next) => {
    res.render("score.ejs");
  })
);

app.post(
  "/addToss",
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
    await redisClient.hSet(marketId + "Inning1", newInning);
    matchRepo.update(
      { marketId: marketId },
      { tossWin: matchDetails.tossWin, firstBatTeam: matchDetails.firstBatTeam }
    );
    res.send("toss save");
  })
);

app.post(
  "/updatePlayer",
  catchAsyncErrors(async (req, res, next) => {
    let {
      marketId,
      playerType,
      playerName,
      inningNumber,
      bowlerType = "",
    } = req.body;
    if (!marketId) {
      return res.status(500).send("marketId not found.");
    }
    if (!inningNumber) {
      return res.status(500).send("Inning number not found.");
    }
    if (!playerType) {
      return res.status(500).send("playerType not found.");
    }
    let redisObj = await setAndGetInningData(inningNumber, marketId);
    if (playerType == "striker") {
      if (
        redisObj.striker &&
        redisObj.striker != "" &&
        redisObj.striker != playerName
      ) {
        await playerRepo.update(
          {
            marketId: marketId,
            teamName: redisObj.teamName,
            playerName: redisObj.striker,
          },
          { isPlayerOut: true }
        );
      }
      redisObj.striker = playerName;
    }
    if (playerType == "nonStriker") {
      if (
        redisObj.nonStriker &&
        redisObj.nonStriker != "" &&
        redisObj.nonStriker != playerName
      ) {
        await playerRepo.update(
          {
            marketId: marketId,
            teamName: redisObj.teamName,
            playerName: redisObj.nonStriker,
          },
          { isPlayerOut: true }
        );
      }
      redisObj.nonStriker = playerName;
    }
    if (playerType == "bowler") {
      redisObj.bowler = playerName;
      redisObj.bowlerType = bowlerType;
    }
    if (playerType == "bowlerType") {
      redisObj.bowlerType = bowlerType;
    }
    if (playerType == "message") {
      redisObj.message = playerName;
    }
    if (inningNumber == 1) {
      await redisClient.hSet(marketId + "Inning1", redisObj);
    } else {
      await redisClient.hSet(marketId + "Inning2", redisObj);
    }
    let dbUpdateObj = {
      score: redisObj.score,
      over: redisObj.over,
      striker: redisObj.striker,
      nonStriker: redisObj.nonStriker,
      overRuns: redisObj.overRuns,
      wicket: redisObj.wicket,
      crr: redisObj.crr,
      rrr: redisObj.rrr,
      message: redisObj.message,
      lastOver: redisObj.lastOver,
    };

    scoreInningRepo
      .update({ marketId: marketId, inningNumber: inningNumber }, dbUpdateObj)
      .catch((err) => {
        console.log(err);
      });
    return res.json(redisObj);
  })
);

app.post("/changeInning", async (req, res, next) => {
  let { marketId, inningNumber } = req.body;
  if (!marketId) {
    return res.status(500).send("marketId not found.");
  }
  if (!inningNumber) {
    return res.status(500).send("Inning number not found.");
  }

  let match = await matchRepo.findOne({
    where: { marketId: marketId },
  });
  if (!match) {
    return res.status(500).send("Match not Found.");
  }
  match.currentInning = inningNumber;
  matchRepo.save(match);
  let isRedis = await redisClient.hGet(marketId, "currentInning");
  if (isRedis) {
    await redisClient.hSet(marketId, "currentInning", inningNumber);
  }

  let innin1Team = await redisClient.hGet(marketId + "Inning1", "teamName");
  let redisObj = {
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
    teamName: innin1Team == match.teamA ? match.teamB : match.teamA,
    message: "",
    lastOver: "",
  };
  const newInning = scoreInningRepo.create(redisObj);
  newInning.inningNumber = 2;
  newInning.marketId = marketId;
  newInning.title = match.title;
  newInning.startAt = new Date();
  newInning.gameType = "Cricket";
  await scoreInningRepo.save(newInning);
  await redisClient.hSet(marketId + "Inning2", redisObj);
  return res.send("Inning change success.");
});

app.post(
  "/changeScore",
  catchAsyncErrors(async (req, res, next) => {
    let { marketId, inningNumber, eventType, score = 0, otherParam } = req.body;
    if (!marketId) {
      return res.status(500).send("marketId not found.");
    }
    if (!inningNumber) {
      return res.status(500).send("Inning number not found.");
    }

    let redisObj = await setAndGetInningData(inningNumber, marketId);
    let matchDetails = await redisClient.hGetAll(marketId);
    redisObj.isFreeHit = redisObj.isFreeHit
      ? JSON.parse(redisObj.isFreeHit)
      : false;
    redisObj.over = redisObj.over ? parseFloat(redisObj.over) : 0;
    let isLastBall = false;

    let lastBallStatus = {};
    lastBallStatus.eventType = "b";
    lastBallStatus.score = redisObj.score;
    lastBallStatus.inningNumber = inningNumber;
    lastBallStatus.over = redisObj.over;
    lastBallStatus.wicket = redisObj.wicket;
    lastBallStatus.message = redisObj.message;
    lastBallStatus.striker = redisObj.striker;
    lastBallStatus.nonStriker = redisObj.nonStriker;
    lastBallStatus.isLastBall = isLastBall;
    lastBallStatus.isFreeHit = redisObj.isFreeHit;
    lastBallStatus.crr = redisObj.crr;
    if (inningNumber == 2) {
      if (redisObj.customMsg) {
        lastBallStatus.customMsg = redisObj.customMsg;
      }
      lastBallStatus.rrr = redisObj.rrr;
    }

    if (eventType.includes("b")) {
      redisObj.score = parseInt(redisObj.score) + score;
      redisObj.over = redisObj.over + 0.1;
      isLastBall =
        (matchDetails.overType / 10).toFixed(1) ==
        (redisObj.over % 1).toFixed(1);
      if (isLastBall) {
        redisObj.over = Math.ceil(redisObj.over);
      }
      if ((redisObj.over % 1).toFixed(1) == 0.1) {
        redisObj.lastOver = redisObj.overRuns;
        redisObj.overRuns = score.toString();
      } else {
        redisObj.overRuns = redisObj.overRuns + " " + score;
      }
      let message = await numberToWords(score);
      redisObj.isFreeHit = false;
      redisObj.message = message;
    }

    if (eventType.includes("w")) {
      redisObj.score = parseInt(redisObj.score) + score + 1;
      isLastBall =
        (matchDetails.overType / 10).toFixed(1) ==
        (redisObj.over % 1).toFixed(1);
      if (isLastBall) {
        redisObj.over = Math.ceil(redisObj.over);
      }
      redisObj.overRuns = redisObj.overRuns + " W";
      let message = "WIDE ";
      if (score) {
        message = message + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.message = message;
    }

    if (eventType.includes("n")) {
      redisObj.score =
        parseInt(redisObj.score) + score + parseInt(matchDetails.noBallRun);
      if (!eventType.includes("r")) {
        redisObj.wicket = parseInt(redisObj.wicket) + 1;
      }
      isLastBall =
        (matchDetails.overType / 10).toFixed(1) ==
        (redisObj.over % 1).toFixed(1);
      if (isLastBall) {
        redisObj.over = Math.ceil(redisObj.over);
      }
      redisObj.overRuns = redisObj.overRuns + " NB";
      let message = "NO BALL ";
      if (score) {
        message = message + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.isFreeHit = true;
      redisObj.message = message;
    }

    if (eventType.includes("wck")) {
      redisObj.score = parseInt(redisObj.score) + score;
      if (!eventType.includes("n")) {
        redisObj.over = parseFloat(redisObj.over) + 0.1;
      }
      if (!redisObj.isFreeHit) {
        redisObj.wicket = parseInt(redisObj.wicket) + 1;
      }
      redisObj.isFreeHit = false;
      isLastBall =
        (matchDetails.overType / 10).toFixed(1) ==
        (redisObj.over % 1).toFixed(1);
      if (isLastBall) {
        redisObj.over = Math.ceil(redisObj.over);
      }
      redisObj.overRuns = redisObj.overRuns + " WCK";
      let message = "WICKET ";
      if (score) {
        message = message + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.message = message;
      await playerRepo.update(
        {
          marketId: marketId,
          teamName: redisObj.teamName,
          playerName: redisObj.striker,
        },
        { isPlayerOut: true }
      );
    }

    if (eventType.includes("r")) {
      redisObj.score = parseInt(redisObj.score) + score;
      if (!eventType.includes("n")) {
        redisObj.over = parseFloat(redisObj.over) + 0.1;
        redisObj.isFreeHit = false;
      }
      redisObj.wicket = parseInt(redisObj.wicket) + 1;
      isLastBall =
        (matchDetails.overType / 10).toFixed(1) ==
        (redisObj.over % 1).toFixed(1);
      if (isLastBall) {
        redisObj.over = Math.ceil(redisObj.over);
      }
      redisObj.overRuns = redisObj.overRuns + " WCK";
      let message = "RUN OUT ";
      if (score) {
        message = message + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.message = message;
    }

    if (eventType.includes("ball start")) {
      redisObj.message = "Ball Started";
    }

    if (eventType.includes("ball stop")) {
      redisObj.message = "Ball Stop";
    }

    if (eventType.includes("d")) {
      redisObj.message = "Drink Break";
    }

    if (eventType.includes("timeout")) {
      redisObj.message = "Time Out";
    }

    // update common value in all condition
    if (inningNumber == 2) {
      let totalBallInMatch = convertOverToBall(
        matchDetails.totalOver,
        matchDetails.overType
      );
      let ballDoneInning = convertOverToBall(
        redisObj.over,
        matchDetails.overType
      );
      let remainingBall = totalBallInMatch - ballDoneInning;

      target = await redisClient.hGet(marketId + "Inning1", "score");
      redisObj.rrr = calculateRequiredRunRate(
        target - redisObj.score,
        remainingBall,
        matchDetails.overType
      );
      if (remainingBall <= 100) {
        let totalRunInn1 = await redisClient.hGet(
          marketId + "Inning1",
          "score"
        );
        redisObj.customMsg = `BAN NEED ${
          totalRunInn1 - redisObj.score
        } RUNS OFF ${remainingBall} BALLS`;
      }
    }

    if (score % 2 == 1) {
      let tempName = redisObj.striker;
      redisObj.striker = redisObj.nonStriker;
      redisObj.nonStriker = tempName;
    }
    redisObj.crr = calculateCurrRate(
      redisObj.score,
      redisObj.over,
      matchDetails.overType
    );
    redisObj.over = redisObj?.over?.toFixed(1);
    redisObj.isFreeHit = redisObj.isFreeHit.toString();
    redisObj.lastBallStatus = JSON.stringify(lastBallStatus);

    redisClient
      .hSet(marketId + "Inning" + inningNumber, redisObj)
      .catch((err) => {
        console.log(err);
      });
    redisObj.isLastBall = isLastBall;
    let dbUpdateObj = {
      score: redisObj.score,
      over: redisObj.over,
      striker: redisObj.striker,
      nonStriker: redisObj.nonStriker,
      overRuns: redisObj.overRuns,
      wicket: redisObj.wicket,
      crr: redisObj.crr,
      rrr: redisObj.rrr,
      message: redisObj.message,
      lastOver: redisObj.lastOver,
    };

    scoreInningRepo
      .update({ marketId: marketId, inningNumber: inningNumber }, dbUpdateObj)
      .catch((err) => {
        console.log(err);
      });

    res.json(redisObj);
  })
);

module.exports = app;

async function setAndGetInningData(inningNumber, marketId) {
  let redisObj = {};
  if (inningNumber == 1) {
    redisObj = await redisClient.hGetAll(marketId + "Inning1");
    if (!redisObj || !Object.keys(redisObj).length) {
      let scoreInning = await scoreInningRepo
        .createQueryBuilder("scoreInning")
        .where(
          "scoreInning.marketId = :marketId and scoreInning.inningNumber = 1",
          { marketId }
        )
        .getOne();
      if (scoreInning) {
        redisObj = {
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
          teamName: scoreInning.teamName,
          message: scoreInning.message,
          lastOver: scoreInning.lastOver,
        };
      } else {
        let matchDetails = await redisClient.hGetAll(marketId);
        redisObj = {
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
          teamName: matchDetails.firstBatTeam || teamA,
          message: "",
          lastOver: "",
        };
        const newInning = scoreInningRepo.create(redisObj);
        newInning.inningNumber = 1;
        newInning.marketId = marketId;
        newInning.title = matchDetails.title;
        newInning.startAt = new Date();
        newInning.gameType = "Cricket";
        await scoreInningRepo.save(newInning);
      }
    }
  } else {
    redisObj = await redisClient.hGetAll(marketId + "Inning2");
    if (!redisObj || !Object.keys(redisObj).length) {
      let scoreInning = await scoreInningRepo
        .createQueryBuilder("scoreInning")
        .where(
          "scoreInning.marketId = :marketId and scoreInning.inningNumber = 2",
          { marketId }
        )
        .getOne();
      if (scoreInning) {
        redisObj = {
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
          teamName: scoreInning.teamName,
          message: scoreInning.message,
          lastOver: scoreInning.lastOver,
        };
      } else {
        let matchDetails = await redisClient.hGetAll(marketId);
        redisObj = {
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
          teamName:
            matchDetails.firstBatTeam &&
            matchDetails.firstBatTeam == matchDetails.teamA
              ? matchDetails.teamA
              : matchDetails.teamB,
          message: "",
          lastOver: "",
        };
        const newInning = scoreInningRepo.create(redisObj);
        newInning.inningNumber = 2;
        newInning.marketId = marketId;
        newInning.title = matchDetails.title;
        newInning.startAt = new Date();
        newInning.gameType = "Cricket";
        await scoreInningRepo.save(newInning);
      }
    }
  }
  return redisObj;
}

app.get(
  "/help",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    const helpContent = await ejs.renderFile(
      __dirname + "/../views/help.ejs",
      {}
    );

    res.render("layout/mainLayout", {
      title: "Help",
      body: helpContent,
    });
  })
);

app.post(
  "/revertLastBall",
  isAuthenticates,
  catchAsyncErrors(async (req, res, next) => {
    let { marketId, inningNumber } = req.body;
    if (!marketId) {
      return res.status(500).send("marketId not found.");
    }
    if (!inningNumber) {
      return res.status(500).send("Inning number not found.");
    }
    let redisObj = await setAndGetInningData(inningNumber, marketId);
    let lastBallStatus = {};
    if (redisObj.lastBallStatus) {
      lastBallStatus = JSON.parse(redisObj.lastBallStatus);
    }
    if (inningNumber != lastBallStatus.inningNumber) {
      return res
        .status(500)
        .send("Inning May be change can not undo the action.");
    }

    redisObj.score = lastBallStatus.score;
    redisObj.over = lastBallStatus.over;
    redisObj.message = lastBallStatus.message;
    if (redisObj.wicket != lastBallStatus.wicket) {
      if (
        lastBallStatus.striker != redisObj.striker ||
        lastBallStatus.striker != redisObj.nonStriker
      ) {
        await playerRepo.update(
          {
            marketId: marketId,
            teamName: redisObj.teamName,
            playerName: lastBallStatus.striker,
          },
          { isPlayerOut: false }
        );
      }
      if (
        lastBallStatus.nonStriker != redisObj.striker ||
        lastBallStatus.nonStriker != redisObj.nonStriker
      ) {
        await playerRepo.update(
          {
            marketId: marketId,
            teamName: redisObj.teamName,
            playerName: lastBallStatus.nonStriker,
          },
          { isPlayerOut: false }
        );
      }
    }
    redisObj.striker = lastBallStatus.striker;
    redisObj.nonStriker = lastBallStatus.nonStriker;
    redisObj.wicket = lastBallStatus.wicket;
    redisObj.crr = lastBallStatus.crr;
    redisObj.isFreeHit = lastBallStatus.isFreeHit?.toString();
    redisObj.isLastBall = lastBallStatus.isLastBall?.toString();

    if (inningNumber == 2) {
      redisObj.rrr = lastBallStatus.rrr;
      if (lastBallStatus.customMsg) {
        redisObj.customMsg = lastBallStatus.customMsg;
      }
    }

    await redisClient
      .hSet(marketId + "Inning" + inningNumber, redisObj)
      .catch((err) => {
        console.log(err);
      });

    let dbUpdateObj = {
      score: redisObj.score,
      over: redisObj.over,
      striker: redisObj.striker,
      nonStriker: redisObj.nonStriker,
      overRuns: redisObj.overRuns,
      wicket: redisObj.wicket,
      crr: redisObj.crr,
      rrr: redisObj.rrr,
      message: redisObj.message,
      lastOver: redisObj.lastOver,
    };

    scoreInningRepo
      .update({ marketId: marketId, inningNumber: inningNumber }, dbUpdateObj)
      .catch((err) => {
        console.log(err);
      });

    return res.json(redisObj);
  })
);

// timeout r
// drink break d
// ball start
// ball stop
