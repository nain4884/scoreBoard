const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const { createClient } = require("redis");
const RedisStore = require("connect-redis").default;
const { body, validationResult } = require("express-validator");
const path = require("path");

// const User = require("./models/User.entity");
// const { getDataSource } = require("./config/PostGresConnection.js");
const catchAsyncErrors = require("./middleware/catchAsyncErrors");
// const MatchSchema = require("./models/Match.entity");
const controller = require('./controller');
const isLoggedIn = require("./middleware/checkLogin");

const app = express();
app.use(cors({origin: "*"}));
app.use(express.json());

const redisClient = createClient({
  host: "localhost",
  port: 6379,
});
redisClient.connect().catch(console.error);
let redisStore = new RedisStore({
  client: redisClient,
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

// Routes and authentication logic go here
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.redirect("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

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

app.get("/register", (req, res) => {
  res.render("register");
});

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
  "/home", isLoggedIn,
  catchAsyncErrors(async (req, res, next) => {
    controller.getMatchList(req, res);
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