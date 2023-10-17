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

