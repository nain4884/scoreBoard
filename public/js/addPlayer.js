/**
 * Selecting DOM elements
 */
const playerType = document.getElementById("playerType");
const bowlerCont = document.getElementById("bowlerCont");
const teamName = document.getElementById("teamName");
const playerName = document.getElementById("playerName");
const bowlerType = document.getElementById("bowlerType");
const form = document.querySelector("form");
const marketId = window.location.href.split("/").pop();

/**
 * Handle the player type change event.
 */
function handlePlayerTypeChange() {
  if (playerType.value === "bowler") {
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
    form.reset();
    hideBowlerCont();
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Add the player to the match using an API request.
 */
async function addPlayerToMatch() {
  const requestBody = {
    marketId: marketId,
    gameType: gameType, // Make sure you have a reference to gameType
    teamName: teamName.value,
    playerName: playerName.value,
    playerType: playerType.value,
    bowlerType: bowlerType.value,
  };

  return fetch("/player/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

// Attach event listeners
playerType.addEventListener("change", handlePlayerTypeChange);
form.addEventListener("submit", handleSubmit);
