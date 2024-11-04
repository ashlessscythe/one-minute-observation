require("dotenv").config();
const jwt = require("jsonwebtoken");

// Create a test token with Authorizer's expected format
const payload = {
  // Standard claims
  iss: process.env.REACT_APP_AUTHORIZER_URL,
  aud: process.env.REACT_APP_AUTHORIZER_CLIENT_ID,
  sub: "test-user",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour

  // Authorizer specific claims
  roles: ["admin"],
  metadata: {
    site: "TEST",
  },
  email: "test@example.com",
};

// Sign with JWT_SECRET
const token = jwt.sign(payload, process.env.JWT_SECRET);
console.log("Test token:", token);
