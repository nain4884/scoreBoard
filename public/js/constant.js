const API_BASE_URL = "http://localhost:3000";

const ballEventKeys = {
  b: "b", //ball with score
  w: "w", //wide ball
  n: "n", //no ball
  r: "r", //run out
  o: "wck", //wicket
  d: "d", //drink break
  t: "timeout", //timeout
  shift: "shift", //ball start/stop
  esc: "clear", //clear event
  enter: "submit", //submit event
};

const keyName = {
  b: "Ball", //ball with score
  w: "Wide Ball", //wide ball
  n: "No Ball", //no ball
  r: "Run out", //run out
  wck: "Wicket", //wicket
  d: "Drink Break", //drink break
  timeout: "Timeout", //timeout
  shift: "Ball Start/Stop", //ball start/stop
  clear: "Clear event",//clear event
  submit: "Submit event",//submit event
};
