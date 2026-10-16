const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      fields: err.fields || undefined,
    },
  });
};

module.exports = errorHandler;
