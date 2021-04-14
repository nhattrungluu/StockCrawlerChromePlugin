"use strict";
function getCurrentTimeChartLabel() {
  const currentTime = new Date();
  return currentTime.toTimeString().split(" ")[0];
}

const IFRAME_IDS = ["hose", "hnx", "upcom"];
const MAX_ELEMENTS = 200;
function refreshIframe() {
  IFRAME_IDS.forEach((id) => {
    document.getElementById(id).src = document.getElementById(id).src;
  });
}

function initAlarm() {
  chrome.alarms.create("refreshIframe", {
    delayInMinutes: 30,
    periodInMinutes: 30,
  });
}

function calculateTotal(stocks) {
  return Math.round(
    Object.keys(stocks).reduce((previousVal, stockName) => {
      const currentStock = stocks[stockName];
      const { quantity, price } = currentStock;
      return previousVal + quantity * price;
    }, 0)
  );
}

function syncLatestStockData() {
  chrome.storage.sync.get(["stocks", "chartData"], ({ stocks, chartData }) => {
    let isDirty = false;
    Object.keys(batchUpdateData).forEach((stockName) => {
      if (!stocks[stockName]) {
        return;
      }
      const {
        price: newPrice,
        originalPrice: newOriginalPrice,
      } = batchUpdateData[stockName];
      const { price, originalPrice } = stocks[stockName];
      if (newPrice !== price || newOriginalPrice !== originalPrice) {
        isDirty = true;
        stocks[stockName] = {
          ...stocks[stockName],
          ...batchUpdateData[stockName],
        };
      }
    });
    console.log("isDirty", isDirty);
    if (isDirty) {
      const newTotalValue = calculateTotal(stocks);
      const { data = [], time = [] } = chartData || {};
      const newData = [...data, newTotalValue];
      const newTime = [...time, getCurrentTimeChartLabel()];
      chrome.storage.sync.set({
        stocks,
        chartData: {
          data: newData.slice(Math.max(newData.length - MAX_ELEMENTS, 0)),
          time: newTime.slice(Math.max(newData.length - MAX_ELEMENTS, 0)),
        },
      });
    }
  });
}

let batchUpdateData = {};
let lastUpdate = new Date();
const UPDATE_INTERVAL = 10000;
if (chrome) {
  chrome.runtime.onMessage.addListener(function (message) {
    const { data } = message;
    if (!data) {
      return;
    }

    batchUpdateData = { ...batchUpdateData, ...data };
    const now = new Date();
    if (now.getTime() - lastUpdate.getTime() >= UPDATE_INTERVAL) {
      lastUpdate = now;
      syncLatestStockData();
    }
  });

  chrome.runtime.onStartup.addListener(function () {
    initAlarm();
  });

  chrome.runtime.onInstalled.addListener(function () {
    initAlarm();
  });

  chrome.alarms.onAlarm.addListener(function (alarm) {
    const { name } = alarm;
    switch (name) {
      case "refreshIframe": {
        refreshIframe();
      }
      default: {
        return;
      }
    }
  });
}
