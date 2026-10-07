export function handleHttpError(error, _request, response, next) {
  if (response.headersSent) return next(error);
  let status = error?.statusCode || error?.status;
  let message = error?.message;
  if (error?.code === 11000) {
    status = 409;
    message = "A record with those details already exists.";
  } else if (["ValidationError", "CastError"].includes(error?.name)) {
    status = 400;
    message = "Some supplied values are invalid. Check your details and try again.";
  } else if (error?.name === "MulterError") {
    status = 400;
    message = "Upload limits exceeded. Check the file size and number of images.";
  }
  if (!Number.isInteger(status) || status < 400 || status >= 600) status = 500;
  if (status >= 500) {
    console.error("Request failed:", error);
    message = "The server could not process your request. Please try again.";
  }
  response.status(status).json({ error: message || "The request could not be processed." });
}
