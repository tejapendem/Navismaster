sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    // When running inside SAP Launchpad, relative fetch() paths hit the Launchpad origin.
    // Point to the approuter directly (CORS is allowed on the approuter for *.hana.ondemand.com).
    var h = window.location.hostname;
    window.NAVISMASTER_API_BASE = (h.indexOf("launchpad.cfapps") > -1 || h.indexOf("portal.cfapps") > -1)
        ? "https://canopusintegrate-navismaster.cfapps.ap10.hana.ondemand.com"
        : "";

    return UIComponent.extend("navismaster.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
        }
    });
});