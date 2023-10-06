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
const form = document.querySelector("form");

async function fetchCompititionList() {
  try {
    const response = await fetch(
      `https://3200dev.fairgame.club/competitionList`
    );
    if (!response.ok) {
      throw new Error("API request failed");
    }
    const data = await response.json();

    if (data) {
      tournament.innerHTML = "";

      data?.forEach((option) => {
        const optionElement = new Option(
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

async function fetchEventList(id) {
  try {
    const response = await fetch(
      `https://3200dev.fairgame.club/eventList/${id}`
    );
    if (!response.ok) {
      throw new Error("API request failed");
    }
    const data = await response.json();
    console.log(data);
    if (data) {
      matchType.innerHTML = "";

      data?.forEach((option) => {
        const optionElement = new Option(
          option.event.name,
          JSON.stringify(option)
        );
        matchType.appendChild(optionElement);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function setMatchValues(data) {
  data = JSON.parse(data);

  teamA.value = data?.runners?.[0]?.runnerName
    ? data?.runners?.[0]?.runnerName
    : "";
  teamB.value = data?.runners?.[1]?.runnerName
    ? data?.runners?.[1]?.runnerName
    : "";
  teamC.value = data?.runners?.[2]?.runnerName
    ? data?.runners?.[2]?.runnerName
    : "";

  const selectedDate = new Date(data?.marketStartTime); // Replace with your desired date

  // Format the date as YYYY-MM-DD (required by the date input)
  const formattedDate = selectedDate.toISOString().split("T")[0];

  startTime.value = formattedDate;
}

gameType.addEventListener("change", () => {
  fetchCompititionList();
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

  const selectedMatch = JSON.parse(matchType.value);

  const response = await fetch("/addMatch", {
    method: "POST", // HTTP method
    headers: {
      "Content-Type": "application/json", // Specify the content type as JSON
    },
    body: JSON.stringify({
      marketId: selectedMatch?.marketId,
      eventId: selectedMatch?.event?.id,
      competitionId: selectedMatch?.competition?.id,
      competitionName: selectedMatch?.competition?.name,
      gameType: selectedMatch?.eventType?.name,
      teamA: teamA.value,
      teamB: teamB.value,
      teamC: teamC.value,
      title: selectedMatch?.event?.name,
      startAt: new Date(startTime.value),
      overType: overBall.value,
      noBallRun: noBall.value,
    }),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  window.alert("Match added successfully!");

  window.location.replace("/");
};
