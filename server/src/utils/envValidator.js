const logger = require('./logger');

/**
 * Validates required environment variables
 * @param {string[]} requiredVars - Array of required environment variable names
 * @throws {Error} If any required variable is missing
 */
const validateEnv = (requiredVars = []) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  logger.success('Environment variables validated successfully');
};

/**
 * Checks for recommended environment variables and warns if missing
 * @param {string[]} recommendedVars - Array of recommended environment variable names
 */
const checkRecommendedEnv = (recommendedVars = []) => {
  const missing = recommendedVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.warn(`Missing recommended environment variables: ${missing.join(', ')}`);
  }
};

module.exports = { validateEnv, checkRecommendedEnv };
