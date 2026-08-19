const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userGroups = req.user["cognito:groups"] || [];

    let isAuthorized = allowedRoles.some((role) =>
      userGroups.includes(role)
    );

    // If no groups are assigned, and the route allows Customers, assume they are a standard Customer
    if (allowedRoles.includes("Customer") && !userGroups.includes("Admin")) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
};

export default authorizeRoles;
