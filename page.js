/*

*/

const theTextArea = document.getElementById("theTextArea");
const pauseButton = document.getElementById("thePauseButton");
const theSettingsButton = document.getElementById("theSettingsButton");
const theSettingsDropdown = document.getElementById("Settings");
let StoredData = {
    closeOnComplete: { /* SETTING: Does the tool close when all urls have been opened? */
        value: (localStorage.getItem("closeOnComplete") ?? "false") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("closeOnComplete", newVal); },
        settingId: "closeOnComplete",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => { this.set(field.checked); });
        },
    },
    openToolNewWindow: { /* SETTING: Upon starting this extension, does the tool page open in a new window? 
        If not, it opens in the current window. */
        value: (localStorage.getItem("openToolNewWindow") ?? "true") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("openToolNewWindow", newVal); },
        settingId: "openToolNewWindow",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => { this.set(field.checked); });
        },
    },
    openTabsSameWindow: { /* SETTING: Should the tabs opened by this tool be in the same window as this 
        tool, or a new window? */
        value: (localStorage.getItem("openTabsSameWindow") ?? "true") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("openTabsSameWindow", newVal); },
        settingId: "openTabsSameWindow",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default

            field.addEventListener('change', () => {
                this.set(field.checked);
                if (field.checked) { // openTabsSameWindow & openTabsInIncognito should be mutually exclusive.
                    document.getElementById(StoredData.openTabsInIncognito.settingId).checked = false;
                    StoredData.openTabsInIncognito.set(false);
                }
            });
        },
    },
    saveUrlList: { /* SETTING: Should the textbox text be saved for future openings of this extension, 
        or not? */
        value: (localStorage.getItem("saveUrlList") ?? "true") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("saveUrlList", newVal); },
        settingId: "saveUrlList",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => {
                this.set(field.checked);
                if (this.value) { StoredData.storedUrlList.set(theTextArea.value); }
                else if (!this.value) { StoredData.storedUrlList.delete(); }
            });
        },
    },
    openTabsInIncognito: { /* SETTING: Should urls be opened into incognito tabs, or normal ones? */
        value: (localStorage.getItem("openTabsInIncognito") ?? "false") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("openTabsInIncognito", newVal); },
        settingId: "openTabsInIncognito",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            if (StoredData.openTabsSameWindow.value) this.set(false); // If openTabsSameWindow, force openTabsInIncognito to false.
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => {
                this.set(field.checked);
                if (field.checked) { // openTabsSameWindow & openTabsInIncognito should be mutually exclusive.
                    document.getElementById(StoredData.openTabsSameWindow.settingId).checked = false;
                    StoredData.openTabsSameWindow.set(false);
                }
            });
        },
    },
    showPauseButton: { /* SETTING: Should the pause button be shown, or hidden? */
        value: (localStorage.getItem("showPauseButton") ?? "true") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("showPauseButton", newVal); },
        settingId: "showPauseButton",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            this.showOrHidePauseButton();
            field.addEventListener('change', () => {
                this.set(field.checked);
                this.showOrHidePauseButton();
            });
        },
        showOrHidePauseButton: function() {
            const button = pauseButton.style;
            if (this.value) {
                button.display = "revert";
            } else {
                button.display = "none";
            }
        },
    },
    storedUrlList: {
        value: localStorage.getItem("storedUrlList") ?? "",
        set: function(newVal) { this.value = newVal, localStorage.setItem("storedUrlList", newVal); },
        onStartup: function() {
            if (StoredData.saveUrlList.value) { theTextArea.value = this.value; }
            theTextArea.addEventListener('change', () => {
                if (StoredData.saveUrlList.value) { this.set(theTextArea.value); };
            });
        },
        delete: function() { localStorage.removeItem("storedUrlList"); },
    },
    showSettings: {
        value: (localStorage.getItem("showSettings") ?? "false") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("showSettings", newVal); },
        onStartup: function() {
            this.showOrHideSettingsDropdown(); // Set the default
            theSettingsButton.onclick = () => {
                this.set(!this.value); // Toggle on click
                this.showOrHideSettingsDropdown();
            };
        },
        showOrHideSettingsDropdown: function() {
            const button = theSettingsButton.style;
            const dropdown = theSettingsDropdown.style;
            if (this.value) {
                button["background-color"] = "lightgray";
                dropdown["border-style"] = "groove";
                dropdown.display = "inline-flex";
            } else {
                button["background-color"] = "revert";
                dropdown["border-style"] = "revert";
                dropdown.display = "none";
            }
        },
    },
    closeTabsOnAllComplete: { /* SETTING: (Special behavior) Once all the tabs have been loaded, should they all be closed? */
        value: (localStorage.getItem("closeTabsOnAllComplete") ?? "false") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("closeTabsOnAllComplete", newVal); },
        settingId: "closeTabsOnAllComplete",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => this.set(field.checked));
        },
    },
    closeEachTabOnComplete: { /* SETTING: (Special behavior) Once a tab has been loaded, should it be closed? */
        value: (localStorage.getItem("closeEachTabOnComplete") ?? "false") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("closeEachTabOnComplete", newVal); },
        settingId: "closeEachTabOnComplete",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => this.set(field.checked));
        },
        removeTab: tabId => chrome.tabs.remove(tabId),
    },
    _startupOrder: [
        "closeOnComplete",
        "openToolNewWindow",
        "openTabsSameWindow",
        "saveUrlList",
        "openTabsInIncognito", // Must come after openTabsSameWindow, as it's value from load may be trumped by openTabsSameWindow.
        "showPauseButton",
        "storedUrlList",
        "showSettings",
        "closeTabsOnAllComplete",
        "closeEachTabOnComplete",
    ],
};

for (key of StoredData._startupOrder) {
    StoredData[key].onStartup();
} // Run the startup functions



const tabTitleCounter = {
    loaded: 0,
    total: 0,
    reset: function() { this.loaded = 0, this.total = 0, document.title = "Open URLs When Loaded"; },
    iterate: function() {
        this.loaded++;
        document.title = `(${this.loaded}/${this.total}) Open URLs When Loaded`;
    }
};

const openButton = Object.assign(document.getElementById("theOpenButton"), {
    enable: function() {
        this.disabled = false;
        this.innerText = "Open All";
    },
    disable: function() {
        this.disabled = true;
        this.innerText = "Opening";
    },
    onclick: function() {
        this.disable();
        openUrls();
    },
});
openButton.enable();

const pauseState = {
    UNPAUSED: 0,
    PAUSED: 1,
    state: undefined,
    UNPAUSE_EVENT: new Event("unpause"),
    toggle: function() {
        if (this.state === this.UNPAUSED) {
            this.state = this.PAUSED;
            this.isPaused = true;
        } else if (this.state === this.PAUSED) {
            this.state = this.UNPAUSED;
            this.isPaused = false;
            pauseButton.dispatchEvent(this.UNPAUSE_EVENT);
        } else { // Default, runs on startup.
            this.state = this.UNPAUSED;
            this.isPaused = false;
        }

        let label = this.label[this.state];
        pauseButton.innerText = label.text;
        if (label.style) {
            Object.entries(label.style).forEach(([prop, val]) => {
                pauseButton.style[prop] = val;
            });
        }
    },
    isPaused: undefined,
};
pauseState.label = {
    [pauseState.UNPAUSED]: {text: "Pause",
        style: {backgroundColor: ""}
    },
    [pauseState.PAUSED]: {text: "Paused",
        style: {backgroundColor: "#ff000040"}
    },
};
pauseState.toggle();
pauseButton.onclick = () => {
    pauseState.toggle();
};

document.styleSheets[0].cssRules[0].style.visibility = "unset"; /* Many elements have been changing during startup, 
and so are hidden. Now that they are stable, unhide them. */



function getUrls(testingText) {
    if (testingText !== undefined) { // Allow for use of hardcoded test input.
        theTextArea.value = testingText;
    }
    return (
        theTextArea.value
        .split("\n")
        .filter(Boolean)
        .map((potentialUrl) => { // Try to validate url format.
            potentialUrl = potentialUrl.trim();
            try {
                let url = new URL(potentialUrl);
                return url.href;
            } catch {
                try { // Attempt to fix the url.
                    let url = new URL(`https://${potentialUrl}`);
                    return url.href;
                } catch { // Just return the broken url, and user can fix it.
                    return potentialUrl;
                }
            }
        })
    )
}

const exampleUrls = `
https://www.google.com
https://www.google.com/search?q=hat
https://www.google.com/search?q=shoe
https://www.google.com/search?q=shirt
https://www.google.com/search?q=pants
`.trim();
let urlList = undefined;
let allOpenedTabIds = undefined;
async function openUrls() {
    allOpenedTabIds = [];

    urlList = getUrls();
    urlList = urlList.length > 0 ? urlList : getUrls(exampleUrls); // Use the example urls if text is empty.
    tabTitleCounter.reset();
    tabTitleCounter.total = urlList.length;

    const useIncognito = StoredData.openTabsInIncognito.value;
    chrome.extension.isAllowedIncognitoAccess((allowed) => {
        if (!allowed && useIncognito) { // Stop execution in this case.
            alert("Sequential Mass URL Opener does not currently have permission to open tabs in incognito mode."
            +"\n\nTo give it permission, go to your Chrome Menu > More Tools > Extensions, find the "
            +"Sequential Mass URL Opener extension > Details > Allow In Incognito, and enable it.");
            return;
        }

        if (!StoredData.openTabsSameWindow.value) { // Open tabs into a new window.
            chrome.windows.create({ // Only the first url is opened this here.
                "url": urlList[0], 
                "incognito": useIncognito,
                "state": "minimized"
            })
            .then((result) => {
                // Begin opening rest of urls.
                priorTabId = result.tabs[0].id;
                allOpenedTabIds.push(priorTabId);
                windowId = result.id;
                tabTitleCounter.iterate();
                openTabWhenPriorIsLoaded(1);
            });
        } else { // Open tabs into current window. Incognito is not an option here.
            chrome.tabs.create({ // Only the first url is opened this here.
                "url": urlList[0], 
                "active": false
            })
            .then((result) => {
                // Begin opening rest of urls.
                priorTabId = result.id;
                allOpenedTabIds.push(priorTabId);
                windowId = undefined;
                tabTitleCounter.iterate();
                openTabWhenPriorIsLoaded(1);
            });
        }
    });
}

let windowId = undefined;
let priorTabId = undefined;
function openTabWhenPriorIsLoaded(index) {
    const thisListener = (tabId, info) => {
        if (tabId === priorTabId && (info.status === "complete" || info.isWindowClosing !== undefined)) {
            if (index >= urlList.length) { // Stop once urlList is fully iterated (AND LOADED).
                console.log("All urls have been loaded fully");
                chrome.tabs.onUpdated.removeListener(thisListener);
                chrome.tabs.onRemoved.removeListener(thisListener);
                if (StoredData.closeEachTabOnComplete.value) { StoredData.closeEachTabOnComplete.removeTab(priorTabId); }
                else if (StoredData.closeTabsOnAllComplete.value) { chrome.tabs.remove(allOpenedTabIds); } // Ignored if closeEachTabOnComplete is on, since redundant.
                openButton.enable();
                if (StoredData.closeOnComplete.value) { window.close(); }
                return;
            }

            // The tab has loaded or been closed. Time to make another.
            const createTab = () => chrome.tabs.create({
                "url": urlList[index],
                "active": false,
                "windowId": windowId
            })
            .then(function(result) {
                // Prepare for the newly created tab to load, hense creating another tab.
                if (StoredData.closeEachTabOnComplete.value) { StoredData.closeEachTabOnComplete.removeTab(priorTabId); }
                priorTabId = result.id;
                allOpenedTabIds.push(priorTabId);
                tabTitleCounter.iterate();
                openTabWhenPriorIsLoaded(++index);
                chrome.tabs.onUpdated.removeListener(thisListener);
                chrome.tabs.onRemoved.removeListener(thisListener);
            })
            .catch((error) => {
                if (error == "Error: Tabs cannot be edited right now (user may be dragging a tab).") {
                    createTab(); // Just try again.
                } else {
                    console.error(error);
                    chrome.tabs.onUpdated.removeListener(thisListener);
                    chrome.tabs.onRemoved.removeListener(thisListener);
                    document.title = "*** ERROR ***";
                    alert(`ERROR\n\nOnly urls through ${urlList[index-1]} have been opened.`
                    +"\n\nThis Sequential Mass URL Opener page should be reloaded before being used again.");
                }
            });

            if (pauseState.isPaused) {
                // If paused, continue once unpaused.
                pauseButton.addEventListener("unpause", function() { createTab(); }, {once: true});
                chrome.tabs.onUpdated.removeListener(thisListener);
                chrome.tabs.onRemoved.removeListener(thisListener);
            } else {
                createTab();
            }
        }
    }
    chrome.tabs.onUpdated.addListener(thisListener);
    chrome.tabs.onRemoved.addListener(thisListener);
}
