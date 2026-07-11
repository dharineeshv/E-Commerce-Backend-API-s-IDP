const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userGroups = req.user["cognito:groups"] || [];

    const hasRole = allowedRoles.some((role) =>
      userGroups.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
};

export default authorizeRoles;