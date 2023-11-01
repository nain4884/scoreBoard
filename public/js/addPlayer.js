let selectedPlayer = null;
/**
 * Enum containing element IDs and their corresponding HTMLElements.
 */
const elements = {
  playerType: document.querySelectorAll('input[name="playerType"]'),
  bowlerCont: getById("bowlerCont"),
  teamName: getById("teamName"),
  playerName: getById("playerName"),
  bowlerType: document.querySelectorAll('input[name="bowlerType"]'),
  form: document.querySelector("form"),
  tableContainer: getById("playerTable"),
  submitBtn: getById("submitBtn"),
};

/**
 * Handle the form submission.
 * @param {Event} event - The form submission event.
 */
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!elements.form.checkValidity()) {
    return;
  }

  elements.form.classList.add("was-validated");

  try {
    const response = await addPlayerToMatch();
    if (response) {
      showToast(`Player ${selectedPlayer ? "updated" : "added"} successfully`);
      if (selectedPlayer != null) {
        selectedPlayer = null;
        elements.submitBtn.innerHTML = "Add Player";
      }
      resetForm();
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 * Add a player to the match using an API request.
 * @returns {Promise<Response>} - The API response.
 */
const addPlayerToMatch = async () => {
  let requestBody = null;
  if (selectedPlayer) {
    requestBody /** @type {Player} */ = {
      marketId,
      gameType: gameType, // Make sure you have a reference to gameType
      teamName: elements.teamName.value,
      playerName: elements.playerName.value,
      playerType: getRadioValue("playerType"),
      bowlerType: getRadioValue("bowlerType"),
      id: selectedPlayer.id,
    };
  } else {
    requestBody /** @type {Player} */ = {
      marketId,
      gameType: gameType, // Make sure you have a reference to gameType
      teamName: elements.teamName.value,
      playerName: elements.playerName.value,
      playerType: getRadioValue("playerType"),
      bowlerType: getRadioValue("bowlerType"),
    };
  }
  return apiService.post("/player/add", requestBody);
};

const getPlayers = async () => {
  try {
    const requestBody /** @type {Player} */ = {
      marketId,
      gameType: gameType, // Make sure you have a reference to gameType
      teamName: teamName.value,
    };

    const response = await apiService.post(
      "/player/getPlayerByMatch",
      requestBody
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};



/**
 * Reset the form fields and selected player type.
 */
const resetForm = async () => {
  elements.playerName.value = "";
  elements.bowlerType?.forEach((radioButton) =>
    radioButton?.value == "spinner"
      ? (radioButton.checked = true)
      : (radioButton.checked = false)
  );
  elements.playerType.forEach((radioButton) =>
    radioButton?.value == "batsman"
      ? (radioButton.checked = true)
      : (radioButton.checked = false)
  );

  getPlayersTable();
};

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

    const headers = ["Serial No", "Player Name", "Player Type", "Action"];
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
    "edit",
  ];
  cells.forEach((cellText, index) => {
    const cell = row.insertCell();
    if (cellText == "edit") {
      const button = document.createElement("button");
      button.className = "btn btn-primary";
      button.textContent = "Edit";

      button.addEventListener("click", () => {
        selectPlayer(player);
      });

      cell.appendChild(button);
    } else {
      cell.textContent = cellText;
    }
  });

  // Add Bootstrap table row classes for better design
  row.classList.add(index % 2 === 0 ? "table-primary" : "table-secondary");
}

const selectPlayer = async (item) => {
  selectedPlayer = { ...item };
  elements.playerName.value = selectedPlayer.playerName;
  document.querySelector(
    `input[name="bowlerType"][value="${selectedPlayer.bowlerType}"]`
  ).checked = true;
  document.querySelector(
    `input[name="playerType"][value="${selectedPlayer.playerType}"]`
  ).checked = true;

  elements.submitBtn.innerHTML = "Update Player";
};

const getPlayersTable = async () => {
  const data = await getPlayers();
  elements.tableContainer.innerHTML = "";
  const tableElement = createTableFromData(data);
  elements.tableContainer.appendChild(tableElement);
  selectedPlayer = null;
  elements.submitBtn.innerHTML = "Add Player";
};

elements.form.addEventListener("submit", handleSubmit);

elements.teamName.addEventListener("change", getPlayersTable);
elements.playerName.addEventListener("input", function () {
 
  var inputValue = this.value;
  if (/[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\\/\-=]/.test(inputValue)) {
    elements.playerName.value = this.value.replace(
      /[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\\/\-=]/,
      ""
    );
  }
});
