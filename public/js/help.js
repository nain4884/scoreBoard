const keys = getById("keys");

window.onload = () => {
  Object.keys(ballEventKeys)?.map((item) => {
    keys.innerHTML += ` <div class="col-md-6 keyboard-col">
        <div class="keyboard-key">
          ${item}
        </div>
        <div style="flex:1;font-weight:500;">
          ${ballEventKeys[item]?.name}
        </div>
      </div>`;
  });
};
