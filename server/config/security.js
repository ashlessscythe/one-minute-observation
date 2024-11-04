const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Rate Limiting Configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// Helmet Configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.REACT_APP_AUTHORIZER_URL],
      frameSrc: ["'self'", process.env.REACT_APP_AUTHORIZER_URL],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", process.env.REACT_APP_AUTHORIZER_URL],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
};

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin === process.env.REACT_APP_AUTHORIZER_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-site', 'x-user-site-admin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Static files security configuration
const staticOptions = {
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
  }
};

module.exports = {
  apiLimiter,
  helmetConfig,
  corsOptions,
  staticOptions,
  configureHelmet: () => helmet(helmetConfig),
  configureCors: () => cors(corsOptions)
};
