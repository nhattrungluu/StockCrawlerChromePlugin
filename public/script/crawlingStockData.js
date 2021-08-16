const CRAWLING_INDEX_ENUM = {
    MATCH_PRICE: 10,
    ORIGINAL_PRICE: 3,
};

setInterval(() => {
    if (chrome && chrome.storage) {
        chrome.storage.sync.get("stocks", ({stocks}) => {
            if (!stocks) {
                return;
            }

            const data = {};
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
                if (!!price && !!originalPrice) {
                    data[stockName] = {
                        price: Number(price),
                        originalPrice: Number(originalPrice),
                    };
                }
            });
            if (Object.keys(data).length > 0) {
                chrome.runtime.sendMessage({data: data, type: "UPDATE_DATA"});
            }
        });
    }
}, 5000);

setInterval(() => {
    window.location.reload();
}, 300000)
