import { logError } from "../utils/logger.js";

const errorMiddleware = (error, req, res, next) => {

    logError(error.message, error);

    return res.status(error.statusCode || 500).json({

        success: false,

        message: error.message || "Internal Server Error"

    });

};

export default errorMiddleware;