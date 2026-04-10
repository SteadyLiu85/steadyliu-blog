const jwt = require('jsonwebtoken');

function extractToken(req) {
  return req.headers.authorization?.split(' ')[1];
}

function decodeToken(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    return null;
  }
}

function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: '访问被拒绝，缺少身份令牌' });
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return res.status(403).json({ message: '令牌无效或已过期' });
  }

  req.user = decoded;
  next();
}

function isAdminRequest(req) {
  return Boolean(decodeToken(extractToken(req)));
}

module.exports = { verifyToken, isAdminRequest };
