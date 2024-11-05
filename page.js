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
        value_unchanged_during_tab_opening: undefined,
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
                button["background-color"] = "hsl(0deg 0% 45% / 30%)";
                dropdown["border-style"] = "groove";
                dropdown.display = "inline-flex";
            } else {
                button["background-color"] = "";
                dropdown["border-style"] = "revert";
                dropdown.display = "none";
            }
        },
    },
    completedListsModN: { // How many lists have been fully opened, mod N.
        N: 4,
        get: () => {
            let x = parseInt(localStorage.getItem("completedListsModN"));
            return isNaN(x) ? 0 : x;
        },
        set: (newVal) => localStorage.setItem("completedListsModN", newVal),
        iterate: function() {
            const value = (this.get()+1) % this.N;
            this.set(value);
            this.conditionallyShowReviewBox(value);
        },
        conditionallyShowReviewBox: function(value) {
            if (value == 0) reviewBoxDisplayer.showUnlessProhibited();
        }, // Show review box after every Nth list is completed opening.
    },
    neverShowReviewDialogAgain: { // Should the review dialog box never be opened again?
        get: () => (localStorage.getItem("neverShowReviewDialogAgain") ?? "false") === "true",
        set: (newVal) => localStorage.setItem("neverShowReviewDialogAgain", newVal),
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
    openLimitedNumberThenDelete: { /* SETTING: Should only the first N tabs be opened, then removed from the list? */
        value: (localStorage.getItem("openLimitedNumberThenDelete") ?? "false") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("openLimitedNumberThenDelete", newVal); },
        settingId: "openLimitedNumberThenDelete",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => this.set(field.checked));
        },
        urlsToRemoveFromTextbox: [],
        removeThoseUrlsFromTextbox: function() {
            if (!this.value) return; // Don't run if setting is disabled.

            /* The \n character padding and replacement is to ensure that only ENTIRE lines are matched, 
            instead of substrings within a line. */
            let newTextboxValue = `\n${theTextArea.value}\n`;
            this.urlsToRemoveFromTextbox.forEach(url => {
                newTextboxValue = newTextboxValue.replace(`\n${url}\n`, "\n");
            });
            theTextArea.value = newTextboxValue.trim();
            theTextArea.dispatchEvent(new Event('change'));
        },
    },
    openLimitedNumber_number: (() => { /* SETTING: If openLimitedNumberThenDelete is enabled, what is N? */
        const ALL = "all";
        const DEFAULT = ALL;
        return {
            VALUE_ALL: ALL,
            DEFAULT_VALUE: DEFAULT,
            value: localStorage.getItem("openLimitedNumber_number") ?? 5,
            validate: function(value) {
                if (value === this.VALUE_ALL) return value;
                value = typeof(value) === "string" ? parseInt(value) : value;
                if (typeof(value) === "number" && value > 0) return value;
                return this.DEFAULT_VALUE;
            },
            set: function(newVal) {
                this.value = this.validate(newVal);
                localStorage.setItem("openLimitedNumber_number", this.value);
                document.getElementById(this.settingId).value = this.value;
            },
            settingId: "openLimitedNumber_number",
            onStartup: function() {
                let field = document.getElementById(this.settingId);
                this.set(this.value);
                field.addEventListener('change', () => this.set(field.value));
            },
            getValueAsNumber: function() {
                if (this.value === this.VALUE_ALL) return Infinity;
                return this.value;
            },
    }})(),
    suspendBeyondMaxTabs: { /* SETTING: Should tabs not be opened while there's N or more open tabs in the window? */
        EVENT_STRING_SET: 'suspendBeyondMaxTabs set',
        value: (localStorage.getItem("suspendBeyondMaxTabs") ?? "false") === "true",
        set: function(newVal) {
            this.value = newVal;
            localStorage.setItem("suspendBeyondMaxTabs", newVal);
            document.getElementById(this.settingId).dispatchEvent(new Event(this.EVENT_STRING_SET));
        },
        settingId: "suspendBeyondMaxTabs",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => this.set(field.checked));
        },
        addSetListener: function(listener) {
            document.getElementById(this.settingId).addEventListener(this.EVENT_STRING_SET, listener);
        },
        removeSetListener: function(listener) {
            document.getElementById(this.settingId).removeEventListener(this.EVENT_STRING_SET, listener);
        },
    },
    suspendBeyondMaxTabs_number: { /* SETTING: If suspendBeyondMaxTabs is enabled, what is N? */
        DEFAULT_VALUE: 2,
        EVENT_STRING_SET: 'suspendBeyondMaxTabs_number set',
        value: localStorage.getItem("suspendBeyondMaxTabs_number") ?? 10,
        validate: function(value) {
            value = typeof(value) === "string" ? parseInt(value) : value;
            if (typeof(value) === "number" && value > 1) return value;
            return this.DEFAULT_VALUE;
        },
        set: function(newVal) {
            this.value = this.validate(newVal);
            localStorage.setItem("suspendBeyondMaxTabs_number", this.value);
            let field = document.getElementById(this.settingId);
            field.value = this.value;
            field.dispatchEvent(new Event(this.EVENT_STRING_SET));
        },
        settingId: "suspendBeyondMaxTabs_number",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            this.set(this.value);
            field.addEventListener('change', () => this.set(field.value));
        },
        addSetListener: function(listener) {
            document.getElementById(this.settingId).addEventListener(this.EVENT_STRING_SET, listener);
        },
        removeSetListener: function(listener) {
            document.getElementById(this.settingId).removeEventListener(this.EVENT_STRING_SET, listener);
        },
        isMaxTabsReached: async function() {
            if (!StoredData.suspendBeyondMaxTabs.value) return false; // If setting isn't on, don't even check if max tabs is reached.
            
            let window_id_to_find_number_of_tabs_in = windowId;
            if (StoredData.openTabsSameWindow.value_unchanged_during_tab_opening) {
                // Tab opener tab may change which window it's on, so we need to check the window id each time.
                window_id_to_find_number_of_tabs_in = (await chrome.windows.getCurrent()).id;
            }
            
            const number_of_tabs_in_window = (await chrome.tabs.query({windowId: window_id_to_find_number_of_tabs_in})).length;
            return number_of_tabs_in_window >= this.value;
        },
    },
    themeColor: { /* SETTING: What should the tool's background color be? */
        value: localStorage.getItem("background-color") ?? "#ffffff",
        set: function(newVal) { this.value = newVal, localStorage.setItem("background-color", newVal); },
        settingId: "colorPicker",
        onStartup: function() {
            const inputElement = document.getElementById(this.settingId);
            inputElement.value = this.value; // Set the default
            
            this.changeBackgroundToColor(this.value); // Init background color.
            
            inputElement.addEventListener('input', () => {
                this.changeBackgroundToColor(inputElement.value);
                this.set(inputElement.value);
            });
        },
        changeBackgroundToColor: function(hex_color) {
            const htmlElementStyle = document.documentElement.style;
            htmlElementStyle.setProperty("--backgroundColor", hex_color+"cc"); // Add 0.8 transparency.
            
            // Some colors will be too dark, and so all text color should change to white.
            const too_dark = this.HEXtoHSL(hex_color).l < 45;
            const text_color = too_dark ? "white" : "black";
            htmlElementStyle.setProperty("--textColor", text_color);
            
            this.handleWhiteEdgecase(hex_color);
        },
        handleWhiteEdgecase: (() => {/* In order to preserve user agent stylesheet styling of inputs, 
            our background color styling class should be removed while background color is white. */
            let was_white_just_previously = true;
            const elementList = document.querySelectorAll(".uses-theme-colored-background");
            return hex_color => {
                let enable;
                if (hex_color === "#ffffff") { // Are we setting color to white?
                    enable = false;
                    was_white_just_previously = true;
                } else if (was_white_just_previously) {
                    enable = true;
                } else { return; } // Do nothing.
                elementList.forEach(x=>x.classList.toggle("uses-theme-colored-background", enable));
            };
        })(),
        HEXtoHSL: function(a){3===(a=a.replace(/#/g,"")).length&&(a=a.split("").map(function(a){return a+a}).join(""));var r=/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})[\da-z]{0,0}$/i.exec(a);if(!r)return null;var e=parseInt(r[1],16),n=parseInt(r[2],16),$=parseInt(r[3],16);e/=255;var i,t,u=Math.max(e,n/=255,$/=255),c=Math.min(e,n,$),d=(u+c)/2;if(u==c)i=t=0;else{var f=u-c;switch(t=d>.5?f/(2-u-c):f/(u+c),u){case e:i=(n-$)/f+(n<$?6:0);break;case n:i=($-e)/f+2;break;case $:i=(e-n)/f+4}i/=6}return t*=100,t=Math.round(t),d*=100,d=Math.round(d),{h:i=Math.round(360*i),s:t,l:d}}, // https://www.html-code-generator.com/javascript/color-converter-script
    },
    openTabAfterDelay: { /* SETTING: Should each tab be opened after a delay, completely ignoring tab loading? */
        value: (localStorage.getItem("openTabAfterDelay") ?? "false") === "true",
        set: function(newVal) { this.value = newVal, localStorage.setItem("openTabAfterDelay", newVal); },
        settingId: "openTabAfterDelay",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            field.checked = this.value; // Set the default
            field.addEventListener('change', () => this.set(field.checked));
        },
        getDelayInfoIfRelevant: function() {
            return this.value ? {in_seconds: StoredData.openTabAfterDelay_seconds.value} : undefined;
        },
    },
    openTabAfterDelay_seconds: { /* SETTING: If openTabAfterDelay is enabled, how long should the delay be in seconds? */
        DEFAULT_VALUE_ON_INVALID_INPUT: 5,
        MINIMUM_DELAY: 0.05, // 1/20th of a second
        value: localStorage.getItem("openTabAfterDelay_seconds") ?? 5,
        validate: function(value) {
            value = typeof(value) === "string" ? parseFloat(value.replaceAll(/[^0-9.-]/g, "")) : value;
            if (typeof(value) === "number" && !isNaN(value)) return Math.max(this.MINIMUM_DELAY, Math.min(value, 30000000)); // Must be larger than minimum delay, and I'm not going to try to support delays that approach a year.
            return this.DEFAULT_VALUE_ON_INVALID_INPUT;
        },
        set: function(newVal) {
            this.value = this.validate(newVal);
            localStorage.setItem("openTabAfterDelay_seconds", this.value);
            document.getElementById(this.settingId).value = `${this.value} sec`;
        },
        settingId: "openTabAfterDelay_seconds",
        onStartup: function() {
            let field = document.getElementById(this.settingId);
            this.set(this.value);
            field.addEventListener('change', () => this.set(field.value));
        },
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
        "openLimitedNumberThenDelete",
        "openLimitedNumber_number",
        "suspendBeyondMaxTabs",
        "suspendBeyondMaxTabs_number",
        "themeColor",
        "openTabAfterDelay",
        "openTabAfterDelay_seconds",
    ],
};

for (key of StoredData._startupOrder) {
    StoredData[key].onStartup();
} // Run the startup functions



const reviewBoxDisplayer = {
    dialogBoxElement: document.getElementById("theReviewDialogBox"),
    chromeWebstoreLinkButtonElement: document.getElementById("theReviewDialogBoxChromeWebStoreLinkButton"),
    closeButtonElement: document.getElementById("theReviewDialogBoxCloseButton"),
    neverShowAgainCheckboxElement: document.getElementById("theReviewDialogBoxNeverShowAgainCheckbox"),
    onStartup: function() {
        this.closeButtonElement.addEventListener("click", () => {
            this.dialogBoxElement.close();
        });
        this.chromeWebstoreLinkButtonElement.addEventListener("click", () => {
            window.open("https://chromewebstore.google.com/detail/sequential-mass-url-opene/lgffephbjkjmkdipchghjadbeppgojhk");
        });
        this.neverShowAgainCheckboxElement.addEventListener("change", () => {
            StoredData.neverShowReviewDialogAgain.set(this.neverShowAgainCheckboxElement.checked);
        });
    },
    show: function() {this.dialogBoxElement.showModal()},
    showUnlessProhibited: function() {
        if (!StoredData.neverShowReviewDialogAgain.get()) this.show();
    },
};
reviewBoxDisplayer.onStartup();



const linesSelectedDisplayer = {
    displayerElement: document.getElementById("lines-selected-number-span"),
    line_count: "",
    onStartup: function() {
        theTextArea.addEventListener("select", () => {
            this.line_count = window.getSelection().toString().split(/\r|\r\n|\n/).length;
            this.render();
        });
        theTextArea.addEventListener("focusout", () => {
            this.line_count = "";
            this.render();
        });
        
        this.line_count = theTextArea.value.split(/\r|\r\n|\n/).length;
        this.render();
    },
    render: function() {
        this.displayerElement.innerText = this.line_count;
    },
};
linesSelectedDisplayer.onStartup();

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
theTextArea.focus();



function getUrls(testingText) {
    if (testingText !== undefined) { // Allow for use of hardcoded test input.
        theTextArea.value = testingText;
    }

    let uncleanedUrlList = theTextArea.value.split("\n").filter(Boolean);
    if (StoredData.openLimitedNumberThenDelete.value) {
        uncleanedUrlList = uncleanedUrlList.slice(0, StoredData.openLimitedNumber_number.getValueAsNumber());
        StoredData.openLimitedNumberThenDelete.urlsToRemoveFromTextbox = uncleanedUrlList;
    }

    return uncleanedUrlList.map(potentialUrl => { // Try to validate url format.
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
    });
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
    StoredData.openTabsSameWindow.value_unchanged_during_tab_opening = StoredData.openTabsSameWindow.value;

    urlList = getUrls();
    urlList = urlList.length > 0 ? urlList : getUrls(exampleUrls); // Use the example urls if text is empty.
    tabTitleCounter.reset();
    tabTitleCounter.total = urlList.length;

    const useIncognito = StoredData.openTabsInIncognito.value;
    chrome.extension.isAllowedIncognitoAccess(async (allowed) => {
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
                openTabWhenPriorIsLoaded(1, StoredData.openTabAfterDelay.getDelayInfoIfRelevant());
            });
        } else { // Open tabs into current window. Incognito is not an option here.
            const createFirstTab = () => {
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
                    openTabWhenPriorIsLoaded(1, StoredData.openTabAfterDelay.getDelayInfoIfRelevant());
                });
            };
            // If max tabs is already reached before starting, then wait just like a normal interrupt.
            if (await isPausedOrMaxTabsReached()) {
                interruptTabOpening(createFirstTab, undefined);
            } else {
                createFirstTab();
            }
        }
    });
}

let windowId = undefined;
let priorTabId = undefined;
function openTabWhenPriorIsLoaded(index, delay) {
    const thisListener = (tabId, info) => {
        if (delay
        || (tabId === priorTabId && (info.status === "complete" || info.isWindowClosing !== undefined))
        ) {
            if (index >= urlList.length) { // Stop once urlList is fully iterated (AND LOADED).
                console.log("All urls have been loaded fully");
                chrome.tabs.onUpdated.removeListener(thisListener);
                chrome.tabs.onRemoved.removeListener(thisListener);
                if (StoredData.closeEachTabOnComplete.value) { StoredData.closeEachTabOnComplete.removeTab(priorTabId); }
                else if (StoredData.closeTabsOnAllComplete.value) { chrome.tabs.remove(allOpenedTabIds); } // Ignored if closeEachTabOnComplete is on, since redundant.
                openButton.enable();
                StoredData.openLimitedNumberThenDelete.removeThoseUrlsFromTextbox();
                StoredData.completedListsModN.iterate();
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
                openTabWhenPriorIsLoaded(++index, StoredData.openTabAfterDelay.getDelayInfoIfRelevant());
                chrome.tabs.onUpdated.removeListener(thisListener);
                chrome.tabs.onRemoved.removeListener(thisListener);
            })
            .catch((error) => {
                if (error == "Error: Tabs cannot be edited right now (user may be dragging a tab).") {
                    setTimeout(createTab, 1000); /* Just try again. 
                    The long setTimeout addition 'potentially' makes a certain bug much rarer, where two copies of a new tab are opened instead of one. 
                    I've also triggered the bug before by running the opener with DevTools and breakpoints on. */
                } else {
                    console.error(error);
                    chrome.tabs.onUpdated.removeListener(thisListener);
                    chrome.tabs.onRemoved.removeListener(thisListener);
                    document.title = "*** ERROR ***";
                    alert(`ERROR\n\nOnly urls through ${urlList[index-1]} have been opened.`
                    +"\n\nThis Sequential Mass URL Opener page should be reloaded before being used again.");
                }
            });

            // Determine whether tab opening should be interrupted.
            (async () => {
                if (await isPausedOrMaxTabsReached()) {
                    interruptTabOpening(createTab, thisListener);
                } else {
                    createTab();
                }
            })(); // async wrapper here means I don't need to make thisListener and openTabWhenPriorIsLoaded async.
        }
    }

    if (delay) { // We'll either wait for one of these events, or wait for the delay instead.
        setTimeout(thisListener, delay.in_seconds * 1000);
    } else {
        chrome.tabs.onUpdated.addListener(thisListener);
        chrome.tabs.onRemoved.addListener(thisListener);
    }
}

async function isPausedOrMaxTabsReached() {
    return pauseState.isPaused || await StoredData.suspendBeyondMaxTabs_number.isMaxTabsReached();
}

let one_last_createTab_has_not_yet_been_fired_to_trigger_the_alert = true; // Once the alert triggers, the opener should be refreshed, so it doesn't matter that this is global.
async function interruptTabOpening(createTab, thisListener) {
    const checkResumeConditions = async (p1, p2) => {
        // If the focused tab, the only tab that can be dragged (I think), is being dragged, just try again later. Otherwise continue.
        const focusedTab = (await chrome.tabs.query({active: true, windowId: (await chrome.windows.getLastFocused()).id}))[0];
        try {
            await chrome.tabs.move(focusedTab.id, {index: focusedTab.index}); // Will error if the tab is being dragged.
        } catch {
            // Focused tab is being dragged. Try again later.
            setTimeout(() => checkResumeConditions(p1, p2), 1000);
            return;
        }
        
        // No reason to check for resume conditions if the window is closing. (isWindowClosing is a chrome.tabs.onRemoved parameter)
        if (p2?.isWindowClosing && !StoredData.openTabsSameWindow.value_unchanged_during_tab_opening && p2.windowId == windowId) {
            // Let it through to createTab() to fire the alert, but only once. Every tab on that now-closed window will trigger this, so we have to make sure it only happens once.
            if (!one_last_createTab_has_not_yet_been_fired_to_trigger_the_alert) return;
            one_last_createTab_has_not_yet_been_fired_to_trigger_the_alert = false;
        };
        
        if (await isPausedOrMaxTabsReached()) return;
        
        // All clear. Keep opening tabs.
        pauseButton.removeEventListener("unpause", checkResumeConditions);
        StoredData.suspendBeyondMaxTabs.removeSetListener(checkResumeConditions);
        StoredData.suspendBeyondMaxTabs_number.removeSetListener(checkResumeConditions);
        chrome.tabs.onRemoved.removeListener(checkResumeConditions);
        chrome.tabs.onAttached.removeListener(checkResumeConditions);
        createTab();
    };
    
    // Events that may possibly resume tab opening.
    pauseButton.addEventListener("unpause", checkResumeConditions); // If the pause button is unpaused.
    StoredData.suspendBeyondMaxTabs.addSetListener(checkResumeConditions); // If the setting changes.
    StoredData.suspendBeyondMaxTabs_number.addSetListener(checkResumeConditions); // If the setting changes.
    chrome.tabs.onRemoved.addListener(checkResumeConditions); // If a tab is removed.
    chrome.tabs.onAttached.addListener(checkResumeConditions); // If a tab is attached to a window. (seems to trigger reliably on detach as well, so we're using it)
    
    chrome.tabs.onUpdated.removeListener(thisListener);
    chrome.tabs.onRemoved.removeListener(thisListener);
}