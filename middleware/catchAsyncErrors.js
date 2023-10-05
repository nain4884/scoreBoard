module.exports = (func) => (req, res, next) =>
  Promise.resolve(func(req, res, next)).catch((error) => {
    console.log("err", error);
    return res.status(500).send(error.message);
  });
