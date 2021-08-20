const CRAWLING_INDEX_ENUM = {
    MATCH_PRICE: 13,
    ORIGINAL_PRICE: 5,
};

setInterval(() => {
    if (chrome && chrome.storage) {
        chrome.storage.sync.get("stocks", ({stocks}) => {
            if (!stocks) {
                return;
            }

            const data = {};
            Object.keys(stocks).forEach((stockName) => {
                const currentStockRow = document.getElementById(`tr_${stockName}`);
                if (!currentStockRow) {
                    return;
                }
                const price =
                    currentStockRow.childNodes[CRAWLING_INDEX_ENUM.MATCH_PRICE].childNodes[1].childNodes[1]?.data;
                const originalPrice =
                    currentStockRow.childNodes[CRAWLING_INDEX_ENUM.ORIGINAL_PRICE].childNodes[0]?.data;
                if (!!price && !!originalPrice) {
                    data[stockName] = {
                        price: Number(price.replace('"', '')),
                        originalPrice: Number(originalPrice.replace('"', '')),
                    };
                }
            });
            if (Object.keys(data).length > 0) {
                chrome.runtime.sendMessage({data: data, type: "UPDATE_DATA"});
            }
        });
    }
}, 5000);