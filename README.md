# Sequential Mass URL Opener
Chrome extension that opens each URL in list into tabs in a window, but only if prior pages have finished loading.

See [Releases](https://github.com/Lemonsavery/openUrlsWhenLoaded/releases) for most recent in-production changes. For old unsupported Chromebooks with old Chrome versions, it *might* still be possible to run this extension, check this [release](https://github.com/Lemonsavery/openUrlsWhenLoaded/releases/tag/x).

[Chrome web store page for this extension.](https://chrome.google.com/webstore/detail/openurlswhenloaded/lgffephbjkjmkdipchghjadbeppgojhk)

> **Future Feature:** I've been asked to add the ability to open bookmark folders with this extension. This feature would allow you to right click a bookmark folder, select from *"Open all sequentially (shallow)"* and *"Open all sequentially (deep)"* in the context menu, and the tool would open and immediately begin opening the URLs of those bookmarks. I will add this feature once the [Menu ContextType 'bookmark'](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ContextType#browser_compatibility) is added to Chrome's API.

##
![](https://i.imgur.com/rxZPLFo.png)
