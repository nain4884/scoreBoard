const protocol = window.location.protocol;
const host = window.location.host;
const API_BASE_URL = protocol + "//" + host;

const ballEventKeys = {
  b: { key: "b", name: "Ball", validKeys: [], directLive: false }, //ball with score
  w: { key: "w", name: "Wide Ball", validKeys: [], directLive: false }, //wide ball
  n: { key: "n", name: "No Ball", validKeys: ["r"], directLive: false }, //no ball
  r: { key: "r", name: "Run out", validKeys: ["n"], directLive: false }, //run out
  o: { key: "wck", name: "Wicket", validKeys: [], directLive: false }, //wicket
  d: { key: "d", name: "Drink Break", validKeys: [], directLive: true }, //drink break
  t: { key: "timeout", name: "Timeout", validKeys: [], directLive: true }, //timeout
  u: { key: "u", name: "Third Umpire", validKeys: [], directLive: true }, //third umpire
  shift: {
    key: "shift",
    name: "Ball Start/Stop",
    validKeys: [],
    directLive: true,
  }, //ball start/stop
  esc: { key: "clear", name: "Clear Event", validKeys: [], directLive: false }, //clear event
  enter: {
    key: "submit",
    name: "Submit Event",
    validKeys: [],
    directLive: true,
  }, //submit event
};
