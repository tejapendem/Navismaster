sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/ui/core/HTML"
], function (Controller, JSONModel, Dialog, Button, HTML) {
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
        },

        onNewRecordPress: function () {
            var oView = this.getView();
            var oDialog = new Dialog({
                title: "Create Master Data",
                contentWidth: "760px",
                contentHeight: "auto",
                resizable: false,
                draggable: false,
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            oDialog.addStyleClass("masterDataDialog");

            var oHtml = new HTML({
                content: this._getMasterDataDialogHTML()
            });
            oHtml.attachAfterRendering(function () {
                this._attachCardClickHandlers(oDialog);
            }.bind(this));

            oDialog.addContent(oHtml);

            oView.addDependent(oDialog);
            oDialog.open();
        },

        _getMasterDataDialogHTML: function () {
            var aCards = [
                {
                    type: "material",
                    icon: "📦",
                    title: "Material Master",
                    subtitle: "MM01 &middot; MARA / MARC / MAKT / MARM",
                    desc: "Raw materials, operating supplies, packaging, or services. Covers description, classification, org assignment, MRP, purchasing, and costing views.",
                    tags: [
                        { text: "MM", cls: "tagBlue" },
                        { text: "Inventory", cls: "tagCyan" },
                        { text: "MRP", cls: "tagOrange" },
                        { text: "AI Cleansing", cls: "tagGreen" }
                    ],
                    border: "mdcBorderBlue"
                },
                {
                    type: "businesspartner",
                    icon: "🤝",
                    title: "Business Partner",
                    subtitle: "BP / XD01 / XK01 &middot; KNA1 / LFA1 / BUT000",
                    desc: "Customers, vendors, or combined business partners. Covers address, tax IDs, bank details, company code assignment, payment terms, and credit management.",
                    tags: [
                        { text: "Customer", cls: "tagBlue" },
                        { text: "Vendor", cls: "tagPurple" },
                        { text: "CVI Ready", cls: "tagGreen" },
                        { text: "AI Dedup", cls: "tagOrange" }
                    ],
                    border: "mdcBorderGreen"
                },
                {
                    type: "product",
                    icon: "🏭",
                    title: "Product Master",
                    subtitle: "MM01 (FERT/HALB) &middot; Sales Org / BOM",
                    desc: "Finished or semi-finished products. Covers sales organisation, distribution channel, pricing, product hierarchy, BOM relevance, and MRP planning data.",
                    tags: [
                        { text: "FERT", cls: "tagBlue" },
                        { text: "HALB", cls: "tagCyan" },
                        { text: "Sales", cls: "tagOrange" },
                        { text: "BOM", cls: "tagPurple" }
                    ],
                    border: "mdcBorderOrange"
                },
                {
                    type: "equipment",
                    icon: "⚙️",
                    title: "Equipment Master",
                    subtitle: "IE01 &middot; EQUI / EQUZ / ILOA",
                    desc: "Plant maintenance equipment including manufacturer data, functional location, work center, cost center, and classification characteristics for PM planning.",
                    tags: [
                        { text: "PM", cls: "tagBlue" },
                        { text: "Asset", cls: "tagGreen" },
                        { text: "Classification", cls: "tagCyan" },
                        { text: "AI Match", cls: "tagPurple" }
                    ],
                    border: "mdcBorderPurple"
                }
            ];

            var sHtml = '<div class="masterDataSubtitle">Select the type of master data to create. Each form is validated by NavisMaster\'s AI rule engine and checked for duplicates before going to your manager for approval.</div>';
            sHtml += '<div class="masterDataGrid">';

            for (var i = 0; i < aCards.length; i++) {
                var card = aCards[i];
                sHtml += '<div class="masterDataCard ' + card.border + '" data-type="' + card.type + '">';
                sHtml += '<div class="masterDataCardIcon">' + card.icon + '</div>';
                sHtml += '<div class="masterDataCardBody">';
                sHtml += '<div class="masterDataCardTitle">' + card.title + '</div>';
                sHtml += '<div class="masterDataCardSubtitle">' + card.subtitle + '</div>';
                sHtml += '<div class="masterDataCardDesc">' + card.desc + '</div>';
                sHtml += '<div class="masterDataTags">';
                for (var j = 0; j < card.tags.length; j++) {
                    sHtml += '<span class="masterDataTag ' + card.tags[j].cls + '">' + card.tags[j].text + '</span>';
                }
                sHtml += '</div></div></div>';
            }

            sHtml += '</div>';
            return sHtml;
        },

        _attachCardClickHandlers: function (oDialog) {
            var that = this;
            var aCards = document.querySelectorAll(".masterDataCard");
            for (var i = 0; i < aCards.length; i++) {
                aCards[i].addEventListener("click", function () {
                    var sType = this.getAttribute("data-type");
                    oDialog.close();
                    that._openMasterDataWizard(sType);
                });
            }
        },

        _openMasterDataWizard: function (sType) {
            var oData = this._getWizardData(sType);
            var iCurrentStep = 0;
            var oView = this.getView();

            var oDialog = new Dialog({
                title: oData.icon + " " + oData.title,
                contentWidth: "860px",
                contentHeight: "auto",
                resizable: false,
                draggable: false,
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            oDialog.addStyleClass("masterDataWizardDialog");

            var oHtml = new HTML({
                content: this._renderWizard(oData, iCurrentStep)
            });
            oHtml.attachAfterRendering(function () {
                this._attachWizardHandlers(oDialog, oHtml, oData, iCurrentStep);
            }.bind(this));

            oDialog.addContent(oHtml);
            oView.addDependent(oDialog);
            oDialog.open();
        },

        _renderWizard: function (oData, iCurrentStep) {
            var sHtml = '<div class="wizContainer">';

            // Left: Step stepper
            sHtml += '<div class="wizStepper">';
            sHtml += '<div class="wizStepperTitle">Steps</div>';
            for (var i = 0; i < oData.steps.length; i++) {
                var sActive = i === iCurrentStep ? " wizStepActive" : "";
                var sDone = i < iCurrentStep ? " wizStepDone" : "";
                sHtml += '<div class="wizStep' + sActive + sDone + '" data-step="' + i + '">';
                sHtml += '<div class="wizStepCircle">';
                if (i < iCurrentStep) {
                    sHtml += '✓';
                } else {
                    sHtml += (i + 1);
                }
                sHtml += '</div>';
                sHtml += '<div class="wizStepLabel">';
                sHtml += '<div class="wizStepTitle">' + oData.steps[i].title + '</div>';
                sHtml += '<div class="wizStepDesc">' + oData.steps[i].desc + '</div>';
                sHtml += '</div>';
                sHtml += '</div>';
                if (i < oData.steps.length - 1) {
                    sHtml += '<div class="wizStepLine"></div>';
                }
            }
            sHtml += '</div>';

            // Right: Form content
            sHtml += '<div class="wizForm">';
            sHtml += '<div class="wizFormStepLabel">Step ' + (iCurrentStep + 1) + ' of ' + oData.steps.length + '</div>';
            sHtml += '<div class="wizFormTitle">' + oData.steps[iCurrentStep].title + '</div>';
            sHtml += '<div class="wizFormDesc">' + oData.steps[iCurrentStep].desc + '</div>';
            sHtml += this._renderWizardFields(oData.steps[iCurrentStep].fields);
            sHtml += '</div>';

            sHtml += '</div>'; // close wizContainer

            // Navigation bar
            sHtml += '<div class="wizNav">';
            sHtml += '<div class="wizNavLeft">';
            if (iCurrentStep > 0) {
                sHtml += '<button class="wizBtn wizBtnPrev" type="button">← Previous</button>';
            }
            sHtml += '</div>';
            sHtml += '<div class="wizNavRight">';
            sHtml += '<button class="wizBtn wizBtnCancel" type="button">Cancel</button>';
            if (iCurrentStep < oData.steps.length - 1) {
                sHtml += '<button class="wizBtn wizBtnNext" type="button">Next →</button>';
            } else {
                sHtml += '<button class="wizBtn wizBtnSubmit" type="button">🚀 Submit for Approval</button>';
            }
            sHtml += '</div>';
            sHtml += '</div>';

            return sHtml;
        },

        _renderWizardFields: function (aFields) {
            var sHtml = '<div class="wizFields">';
            for (var i = 0; i < aFields.length; i++) {
                var f = aFields[i];
                var sRequired = f.required ? ' <span class="wizReq">*</span>' : '';
                var sRequiredClass = f.required ? ' wizFieldRequired' : '';
                sHtml += '<div class="wizField' + sRequiredClass + '">';
                sHtml += '<label class="wizFieldLabel">' + f.label + sRequired + '</label>';
                if (f.aiSuggested) {
                    sHtml += '<span class="wizAiBadge">🤖 AI</span>';
                }
                if (f.description) {
                    sHtml += '<div class="wizFieldDesc">' + f.description + '</div>';
                }
                if (f.type === "select") {
                    sHtml += '<select class="wizInput wizSelect">';
                    sHtml += '<option value="">Select...</option>';
                    for (var j = 0; j < f.options.length; j++) {
                        sHtml += '<option value="' + f.options[j].value + '">' + f.options[j].text + '</option>';
                    }
                    sHtml += '</select>';
                } else if (f.type === "textarea") {
                    sHtml += '<textarea class="wizInput wizTextarea" placeholder="' + (f.placeholder || "") + '"';
                    if (f.maxLength) { sHtml += ' maxlength="' + f.maxLength + '"'; }
                    sHtml += '></textarea>';
                    if (f.maxLength) {
                        sHtml += '<div class="wizCharCounter">0 / ' + f.maxLength + '</div>';
                    }
                } else if (f.type === "number") {
                    sHtml += '<input class="wizInput wizText" type="number" placeholder="' + (f.placeholder || "") + '"';
                    if (f.maxLength) { sHtml += ' maxlength="' + f.maxLength + '"'; }
                    sHtml += ' />';
                } else {
                    sHtml += '<input class="wizInput wizText" type="text" placeholder="' + (f.placeholder || "") + '"';
                    if (f.maxLength) { sHtml += ' maxlength="' + f.maxLength + '"'; }
                    sHtml += ' />';
                    if (f.maxLength) {
                        sHtml += '<div class="wizCharCounter">0 / ' + f.maxLength + '</div>';
                    }
                }
                if (f.aiSuggested) {
                    sHtml += '<button class="wizAiApplyBtn" type="button">✨ Apply AI Suggestion</button>';
                }
                sHtml += '</div>';
            }
            sHtml += '</div>';
            return sHtml;
        },

        _attachWizardHandlers: function (oDialog, oHtml, oData, iCurrentStep) {
            var that = this;

            // Step click
            var aSteps = document.querySelectorAll(".wizStep");
            for (var i = 0; i < aSteps.length; i++) {
                aSteps[i].addEventListener("click", function () {
                    var iStep = parseInt(this.getAttribute("data-step"));
                    oHtml.setContent(that._renderWizard(oData, iStep));
                    // Re-attach after rendering
                    setTimeout(function () {
                        that._attachWizardHandlers(oDialog, oHtml, oData, iStep);
                    }, 0);
                });
            }

            // Prev button
            var oPrev = document.querySelector(".wizBtnPrev");
            if (oPrev) {
                oPrev.addEventListener("click", function () {
                    var iStep = iCurrentStep - 1;
                    oHtml.setContent(that._renderWizard(oData, iStep));
                    setTimeout(function () {
                        that._attachWizardHandlers(oDialog, oHtml, oData, iStep);
                    }, 0);
                });
            }

            // Next button
            var oNext = document.querySelector(".wizBtnNext");
            if (oNext) {
                oNext.addEventListener("click", function () {
                    var iStep = iCurrentStep + 1;
                    oHtml.setContent(that._renderWizard(oData, iStep));
                    setTimeout(function () {
                        that._attachWizardHandlers(oDialog, oHtml, oData, iStep);
                    }, 0);
                });
            }

            // Cancel button
            var oCancel = document.querySelector(".wizBtnCancel");
            if (oCancel) {
                oCancel.addEventListener("click", function () {
                    oDialog.close();
                });
            }

            // Submit button
            var oSubmit = document.querySelector(".wizBtnSubmit");
            if (oSubmit) {
                oSubmit.addEventListener("click", function () {
                    oDialog.close();
                    that._showSubmitConfirmation(oData);
                });
            }

            // Char counters
            var aTextInputs = document.querySelectorAll(".wizText[maxlength], .wizTextarea[maxlength]");
            for (var k = 0; k < aTextInputs.length; k++) {
                aTextInputs[k].addEventListener("input", function () {
                    var oParent = this.closest(".wizField");
                    if (oParent) {
                        var oCounter = oParent.querySelector(".wizCharCounter");
                        if (oCounter) {
                            oCounter.textContent = this.value.length + " / " + this.getAttribute("maxlength");
                        }
                    }
                });
            }
        },

        _showSubmitConfirmation: function (oData) {
            var oView = this.getView();
            var oDialog = new Dialog({
                title: "🚀 Request Submitted",
                contentWidth: "420px",
                contentHeight: "auto",
                resizable: false,
                draggable: false,
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            oDialog.addStyleClass("submitConfirmDialog");

            var sHtml = '<div class="submitConfirmContent">';
            sHtml += '<div class="submitConfirmIcon">✅</div>';
            sHtml += '<div class="submitConfirmTitle">' + oData.title + ' request submitted!</div>';
            sHtml += '<div class="submitConfirmDesc">Your request has been sent for AI cleansing, deduplication checks, and manager approval. You will receive an email notification with the SAP record number once approved.</div>';
            sHtml += '<div class="submitConfirmDetails">';
            sHtml += '<div class="submitConfirmRow"><span class="submitConfirmRowLabel">Type</span><span>' + oData.title + '</span></div>';
            sHtml += '<div class="submitConfirmRow"><span class="submitConfirmRowLabel">Status</span><span class="submitConfirmStatus">PENDING APPROVAL</span></div>';
            sHtml += '<div class="submitConfirmRow"><span class="submitConfirmRowLabel">SLA</span><span>2 business days</span></div>';
            sHtml += '</div>';
            sHtml += '</div>';

            var oHtml = new HTML({ content: sHtml });
            oDialog.addContent(oHtml);
            oView.addDependent(oDialog);
            oDialog.open();
        },

        _getWizardData: function (sType) {
            var oWizards = {
                material: {
                    icon: "📦",
                    title: "Material Master",
                    subtitle: "MM01 · MARA / MARC / MAKT / MARM",
                    steps: [
                        {
                            title: "Basic Info",
                            desc: "MARA.MAKTX / MTART / MEINS",
                            fields: [
                                { label: "Material Type", type: "select", required: true, options: [{text:"Raw Material (ROH)",value:"ROH"},{text:"Operating Supply (HAWA)",value:"HAWA"},{text:"Packaging (VERP)",value:"VERP"},{text:"Services (DIEN)",value:"DIEN"}], aiSuggested: true },
                                { label: "Short Description (SAP 40-char)", type: "text", required: true, maxLength: 40, aiSuggested: true, description: "AI will generate SAP-compliant 40-char short text" },
                                { label: "Base Unit of Measure", type: "select", required: true, options: [{text:"Piece (PC)",value:"PC"},{text:"Kilogram (KG)",value:"KG"},{text:"Meter (M)",value:"M"},{text:"Liter (L)",value:"L"},{text:"Each (EA)",value:"EA"},{text:"Box (BX)",value:"BX"}], aiSuggested: true },
                                { label: "Old Material Number", type: "text", required: false, placeholder: "Optional legacy ID" },
                                { label: "Division", type: "select", required: true, options: [{text:"Raw Materials",value:"10"},{text:"Packaging",value:"20"},{text:"Services",value:"30"}] }
                            ]
                        },
                        {
                            title: "Classification",
                            desc: "Weights / UNSPSC / Alt UoM",
                            fields: [
                                { label: "Gross Weight", type: "number", required: false, placeholder: "0.000" },
                                { label: "Net Weight", type: "number", required: false, placeholder: "0.000" },
                                { label: "Weight Unit", type: "select", required: true, options: [{text:"Kilogram (KG)",value:"KG"},{text:"Gram (G)",value:"G"},{text:"Pound (LB)",value:"LB"}] },
                                { label: "UNSPSC Code", type: "text", required: true, aiSuggested: true, description: "AI will suggest UNSPSC taxonomy code based on description" },
                                { label: "Alternative Unit of Measure", type: "select", required: false, options: [{text:"None",value:""},{text:"Each (EA)",value:"EA"},{text:"Box (BX)",value:"BX"},{text:"Pallet (PAL)",value:"PAL"}] }
                            ]
                        },
                        {
                            title: "Org & MRP",
                            desc: "Plant / Storage / MRP / Valuation",
                            fields: [
                                { label: "Plant", type: "select", required: true, options: [{text:"Plant 1000 (Hamburg)",value:"1000"},{text:"Plant 2000 (Munich)",value:"2000"},{text:"Plant 3000 (Berlin)",value:"3000"}] },
                                { label: "Storage Location", type: "select", required: true, options: [{text:"0001 (Main Store)",value:"0001"},{text:"0002 (WIP)",value:"0002"},{text:"0003 (Quarantine)",value:"0003"}] },
                                { label: "MRP Type", type: "select", required: true, options: [{text:"PD (MRP)",value:"PD"},{text:"ND (No Planning)",value:"ND"},{text:"VB (Consumption)",value:"VB"}] },
                                { label: "MRP Controller", type: "text", required: true, placeholder: "MRP controller ID" },
                                { label: "Valuation Class", type: "select", required: true, options: [{text:"3000 (Raw Materials)",value:"3000"},{text:"4000 (Packaging)",value:"4000"},{text:"5000 (Services)",value:"5000"}] }
                            ]
                        },
                        {
                            title: "Purchasing & Costing",
                            desc: "Buyer / Price / Curr.",
                            fields: [
                                { label: "Purchasing Group", type: "select", required: true, options: [{text:"P01 (Raw Materials)",value:"P01"},{text:"P02 (Packaging)",value:"P02"},{text:"P03 (Services)",value:"P03"}] },
                                { label: "Standard Price", type: "number", required: true, placeholder: "0.00" },
                                { label: "Currency", type: "select", required: true, options: [{text:"USD",value:"USD"},{text:"EUR",value:"EUR"},{text:"INR",value:"INR"},{text:"GBP",value:"GBP"}] },
                                { label: "Price Unit", type: "number", required: true, placeholder: "1" },
                                { label: "Business Justification", type: "textarea", required: true, description: "Explain the business need for this material" }
                            ]
                        }
                    ]
                },
                businesspartner: {
                    icon: "🤝",
                    title: "Business Partner",
                    subtitle: "BP / XD01 / XK01 · KNA1 / LFA1 / BUT000",
                    steps: [
                        {
                            title: "Role & Identity",
                            desc: "BP Role / Grouping / Name",
                            fields: [
                                { label: "BP Role", type: "select", required: true, options: [{text:"Customer",value:"FLCU00"},{text:"Vendor",value:"FLVN00"},{text:"Customer & Vendor",value:"FLBP00"}], aiSuggested: true },
                                { label: "BP Grouping", type: "select", required: true, options: [{text:"Corporate",value:"CORP"},{text:"Individual",value:"INDV"},{text:"Government",value:"GOVT"}] },
                                { label: "Full Name / Company Name", type: "text", required: true, aiSuggested: true, description: "AI will normalize the name format" },
                                { label: "Search Term 1", type: "text", required: true, maxLength: 20 },
                                { label: "Language", type: "select", required: true, options: [{text:"English (EN)",value:"EN"},{text:"German (DE)",value:"DE"},{text:"French (FR)",value:"FR"}] }
                            ]
                        },
                        {
                            title: "Address",
                            desc: "ADRC Street / City / Country",
                            fields: [
                                { label: "Street / House No.", type: "text", required: true },
                                { label: "City", type: "text", required: true, aiSuggested: true },
                                { label: "Postal Code", type: "text", required: true },
                                { label: "Region / State", type: "text", required: false },
                                { label: "Country", type: "select", required: true, options: [{text:"United States",value:"US"},{text:"Germany",value:"DE"},{text:"India",value:"IN"},{text:"United Kingdom",value:"GB"},{text:"France",value:"FR"}] }
                            ]
                        },
                        {
                            title: "Tax & Legal",
                            desc: "GSTIN / PAN / TAN / MSME",
                            fields: [
                                { label: "VAT Registration No.", type: "text", required: false, aiSuggested: true, description: "AI will validate VAT format" },
                                { label: "Tax ID 1", type: "text", required: true },
                                { label: "Tax ID 2", type: "text", required: false },
                                { label: "PAN (India)", type: "text", required: false, placeholder: "AAAAA0000A" },
                                { label: "MSME Registration", type: "text", required: false }
                            ]
                        },
                        {
                            title: "Bank Details",
                            desc: "IFSC / IBAN / Account / Holder",
                            fields: [
                                { label: "Bank Country", type: "select", required: true, options: [{text:"United States",value:"US"},{text:"Germany",value:"DE"},{text:"India",value:"IN"}] },
                                { label: "Bank Key", type: "text", required: true },
                                { label: "Bank Account No.", type: "text", required: true },
                                { label: "IBAN", type: "text", required: false, aiSuggested: true, description: "AI will validate IBAN check digits" },
                                { label: "Account Holder Name", type: "text", required: true }
                            ]
                        },
                        {
                            title: "Company Code",
                            desc: "Recon Acct / Pymt Terms",
                            fields: [
                                { label: "Company Code", type: "select", required: true, options: [{text:"1000 (Germany)",value:"1000"},{text:"2000 (USA)",value:"2000"},{text:"3000 (India)",value:"3000"}] },
                                { label: "Reconciliation Account", type: "text", required: true, aiSuggested: true, description: "AI will suggest based on BP role" },
                                { label: "Payment Terms", type: "select", required: true, options: [{text:"0001 (Due Immediately)",value:"0001"},{text:"0002 (30 Days)",value:"0002"},{text:"0003 (60 Days)",value:"0003"},{text:"0004 (2% 10 / 30)",value:"0004"}] },
                                { label: "Payment Method", type: "select", required: true, options: [{text:"Check",value:"C"},{text:"Bank Transfer",value:"B"},{text:"Credit Card",value:"K"}] }
                            ]
                        }
                    ]
                },
                product: {
                    icon: "🏭",
                    title: "Product Master",
                    subtitle: "MM01 (FERT/HALB) · Sales Org / BOM",
                    steps: [
                        {
                            title: "Basic Info",
                            desc: "Description / FERT-HALB / Group",
                            fields: [
                                { label: "Product Type", type: "select", required: true, options: [{text:"Finished Product (FERT)",value:"FERT"},{text:"Semi-Finished (HALB)",value:"HALB"}], aiSuggested: true },
                                { label: "Short Description", type: "text", required: true, maxLength: 40, aiSuggested: true },
                                { label: "Base Unit of Measure", type: "select", required: true, options: [{text:"Each (EA)",value:"EA"},{text:"Kilogram (KG)",value:"KG"},{text:"Meter (M)",value:"M"},{text:"Liter (L)",value:"L"}] },
                                { label: "Product Group", type: "select", required: true, options: [{text:"Fertilizers",value:"01"},{text:"Chemicals",value:"02"},{text:"Machinery",value:"03"}] }
                            ]
                        },
                        {
                            title: "Sales Data",
                            desc: "Sales Org / Channel / Division",
                            fields: [
                                { label: "Sales Organization", type: "select", required: true, options: [{text:"1000 (Domestic)",value:"1000"},{text:"2000 (Export)",value:"2000"}] },
                                { label: "Distribution Channel", type: "select", required: true, options: [{text:"10 (Direct)",value:"10"},{text:"20 (Wholesale)",value:"20"},{text:"30 (Retail)",value:"30"}] },
                                { label: "Division", type: "select", required: true, options: [{text:"01 (Chemicals)",value:"01"},{text:"02 (Agri)",value:"02"}] },
                                { label: "Sales Unit", type: "select", required: true, options: [{text:"Each (EA)",value:"EA"},{text:"Box (BX)",value:"BX"}] }
                            ]
                        },
                        {
                            title: "Pricing",
                            desc: "Std Price / Hierarchy / Rev Acct",
                            fields: [
                                { label: "Standard Price", type: "number", required: true, placeholder: "0.00" },
                                { label: "Currency", type: "select", required: true, options: [{text:"USD",value:"USD"},{text:"EUR",value:"EUR"},{text:"INR",value:"INR"}] },
                                { label: "Product Hierarchy", type: "text", required: false, description: "Optional hierarchy assignment" },
                                { label: "Revenue Account", type: "text", required: true, aiSuggested: true }
                            ]
                        },
                        {
                            title: "MRP & BOM",
                            desc: "Prod Plant / BOM link / Costing",
                            fields: [
                                { label: "Production Plant", type: "select", required: true, options: [{text:"1000 (Hamburg)",value:"1000"},{text:"2000 (Munich)",value:"2000"}] },
                                { label: "BOM Usage", type: "select", required: true, options: [{text:"Production (1)",value:"1"},{text:"Engineering (2)",value:"2"},{text:"Costing (3)",value:"3"}] },
                                { label: "Lot Size", type: "text", required: true, placeholder: "Minimum lot size" },
                                { label: "Costing Variant", type: "select", required: true, options: [{text:"Standard Cost (S)",value:"S"},{text:"Current Cost (P)",value:"P"}] }
                            ]
                        }
                    ]
                },
                equipment: {
                    icon: "⚙️",
                    title: "Equipment Master",
                    subtitle: "IE01 · EQUI / EQUZ / ILOA",
                    steps: [
                        {
                            title: "Basic Data",
                            desc: "Desc / Manufacturer / Serial",
                            fields: [
                                { label: "Equipment Category", type: "select", required: true, options: [{text:"Machine (M)",value:"M"},{text:"Vehicle (V)",value:"V"},{text:"Building (B)",value:"B"},{text:"Measuring Device (I)",value:"I"}], aiSuggested: true },
                                { label: "Short Description", type: "text", required: true, maxLength: 40, aiSuggested: true },
                                { label: "Manufacturer", type: "text", required: true, aiSuggested: true, description: "AI will canonicalize manufacturer name" },
                                { label: "Serial Number", type: "text", required: false },
                                { label: "Model Number", type: "text", required: false }
                            ]
                        },
                        {
                            title: "Location",
                            desc: "Func Loc / Work Ctr / Cost Ctr",
                            fields: [
                                { label: "Functional Location", type: "text", required: true, description: "Plant maintenance functional location" },
                                { label: "Work Center", type: "text", required: true },
                                { label: "Cost Center", type: "text", required: true, aiSuggested: true },
                                { label: "Plant", type: "select", required: true, options: [{text:"1000 (Hamburg)",value:"1000"},{text:"2000 (Munich)",value:"2000"},{text:"3000 (Berlin)",value:"3000"}] },
                                { label: "Location", type: "text", required: false, placeholder: "Storage location" }
                            ]
                        },
                        {
                            title: "Classification & Nameplate",
                            desc: "Technical attributes / PM data",
                            fields: [
                                { label: "Classification Type", type: "select", required: true, options: [{text:"001 (Pump)",value:"001"},{text:"002 (Motor)",value:"002"},{text:"003 (Valve)",value:"003"},{text:"004 (Heat Exchanger)",value:"004"}] },
                                { label: "Weight", type: "number", required: false, placeholder: "0.000" },
                                { label: "Startup Date", type: "text", required: false, placeholder: "YYYY-MM-DD" },
                                { label: "Warranty End Date", type: "text", required: false, placeholder: "YYYY-MM-DD" },
                                { label: "Technical Nameplate Details", type: "textarea", required: false, description: "Free-text technical specifications" }
                            ]
                        }
                    ]
                }
            };
            return oWizards[sType];
        }

    });
});