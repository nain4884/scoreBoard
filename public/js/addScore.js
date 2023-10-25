/**
 * Represents an object containing references to various HTML elements.
 *
 * @typedef {Object} Elements
 * @property {HTMLElement} exchangeButton - The button to exchange strike.
 * @property {HTMLSelectElement} striker - The striker's input element.
 * @property {HTMLSelectElement} nonStriker - The non-striker's input element.
 * @property {NodeList} bowlerType - Radio buttons for selecting bowler type.
 * @property {HTMLSelectElement} bowler - The bowler's input element.
 * @property {HTMLElement} changeInning - The button for changing the inning.
 * @property {HTMLInputElement} scoreBox - The input element for score events.
 * @property {HTMLFormElement} form - The form element.
 * @property {HTMLElement} inning - The inning element.
 * @property {HTMLElement} currScoreShow - The element displaying current score.
 */

/** @type {Elements} */
const elements = {
  exchangeButton: document.getElementById("exchange"),
  striker: document.getElementById("batsmanStrike"),
  nonStriker: document.getElementById("batsmanNonStrike"),
  bowlerType: document.querySelectorAll('input[name="bowlerType"]'),
  bowler: document.getElementById("bowler"),
  changeInning: document.getElementById("changeInning"),
  scoreBox: document.getElementById("scoreEvent"),
  form: document.getElementById("score-form"),
  inning: document.getElementById("inning"),
  currScoreShow: document.getElementById("curr-score"),
  strikerSwitch: document.getElementById("strikerSwitch"),
  nonStrikerSwitch: document.getElementById("nonStrikerSwitch"),
  ballerSwitch: document.getElementById("ballerSwitch"),
  undoBtn: document.getElementById("undo"),
};

let score = 0;
let events = [];
let currInningData = null;
let selectedBaller = null;

let disableStriker = false;
let disableNonStriker = false;

/** @type {number} */
let currentInningVal = currentInning;
const marketId = window.location.href.split("/").pop();
let currScore = -1;

/**
 * Change player information via an API call.
 *
 * @param {string} type - The type of player (e.g., "striker", "nonStriker").
 * @param {string} value - The new player's value.
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
        bowlerType: type == "bowler" ? selectedBaller?.bowlerType : "",
      }),
    });

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw new Error("API request failed");
    }

    const data = await response.json();
    getScore(false);
    getScore(true);
    changeCheckboxState(type);
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

function changeCheckboxState(type, action = false) {
  var event = new Event("change", { bubbles: true });
  var checkboxElement;

  if (type === "striker") {
    checkboxElement = elements.strikerSwitch;
  } else if (type === "nonStriker") {
    checkboxElement = elements.nonStrikerSwitch;
  } else if (type == "baller") {
    checkboxElement = elements.ballerSwitch;
  }
  // Change the checked state of the checkbox and dispatch the 'change' event.
  checkboxElement.checked = action;
  checkboxElement.dispatchEvent(event);
}

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
    if (currentInningVal < 2) {
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

      currentInningVal = parseInt(currentInningVal) + 1;
      elements.inning.innerHTML = currentInningVal;
      await getScore(false);
      await getScore(true);
      await setPlayer();
      showToast("Inning changed successfully", "success");
    }
  } catch (error) {
    showToast(error, "error");
    // Display an error message to the user
  }
};

/**
 * Handle the change in score input.
 *
 * @param {string} key - The key pressed.
 */
const handleChangeScore = async (key) => {
  if (
    elements.strikerSwitch.checked ||
    elements.nonStrikerSwitch.checked ||
    elements.ballerSwitch.checked
  ) {
    showToast(
      "Please select the batsman and baller, if already selected then disable all the inputs by the switch",
      "error"
    );
    return;
  }

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
        events = ["ball stop"];
      } else if (
        !events.includes("ball start") &&
        !events.includes("ball stop")
      ) {
        events = ["ball start"];
      }
      break;
    case "Enter":
      try {
        const response = await fetch(`${API_BASE_URL}/score/changeScore`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            marketId,
            inningNumber: currentInningVal,
            eventType: events?.length == 0 ? ["b"] : events,
            score: score,
          }),
        });

        if (!response.ok) {
          showToast(await response.text(), "error");
          throw Error("API request failed");
        }

        const data = await response.json();
        await getScore(false);
        await getScore(true);
        await setPlayer();

        await messageBasedActions(events, data?.isLastBall);

        currScore = -1;
        elements.currScoreShow.innerHTML = "";
        score = 0;
        events = [];
      } catch (error) {
        console.error("Error:", error);
        // Display an error message to the user
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
        let isValid = true;
        events?.forEach((items) => {
          if (
            !Object.keys(ballEventKeys).find(
              (key) => ballEventKeys[key].key === items
            ) ||
            !ballEventKeys[
              Object.keys(ballEventKeys).find(
                (key) => ballEventKeys[key].key === items
              )
            ]?.validKeys?.includes(key)
          ) {
            isValid = false;
          }
        });

        if (isValid) {
          events.push(ballEventKeys[key]?.key);
        } else {
          events = [ballEventKeys[key]?.key];
        }
      }
      break;
  }

  elements.currScoreShow.innerHTML = `<p>Event keys: ${events
    .map((item) =>
      Object.keys(ballEventKeys)?.find(
        (items) => ballEventKeys[items]?.key == item
      )
        ? ballEventKeys[
            Object.keys(ballEventKeys)?.find(
              (items) => ballEventKeys[items]?.key == item
            )
          ]?.name
        : item
    )
    .join(",")}</p><p>Selected score: ${score}</p>`;
};

const messageBasedActions = async (event, isLastBall) => {
  if (isLastBall) {
    changeCheckboxState("baller", true);
  }

  if (event?.includes("wck")) {
    changeCheckboxState("striker", true);
  } else if (event?.includes("r")) {
    changeCheckboxState("striker", true);
    changeCheckboxState("nonStriker", true);
  } else if (event?.includes("ball start")) {
    localStorage.setItem("ballStart", true);
  } else if (event.includes("ball stop")) {
    localStorage.setItem("ballStart", false);
  }
};

/**
 * Fetch the match score from the API.
 *
 * @param {boolean} isJson - Whether to fetch JSON data or plain text.
 */
const getScore = async (isJson) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/score/getMatchScore/${marketId}${
        isJson ? "?isJson=" + isJson : ""
      }`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw Error("API request failed");
    }
    if (isJson) {
      currInningData = await response.json();
    } else {
      document.getElementById("scoreDisplay").innerHTML = await response.text();
    }
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
 * Fetch player data from the API.
 *
 * @param {string} type - The type of player (e.g., "batsman", "baller").
 */
const getPlayers = async (type) => {
  try {
    const response = await fetch(`${API_BASE_URL}/player/getPlayerByMatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketId,
        teamName:
          currInningData?.innings[
            parseInt(currInningData?.currentInning) - 1
          ]?.[`inn${parseInt(currInningData?.currentInning)}TeamName`],
        gameType: gameType,
        findBowler: type == "baller",
        outPlayer: false,
      }),
    });

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw new Error("API request failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

/**
 * Populate player options based on the selected bowler type.
 */
const setPlayer = async () => {
  const playerData = await getPlayers();
  elements.striker.innerHTML = '<option value="">Select the striker</option>';
  elements.nonStriker.innerHTML =
    '<option value="">Select the non striker</option>';
  // for striker
  playerData?.batsman
    ?.filter(
      (item) =>
        item?.playerName !=
        currInningData?.innings[parseInt(currInningData?.currentInning) - 1]?.[
          `inn${currInningData?.currentInning}NonStriker`
        ]
    )
    ?.map((item) => {
      const option = document.createElement("option");
      option.value = item.playerName;
      option.text = item.playerName;
      elements.striker.appendChild(option);
    });
  // for non

  playerData?.batsman
    ?.filter(
      (item) =>
        item?.playerName !=
        currInningData?.innings[parseInt(currInningData?.currentInning) - 1]?.[
          `inn${currInningData?.currentInning}Striker`
        ]
    )
    ?.map((item) => {
      const option = document.createElement("option");
      option.value = item.playerName;
      option.text = item.playerName;
      elements.nonStriker.appendChild(option);
    });

  elements.bowler.innerHTML = "";
  playerData?.bowler
    ?.filter(
      (item) =>
        item?.bowlerType == getSelectedBallerType() ||
        !getSelectedBallerType() ||
        getSelectedBallerType() == "all"
    )
    ?.map((item) => {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-primary"); // Add Bootstrap button classes
      button.textContent = `${item.playerName} (${item?.bowlerType})`;

      // Add an event listener to the button
      button.onclick = function () {
        selectedBaller = item;
        changePlayer("bowler", item?.playerName);
        changeCheckboxState("baller", false);
      };

      elements?.bowler?.appendChild(button);
    });

  elements.striker.value =
    currInningData?.innings[parseInt(currInningData?.currentInning) - 1]?.[
      `inn${currInningData?.currentInning}Striker`
    ];
  elements.nonStriker.value =
    currInningData?.innings[parseInt(currInningData?.currentInning) - 1]?.[
      `inn${currInningData?.currentInning}NonStriker`
    ];
};

/**
 * Get the selected bowler type.
 *
 * @returns {string} - The selected bowler type.
 */
function getSelectedBallerType() {
  return document.querySelector('input[name="bowlerType"]:checked')?.value;
}

const undoEvent = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/score/revertLastBall`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketId,
        inningNumber: currInningData?.currentInning,
      }),
    });

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw new Error("API request failed");
    }
    if (response.url !== `${API_BASE_URL}/score/revertLastBall`) {
      // Handle redirection, e.g., perform a client-side redirection
      window.location.href = response.url;
      return;
    }

    const data = await response.json();
    await getScore(false);
    await getScore(true);
    await setPlayer();
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

/**
 * Event Listeners
 */
elements.exchangeButton.addEventListener("click", (e) => {
  e.preventDefault();
  changeStrike();
});

elements.striker.addEventListener("input", () => {
  changePlayer("striker", elements.striker.value);
});
elements.nonStriker.addEventListener("input", () => {
  changePlayer("nonStriker", elements.nonStriker.value);
});

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

window.onload = async () => {
  await getScore(false);
  await getScore(true);
  await setPlayer();

  if (elements.striker.value !== "" && elements.striker.value) {
    changeCheckboxState("striker", false);
  }
  if (elements.nonStriker.value !== "" && elements.nonStriker.value) {
    changeCheckboxState("nonStriker", false);
  }
};

elements?.bowlerType?.forEach((radioButton) => {
  radioButton.addEventListener("click", setPlayer);
});

elements.strikerSwitch.addEventListener("change", (e) => {
  elements.striker.disabled = !elements.strikerSwitch.checked;
});

elements.nonStrikerSwitch.addEventListener("change", (e) => {
  elements.nonStriker.disabled = !elements.nonStrikerSwitch.checked;
});

elements.ballerSwitch.addEventListener("change", () => {
  elements.bowler.style.display = elements?.ballerSwitch?.checked
    ? "flex"
    : "none";
});

elements.undoBtn.addEventListener("click", undoEvent);
