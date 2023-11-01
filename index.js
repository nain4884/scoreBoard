const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const RedisStore = require("connect-redis").default;
const redis = require("./config/redisConnection");

const scoreController = require("./controller/scoreController");
const playerController = require("./controller/playerController");
const tossController = require("./controller/tossController");
const authController = require("./controller/authController");
const matchController = require("./controller/matchController");

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Enable Cross-Origin Resource Sharing (CORS)
 */
app.use(cors({ origin: "*" }));

/**
 * Parse incoming JSON data
 */
app.use(express.json());

/**
 * Parse URL-encoded data with extended support
 */
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Serve static files from the "public" directory
 */
app.use(express.static(path.join(__dirname, "public")));

const redisStore = new RedisStore({ client: redis });

/**
 * Configure session handling
 */
app.use(
  session({
    store: redisStore,
    secret: "fairGameScore",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60, // 1 hour in milliseconds
    },
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// API routes
app.use("/score", scoreController);
app.use("/player", playerController);
app.use("/toss", tossController);
app.use("/", authController);
app.use("/", matchController);

/**
 * Start the Express server
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
