const ejs = require("ejs");
const bcrypt=require("bcrypt");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { validationResult, body } = require("express-validator");
const { getDataSource, AppDataSource } = require("../orm.config");
const { Router } = require("express");
const User = require("../models/User.entity");

const app = Router();
const userRepo = AppDataSource.getRepository(User);


app.post(
  "/login",
  [
    body("userName").notEmpty().trim().escape(),
    body("password").notEmpty().trim().escape(),
  ],
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    const { userName, password } = req.body;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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
  })
);

app.get(
  "/login",
  catchAsyncErrors(async (req, res, next) => {
    const loginContent = await ejs.renderFile(__dirname + "/../views/login.ejs");

    res.render("layout/authLayout", {
      title: "Login",
      body: loginContent,
    });
  })
);

app.get(
  "/register",
  catchAsyncErrors(async (req, res, next) => {
    const registerContent = await ejs.renderFile(
      __dirname + "/../views/register.ejs"
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
    let { userName, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const saltRounds = 10;
    password = await bcrypt.hash(password, saltRounds);
    
    const newUser = userRepo.create({
      userName,
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
  
module.exports = app;
