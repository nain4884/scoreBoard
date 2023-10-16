const { Router } = require("express");
const app = Router();
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ejs = require("ejs");
const { getMatchByIdService } = require("../services/scoreService");


app.get(
    "/:marketId",
    catchAsyncErrors(async (req, res, next) => {
      const { marketId } = req.params;
      const matchData = await getMatchByIdService(res, marketId);
  
      const tossContent = await ejs.renderFile(
        __dirname + "/../views/addToss.ejs",
        {
            matchData: matchData,
        }
      );
      res.render("layout/mainLayout", {
        title: "Toss",
        body: tossContent,
      });
    })
  );


module.exports = app;
