const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const RedisStore = require("connect-redis").default;
const path = require("path");

const scoreController = require("./controller/scoreController");
const playerController = require("./controller/playerController");
const tossController = require("./controller/tossController");
const authController = require("./controller/authController");
const matchController = require("./controller/matchController");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const redis = require("./config/redisConnection");

let redisStore = new RedisStore({
  client: redis,
});

app.use(
  session({
    store: redisStore,
    secret: "fairGameScore",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60, // 1000*60*60 = 1 hour
    },
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
// Routes and authentication logic go here
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/score", scoreController);
app.use("/player", playerController);
app.use("/toss", tossController);
app.use("/", authController);
app.use("/", matchController);

<<<<<<< Updated upstream
    const match = await matchRepo
      .createQueryBuilder("match")
      .orderBy("match.startAt", "DESC")
      .getMany();

    const homeContent = await ejs.renderFile(__dirname + "/views/home.ejs", {
      match,
    });

    res.render("layout/mainLayout", {
      title: "Home",
      body: homeContent,
    });
  })
);

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
      __dirname + "/views/addMatch.ejs",
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

app.get(
  "/login",
  catchAsyncErrors(async (req, res, next) => {
    const loginContent = await ejs.renderFile(__dirname + "/views/login.ejs");

    res.render("layout/authLayout", {
      title: "Login",
      body: loginContent,
    });
  })
);

app.post(
  "/login",
  [
    body("userName").notEmpty().trim().escape(),
    body("password").notEmpty().trim().escape(),
  ],
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    controller.postLogin(req, res);
  })
);

app.get(
  "/register",
  catchAsyncErrors(async (req, res, next) => {
    const registerContent = await ejs.renderFile(
      __dirname + "/views/register.ejs"
    );

    res.render("layout/authLayout", {
      title: "Register",
      body: registerContent,
    });
  })
);

app.post(
  "/register",
  [
    body("userName").notEmpty().trim().escape(),
    body("password").notEmpty().trim().escape(),
  ],
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    controller.postRegister(req, res);
  })
);

app.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    req.session.destroy((err) => {
      if (err) {
        return res.send("Error logging out");
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.redirect("login"); // Redirect to the login page
    });
  })
);

app.post("/addMatch", isLoggedIn, (req, res, next) => {
  controller.addMatch(req, res);
});
app.get("/getMatchById/:marketId", isLoggedIn, (req, res, next) => {
  controller.getMatchById(req, res);
});
=======
>>>>>>> Stashed changes
