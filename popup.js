if ((localStorage.getItem("openToolNewWindow") ?? "true") === "true") {
    chrome.windows.create({url: "page.html"})
} else {
    chrome.tabs.create({url: "page.html"});
} // Implementation of openToolNewWindow setting.

window.close();