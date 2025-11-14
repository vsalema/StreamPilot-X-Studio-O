// security/tokenGuard.js
const SUSPICIOUS_KEYS = [
  "token",
  "access_token",
  "id_token",
  "auth_token",
  "jwt"
];

function hasSuspiciousKey(obj = {}) {
  return Object.keys(obj).some((key) =>
    SUSPICIOUS_KEYS.includes(key.toLowerCase())
  );
}

function tokenGuard(req, res, next) {
  const issues = [];

  // Query params
  if (hasSuspiciousKey(req.query)) {
    issues.push("query");
  }

  // Body (JSON / form)
  if (hasSuspiciousKey(req.body)) {
    issues.push("body");
  }

  // Headers
  const loweredHeaders = {};
  Object.keys(req.headers || {}).forEach((key) => {
    loweredHeaders[key.toLowerCase()] = req.headers[key];
  });
  if (hasSuspiciousKey(loweredHeaders)) {
    issues.push("headers");
  }

  // Cookies
  if (req.cookies && hasSuspiciousKey(req.cookies)) {
    issues.push("cookies");
  }

  if (issues.length > 0) {
    // Ici tu peux logguer vers ton SIEM / audit / monitoring
    console.warn(
      `[SECURITY] Token détecté dans : ${issues.join(", ")} | IP=${req.ip}`
    );

    return res.status(400).json({
      code: "TOKEN_IN_URL_OR_REQUEST",
      message: "Les jetons ne doivent pas transiter par l’URL ou la requête.",
      details: issues
    });
  }

  next();
}

module.exports = { tokenGuard };
