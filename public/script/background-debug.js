const colors = ["red", "green", "blue", "black"];
let activeIndex = 0;

chrome.alarms.create("updateColor", {
  delayInMinutes: 0.1,
  periodInMinutes: 0.1,
});
chrome.runtime.onMessage.addListener(function (message) {
  console.log("message", message);
});

chrome.runtime.onInstalled.addListener(() => {
  updateColor();
  chrome.tabs.create(
    {
      url: "https://banggia-as.vndirect.com.vn/chung-khoan/hose",
      active: false,
    },
    function (hiddenWindow) {
      console.log("hiddenWindow", hiddenWindow);
    }
  );
});

function updatePageColor() {
  chrome.storage.sync.get("stock", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}

const WHITELIST_DOMAIN_PREFIX = "http";
async function updateActiveTabColor() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab.url.startsWith(WHITELIST_DOMAIN_PREFIX)) {
    return;
  }

  const color = colors[activeIndex];
  const nextIndex = activeIndex + 1;
  activeIndex = nextIndex > colors.length - 1 ? 0 : nextIndex;
  chrome.storage.sync.set({ color });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: updatePageColor,
  });
}
