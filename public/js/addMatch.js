// client.js
const gameType = document.getElementById("gameType");
const tournament = document.getElementById("tournament");
const matchType = document.getElementById("matchName");

const selectedMatch={};

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

gameType.addEventListener("change", () => {
  fetchCompititionList();
});

tournament.addEventListener("change", () => {
  fetchCompititionList();
});
