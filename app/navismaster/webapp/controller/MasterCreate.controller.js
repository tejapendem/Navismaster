sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    // Read lazily at call time so Component.js has already set window.NAVISMASTER_API_BASE
    function getApiBase() {
        return (typeof window.NAVISMASTER_API_BASE !== "undefined") ? window.NAVISMASTER_API_BASE : "";
    }

    var that, master = null, step = 0, data = {};

    var MASTERS = {
        material: {
            heading: 'Material Master', sub: 'New material creation request · AI-assisted · MM01 equivalent',
            steps: ['Basic Info', 'Classification', 'Org & MRP', 'Purchasing & Costing', 'Review & Submit'],
            dup: { field: 'mat_maktx', msg: 'Possible duplicate found: "STEEL PIPE SEAMLESS SCH40 5IN" (MAT-10045, 87% similarity). Please verify before continuing.' }
        },
        bp: {
            heading: 'Business Partner', sub: 'New BP creation · Smart Tax Lookup · Customer / Vendor · CVI Ready',
            steps: ['Tax Lookup', 'Role & Identity', 'Address', 'Tax & Legal', 'Bank Details', 'Company Code', 'Review & Submit'],
            dup: { field: 'bp_name1', msg: 'Possible match found: "TATA STEEL LIMITED" (BP-50023, 82% name similarity). Check if this is the same entity before proceeding.' }
        },
        product: {
            heading: 'Product Master', sub: 'Finished / Semi-finished product · Sales & BOM data',
            steps: ['Basic Info', 'Sales Data', 'Pricing', 'MRP & BOM', 'Review & Submit'],
            dup: null
        },
        equipment: {
            heading: 'Equipment Master', sub: 'Plant maintenance equipment · IE01 equivalent',
            steps: ['Basic Data', 'Location & Org', 'Classification', 'Review & Submit'],
            dup: null
        }
    };

    var STATE_CODES = {
        '01': '01 — Jammu & Kashmir', '02': '02 — Himachal Pradesh', '03': '03 — Punjab', '04': '04 — Chandigarh',
        '05': '05 — Uttarakhand', '06': '06 — Haryana', '07': '07 — Delhi', '08': '08 — Rajasthan',
        '09': '09 — Uttar Pradesh', '10': '10 — Bihar', '11': '11 — Sikkim', '12': '12 — Arunachal Pradesh',
        '13': '13 — Nagaland', '14': '14 — Manipur', '15': '15 — Mizoram', '16': '16 — Tripura',
        '17': '17 — Meghalaya', '18': '18 — Assam', '19': '19 — West Bengal', '20': '20 — Jharkhand',
        '21': '21 — Odisha', '22': '22 — Chhattisgarh', '23': '23 — Madhya Pradesh', '24': '24 — Gujarat',
        '25': '25 — Daman & Diu', '26': '26 — Dadra & Nagar Haveli', '27': '27 — Maharashtra',
        '28': '28 — Andhra Pradesh (Old)', '29': '29 — Karnataka', '30': '30 — Goa',
        '31': '31 — Lakshadweep', '32': '32 — Kerala', '33': '33 — Tamil Nadu', '34': '34 — Puducherry',
        '35': '35 — Andaman & Nicobar', '36': '36 — Telangana', '37': '37 — Andhra Pradesh'
    };

    var LK_COUNTRIES = [
        { code: 'IN', flag: 'https://flagcdn.com/w40/in.png', name: 'India', type: 'GSTIN' },
        { code: 'EU', flag: 'https://flagcdn.com/w40/eu.png', name: 'EU Countries', type: 'VAT Number' },
        { code: 'UK', flag: 'https://flagcdn.com/w40/gb.png', name: 'United Kingdom', type: 'VAT / Co. No.' },
        { code: 'AE', flag: 'https://flagcdn.com/w40/ae.png', name: 'UAE', type: 'TRN (VAT)' },
        { code: 'SG', flag: 'https://flagcdn.com/w40/sg.png', name: 'Singapore', type: 'UEN / GST' }
    ];
    var LK_LABELS = { IN: 'GSTIN — GST Identification Number', EU: 'VAT Number — EU VAT Registration', UK: 'VAT / Company Number — UK Registration', AE: 'TRN — Tax Registration Number', SG: 'UEN / GST — Business Registration Number' };
    var LK_PLACEHOLDERS = { IN: 'e.g. 27AABCT1332L1ZJ', EU: 'e.g. DE123456789', UK: 'e.g. GB123456789', AE: 'e.g. 100234567890123', SG: 'e.g. 202012345K' };
    var LK_FORMAT_HINTS = { IN: 'Format: <strong>15 characters</strong> — State Code (2) + PAN (10) + Entity No. (1) + Z + Check digit (1)', EU: 'Format: <strong>2-letter country code</strong> + up to 12 alphanumeric characters', UK: 'Format: <strong>GB</strong> followed by 9 or 12 digits (VAT) or 8 digit company number', AE: 'Format: <strong>15 digits</strong> only', SG: 'Format: <strong>9 digits + 1 letter</strong> (UEN)' };
    var LK_BADGE_FLAGS = { IN: '\uD83C\uDDEE\uD83C\uDDF3', EU: '\uD83C\uDDEA\uD83C\uDDFA', UK: '\uD83C\uDDEC\uD83C\uDDE7', AE: '\uD83C\uDDE6\uD83C\uDDEA', SG: '\uD83C\uDDF8\uD83C\uDDEC' };
    var LK_BADGE_NAMES = { IN: 'India', EU: 'EU', UK: 'UK', AE: 'UAE', SG: 'Singapore' };

    var AI_SUGGESTIONS = {
        material: { mat_maktx: 'STEEL PIPE SEAMLESS SCH40 5IN', mat_meins: 'M', mat_unspsc: '40141700 — Pipe Fittings' },
        bp: { bp_land1: 'IN — India' },
        product: { prod_maktx: 'PUMP CENTRIFUGAL 5HP 3PH CAST IRON', prod_unspsc: '40161504 — Centrifugal Pumps' },
        equipment: { eq_eqktx: 'PUMP CENTRIFUGAL 5HP 415V 3PH CI BODY' }
    };

    return Controller.extend("navismaster.controller.MasterCreate", {

        onInit: function () {
            that = this;
            this._closeCallback = null;
        },

        _setCloseCallback: function (fn) {
            this._closeCallback = fn;
        },

        _startWizByType: function (sType) {
            var typeMap = { material: 'material', businesspartner: 'bp', bp: 'bp', product: 'product', equipment: 'equipment' };
            var mapped = typeMap[sType] || sType;
            if (mapped) { this._startWiz(mapped); }
        },

        onAfterRendering: function () {
            var content = this._buildWizardHTML();
            var oHtml = this.getView().byId("wizardContent");
            var dom = oHtml ? oHtml.getDomRef() : null;
            if (dom) {
                dom.innerHTML = content;
                this._bindGlobalEvents();
                // Read type from viewData (passed by Main controller) or hash
                var sType = (this.getView().getViewData() || {}).masterType;
                if (sType) {
                    this._startWizByType(sType);
                } else {
                    this._autoStart();
                }
                this._fetchUser();
            }
        },

        _buildWizardHTML: function () {
            return '' +
                '<header class="navisHeader">' +
                '  <div class="nh-left">' +
                '    <a href="#" onclick="sap.ui.getCore().getComponent(\'container\').getRouter().navTo(\'main\'); return false;" class="nh-brand" title="Back to NavisMaster home">' +
                '      <div class="nh-logo"><svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13" stroke="rgba(255,255,255,0.85)" stroke-width="1.4"/><path d="M16 5 L19 16 L16 27 L13 16 Z" fill="#ffffff"/><path d="M16 5 L19 16 L16 16 Z" fill="rgba(255,255,255,0.55)"/><circle cx="16" cy="16" r="1.6" fill="#0d1b3e"/></svg></div>' +
                '      <div class="nh-text"><span class="nh-title">Navis<span class="nh-title-light">Master</span></span><span class="nh-subtitle">Master Data Quality · AI-native</span></div>' +
                '    </a>' +
                '    <span class="nh-context"><span class="nh-context-dot"></span>Pillar 1 — Foundation</span>' +
                '  </div>' +
                '  <div class="nh-mid">' +
                '    <div class="nh-search">' +
                '      <svg class="nh-search-icon" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11 L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
                '      <input type="text" placeholder="Search records, rules, suppliers, KPIs\u2026" aria-label="Global search">' +
                '      <kbd class="nh-search-kbd">\u2318K</kbd>' +
                '    </div>' +
                '  </div>' +
                '  <div class="nh-right">' +
                '    <div class="nh-icon" title="Notifications"><span>\uD83D\uDD14</span><span class="nh-icon-dot"></span></div>' +
                '    <div class="nh-icon" title="Help">\u2753</div>' +
                '    <div class="nh-icon" title="Settings">\u2699\uFE0F</div>' +
                '    <div class="nh-avatar" id="navisAvatar" title="Loading\u2026">\u00B7\u00B7</div>' +
                '  </div>' +
                '</header>' +
                '<div class="nh-breadcrumb">' +
                '  <a href="#">Foundation</a><span class="nh-bc-sep">\u203A</span><span class="nh-bc-current">Create Master Data</span>' +
                '</div>' +
                '<div class="main">' +
                this._buildHomeScreen() +
                this._buildWizardScreen() +
                this._buildSuccessScreen() +
                '</div>';
        },

        _buildHomeScreen: function () {
            return '' +
                '<div id="scr-home" class="screen active">' +
                '  <section class="cmHero">' +
                '    <div class="cmHeroLeft">' +
                '      <span class="cmKicker">\uD83D\uDCDD &nbsp;Master Data Creation</span>' +
                '      <h1 class="cmHeroTitle">Create <span class="cmHeroTitleAccent">Master Data</span></h1>' +
                '      <p class="cmHeroDesc">Choose a record type below to start an AI-assisted creation form. Every submission is cleansed, deduplicated, and validated against your governance rules before being routed to your manager for approval.</p>' +
                '      <div class="cmHeroStats">' +
                '        <div class="cmStat"><div class="cmStatValue">142</div><div class="cmStatLabel">Created this month</div></div>' +
                '        <div class="cmStatDivider"></div>' +
                '        <div class="cmStat"><div class="cmStatValue">94%</div><div class="cmStatLabel">Auto-approved</div></div>' +
                '        <div class="cmStatDivider"></div>' +
                '        <div class="cmStat"><div class="cmStatValue">2.1<span class="cmStatUnit">d</span></div><div class="cmStatLabel">Avg approval time</div></div>' +
                '      </div>' +
                '    </div>' +
                '    <div class="cmHeroRight">' +
                '      <div class="cmAiPanel">' +
                '        <div class="cmAiOrb"></div>' +
                '        <div class="cmAiTitle">AI Co-pilot is ready</div>' +
                '        <div class="cmAiSub">Suggesting field values, normalising names, detecting duplicates in real time.</div>' +
                '        <div class="cmAiTags"><span class="cmAiTag">\uD83E\uDD16 Cleansing</span><span class="cmAiTag">\uD83D\uDD0D Dedup</span><span class="cmAiTag">\u2713 Validation</span></div>' +
                '      </div>' +
                '    </div>' +
                '  </section>' +
                '  <div class="cmSectionHead"><span class="cmSectionTitle">Choose record type</span><span class="cmSectionHint">4 supported objects \u00B7 Click any card to begin</span></div>' +
                '  <div class="master-grid">' +
                '    <div class="mc mc-material" data-wiz="material"><span class="mc-pop">Most popular</span><div class="mc-top"><div class="mc-iconWrap"><span>\uD83D\uDCE6</span></div><div class="mc-meta"><div class="mc-title">Material Master</div><div class="mc-sap">MM01 \u00B7 MARA / MARC / MAKT / MARM</div></div><span class="mc-stepsBadge">5 steps</span></div><div class="mc-desc">Raw materials, operating supplies, packaging, or services. Covers description, classification, org assignment, MRP, purchasing, and costing views.</div><div class="mc-tags"><span class="tag tag-teal">MM</span><span class="tag tag-blue">Inventory</span><span class="tag tag-blue">MRP</span><span class="tag tag-purple">AI Cleansing</span></div><div class="mc-cta">Start Material Master <span class="mc-ctaArrow">\u2192</span></div></div>' +
                '    <div class="mc mc-bp" data-wiz="bp"><div class="mc-top"><div class="mc-iconWrap"><span>\uD83E\uDD1D</span></div><div class="mc-meta"><div class="mc-title">Business Partner</div><div class="mc-sap">BP / XD01 / XK01 \u00B7 KNA1 / LFA1 / BUT000</div></div><span class="mc-stepsBadge">7 steps</span></div><div class="mc-desc">Customers, vendors, or combined business partners. Covers address, tax IDs, bank details, company code assignment, payment terms, and credit management.</div><div class="mc-tags"><span class="tag tag-teal">Customer</span><span class="tag tag-teal">Vendor</span><span class="tag tag-blue">CVI Ready</span><span class="tag tag-purple">AI Dedup</span></div><div class="mc-cta">Start Business Partner <span class="mc-ctaArrow">\u2192</span></div></div>' +
                '    <div class="mc mc-product" data-wiz="product"><div class="mc-top"><div class="mc-iconWrap"><span>\uD83C\uDFED</span></div><div class="mc-meta"><div class="mc-title">Product Master</div><div class="mc-sap">MM01 (FERT/HALB) \u00B7 Sales Org / BOM</div></div><span class="mc-stepsBadge">5 steps</span></div><div class="mc-desc">Finished or semi-finished products. Covers sales organisation, distribution channel, pricing, product hierarchy, BOM relevance, and MRP planning data.</div><div class="mc-tags"><span class="tag tag-teal">FERT</span><span class="tag tag-teal">HALB</span><span class="tag tag-blue">Sales</span><span class="tag tag-blue">BOM</span></div><div class="mc-cta">Start Product Master <span class="mc-ctaArrow">\u2192</span></div></div>' +
                '    <div class="mc mc-equipment" data-wiz="equipment"><div class="mc-top"><div class="mc-iconWrap"><span>\u2699\uFE0F</span></div><div class="mc-meta"><div class="mc-title">Equipment Master</div><div class="mc-sap">IE01 \u00B7 EQUI / EQUZ / ILOA</div></div><span class="mc-stepsBadge">4 steps</span></div><div class="mc-desc">Plant maintenance equipment including manufacturer data, functional location, work center, cost center, and classification characteristics for PM planning.</div><div class="mc-tags"><span class="tag tag-teal">PM</span><span class="tag tag-blue">Asset</span><span class="tag tag-blue">Classification</span><span class="tag tag-purple">AI Match</span></div><div class="mc-cta">Start Equipment Master <span class="mc-ctaArrow">\u2192</span></div></div>' +
                '  </div>' +
                '  <div class="cmFeatures">' +
                '    <div class="cmFeature"><div class="cmFeatureIcon cmFeatureIconBlue">\uD83D\uDD12</div><div class="cmFeatureBody"><div class="cmFeatureTitle">Compliance-first</div><div class="cmFeatureDesc">GxP / SOX / GDPR rules baked into every form</div></div></div>' +
                '    <div class="cmFeature"><div class="cmFeatureIcon cmFeatureIconPurple">\uD83E\uDD16</div><div class="cmFeatureBody"><div class="cmFeatureTitle">AI-assisted</div><div class="cmFeatureDesc">Smart defaults, normalisation, duplicate checks</div></div></div>' +
                '    <div class="cmFeature"><div class="cmFeatureIcon cmFeatureIconGreen">\u26A1</div><div class="cmFeatureBody"><div class="cmFeatureTitle">Fast approval</div><div class="cmFeatureDesc">Average 2.1 days \u00B7 94% auto-approved</div></div></div>' +
                '  </div>' +
                '</div>';
        },

        _buildWizardScreen: function () {
            return '' +
                '<div id="scr-wizard" class="screen">' +
                '  <div class="wiz-topbar">' +
                '    <button class="btn-back" id="btn-goHome">\u2190 Back</button>' +
                '    <div class="wiz-title-box"><h2 id="wiz-heading">Material Master</h2><p id="wiz-sub">New creation request \u00B7 AI-assisted form</p></div>' +
                '    <div class="mode-toggle-box"><span>Chat Mode</span><label class="toggle"><input type="checkbox" id="chat-toggle"><span class="slider"></span></label><span>\uD83E\uDD16</span></div>' +
                '  </div>' +
                '  <div id="chat-panel" class="chat-panel">' +
                '    <div class="chat-msg"><div class="chat-avatar">\uD83E\uDD16</div><div class="chat-bubble"><strong>NavisMaster AI \u00B7 Assistant</strong> I\'ve analysed similar records in your system and pre-filled some fields. Look for the purple <strong>AI</strong> badges \u2014 review each suggestion and click <strong>Apply</strong> to accept, or type your own value. I\'ll validate your inputs in real time against SAP field rules and flag duplicates before you submit.</div></div>' +
                '  </div>' +
                '  <div class="stepper" id="stepper"></div>' +
                '  <div class="alert alert-warn" id="dup-alert"><span class="a-icon">\u26A0\uFE0F</span><div><strong>Potential Duplicate Detected</strong><p id="dup-msg"></p></div></div>' +
                '  <div id="form-content"></div>' +
                '  <div class="nav-bar">' +
                '    <div class="nav-left"><button class="btn btn-secondary" id="btn-prev">\u2190 Back</button></div>' +
                '    <div class="nav-right"><button class="btn btn-ghost" id="btn-save">\uD83D\uDCBE Save Draft</button><button class="btn btn-primary" id="btn-next">Next \u2192</button></div>' +
                '  </div>' +
                '</div>';
        },

        _buildSuccessScreen: function () {
            return '' +
                '<div id="scr-success" class="screen">' +
                '  <div class="success-wrap">' +
                '    <div class="success-icon">\u2705</div>' +
                '    <h2>Request Submitted Successfully</h2>' +
                '    <p>Your master data creation request is now in the approval workflow. You will be notified at each stage by email and in-app notification.</p>' +
                '    <div class="tracking-box">' +
                '      <div class="track-header">\uD83D\uDCCB Request ID: <span class="track-id" id="req-id">NM-2026-00142</span></div>' +
                '      <div class="ts"><div class="ts-icon ts-done">\u2713</div><div><div class="ts-label">Submitted & AI Validated</div><div class="ts-sub">Fields cleansed \u00B7 Duplicate check passed \u00B7 14/14 rules passed</div></div></div>' +
                '      <div class="ts"><div class="ts-icon ts-active">\u23F3</div><div><div class="ts-label">Manager Approval</div><div class="ts-sub">Pending \u00B7 Notified by email \u2014 SLA: 2 business days</div></div></div>' +
                '      <div class="ts"><div class="ts-icon ts-pending">3</div><div><div class="ts-label">MDM Steward Review</div><div class="ts-sub">Not started \u00B7 Queued in NavisMaster Steward Inbox</div></div></div>' +
                '      <div class="ts"><div class="ts-icon ts-pending">4</div><div><div class="ts-label">SAP Creation via Integration Suite</div><div class="ts-sub">Pending approval \u00B7 Auto-pushed to ECC/S4 on approval</div></div></div>' +
                '      <div class="ts"><div class="ts-icon ts-pending">5</div><div><div class="ts-label">Confirmation & SAP Number</div><div class="ts-sub">SAP material/BP number emailed to requester</div></div></div>' +
                '    </div>' +
                '    <button class="btn btn-primary" id="btn-createAnother">+ Create Another</button>' +
                '  </div>' +
                '</div>';
        },

        _bindGlobalEvents: function () {
            var self = this;
            var oHtml = this.getView().byId("wizardContent");
            var container = oHtml ? oHtml.getDomRef() : null;

            container.addEventListener('click', function (e) {
                var target = e.target.closest('[data-wiz]');
                if (target) { self._startWiz(target.dataset.wiz); return; }

                if (e.target.closest('#btn-goHome') || e.target.closest('#btn-createAnother')) { self._goHome(); return; }
                if (e.target.closest('#btn-prev')) { self._prevStep(); return; }
                if (e.target.closest('#btn-next')) { self._nextStep(); return; }
                if (e.target.closest('#btn-save')) { self._saveDraft(); return; }

                var lookupBtn = e.target.closest('#btn-lookup');
                if (lookupBtn && !lookupBtn.disabled) { self._handleTaxLookup(); return; }

                var countryCard = e.target.closest('.lk-country-card');
                if (countryCard) { self._selectTaxCountry(countryCard.dataset.country); return; }

                var applyBtn = e.target.closest('.ai-apply');
                if (applyBtn) { var inpId = applyBtn.getAttribute('data-field'); if (inpId) self._applyAI(inpId); return; }
            });

            container.addEventListener('change', function (e) {
                if (e.target.id === 'chat-toggle') { self._toggleChat(e.target.checked); }
            });

            container.addEventListener('input', function (e) {
                if (e.target.id === 'bp_gstin') {
                    if (e.target.value !== data.bp_gstin) {
                        data.bp_lookup_done = false;
                        var btn = document.getElementById('btn-lookup');
                        if (btn) { btn.disabled = false; btn.textContent = '\uD83D\uDD04 Re-lookup'; }
                        var st = document.getElementById('lk-status');
                        if (st) st.classList.remove('show', 'success');
                        var rs = document.getElementById('lk-results');
                        if (rs) rs.classList.remove('show');
                    }
                }
            });

            document.addEventListener('keydown', function (e) {
                if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
                    var input = container.querySelector('.nh-search input');
                    if (input) { e.preventDefault(); input.focus(); input.select(); }
                }
                if (e.key === 'Escape') {
                    var active = document.activeElement;
                    if (active && active.matches && active.matches('.nh-search input')) active.blur();
                }
            });

            var searchWrap = container.querySelector('.nh-search');
            if (searchWrap) {
                searchWrap.addEventListener('click', function (e) {
                    if (e.target.tagName !== 'INPUT') {
                        var input = searchWrap.querySelector('input');
                        if (input) input.focus();
                    }
                });
            }
        },

        _show: function (id) {
            document.querySelectorAll('#scr-home, #scr-wizard, #scr-success').forEach(function (s) { s.classList.remove('active'); });
            var el = document.getElementById(id);
            if (el) el.classList.add('active');
        },

        _goHome: function () {
            if (this._closeCallback) {
                this._closeCallback();
            } else {
                this.getOwnerComponent().getRouter().navTo("main");
            }
        },

        _startWiz: function (type) {
            master = type; step = 0; data = {};
            var m = MASTERS[type];
            document.getElementById('wiz-heading').textContent = m.heading;
            document.getElementById('wiz-sub').textContent = m.sub;
            document.getElementById('dup-alert').classList.remove('show');
            this._renderStepper();
            this._renderForm();
            this._updateNav();
            this._show('scr-wizard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        _nextStep: function () {
            if (!this._validate()) return;
            this._collect();
            var steps = MASTERS[master].steps;
            if (step === steps.length - 1) { this._submit(); return; }
            step++;
            if ((master === 'material' && step === 1) || (master === 'bp' && step === 2)) {
                var m = MASTERS[master];
                if (m.dup) {
                    document.getElementById('dup-msg').textContent = m.dup.msg;
                    document.getElementById('dup-alert').classList.add('show');
                }
            } else {
                document.getElementById('dup-alert').classList.remove('show');
            }
            this._renderStepper();
            this._renderForm();
            this._updateNav();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        _prevStep: function () {
            if (step === 0) { this._goHome(); return; }
            step--;
            document.getElementById('dup-alert').classList.remove('show');
            this._renderStepper();
            this._renderForm();
            this._updateNav();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        _updateNav: function () {
            var steps = MASTERS[master].steps;
            var isLast = step === steps.length - 1;
            var nextBtn = document.getElementById('btn-next');
            if (nextBtn) {
                nextBtn.textContent = isLast ? '\u2713 Submit Request' : 'Next \u2192';
                nextBtn.className = isLast ? 'btn btn-submit' : 'btn btn-primary';
            }
            var prevBtn = document.getElementById('btn-prev');
            if (prevBtn) prevBtn.textContent = step === 0 ? '\u2715 Cancel' : '\u2190 Back';
        },

        _saveDraft: function () {
            this._collect();
            alert('Draft saved!\nRequest ID: NM-DRAFT-' + Date.now().toString().slice(-5) + '\nYou can return to complete this request from My Drafts.');
        },

        _submit: function () {
            var id = 'NM-2026-' + String(Math.floor(10000 + Math.random() * 90000));
            document.getElementById('req-id').textContent = id;
            this._show('scr-success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        _toggleChat: function (on) {
            var panel = document.getElementById('chat-panel');
            if (panel) panel.classList.toggle('open', on);
        },

        _renderStepper: function () {
            var steps = MASTERS[master].steps;
            var h = '';
            steps.forEach(function (s, i) {
                var st = i < step ? 'done' : i === step ? 'active' : 'pending';
                h += '<div class="s-item"><div class="s-circle ' + st + '">' + (i < step ? '\u2713' : (i + 1)) + '</div><span class="s-label ' + st + '">' + s + '</span></div>';
                if (i < steps.length - 1) h += '<div class="s-line ' + (i < step ? 'done' : '') + '"></div>';
            });
            document.getElementById('stepper').innerHTML = h;
        },

        _renderForm: function () {
            var fns = {
                material: [this._matStep0, this._matStep1, this._matStep2, this._matStep3, this._reviewStep],
                bp: [this._bpTaxLookup, this._bpStep0, this._bpStep1, this._bpStep2, this._bpStep3, this._bpStep4, this._reviewStep],
                product: [this._prodStep0, this._prodStep1, this._prodStep2, this._prodStep3, this._reviewStep],
                equipment: [this._eqStep0, this._eqStep1, this._eqStep2, this._reviewStep]
            };
            document.getElementById('form-content').innerHTML = fns[master][step].call(this);
            this._initCharCounters();
            setTimeout(this._fireAI.bind(this), 350);
        },

        _F: function (id, label, type, opts) {
            opts = opts || {};
            var req = opts.req || false, hint = opts.hint || '', sap = opts.sap || '', ai = opts.ai || false;
            var ph = opts.ph || '', sel = opts.opts || [], rows = opts.rows || 3, max = opts.max || 0, val = opts.val || '';
            var actualVal = data[id] || val;
            var reqS = req ? '<span class="req">*</span>' : '';
            var aiS = ai ? '<span class="ai-chip">AI</span>' : '';
            var sapS = sap ? '<span class="sap-chip">' + sap + '</span>' : '';
            var inp = '';
            if (type === 'select') {
                var so = sel.map(function (o) {
                    if (typeof o === 'string') return '<option ' + (o === actualVal ? 'selected' : '') + '>' + o + '</option>';
                    return '<option value="' + o.v + '" ' + (o.v === actualVal || o.l === actualVal ? 'selected' : '') + '>' + o.l + '</option>';
                }).join('');
                inp = '<select id="' + id + '"><option value="">\u2014 Select \u2014</option>' + so + '</select>';
            } else if (type === 'textarea') {
                inp = '<textarea id="' + id + '" rows="' + rows + '" placeholder="' + ph + '">' + actualVal + '</textarea>';
            } else {
                var mc = max ? 'data-max="' + max + '"' : '';
                inp = '<input type="' + type + '" id="' + id + '" placeholder="' + ph + '" value="' + actualVal + '" ' + mc + '>';
            }
            var cc = max ? '<div class="cc" id="' + id + '-cc">0/' + max + '</div>' : '';
            var aiBlock = ai ? '<div class="ai-sug" id="' + id + '-sug" style="display:none"><span>\uD83E\uDD16</span><span class="ai-sug-text">Suggestion: <strong id="' + id + '-ai-val">analysing\u2026</strong></span><button class="ai-apply" data-field="' + id + '">Apply</button></div>' : '';
            return '<div class="fg">' +
                '<label class="fl" for="' + id + '">' + label + ' ' + reqS + ' ' + aiS + ' ' + sapS + '</label>' +
                inp + cc +
                (hint ? '<div class="hint">' + hint + '</div>' : '') +
                '<div class="ferr" id="' + id + '-err">This field is required.</div>' +
                aiBlock +
                '</div>';
        },

        _matStep0: function () {
            return '<div class="form-card"><div class="fc-title">\uD83D\uDCE6 Basic Information</div><div class="g2">' +
                this._F('mat_maktx', 'Material Description (Short Text)', 'text', { req: true, sap: 'MAKT.MAKTX', ai: true, ph: 'Max 40 characters', max: 40, hint: 'SAP short text: 40 chars. AI normalises free text to canonical form.' }) +
                this._F('mat_mtart', 'Material Type', 'select', { req: true, sap: 'MARA.MTART', opts: [{ v: 'ROH', l: 'ROH \u2014 Raw Material' }, { v: 'HALB', l: 'HALB \u2014 Semi-finished' }, { v: 'FERT', l: 'FERT \u2014 Finished Product' }, { v: 'HIBE', l: 'HIBE \u2014 Operating Supplies' }, { v: 'VERP', l: 'VERP \u2014 Packaging Material' }, { v: 'DIEN', l: 'DIEN \u2014 Service' }, { v: 'NLAG', l: 'NLAG \u2014 Non-stock Material' }] }) +
                this._F('mat_mbrsh', 'Industry Sector', 'select', { req: true, sap: 'MARA.MBRSH', opts: [{ v: 'M', l: 'M \u2014 Mechanical Engineering' }, { v: 'E', l: 'E \u2014 Electrical / Electronics' }, { v: 'C', l: 'C \u2014 Chemical Industry' }, { v: 'A', l: 'A \u2014 Automotive' }, { v: 'P', l: 'P \u2014 Pharmaceuticals' }, { v: 'O', l: 'O \u2014 Oil & Gas' }, { v: 'B', l: 'B \u2014 Plant Engineering' }] }) +
                this._F('mat_matkl', 'Material Group', 'select', { req: true, sap: 'MARA.MATKL', hint: 'Determines account assignment and procurement categories.', opts: ['001 \u2014 Raw Materials', '002 \u2014 Mechanical Components', '003 \u2014 Electrical Components', '004 \u2014 Consumables & MRO', '005 \u2014 Packaging Materials', '006 \u2014 Semi-finished Goods', '007 \u2014 Finished Products', '008 \u2014 Services / Subcontracting'] }) +
                this._F('mat_meins', 'Base Unit of Measure', 'select', { req: true, sap: 'MARA.MEINS', ai: true, opts: [{ v: 'KG', l: 'KG \u2014 Kilogram' }, { v: 'G', l: 'G \u2014 Gram' }, { v: 'L', l: 'L \u2014 Litre' }, { v: 'ML', l: 'ML \u2014 Millilitre' }, { v: 'PC', l: 'PC \u2014 Piece' }, { v: 'EA', l: 'EA \u2014 Each' }, { v: 'M', l: 'M \u2014 Metre' }, { v: 'M2', l: 'M2 \u2014 Square Metre' }, { v: 'M3', l: 'M3 \u2014 Cubic Metre' }, { v: 'MT', l: 'MT \u2014 Metric Ton' }, { v: 'FT', l: 'FT \u2014 Foot' }, { v: 'IN', l: 'IN \u2014 Inch' }, { v: 'BOX', l: 'BOX \u2014 Box' }, { v: 'ROL', l: 'ROL \u2014 Roll' }, { v: 'PAK', l: 'PAK \u2014 Pack' }] }) +
                this._F('mat_spras', 'Language', 'select', { req: true, sap: 'MAKT.SPRAS', opts: [{ v: 'EN', l: 'EN \u2014 English' }, { v: 'DE', l: 'DE \u2014 German' }, { v: 'FR', l: 'FR \u2014 French' }, { v: 'HI', l: 'HI \u2014 Hindi' }, { v: 'ZH', l: 'ZH \u2014 Chinese' }, { v: 'AR', l: 'AR \u2014 Arabic' }] }) +
                '<div class="fg full">' + this._F('mat_long', 'Long Description', 'textarea', { rows: 3, sap: '\u2014', ph: 'Detailed description for AI processing, catalogue matching, and deduplication\u2026', hint: 'Used by AI for vector similarity deduplication. More detail = better duplicate detection.' }) + '</div>' +
                this._F('mat_unspsc', 'UNSPSC Code', 'text', { sap: 'MARA.UNSPSC', ai: true, ph: 'e.g. 40141700', hint: 'AI auto-maps material description to UNSPSC commodity taxonomy.' }) +
                '</div></div>';
        },

        _matStep1: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFF7\uFE0F Classification & Physical Data</div><div class="g2">' +
                this._F('mat_bismt', 'Old / Legacy Material Number', 'text', { sap: 'MARA.BISMT', ph: 'Previous or customer material reference', hint: 'Used for migration and cross-reference matching.' }) +
                this._F('mat_ean11', 'EAN / UPC Barcode', 'text', { sap: 'MEAN.EAN11', ph: '13-digit EAN or 12-digit UPC' }) +
                this._F('mat_ntgew', 'Net Weight', 'number', { sap: 'MARA.NTGEW', ph: '0.000' }) +
                this._F('mat_brgew', 'Gross Weight', 'number', { sap: 'MARA.BRGEW', ph: '0.000' }) +
                this._F('mat_gewei', 'Weight Unit', 'select', { sap: 'MARA.GEWEI', opts: [{ v: 'KG', l: 'KG \u2014 Kilogram' }, { v: 'G', l: 'G \u2014 Gram' }, { v: 'LB', l: 'LB \u2014 Pound' }, { v: 'MT', l: 'MT \u2014 Metric Ton' }] }) +
                this._F('mat_volum', 'Volume', 'number', { sap: 'MARA.VOLUM', ph: '0.000' }) +
                this._F('mat_voleh', 'Volume Unit', 'select', { sap: 'MARA.VOLEH', opts: [{ v: 'L', l: 'L \u2014 Litre' }, { v: 'ML', l: 'ML \u2014 Millilitre' }, { v: 'M3', l: 'M3 \u2014 Cubic Metre' }, { v: 'FT3', l: 'FT3 \u2014 Cubic Foot' }] }) +
                this._F('mat_prdha', 'Product Hierarchy', 'text', { sap: 'MARA.PRDHA', ph: 'e.g. 00100002000300', max: 18, hint: 'Sales product hierarchy \u2014 up to 18 chars, 3 levels.' }) +
                '</div></div>' +
                '<div class="form-card"><div class="fc-title">\u2194\uFE0F Alternative Unit of Measure Conversion</div><div class="g3">' +
                this._F('mat_alt_uom', 'Alternative UoM', 'select', { sap: 'MARM.UMRES', opts: ['KG', 'G', 'L', 'PC', 'EA', 'M', 'M2', 'BOX', 'ROL', 'PAK', 'BT', 'FT', 'IN'] }) +
                this._F('mat_umrez', 'Numerator', 'number', { sap: 'MARM.UMREZ', ph: '1', hint: 'Alt UoM quantity' }) +
                this._F('mat_umren', 'Denominator', 'number', { sap: 'MARM.UMREN', ph: '1', hint: 'Base UoM quantity' }) +
                '</div></div>';
        },

        _matStep2: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFED Organisational Assignment</div><div class="g2">' +
                this._F('mat_werks', 'Plant', 'select', { req: true, sap: 'MARC.WERKS', hint: 'Plant where this material will be stocked / used.', opts: ['1000 \u2014 Main Plant', '1100 \u2014 Plant North', '1200 \u2014 Plant South', '2000 \u2014 Warehouse Central', '3000 \u2014 Distribution Centre'] }) +
                this._F('mat_lgort', 'Default Storage Location', 'select', { sap: 'MARD.LGORT', opts: ['0001 \u2014 General Store', '0002 \u2014 Production Store', '0003 \u2014 Finished Goods', '0010 \u2014 Raw Material Store', '0020 \u2014 Packaging Store', 'BLOC \u2014 Blocked Stock'] }) +
                this._F('mat_dismm', 'MRP Type', 'select', { req: true, sap: 'MARC.DISMM', hint: 'Controls how MRP calculates requirements.', opts: [{ v: 'PD', l: 'PD \u2014 Deterministic MRP' }, { v: 'VB', l: 'VB \u2014 Reorder Point (Manual)' }, { v: 'VM', l: 'VM \u2014 Reorder Point (Auto)' }, { v: 'ND', l: 'ND \u2014 No MRP Planning' }, { v: 'M0', l: 'M0 \u2014 Manual Reorder' }] }) +
                this._F('mat_beskz', 'Procurement Type', 'select', { req: true, sap: 'MARC.BESKZ', opts: [{ v: 'E', l: 'E \u2014 In-house Production' }, { v: 'F', l: 'F \u2014 External Procurement' }, { v: 'X', l: 'X \u2014 Both Allowed' }] }) +
                this._F('mat_plifz', 'Planned Delivery Time (days)', 'number', { sap: 'MARC.PLIFZ', ph: '0', hint: 'Lead time from PO placement to GR.' }) +
                this._F('mat_minbe', 'Reorder / Safety Stock Level', 'number', { sap: 'MARC.MINBE', ph: '0' }) +
                this._F('mat_mtvfp', 'Availability Checking Group', 'select', { sap: 'MARC.MTVFP', opts: ['01 \u2014 Daily Requirements', '02 \u2014 Individual Requirements', 'KP \u2014 No Check'] }) +
                this._F('mat_bklas', 'Valuation Class', 'select', { req: true, sap: 'MBEW.BKLAS', hint: 'Determines G/L accounts in automatic account determination.', opts: ['3000 \u2014 Raw Materials', '7900 \u2014 Finished Products', '7920 \u2014 Semi-finished Products', '3030 \u2014 Operating Supplies', '3100 \u2014 Packaging'] }) +
                '</div></div>';
        },

        _matStep3: function () {
            return '<div class="form-card"><div class="fc-title">\uD83D\uDED2 Purchasing Data</div><div class="g2">' +
                this._F('mat_ekgrp', 'Purchasing Group', 'select', { req: true, sap: 'MARC.EKGRP', opts: ['001 \u2014 General Purchasing', '002 \u2014 Raw Materials Buyer', '003 \u2014 MRO & Indirect', '004 \u2014 Capital Equipment', '005 \u2014 Services'] }) +
                this._F('mat_mfrpn', 'Manufacturer Part Number', 'text', { sap: 'MARA.MFRPN', ph: 'OEM / manufacturer part no.', hint: 'Used for supplier catalogue matching.' }) +
                this._F('mat_mfrnr', 'Manufacturer Name / BP', 'text', { sap: 'MARA.MFRNR', ph: 'Manufacturer name or SAP BP number' }) +
                this._F('mat_webaz', 'GR Processing Time (days)', 'number', { sap: 'MARC.WEBAZ', ph: '0', hint: 'Days required after GR before material is available.' }) +
                '</div></div>' +
                '<div class="form-card"><div class="fc-title">\uD83D\uDCB0 Costing & Accounting</div><div class="g2">' +
                this._F('mat_vprsv', 'Price Control', 'select', { req: true, sap: 'MBEW.VPRSV', opts: [{ v: 'S', l: 'S \u2014 Standard Price' }, { v: 'V', l: 'V \u2014 Moving Average Price' }] }) +
                this._F('mat_stprs', 'Standard Price / Initial MAP', 'number', { req: true, sap: 'MBEW.STPRS', ph: '0.00', hint: 'Standard price (for S) or initial moving average (for V).' }) +
                this._F('mat_waers', 'Currency', 'select', { req: true, sap: 'MBEW.WAERS', opts: ['INR \u2014 Indian Rupee', 'USD \u2014 US Dollar', 'EUR \u2014 Euro', 'GBP \u2014 British Pound', 'AED \u2014 UAE Dirham'] }) +
                this._F('mat_peinh', 'Price Unit', 'number', { sap: 'MBEW.PEINH', ph: '1', hint: 'Quantity base to which price applies.' }) +
                '</div></div>' +
                '<div class="form-card"><div class="fc-title">\uD83D\uDCCE Justification & References</div><div class="g2">' +
                '<div class="fg full">' + this._F('mat_just', 'Business Justification', 'textarea', { req: true, rows: 3, ph: 'Why is this material being created? New project, new supplier, new product line\u2026', hint: 'Required for manager approval \u2014 be specific about business need.' }) + '</div>' +
                this._F('mat_refdoc', 'Reference Drawing / Spec Number', 'text', { ph: 'Technical drawing, datasheet, or spec reference no.' }) +
                '</div></div>';
        },

        _bpTaxLookup: function () {
            var gstin = data.bp_gstin || '';
            var country = data.bp_tax_country || 'IN';
            var done = data.bp_lookup_done;
            var countriesHtml = LK_COUNTRIES.map(function (c) {
                return '<div class="lk-country-card' + (c.code === country ? ' active' : '') + '" data-country="' + c.code + '">' +
                    '<img class="lk-flag" src="' + c.flag + '" alt="' + c.name + '" loading="lazy">' +
                    '<span class="lk-cname">' + c.name + '</span>' +
                    '<span class="lk-ctype">' + c.type + '</span></div>';
            }).join('');
            return '<div class="lk-wrap">' +
                '<div class="lk-wrap-title"><span class="lk-icon">\uD83D\uDD0D</span><h2>Smart BP Lookup \u2014 Auto-fill from Tax ID</h2></div>' +
                '<p class="lk-wrap-sub">Enter a GSTIN, VAT Number, or Tax Registration Number to auto-populate the Business Partner form from official government / registry APIs</p>' +
                '<hr class="lk-divider">' +
                '<div class="lk-section-label"><span class="lk-num">\u2460</span> Select Country</div>' +
                '<div class="lk-countries" id="lk-countries">' + countriesHtml + '</div>' +
                '<div class="lk-section-label"><span class="lk-num">\u2461</span> Enter Tax / Registration Number</div>' +
                '<div class="lk-input-box">' +
                '<div class="lk-input-box-title"><span id="lk-input-label">' + LK_LABELS[country] + '</span><span class="lk-india-badge" id="lk-india-badge">' + (LK_BADGE_FLAGS[country] || '') + ' ' + (LK_BADGE_NAMES[country] || '') + '</span></div>' +
                '<div class="lk-input-row">' +
                '<input type="text" id="bp_gstin" placeholder="' + LK_PLACEHOLDERS[country] + '" value="' + gstin + '" style="text-transform:uppercase;" autocomplete="off">' +
                '<button class="btn-lookup" id="btn-lookup"' + (done ? ' disabled' : '') + '>' + (done ? '\u2705 Looked Up' : '\uD83D\uDD0D Lookup') + '</button>' +
                '</div>' +
                '<div class="lk-format-hint" id="lk-format-hint">' + LK_FORMAT_HINTS[country] + '</div>' +
                '<div class="ferr" id="bp_gstin_err">Please enter a valid tax registration number for the selected country.</div>' +
                '</div>' +
                '<div class="lk-status' + (done ? ' success show' : '') + '" id="lk-status">' + (done ? '\u2705 Tax registration validated successfully \u2014 fields have been pre-filled below.' : '') + '</div>' +
                (done ? this._renderLookupResults() : '') +
                '<div class="lk-loading-panel" id="lk-loading-panel">' +
                '<div class="lk-loading-inner"><div class="lk-spinner" id="lk-spinner"></div>' +
                '<div class="lk-popup-title" id="lk-popup-title">Querying official registry APIs\u2026</div>' +
                '<ul class="lk-step-list" id="lk-step-list">' +
                '<li id="lks-0" class="pending"><span class="lk-step-icon">\u25CB</span> Validating ' + (country === 'IN' ? 'GSTIN' : country === 'EU' ? 'VAT Number' : country === 'UK' ? 'VAT/Company Number' : country === 'AE' ? 'TRN' : 'UEN') + ' format &amp; checksum</li>' +
                '<li id="lks-1" class="pending"><span class="lk-step-icon">\u25CB</span> Calling ' + (country === 'IN' ? 'GST Portal API (api.gst.gov.in)' : country === 'EU' ? 'VIES EU VAT API' : country === 'UK' ? 'HMRC Companies House API' : country === 'AE' ? 'UAE FTA TRN API' : 'ACRA Singapore API') + '</li>' +
                '<li id="lks-2" class="pending"><span class="lk-step-icon">\u25CB</span> Fetching ' + (country === 'IN' ? 'PAN details from GSTIN' : 'company name &amp; address') + '</li>' +
                '<li id="lks-3" class="pending"><span class="lk-step-icon">\u25CB</span> Mapping address to SAP format</li>' +
                '<li id="lks-4" class="pending"><span class="lk-step-icon">\u25CB</span> Checking for existing BP records</li>' +
                '<li id="lks-5" class="pending"><span class="lk-step-icon">\u25CB</span> AI confidence scoring</li>' +
                '</ul></div></div></div>';
        },

        _renderLookupResults: function () {
            var rows = [
                ['Organisation Name', data.bp_name1 || '\u2014'],
                ['Trade / Legal Name', data.bp_sortl || '\u2014'],
                ['GST / VAT Number', data.bp_stceg || '\u2014'],
                ['Street Name', data.bp_stras || '\u2014'],
                ['House / Building No.', data.bp_hsnmr || '\u2014'],
                ['City', data.bp_ort01 || '\u2014'],
                ['State / Region', data.bp_regio || '\u2014'],
                ['Postal Code', data.bp_pstlz || '\u2014'],
                ['Country', data.bp_land1 || '\u2014']
            ].map(function (r) {
                return '<tr><td>' + r[0] + '</td><td>' + r[1] + '<span class="lk-mapped-badge">\u2713 Auto-mapped</span></td></tr>';
            }).join('');
            return '<div class="lk-results show" id="lk-results"><h4>\u2705 Pre-filled Fields</h4><table class="lk-results-tbl">' + rows + '</table><div class="lk-auto-fill-msg">\uD83D\uDCCB These values have been saved and will appear in the subsequent form steps. You can edit them when you reach each section.</div></div>';
        },

        _selectTaxCountry: function (code) {
            data.bp_tax_country = code;
            data.bp_lookup_done = false;
            var ct = document.getElementById('lk-countries');
            if (ct) ct.querySelectorAll('.lk-country-card').forEach(function (b) { b.classList.toggle('active', b.dataset.country === code); });
            var hint = document.getElementById('lk-format-hint');
            if (hint) hint.innerHTML = LK_FORMAT_HINTS[code] || '';
            var lbl = document.getElementById('lk-input-label');
            if (lbl) lbl.textContent = LK_LABELS[code] || '';
            var badge = document.getElementById('lk-india-badge');
            if (badge) badge.textContent = (LK_BADGE_FLAGS[code] || '') + ' ' + (LK_BADGE_NAMES[code] || '');
            var inp = document.getElementById('bp_gstin');
            if (inp) { inp.value = ''; inp.placeholder = LK_PLACEHOLDERS[code] || ''; inp.classList.remove('err'); }
            var btn = document.getElementById('btn-lookup');
            if (btn) { btn.disabled = false; btn.textContent = '\uD83D\uDD0D Lookup'; }
            var errEl = document.getElementById('bp_gstin_err');
            if (errEl) errEl.classList.remove('show');
            var status = document.getElementById('lk-status');
            if (status) status.classList.remove('show', 'error', 'success');
            var results = document.getElementById('lk-results');
            if (results) results.classList.remove('show');
        },

        _handleTaxLookup: function () {
            var self = this;
            var inp = document.getElementById('bp_gstin');
            var errEl = document.getElementById('bp_gstin_err');
            var btn = document.getElementById('btn-lookup');
            var status = document.getElementById('lk-status');
            var country = data.bp_tax_country || 'IN';
            if (!inp || !inp.value.trim()) {
                if (inp) inp.classList.add('err');
                if (errEl) { errEl.textContent = 'Please enter a valid tax registration number for the selected country.'; errEl.classList.add('show'); }
                return;
            }
            inp.classList.remove('err');
            if (errEl) errEl.classList.remove('show');
            var gstin = inp.value.trim().toUpperCase();
            if (country === 'IN' && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/.test(gstin)) {
                inp.classList.add('err');
                if (errEl) { errEl.textContent = 'Invalid GSTIN format. Expected: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + Z + 1 alphanumeric'; errEl.classList.add('show'); }
                return;
            }
            btn.disabled = true;
            var overlay = document.getElementById('lk-loading-panel');
            if (overlay) overlay.classList.add('show');
            var stepIdx = 0;
            function tickStep() {
                if (stepIdx > 0) {
                    var prev = document.getElementById('lks-' + (stepIdx - 1));
                    if (prev) { prev.classList.remove('spinning'); prev.classList.add('done'); if (prev.querySelector('.lk-step-icon')) prev.querySelector('.lk-step-icon').textContent = '\u2713'; }
                }
                if (stepIdx < 6) {
                    var cur = document.getElementById('lks-' + stepIdx);
                    if (cur) { cur.classList.remove('pending'); cur.classList.add('spinning'); if (cur.querySelector('.lk-step-icon')) cur.querySelector('.lk-step-icon').textContent = '\u21BB'; }
                    stepIdx++;
                }
            }
            tickStep();
            var stepTimer = setInterval(function () {
                if (stepIdx <= 6) tickStep();
                else clearInterval(stepTimer);
            }, 380);
            fetch(getApiBase() + '/api/tax-lookup?gstin=' + encodeURIComponent(gstin), { credentials: "include" })
                .then(function (r) { if (!r.ok) throw new Error('Lookup failed'); return r.json(); })
                .then(function (res) {
                    clearInterval(stepTimer);
                    for (var i = stepIdx - 1; i < 6; i++) {
                        var el = document.getElementById('lks-' + i);
                        if (el) { el.classList.remove('pending', 'spinning'); el.classList.add('done'); if (el.querySelector('.lk-step-icon')) el.querySelector('.lk-step-icon').textContent = '\u2713'; }
                    }
                    if (res.flag === false) throw new Error(res.message || 'GSTIN not found');
                    var d = res.data || {};
                    var addr = d.pradr && d.pradr.addr || {};
                    data.bp_gstin = gstin;
                    data.bp_stceg = gstin;
                    data.bp_name1 = d.lgnm || '';
                    data.bp_sortl = d.tradeNam || d.lgnm || '';
                    data.bp_ort01 = addr.loc || '';
                    data.bp_stras = addr.st || '';
                    data.bp_hsnmr = addr.bnm || '';
                    data.bp_pstlz = addr.pncd || '';
                    data.bp_regio = d.pradr && d.pradr.stcd || addr.stcd || '';
                    var countryMap = { IN: 'IN \u2014 India', UK: 'GB \u2014 United Kingdom', AE: 'AE \u2014 UAE', SG: 'SG \u2014 Singapore' };
                    data.bp_land1 = countryMap[country] || '';
                    data.bp_lookup_done = true;
                    var title = document.getElementById('lk-popup-title');
                    if (title) title.textContent = '\u2705 Lookup complete!';
                    var spinner = document.getElementById('lk-spinner');
                    if (spinner) { spinner.style.borderTopColor = '#16a34a'; spinner.style.animation = 'none'; }
                    setTimeout(function () {
                        if (overlay) overlay.classList.remove('show');
                        status.className = 'lk-status success show';
                        status.textContent = '\u2705 Tax registration validated successfully \u2014 fields have been pre-filled below.';
                        btn.textContent = '\u2705 Looked Up';
                        var resultsDiv = document.getElementById('lk-results');
                        if (resultsDiv) {
                            resultsDiv.outerHTML = self._renderLookupResults();
                        } else {
                            document.querySelector('.lk-input-box').insertAdjacentHTML('afterend', self._renderLookupResults());
                        }
                    }, 700);
                })
                .catch(function (err) {
                    clearInterval(stepTimer);
                    console.warn('Tax lookup failed:', err);
                    if (overlay) overlay.classList.remove('show');
                    status.className = 'lk-status error show';
                    status.textContent = '\u274C Lookup failed. Please check the number and try again, or enter details manually.';
                    btn.disabled = false;
                    btn.textContent = '\uD83D\uDD0D Retry Lookup';
                });
        },

        _bpStep0: function () {
            return '<div class="form-card"><div class="fc-title">\uD83E\uDD1D BP Role & Identity</div><div class="g2">' +
                this._F('bp_role', 'BP Role', 'select', { req: true, sap: 'BUT100.RLTYP', hint: 'Determines which company code views and fields are shown.', opts: [{ v: 'CU', l: 'Customer Only (FI-AR)' }, { v: 'VE', l: 'Vendor / Supplier Only (FI-AP)' }, { v: 'BOTH', l: 'Customer & Vendor (Combined)' }, { v: 'GP', l: 'General Business Partner' }] }) +
                this._F('bp_group', 'BP Grouping / Account Group', 'select', { req: true, sap: 'BUT000.BU_GROUP', hint: 'Controls number range assignment and mandatory field logic.', opts: ['KUNA \u2014 Domestic Customer', 'KUNB \u2014 Foreign Customer', 'LIFA \u2014 Domestic Vendor', 'LIFB \u2014 Foreign Vendor', 'INTE \u2014 Intercompany Partner', 'BANK \u2014 Bank Master'] }) +
                this._F('bp_name1', 'Organisation Name \u2014 Line 1', 'text', { req: true, sap: 'KNA1.NAME1 / LFA1.NAME1', ph: 'Full legal company name', max: 40 }) +
                this._F('bp_name2', 'Organisation Name \u2014 Line 2', 'text', { sap: 'KNA1.NAME2 / LFA1.NAME2', ph: 'Trading name or continuation', max: 40 }) +
                this._F('bp_sortl', 'Search Term / Key', 'text', { req: true, sap: 'KNA1.SORTL', ph: 'Short key for matchcode search', max: 10, hint: 'Up to 10 chars \u2014 used in duplicate detection and lookups.' }) +
                this._F('bp_spras', 'Correspondence Language', 'select', { req: true, sap: 'KNA1.SPRAS', opts: [{ v: 'EN', l: 'EN \u2014 English' }, { v: 'DE', l: 'DE \u2014 German' }, { v: 'FR', l: 'FR \u2014 French' }, { v: 'HI', l: 'HI \u2014 Hindi' }, { v: 'AR', l: 'AR \u2014 Arabic' }] }) +
                this._F('bp_legal', 'Legal Form', 'select', { sap: 'BUT000.LEGAL_ENTY', opts: ['Private Limited Company', 'Public Limited Company', 'LLP \u2014 Limited Liability Partnership', 'Sole Proprietorship', 'Partnership Firm', 'Government Entity', 'Non-Profit / NGO', 'Trust'] }) +
                this._F('bp_brsch', 'Industry / Business Sector', 'select', { sap: 'KNA1.BRSCH', opts: ['Manufacturing', 'Trading & Distribution', 'Construction & EPC', 'IT & Technology', 'Healthcare & Pharma', 'Government & PSU', 'Financial Services', 'Oil, Gas & Energy', 'Retail & FMCG'] }) +
                '</div></div>';
        },

        _bpStep1: function () {
            return '<div class="form-card"><div class="fc-title">\uD83D\uDCCD Registered Address</div><div class="g2">' +
                this._F('bp_stras', 'Street / Road Name', 'text', { req: true, sap: 'ADRC.STREET', ph: 'Street / road name', max: 60 }) +
                this._F('bp_hsnmr', 'House / Building Number', 'text', { sap: 'ADRC.HOUSE_NUM1', ph: 'Building, plot, or house number', max: 10 }) +
                this._F('bp_pstlz', 'Postal / ZIP Code', 'text', { req: true, sap: 'ADRC.POST_CODE1', ph: '6-digit postal code', max: 10 }) +
                this._F('bp_ort01', 'City', 'text', { req: true, sap: 'ADRC.CITY1', ph: 'City name', max: 40 }) +
                this._F('bp_land1', 'Country', 'select', { req: true, sap: 'ADRC.COUNTRY', ai: true, opts: ['IN \u2014 India', 'US \u2014 United States', 'DE \u2014 Germany', 'GB \u2014 United Kingdom', 'AE \u2014 UAE', 'SG \u2014 Singapore', 'AU \u2014 Australia', 'CN \u2014 China', 'JP \u2014 Japan', 'FR \u2014 France'] }) +
                this._F('bp_regio', 'State / Region', 'select', { sap: 'ADRC.REGION', opts: ['MH \u2014 Maharashtra', 'KA \u2014 Karnataka', 'TN \u2014 Tamil Nadu', 'DL \u2014 Delhi NCT', 'GJ \u2014 Gujarat', 'RJ \u2014 Rajasthan', 'WB \u2014 West Bengal', 'TS \u2014 Telangana', 'AP \u2014 Andhra Pradesh', 'UP \u2014 Uttar Pradesh'] }) +
                this._F('bp_tel', 'Phone Number', 'text', { req: true, sap: 'ADR2.TEL_NUMBER', ph: '+91 XXXXX XXXXX', max: 30 }) +
                this._F('bp_email', 'Email Address', 'text', { req: true, sap: 'ADR6.SMTP_ADDR', ph: 'contact@company.com', hint: 'Primary business email for order confirmations and invoices.' }) +
                this._F('bp_fax', 'Fax Number', 'text', { sap: 'ADR3.FAX_NUMBER', ph: '+91 XXXXX XXXXX (optional)', max: 30 }) +
                this._F('bp_url', 'Website', 'text', { sap: 'ADRC.URL', ph: 'https://www.company.com' }) +
                '</div></div>';
        },

        _bpStep2: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFDB\uFE0F Tax & Legal Information</div><div class="g2">' +
                this._F('bp_stceg', 'GST / VAT Registration Number', 'text', { req: true, sap: 'KNA1.STCEG / LFA1.STCEG', ph: '15-digit GSTIN (India) or VAT Reg. No.', max: 20, hint: 'Validated against GSTIN registry if integration is active.' }) +
                this._F('bp_stcd1', 'Tax Number 1 (PAN)', 'text', { sap: 'KNA1.STCD1', ph: '10-character PAN (India)', max: 16, hint: 'Permanent Account Number \u2014 mandatory for TDS vendors.' }) +
                this._F('bp_stcd2', 'Tax Number 2 (TAN)', 'text', { sap: 'KNA1.STCD2', ph: '10-character TAN', max: 11 }) +
                this._F('bp_stcd3', 'Tax Number 3 (CIN)', 'text', { sap: 'KNA1.STCD3', ph: '21-character Company Identification No.', max: 21 }) +
                this._F('bp_taxkd', 'Tax Classification', 'select', { req: true, sap: 'KNA1.TAXKD', opts: [{ v: '0', l: '0 \u2014 Not Liable to Tax' }, { v: '1', l: '1 \u2014 Liable to Tax (Standard)' }, { v: '2', l: '2 \u2014 Tax Exempt' }, { v: '3', l: '3 \u2014 Zero Rated' }] }) +
                this._F('bp_msme', 'MSME Classification', 'select', { sap: '\u2014', hint: 'Mandatory for Indian vendors under MSME Act.', opts: ['Micro \u2014 < \u20B91 Cr turnover', 'Small \u2014 \u20B91\u201310 Cr turnover', 'Medium \u2014 \u20B910\u201350 Cr turnover', 'Large \u2014 > \u20B950 Cr turnover', 'Not Applicable'] }) +
                this._F('bp_wtxcd', 'Withholding Tax Type', 'select', { sap: 'WITH_ITEM.WT_WITHCD', opts: ['\u2014 None \u2014', 'S1 \u2014 194A: Bank Interest', 'S2 \u2014 194C: Contractor / Sub-contractor', 'S3 \u2014 194H: Commission & Brokerage', 'S4 \u2014 194I: Rent', 'S5 \u2014 194J: Professional / Technical Fees'] }) +
                this._F('bp_dunn', 'Dunning Procedure', 'select', { sap: 'KNB1.MAHNA', hint: 'Applicable for customers only.', opts: ['\u2014 None \u2014', 'Z001 \u2014 Standard Dunning', 'Z002 \u2014 Reminder Only', 'Z003 \u2014 Legal Action'] }) +
                '</div></div>';
        },

        _bpStep3: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFE6 Bank Account Details</div><div class="g2">' +
                this._F('bp_banks', 'Bank Country', 'select', { req: true, sap: 'BNKA.BANKS', opts: ['IN \u2014 India', 'US \u2014 United States', 'DE \u2014 Germany', 'GB \u2014 United Kingdom', 'AE \u2014 UAE', 'SG \u2014 Singapore', 'AU \u2014 Australia'] }) +
                this._F('bp_bankl', 'Bank Key / IFSC Code', 'text', { req: true, sap: 'BNKA.BANKL', ph: '11-character IFSC (India) or Swift/Routing code', max: 15, hint: 'Must be a valid bank key in SAP bank directory.' }) +
                this._F('bp_bankn', 'Bank Account Number', 'text', { req: true, sap: 'KNBK.BANKN / LFBK.BANKN', ph: 'Beneficiary account number', max: 18 }) +
                this._F('bp_iban', 'IBAN', 'text', { sap: 'KNBK.IBAN', ph: 'International Bank Account Number (for cross-border payments)', max: 34 }) +
                this._F('bp_koinh', 'Account Holder Name', 'text', { req: true, sap: 'KNBK.KOINH', ph: 'Name exactly as registered with the bank', max: 60 }) +
                this._F('bp_bkont', 'Account Type', 'select', { sap: 'KNBK.BKONT', opts: [{ v: '00', l: 'Current / Checking Account' }, { v: '01', l: 'Savings Account' }, { v: '02', l: 'Cash Credit / Overdraft' }] }) +
                '</div></div>';
        },

        _bpStep4: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFE2 Company Code Assignment</div><div class="g2">' +
                this._F('bp_bukrs', 'Company Code', 'select', { req: true, sap: 'KNB1.BUKRS / LFB1.BUKRS', opts: ['1000 \u2014 TEPL India HQ', '2000 \u2014 TEPL Manufacturing Division', '3000 \u2014 TEPL Middle East FZE'] }) +
                this._F('bp_akont', 'Reconciliation Account (G/L)', 'text', { req: true, sap: 'KNB1.AKONT / LFB1.AKONT', ph: 'G/L account number (must exist in CoA)', max: 10, hint: 'Must be a reconciliation account in the chart of accounts.' }) +
                this._F('bp_zterm', 'Payment Terms', 'select', { req: true, sap: 'KNB1.ZTERM / LFB1.ZTERM', opts: ['0001 \u2014 Immediate / Net', 'NT30 \u2014 Net 30 days', 'NT45 \u2014 Net 45 days', 'NT60 \u2014 Net 60 days', '2/10 \u2014 2% discount if paid in 10 days, Net 30', 'Z003 \u2014 100% Advance Payment Required'] }) +
                this._F('bp_zwels', 'Payment Method(s)', 'select', { sap: 'KNB1.ZWELS', opts: ['C \u2014 Cheque', 'T \u2014 NEFT / Bank Transfer', 'I \u2014 IMPS', 'R \u2014 RTGS', 'D \u2014 Demand Draft', 'P \u2014 Payment Advice'] }) +
                this._F('bp_klimk', 'Credit Limit (Customers only)', 'number', { sap: 'KNB1.KLIMK', ph: '0.00', hint: 'Maximum open credit in company code currency.' }) +
                this._F('bp_zuawa', 'Alternative Payer / Payee BP', 'text', { sap: 'KNB1.ZUAWA', ph: 'BP number if payments route through a different entity' }) +
                '</div></div>' +
                '<div class="form-card"><div class="fc-title">\uD83D\uDCCE Justification & Compliance</div><div class="g2">' +
                '<div class="fg full">' + this._F('bp_just', 'Business Justification', 'textarea', { req: true, rows: 3, ph: 'Why is this Business Partner being created? What is the trade/commercial relationship?', hint: 'Required for manager approval and audit trail.' }) + '</div>' +
                this._F('bp_cert', 'Compliance Documents Available', 'select', { opts: ['\u2014 Select \u2014', 'GST Registration Certificate', 'PAN & Address Proof', 'MSME Certificate', 'Bank Cancelled Cheque', 'Vendor Qualification Form', 'All of the above'] }) +
                '</div></div>';
        },

        _prodStep0: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFED Basic Product Information</div><div class="g2">' +
                this._F('prod_maktx', 'Product Description (Short Text)', 'text', { req: true, sap: 'MAKT.MAKTX', ai: true, max: 40, ph: 'Max 40 characters', hint: 'AI standardises to canonical product name.' }) +
                this._F('prod_mtart', 'Material Type', 'select', { req: true, sap: 'MARA.MTART', opts: [{ v: 'FERT', l: 'FERT \u2014 Finished Product' }, { v: 'HALB', l: 'HALB \u2014 Semi-finished Product' }] }) +
                this._F('prod_mbrsh', 'Industry Sector', 'select', { req: true, sap: 'MARA.MBRSH', opts: [{ v: 'M', l: 'M \u2014 Mechanical' }, { v: 'E', l: 'E \u2014 Electrical' }, { v: 'C', l: 'C \u2014 Chemical' }, { v: 'P', l: 'P \u2014 Pharma / Life Sciences' }, { v: 'A', l: 'A \u2014 Automotive' }] }) +
                this._F('prod_matkl', 'Product Group', 'select', { req: true, sap: 'MARA.MATKL', opts: ['001 \u2014 Pumps & Fluid Systems', '002 \u2014 Electrical Equipment', '003 \u2014 Structural & Pressure Vessels', '004 \u2014 Chemical Process Equipment', '005 \u2014 Consumer Packaging', '006 \u2014 Electronic Assemblies'] }) +
                this._F('prod_meins', 'Base Unit of Measure', 'select', { req: true, sap: 'MARA.MEINS', opts: ['PC \u2014 Piece', 'EA \u2014 Each', 'KG \u2014 Kilogram', 'SET \u2014 Set', 'MT \u2014 Metric Ton', 'L \u2014 Litre', 'M \u2014 Metre'] }) +
                this._F('prod_unspsc', 'UNSPSC Code', 'text', { sap: '\u2014', ai: true, ph: 'e.g. 40161500', hint: 'Auto-mapped by AI to UNSPSC product taxonomy.' }) +
                '<div class="fg full">' + this._F('prod_long', 'Long Description', 'textarea', { rows: 3, ph: 'Detailed product description for AI processing, catalogue, and customer documentation\u2026' }) + '</div>' +
                '</div></div>';
        },

        _prodStep1: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFEA Sales Organisation Data</div><div class="g2">' +
                this._F('prod_vkorg', 'Sales Organisation', 'select', { req: true, sap: 'MVKE.VKORG', opts: ['1000 \u2014 TEPL Domestic Sales', '2000 \u2014 TEPL Export Division', '3000 \u2014 TEPL Middle East'] }) +
                this._F('prod_vtweg', 'Distribution Channel', 'select', { req: true, sap: 'MVKE.VTWEG', opts: ['10 \u2014 Direct / OEM Sales', '20 \u2014 Trade & Distribution', '30 \u2014 Project Supply', '40 \u2014 Spares & Aftermarket'] }) +
                this._F('prod_spart', 'Division', 'select', { req: true, sap: 'MVKE.SPART', opts: ['01 \u2014 Rotating Equipment', '02 \u2014 Electrical Products', '03 \u2014 Structural Fabrication', '04 \u2014 Process Equipment', '05 \u2014 Spares & Services'] }) +
                this._F('prod_dwerk', 'Delivering Plant', 'select', { req: true, sap: 'MVKE.DWERK', opts: ['1000 \u2014 Main Plant', '1100 \u2014 Plant North', '1200 \u2014 Plant South'] }) +
                this._F('prod_mvgr1', 'Material Pricing Group', 'select', { sap: 'MVKE.MVGR1', opts: ['A1 \u2014 Standard Catalogue', 'A2 \u2014 Customised / Engineered', 'A3 \u2014 Spare Parts', 'A4 \u2014 Service / Repair'] }) +
                this._F('prod_minbest', 'Minimum Order Quantity', 'number', { sap: 'MVKE.MINBEST', ph: '1' }) +
                this._F('prod_mstae', 'Cross-plant Material Status', 'select', { sap: 'MARA.MSTAE', opts: [{ v: '', l: '\u2014 No restriction \u2014' }, { v: 'Z1', l: 'Z1 \u2014 New (Pending Approval)' }, { v: 'Z2', l: 'Z2 \u2014 Phase-out Planned' }, { v: 'Z3', l: 'Z3 \u2014 Blocked for New Orders' }] }) +
                this._F('prod_taxm1', 'Tax Classification (Sales)', 'select', { sap: 'MVKE.TAXM1', opts: ['0 \u2014 Not Taxable', '1 \u2014 Full Tax', '2 \u2014 Reduced / Exempt'] }) +
                '</div></div>';
        },

        _prodStep2: function () {
            return '<div class="form-card"><div class="fc-title">\uD83D\uDCB0 Pricing & Revenue Accounting</div><div class="g2">' +
                this._F('prod_vprsv', 'Price Control', 'select', { req: true, sap: 'MBEW.VPRSV', opts: [{ v: 'S', l: 'S \u2014 Standard Price (for FERT/HALB)' }, { v: 'V', l: 'V \u2014 Moving Average Price' }] }) +
                this._F('prod_stprs', 'Standard Price', 'number', { req: true, sap: 'MBEW.STPRS', ph: '0.00' }) +
                this._F('prod_waers', 'Currency', 'select', { req: true, sap: 'MBEW.WAERS', opts: ['INR \u2014 Indian Rupee', 'USD \u2014 US Dollar', 'EUR \u2014 Euro'] }) +
                this._F('prod_peinh', 'Price Unit', 'number', { sap: 'MBEW.PEINH', ph: '1' }) +
                this._F('prod_prdha', 'Product Hierarchy', 'text', { sap: 'MARA.PRDHA', ph: 'Product hierarchy code (up to 18 chars)', max: 18, hint: 'Used for sales analysis and pricing conditions.' }) +
                this._F('prod_ktgrm', 'Account Assignment Group', 'select', { req: true, sap: 'MVKE.KTGRM', hint: 'Determines revenue G/L accounts in billing.', opts: ['01 \u2014 Domestic Product Revenue', '02 \u2014 Export Revenue', '03 \u2014 Service Revenue'] }) +
                '</div></div>';
        },

        _prodStep3: function () {
            return '<div class="form-card"><div class="fc-title">\u2699\uFE0F MRP & BOM Configuration</div><div class="g2">' +
                this._F('prod_werks', 'Production Plant', 'select', { req: true, sap: 'MARC.WERKS', opts: ['1000 \u2014 Main Plant', '1100 \u2014 Plant North', '1200 \u2014 Plant South'] }) +
                this._F('prod_dismm', 'MRP Type', 'select', { req: true, sap: 'MARC.DISMM', opts: [{ v: 'PD', l: 'PD \u2014 Deterministic MRP' }, { v: 'VB', l: 'VB \u2014 Reorder Point' }, { v: 'ND', l: 'ND \u2014 No MRP' }] }) +
                this._F('prod_dzeit', 'In-house Production Time (days)', 'number', { sap: 'MARC.DZEIT', ph: '0', hint: 'Lead time for internal manufacture.' }) +
                this._F('prod_mtvfp', 'Availability Check', 'select', { sap: 'MARC.MTVFP', opts: ['01 \u2014 Daily Requirements', '02 \u2014 Individual Requirements', 'KP \u2014 No Check'] }) +
                this._F('prod_bom_rel', 'BOM Relevance', 'select', { sap: '\u2014', opts: ['New BOM to be created', 'Existing BOM \u2014 specify number below', 'No BOM required'] }) +
                this._F('prod_bom_no', 'Existing BOM Number', 'text', { sap: 'MAST.STLAN', ph: 'SAP BOM number if existing' }) +
                this._F('prod_bklas', 'Valuation Class', 'select', { req: true, sap: 'MBEW.BKLAS', opts: ['7900 \u2014 Finished Products', '7920 \u2014 Semi-finished Products'] }) +
                this._F('prod_profitctr', 'Profit Centre', 'text', { sap: 'MARC.PRCTR', ph: 'Profit centre code', hint: 'Used for segment reporting and margin analysis.' }) +
                '</div></div>' +
                '<div class="form-card"><div class="fc-title">\uD83D\uDCCE Justification</div><div class="fg">' + this._F('prod_just', 'Business Justification', 'textarea', { req: true, rows: 3, ph: 'New product launch, customer project, product extension\u2026', hint: 'Required for manager approval.' }) + '</div></div>';
        },

        _eqStep0: function () {
            return '<div class="form-card"><div class="fc-title">\u2699\uFE0F Equipment Basic Data</div><div class="g2">' +
                this._F('eq_eqktx', 'Equipment Description (Short Text)', 'text', { req: true, sap: 'EQUI.EQKTX', ai: true, max: 40, ph: 'Max 40 characters', hint: 'AI normalises to canonical manufacturer description.' }) +
                this._F('eq_eqtyp', 'Equipment Category', 'select', { req: true, sap: 'EQUI.EQTYP', opts: [{ v: 'M', l: 'M \u2014 Mechanical Equipment' }, { v: 'E', l: 'E \u2014 Electrical / Instrument' }, { v: 'P', l: 'P \u2014 Process Equipment' }, { v: 'V', l: 'V \u2014 Vehicle / Mobile Plant' }, { v: 'B', l: 'B \u2014 Building Infrastructure' }, { v: 'I', l: 'I \u2014 IT / Communication Equipment' }] }) +
                this._F('eq_typbz', 'Object Type', 'text', { sap: 'EQUI.TYPBZ', ph: 'Short object type identifier', max: 10 }) +
                this._F('eq_hersteller', 'Manufacturer', 'text', { req: true, sap: 'EQUI.HERSTELLER', ph: 'Manufacturer legal name', max: 30 }) +
                this._F('eq_herld', 'Country of Manufacture', 'select', { sap: 'EQUI.HERLD', opts: ['IN \u2014 India', 'DE \u2014 Germany', 'US \u2014 USA', 'JP \u2014 Japan', 'IT \u2014 Italy', 'CN \u2014 China', 'GB \u2014 UK'] }) +
                this._F('eq_typmuster', 'Model Number / Type Designation', 'text', { req: true, sap: 'EQUI.TYPMUSTER', ph: 'Manufacturer model or type number', max: 20 }) +
                this._F('eq_serge', 'Serial Number', 'text', { req: true, sap: 'EQUI.SERGE', ph: 'Unique manufacturer serial number', max: 30, hint: 'Used for warranty tracking and individual equipment identification.' }) +
                this._F('eq_baujj', 'Year of Construction', 'text', { sap: 'EQUI.BAUJJ', ph: 'YYYY', max: 4 }) +
                this._F('eq_inbdt', 'Start-up / Commissioning Date', 'text', { sap: 'EQUI.INBDT', ph: 'DD.MM.YYYY', hint: 'Date first put into operation.' }) +
                this._F('eq_ansdt', 'Acquisition / Purchase Date', 'text', { sap: 'EQUI.ANSDT', ph: 'DD.MM.YYYY' }) +
                '</div></div>';
        },

        _eqStep1: function () {
            return '<div class="form-card"><div class="fc-title">\uD83D\uDCCD Location & Organisational Assignment</div><div class="g2">' +
                this._F('eq_werks', 'Plant', 'select', { req: true, sap: 'ILOA.WERKS', opts: ['1000 \u2014 Main Plant', '1100 \u2014 Plant North', '1200 \u2014 Plant South', '2000 \u2014 Warehouse / Stores'] }) +
                this._F('eq_iwerk', 'Maintenance Planning Plant', 'select', { req: true, sap: 'EQUI.IWERK', opts: ['1000 \u2014 Main Plant', '1100 \u2014 Plant North', '1200 \u2014 Plant South'] }) +
                this._F('eq_tplnr', 'Functional Location', 'text', { sap: 'ILOA.TPLNR', ph: 'e.g. 1000-PP01-PUMP-001', max: 40, hint: 'Technical hierarchy position code from functional location master.' }) +
                this._F('eq_stort', 'Location Description', 'text', { sap: 'ILOA.STORT', ph: 'Building / bay / area description' }) +
                this._F('eq_beber', 'Plant Section', 'select', { sap: 'ILOA.BEBER', opts: ['PP01 \u2014 Production Line 1', 'PP02 \u2014 Production Line 2', 'UT01 \u2014 Utilities Block', 'MNT01 \u2014 Maintenance Bay', 'WH01 \u2014 Warehouse Area'] }) +
                this._F('eq_gewrk', 'Responsible Work Centre', 'select', { req: true, sap: 'ILOA.GEWRK', opts: ['MECH01 \u2014 Mechanical Workshop', 'ELEC01 \u2014 Electrical Team', 'INST01 \u2014 Instrumentation & Controls', 'PIPING \u2014 Piping & Valves', 'CIVIL01 \u2014 Civil Infrastructure'] }) +
                this._F('eq_kostl', 'Cost Centre', 'text', { req: true, sap: 'ILOA.KOSTL', ph: 'SAP cost centre code', max: 10, hint: 'Maintenance costs will be posted to this cost centre.' }) +
                this._F('eq_prctr', 'Profit Centre', 'text', { sap: 'ILOA.PRCTR', ph: 'Profit centre code (if applicable)', max: 10 }) +
                '</div></div>';
        },

        _eqStep2: function () {
            return '<div class="form-card"><div class="fc-title">\uD83C\uDFF7\uFE0F SAP Classification</div><div class="g2">' +
                this._F('eq_klart', 'Class Type', 'select', { req: true, sap: 'KLAH.KLART', opts: [{ v: '002', l: '002 \u2014 Equipment Class' }, { v: '300', l: '300 \u2014 Variant Configuration Class' }] }) +
                this._F('eq_class', 'Class Name', 'text', { req: true, sap: 'KSML.CLINT', ph: 'e.g. PUMP_CENTRIFUGAL', hint: 'SAP class name \u2014 must exist in classification system.' }) +
                '</div></div>' +
                '<div class="form-card"><div class="fc-title">\uD83D\uDCCA Technical Nameplate Data</div><div class="g3">' +
                this._F('eq_power', 'Rated Power (kW)', 'number', { ph: '0', hint: 'Nameplate rated power in kilowatts' }) +
                this._F('eq_voltage', 'Operating Voltage (V)', 'number', { ph: '415' }) +
                this._F('eq_phase', 'Phase', 'select', { opts: ['3-Phase', '1-Phase', 'DC'] }) +
                this._F('eq_freq', 'Frequency (Hz)', 'number', { ph: '50' }) +
                this._F('eq_flow', 'Flow Rate (m\u00B3/hr)', 'number', { ph: '0' }) +
                this._F('eq_pressure', 'Operating Pressure (bar)', 'number', { ph: '0' }) +
                this._F('eq_temp', 'Operating Temperature (\u00B0C)', 'number', { ph: '0' }) +
                this._F('eq_weight', 'Equipment Weight (kg)', 'number', { sap: 'EQUI.GEWGT', ph: '0' }) +
                this._F('eq_inv', 'Inventory / Asset Tag No.', 'text', { ph: 'Fixed asset register tag or inventory number' }) +
                '</div></div>' +
                '<div class="form-card"><div class="fc-title">\uD83D\uDCCE Justification & Documentation</div><div class="g2">' +
                '<div class="fg full">' + this._F('eq_just', 'Business Justification / Purpose', 'textarea', { req: true, rows: 3, ph: 'New installation, replacement of failed asset, relocation, project acquisition\u2026', hint: 'Required for manager approval and asset register.' }) + '</div>' +
                this._F('eq_doc', 'Technical Document / P&ID Reference', 'text', { ph: 'Drawing number, P&ID reference, datasheet number' }) +
                '</div></div>';
        },

        _reviewStep: function () {
            this._collect();
            var entries = Object.entries(data).filter(function (kv) { return kv[1] && kv[1] !== '\u2014 Select \u2014'; }).slice(0, 18);
            var rows = entries.map(function (kv) {
                var lbl = kv[0].replace(/^[^_]+_/, '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
                return '<tr><td>' + lbl + '</td><td>' + kv[1] + '</td></tr>';
            }).join('');
            return '<div class="form-card">' +
                '<div class="fc-title" style="color:var(--success);">\u2705 Review & Submit Request</div>' +
                '<p style="font-size:0.83rem;color:var(--text-muted);margin-bottom:16px;line-height:1.6;">Review the information below. On submission, this request goes to your <strong>Line Manager</strong> for approval, then to an <strong>MDM Steward</strong> for final review, before being automatically pushed to <strong>SAP</strong> via NavisMaster\'s Integration Suite connector.</p>' +
                '<div class="review-ai-box"><div style="display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.3rem;">\uD83E\uDD16</span><div style="flex:1;"><strong style="font-size:0.87rem;color:var(--primary);">NavisMaster AI \u2014 Pre-submission Check Complete</strong>' +
                '<p style="font-size:0.78rem;color:var(--text-muted);margin-top:3px;line-height:1.5;">\u2713 Fields normalised &nbsp;\u00B7&nbsp; \u2713 SAP format validated &nbsp;\u00B7&nbsp; \u2713 No duplicate found &nbsp;\u00B7&nbsp; \u2713 14/14 business rules passed</p>' +
                '<div style="margin-top:10px;"><div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">Record Confidence Score</div>' +
                '<div class="confidence-bar"><div class="confidence-fill" style="width:91%;"></div></div>' +
                '<div style="font-size:0.75rem;color:var(--success);font-weight:800;margin-top:4px;">91% \u2014 High Confidence \u00B7 Fast-track eligible</div></div></div></div></div>' +
                '<div class="review-section"><h3>Entered Data Summary</h3><table class="review-tbl">' + (rows || '<tr><td colspan="2" style="color:var(--text-muted);padding:12px;">No data entered \u2014 please go back and fill the form.</td></tr>') + '</table></div>' +
                '<div class="workflow-box"><div style="font-size:0.85rem;font-weight:800;color:#856404;margin-bottom:10px;">\uD83D\uDCCB Approval Workflow \u2014 What Happens Next</div>' +
                '<div class="wf-step"><div class="wf-num">1</div><div class="wf-text"><strong>Submitted</strong> \u2014 AI cleansing, rule validation &amp; duplicate check complete</div></div>' +
                '<div class="wf-step"><div class="wf-num">2</div><div class="wf-text"><strong>Manager Approval</strong> \u2014 your Line Manager receives an email + in-app notification (SLA: 2 business days)</div></div>' +
                '<div class="wf-step"><div class="wf-num">3</div><div class="wf-text"><strong>MDM Steward Review</strong> \u2014 data steward verifies Golden Record quality before SAP push</div></div>' +
                '<div class="wf-step"><div class="wf-num">4</div><div class="wf-text"><strong>SAP Push</strong> \u2014 NavisMaster Integration Suite connector creates the master in ECC / S4HANA automatically</div></div>' +
                '<div class="wf-step"><div class="wf-num">5</div><div class="wf-text"><strong>Confirmation</strong> \u2014 SAP material / BP number emailed to you with the Golden Record PDF</div></div></div>' +
                '</div>';
        },

        _validate: function () {
            if (master === 'bp' && step === 0) {
                if (!data.bp_lookup_done) {
                    var inp = document.getElementById('bp_gstin');
                    var errEl = document.getElementById('bp_gstin_err');
                    if (inp) inp.classList.add('err');
                    if (errEl) errEl.classList.add('show');
                    var firstErr = document.querySelector('.err');
                    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
                return true;
            }
            var ok = true;
            document.querySelectorAll('#form-content [id]').forEach(function (el) {
                var errEl = document.getElementById(el.id + '-err');
                var lbl = document.querySelector('label[for="' + el.id + '"]');
                var isReq = lbl && lbl.innerHTML.includes('class="req"');
                if (isReq && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) {
                    if (!el.value || el.value === '\u2014 Select \u2014') {
                        el.classList.add('err');
                        if (errEl) errEl.classList.add('show');
                        ok = false;
                    } else {
                        el.classList.remove('err');
                        if (errEl) errEl.classList.remove('show');
                    }
                }
            });
            if (!ok) {
                var firstErr = document.querySelector('.err');
                if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return ok;
        },

        _collect: function () {
            document.querySelectorAll('#form-content input,#form-content select,#form-content textarea').forEach(function (el) {
                if (el.id) data[el.id] = el.value;
            });
        },

        _initCharCounters: function () {
            document.querySelectorAll('[data-max]').forEach(function (el) {
                var cc = document.getElementById(el.id + '-cc');
                if (!cc) return;
                var max = parseInt(el.dataset.max);
                function upd() {
                    var n = el.value.length;
                    cc.textContent = n + '/' + max;
                    cc.className = 'cc' + (n > max * 0.85 ? ' warn' : '') + (n >= max ? ' over' : '');
                    if (n > max) el.value = el.value.slice(0, max);
                }
                el.addEventListener('input', upd);
                upd();
            });
        },

        _fireAI: function () {
            var sug = AI_SUGGESTIONS[master] || {};
            Object.entries(sug).forEach(function (entry) {
                var id = entry[0], val = entry[1];
                var valEl = document.getElementById(id + '-ai-val');
                var sugEl = document.getElementById(id + '-sug');
                if (valEl) { valEl.textContent = val; }
                if (sugEl) { sugEl.style.display = 'flex'; }
            });
        },

        _applyAI: function (id) {
            var valEl = document.getElementById(id + '-ai-val');
            var inp = document.getElementById(id);
            if (!valEl || !inp) return;
            inp.value = valEl.textContent;
            inp.dispatchEvent(new Event('input'));
            inp.style.borderColor = 'var(--ai-purple)';
            inp.style.boxShadow = '0 0 0 3px rgba(107,70,193,0.15)';
            setTimeout(function () { inp.style.borderColor = ''; inp.style.boxShadow = ''; }, 900);
        },

        _autoStart: function () {
            var type = null;
            // UI5 router navTo format: #/masterCreate/<type>
            var hash = window.location.hash;
            var routerMatch = hash.match(/[#/]masterCreate\/([^?&/]+)/i);
            if (routerMatch) {
                type = decodeURIComponent(routerMatch[1]);
            }
            // Legacy query string fallback: ?type=<type>
            if (!type) {
                if (hash && hash.indexOf('?') > -1) {
                    var qs = hash.substring(hash.indexOf('?') + 1);
                    if (qs.indexOf('&') > -1) qs = qs.split('&').filter(function (p) { return p.indexOf('type=') === 0; })[0] || qs;
                    if (qs.indexOf('=') > -1) type = decodeURIComponent(qs.split('=')[1]);
                }
                var params = new URLSearchParams(window.location.search);
                type = type || params.get('type');
            }
            var typeMap = { material: 'material', businesspartner: 'bp', bp: 'bp', product: 'product', equipment: 'equipment' };
            if (type && typeMap[type]) {
                this._startWiz(typeMap[type]);
            }
        },

        _fetchUser: function () {
            fetch(getApiBase() + "/odata/v4/dashboard/currentUser()", {
                headers: { "Accept": "application/json" },
                credentials: "include"
            })
                .then(function (res) { return res.ok ? res.json() : null; })
                .then(function (data) {
                    if (!data) return;
                    var av = document.getElementById("navisAvatar");
                    if (!av) return;
                    av.textContent = data.initials || "\u00B7\u00B7";
                    av.setAttribute("title", data.name || data.id || "");
                })
                .catch(function (err) { console.warn("currentUser load failed", err); });
        }

    });
});
