const LENS_UPLOAD = "https://lens.google.com/v3/upload?ep=ccm&s=&st=";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "frame-page", title: "Frame Search — capture page", contexts: ["page"] });
    chrome.contextMenus.create({ id: "frame-region", title: "Frame Search — select region", contexts: ["page"] });
    chrome.contextMenus.create({ id: "frame-image", title: "Frame Search — search image", contexts: ["image"] });
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "search-frame") await captureAndSearch(false);
  if (command === "select-frame") await captureAndSearch(true);
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "frame-page") await captureAndSearch(false);
  if (info.menuItemId === "frame-region") await captureAndSearch(true);
  if (info.menuItemId === "frame-image" && info.srcUrl) await openImageUrl(info.srcUrl);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "select-region") {
    handleRegionSelection(message, sender.tab?.id);
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === "cancel-region") {
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === "capture-now") {
    captureAndSearch(message.mode === "region");
    sendResponse({ ok: true });
    return true;
  }
});

async function captureAndSearch(region) {
  try {
    const tab = await getActiveTab();
    if (!tab?.id || !isCapturable(tab.url)) throw new Error("Chrome does not allow screenshots on this page.");
    if (region) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["selector.js"] });
      return;
    }
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "jpeg",
      quality: await getQuality()
    });
    await saveCapture(dataUrl, null);
    await openUploadPage();
  } catch (error) {
    console.error("Frame Search:", error);
    console.warn(error.message || "Could not capture this tab.");
  }
}

async function handleRegionSelection(message, tabId) {
  if (!tabId || !message.rect || !message.viewport) return;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isCapturable(tab.url)) throw new Error("Chrome does not allow screenshots on this page.");
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "jpeg",
      quality: await getQuality()
    });
    await saveCapture(dataUrl, { rect: message.rect, viewport: message.viewport });
    await openUploadPage();
  } catch (error) {
    console.error("Frame Search:", error);
  }
}

async function saveCapture(dataUrl, crop) {
  await chrome.storage.local.set({
    frameSearchCapture: { dataUrl, crop, createdAt: Date.now() }
  });
}

async function openUploadPage() {
  await chrome.tabs.create({ url: chrome.runtime.getURL("upload.html") });
}

async function openImageUrl(srcUrl) {
  await chrome.tabs.create({
    url: "https://lens.google.com/uploadbyurl?url=" + encodeURIComponent(srcUrl)
  });
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isCapturable(url = "") {
  return !/^(chrome|edge|about|brave|opera|view-source):/i.test(url) &&
    !url.startsWith("https://chrome.google.com/webstore") &&
    !url.startsWith("https://chromewebstore.google.com");
}

async function getQuality() {
  const { jpegQuality = 92 } = await chrome.storage.local.get("jpegQuality");
  return Math.max(50, Math.min(100, Number(jpegQuality) || 92));
}
