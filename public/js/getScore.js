/**
 * Fetch the match score from the API.
 *
 */
const showScore = async () => {
  try {
    const response = await apiService.get(`/score/getMatchScore/${marketId}`);

    getById("scoreDisplay").innerHTML = await response.text();
  } catch (error) {
    console.log(error);
  }
};

window.onload = showScore;
