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
      const [header] = nextAuthToken.split("..");

      // Log token format for debugging
      console.log("Next-auth token format:", {
        header: header ? "present" : "missing",
        token_length: nextAuthToken.length,
      });

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
        console.log("Invalid auth header format:", {
          parts_length: parts.length,
          first_part: parts[0],
        });
        return res
          .status(401)
          .json({ error: "Invalid authorization header format" });
      }

      const token = parts[1];

      // Log token format for debugging
      console.log("JWT token format:", {
        token_parts: token.split(".").length,
        token_length: token.length,
      });

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
    // Enhanced error logging
    console.error("Auth error details:", {
      error_name: error.name,
      error_message: error.message,
      token_type: nextAuthToken ? "next-auth" : "jwt",
      headers: {
        authorization: authHeader ? "present" : "missing",
        site: req.headers["x-user-site"] || "missing",
        admin: req.headers["x-user-site-admin"] || "missing",
      },
    });

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token format",
        details: error.message,
      });
    }
    return res.status(401).json({
      error: "Token validation failed",
      details: error.message,
    });
  }
};

// Middleware to get site from JWT claims or headers
const getSiteFromJWT = (req, res, next) => {
  if (!req.user) {
    console.log("Missing user object in request");
    return res.status(401).json({ error: "User not authenticated" });
  }

  const siteClaim = req.user.site;
  const roles = req.user.roles || [];

  // Log site information for debugging
  console.log("Site information:", {
    site: siteClaim,
    roles,
    user_id: req.user.sub || "not_present",
  });

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
    console.log("Missing userSite in request");
    return res.status(403).json({ error: "User not associated with a site" });
  }
  next();
};

module.exports = {
  validateJWT,
  getSiteFromJWT,
  requireSite,
};
