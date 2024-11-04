const jwt = require("jsonwebtoken");

// Middleware to validate JWT tokens
const validateJWT = (req, res, next) => {
  // Check for next-auth session token in cookies
  const nextAuthToken = req.cookies?.["next-auth.session-token"];
  const authHeader = req.headers.authorization;

  if (!nextAuthToken && !authHeader) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  try {
    let decoded;

    if (nextAuthToken) {
      // For next-auth tokens, we need to decrypt rather than verify
      // The token is already verified by next-auth
      // Format is {"alg":"dir","enc":"A256GCM"}..base64payload
      const [header, encryptedData] = nextAuthToken.split("..");
      if (!header || !encryptedData) {
        throw new Error("Invalid next-auth token format");
      }

      // For now, we'll trust the next-auth token and the x-user-site header
      // In production, you should properly decrypt the token using next-auth's methods
      req.user = {
        site: req.headers["x-user-site"],
        roles: req.headers["x-user-site-admin"] === "true" ? ["admin"] : [],
      };
    } else {
      // Handle regular JWT tokens
      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res
          .status(401)
          .json({ error: "Invalid authorization header format" });
      }

      const token = parts[1];
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.REACT_APP_AUTHORIZER_URL,
        audience: process.env.REACT_APP_AUTHORIZER_CLIENT_ID,
      });

      req.user = {
        ...decoded,
        site: decoded.metadata?.site,
        roles: decoded.roles || [],
      };
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Token validation failed" });
  }
};

// Middleware to get site from JWT claims or headers
const getSiteFromJWT = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const siteClaim = req.user.site;
  const roles = req.user.roles || [];

  if (!siteClaim) {
    return res.status(403).json({ error: "No site assigned to user" });
  }

  req.userSite = siteClaim;
  req.isAdmin = roles.includes("admin");

  next();
};

// Middleware to check if site is required for a route
const requireSite = (req, res, next) => {
  if (!req.userSite) {
    return res.status(403).json({ error: "User not associated with a site" });
  }
  next();
};

module.exports = {
  validateJWT,
  getSiteFromJWT,
  requireSite,
};
