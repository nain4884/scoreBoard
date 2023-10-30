// client.js
const gameType = document.getElementById("gameType");
const tournament = document.getElementById("tournament");
const matchType = document.getElementById("matchName");
const teamA = document.getElementById("teamA");
const teamB = document.getElementById("teamB");
const teamC = document.getElementById("teamC");
const startTime = document.getElementById("startTime");
const overBall = document.getElementById("overBall");
const noBall = document.getElementById("noBall");
const overs = document.getElementById("overs");
const form = document.querySelector("form");

const getQueryParam = (paramName) =>
  new URLSearchParams(window.location.search).get(paramName);

/**
 * Fetch a list of competitions and populate the tournament dropdown.
 */
async function fetchCompetitionList() {
  try {
    const response = await fetch(
      "https://3200dev.fairgame.club/competitionList"
    );
    if (!response.ok) {
      const errorMessage = await response.text();
      showToast(errorMessage, "error");
      throw new Error("API request failed");
    }
    const data = await response.json();

    if (data) {
      tournament.innerHTML = "";

      let optionElement = new Option("Select tournament", "");
      tournament.appendChild(optionElement);

      data?.forEach((option) => {
        optionElement = new Option(
          option.competition.name,
          option.competition.id
        );
        tournament.appendChild(optionElement);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Fetch a list of events based on the selected tournament and populate the match type dropdown.
 *
 * @param {string} id - The ID of the selected tournament.
 */
async function fetchEventList(id) {
  try {
    const response = await fetch(
      `https://3200dev.fairgame.club/eventList/${id}`
    );
    if (!response.ok) {
      const errorMessage = await response.text();
      showToast(errorMessage, "error");
      throw new Error("API request failed");
    }
    const data = await response.json();
    if (data) {
      matchType.innerHTML = "";

      let optionElement = new Option("Select match type", "");
      matchType.appendChild(optionElement);

      data?.forEach((option) => {
        optionElement = new Option(option.event.name, JSON.stringify(option));
        matchType.appendChild(optionElement);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Set values for match based on the selected match type.
 *
 * @param {string} data - JSON string representing the selected match type.
 */
async function setMatchValues(data) {
  data = JSON.parse(data);
  console.log(data);

  teamA.value = data?.runners?.[0]?.runnerName || "";
  teamB.value = data?.runners?.[1]?.runnerName || "";
  teamC.value = data?.runners?.[2]?.runnerName || "";

  const selectedDate = new Date(data?.marketStartTime);
  // Extract date and time components
  const datePart = selectedDate.toISOString().split("T")[0];
  const timePart = selectedDate.toISOString().split("T")[1].substring(0, 5); // HH:mm
  startTime.value = `${datePart}T${timePart}`;
}

// Event listeners
gameType.addEventListener("change", () => {
  fetchCompetitionList();
});

tournament.addEventListener("change", () => {
  fetchEventList(tournament?.value);
});

matchType.addEventListener("change", () => {
  setMatchValues(matchType?.value);
});

form.onsubmit = async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    return;
  }

  form.classList.add("was-validated");

  try {
    let data = {};
    if (isEdit) {
      data = {
        startAt: startTime?.value,
        overType: overBall.value,
        noBallRun: noBall.value,
        totalOver: parseInt(overs.value),
        id: getQueryParam("id"),
        marketId: getQueryParam("marketId"),
      };
    } else {
      const selectedMatch = JSON.parse(matchType.value);

      data = {
        marketId: selectedMatch?.marketId,
        eventId: selectedMatch?.event?.id,
        competitionId: selectedMatch?.competition?.id,
        competitionName: selectedMatch?.competition?.name,
        gameType: selectedMatch?.eventType?.name,
        teamA: teamA.value,
        teamB: teamB.value,
        teamC: teamC.value,
        title: selectedMatch?.event?.name,
        startAt: startTime?.value,
        overType: overBall.value,
        noBallRun: noBall.value,
        totalOver: parseInt(overs.value),
      };
    }

    const response = await fetch("/addMatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      showToast(errorMessage, "error");
      throw new Error("API request failed");
    }

    showToast("Match added successfully");

    window.location.replace("/");
  } catch (error) {
    console.error("Error:", error);
  }
};

overs.addEventListener("input", (e) => {
  const newValue = e.target.value.replace(/[^0-9]/g, "");
  
  if (newValue !== e.target.value) {
    overs.value = newValue;
  }
  if(newValue==0){
    overs.value="";
  }
});


