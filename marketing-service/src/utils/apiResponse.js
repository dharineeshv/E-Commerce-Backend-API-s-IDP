// ==========================================
// Success Response
// ==========================================

export const successResponse = (

    res,

    statusCode,

    message,

    data = null

) => {

    return res.status(statusCode).json({

        success: true,

        message,

        data

    });

};

// ==========================================
// Error Response
// ==========================================

export const errorResponse = (

    res,

    statusCode,

    message

) => {

    return res.status(statusCode).json({

        success: false,

        message

    });

};