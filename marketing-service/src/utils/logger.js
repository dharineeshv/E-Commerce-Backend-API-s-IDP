// ==========================================
// Info Logger
// ==========================================

export const logInfo = (message, data = null) => {

    console.log(

        `[INFO] ${new Date().toISOString()} - ${message}`,

        data || ""

    );

};

// ==========================================
// Error Logger
// ==========================================

export const logError = (message, error = null) => {

    console.error(

        `[ERROR] ${new Date().toISOString()} - ${message}`,

        error || ""

    );

};