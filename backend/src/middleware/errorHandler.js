export function errorHandler(err, req, res, _next) {
  console.error(`[error] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({
    error: "Something went wrong on the assistant's side. Please try again.",
  });
}
