const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    const userGroups = req.user["cognito:groups"] || [];

    const isAuthorized = allowedRoles.some((role) =>
      userGroups.includes(role)
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

export default authorizeRoles;