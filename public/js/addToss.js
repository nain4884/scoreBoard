const form = document.querySelector("form");

/**
 * Get the selected team type.
 * @returns {string} - The selected team type.
 */
function getSelectedTeam() {
  return document.querySelector('input[name="teamName"]:checked')?.value;
}

/**
 * Get the selected playerType type.
 * @returns {string} - The selected playerType type.
 */
function getSelectedPlayerType() {
  return document.querySelector('input[name="playerType"]:checked')?.value;
}

/**
 * Declare toss of match using an API request.
 * @returns {Promise<Response>} - The API response.
 */
async function declareToss() {

if(!getSelectedTeam()){
  showToast("Please choose the team","error");
  return;
}
if(!getSelectedPlayerType()){
  showToast("Please choose the choose first","error");
  return;
}
  const requestBody /** @type {Toss} */ = {
    marketId,
    teamName: getSelectedTeam(),
    firstChoose: getSelectedPlayerType(),
  };

  return fetch("/score/addToss", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
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
    const response = await declareToss();

    if (!response.ok) {
      const errorMessage = await response.text();
      showToast(errorMessage, "error");
      throw new Error("API request failed");
    }
    await showScore();
    showToast("Toss declared successfully");

    // window.location.replace("/");
  } catch (error) {
    console.error("Error:", error);
  }
}

form.addEventListener("submit", handleSubmit);
