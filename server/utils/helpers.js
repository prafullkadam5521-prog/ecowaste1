const paginate = (page = 1, limit = 10) => ({
  skip: (Number(page) - 1) * Number(limit),
  limit: Number(limit),
});

const successResponse = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

const errorResponse = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

module.exports = { paginate, successResponse, errorResponse };
