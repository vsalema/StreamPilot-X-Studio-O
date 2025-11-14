/**
 * ULTRA SHIELD – v1
 *
 * Features clés :
 *  - Détection centralisée de clés sensibles (token, access_token, etc.)
 *  - Modes : "reject" | "sanitize" | "monitor"
 *  - Middleware backend (Express-compatible)
 *  - Hardening front : nettoyage URL (query + hash) sans forcer d’URL absolue
 *  - Patch fetch / XMLHttpRequest / sendBeacon
 *  - Hooks de logging / observabilité
 *
 * Ce module est autonome et peut tourner côté Node OU navigateur.
 */

(function () {
  // ---------------------------------------------------------------------------
  // 1. CONFIG GLOBALE
  // ---------------------------------------------------------------------------
  const DEFAULT_CONFIG = {
    forbiddenKeys: [
      "token",
      "access_token",
      "id_token",
      "auth_token",
      "jwt",
      "refresh_token",
      "sess_token",
    ],
    mode: "reject", // "reject" | "sanitize" | "monitor"
    redactValue: "[REDACTED_TOKEN]",
    enabledContexts: {
      query: true,
      headers: true,
      body: true,
      cookies: true,
      urlFragment: true,
      fetch: true,
      xhr: true,
      sendBeacon: true,
    },
    logger: function (event) {
      // Hook observabilité minimaliste (PEUT être surchargé)
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          `[ULTRA_SHIELD] incident=${event.type} context=${event.context} detail=${event.detail || ""}`
        );
      }
    },
  };

  let RUNTIME_CONFIG = { ...DEFAULT_CONFIG };

  function mergeConfig(partialCfg) {
    if (!partialCfg || typeof partialCfg !== "object") return;
    RUNTIME_CONFIG = {
      ...RUNTIME_CONFIG,
      ...partialCfg,
      enabledContexts: {
        ...RUNTIME_CONFIG.enabledContexts,
        ...(partialCfg.enabledContexts || {}),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 2. UTILITAIRE : SCAN D’OBJET
  // ---------------------------------------------------------------------------
  function scanObject(obj, context, meta) {
    if (!obj || typeof obj !== "object") {
      return { incident: false, sanitized: obj };
    }

    const forbidden = (RUNTIME_CONFIG.forbiddenKeys || []).map((k) =>
      String(k).toLowerCase()
    );
    let incident = false;
    const sanitized = Array.isArray(obj) ? [] : {};

    Object.keys(obj).forEach((rawKey) => {
      const lowerKey = rawKey.toLowerCase();
      const value = obj[rawKey];

      if (forbidden.includes(lowerKey)) {
        incident = true;
        // log événement
        RUNTIME_CONFIG.logger({
          type: "forbidden_key",
          context,
          key: rawKey,
          meta: meta || {},
        });

        if (RUNTIME_CONFIG.mode === "sanitize") {
          sanitized[rawKey] = RUNTIME_CONFIG.redactValue;
        }
        // mode "reject" ou "monitor" → on ne copie pas la valeur
      } else {
        sanitized[rawKey] = value;
      }
    });

    return { incident, sanitized };
  }

  // ---------------------------------------------------------------------------
  // 3. BACKEND : MIDDLEWARE EXPRESS-COMPATIBLE
  // ---------------------------------------------------------------------------
  function expressMiddleware(customConfig) {
    if (customConfig) mergeConfig(customConfig);

    return function ultraShieldMiddleware(req, res, next) {
      const meta = {
        ip: req.ip || req.connection?.remoteAddress || null,
        path: req.path || req.url,
        method: req.method,
      };

      // Query
      if (RUNTIME_CONFIG.enabledContexts.query) {
        const q = scanObject(req.query, "query", meta);
        if (q.incident && RUNTIME_CONFIG.mode === "reject") {
          return res.status(400).json({
            error: "TOKEN_IN_QUERY",
            message: "Les jetons sont interdits dans les paramètres d’URL.",
          });
        }
        if (q.incident && RUNTIME_CONFIG.mode === "sanitize") {
          req.query = q.sanitized;
        }
      }

      // Headers
      if (RUNTIME_CONFIG.enabledContexts.headers) {
        const headers = {};
        for (const k in req.headers) {
          headers[k.toLowerCase()] = req.headers[k];
        }
        const h = scanObject(headers, "headers", meta);
        if (h.incident && RUNTIME_CONFIG.mode === "reject") {
          return res.status(400).json({
            error: "TOKEN_IN_HEADERS",
            message: "En-têtes non conformes (clé sensible détectée).",
          });
        }
        // on ne réécrit pas req.headers par prudence
      }

      // Body
      if (RUNTIME_CONFIG.enabledContexts.body) {
        const b = scanObject(req.body || {}, "body", meta);
        if (b.incident && RUNTIME_CONFIG.mode === "reject") {
          return res.status(400).json({
            error: "TOKEN_IN_BODY",
            message: "Corps de requête non conforme (clé sensible).",
          });
        }
        if (b.incident && RUNTIME_CONFIG.mode === "sanitize") {
          req.body = b.sanitized;
        }
      }

      // Cookies (si un parser est en place)
      if (RUNTIME_CONFIG.enabledContexts.cookies && req.cookies) {
        const c = scanObject(req.cookies, "cookies", meta);
        if (c.incident && RUNTIME_CONFIG.mode === "reject") {
          return res.status(400).json({
            error: "TOKEN_IN_COOKIES",
            message: "Cookies non conformes (clé sensible).",
          });
        }
        if (c.incident && RUNTIME_CONFIG.mode === "sanitize") {
          req.cookies = c.sanitized;
        }
      }

      if (RUNTIME_CONFIG.mode === "monitor") {
        // en monitor, on laisse toujours passer
        return next();
      }

      return next();
    };
  }

  // ---------------------------------------------------------------------------
  // 4. FRONT : NETTOYAGE URL (SEARCH + HASH) SANS FORCER D’URL ABSOLUE
  // ---------------------------------------------------------------------------
  function hardenLocation() {
    try {
      if (typeof window === "undefined" || !window.location) return;
      const loc = window.location;
      let dirty = false;

      // Nettoyage query string
      if (loc.search && RUNTIME_CONFIG.enabledContexts.query) {
        const params = new URLSearchParams(loc.search);
        RUNTIME_CONFIG.forbiddenKeys.forEach((key) => {
          if (params.has(key)) {
            params.delete(key);
            dirty = true;
          }
        });
        if (dirty) {
          const newSearch = params.toString();
          const newUrl =
            loc.pathname +
            (newSearch ? "?" + newSearch : "") +
            (loc.hash || "");
          window.history.replaceState(null, "", newUrl);
          // mise à jour du loc dans le contexte
        }
      }

      // Nettoyage fragment (#...)
      if (loc.hash && RUNTIME_CONFIG.enabledContexts.urlFragment) {
        const hashContent = loc.hash.startsWith("#")
          ? loc.hash.slice(1)
          : loc.hash;
        const fragParams = new URLSearchParams(hashContent);
        let fragmentDirty = false;

        RUNTIME_CONFIG.forbiddenKeys.forEach((key) => {
          if (fragParams.has(key)) {
            fragParams.delete(key);
            fragmentDirty = true;
          }
        });

        if (fragmentDirty) {
          const newHashStr = fragParams.toString();
          const newUrl =
            loc.pathname +
            (loc.search || "") +
            (newHashStr ? "#" + newHashStr : "");
          window.history.replaceState(null, "", newUrl);
        }
      }
    } catch (e) {
      if (RUNTIME_CONFIG.logger) {
        RUNTIME_CONFIG.logger({
          type: "error",
          context: "location_hardening",
          detail: e && e.message,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. FRONT : PATCH FETCH / XHR / SENDBEACON
  // ---------------------------------------------------------------------------
  function inspectUrlString(urlStr) {
    try {
      const base =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : "http://localhost"; // base pour relatives, sans imposer l’absolu à l’appelant
      const u = new URL(urlStr, base);
      const params = u.searchParams;
      return RUNTIME_CONFIG.forbiddenKeys.some((key) => params.has(key));
    } catch (_) {
      return false;
    }
  }

  function inspectBodyString(bodyStr) {
    try {
      const data = JSON.parse(bodyStr);
      if (!data || typeof data !== "object") return false;
      const keys = Object.keys(data).map((k) => k.toLowerCase());
      return RUNTIME_CONFIG.forbiddenKeys.some((k) => keys.includes(k));
    } catch (_) {
      return false;
    }
  }

  function shouldBlockTransport(context, url, body) {
    const meta = { url, context };
    // URL
    if (url && inspectUrlString(url)) {
      RUNTIME_CONFIG.logger({
        type: "transport_block",
        context,
        detail: "forbidden_key_in_url",
        meta,
      });
      return true;
    }

    // Body
    if (body && typeof body === "string" && inspectBodyString(body)) {
      RUNTIME_CONFIG.logger({
        type: "transport_block",
        context,
        detail: "forbidden_key_in_body",
        meta,
      });
      return true;
    }

    return false;
  }

  function patchFetch() {
    if (typeof window === "undefined" || typeof window.fetch === "undefined")
      return;
    if (!RUNTIME_CONFIG.enabledContexts.fetch) return;

    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : input.url;
      const body = init && init.body;

      if (shouldBlockTransport("fetch", url, body)) {
        return Promise.reject(
          new Error("Requête bloquée par Ultra Shield (clé sensible détectée).")
        );
      }
      return originalFetch(input, init);
    };
  }

  function patchXHR() {
    if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined")
      return;
    if (!RUNTIME_CONFIG.enabledContexts.xhr) return;

    const OriginalXHR = window.XMLHttpRequest;

    function WrappedXHR() {
      const xhr = new OriginalXHR();
      let _url = null;
      let _method = null;
      let _body = null;

      const originalOpen = xhr.open;
      const originalSend = xhr.send;

      xhr.open = function (method, url) {
        _method = method;
        _url = url;
        return originalOpen.apply(xhr, arguments);
      };

      xhr.send = function (body) {
        _body = body;
        if (shouldBlockTransport("xhr", _url, _body)) {
          RUNTIME_CONFIG.logger({
            type: "transport_block",
            context: "xhr",
            detail: "blocked_before_send",
            meta: { method: _method, url: _url },
          });
          // on annule la requête
          throw new Error("Requête XHR bloquée par Ultra Shield.");
        }
        return originalSend.apply(xhr, arguments);
      };

      return xhr;
    }

    window.XMLHttpRequest = WrappedXHR;
  }

  function patchSendBeacon() {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      typeof navigator.sendBeacon === "undefined"
    )
      return;
    if (!RUNTIME_CONFIG.enabledContexts.sendBeacon) return;

    const originalSendBeacon = navigator.sendBeacon.bind(navigator);

    navigator.sendBeacon = function (url, data) {
      const body =
        typeof data === "string"
          ? data
          : data instanceof Blob || data instanceof ArrayBuffer
          ? null
          : null; // on reste prudent sur d’autres formats

      if (shouldBlockTransport("sendBeacon", url, body)) {
        return false; // on refuse d’envoyer
      }

      return originalSendBeacon(url, data);
    };
  }

  function patchTransports() {
    patchFetch();
    patchXHR();
    patchSendBeacon();
  }

  // ---------------------------------------------------------------------------
  // 6. AUTO-INIT FRONT
  // ---------------------------------------------------------------------------
  function autoInitFront() {
    if (typeof window === "undefined") return;

    // Permet de surcharger la config avant init via window.__ULTRA_SHIELD_CONFIG__
    if (window.__ULTRA_SHIELD_CONFIG__) {
      mergeConfig(window.__ULTRA_SHIELD_CONFIG__);
    }

    hardenLocation();
    patchTransports();
  }

  // ---------------------------------------------------------------------------
  // 7. API PUBLIQUE
  // ---------------------------------------------------------------------------
  const UltraShield = {
    configure: mergeConfig,
    getConfig: function () {
      return { ...RUNTIME_CONFIG };
    },
    scanObject,
    expressMiddleware,
    hardenLocation,
    patchTransports,
    autoInitFront,
  };

  // Export Node.js / CommonJS
  if (typeof module !== "undefined" && module.exports) {
    module.exports = UltraShield;
  }

  // Export navigateur (global)
  if (typeof window !== "undefined") {
    window.UltraShield = UltraShield;
    // Auto-init front
    autoInitFront();
  }
})();
