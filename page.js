const exampleUrls = `
https://www.google.com
https://www.google.com/search?q=hat
https://www.google.com/search?q=shoe
`;


const theTextArea = document.getElementById("theTextArea");
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

var urlList = undefined;
const incognitoCheckbox = document.getElementById("incognitoCheckbox");
async function main() {
    urlList = getUrls();
    urlList = urlList.length > 0 ? urlList : getUrls(exampleUrls); // Use the example urls if text is empty.
    tabTitleCounter.total = urlList.length;

    var useIncognito = incognitoCheckbox.checked;
    chrome.extension.isAllowedIncognitoAccess((allowed) => {
        if (!allowed && useIncognito) { // Stop execution in this case.
            alert("openUrlsWhenLoaded does not currently have permission to open tabs in incognito mode."
            +"\n\nTo give it permission, go to your Chrome Menu > More Tools > Extensions, find the "
            +"openUrlsWhenLoaded extension > Details > Allow In Incognito, and enable it.");
            return;
        }
        chrome.windows.create({
            "incognito": useIncognito,
            "state": "minimized"
        })
        .then((result) => {
            // Begin opening urls in tabs.
            priorTabId = result.tabs[0].id;
            windowId = result.id;
            openTabWhenPriorIsLoaded(0);
        });
    });
}

var windowId = undefined;
var priorTabId = undefined;
function openTabWhenPriorIsLoaded(index) {
    if (index >= urlList.length) { // Stop once urlList is fully iterated.
        console.log("All urls have been opened");
        // return;
        window.close(); // Brute force stop, because return isn't working.
    }

    chrome.tabs.onUpdated.addListener(thisListener = (tabId, info) => {
        if (tabId === priorTabId && info.status === "complete") {
            // The tab has loaded. Time to make another.
            const createTab = () => chrome.tabs.create({
                "url": urlList[index],
                "active": false,
                "windowId": windowId
            })
            .then(function(result) {
                // Prepare for the newly created tab to load, hense creating another tab.
                priorTabId = result.id;
                tabTitleCounter.iterate();
                openTabWhenPriorIsLoaded(++index);
                chrome.tabs.onUpdated.removeListener(thisListener);
            })
            .catch((error) => {
                if (error == "Error: Tabs cannot be edited right now (user may be dragging a tab).") {
                    createTab(); // Just try again.
                } else {
                    console.error(error);
                    chrome.tabs.onUpdated.removeListener(thisListener);
                    document.title = "*** ERROR ***";
                    alert(`ERROR\n\nOnly urls through ${urlList[index-1]} have been opened.`
                    +"\n\nThis openUrlsWhenLoaded page should be reloaded before being used again.");
                }
            });

            if (pauseState.isPaused) {
                // If paused, continue once unpaused.
                pauseButton.addEventListener("unpause", function() { createTab(); }, {once: true});
            } else {
                createTab();
            }
        }
    });
}

const tabTitleCounter = {
    loaded: 0,
    total: 0,
    iterate: function() {
        this.loaded++;
        document.title = `(${this.loaded}/${this.total}) Open URLs When Loaded`;
    }
};

const openButton = document.getElementById("theOpenButton");
openButton.onclick = () => {
    openButton.disabled = true;
    main();
    setTimeout(() => { // Prevent accidental multi-clicking of button.
        openButton.disabled = false;
    }, 1000);
};

const pauseButton = document.getElementById("thePauseButton");
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