const API_BASE_URL = "http://localhost:4000";

const ballEventKeys = {
  b: { key: "b", name: "Ball", validKeys: [] }, //ball with score
  w: { key: "w", name: "Wide Ball", validKeys: [] }, //wide ball
  n: { key: "n", name: "No Ball", validKeys: ["r"] }, //no ball
  r: { key: "r", name: "Run out", validKeys: ["n"] }, //run out
  o: { key: "wck", name: "Wicket", validKeys: [] }, //wicket
  d: { key: "d", name: "Drink Break", validKeys: [] }, //drink break
  t: { key: "timeout", name: "Timeout", validKeys: [] }, //timeout
  shift: { key: "shift", name: "Ball Start/Stop", validKeys: [] }, //ball start/stop
  esc: { key: "clear", name: "Clear Event", validKeys: [] }, //clear event
  enter: { key: "submit", name: "Submit Event", validKeys: [] }, //submit event
};
