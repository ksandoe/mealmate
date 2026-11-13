// Small shared helpers for route handlers.

// Wrap async handlers so rejections reach the error middleware.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Throw a 400 with a consistent error body.
const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

// Throw a 404 with a consistent error body.
const notFound = (message) => {
  const err = new Error(message);
  err.status = 404;
  return err;
};

// Forward a Supabase error as a 500 with a safe message.
const throwSupabase = (error) => {
  const err = new Error(error.message || 'Database error');
  err.status = 500;
  return err;
};

module.exports = { asyncHandler, badRequest, notFound, throwSupabase };
