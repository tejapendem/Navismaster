sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("navismaster.controller.Main", {

        onInit: function () {
            console.log("NavisMaster initialized");

            // Build high-fidelity mockup data for Screen 2 (Steward Inbox Table)
            var oInboxData = {
                selectedCount: 4,
                items: [
                    { id: "MAT-088421", name: "Hex Bolt M8x30 A2", domain: "Material", domainDot: "blue", source: "SAP ECC", score: 74, scoreClass: "orangeBrown", scoreState: "review", finding: "RNV-MAT-013 · UoM/family mismatch + NER conflict", sev: "Hard", sevDot: "red", age: "6h", selected: true },
                    { id: "BP-0010023711", name: "Acme GmbH (Muenchen)", domain: "Supplier", domainDot: "blue", source: "Portal", score: 58, scoreClass: "red", scoreState: "remediate", finding: "RNV-SUP-009 · Sanctions screen — possible OFAC match", sev: "Hard", sevDot: "red", age: "2h", selected: true },
                    { id: "MAT-088502", name: "Hexagon bolt, stainless", domain: "Material", domainDot: "blue", source: "CDP-ETL", score: 79, scoreClass: "orangeBrown", scoreState: "review", finding: "RNV-MAT-005 · Vector 0.94 vs MAT-088421", sev: "Soft", sevDot: "yellow", age: "11h", selected: false },
                    { id: "BP-0010023891", name: "Acme Industries Ltd", domain: "Supplier", domainDot: "blue", source: "Concur", score: 68, scoreClass: "orange", scoreState: "review", finding: "RNV-SUP-012 · Dedup 0.88 review band", sev: "Soft", sevDot: "yellow", age: "18h", selected: false },
                    { id: "EQ-220314", name: "Centrifugal pump P-101", domain: "Equipment", domainDot: "darkGrey", source: "PM Mobile", score: 82, scoreClass: "orangeBrown", scoreState: "review", finding: "RNV-EQU-007 · Manufacturer canonicalization", sev: "Soft", sevDot: "yellow", age: "4h", selected: true },
                    { id: "MAT-088513", name: "Lubricant SAE 5W-30 (4L)", domain: "Material", domainDot: "blue", source: "SAP ECC", score: 91, scoreClass: "green", scoreState: "auto-accept", finding: "RNV-MAT-018 · MOQ / SAFETY ratio outlier (cohort)", sev: "Info", sevDot: "blue", age: "1h", selected: false },
                    { id: "BP-0010024020", name: "Beta Logistics Pvt Ltd", domain: "Supplier", domainDot: "blue", source: "Ariba", score: 62, scoreClass: "red", scoreState: "remediate", finding: "RNV-SUP-006 · IBAN check-digit failed (IN)", sev: "Hard", sevDot: "red", age: "9h", selected: true },
                    { id: "EQ-220355", name: "Heat exchanger HX-12", domain: "Equipment", domainDot: "darkGrey", source: "SAP ECC", score: 77, scoreClass: "orangeBrown", scoreState: "review", finding: "RNV-EQU-011 · Hierarchy parent missing in IFLOT", sev: "Soft", sevDot: "yellow", age: "14h", selected: false },
                    { id: "MAT-088620", name: "Stainless flange 4\"", domain: "Material", domainDot: "blue", source: "SAP ECC", score: 88, scoreClass: "green", scoreState: "auto-accept", finding: "RNV-MAT-002 · Description grammar drift", sev: "Info", sevDot: "blue", age: "30m", selected: false },
                    { id: "BP-0010024033", name: "Globex Trading SARL", domain: "Supplier", domainDot: "blue", source: "Portal", score: 54, scoreClass: "red", scoreState: "remediate", finding: "RNV-SUP-004 · VIES VAT not found", sev: "Hard", sevDot: "red", age: "21h", selected: false }
                ]
            };

            var oModel = new JSONModel(oInboxData);
            this.getView().setModel(oModel, "inbox");
        },

        onAfterRendering: function () {
            // Attach browser-level click delegates to make custom styled containers clickable
            var oLogo = this.getView().byId("logoHeader");
            if (oLogo) {
                oLogo.attachBrowserEvent("click", this.onDashboardPress.bind(this));
            }

            var oStewardInboxTile = this.getView().byId("stewardInboxTile");
            if (oStewardInboxTile) {
                oStewardInboxTile.attachBrowserEvent("click", this.onStewardInboxPress.bind(this));
            }

            var oPillarFoundation = this.getView().byId("pillarFoundation");
            if (oPillarFoundation) {
                oPillarFoundation.attachBrowserEvent("click", this.onDashboardPress.bind(this));
            }
        },

        onStewardInboxPress: function () {
            // Toggle view visibility
            this.getView().byId("dashboardView").setVisible(false);
            this.getView().byId("stewardInboxView").setVisible(true);

            // Update sidebar active highlights
            var oList = this.getView().byId("workspaceList");
            if (oList) {
                var aItems = oList.getItems();
                aItems.forEach(function (oItem) {
                    oItem.removeStyleClass("activeWorkspaceItem");
                });
                aItems[0].addStyleClass("activeWorkspaceItem"); // First item is Steward Inbox
            }
        },

        onDashboardPress: function () {
            // Switch back to the dashboard cockpit
            this.getView().byId("stewardInboxView").setVisible(false);
            this.getView().byId("dashboardView").setVisible(true);

            // Remove highlight from workspace list
            var oList = this.getView().byId("workspaceList");
            if (oList) {
                var aItems = oList.getItems();
                aItems.forEach(function (oItem) {
                    oItem.removeStyleClass("activeWorkspaceItem");
                });
            }
        },

        onSelectionChange: function (oEvent) {
            // Dynamically recalculate selected count and update checkmark button value
            var oTable = oEvent.getSource();
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("inbox");
            if (oModel) {
                oModel.setProperty("/selectedCount", aSelectedItems.length);
            }
        }

    });
});