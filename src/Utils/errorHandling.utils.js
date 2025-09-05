export const globalErrorHandler = (err, req, res, next) => {
    const status = err.cause || 500;
    res.status(status).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: err.stack,
    });
    }