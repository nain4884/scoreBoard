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
      let file = `
      <style>
      html,body{ padding: 0; margin: 0; }
      .container-main {
      background: linear-gradient(0deg, rgb(0 0 0 / 39%), rgb(0 0 0 / 30%)),url(https://www.stageandscreen.travel/sites/default/files/styles/large/public/LP%20-%20Cricket%20Australia.jpg?itok=dStxvjPW);
      background-repeat: no-repeat;
      background-size: cover;
      margin-right: auto;
      margin-left: auto;
      color: white;
      height: 20vh;
      align-items: center;
      display: flex;
      justify-content:space-between;
      background-position: bottom;
      position: relative;
      width:100%;
      flex-direction:column;  
      }
      
      .row-ctm {
        padding:0px 10px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content:center;
      width:100%;
      }
      .team {
      flex: 0 0 25%;
      max-width: 25%;
      text-align: left;
      overflow:hidden;
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
      .black-back{
        background-color:#00000066;
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
      font-size: 0.9em;
      margin: 0;
      font-weight: 600;
      }
      .day {
      width: 100%;
      display: block;
      text-transform: capitalize;
      font-size: 1.1em;
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
      font-weight:800;
      font-size:1.3em;
      }
      .score-over ul li p{
      margin: 0;
      }
      .six-balls{
      padding : 2px;
      font-size : 17px;
      }
      .target{
        font-size : 1em;
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
      .animate-name{
        animation: bat-ball-txt 3s ease-out infinite;
        font-family: tahomabd;
        font-size: 0.8em;
        font-weight:800;
      }
      .striker-cont{
        display:flex;
        gap:10px;
      }
      .bat-icon,.ball-icon{
        height:20px;
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


      @-webkit-keyframes bat-ball-txt {
        0% {
            -webkit-transform: scale(1);
            transform: scale(1);
            color:white;
        }
      
        50% {
            -webkit-transform: scale(1.25);
            transform: scale(1.25);
            color:#12ee12;
        }
      
        100% {
            -webkit-transform: scale(1);
            transform: scale(1);
            color:white;

        }
      
      }
      
      @keyframes  bat-ball-txt {
        0% {
          -webkit-transform: scale(1);
          transform: scale(1);
          color:white;
        }
      
      50% {
          -webkit-transform: scale(1.25);
          transform: scale(1.25);
          color:#12ee12;
        }
      
      100% {
          -webkit-transform: scale(1);
          transform: scale(1);
          color:white;
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
.bottom-score{
  position: absolute;
    left: 50%;
    bottom: 0px;
    transform: translateX(-50%);
}
.bowler-cont{
  justify-content:right;
  margin-right:10px;
}
.curr-run-rate,.over,.team_name,.run{
  font-weight:900;
}
@media only screen and (max-width: 767px) {
  .container-main {
    height: 18vh !important;
    }
  .team_name {
    font-size: 1.05em;
    }
    .over{
      font-size:1em;
  }
    .curr-run-rate{
      font-size:0.9em;
  }
  }

      </style>
              <div class="container-main">
              <div class="row-ctm"> 
              ${
                parseInt(currentInning) == 1
                  ? `<div class="team">
                  <div class="team_name">${inn1TeamName}</div>
                  <div class="curr_inn">
                      <span class="run">${inn1Score}/${inn1Wicket}</span>
                      <span class="over">(${inn1over})</span>
                      <br>
                          <span class="curr-run-rate">CRR : ${inn1crr} | RRR: ${inn1rrr}</span>
                  </div>
                  
              </div>`
                  : `<div class="team">
              <div class="team_name">${inn2TeamName}</div>
              <div class="curr_inn">
                  <span class="run">${inn2Score}/${inn2Wicket}</span>
                  <span class="over">(${inn2over})</span>
                  <br>
                      <span class="curr-run-rate">CRR : ${inn2crr} | RRR: ${inn2rrr}</span>
              </div>
              
          </div>`
              }

              <div class="match_status">
              <span class="commantry">${
                parseInt(currentInning) == 2 ? inn2Message : inn1Message
              }</span>
              <div class="bottom_score">
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
              </div>
              ${
                parseInt(currentInning) == 2
                  ? `<div class="team" style="text-align:right;">
                  <div class="team_name">${inn1TeamName}</div>
                  <div class="curr_inn">
                      <span class="run">${inn1Score}/${inn1Wicket}</span>
                      <span class="over">(${inn1over})</span>
                      <br>
                          <span class="over curr-run-rate">CRR : ${inn1crr} | RRR: ${inn1rrr}</span>
                  </div>
                  
              </div>`
                  : `<div class="team" style="text-align:right;">
              <div class="team_name">${inn2TeamName}</div>
              <div class="curr_inn">
                  <span class="run">${inn2Score}/${inn2Wicket}</span>
                  <span class="over">(${inn2over})</span>
                  <br>
                      <span class="over curr-run-rate">CRR : ${inn2crr} | RRR: ${inn2rrr}</span>
              </div>
              
          </div>`
              }

              </div>

              <div class="row-ctm black-back"> 
              <div class="team">
              <div class="striker-cont">
              <svg class="bat-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 50 62.5" enable-background="new 0 0 50 50" xml:space="preserve">
              <g>
                  <path d="M1.8,38.4c-0.9,0.9-1.1,2.3-0.4,3.4c1.7,2.7,4,4.9,6.7,6.7c0.8,0.5,1.9,0.6,2.7,0.1c0.3-0.1,0.5-0.3,0.7-0.5l15.5-15.5 l-17-2.5L1.8,38.4z" fill="white" />
                  <path d="M34.1,17.6L31,14.5c-0.2,0-0.3-0.1-0.5-0.1c-0.6-0.3-1.3-0.7-1.8-1.3c-0.5-0.4-1.2-0.4-1.6,0L16.3,24l9.9,1.6L34.1,17.6z" fill="white" />
                  <path d="M35.9,20c-0.1-0.1-0.1-0.2-0.2-0.3c-0.1-0.2-0.2-0.4-0.2-0.6l-0.6-0.6l-8.3,8.4l-11.2-1.8l-1.4,1.4l13.5,2.1L35.9,20z" fill="white" />
                  <path d="M36.7,20.9l-8.8,8.8l-7.5-1.2l-7.5-1.2l-1.8,1.8l17,2.6l8.8-8.8c0.2-0.2,0.3-0.5,0.3-0.8c0-0.3-0.1-0.6-0.3-0.8 C36.9,21.2,36.8,21,36.7,20.9z" fill="white" />
                  <path d="M48.9,4.4L48.9,4.4l-3.2-3.2l0,0C45.6,1.1,45.4,1,45.3,1c-0.1,0-0.2,0-0.3,0.1l-1.2,1.2c-0.2,0.2-0.2,0.4,0,0.6l-11,11 c-0.2,0.1-0.3,0.3-0.5,0.4l2.6,2.6l0.8,0.8c0.1-0.2,0.2-0.4,0.4-0.5l11-11c0.2,0.2,0.5,0.2,0.6,0L48.9,5C49,4.8,49,4.6,48.9,4.4z" fill="white" />
              </g>
          </svg>
          
              <div class="animate-name">
                  ${striker}
                </div>
                </div>
                <div style="font-size:0.8em;">
                ${nonStriker}
              </div>
              </div>
              <div class="match_status"></div>
              <div class="team" style="text-align:right;">
               <div class="striker-cont bowler-cont" style="justify-content:right;">
               <svg class="ball-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px"
               viewBox="0 0 1024 1280" style="enable-background:new 0 0 1024 1024;" xml:space="preserve">
               <g>
                   <g>
                       <g>
                           <path fill="#FFFFFF"
                               d="M931.3,522.4c-2,80.4-27.1,159.2-73.2,226.7c-12,17.5-24,32.5-38.9,48.4c-15.8,16.9-32.9,32.7-51.3,46.9     c-32.3,25-71.9,46.9-109.9,60.9c-20.1,7.4-40.8,13.3-61.7,17.6c-21,4.3-38.4,6.6-60.1,7.8c-47.9,2.7-95.2-2.6-141.2-15.9     c-44.4-12.8-86-32.8-124.1-59.5c-19-13.3-36.8-28.3-53.6-44.9c-15.1-14.9-30.2-32.1-41.9-47.9c-12.4-16.8-23.7-34.5-33.5-52.9     c-4.9-9.1-9.4-18.3-13.6-27.8c-3.8-8.4-7.2-17.1-10.8-27.2c-6.9-19.4-12.5-39.3-16.6-59.4c-4.2-20.6-6.3-36.5-7.5-57.7     c-2.6-43.9,1.2-84.9,11.5-126.6c10.4-42.2,26.1-79.8,48.6-116.8c45.4-74.8,114.4-134.8,195.5-169c87-36.6,185.1-42.6,275.9-17.4     c40.4,11.2,76,27,111.7,49.7c35.8,22.7,67.6,50.5,95.7,83.4c25.9,30.4,48.5,66.6,65,104.6c1.4,3.3,2.8,6.6,4.7,11.3     c2,5,3.8,10,5.6,15.1c3.4,9.8,6.5,19.8,9.3,29.8c2.6,9.7,5,19.6,6.9,29.5c1.9,9.8,3.7,20.6,4.6,28.2     C930.8,480.3,931.8,501.4,931.3,522.4c-0.2,7.8,7,15.4,15,15c8.3-0.4,14.8-6.6,15-15c2-87.6-21.9-175.3-68.6-249.5     C845,197.2,774.4,135.7,692.1,100.2c-89.4-38.6-189.6-47.8-284.5-25.4c-93.4,22.1-178.9,75.1-240.4,148.9     c-58.8,70.7-94.7,157.6-102.9,249.1c-7.9,87.3,10.8,176.5,52.5,253.5c44.8,82.8,116.6,151.2,201.8,191.5     c89.2,42.2,190.8,54.1,287.4,33.8c90.5-19.1,174.2-67.1,236.8-135.2c59-64.2,99-145.3,112.7-231.5c3.3-20.6,5.3-41.5,5.8-62.4     c0.2-7.8-7-15.4-15-15C938,507.8,931.5,514,931.3,522.4z" />
                       </g>
                   </g>
                   <g>
                       <g>
                           <path fill="#FFFFFF"
                               d="M931.3,522.4c-1.2,47.6-9.9,93.1-27.2,139.1c-4.5,11.9-8,20.2-13.7,31.9c-5.2,10.7-10.8,21.3-16.9,31.5     c-13,22-27,41.6-43,60.1c-34.6,40.1-74.8,72.4-121.4,97.4c-23,12.3-44.3,21.3-69.2,29.2c-11.7,3.7-23.5,6.9-35.4,9.6     c-5.9,1.3-11.9,2.6-17.9,3.7c-3.3,0.6-6.5,1.2-9.8,1.7c-1.1,0.2-2.2,0.3-3.3,0.5c-0.6,0.1-6,0.9-4.2,0.6     c-61.8,8.5-124.1,2.9-183.4-15.6c2.2,1.3,4.4,2.6,6.6,3.9c-1.5-1.8-3.1-3.7-4.5-5.5c-0.4-0.5-2.6-3.3-1.1-1.3     c1.5,1.9-1.2-1.6-1.6-2.1c-2.9-3.8-5.6-7.8-8.3-11.8c-5.7-8.5-10.8-17.4-15.5-26.4c-2.5-4.9-4.9-9.8-7.2-14.8     c-1.1-2.4-2.2-4.8-3.2-7.3c-1.5-3.5,0.7,1.7-0.4-0.9c-0.6-1.5-1.2-3-1.8-4.5c-4.5-11.2-8.4-22.5-11.9-34     c-8-26.3-13.7-53.4-17.8-80.6c-0.6-3.8-1.1-7.7-1.7-11.5c0-0.1-0.3-2.5-0.1-0.9c0.2,1.7-0.2-1.3-0.2-1.7     c-0.3-2.2-0.6-4.5-0.8-6.7c-1-8.2-1.9-16.4-2.6-24.6c-1.6-17-2.7-34.1-3.5-51.1c-1.6-37.1-2-74.4,0.3-111.5     c2.2-35.3,6.3-66.2,13.4-100.8c6.7-32.5,15.6-64.6,26.8-95.9c10.7-30,22.3-56.2,38-85.1c7.2-13.4,15-26.4,23.3-39.2     c4-6.1,8.1-12.2,12.3-18.2c2-2.9,4.1-5.7,6.2-8.5c1.1-1.5,2.2-3,3.3-4.5c0.6-0.7,1.1-1.5,1.7-2.2c1.6-2.1-0.4,0.5,0.6-0.8     c17.5-22.3,36.8-43.3,58.1-62.1c5.1-4.5,10.2-8.8,15.5-13.1c-3.5,1.5-7.1,2.9-10.6,4.4c46.2-1.3,87.5,3.9,131.6,16.9     c42.8,12.6,81.5,30.9,119,56.6c72.9,50,130.4,125.4,158.8,208.7c7.9,23.2,13.9,47,17.8,71.2c1.7,10.7,3,21.3,3.9,33.9     C931.3,494.1,931.6,508.2,931.3,522.4c-0.2,7.8,7,15.4,15,15c8.3-0.4,14.8-6.6,15-15c1.9-85.4-20.7-170.9-65.2-243.9     c-45.2-74.1-112.2-135.1-190.8-172.3c-37.9-17.9-78.1-30.8-119.5-37.5c-21.6-3.5-43.5-5.6-65.4-6.1c-5.6-0.1-11.2-0.1-16.8,0     c-4.2,0.1-8.4,0-12.1,2.2c-2.5,1.5-4.8,3.8-7.1,5.6c-6.4,5.3-12.7,10.8-18.8,16.4c-53.8,49.9-95.3,112.8-124.8,179.7     c-34,76.8-53.4,159.2-59.7,242.9c-3.4,44.9-2.8,90.3-0.2,135.2c2.2,39.6,6.5,79.2,14.2,118.1c11,55.9,29.7,112.7,64,159     c4.1,5.5,9.1,14.2,15.2,17.7c5.3,3.1,12.5,4.2,18.3,5.8c6.2,1.7,12.4,3.2,18.6,4.7c24.5,5.6,49.7,9.1,74.8,10.6     c44.8,2.7,90.2-1.6,133.8-12.3c87.7-21.5,168.1-70.2,228.1-137.7C904.2,747.1,942.3,668,955.6,584c3.2-20.4,5.2-40.9,5.7-61.6     c0.2-7.8-7-15.4-15-15C938,507.8,931.5,514,931.3,522.4z" />
                       </g>
                   </g>
                   <g>
                       <g>
                           <path fill="#FFFFFF"
                               d="M578.6,114.5c-4.2,0-8.3-1.7-11.3-5.1c-5.5-6.2-4.9-15.7,1.4-21.2c5.9-5.2,10.9-9.5,15.6-13.3c6.4-5.3,15.8-4.4,21.1,2     c5.3,6.4,4.4,15.8-2,21.1c-4.4,3.6-9.1,7.7-14.8,12.7C585.7,113.3,582.1,114.5,578.6,114.5z" />
                           <path fill="#FFFFFF"
                               d="M433.6,877.3c-5.8,0-11.2-3.3-13.7-8.9c-5.3-12-10.2-24.6-14.7-37.6c-2.7-7.8,1.5-16.4,9.3-19c7.8-2.7,16.4,1.5,19,9.3     c4.2,12.2,8.8,24,13.7,35.2c3.4,7.6-0.1,16.4-7.6,19.8C437.7,876.9,435.6,877.3,433.6,877.3z M399.5,765.3c-7,0-13.3-5-14.7-12.2     c-2.4-12.7-4.6-26-6.4-39.4c-1.1-8.2,4.6-15.8,12.8-16.9c8.2-1.1,15.8,4.6,16.9,12.8c1.8,12.9,3.8,25.6,6.2,37.8     c1.6,8.1-3.8,16-11.9,17.6C401.4,765.2,400.5,765.3,399.5,765.3z M386.3,648.8c-8,0-14.6-6.3-15-14.3c-0.6-12.9-1-26.2-1.1-39.6     c-0.1-8.3,6.6-15.1,14.9-15.1c0,0,0.1,0,0.1,0c8.2,0,14.9,6.6,15,14.9c0.1,13.1,0.5,26,1.1,38.5c0.4,8.3-6,15.3-14.3,15.7     C386.8,648.8,386.5,648.8,386.3,648.8z M387.9,531.6c-0.4,0-0.9,0-1.3-0.1c-8.3-0.7-14.4-8-13.7-16.2c1.1-13.2,2.6-26.6,4.4-39.6     c1.1-8.2,8.7-14,16.9-12.8c8.2,1.1,14,8.7,12.8,16.9c-1.7,12.6-3.1,25.4-4.2,38.1C402.2,525.7,395.7,531.6,387.9,531.6z      M406.9,415.9c-1.2,0-2.4-0.1-3.6-0.4c-8-2-12.9-10.1-11-18.2c3.2-12.9,6.8-25.9,10.7-38.5c2.4-7.9,10.8-12.4,18.7-9.9     c7.9,2.4,12.4,10.8,9.9,18.7c-3.7,12.1-7.1,24.5-10.2,36.9C419.8,411.4,413.6,415.9,406.9,415.9z M444.5,305c-2,0-4.1-0.4-6-1.3     c-7.6-3.3-11-12.2-7.7-19.8c5.4-12.2,11.2-24.4,17.2-36.1c3.8-7.4,12.8-10.3,20.2-6.5c7.4,3.8,10.3,12.8,6.5,20.2     c-5.8,11.2-11.3,22.8-16.4,34.5C455.8,301.6,450.3,305,444.5,305z M501.5,202.6c-3,0-5.9-0.9-8.5-2.7c-6.8-4.7-8.5-14.1-3.8-20.9     c7.7-11.1,15.8-21.9,24.1-32.2c5.2-6.4,14.6-7.5,21.1-2.3c6.4,5.2,7.5,14.6,2.3,21.1c-7.8,9.7-15.5,20-22.8,30.4     C510.9,200.4,506.2,202.6,501.5,202.6z" />
                           <path fill="#FFFFFF"
                               d="M485,960.7c-4.3,0-8.5-1.8-11.5-5.4c-4.3-5.2-8.6-10.5-12.9-16.4c-5-6.6-3.6-16,3.1-21c6.6-4.9,16-3.6,21,3.1     c4,5.4,7.9,10.3,11.9,15c5.3,6.3,4.5,15.8-1.8,21.1C491.8,959.5,488.4,960.7,485,960.7z" />
                       </g>
                   </g>
                   <g>
                       <g>
                           <path fill="#FFFFFF"
                               d="M250.3,869.2c-5.7,0-11.1-3.3-13.6-8.8c-2.4-5.1-5.4-12-8.2-19.2c-3-7.7,0.8-16.4,8.5-19.4c7.7-3,16.4,0.8,19.4,8.5     c2.5,6.5,5.2,12.5,7.6,17.6c3.4,7.5,0.1,16.4-7.4,19.9C254.5,868.8,252.4,869.2,250.3,869.2z" />
                           <path fill="#FFFFFF"
                               d="M220.7,779.7c-6.8,0-13-4.7-14.6-11.7c-2.7-11.9-5.2-24.5-7.3-37.4c-1.4-8.2,4.1-15.9,12.3-17.3     c8.2-1.4,15.9,4.1,17.3,12.3c2.1,12.3,4.4,24.3,7,35.7c1.8,8.1-3.2,16.1-11.3,18C222.9,779.6,221.8,779.7,220.7,779.7z      M204.6,669.3c-7.7,0-14.3-6-14.9-13.8c-1-12.1-1.7-24.8-2.3-37.6c-0.4-8.3,6-15.3,14.3-15.7c8.3-0.4,15.3,6,15.7,14.3     c0.6,12.5,1.3,24.8,2.3,36.6c0.7,8.3-5.5,15.5-13.8,16.1C205.4,669.3,205,669.3,204.6,669.3z M201,557.7c-0.1,0-0.1,0-0.2,0     c-8.3-0.1-14.9-6.9-14.8-15.2c0.1-12.6,0.6-25.4,1.4-38c0.5-8.3,7.6-14.6,15.9-14c8.3,0.5,14.6,7.6,14,15.9     c-0.8,12.1-1.2,24.4-1.4,36.5C215.9,551.1,209.2,557.7,201,557.7z M210.8,446.6c-0.8,0-1.6-0.1-2.5-0.2     c-8.2-1.3-13.7-9.1-12.4-17.2c2-12.4,4.4-25,7.1-37.3c1.8-8.1,9.7-13.2,17.8-11.5c8.1,1.8,13.2,9.7,11.5,17.8     c-2.6,11.8-4.9,23.9-6.8,35.9C224.4,441.3,218,446.6,210.8,446.6z M237.2,338.1c-1.5,0-3.1-0.2-4.6-0.7     c-7.9-2.6-12.2-11-9.6-18.9c3.9-12,8.2-24.1,12.7-35.8c3-7.7,11.6-11.6,19.4-8.6c7.7,3,11.6,11.6,8.6,19.4     c-4.3,11.3-8.4,22.8-12.2,34.4C249.4,334.1,243.5,338.1,237.2,338.1z M279.8,235.1c-2.3,0-4.6-0.5-6.8-1.7     c-7.4-3.8-10.3-12.8-6.5-20.2c5.8-11.3,12-22.6,18.3-33.4c4.2-7.1,13.4-9.5,20.5-5.3c7.1,4.2,9.5,13.4,5.3,20.5     c-6.1,10.3-11.9,21-17.5,31.9C290.5,232.1,285.3,235.1,279.8,235.1z" />
                           <path fill="#FFFFFF"
                               d="M339.1,140.7c-3.2,0-6.4-1-9.2-3.1c-6.6-5.1-7.8-14.5-2.7-21c3.8-4.9,7.8-9.9,12.8-16c5.3-6.4,14.7-7.3,21.1-2     c6.4,5.3,7.3,14.7,2,21.1c-4.8,5.8-8.6,10.6-12.2,15.2C348,138.7,343.6,140.7,339.1,140.7z" />
                       </g>
                   </g>
               </g>
           </svg>
                <div class="animate-name">
                  ${bowler}
                </div>
                </div>
                ${bowlerType}
              </div>
              </div>

              
              </div>`;
      res.send(file);
      return;
    }
  })
);

app.get(
  "/add/:marketId",
  isAuthenticates,

  catchAsyncErrors(async (req, res, next) => {
    const { marketId } = req.params;
    const matchData = await getMatchByIdService(res, marketId);

    const scoreContent = await ejs.renderFile(
      __dirname + "/../views/addScore.ejs",
      {
        data: matchData,
        marketId: marketId,
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
  isAuthenticates,

  catchAsyncErrors(async (req, res, next) => {
    res.render("score.ejs");
  })
);

app.post(
  "/runout",
  isAuthenticates,

  catchAsyncErrors(async (req, res, next) => {
    const { marketId, isStriker, inningNumber, teamName, batsmanName } =
      req.body;
    if (!marketId) {
      return res.status(500).send("marketId not found.");
    }
    if (!inningNumber) {
      return res.status(500).send("Inning number not found.");
    }
    let redisObj = await setAndGetInningData(inningNumber, marketId);
    if (isStriker) {
      await playerRepo.update(
        {
          marketId: marketId,
          teamName: redisObj.teamName,
          playerName: redisObj.striker,
        },
        { isPlayerOut: true }
      );
      redisObj.striker = "";
    } else {
      await playerRepo.update(
        {
          marketId: marketId,
          teamName: redisObj.teamName,
          playerName: redisObj.nonStriker,
        },
        { isPlayerOut: true }
      );
      redisObj.nonStriker = "";
    }
    await redisClient.hSet(marketId + "Inning" + inningNumber, redisObj);
    return res.status(200).json(redisObj);
  })
);

app.post(
  "/updatePlayer",
  isAuthenticates,

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
      // if (
      //   redisObj.striker &&
      //   redisObj.striker != "" &&
      //   redisObj.striker != playerName &&
      //   redisObj.nonStriker != playerName
      // ) {
      //   await playerRepo.update(
      //     {
      //       marketId: marketId,
      //       teamName: redisObj.teamName,
      //       playerName: redisObj.striker,
      //     },
      //     { isPlayerOut: true }
      //   );
      // }
      redisObj.striker = playerName;
    }
    if (playerType == "nonStriker") {
      // if (
      //   redisObj.nonStriker &&
      //   redisObj.nonStriker != "" &&
      //   redisObj.striker != playerName &&
      //   redisObj.nonStriker != playerName
      // ) {
      //   await playerRepo.update(
      //     {
      //       marketId: marketId,
      //       teamName: redisObj.teamName,
      //       playerName: redisObj.nonStriker,
      //     },
      //     { isPlayerOut: true }
      //   );
      // }
      redisObj.nonStriker = playerName;
    }
    if (playerType == "bowler") {
      redisObj.bowler = playerName;
      redisObj.bowlerType = bowlerType;
    }
    if (playerType == "bowlerType") {
      redisObj.bowlerType = bowlerType;
      redisObj.message = playerName.toUpperCase();
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

app.post(
  "/changeInning",
  isAuthenticates,

  async (req, res, next) => {
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
      message: "Inning Change",
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
  }
);

app.post(
  "/changeScore",
  isAuthenticates,

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
    lastBallStatus.overRuns = redisObj.overRuns;
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
      if ((redisObj.over % 1).toFixed(1) == 0.1 && redisObj.over != 0.1) {
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
      redisObj.overRuns = redisObj.overRuns + " Wd";
      let message = "WIDE";
      if (score) {
        message = message + " + " + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.message = message;
    }

    if (eventType.includes("n")) {
      redisObj.score =
        parseInt(redisObj.score) + score + parseInt(matchDetails.noBallRun);
      if (eventType.includes("r")) {
        redisObj.wicket = parseInt(redisObj.wicket) + 1;
      }
      isLastBall =
        (matchDetails.overType / 10).toFixed(1) ==
        (redisObj.over % 1).toFixed(1);
      if (isLastBall) {
        redisObj.over = Math.ceil(redisObj.over);
      }
      if ((redisObj.over % 1).toFixed(1) == 0.1) {
        redisObj.lastOver = redisObj.overRuns;
        redisObj.overRuns = " NB";
      } else {
        redisObj.overRuns = redisObj.overRuns + " NB";
      }
      let message = "NO BALL";
      if (score) {
        message = message + " + " + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.isFreeHit = true;
      redisObj.message = message;
    } else if (eventType.includes("r")) {
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
      if ((redisObj.over % 1).toFixed(1) == 0.1) {
        redisObj.lastOver = redisObj.overRuns;
        redisObj.overRuns = " WKT";
      } else {
        redisObj.overRuns = redisObj.overRuns + " WKT";
      }
      let message = "RUN OUT";
      if (score) {
        message = message + " + " + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.message = message;
    }

    if (eventType.includes("wck")) {
      redisObj.score = parseInt(redisObj.score) + score;
      if (!eventType.includes("n")) {
        redisObj.over = parseFloat(redisObj.over) + 0.1;
      }
      if (!redisObj.isFreeHit) {
        redisObj.wicket = parseInt(redisObj.wicket) + 1;
        await playerRepo.update(
          {
            marketId: marketId,
            teamName: redisObj.teamName,
            playerName: redisObj.striker,
          },
          { isPlayerOut: true }
        );
      }
      redisObj.isFreeHit = false;
      isLastBall =
        (matchDetails.overType / 10).toFixed(1) ==
        (redisObj.over % 1).toFixed(1);
      if (isLastBall) {
        redisObj.over = Math.ceil(redisObj.over);
      }
      if ((redisObj.over % 1).toFixed(1) == 0.1) {
        redisObj.lastOver = redisObj.overRuns;
        redisObj.overRuns = " WKT";
      } else {
        redisObj.overRuns = redisObj.overRuns + " WKT";
      }
      let message = "WICKET";
      if (score) {
        message = message + " + " + (await numberToWords(score));
        redisObj.overRuns = redisObj.overRuns + "+" + score;
      }
      redisObj.message = message;
      redisObj.striker = "";
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

    if (eventType.includes("u")) {
      redisObj.message = "THIRD UMPIRE";
    }
    if (eventType.includes("over change")) {
      redisObj.message = "Over Change";
      redisObj.bowler = "";
      redisObj.bowlerType = "";
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
      // if (remainingBall <= 100) {
      let totalRunInn1 = await redisClient.hGet(marketId + "Inning1", "score");
      let teamNameInn2 = await redisClient.hGet(
        marketId + "Inning2",
        "teamName"
      );
      redisObj.customMsg = `${teamNameInn2} NEED ${
        totalRunInn1 - redisObj.score
      } RUNS OFF ${remainingBall} BALLS`;
      // }
    }

    if (
      !(
        eventType.includes("ball start") ||
        eventType.includes("ball stop") ||
        eventType.includes("d") ||
        eventType.includes("over change")
      ) ||
      eventType.includes("timeout") ||
      eventType.includes("u")
    ) {
      if (score % 2 == 1) {
        let tempName = redisObj.striker;
        redisObj.striker = redisObj.nonStriker;
        redisObj.nonStriker = tempName;
      }
      if (isLastBall) {
        let tempName = redisObj.striker;
        redisObj.striker = redisObj.nonStriker;
        redisObj.nonStriker = tempName;
      }
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
    if (redisObj.isFreeHit == "true" || redisObj.isFreeHit == true) {
      setTimeout(() => {
        // redisObj.message = "Free Hit";
        // delete redisObj.isLastBall;
        redisClient
          .hSet(marketId + "Inning" + inningNumber, "message", "FREE HIT")
          .catch((err) => {
            console.log(err);
          });
      }, 3000);
    }

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
    redisObj.overRuns = lastBallStatus.overRuns;
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
