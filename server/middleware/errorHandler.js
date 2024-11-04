// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  
  // Don't expose stack traces in production
  const error = process.env.NODE_ENV === 'production' ?
    'An internal server error occurred' :
    err.message;
  
  res.status(err.status || 500).json({ error });
};

module.exports = errorHandler;
