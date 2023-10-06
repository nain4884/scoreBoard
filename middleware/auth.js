const catchAsyncErrors = require("./catchAsyncErrors");

exports.isAuthenticates=catchAsyncErrors(async (req,res,next)=>{
    const {loggedIn}=req.session;

    if(!loggedIn){
        return res.redirect("login");
    }
    next();
})