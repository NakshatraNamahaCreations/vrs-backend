/**
 * Wrap async route handlers so thrown errors bubble to the error middleware
 * without repetitive try/catch blocks.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
