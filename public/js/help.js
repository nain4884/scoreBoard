const keys = getById("keys");

window.onload = () => {
  keys.innerHTML += `<div class="col-md-6">
  <h5>Key work with enter</h5>
  <div class="row">
    ${Object.keys(ballEventKeys)
      ?.filter((item) => ballEventKeys[item]?.directLive == false)
      ?.map((item) => {
        return `<div class="col-md-12 keyboard-col"><div class="keyboard-key">
          ${item}
        </div>
        <div style="flex:1;font-weight:500;">
          ${ballEventKeys[item]?.name}
        </div>
        </div>`;
      })
      ?.join("")}
      </div>
      </div>
      <div class="col-md-6">
  <h5>Key work without enter</h5>
  <div class="row">
    ${Object.keys(ballEventKeys)
      ?.filter((item) => ballEventKeys[item]?.directLive == true)
      ?.map((item) => {
        return `<div class="col-md-12 keyboard-col"><div class="keyboard-key">
          ${item}
        </div>
        <div style="flex:1;font-weight:500;">
          ${ballEventKeys[item]?.name}
        </div>
        </div>`;
      })
      ?.join("")}
      </div>
      </div>
      `;
};
