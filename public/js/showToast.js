function showToast(text, type = 'success') {
    new Noty({
      text: text,
      type: type,
      layout: 'topRight', // Choose the notification position
      timeout: 3000, // Set the notification display duration (in milliseconds)
    }).show();
  }