// Controller.js
const bcrypt = require("bcrypt");
const User = require("./models/User.entity");
const { getDataSource } = require("./config/PostGresConnection.js");
const catchAsyncErrors = require("./middleware/catchAsyncErrors");
const MatchSchema = require("./models/Match.entity");
const redisClient = require('./config/redisConnection');

const controller = {};

controller.postLogin = async (req, res) => {
  const { userName, password } = req.body;
  const AppDataSource = await getDataSource();
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo
    .createQueryBuilder("user")
    .where("user.userName = :userName", { userName })
    // .andWhere("user.password = :password", { password })
    .getOne();
  if (user) {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).send("Invalid credentials");
      return;
    }
  }
  if (user) {
    req.session.loggedIn = true;
    req.session.userName = userName;
    res.redirect("/");
  } else {
    return res.status(401).send("Invalid credentials");
  }
};

controller.postRegister = async (req, res) => {
  let { userName, password } = req.body;
  const saltRounds = 10;
  password = await bcrypt.hash(password, saltRounds);
  const AppDataSource = await getDataSource();
  const userRepo = AppDataSource.getRepository(User);
  const newUser = userRepo.create({
    userName,
    password,
  });
  // Save the new user to the database
  const savedUser = await userRepo.save(newUser);
  if (savedUser) {
    res.redirect("login");
  }
};

controller.getMatchList = async (req, res) => {
  const AppDataSource = await getDataSource();
  const matchRepo = AppDataSource.getRepository(MatchSchema);

  const match = await matchRepo.createQueryBuilder("match").getMany();

  const homeContent = await ejs.renderFile(__dirname + "/views/home.ejs", {
    match,
  });

  res.render("layout/mainLayout", {
    title: "Home",
    body: homeContent,
  });
};

controller.addMatch = async (req, res) => {
  let body = req.body;
  console.log(body);
  if (checkCricketRequiredFileds(body)) {
    return res.status(500).send("Add all required fields for add matches");
  }
  const AppDataSource = await getDataSource();
  const matchRepo = AppDataSource.getRepository(MatchSchema);

  let alreadyMatchAdded = await matchRepo.findOne({
    where: { marketId: body.marketId },
  });
  if (alreadyMatchAdded) {
    return res.status(500).send("Match already exist.");
  }

  let matchObj = {};
  matchObj.marketId = body.marketId;
  matchObj.eventId = body.eventId;
  matchObj.competitionId = body.competitionId;
  matchObj.competitionName = body.competitionName;
  matchObj.gameType = body.gameType;
  matchObj.teamA = body.teamA;
  matchObj.teamB = body.teamB;
  matchObj.teamC = body.teamC;
  matchObj.title = body.title;
  matchObj.startAt = new Date(body.startAt);
  matchObj.overType = body.overType;
  matchObj.totalOver = body.totalOver;
  matchObj.noBallRun = body.noBallRun;

  const newMatch = matchRepo.create(matchObj);
  const saveMatch = await matchRepo.save(newMatch);
  if (saveMatch) {
    return res.json(saveMatch);
  } else {
    return req.status(500).send("Error while saving data");
  }
};

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
      console.log(key);
      return true;
    }
  });
}

controller.getMatchById = async (req, res) => {
  const marketId = req.params.marketId;
  let gameType, teamA, teamB, title, stopAt, startDate, currentInning, overType, totalOver, noBallRun;
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
      return res.status(500).send('Match not found.');
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
      gameType: gameType, teamA: teamA, teamB: teamB, title: title, currentInning: currentInning, startDate: startDate.toString(),
      overType: overType, noBallRun: noBallRun, totalOver: totalOver
    }
    if (stopAt) {
      redisObj.stopAt = stopAt.toString();
    }
    await redisClient.hSet(marketId, redisObj);
  }

  return res.json({ gameType, teamA, teamB, title, stopAt, startDate, overType, noBallRun, currentInning, totalOver });
}

module.exports = controller;
