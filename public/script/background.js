const IFRAME_IDS = ["hose", "hnx", "upcom"];
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

  chrome.alarms.create("updateData", {
    when: Date.now() + 15000,
    periodInMinutes: 1,
  });
}
let batchUpdateData = {};
if (chrome) {
  chrome.runtime.onMessage.addListener(function (message) {
    const { data } = message;
    if (!data) {
      return;
    }

    batchUpdateData = { ...batchUpdateData, ...data };
  });

  chrome.runtime.onStartup.addListener(function () {
    console.log("onStartup");
    initAlarm();
  });

  chrome.runtime.onInstalled.addListener(function () {
    console.log("onInstalled");
    initAlarm();
  });

  chrome.alarms.onAlarm.addListener(function (alarm) {
    const { name } = alarm;
    switch (name) {
      case "refreshIframe": {
        refreshIframe();
      }
      case "updateData": {
        chrome.storage.sync.get("stocks", ({ stocks }) => {
          let isDirty = false;
          Object.keys(batchUpdateData).forEach((stockName) => {
            if (!stocks[stockName]) {
              return;
            }
            const {
              price: newPrice,
              originalPrice: newOriginalPrice,
            } = batchUpdateData;
            const { price, originalPrice } = stocks[stockName];
            if (newPrice !== price || newOriginalPrice !== originalPrice) {
              console.log(
                "newPrice",
                newPrice,
                price,
                newOriginalPrice,
                originalPrice
              );
              isDirty = true;
              stocks[stockName] = {
                ...stocks[stockName],
                ...batchUpdateData[stockName],
              };
            }
          });
          console.log("isDirty", isDirty);
          if (isDirty) {
            chrome.storage.sync.set({
              stocks,
            });
          }
        });
      }
      default: {
        return;
      }
    }
  });
}
