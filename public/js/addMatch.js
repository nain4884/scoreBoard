/**
 * Enum containing element IDs and their corresponding HTMLElements.
 */
const elements = {
  gameType: getById("gameType"),
  tournament: getById("tournament"),
  matchType: getById("matchName"),
  teamA: getById("teamA"),
  teamB: getById("teamB"),
  teamAShort: getById("teamAShort"),
  teamBShort: getById("teamBShort"),
  startTime: getById("startTime"),
  overBall: getById("overBall"),
  noBall: getById("noBall"),
  overs: getById("overs"),
  form: getById("form"),
};

/**
 * Fetch data from a URL and populate a dropdown element with options.
 * @param {HTMLElement} element - The dropdown element to populate.
 * @param {string} url - The URL to fetch data from.
 * @param {string} optionText - The text for the default "Select" option (optional).
 * @param {string} valueField - The field to use as the option's value (optional).
 */
const fetchAndPopulate = async (
  element,
  url,
  optionText = "Select",
  appendOption,
  defaultMessage
) => {
  element.innerHTML = `<option value="">${defaultMessage}</option>`;

  const httpService = new HttpService(SERVER_API_BASE_URL);
  const response = await httpService.get(url);
  const data = await response.json();

  element.innerHTML = "";

  element.appendChild(new Option(optionText, ""));

  data.forEach((option) => appendOption(option));
};

/**
 * Set values for match-related elements based on data.
 * @param {object} data - The data containing match-related information.
 */
const setMatchValues = (data) => {
  data = JSON.parse(data);
  ["teamA", "teamB"].forEach((team, index) => {
    elements[team].value = data?.runners?.[index]?.runnerName || "";
  });
  const selectedDate = new Date(data?.marketStartTime);
  selectedDate.setMinutes(selectedDate.getMinutes() - selectedDate.getTimezoneOffset());
  elements.startTime.value = selectedDate.toISOString().slice(0, 16);
  elements["teamAShort"].value = elements.teamA.value;
  elements["teamBShort"].value = elements.teamB.value;
};

const oversInput = elements.overs;
oversInput.addEventListener("input", () => {
  oversInput.value = oversInput.value.replace(/[^0-9]/g, "");
  if (oversInput.value === "0") {
    oversInput.value = "";
  }
});

elements.gameType.addEventListener("change", () =>
  fetchAndPopulate(
    elements.tournament,
    `/competitionList?type=${elements?.gameType?.value}`,
    "Select Tournament",
    (option) =>
      elements.tournament.appendChild(
        new Option(option.competition.name, option.competition.id)
      ),
    "No Tournament Found"
  )
);
elements.tournament.addEventListener("change", () =>
  fetchAndPopulate(
    elements.matchType,
    `/eventList/${elements.tournament.value}`,
    "Select match type",
    (option) =>
      elements.matchType.appendChild(
        new Option(option.event.name, JSON.stringify(option))
      ),
    "No Match Found"
  )
);
elements.matchType.addEventListener("change", () =>
  setMatchValues(elements.matchType.value)
);

elements.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  if (!form.checkValidity()) return;

  form.classList.add("was-validated");

  try {
    const selectedMatch = elements?.matchType?.value
      ? JSON.parse(elements?.matchType?.value)
      : {};
    const data = isEdit
      ? {
          teamAShort: elements.teamAShort.value,
          teamBShort: elements.teamBShort.value,
          startAt: elements.startTime.value,
          overType: elements.overBall.value,
          noBallRun: elements.noBall.value,
          totalOver: parseInt(elements.overs.value),
          id: getQueryParam("id"),
          marketId: getQueryParam("marketId"),
        }
      : {
          marketId: selectedMatch.marketId,
          eventId: selectedMatch.event.id,
          competitionId: selectedMatch.competition.id,
          competitionName: selectedMatch.competition.name,
          gameType: selectedMatch.eventType.name,
          teamA: elements.teamA.value,
          teamB: elements.teamB.value,
          teamAShort: elements.teamAShort.value,
          teamBShort: elements.teamBShort.value,
          title: selectedMatch.event.name,
          startAt: elements.startTime.value,
          overType: elements.overBall.value,
          noBallRun: elements.noBall.value,
          totalOver: parseInt(elements.overs.value),
        };

    const response = await apiService.post(`/addMatch`, data);

    if (response) {
      showToast("Match added successfully");
      window.location.replace("/");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
