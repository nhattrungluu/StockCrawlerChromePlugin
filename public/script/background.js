if (chrome) {
  chrome.runtime.onMessage.addListener(function (message) {
    console.log("receive message", message);
  });
}
