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
  exchangeButton: getById("exchange"),
  striker: getById("batsmanStrike"),
  nonStriker: getById("batsmanNonStrike"),
  bowlerType: document.querySelectorAll('input[name="bowlerType"]'),
  bowler: getById("bowler"),
  changeInning: getById("changeInning"),
  scoreBox: getById("scoreEvent"),
  form: getById("score-form"),
  inning: getById("inning"),
  currScoreShow: getById("curr-score"),
  undoBtn: getById("undo"),
  changeOver: getById("changeOver"),
  strikerOut: getById("strikerOut"),
  nonStrikerOut: getById("nonStrikerOut"),
  runOutCont: getById("runOutCont"),
  matchOver: getById("overMatch"),
};

let score = null;
let events = [];
let currInningData = null;
let selectedBaller = null;

/** @type {number} */
let currentInningVal = currentInning;
let currScore = -1;

/**
 * Change player information via an API call.
 *
 * @param {string} type - The type of player (e.g., "striker", "nonStriker").
 * @param {string} value - The new player's value.
 */
const changePlayer = async (type, value) => {
  try {
    const playerData = {
      marketId,
      playerType: type,
      playerName: value,
      inningNumber: currentInningVal,
      bowlerType: type == "bowler" ? selectedBaller?.bowlerType : "",
    };
    const response = await apiService.post("/score/updatePlayer", playerData);

    if (response) {
      getScore(false);
      getScore(true);
    }
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
    if (currentInningVal < 2) {
      const inningData = {
        marketId,
        inningNumber: parseInt(currentInningVal) + 1,
      };
      const response = await apiService.post("/score/changeInning", inningData);
      if (response) {
        currentInningVal = parseInt(currentInningVal) + 1;
        elements.inning.innerHTML = currentInningVal;
        await getScore(false);
        await getScore(true);
        await setPlayer();
        showToast("Inning changed successfully", "success");
      }
    }
  } catch (error) {
    console.log(error);
    // Display an error message to the user
  }
};

/**
 * Handle the change in score input.
 *
 * @param {string} key - The key pressed.
 */
const handleChangeScore = async (key) => {
  switch (key) {
    case "Escape":
    case "esc":
      score = null;
      events = [];
      break;
    case "Shift":
      if (
        localStorage.getItem("ballStart") == "true" &&
        !events.includes("ball stop")
      ) {
        events = ["ball stop"];
        elements.currScoreShow.innerHTML = `<p>Event keys:<span style="color:red;font-weight: bold;"> Ball Stop</span></p><p>Selected score: ${
          score >= 0 && score < 7 && score != null ? score : ""
        }</p>`;
      } else if (
        !events.includes("ball start") &&
        !events.includes("ball stop")
      ) {
        events = ["ball start"];
        elements.currScoreShow.innerHTML = `<p>Event keys:<span style="color:red;font-weight: bold;"> Ball Start</span></p><p>Selected score: ${
          score >= 0 && score < 7 && score != null ? score : ""
        }</p>`;
      }

      await liveScore();

      break;
    case "Enter":
      await liveScore();
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

      if (ballEventKeys[key]?.directLive) {
        await liveScore();
        events.push(ballEventKeys[key].name);
      }

      break;
  }
  if (key !== "Shift") {
    elements.currScoreShow.innerHTML = "";
    elements.currScoreShow.innerHTML = `<p>Event keys:<span style="color:red;font-weight: bold;"> ${events
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
      .join(",")}</span></p><p>Selected score: ${
      score >= 0 && score < 7 && score != null ? score : ""
    }</p>`;
  }
};

const liveScore = async () => {
  if ((events?.includes("b") || events?.length == 0 ) &&  (!(score > -1 && score < 7 && score != null))) {
    return;
  }
  try {
    const scoreData = {
      marketId,
      inningNumber: currentInningVal,
      eventType: events?.length == 0 ? ["b"] : events,
      score: score,
    };
    const response = await apiService.post("/score/changeScore", scoreData);

    const data = await response.json();

    await getScore(false);
    await getScore(true);
    await setPlayer();

    await messageBasedActions(events, data?.isFreeHit);

    currScore = -1;
    score = null;
    events = [];
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

const messageBasedActions = async (event, isFreeHit) => {
  if (!event?.includes("ball stop") || !event?.includes("ball start")) {
    localStorage.setItem("ballStart", false);
  }
  if (event.includes("r")) {
    elements.runOutCont.classList.remove("d-none");
  }
  if (isFreeHit === "true" || isFreeHit === true) {
    setTimeout(async () => {
      await getScore(true);
      await getScore(false);
    }, 3500);
  }

  if (event?.includes("ball start")) {
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
    const response = await apiService.get(
      `/score/getMatchScore/${marketId}${isJson ? "?isJson=" + isJson : ""}`
    );

    if (isJson) {
      currInningData = await response.json();
    } else {
      getById("scoreDisplay").innerHTML = await response.text();
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * Fetch player data from the API.
 *
 * @param {string} type - The type of player (e.g., "batsman", "baller").
 */
const getPlayers = async (type) => {
  try {
    const playerData = {
      marketId,
      teamName:
        currInningData?.innings[parseInt(currInningData?.currentInning) - 1]?.[
          `inn${parseInt(currInningData?.currentInning)}TeamName`
        ],
      gameType: gameType,
      findBowler: type == "baller",
      outPlayer: false,
    };
    const response = await apiService.post(
      "/player/getPlayerByMatch",
      playerData
    );

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

  clearSelectBox(elements.striker);
  clearSelectBox(elements.nonStriker);

  const currentInning = parseInt(currInningData?.currentInning) - 1;
  const nonStrikerName =
    currInningData?.innings[currentInning]?.[
      `inn${currInningData?.currentInning}NonStriker`
    ];
  const strikerName =
    currInningData?.innings[currentInning]?.[
      `inn${currInningData?.currentInning}Striker`
    ];

  // Populate Striker and Non-Striker options
  populatePlayerOptions(elements.striker, playerData?.batsman, "");
  populatePlayerOptions(elements.nonStriker, playerData?.batsman, "");

  clearBowlerBox(elements.bowler);

  // Populate Bowler options
  populateBowlerOptions(
    elements.bowler,
    playerData?.bowler,
    getRadioValue("bowlerType")
  );

  // Set Striker and Non-Striker values
  elements.striker.value = strikerName;
  elements.nonStriker.value = nonStrikerName;
};

const clearSelectBox = (selectElement) => {
  selectElement.innerHTML = '<option value="">Select a player</option>';
};

const populatePlayerOptions = (selectElement, playerList, excludeName) => {
  playerList?.forEach((item) => {
    if (item.playerName !== excludeName) {
      const option = document.createElement("option");
      option.value = item.playerName;
      option.text = item.playerName;
      selectElement.appendChild(option);
    }
  });
};

const clearBowlerBox = (bowlerElement) => {
  bowlerElement.innerHTML = "";
};

const populateBowlerOptions = (bowlerElement, bowlerList, selectedType) => {
  bowlerList?.forEach((item) => {
    if (selectedType === "all" || item.bowlerType === selectedType) {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-primary");
      button.textContent = `${item.playerName} (${item.bowlerType})`;

      button.onclick = () => {
        selectedBaller = item;
        changePlayer("bowler", item.playerName);
        // changeCheckboxState("baller", false);
      };

      bowlerElement.appendChild(button);
    }
  });
};

const undoEvent = async () => {
  try {
    const response = await apiService.post("/score/revertLastBall", {
      marketId,
      inningNumber: currInningData?.currentInning,
    });

    if (response.url !== `${API_BASE_URL}/score/revertLastBall`) {
      // Handle redirection, e.g., perform a client-side redirection
      window.location.href = response.url;
      return;
    }
    if (response) {
      await getScore(false);
      await getScore(true);
      await setPlayer();
    }
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

const runOutEvent = async (isStriker) => {
  try {
    const response = await apiService.post("/score/runout", {
      marketId,
      isStriker,
      inningNumber: currentInningVal,
      teamName:
        currInningData?.innings[parseInt(currInningData?.currentInning) - 1]?.[
          `inn${parseInt(currInningData?.currentInning)}TeamName`
        ],
      batsmanName: isStriker
        ? elements.striker.value
        : elements.nonStriker?.value,
    });

    if (response) {
      elements.runOutCont.classList.add("d-none");
      await getScore(true);
      await getScore(false);
      await setPlayer();
    }
  } catch (error) {
    console.error("Error:", error);
    // Display an error message to the user
  }
};

/**
 * Event Listeners
 */
// elements.exchangeButton.addEventListener("click", (e) => {
//   e.preventDefault();
//   changeStrike();
// });

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
};

elements?.bowlerType?.forEach((radioButton) => {
  radioButton.addEventListener("click", () => {
    setPlayer();
    changePlayer("bowlerType", getRadioValue("bowlerType"));
  });
});

elements.undoBtn.addEventListener("click", undoEvent);
elements.changeOver.addEventListener("click", async () => {
  events.push("over change");
  await liveScore();
});
elements.strikerOut.addEventListener("click", async () => {
  runOutEvent(true);
});
elements.nonStrikerOut.addEventListener("click", async () => {
  runOutEvent(false);
});
elements.matchOver.addEventListener("click", async () => {
  try {
    const response = await apiService.post("/match/over", {
      marketId,
    });

    if (response) {
      showToast("Match over");
    }
  } catch (error) {
    console.log("Error: ", error);
  }
});
