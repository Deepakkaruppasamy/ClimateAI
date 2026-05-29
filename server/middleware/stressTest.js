/**
 * Stress Test Middleware
 * Reads flags from app.locals.stressTest:
 *   { enabled: bool, latencyMs: number, rateLimitChance: number (0-1) }
 */
module.exports = async function stressTest(req, res, next) {
  const flags = req.app.locals.stressTest
  if (!flags || !flags.enabled) return next()

  // Artificial latency
  const latency = typeof flags.latencyMs === 'number' ? flags.latencyMs : 3000
  await new Promise((r) => setTimeout(r, latency))

  // Random rate-limit injection
  const chance = typeof flags.rateLimitChance === 'number' ? flags.rateLimitChance : 0.5
  if (Math.random() < chance) {
    return res.status(429).json({
      error: 'Too Many Requests (stress test)',
      retryAfter: Math.ceil(latency / 1000),
    })
  }

  next()
}
