const MENU_ID = "roxygpt-ask";

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "RoxyGPT'ye Sor",
    contexts: ["page", "selection", "image"]
  });
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.warn("Side panel behavior could not be configured:", error);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  await chrome.storage.session.set({
    roxygptContext: {
      url: tab.url || "",
      title: tab.title || "",
      selectionText: info.selectionText || "",
      imageUrl: info.srcUrl || "",
      capturedAt: Date.now()
    }
  });

  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.warn("Could not open RoxyGPT side panel:", error);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (command === "show-roxygpt") {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
      console.warn("Could not open side panel:", error);
    }
  } else if (command === "hide-roxygpt") {
    // Chrome does not expose a universal API to close a side panel programmatically.
    // The side panel provides its own close/hide guidance; the shortcut is best-effort.
    await chrome.runtime.sendMessage({ type: "ROXYGPT_HIDE_REQUEST" }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "ROXYGPT_CAPTURE_VISIBLE") {
    chrome.tabs.captureVisibleTab(sender.tab?.windowId, { format: "png" })
      .then(dataUrl => sendResponse({ ok: true, dataUrl }))
      .catch(error => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
});