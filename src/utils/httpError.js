// Throw one of these from any route and the error handler sends
// `{ message }` with the given status code.
export function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
