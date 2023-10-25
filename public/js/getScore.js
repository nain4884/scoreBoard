/**
 * Fetch the match score from the API.
 *
 */
const showScore = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/score/getMatchScore/${marketId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      showToast(await response.text(), "error");
      throw Error("API request failed");
    }

    document.getElementById("scoreDisplay").innerHTML = await response.text();
  } catch (error) {
    console.log(error);
  }
};

window.onload=showScore;