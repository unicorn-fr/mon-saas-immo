import { Response } from 'express'

/**
 * Send a successful response with data.
 *
 * @param res     Express Response object
 * @param data    Payload to include in the `data` field
 * @param statusCode  HTTP status code (default 200)
 * @param meta    Optional pagination or contextual metadata
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  })
}

/**
 * Send a paginated list response.
 *
 * @param res    Express Response object
 * @param data   Array of items for the current page
 * @param total  Total number of items across all pages
 * @param page   Current page number (1-indexed)
 * @param limit  Number of items per page
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): Response {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

/**
 * Send an error response.
 *
 * @param res        Express Response object
 * @param message    Human-readable error message
 * @param statusCode HTTP status code (default 400)
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
  })
}
