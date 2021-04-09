if (chrome) {
  chrome.runtime.onMessage.addListener(function (message) {
    chrome.storage.sync.get("stocks", ({ stocks }) => {
      const { data } = message;
      if (!data) {
        return;
      }
      Object.keys(data).forEach((stockName) => {
        if (!stocks[stockName]) {
          return;
        }
        stocks[stockName] = { ...stocks[stockName], ...data[stockName] };
      });
      chrome.storage.sync.set({
        stocks,
      });
    });
  });
}
