/**
 * @typedef {Object} Player
 * @property {string} marketId - The market ID.
 * @property {string} gameType - The game type.
 * @property {string} teamName - The team name.
 * @property {string} playerName - The player's name.
 * @property {string} playerType - The type of player.
 * @property {string} bowlerType - The bowler type.
 */

/**
 * DOM elements
 * @type {NodeListOf<HTMLInputElement>}
 */
const playerType = document.querySelectorAll('input[name="playerType"]');
const bowlerCont = document.getElementById("bowlerCont");
const teamName = document.getElementById("teamName");
const playerName = document.getElementById("playerName");
const bowlerType = document.getElementById("bowlerType");
const form = document.querySelector("form");
const tableContainer = document.getElementById("playerTable");

/**
 * Get the market ID from the URL.
 * @type {string}
 */
const marketId = window.location.href.split("/").pop();

/**
 * Handle the change event for the player type.
 */
function handlePlayerTypeChange() {
  if (getSelectedPlayerType() == "bowler") {
    showBowlerCont();
  } else {
    hideBowlerCont();
  }
}

/**
 * Show the bowler container.
 */
function showBowlerCont() {
  bowlerCont.style.display = "inline";
}

/**
 * Hide the bowler container.
 */
function hideBowlerCont() {
  bowlerCont.style.display = "none";
}

/**
 * Handle the form submission.
 * @param {Event} event - The form submission event.
 */
async function handleSubmit(event) {
  event.preventDefault();

  if (!form.checkValidity()) {
    return;
  }

  form.classList.add("was-validated");

  try {
    const response = await addPlayerToMatch();

    if (!response.ok) {
      const errorMessage = await response.text();
      showToast(errorMessage, "error");
      throw new Error("API request failed");
    }

    showToast("Player added successfully");
    resetForm();
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Add a player to the match using an API request.
 * @returns {Promise<Response>} - The API response.
 */
async function addPlayerToMatch() {
  const requestBody /** @type {Player} */ = {
    marketId,
    gameType: getGameType(), // Make sure you have a reference to gameType
    teamName: teamName.value,
    playerName: playerName.value,
    playerType: getSelectedPlayerType(),
    bowlerType: bowlerType.value || "spinner",
  };

  return fetch("/player/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

async function getPlayers() {
  try {
    const requestBody /** @type {Player} */ = {
      marketId,
      gameType: getGameType(), // Make sure you have a reference to gameType
      teamName: teamName.value,
    };

    const response = await fetch("/player/getPlayerByMatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      showToast(errorMessage, "error");
      throw new Error("API request failed");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Get the selected player type.
 * @returns {string} - The selected player type.
 */
function getSelectedPlayerType() {
  return document.querySelector('input[name="playerType"]:checked').value;
}

/**
 * Get the game type (replace with your actual gameType logic).
 * @returns {string} - The game type.
 */
function getGameType() {
  // Replace with your logic to get the game type.
  return gameType;
}

/**
 * Reset the form fields and selected player type.
 */
function resetForm() {
  playerName.value = "";
  bowlerType.value = "";
  playerType.forEach((radioButton) =>
    radioButton?.value == "batsman"
      ? (radioButton.checked = true)
      : (radioButton.checked = false)
  );

  hideBowlerCont();
  getPlayersTable();
}

/**
 * Create an HTML table from an array of data objects.
 * @param {Array} data - An array of data objects.
 * @returns {HTMLTableElement} - The generated HTML table element.
 */
function createTableFromData(data) {
  const table = document.createElement("table");
  table.classList.add(
    "table",
    "table-striped",
    "table-bordered",
    "table-player"
  ); // Add Bootstrap table classes

  if (data.length === 0) {
    const emptyRow = table.insertRow();
    const cell = emptyRow.insertCell();
    cell.colSpan = 2;
    cell.textContent = "No data available.";
  } else {
    const headerRow = table.insertRow();

    const headers = ["Serial No", "Player Name", "Player Type"];
    headers.forEach((headerText) => {
      const headerCell = document.createElement("th");
      headerCell.textContent = headerText;
      headerRow.appendChild(headerCell);
    });

    let serialNumber = 1;

    data?.batsman
      ?.filter((item) => item?.teamName == teamName?.value)
      ?.forEach((item, index) => {
        addPlayerToTable(table, item, index, serialNumber++);
      });

    data?.bowler
      ?.filter((item) => item?.teamName == teamName?.value)
      ?.forEach((item, index) => {
        addPlayerToTable(table, item, index, serialNumber++);
      });
  }

  return table;
}

function addPlayerToTable(table, player, index, serialNumber) {
  const row = table.insertRow();
  const cells = [
    serialNumber,
    player.playerName,
    `${player.playerType} ${
      player.playerType === "bowler"
        ? `(${player.bowlerType.toUpperCase()})`
        : ""
    }`,
  ];
  cells.forEach((cellText) => {
    const cell = row.insertCell();
    cell.textContent = cellText;
  });

  // Add Bootstrap table row classes for better design
  row.classList.add(index % 2 === 0 ? "table-primary" : "table-secondary");
}

const getPlayersTable = async () => {
  const data = await getPlayers();
  tableContainer.innerHTML = "";
  const tableElement = createTableFromData(data);
  tableContainer.appendChild(tableElement);
};

/**
 * Attach event listeners.
 */
playerType.forEach((radioButton) => {
  radioButton.addEventListener("click", handlePlayerTypeChange);
});
form.addEventListener("submit", handleSubmit);

teamName.addEventListener("change", getPlayersTable);
