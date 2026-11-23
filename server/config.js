// server/config.js — Exports configuration from environment variables
const config = {
  PORT: process.env.PORT || 3001,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/rivalry-arena',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  TITLE_DURATION_DAYS: parseInt(process.env.TITLE_DURATION_DAYS, 10) || 7,
  TITLE_CLEANUP_DAYS: parseInt(process.env.TITLE_CLEANUP_DAYS, 10) || 30,
};

export default config;
