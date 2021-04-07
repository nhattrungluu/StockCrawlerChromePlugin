const interval = setInterval(() => {
  chrome.runtime.sendMessage({ sendBack: true, data: window.location.href });
  console.log("inject script ");
}, 3000);


chrome.runtime.connect().onDisconnect.addListener(function() {
    clearInterval(interval);
})