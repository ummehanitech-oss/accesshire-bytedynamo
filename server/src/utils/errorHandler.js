/**
 * Central Error Handler Middleware
 * Formats errors into friendly, safe JSON responses without exposing internal stack traces.
 */
export function errorHandler(err, req, res, next) {
  // Determine HTTP status code
  let status = err.status || err.statusCode || 500;

  // Handle Multer file size / format errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    return res.status(status).json({
      error: 'The uploaded file is too large. Maximum allowed size is 5 MB.'
    });
  }

  // Handle JSON parse errors from body-parser
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON payload sent in request body.'
    });
  }

  // Safe logging: log status and message only (never log full payloads or API keys)
  console.warn(`[API Error] ${req.method} ${req.originalUrl} - Status: ${status} - Message: ${err.message}`);

  // Friendly message formatting
  const message = err.message || 'An unexpected server error occurred. Please try again.';

  res.status(status).json({
    error: message
  });
}
