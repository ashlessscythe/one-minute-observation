// Middleware to get site from request headers
const getSiteFromHeaders = (req, res, next) => {
  req.userSite = req.headers["x-user-site"];
  req.isAdmin = req.headers["x-user-site-admin"] === "true";
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
  getSiteFromHeaders,
  requireSite
};
