  const exchangeButton=document.getElementById("exchange");
  
  const changeStrike=()=> {
    const batsmanStrikeInput = document.getElementById("batsmanStrike");
    const batsmanNonStrikeInput = document.getElementById("batsmanNonStrike");

    // Get the current values
    const batsmanStrikeValue = batsmanStrikeInput.value;
    const batsmanNonStrikeValue = batsmanNonStrikeInput.value;

    // Swap the values
    batsmanStrikeInput.value = batsmanNonStrikeValue;
    batsmanNonStrikeInput.value = batsmanStrikeValue;
  }

exchangeButton.addEventListener("click",changeStrike);
  