const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { createClient } = require("redis");
const RedisStore = require("connect-redis").default;
const { body, validationResult } = require("express-validator");
const path = require("path");
const User = require("./models/User.entity");
const getDataSource = require("./config/PostGresConnection");
const catchAsyncErrors = require("./middleware/catchAsyncErrors");
const MatchSchema = require("./models/Match.entity");

const ejs = require('ejs');

const app = express();
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

app.use(
  session({
    store: redisClient,
    secret: "fairGame", // Change this to a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true in a production environment with HTTPS
  })
);

// Routes and authentication logic go here

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.redirect("layout/mainLayout", {
    title: "Home",
    body: ejs.renderFile("/pages/home.ejs"),
  });
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.post(
  "/login",
  [
    body("username").notEmpty().trim().escape(),
    body("password").notEmpty().trim().escape(),
  ],
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    const AppDataSource = await getDataSource();
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo
      .createQueryBuilder("user")
      .where("user.username = :username", { username })
      .andWhere("user.password = :password", { password })
      .getOne();

    if (user) {
      req.session.loggedIn = true;
      req.session.username = username;
      redisClient
        .hSet("123", { "12": "34" })
        .then((d) => {
          console.log("value set in redis", d);
        })
        .catch((e) => {
          console.log("error at redis ", e);
        });
      res.redirect("home");
    } else {
      return res.status(401).send("Invalid credentials");
      // res.redirect("login");
    }
  })
);

app.get("/register", (req, res) => {
  res.render("pages/register");
});

app.post(
  "/register",
  [
    body("username").notEmpty().trim().escape(),
    body("password").notEmpty().trim().escape(),
  ],
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    const AppDataSource = await getDataSource();
    const userRepo = AppDataSource.getRepository(User);

    const newUser = userRepo.create({
      username,
      password,
    });

    // Save the new user to the database
    const savedUser = await userRepo.save(newUser);

    if (savedUser) {
      res.redirect("login");
    }
  })
);

app.get(
  "/home",
  catchAsyncErrors(async (req, res, next) => {
    if (req.session.loggedIn) {
      const AppDataSource = await getDataSource();
      const matchRepo = AppDataSource.getRepository(MatchSchema);

      const match = await matchRepo.createQueryBuilder("match").getMany();

      res.render("home", {
        match,
      });
    } else {
      res.redirect("login");
    }
  })
);

app.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    redisClient
      .hGetAll("123")
      .then((d) => {
        console.log("value set in redis", d);
      })
      .catch((e) => {
        console.log("error at redis ", e);
      });
    req.session.destroy((err) => {
      if (err) {
        return res.send("Error logging out");
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.redirect("login"); // Redirect to the login page
    });
  })
);
