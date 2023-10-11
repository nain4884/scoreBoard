const API_BASE_URL = "http://localhost:3000";

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
};

const currentInningVal = currentInning;
const marketId = window.location.href.split("/").pop();
let currScore = -1;

/**
 * Change player information via an API call.
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
      throw new Error("API request failed");
    }

    const data = await response.json();
    currentInningVal = parseInt(currentInningVal) + 1;
    elements.inning.innerHTML = currentInningVal;
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

const handleChangeScore = async (key) => {
  if (parseInt(key) != NaN && parseInt(key) <= 6) {
    currScore = parseInt(key);
  } else if (key == "Enter" && currScore > -1) {
    try {
      const response = await fetch(`${API_BASE_URL}/score/changeScore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketId,
          inningNumber: currentInningVal,
          eventType: "ball",
          score: currScore,
        }),
      });

      if (!response.ok) {
        throw Error("API request failed");
      }

      const data = await response.json();
      console.log(data);
      currScore = -1;
    } catch (error) {
      console.error("Error:", error);
      // Display an error message to the user
    }
  }
};

/**
 * Debounce function to delay function execution.
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

elements.changeInning.addEventListener("click", (e) => {
  e.preventDefault();
  handleChangeInning();
});

elements.scoreBox.addEventListener("keydown", (e) => {
  handleChangeScore(e.key);
});
