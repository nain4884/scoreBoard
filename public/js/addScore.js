/**
 * Object containing references to various HTML elements.
 * @typedef {Object} Elements
 * @property {HTMLElement} exchangeButton - The exchange button element.
 * @property {HTMLElement} striker - The striker input element.
 * @property {HTMLElement} nonStriker - The non-striker input element.
 * @property {HTMLElement} bowlerType - The bowler type input element.
 * @property {HTMLElement} bowler - The bowler input element.
 * @property {HTMLElement} changeInning - The change inning button element.
 * @property {HTMLElement} scoreBox - The score box input element.
 * @property {HTMLElement} form - The form element.
 * @property {HTMLElement} inning - The inning element.
 * @property {HTMLElement} currScoreShow - The current score display element.
 */

/** @type {Elements} */
const elements = {
  exchangeButton: document.getElementById("exchange"),
  striker: document.getElementById("batsmanStrike"),
  nonStriker: document.getElementById("batsmanNonStrike"),
  bowlerType: document.getElementById("bowlerType"),
  bowler: document.getElementById("bowler"),
  changeInning: document.getElementById("changeInning"),
  scoreBox: document.getElementById("scoreEvent"),
  form: document.getElementById("score-form"),
  inning: document.getElementById("inning"),
  currScoreShow: document.getElementById("curr-score"),
};

let score = 0;
let events = [];

/** @type {number} */
const currentInningVal = currentInning;
const marketId = window.location.href.split("/").pop();
let currScore = -1;

/**
 * Change player information via an API call.
 *
 * @param {string} type - The type of player (e.g., "striker", "nonStriker").
 * @param {string} value - The new player value.
 */
const changePlayer = async (type, value) => {
  try {
    const response = await fetch(`${API_BASE_URL}/score/updatePlayer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketId,
        playerType: type,
        playerName: value,
        inningNumber: currentInningVal,
      }),
    });

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw new Error("API request failed");
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

/**
 * Swap values between two input fields.
 *
 * @param {HTMLInputElement} input1 - The first input element.
 * @param {HTMLInputElement} input2 - The second input element.
 */
const swapInputValues = (input1, input2) => {
  [input1.value, input2.value] = [input2.value, input1.value];
};

/**
 * Handle the change of strike between the batsmen.
 */
const changeStrike = async () => {
  await changePlayer("nonStriker", elements.striker.value);
  await changePlayer("striker", elements.nonStriker.value);
  swapInputValues(elements.striker, elements.nonStriker);
};

/**
 * Handle the change of inning via an API call.
 */
const handleChangeInning = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/score/changeInning`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketId,
        inningNumber: parseInt(currentInningVal) + 1,
      }),
    });

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw new Error("API request failed");
    }

    const data = await response.json();
    currentInningVal = parseInt(currentInningVal) + 1;
    elements.inning.innerHTML = currentInningVal;
  } catch (error) {
    showToast(await response.text(), "error");
    // Display an error message to the user
  }
};

/**
 * Handle the change in score input.
 *
 * @param {string} key - The key pressed.
 */
const handleChangeScore = async (key) => {
  console.log(key);
  switch (key) {
    case "Escape":
    case "esc":
      score = 0;
      events = [];
      break;
    case "Shift":
      if (
        localStorage.getItem("ballStart") == "true" &&
        !events.includes("ball stop")
      ) {
        events.push("ball stop");
      } else if (!events.includes("ball start")) {
        events.push("ball start");
      }
      break;
    case "Enter":
      if (events.length > 0) {
        try {
          const response = await fetch(`${API_BASE_URL}/score/changeScore`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              marketId,
              inningNumber: currentInningVal,
              eventType: events,
              score: score,
            }),
          });

          if (!response.ok) {
            showToast(await response.text(), "error");
            throw Error("API request failed");
          }

          const data = await response.json();
         await getScore();
          if (data?.message == "Ball Started") {
            localStorage.setItem("ballStart", true);
          } else if (data?.message == "Ball Stop") {
            localStorage.setItem("ballStart", false);
          }
          currScore = -1;
          elements.currScoreShow.innerHTML = "";
          score = 0;
          events = [];
        } catch (error) {
          console.error("Error:", error);
          // Display an error message to the user
        }
      }
      break;
    default:
      if (!isNaN(key) && parseInt(key) <= 6) {
        currScore = parseInt(key);
        score = parseInt(key);
      } else if (
        Object.keys(ballEventKeys).includes(key) &&
        !events.includes(key)
      ) {
        events.push(key);
      }
      break;
  }
  console.log(events);

  elements.currScoreShow.innerHTML = `<p>Event keys: ${events
    .map((item) => (keyName[item] ? keyName[item] : item))
    .join(",")}</p><p>Selected score: ${score}</p>`;
};

const getScore = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/score/getMatchScore/${marketId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw Error("API request failed");
    }
    document.getElementById("scoreDisplay").innerHTML=await response.text()
  } catch (error) {
    console.log(error);
  }
};

/**
 * Debounce function to delay function execution.
 *
 * @param {Function} func - The function to be debounced.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
const debounce = (func, delay = 1000) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Event Listeners
 */
elements.exchangeButton.addEventListener("click", (e) => {
  e.preventDefault();
  changeStrike();
});

elements.striker.addEventListener(
  "input",
  debounce(() => changePlayer("striker", elements.striker.value))
);
elements.nonStriker.addEventListener(
  "input",
  debounce(() => changePlayer("nonStriker", elements.nonStriker.value))
);
elements.bowler.addEventListener(
  "input",
  debounce(() => changePlayer("bowler", elements.bowler.value))
);
elements.bowlerType.addEventListener(
  "input",
  debounce(() => changePlayer("bowlerType", elements.bowlerType.value))
);
elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
});

elements.form.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
  }
});
elements.scoreBox.addEventListener("keydown", (e) => {
  handleChangeScore(e.key);
});

elements.changeInning.addEventListener("click", (e) => {
  e.preventDefault();
  handleChangeInning();
});
