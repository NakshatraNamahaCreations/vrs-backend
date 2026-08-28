export function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const status =
    err.status ||
    (err.name === "ValidationError" ? 400 : err.name === "CastError" ? 400 : 500);

  if (process.env.NODE_ENV !== "test") {
    console.error(`[${req.method} ${req.originalUrl}]`, err.message);
  }

  res.status(status).json({
    error: err.message || "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
