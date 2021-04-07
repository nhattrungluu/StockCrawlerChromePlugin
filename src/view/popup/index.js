const changeColor = document.getElementById("changeColor");
changeColor.addEventListener("click", updateActiveTabColor);

chrome.storage.onChanged.addListener((changes) => {
  const storageChange = changes["color"];
  if (!storageChange) {
    return;
  }
  console.log("hereee");
  updateActiveTabColor();
});

const WHITELIST_DOMAIN_PREFIX = "http";
async function updateActiveTabColor() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab.url.startsWith(WHITELIST_DOMAIN_PREFIX)) {
    return;
  }
  chrome.storage.sync.get("color", ({ color }) => {
    updateChangeColorButton(color);
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: updatePageColor,
  });
}

function updateChangeColorButton() {
  const changeColor = document.getElementById("changeColor");
  if (!changeColor) {
    return;
  }
  chrome.storage.sync.get("color", ({ color }) => {
    changeColor.style.backgroundColor = color;
  });
}

function updatePageColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}

updateActiveTabColor();
