"use strict";


function getCurrentTimeChartLabel() {
    const currentTime = new Date();
    return currentTime.toTimeString().split(" ")[0];
}

function getTimeGapFromInputDate(date) {
    const now = new Date();
    return {now, gap: now.getTime() - lastUpdate.getTime()}
}

function calculateTotal(stocks) {
    return Math.round(
        Object.keys(stocks).reduce((previousVal, stockName) => {
            const currentStock = stocks[stockName];
            const {quantity, price} = currentStock;
            return previousVal + quantity * price;
        }, 0)
    );
}

const MAX_ELEMENTS = 200;
let batchUpdateData = {};
let lastUpdate = new Date();
const UPDATE_INTERVAL = 10000;

function syncLatestStockData(data) {
    batchUpdateData = {...batchUpdateData, ...data};
    const {now, gap} = getTimeGapFromInputDate(lastUpdate);
    if (gap < UPDATE_INTERVAL) {
        return;
    }

    lastUpdate = now;
    console.log('update at', now);
    chrome.storage.sync.get(["stocks", "chartData"], ({stocks, chartData}) => {
        Object.keys(batchUpdateData).forEach((stockName) => {
            if (!stocks[stockName]) {
                return;
            }
            const {
                price: newPrice,
                originalPrice: newOriginalPrice,
            } = batchUpdateData[stockName];
            const {price, originalPrice} = stocks[stockName];
            if (newPrice !== price || newOriginalPrice !== originalPrice) {
                stocks[stockName] = {
                    ...stocks[stockName],
                    ...batchUpdateData[stockName],
                };
            }
        });
        const newTotalValue = calculateTotal(stocks);
        const {data = [], time = []} = chartData || {};
        const newData = [...data, newTotalValue];
        const newTime = [...time, getCurrentTimeChartLabel()];
        chrome.storage.sync.set({
            stocks,
            chartData: {
                data: newData.slice(Math.max(newData.length - MAX_ELEMENTS, 0)),
                time: newTime.slice(Math.max(newData.length - MAX_ELEMENTS, 0)),
            },
        });
    });
}

if (chrome) {
    chrome.runtime.onMessage.addListener(function (message) {
            switch (message.type) {
                case "UPDATE_DATA": {
                    const {data} = message;
                    if (!data) {
                        return;
                    }

                    syncLatestStockData(data);
                    return;
                }
                default: {
                    throw ("unknown message type ")
                }
            }
        }
    )
}


const IFRAME_IDS = ["hose", "hnx", "upcom"];
const REFRESH_IF_DATA_IS_OUT_UPDATED_THRESHOLD = 300000;

function refreshIframe() {
    const {now, gap} = getTimeGapFromInputDate(lastUpdate);
    if (gap < REFRESH_IF_DATA_IS_OUT_UPDATED_THRESHOLD) {
        return;
    }
    lastUpdate = now;
    IFRAME_IDS.forEach((id) => {
        document.getElementById(id).src = document.getElementById(id).src;
    });
}

function initAlarm() {
    chrome.alarms.create("refreshIframe", {
        delayInMinutes: 2,
        periodInMinutes: 2,
    });
}


chrome.runtime.onStartup.addListener(function () {
    initAlarm();
});

chrome.runtime.onInstalled.addListener(function () {
    initAlarm();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    const {name} = alarm;
    switch (name) {
        case "refreshIframe": {
            refreshIframe();
        }
        default: {
            return;
        }
    }
});
