// Runtime API base URL — points to the approuter which proxies /api/* and /odata/v4/* to the backend
window.NAVISMASTER_API_BASE = (function () {
    var h = window.location.hostname;
    // If running inside Launchpad (not directly on approuter), use the approuter URL
    if (h.indexOf("launchpad.cfapps") > -1 || h.indexOf("portal.cfapps") > -1) {
        return "https://canopusintegrate-navismaster.cfapps.ap10.hana.ondemand.com";
    }
    // Direct approuter or local — use relative paths
    return "";
}());
