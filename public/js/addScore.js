/**
 * Constants
 */
const exchangeButton = document.getElementById("exchange");
const striker = document.getElementById("batsmanStrike");
const nonStriker = document.getElementById("batsmanNonStrike");
const bowlerType = document.getElementById("bowlerType");
const bowler = document.getElementById("bowler");
const changeInning = document.getElementById("changeInning");

let currentInningVal = currentInning;
const marketId = window.location.href.split("/").pop();

/**
 * Change player information via an API call.
 * @param {string} type - The type of player (e.g., "striker", "nonStriker").
 * @param {string} value - The new player value.
 */
const changePlayer = async (type, value) => {
  try {
    const response = await fetch(`http://localhost:3000/score/updatePlayer`, {
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
  await changePlayer("nonStriker", striker.value);
  await changePlayer("striker", nonStriker.value);
  swapInputValues(striker, nonStriker);
};

/**
 * Handle the change of inning via an API call.
 */
const handleChangeInning = async () => {
  try {
    const response = await fetch(`http://localhost:3000/score/changeInning`, {
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
    document.getElementById("inning").innerHTML = currentInningVal;
  } catch (error) {
    console.error("Error:", error);
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
exchangeButton.addEventListener("click", (e) => {
  e.preventDefault();
  changeStrike();
});
striker.addEventListener(
  "input",
  debounce(() => changePlayer("striker", striker.value))
);
nonStriker.addEventListener(
  "input",
  debounce(() => changePlayer("nonStriker", nonStriker.value))
);
bowler.addEventListener(
  "input",
  debounce(() => changePlayer("bowler", bowler.value))
);
bowlerType.addEventListener(
  "input",
  debounce(() => changePlayer("bowlerType", bowlerType.value))
);
changeInning.addEventListener("click", (e) => {
  e.preventDefault();
  handleChangeInning();
});
