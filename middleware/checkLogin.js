// isLoggedIn.js

const isLoggedIn = (req, res, next) => {
    return next();
    // Check if the user is logged in (You can implement your own logic here)
    if (req.session.loggedIn) {
      // If the user is logged in, proceed to the next middleware or route handler
      return next();
    } else {
      // If the user is not logged in, redirect them to the login page or send an error response
    //   return res.status(401).json({ message: "Unauthorized: User not logged in" });
    res.redirect("login");
    }
  };
  
  module.exports = isLoggedIn;
  