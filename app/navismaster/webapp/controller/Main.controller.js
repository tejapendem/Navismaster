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

            // User model — populated from /odata/v4/dashboard/currentUser()
            var oUserModel = new JSONModel({
                id: "", name: "", firstName: "there", initials: "··",
                today: this._formatToday(),
                greeting: this._greetingForHour(new Date().getHours())
            });
            this.getView().setModel(oUserModel, "user");

            // Wait for OData model metadata to be ready before calling functions
            var oModel = this.getView().getModel();
            if (oModel && oModel.attachMetadataLoaded) {
                oModel.attachMetadataLoaded(function () {
                    this._loadCurrentUser();
                }.bind(this));
            } else {
                this._loadCurrentUser();
            }

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

            // Manage Approval mock data
            var oApprovalData = {
                count: 6,
                items: [
                    { workflow: "Material Master Create",  level: "Level 1", name: "Rajesh Pendem",     requestor: "Saketh Reddy",   users: "Rajesh, Priya, Anil" },
                    { workflow: "Business Partner Create", level: "Level 1", name: "Priya Sharma",      requestor: "Vikram Singh",   users: "Priya, Rajesh, Meera" },
                    { workflow: "Vendor Onboarding",       level: "Level 1", name: "Amit Kumar",        requestor: "Sneha Patel",    users: "Amit, Rohit, Neha" },
                    { workflow: "Customer Extension",      level: "Level 1", name: "Sneha Gupta",       requestor: "Arun Nair",      users: "Sneha, Deepak, Kavya" },
                    { workflow: "Material Master Change",  level: "Level 1", name: "Vikram Joshi",      requestor: "Pooja Iyer",     users: "Vikram, Anita, Ravi" },
                    { workflow: "Supplier Classification", level: "Level 1", name: "Deepak Verma",      requestor: "Ananya Rao",     users: "Deepak, Suresh, Lata" }
                ]
            };
            var oApprovalModel = new JSONModel(oApprovalData);
            this.getView().setModel(oApprovalModel, "approval");
        },

        _formatToday: function () {
            var d = new Date();
            var weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            var months   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            return weekdays[d.getDay()] + " · " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
        },

        _greetingForHour: function (hour) {
            if (hour < 5)  { return "Good night"; }
            if (hour < 12) { return "Good morning"; }
            if (hour < 17) { return "Good afternoon"; }
            if (hour < 21) { return "Good evening"; }
            return "Good night";
        },

        _loadCurrentUser: function () {
            var oUserModel = this.getView().getModel("user");
            this._tryLoadUserOData(oUserModel) || this._tryLoadUserApi(oUserModel);
        },

        _applyUserData: function (oUserModel, data) {
            if (!data) { return; }
            var current = oUserModel.getData();
            oUserModel.setData({
                id:        data.id        || "",
                name:      data.name      || "",
                firstName: data.firstName || "there",
                initials:  data.initials  || "··",
                today:     current.today,
                greeting:  current.greeting
            });
        },

        _tryLoadUserOData: function (oUserModel) {
            var oModel = this.getView().getModel();
            if (!oModel || !oModel.callFunction) { return false; }
            var that = this;
            oModel.callFunction("currentUser", {})
                .then(function (oResult) {
                    var data = oResult && oResult.getObject ? oResult.getObject() : oResult;
                    that._applyUserData(oUserModel, data);
                })
                .catch(function () {
                    that._tryLoadUserApi(oUserModel);
                });
            return true;
        },

        _tryLoadUserApi: function (oUserModel) {
            var that = this;
            fetch("/api/user", {
                headers: { "Accept": "application/json" },
                credentials: "include"
            })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) { that._applyUserData(oUserModel, data); })
            .catch(function () { /* leave default "there" */ });
        },

        onAfterRendering: function () {
            var that = this;

            // Logo click → dashboard
            var oLogo = this.getView().byId("logoHeader");
            if (oLogo) {
                oLogo.attachBrowserEvent("click", this.onDashboardPress.bind(this));
            }

            // Pillar 1 click → dashboard
            var oPillarFoundation = this.getView().byId("pillarFoundation");
            if (oPillarFoundation) {
                oPillarFoundation.attachBrowserEvent("click", this.onDashboardPress.bind(this));
            }

            // HTML-rendered Steward Inbox tile → inbox view (attach via DOM)
            setTimeout(function () {
                var oTileEl = document.getElementById("stewardInboxTileHtml");
                if (oTileEl) {
                    oTileEl.addEventListener("click", function () {
                        that.onStewardInboxPress();
                    });
                }
                that._initDashboardAnimations();
            }, 50);
        },

        _initDashboardAnimations: function () {
            this._animateKpiCounters();
            this._animateKpiBars();
            this._enableTileTilt();
            this._enableCursorGlow();
            this._startLiveCountDrift();
            this._renderSparklines();
            this._enableClickRipples();
            this._startLiveClock();
            this._showWelcomeToast();
            this._enableSidebarCollapse();
            this._enableNotificationDropdown();
            this._enableDarkMode();
            this._enableMobileMenu();
            this._enableAIChatbot();
            this._startOnboardingTour();
        },

        _enableSidebarCollapse: function () {
            if (this._sidebarCollapseBound) { return; }
            this._sidebarCollapseBound = true;

            var sidebar = document.querySelector(".sidebar");
            if (!sidebar) { return; }

            var toggle = document.createElement("button");
            toggle.className = "sidebarToggle";
            toggle.setAttribute("aria-label", "Toggle sidebar");
            sidebar.appendChild(toggle);

            this._captureSidebarTooltips(sidebar);

            // Restore saved state before painting
            var saved = localStorage.getItem("navis_sidebar_collapsed");
            if (saved === "1") {
                sidebar.classList.add("sidebarCollapsed");
            }
            toggle.innerHTML = '<span class="sidebarToggleIcon">' + (sidebar.classList.contains("sidebarCollapsed") ? "›" : "‹") + '</span>';

            toggle.addEventListener("click", function () {
                var collapsed = sidebar.classList.toggle("sidebarCollapsed");
                toggle.querySelector(".sidebarToggleIcon").textContent = collapsed ? "›" : "‹";
                localStorage.setItem("navis_sidebar_collapsed", collapsed ? "1" : "0");
            });
        },

        _captureSidebarTooltips: function (sidebar) {
            // Pillar items
            sidebar.querySelectorAll(".pillarItem").forEach(function (el) {
                var name = el.querySelector(".pillarName");
                if (name) { el.setAttribute("title", name.textContent.trim()); }
            });
            // Workspace items
            sidebar.querySelectorAll(".wsItem").forEach(function (el) {
                var label = el.querySelector(".wsLabel");
                if (label) { el.setAttribute("title", label.textContent.trim()); }
            });
            // Tenant card
            var tenant = sidebar.querySelector(".tenantCard");
            if (tenant) {
                var tn = tenant.querySelector(".tenantName");
                var ts = tenant.querySelector(".tenantSub");
                tenant.setAttribute("title",
                    (tn ? tn.textContent.trim() : "") +
                    (ts ? " · " + ts.textContent.trim() : ""));
            }
        },

        _enableNotificationDropdown: function () {
            if (this._notifBound) { return; }
            this._notifBound = true;

            var bellWraps = document.querySelectorAll(".hdrIconWrap");
            if (!bellWraps.length) { return; }
            var bellWrap = bellWraps[0]; // first hdrIconWrap is the bell

            var panel = document.createElement("div");
            panel.id = "navisNotifPanel";
            panel.innerHTML =
                '<div class="notifHeader">' +
                  '<span class="notifTitle">Notifications</span>' +
                  '<span class="notifCount">3 new</span>' +
                '</div>' +
                '<div class="notifList">' +
                  '<div class="notifRow"><span class="notifIcon notifIconRed">!</span><div class="notifBody"><div class="notifLine"><strong>Sanctions hit</strong> on BP 0010023711</div><div class="notifTime">2m ago</div></div></div>' +
                  '<div class="notifRow"><span class="notifIcon notifIconBlue">🤖</span><div class="notifBody"><div class="notifLine"><strong>AI plausibility</strong> flagged EQ-220314</div><div class="notifTime">12m ago</div></div></div>' +
                  '<div class="notifRow"><span class="notifIcon notifIconGreen">✓</span><div class="notifBody"><div class="notifLine"><strong>Auto-merged</strong> MAT-7841 with MAT-7501</div><div class="notifTime">28m ago</div></div></div>' +
                  '<div class="notifRow"><span class="notifIcon notifIconPurple">▶</span><div class="notifBody"><div class="notifLine"><strong>RulePack v18</strong> promoted to pilot</div><div class="notifTime">1h ago</div></div></div>' +
                '</div>' +
                '<div class="notifFooter">View all activity →</div>';
            document.body.appendChild(panel);

            var open = false;
            function position() {
                var rect = bellWrap.getBoundingClientRect();
                panel.style.top   = (rect.bottom + 8) + "px";
                panel.style.right = Math.max(12, window.innerWidth - rect.right - 4) + "px";
            }

            bellWrap.addEventListener("click", function (e) {
                e.stopPropagation();
                open = !open;
                if (open) {
                    position();
                    panel.classList.add("show");
                    // clear orange dot
                    var dot = bellWrap.querySelector(".hdrDot");
                    if (dot) { dot.style.display = "none"; }
                } else {
                    panel.classList.remove("show");
                }
            });
            document.addEventListener("click", function (e) {
                if (open && !panel.contains(e.target)) {
                    open = false;
                    panel.classList.remove("show");
                }
            });
            window.addEventListener("resize", function () { if (open) { position(); } });
        },

        _showSkeletonsBriefly: function () {
            if (this._skeletonsShown) { return; }
            this._skeletonsShown = true;
            var cards = document.querySelectorAll(".kpiCard, .tile");
            cards.forEach(function (card) {
                if (card.querySelector(".skeletonOverlay")) { return; }
                card.classList.add("skeleton");
                var overlay = document.createElement("div");
                overlay.className = "skeletonOverlay";
                card.appendChild(overlay);
            });
            setTimeout(function () {
                document.querySelectorAll(".skeletonOverlay").forEach(function (o) {
                    o.classList.add("fadeOut");
                });
                setTimeout(function () {
                    document.querySelectorAll(".skeleton").forEach(function (c) {
                        c.classList.remove("skeleton");
                    });
                    document.querySelectorAll(".skeletonOverlay").forEach(function (o) {
                        o.remove();
                    });
                }, 450);
            }, 700);
        },

        _ensureToastStack: function () {
            var stack = document.getElementById("navisToastStack");
            if (!stack) {
                stack = document.createElement("div");
                stack.id = "navisToastStack";
                document.body.appendChild(stack);
            }
            return stack;
        },

        showToast: function (opts) {
            var stack = this._ensureToastStack();
            opts = opts || {};
            var type     = opts.type     || "info"; // info | success | warn | error
            var title    = opts.title    || "Notification";
            var message  = opts.message  || "";
            var duration = opts.duration || 4000;

            var icons = { success: "✓", info: "ℹ", warn: "!", error: "✕" };
            var typeClass = "navisToast" + type.charAt(0).toUpperCase() + type.slice(1);

            var toast = document.createElement("div");
            toast.className = "navisToast " + typeClass;
            toast.style.setProperty("--toast-duration", duration + "ms");
            toast.innerHTML =
                '<div class="navisToastIcon">' + icons[type] + '</div>' +
                '<div class="navisToastBody">' +
                    '<div class="navisToastTitle">' + title + '</div>' +
                    (message ? '<div class="navisToastMsg">' + message + '</div>' : '') +
                '</div>' +
                '<button class="navisToastClose" aria-label="Dismiss">×</button>' +
                '<div class="navisToastBar"></div>';
            stack.appendChild(toast);

            var close = function () {
                if (toast.classList.contains("hide")) { return; }
                toast.classList.add("hide");
                setTimeout(function () { toast.remove(); }, 320);
            };
            toast.querySelector(".navisToastClose").addEventListener("click", close);
            setTimeout(close, duration);
        },

        _showWelcomeToast: function () {
            if (this._welcomeToastShown) { return; }
            this._welcomeToastShown = true;
            var that = this;
            var firstName = (this.getView().getModel("user") || {}).getProperty
                ? this.getView().getModel("user").getProperty("/firstName")
                : "there";
            setTimeout(function () {
                that.showToast({
                    type: "success",
                    title: "Welcome back, " + firstName,
                    message: "7 stewardship items waiting · 3 high priority",
                    duration: 5000
                });
            }, 1200);
        },

        _renderSparklines: function () {
            var SVG_NS = "http://www.w3.org/2000/svg";
            var palette = ["#f59e0b", "#2563eb", "#f97316", "#0d9488"];
            var cards = document.querySelectorAll(".kpiCard");
            cards.forEach(function (card, idx) {
                if (card.dataset.sparkBound === "1") { return; }
                card.dataset.sparkBound = "1";
                var color = palette[idx % palette.length];

                // Generate a smooth fake trend (12 points, gentle wave + noise)
                var pts = [];
                var base = 35 + Math.random() * 10;
                for (var i = 0; i < 12; i++) {
                    var v = base + Math.sin(i * 0.7 + idx) * 8 + (Math.random() - 0.5) * 4;
                    pts.push(v);
                }
                var w = 100, h = 30;
                var step = w / (pts.length - 1);
                var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts);
                var d = "";
                pts.forEach(function (v, i) {
                    var x = i * step;
                    var y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
                    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
                });

                var svg = document.createElementNS(SVG_NS, "svg");
                svg.setAttribute("viewBox", "0 0 " + w + " " + h);
                svg.setAttribute("preserveAspectRatio", "none");
                svg.classList.add("kpiSpark");

                var area = document.createElementNS(SVG_NS, "path");
                area.setAttribute("d", d + "L" + w + " " + h + " L0 " + h + " Z");
                area.setAttribute("fill", color);
                area.setAttribute("fill-opacity", "0.12");
                svg.appendChild(area);

                var line = document.createElementNS(SVG_NS, "path");
                line.setAttribute("d", d.trim());
                line.setAttribute("fill", "none");
                line.setAttribute("stroke", color);
                line.setAttribute("stroke-width", "1.6");
                line.setAttribute("stroke-linejoin", "round");
                line.setAttribute("stroke-linecap", "round");
                svg.appendChild(line);

                // Insert right before .kpiBar so it sits above the value
                var bar = card.querySelector(".kpiBar");
                if (bar) { card.insertBefore(svg, bar); } else { card.appendChild(svg); }

                // Animate stroke draw-on
                var len = line.getTotalLength();
                line.style.strokeDasharray  = len;
                line.style.strokeDashoffset = len;
                line.getBoundingClientRect();
                line.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)";
                line.style.strokeDashoffset = "0";
            });
        },

        _enableClickRipples: function () {
            if (this._ripplesBound) { return; }
            this._ripplesBound = true;
            var selector = ".tile, .kpiCard, .newRecordBtn .sapMBtnInner, .pillarItem, .wsItem, .filterPill";
            document.addEventListener("click", function (e) {
                var target = e.target.closest(selector);
                if (!target) { return; }
                var rect = target.getBoundingClientRect();
                var ripple = document.createElement("span");
                ripple.className = "navisRipple";
                var size = Math.max(rect.width, rect.height) * 1.6;
                ripple.style.width = ripple.style.height = size + "px";
                ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
                ripple.style.top  = (e.clientY - rect.top  - size / 2) + "px";
                var prevPosition = getComputedStyle(target).position;
                if (prevPosition === "static") { target.style.position = "relative"; }
                target.style.overflow = "hidden";
                target.appendChild(ripple);
                setTimeout(function () { ripple.remove(); }, 700);
            });
        },

        _startLiveClock: function () {
            if (this._clockStarted) { return; }
            this._clockStarted = true;

            var that = this;
            // Insert the clock into the greeting sub line
            function tick() {
                var d = new Date();
                var hh = String(d.getHours()).padStart(2, "0");
                var mm = String(d.getMinutes()).padStart(2, "0");
                var ss = String(d.getSeconds()).padStart(2, "0");
                var sub = document.querySelector(".greetSub");
                if (!sub) { return; }
                var clockEl = sub.querySelector(".liveClock");
                if (!clockEl) {
                    clockEl = document.createElement("span");
                    clockEl.className = "liveClock";
                    sub.appendChild(clockEl);
                }
                clockEl.innerHTML = " &nbsp;·&nbsp; <span class='liveClockDot'>●</span> <strong>" + hh + ":" + mm + ":" + ss + "</strong>";
            }
            tick();
            setInterval(tick, 1000);
        },

        _enableCursorGlow: function () {
            if (this._cursorGlowBound) { return; }
            this._cursorGlowBound = true;

            var glow = document.createElement("div");
            glow.id = "navisCursorGlow";
            document.body.appendChild(glow);

            var x = 0, y = 0, tx = 0, ty = 0;
            document.addEventListener("mousemove", function (e) {
                tx = e.clientX;
                ty = e.clientY;
            });
            function loop() {
                x += (tx - x) * 0.18;
                y += (ty - y) * 0.18;
                glow.style.transform = "translate3d(" + (x - 200) + "px," + (y - 200) + "px,0)";
                requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
        },

        _startLiveCountDrift: function () {
            if (this._countDriftStarted) { return; }
            this._countDriftStarted = true;

            var that = this;
            setInterval(function () {
                that._driftCount();
            }, 7500);
        },

        _driftCount: function () {
            // Drift the orange "142" badge in the sidebar + the matching tile + greeting line
            var badgeEl = document.querySelector(".wsBadge");
            if (!badgeEl) { return; }
            var current = parseInt(badgeEl.textContent, 10);
            if (isNaN(current)) { return; }

            var delta = (Math.random() < 0.55) ? 1 : -1;
            var next  = Math.max(110, Math.min(180, current + delta));
            if (next === current) { return; }

            this._tickNumber(badgeEl, next);

            var tileEl = document.querySelector(".tile.tileOrange .tileValue");
            if (tileEl && parseInt(tileEl.textContent, 10) === current) {
                this._tickNumber(tileEl, next);
            }
        },

        _tickNumber: function (el, target) {
            var start = parseInt(el.textContent.replace(/,/g, ""), 10) || 0;
            var duration = 600;
            var t0 = performance.now();
            el.classList.add("numberFlash");
            function frame(now) {
                var t = Math.min(1, (now - t0) / duration);
                var eased = 1 - Math.pow(1 - t, 3);
                var val = Math.round(start + (target - start) * eased);
                el.textContent = val.toLocaleString("en-US");
                if (t < 1) {
                    requestAnimationFrame(frame);
                } else {
                    setTimeout(function () { el.classList.remove("numberFlash"); }, 700);
                }
            }
            requestAnimationFrame(frame);
        },

        _animateKpiCounters: function () {
            var els = document.querySelectorAll(".kpiValue");
            els.forEach(function (el) {
                if (el.dataset.animated === "1") { return; }
                var raw = el.textContent.trim();
                var match = raw.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
                if (!match) { return; }
                var target = parseFloat(match[1].replace(/,/g, ""));
                var suffix = match[2] || "";
                var hasComma = match[1].indexOf(",") !== -1;
                var hasDecimal = match[1].indexOf(".") !== -1;
                el.dataset.animated = "1";
                el.textContent = "0" + suffix;

                var duration = 1400;
                var start = performance.now();
                function frame(now) {
                    var t = Math.min(1, (now - start) / duration);
                    var eased = 1 - Math.pow(1 - t, 3);
                    var val = target * eased;
                    var formatted;
                    if (hasDecimal) {
                        formatted = val.toFixed(1);
                    } else if (hasComma) {
                        formatted = Math.round(val).toLocaleString("en-US");
                    } else {
                        formatted = Math.round(val).toString();
                    }
                    el.textContent = formatted + suffix;
                    if (t < 1) { requestAnimationFrame(frame); }
                }
                requestAnimationFrame(frame);
            });
        },

        _animateKpiBars: function () {
            var bars = document.querySelectorAll(".kpiBarFill");
            bars.forEach(function (bar) {
                if (bar.dataset.animated === "1") { return; }
                var target = bar.style.width || "0%";
                bar.dataset.animated = "1";
                bar.style.width = "0%";
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        bar.style.width = target;
                    });
                });
            });
        },

        _enableTileTilt: function () {
            var tiles = document.querySelectorAll(".tile");
            tiles.forEach(function (tile) {
                if (tile.dataset.tiltBound === "1") { return; }
                tile.dataset.tiltBound = "1";
                tile.classList.add("tiltable");

                var glow = document.createElement("div");
                glow.className = "tileGlow";
                tile.appendChild(glow);

                tile.addEventListener("mousemove", function (e) {
                    var rect = tile.getBoundingClientRect();
                    var x = e.clientX - rect.left;
                    var y = e.clientY - rect.top;
                    var px = (x / rect.width)  - 0.5;
                    var py = (y / rect.height) - 0.5;
                    var maxTilt = 6;
                    tile.style.setProperty("--tiltY",  (px *  maxTilt) + "deg");
                    tile.style.setProperty("--tiltX",  (py * -maxTilt) + "deg");
                    tile.style.setProperty("--glowX",  ((x / rect.width)  * 100) + "%");
                    tile.style.setProperty("--glowY",  ((y / rect.height) * 100) + "%");
                });
                tile.addEventListener("mouseleave", function () {
                    tile.style.setProperty("--tiltX", "0deg");
                    tile.style.setProperty("--tiltY", "0deg");
                });
            });
        },

        _getVisibleView: function () {
            var oView = this.getView();
            if (oView.byId("manageApprovalView") && oView.byId("manageApprovalView").getVisible()) return "manageApprovalView";
            if (oView.byId("stewardInboxView") && oView.byId("stewardInboxView").getVisible()) return "stewardInboxView";
            return "dashboardView";
        },

        onManageApprovalPress: function () {
            this._switchView(this._getVisibleView(), "manageApprovalView", "left");
            this.showToast({
                type: "info",
                title: "Manage Approval",
                message: "Showing 6 active approval workflows",
                duration: 3000
            });

            var oList = this.getView().byId("workspaceList");
            if (oList) {
                oList.getItems().forEach(function (oItem) { oItem.removeStyleClass("wsItemActive"); });
                oList.getItems()[0].addStyleClass("wsItemActive");
            }
        },

        onStewardInboxPress: function () {
            this._switchView(this._getVisibleView(), "stewardInboxView", "left");
            this.showToast({
                type: "info",
                title: "Steward Inbox",
                message: "Showing 142 records waiting on you",
                duration: 3000
            });

            var oList = this.getView().byId("workspaceList");
            if (oList) {
                oList.getItems().forEach(function (oItem) { oItem.removeStyleClass("wsItemActive"); });
                oList.getItems()[1].addStyleClass("wsItemActive");
            }
        },

        onDashboardPress: function () {
            var sVisible = this._getVisibleView();
            if (sVisible !== "dashboardView") {
                this._switchView(sVisible, "dashboardView", "right");
            }

            var oList = this.getView().byId("workspaceList");
            if (oList) {
                oList.getItems().forEach(function (oItem) { oItem.removeStyleClass("wsItemActive"); });
            }
        },

        _switchView: function (sFromId, sToId, sDirection) {
            var oFrom = this.getView().byId(sFromId);
            var oTo   = this.getView().byId(sToId);
            if (!oFrom || !oTo) { return; }

            var oFromDom = oFrom.getDomRef();
            var oToDom   = oTo.getDomRef();
            var sExitClass  = sDirection === "left" ? "viewExitLeft"  : "viewExitRight";
            var sEnterClass = sDirection === "left" ? "viewEnterRight" : "viewEnterLeft";

            if (oFromDom) {
                oFromDom.classList.remove("viewEnterLeft", "viewEnterRight");
                oFromDom.classList.add(sExitClass);
            }

            var that = this;
            setTimeout(function () {
                oFrom.setVisible(false);
                oTo.setVisible(true);
                if (oFromDom) { oFromDom.classList.remove(sExitClass); }
                setTimeout(function () {
                    var oToDomNow = oTo.getDomRef();
                    if (oToDomNow) {
                        oToDomNow.classList.add(sEnterClass);
                        setTimeout(function () {
                            oToDomNow.classList.remove(sEnterClass);
                        }, 450);
                    }
                    that._initDashboardAnimations();
                }, 20);
            }, 220);
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
                title: "",
                contentWidth: "680px",
                contentHeight: "auto",
                resizable: false,
                draggable: false,
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            oDialog.addStyleClass("mdPickerDialog");

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
                    sapCode: "MM01 · MARA / MARC / MAKT",
                    desc: "Raw materials, packaging &amp; services",
                    tags: ["MM", "Inventory", "MRP", "AI Cleansing"],
                    accent: "#2563eb",
                    accentLight: "#eff6ff",
                    steps: "5 steps"
                },
                {
                    type: "businesspartner",
                    icon: "🤝",
                    title: "Business Partner",
                    sapCode: "BP · KNA1 / LFA1 / BUT000",
                    desc: "Customers, vendors &amp; combined partners",
                    tags: ["Customer", "Vendor", "CVI Ready", "AI Dedup"],
                    accent: "#059669",
                    accentLight: "#f0fdf4",
                    steps: "6 steps"
                },
                {
                    type: "product",
                    icon: "🏭",
                    title: "Product Master",
                    sapCode: "MM01 (FERT/HALB) · Sales / BOM",
                    desc: "Finished &amp; semi-finished products",
                    tags: ["FERT", "HALB", "Sales", "BOM"],
                    accent: "#ea580c",
                    accentLight: "#fff7ed",
                    steps: "5 steps"
                },
                {
                    type: "equipment",
                    icon: "⚙️",
                    title: "Equipment Master",
                    sapCode: "IE01 · EQUI / EQUZ / ILOA",
                    desc: "Plant maintenance &amp; PM equipment",
                    tags: ["PM", "Asset", "Class.", "AI Match"],
                    accent: "#7c3aed",
                    accentLight: "#faf5ff",
                    steps: "4 steps"
                }
            ];

            var sHtml = '';

            // ── Header ──────────────────────────────────────────
            sHtml += '<div class="mdpHeader">';
            sHtml += '  <div class="mdpHeaderLeft">';
            sHtml += '    <div class="mdpHeaderIcon">📝</div>';
            sHtml += '    <div>';
            sHtml += '      <div class="mdpHeaderTitle">Create Master Data</div>';
            sHtml += '      <div class="mdpHeaderSub">Choose a record type to start the AI-assisted creation form</div>';
            sHtml += '    </div>';
            sHtml += '  </div>';
            sHtml += '  <div class="mdpHeaderRight">';
            sHtml += '    <div class="mdpAiBadge">🤖&nbsp; AI-Assisted</div>';
            sHtml += '    <button class="mdpCloseBtn" id="mdpCloseBtn" aria-label="Close" title="Close (Esc)">';
            sHtml += '      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">';
            sHtml += '        <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
            sHtml += '      </svg>';
            sHtml += '    </button>';
            sHtml += '  </div>';
            sHtml += '</div>';

            // ── Grid ─────────────────────────────────────────────
            sHtml += '<div class="mdpGrid">';

            for (var i = 0; i < aCards.length; i++) {
                var c = aCards[i];
                sHtml += '<div class="mdpCard" data-type="' + c.type + '" style="--acc:' + c.accent + ';--acc-light:' + c.accentLight + '">';

                // Coloured top bar
                sHtml += '<div class="mdpCardBar" style="background:' + c.accent + '"></div>';

                // Icon circle
                sHtml += '<div class="mdpCardIconCircle" style="background:' + c.accentLight + ';border-color:' + c.accent + '22">' + c.icon + '</div>';

                // Title + SAP code
                sHtml += '<div class="mdpCardTitle">' + c.title + '</div>';
                sHtml += '<div class="mdpCardSap">' + c.sapCode + '</div>';

                // Short description
                sHtml += '<div class="mdpCardDesc">' + c.desc + '</div>';

                // Divider
                sHtml += '<div class="mdpCardDivider"></div>';

                // Tags row
                sHtml += '<div class="mdpCardTags">';
                for (var j = 0; j < c.tags.length; j++) {
                    sHtml += '<span class="mdpTag" style="color:' + c.accent + ';background:' + c.accentLight + ';border-color:' + c.accent + '44">' + c.tags[j] + '</span>';
                }
                sHtml += '</div>';

                // CTA button
                sHtml += '<button class="mdpCardBtn" style="background:' + c.accent + '">Start ' + c.title + ' &nbsp;→</button>';

                // Steps badge (top-right)
                sHtml += '<div class="mdpStepsBadge">' + c.steps + '</div>';

                sHtml += '</div>'; // mdpCard
            }

            sHtml += '</div>'; // mdpGrid

            // ── Footer ───────────────────────────────────────────
            sHtml += '<div class="mdpFooter">';
            sHtml += '  <span>🔒</span>';
            sHtml += '  <span>Every submission is AI-validated &amp; duplicate-checked before manager approval</span>';
            sHtml += '</div>';

            return sHtml;
        },

        _attachCardClickHandlers: function (oDialog) {
            var that = this;
            var aCards = document.querySelectorAll(".mdpCard");
            for (var i = 0; i < aCards.length; i++) {
                aCards[i].addEventListener("click", function () {
                    var sType = this.getAttribute("data-type");
                    oDialog.close();
                    that._openMasterDataWizard(sType);
                });
            }
            // Wire the X close button
            var oClose = document.getElementById("mdpCloseBtn");
            if (oClose) {
                oClose.addEventListener("click", function () { oDialog.close(); });
            }
            // Esc key closes the dialog (in case SAPUI5 default doesn't)
            var escHandler = function (e) {
                if (e.key === "Escape") { oDialog.close(); }
            };
            document.addEventListener("keydown", escHandler);
            oDialog.attachAfterClose(function () {
                document.removeEventListener("keydown", escHandler);
            });
        },

        _openMasterDataWizard: function (sType) {
            var sBase = window.location.pathname.replace(/\/[^/]*$/, "");
            window.location.href = sBase + "/NavisMaster_MasterCreate_Form.html?type=" + sType;
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
        },

        _enableDarkMode: function () {
            if (this._darkModeBound) { return; }
            this._darkModeBound = true;

            // Restore saved preference
            if (localStorage.getItem("navis_dark_mode") === "1") {
                document.documentElement.classList.add("navisDark");
            }
            this._updateDarkIcon();

            var that = this;
            document.addEventListener("click", function (e) {
                var wrap = e.target.closest(".hdrDarkToggle");
                if (!wrap) { return; }
                var isDark = document.documentElement.classList.toggle("navisDark");
                localStorage.setItem("navis_dark_mode", isDark ? "1" : "0");
                that._updateDarkIcon();
            });
        },

        _updateDarkIcon: function () {
            var icon = document.getElementById("darkModeIcon");
            if (icon) {
                icon.textContent = document.documentElement.classList.contains("navisDark") ? "☀️" : "🌙";
            }
        },

        _enableAIChatbot: function () {
            if (this._chatbotBound) { return; }
            this._chatbotBound = true;

            var that = this;

            // Build the panel once
            var panel = document.createElement("div");
            panel.id = "navisAIPanel";
            panel.innerHTML =
                '<div class="aiPanelHeader">' +
                    '<div class="aiPanelHeaderLeft">' +
                        '<div class="aiPanelAvatar">🤖</div>' +
                        '<div>' +
                            '<div class="aiPanelTitle">NavisAI Assistant</div>' +
                            '<div class="aiPanelStatus"><span class="aiPanelDot"></span>Online · GPT-4o powered</div>' +
                        '</div>' +
                    '</div>' +
                    '<button class="aiPanelClose" id="aiPanelClose" aria-label="Close">✕</button>' +
                '</div>' +
                '<div class="aiPanelMessages" id="aiPanelMessages">' +
                    '<div class="aiMsg aiMsgBot">' +
                        '<div class="aiMsgBubble">👋 Hi! I\'m NavisAI. Ask me anything about your master data — quality scores, stewardship items, rule violations, or how to create a new record.</div>' +
                        '<div class="aiMsgTime">Just now</div>' +
                    '</div>' +
                '</div>' +
                '<div class="aiPanelSuggestions" id="aiPanelSuggestions">' +
                    '<button class="aiSuggBtn">Why is BP-0010023711 quarantined?</button>' +
                    '<button class="aiSuggBtn">Show me high-priority items</button>' +
                    '<button class="aiSuggBtn">How do I create a material?</button>' +
                '</div>' +
                '<div class="aiPanelInputRow">' +
                    '<input class="aiPanelInput" id="aiPanelInput" type="text" placeholder="Ask NavisAI…" autocomplete="off"/>' +
                    '<button class="aiPanelSend" id="aiPanelSend" aria-label="Send">&#10148;</button>' +
                '</div>';
            document.body.appendChild(panel);

            // Mock responses
            var responses = {
                "bp-0010023711": "**BP-0010023711 (Acme GmbH)** was quarantined due to **RNV-SUP-009** — a possible OFAC sanctions match flagged 2h ago. The record is pending steward review before it can be activated in SAP.",
                "quarantine":    "Quarantined records failed a hard-severity rule. They cannot be used in SAP transactions until a steward resolves the finding and a manager approves.",
                "high priority": "You have **3 high-priority items** right now:\n• BP-0010023711 — Sanctions hit\n• BP-0010024020 — IBAN check-digit failed\n• MAT-088421 — UoM/family mismatch",
                "material":      "To create a **Material Master**, click **+ New Record** → choose *Material Master* → follow the 4-step wizard: Basic Info → Classification → Org & MRP → Purchasing & Costing. AI will suggest the UNSPSC code and 40-char SAP description.",
                "score":         "The **Avg Golden Score** today is **86.4** — above the target of 85. The lowest-scoring records in your queue are BP-0010024033 (54) and BP-0010023711 (58).",
                "stewardship":   "You have **142 open stewardship items**. 12 are aging beyond 24h. 3 are at SLA risk. I recommend addressing the sanctions hit on BP-0010023711 first.",
                "kpi":           "Current KPIs:\n• Golden Records Today: **1,284** ↑9.2%\n• Avg Golden Score: **86.4** ✓\n• Open Stewardship: **142** (12 aging)\n• Time-to-GR Median: **4.7m** ↓18s"
            };

            function getBotReply(text) {
                var lower = text.toLowerCase();
                if (lower.indexOf("bp-0010023711") !== -1 || lower.indexOf("quarantin") !== -1 || lower.indexOf("sanctions") !== -1) { return responses["bp-0010023711"]; }
                if (lower.indexOf("high prior") !== -1 || lower.indexOf("urgent") !== -1) { return responses["high priority"]; }
                if (lower.indexOf("material") !== -1 || lower.indexOf("create") !== -1 || lower.indexOf("mm01") !== -1) { return responses["material"]; }
                if (lower.indexOf("score") !== -1) { return responses["score"]; }
                if (lower.indexOf("stewardship") !== -1 || lower.indexOf("inbox") !== -1 || lower.indexOf("item") !== -1) { return responses["stewardship"]; }
                if (lower.indexOf("kpi") !== -1 || lower.indexOf("dashboard") !== -1) { return responses["kpi"]; }
                return "I can help with master data quality, stewardship items, rule violations, KPIs, and record creation. Could you be more specific about what you need?";
            }

            function formatMsg(text) {
                // Bold **text** and newlines
                return text
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br>");
            }

            function addMessage(text, isBot, time) {
                var msgs = document.getElementById("aiPanelMessages");
                if (!msgs) { return; }
                var row = document.createElement("div");
                row.className = "aiMsg " + (isBot ? "aiMsgBot" : "aiMsgUser");
                row.innerHTML =
                    '<div class="aiMsgBubble">' + (isBot ? formatMsg(text) : text) + '</div>' +
                    '<div class="aiMsgTime">' + (time || "Just now") + '</div>';
                msgs.appendChild(row);
                msgs.scrollTop = msgs.scrollHeight;
            }

            function showTyping() {
                var msgs = document.getElementById("aiPanelMessages");
                if (!msgs) { return; }
                var typing = document.createElement("div");
                typing.className = "aiMsg aiMsgBot aiTyping";
                typing.id = "aiTypingIndicator";
                typing.innerHTML = '<div class="aiMsgBubble"><span class="aiTypingDot"></span><span class="aiTypingDot"></span><span class="aiTypingDot"></span></div>';
                msgs.appendChild(typing);
                msgs.scrollTop = msgs.scrollHeight;
            }

            function removeTyping() {
                var t = document.getElementById("aiTypingIndicator");
                if (t) { t.remove(); }
            }

            function sendMessage(text) {
                text = text.trim();
                if (!text) { return; }
                // Hide suggestions after first send
                var sugg = document.getElementById("aiPanelSuggestions");
                if (sugg) { sugg.style.display = "none"; }

                addMessage(text, false);
                var input = document.getElementById("aiPanelInput");
                if (input) { input.value = ""; }

                showTyping();
                setTimeout(function () {
                    removeTyping();
                    addMessage(getBotReply(text), true);
                }, 900 + Math.random() * 600);
            }

            // Toggle panel open/close
            document.addEventListener("click", function (e) {
                var aiBtn = e.target.closest(".hdrIconWrapAI");
                if (aiBtn) {
                    var isOpen = panel.classList.toggle("navisAIPanelOpen");
                    if (isOpen) {
                        var input = document.getElementById("aiPanelInput");
                        if (input) { setTimeout(function () { input.focus(); }, 320); }
                    }
                    return;
                }
                // Close button
                if (e.target.id === "aiPanelClose" || e.target.closest("#aiPanelClose")) {
                    panel.classList.remove("navisAIPanelOpen");
                    return;
                }
                // Suggestion pills
                var suggBtn = e.target.closest(".aiSuggBtn");
                if (suggBtn) {
                    sendMessage(suggBtn.textContent);
                    return;
                }
                // Send button
                if (e.target.id === "aiPanelSend" || e.target.closest("#aiPanelSend")) {
                    var inp = document.getElementById("aiPanelInput");
                    if (inp) { sendMessage(inp.value); }
                    return;
                }
            });

            // Enter key to send
            document.addEventListener("keydown", function (e) {
                if (e.key === "Enter" && document.activeElement && document.activeElement.id === "aiPanelInput") {
                    sendMessage(document.activeElement.value);
                }
                if (e.key === "Escape" && panel.classList.contains("navisAIPanelOpen")) {
                    panel.classList.remove("navisAIPanelOpen");
                }
            });
        },

        _enableMobileMenu: function () {
            if (this._mobileMenuBound) { return; }
            this._mobileMenuBound = true;

            var btn     = document.getElementById("mobileMenuBtn");
            var overlay = document.getElementById("mobileSidebarOverlay");
            var sidebar = document.querySelector(".sidebar");
            if (!btn || !sidebar) { return; }

            function open() {
                sidebar.classList.add("mobileSidebarOpen");
                if (overlay) { overlay.classList.add("show"); }
                btn.textContent = "✕";
            }
            function close() {
                sidebar.classList.remove("mobileSidebarOpen");
                if (overlay) { overlay.classList.remove("show"); }
                btn.textContent = "☰";
            }

            btn.addEventListener("click", function () {
                sidebar.classList.contains("mobileSidebarOpen") ? close() : open();
            });
            if (overlay) {
                overlay.addEventListener("click", close);
            }
        },

        _startOnboardingTour: function () {
            // Only show once — skip if user has seen it
            if (localStorage.getItem("navis_tour_done") === "1") { return; }

            var steps = [
                {
                    target:  ".kpiRow",
                    title:   "KPI Cards",
                    body:    "These 4 cards show your live master data quality metrics — Golden Records, Avg Score, Open Stewardship items, and Time-to-Golden-Record.",
                    position: "bottom"
                },
                {
                    target:  ".tileGrid",
                    title:   "Your Apps",
                    body:    "Quick-launch tiles for every NavisMaster module — Steward Inbox, Rule Console, Vector Dedup, and more.",
                    position: "top"
                },
                {
                    target:  ".sidebar",
                    title:   "Workspace",
                    body:    "Switch between pillars and workspaces here. Collapse the sidebar with the ‹ button to get more screen space.",
                    position: "right"
                },
                {
                    target:  ".newRecordBtn",
                    title:   "+ New Record",
                    body:    "Start an AI-assisted creation flow for any master data type — Material, Business Partner, Product, or Equipment.",
                    position: "bottom"
                },
                {
                    target:  ".hdrIconWrapAI",
                    title:   "NavisAI Assistant",
                    body:    "Click the 🤖 icon any time to open the AI chatbot. Ask about quality scores, rule violations, or how to create records.",
                    position: "bottom"
                }
            ];

            var current = 0;
            var overlay, box, that = this;

            function getTargetEl(selector) {
                return document.querySelector(selector);
            }

            function positionBox(targetEl, position) {
                if (!targetEl || !box) { return; }
                var rect = targetEl.getBoundingClientRect();
                var bw = box.offsetWidth || 300;
                var bh = box.offsetHeight || 160;
                var gap = 16;
                var top, left;

                if (position === "bottom") {
                    top  = rect.bottom + gap;
                    left = rect.left + rect.width / 2 - bw / 2;
                } else if (position === "top") {
                    top  = rect.top - bh - gap;
                    left = rect.left + rect.width / 2 - bw / 2;
                } else if (position === "right") {
                    top  = rect.top + rect.height / 2 - bh / 2;
                    left = rect.right + gap;
                } else {
                    top  = rect.bottom + gap;
                    left = rect.left + rect.width / 2 - bw / 2;
                }

                // Clamp to viewport
                left = Math.max(12, Math.min(left, window.innerWidth  - bw  - 12));
                top  = Math.max(70, Math.min(top,  window.innerHeight - bh  - 12));

                box.style.top  = top  + "px";
                box.style.left = left + "px";
            }

            function highlightTarget(targetEl) {
                // Remove old highlight
                document.querySelectorAll(".tourHighlight").forEach(function (el) {
                    el.classList.remove("tourHighlight");
                });
                if (targetEl) { targetEl.classList.add("tourHighlight"); }
            }

            function render(idx) {
                var step = steps[idx];
                var targetEl = getTargetEl(step.target);

                highlightTarget(targetEl);

                box.querySelector(".tourTitle").textContent   = step.title;
                box.querySelector(".tourBody").textContent    = step.body;
                box.querySelector(".tourStep").textContent    = (idx + 1) + " / " + steps.length;
                box.querySelector(".tourPrev").style.display  = idx === 0 ? "none" : "inline-flex";
                box.querySelector(".tourNext").textContent    = idx === steps.length - 1 ? "Done ✓" : "Next →";

                // Position after a brief paint tick so box dimensions are known
                setTimeout(function () { positionBox(targetEl, step.position); }, 30);

                // Scroll target into view
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }

            function closeTour() {
                document.querySelectorAll(".tourHighlight").forEach(function (el) {
                    el.classList.remove("tourHighlight");
                });
                if (overlay) { overlay.remove(); overlay = null; }
                if (box)     { box.remove();     box     = null; }
                localStorage.setItem("navis_tour_done", "1");
            }

            // Build overlay (dim background)
            overlay = document.createElement("div");
            overlay.className = "tourOverlay";
            document.body.appendChild(overlay);

            // Build tooltip box
            box = document.createElement("div");
            box.className = "tourBox";
            box.innerHTML =
                '<div class="tourHeader">' +
                    '<div class="tourBadge">👋 Quick Tour</div>' +
                    '<button class="tourSkip" id="tourSkip">Skip tour</button>' +
                '</div>' +
                '<div class="tourTitle"></div>' +
                '<div class="tourBody"></div>' +
                '<div class="tourFooter">' +
                    '<span class="tourStep"></span>' +
                    '<div class="tourBtns">' +
                        '<button class="tourBtn tourPrev">← Back</button>' +
                        '<button class="tourBtn tourNext tourBtnPrimary">Next →</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(box);

            // Wire buttons
            box.querySelector(".tourNext").addEventListener("click", function () {
                if (current === steps.length - 1) {
                    closeTour();
                } else {
                    current++;
                    render(current);
                }
            });
            box.querySelector(".tourPrev").addEventListener("click", function () {
                if (current > 0) { current--; render(current); }
            });
            box.querySelector("#tourSkip").addEventListener("click", closeTour);

            // Keyboard nav
            function keyHandler(e) {
                if (e.key === "ArrowRight" || e.key === "Enter") {
                    if (current === steps.length - 1) { closeTour(); document.removeEventListener("keydown", keyHandler); }
                    else { current++; render(current); }
                }
                if (e.key === "ArrowLeft" && current > 0) { current--; render(current); }
                if (e.key === "Escape") { closeTour(); document.removeEventListener("keydown", keyHandler); }
            }
            document.addEventListener("keydown", keyHandler);

            // Start after welcome toast settles
            setTimeout(function () { render(0); }, 2000);
        }

    });
});