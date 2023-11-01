const form = document.querySelector("form");

/**
 * Declare toss of match using an API request.
 * @returns {Promise<Response>} - The API response.
 */
async function declareToss() {
  if (!getRadioValue("teamName")) {
    showToast("Please choose the team", "error");
    return;
  }
  if (!getRadioValue("playerType")) {
    showToast("Please choose the choose first", "error");
    return;
  }
  const requestBody /** @type {Toss} */ = {
    marketId,
    teamName: getRadioValue("teamName"),
    firstChoose: getRadioValue("playerType"),
  };

  return apiService.post("/toss/addToss", requestBody);
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

    if (response) {
      await showScore();
      showToast("Toss declared successfully");
    }
    // window.location.replace("/");
  } catch (error) {
    console.error("Error:", error);
  }
}

form.addEventListener("submit", handleSubmit);
