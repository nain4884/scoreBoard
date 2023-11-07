/**
 * Fetches match data from the server based on the specified page and populates the UI.
 * @param {number} page - The page number to fetch match data.
 */
const getMatchData = async (page) => {
  const matchCont = getById("matchContainer");
  try {
    const response = await apiService.get(`/match?page=${page}`);
    const matchData = await response.json();
    matchCont.innerHTML = "";

    matchData?.match?.forEach((item) => {
      const div = document.createElement("div");
      div.innerHTML = `
          <div class="match-box">
            <div class="match-name">
              <a href="/match/${item?.marketId}">
                <b>${item?.title}</b>
              </a>
              <span>
                ${new Date(item?.startAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
              <a href="/addmatch?marketId=${item?.marketId}&id=${item?.id}">
                <span class="bi bi-pencil edit-icon"></span>
              </a>
            </div>
          </div>
        `;
      matchCont.appendChild(div);
    });
  } catch (error) {
    console.error("Error fetching match data:", error);
  }
};

  // Initial call to fetch and render match data for the first page.
  getMatchData(1);
