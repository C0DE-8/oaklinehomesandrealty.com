const jwt = require("jsonwebtoken");

function readToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function requireAdmin(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.token_type !== "admin") {
      return res.status(403).json({ message: "Admin access is required." });
    }

    req.admin = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireUser(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.token_type !== "user") {
      return res.status(403).json({ message: "User access is required." });
    }

    req.user = {
      id: payload.id,
      email: payload.email,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = {
  requireAdmin,
  requireUser,
};
