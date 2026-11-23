// server/middleware/auth.js — JWT verification middleware
import jwt from 'jsonwebtoken';
import config from '../config.js';

/**
 * Required auth — rejects with 401 if no valid token.
 */
export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present, but does not
 * reject the request when missing or invalid (for guest browsing).
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = { id: decoded.id, username: decoded.username };
    } catch {
      // Ignore — treat as unauthenticated guest
    }
  }
  next();
}
