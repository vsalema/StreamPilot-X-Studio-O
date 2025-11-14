/**
 * SINGLE SECURITY SHIELD
 * Un module autonome combinant :
 *  - Nettoyage d’URL (front)
 *  - Neutralisation du fragment (#token=…)
 *  - Patch de fetch (front)
 *  - Pare-feu de requêtes (Node/Express)
 *  - Hunter centralisé (analyse clé/valeur)
 */

(function () {
  const FORBIDDEN_KEYS = [
    "token",
    "access_token",
    "id_token",
    "auth_token",
    "jwt",
    "refresh_token",
  ];

  /* ---------------------------------------------------------------------------
     1) HUNTER CENTRAL — analyse d’objet
  --------------------------------------------------------------------------- */
  function scanObject(obj, context, meta) {
    if (!obj) return { incident: false, sanitized: null };
    let incident = false;
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      const isForbidden = FORBIDDEN_KEYS.includes(key.toLowerCase());
      if (isForbidden) {
        incident = true;

        // log optionnel
        if (typeof console !== "undefined") {
          console.warn(
            `[SHIELD] Token détecté dans ${context} | key=${key} | ip=${meta.ip}`
          );
        }

        sanitized[key] = "[REDACTED_TOKEN]";
      } else {
        sanitized[key] = value;
      }
    }

    return { incident, sanitized };
  }

  /* ---------------------------------------------------------------------------
     2) PROTECTION BACK-END (Express)
  --------------------------------------------------------------------------- */
  function tokenShieldMiddleware(req, res, next) {
    const meta = { ip: req.ip || null };

    // Query
    const q = scanObject(req.query, "query", meta);
    if (q.incident) {
      return res.status(400).json({
        error: "TOKEN_IN_QUERY",
        message: "Les tokens sont interdits dans l’URL.",
      });
    }

    // Headers
    const headers = {};
    for (const k in req.headers) headers[k.toLowerCase()] = req.headers[k];
    const h = scanObject(headers, "headers", meta);
    if (h.incident) {
      return res.status(400).json({
        error: "TOKEN_IN_HEADERS",
        message: "En-têtes non conformes.",
      });
    }

    // Body
    const b = scanObject(req.body || {}, "body", meta);
    if (b.incident) {
      return res.status(400).json({
        error: "TOKEN_IN_BODY",
        message: "Corps non conforme.",
      });
    }

    next();
  }

  /* ---------------------------------------------------------------------------
     3) HARDENING FRONT — nettoyage de l’URL (search + fragment)
  --------------------------------------------------------------------------- */
  function cleanLocation() {
    try {
      const url = new URL(window.location.href);
      let dirty = false;

      // Query
      FORBIDDEN_KEYS.forEach((k) => {
        if (url.searchParams.has(k)) {
          url.searchParams.delete(k);
          dirty = true;
        }
      });

      // Fragment (#…)
      if (url.hash) {
        const frag = new URLSearchParams(url.hash.slice(1));
        FORBIDDEN_KEYS.forEach((k) => {
          if (frag.has(k)) {
            frag.delete(k);
            dirty = true;
          }
        });
        url.hash = frag.toString() ? "#" + frag.toString() : "";
      }

      // Mise à jour si nécessaire
      if (dirty) {
        window.history.replaceState(null, "", url.toString());
      }
    } catch (e) {
      console.warn("[SHIELD] URL cleaning error", e);
    }
  }

  /* ---------------------------------------------------------------------------
     4) PATCH FETCH — blocage si URL ou body contiennent un token
  --------------------------------------------------------------------------- */
  function patchFetch() {
    if (typeof fetch === "undefined") return;
    const original = fetch;

    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : input.url;
      const body = init && init.body;

      // URL check
      try {
        const u = new URL(url, window.location.origin);
        for (const k of FORBIDDEN_KEYS)
          if (u.searchParams.has(k))
            return Promise.reject(
              new Error("Token interdit dans l’URL (politique de sécurité)")
            );
      } catch (_) {}

      // Body check
      if (typeof body === "string") {
        try {
          const p = JSON.parse(body);
          for (const k of FORBIDDEN_KEYS)
            if (Object.keys(p).includes(k))
              return Promise.reject(
                new Error("Token interdit dans le body JSON")
              );
        } catch (_) {}
      }

      return original(input, init);
    };
  }

  /* ---------------------------------------------------------------------------
     EXPORTS COMMUNS
  --------------------------------------------------------------------------- */
  const Shield = {
    tokenShieldMiddleware, // backend
    cleanLocation, // front
    patchFetch, // front
    scanObject, // utilitaire
  };

  // Export Node.js
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Shield;
  }

  // Auto-activation navigateur
  if (typeof window !== "undefined") {
    cleanLocation();
    patchFetch();
  }
})();
