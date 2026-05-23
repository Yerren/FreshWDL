/*jslint plusplus: true, sloppy: true, indent: 4 */
// WidgetFactory: maps config entries to concrete widget constructors, decides
// which widgets are enabled (via widgetList/graphList), builds them, runs
// initialize(), and registers them with the WidgetRegistry.
//
// Each entry in the manifest binds a widget id to:
//   - Ctor: the constructor function (e.g. ApparentWidget)
//   - config: the per-instance config object (merged with defaults)
//   - enabledKey: the key inside widgetList / graphList that gates creation
//   - enabledIn: "widgetList" (default) or "graphList"
//   - canvasID: canvas element id for enabled-false fallback (hides the canvas)

(function (global) {
    var LICENSE_PUBLIC_JWK = {
        kty: "EC",
        crv: "P-256",
        x: "nMXiRCfQ-b3sLMLFAxVp6IxwESKY8TfJrKpcWb90SQs",
        y: "_D7BRZhxPuULpNVD9cKMpcrRBkB6vXM9NYK3P_6QwWM"
    };

    function hexToBytes(hex) {
        var out = new Uint8Array(hex.length / 2), i;
        for (i = 0; i < out.length; i++) { out[i] = parseInt(hex.substr(i * 2, 2), 16); }
        return out;
    }
    function bytesToHex(buf) {
        var b = new Uint8Array(buf), out = "", i;
        for (i = 0; i < b.length; i++) { out += b[i].toString(16).padStart(2, "0"); }
        return out;
    }

    // #FWDLcontainer is written by the per-export document.write that runs
    // AFTER this IIFE, so the paint may need to defer to DOMContentLoaded.
    function paintLicenseFailure(reason, allowedHostnames) {
        function paint() {
            var c = document.getElementById("FWDLcontainer");
            if (!c) { return; }
            if (reason === "host") {
                var list = (allowedHostnames || []).map(function (h) {
                    return "<code>" + h + "</code>";
                }).join(", ");
                c.innerHTML = "<div style=\"padding:2em;text-align:center;font-family:sans-serif\">" +
                    "This FreshWDL layout is licensed for " + list +
                    ".<br>It cannot be used on <code>" + (location.hostname || "") + "</code>.</div>";
            } else {
                c.innerHTML = "<div style=\"padding:2em;text-align:center;font-family:sans-serif\">" +
                    "FreshWDL license check failed.</div>";
            }
        }
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", paint);
        } else {
            paint();
        }
    }

    function WidgetFactory(registry) {
        this.registry = registry || null;
        this.manifest = [];
        this._license = null;
        this._licensePromise = null;
    }

    WidgetFactory.prototype.setRegistry = function (registry) {
        this.registry = registry;
    };

    WidgetFactory.prototype.addEntry = function (entry) {
        this.manifest.push(entry);
    };

    WidgetFactory.prototype.removeEntry = function (id) {
        for (var i = 0; i < this.manifest.length; i++) {
            if (this.manifest[i] && this.manifest[i].id === id) {
                this.manifest.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    WidgetFactory.prototype.setManifest = function (entries) {
        this.manifest = entries.slice();
    };

    WidgetFactory.prototype.isEnabled = function (entry) {
        if (!entry.enabledKey) { return true; }
        var source = entry.enabledIn === "graphList" ?
            (typeof graphList !== "undefined" ? graphList : null) :
            (typeof widgetList !== "undefined" ? widgetList : null);
        if (!source) { return false; }
        var node = source[entry.enabledKey];
        if (!node) { return false; }
        return node.enabled === true;
    };

    // Hide the canvas element for disabled widgets (legacy behaviour from
    // initAll: canvas.style.display = "none" when not enabled).
    WidgetFactory.prototype.hideDisabled = function (entry) {
        var canvasID = entry.canvasID || (entry.config && entry.config.canvasID);
        if (!canvasID) { return; }
        var el = document.getElementById(canvasID);
        if (el) { el.style.display = "none"; }
    };

    // licenseToken on any entry → bundle verification is required. Surviving
    // a stripped bundle is what makes stripping fail closed.
    WidgetFactory.prototype.requiresLicense = function () {
        for (var i = 0; i < this.manifest.length; i++) {
            var e = this.manifest[i];
            if (e && e.config && e.config.licenseToken) { return true; }
        }
        return false;
    };

    WidgetFactory.prototype.beginLicenseCheck = function () {
        if (this._licensePromise) { return this._licensePromise; }
        var self = this;
        function done(state) {
            self._license = state;
            self._licensePromise = Promise.resolve(state);
            return self._licensePromise;
        }

        var bundle = (typeof window !== "undefined") ? window.__FWDL_LICENSE_BUNDLE__ : null;
        var required = this.requiresLicense();

        if (!bundle) {
            if (!required) { return done({ ok: true, legacy: true }); }
            paintLicenseFailure("sig");
            return done({ ok: false, reason: "missing-bundle" });
        }

        var host = (typeof location !== "undefined" ? (location.hostname || "") : "").toLowerCase();
        var isDev = host === "localhost" || host === "127.0.0.1" || host === "";
        var allowed = bundle.allowedHostnames || [];

        if (!isDev && allowed.indexOf(host) === -1) {
            paintLicenseFailure("host", allowed);
            return done({ ok: false, reason: "host" });
        }
        if (isDev) {
            return done({ ok: true, dev: true, hash: bundle.payloadHash });
        }

        // Per-widget digests don't depend on the signature result, so fire
        // them in parallel with the importKey/verify chain. Saves one
        // Web Crypto round-trip on the page-load critical path.
        var enc = new TextEncoder();
        var hash = bundle.payloadHash || "";
        var sig = bundle.sig || "";

        var tokensP = Promise.all(self.manifest.map(function (e) {
            if (!e || !e.config || !e.config.licenseToken) { return null; }
            return crypto.subtle.digest("SHA-256", enc.encode(hash + "|" + e.id))
                .then(function (buf) { return { id: e.id, token: bytesToHex(buf).slice(0, 16) }; });
        }));

        var verifyP = crypto.subtle.importKey(
            "jwk",
            LICENSE_PUBLIC_JWK,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["verify"]
        ).then(function (key) {
            return crypto.subtle.verify(
                { name: "ECDSA", hash: "SHA-256" },
                key,
                hexToBytes(sig),
                enc.encode(hash + "|" + allowed.join(","))
            );
        });

        self._licensePromise = Promise.all([verifyP, tokensP]).then(function (results) {
            var sigOk = results[0];
            var pairs = results[1];
            if (!sigOk) {
                paintLicenseFailure("sig");
                self._license = { ok: false, reason: "sig" };
                return self._license;
            }
            var tokens = Object.create(null);
            for (var j = 0; j < pairs.length; j++) {
                if (pairs[j]) { tokens[pairs[j].id] = pairs[j].token; }
            }
            self._license = { ok: true, tokens: tokens, hash: hash };
            return self._license;
        }).catch(function () {
            paintLicenseFailure("sig");
            self._license = { ok: false, reason: "error" };
            return self._license;
        });
        return self._licensePromise;
    };

    WidgetFactory.prototype.passesLicenseCheck = function (entry) {
        var state = this._license;
        // No beginLicenseCheck yet (e.g. direct test harness): legacy
        // manifests build, licensed ones refuse.
        if (!state) { return !this.requiresLicense(); }
        if (state.legacy) { return true; }
        if (!state.ok) { return false; }
        if (state.dev) { return true; }
        var token = entry.config && entry.config.licenseToken;
        // Verified bundle present → every entry must carry a matching token.
        if (!token) { return false; }
        return !!state.tokens && state.tokens[entry.id] === token;
    };

    WidgetFactory.prototype.buildOne = function (entry) {
        if (!entry || !entry.Ctor) { return null; }
        if (!this.isEnabled(entry)) {
            this.hideDisabled(entry);
            return null;
        }
        if (!this.passesLicenseCheck(entry)) { return null; }
        var src = entry.config || {}, config = {}, key;
        for (key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) { config[key] = src[key]; }
        }
        config.id = config.id || entry.id;
        var instance = new entry.Ctor(config);
        if (typeof instance.initialize === "function") {
            instance.initialize();
        }
        if (this.registry) {
            this.registry.register(config.id, instance);
        }
        return instance;
    };

    WidgetFactory.prototype.buildAll = function () {
        var built = [];
        for (var i = 0; i < this.manifest.length; i++) {
            var instance = this.buildOne(this.manifest[i]);
            if (instance) { built.push(instance); }
        }
        return built;
    };

    global.WidgetFactory = WidgetFactory;
})(typeof window !== "undefined" ? window : this);
