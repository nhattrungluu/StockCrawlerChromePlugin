console.log("helloooo", window.location.href);

const CRAWLING_INDEX_ENUM = {
  MATCH_PRICE: 10,
  ORIGINAL_PRICE: 3,
};
setInterval(() => {
  if (chrome && chrome.storage) {
    chrome.storage.sync.get("stocks", ({ stocks }) => {
      const data = {};
      console.log("stocks", stocks);
      Object.keys(stocks).forEach((stockName) => {
        const currentStockRow = document.getElementById(stockName);
        if (!currentStockRow) {
          return;
        }
        const price =
          currentStockRow.childNodes[CRAWLING_INDEX_ENUM.MATCH_PRICE]
            ?.innerText;
        const originalPrice =
          currentStockRow.childNodes[CRAWLING_INDEX_ENUM.ORIGINAL_PRICE]
            ?.innerText;
        console.log("price", price, originalPrice);
        if (!!price && !!originalPrice) {
          data[stockName] = { price, originalPrice };
        }
      });
      chrome.runtime.sendMessage({ sendBack: true, data: data });
    });
  }
}, 5000);
