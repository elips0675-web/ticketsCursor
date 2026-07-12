const requestTimings = new Map()
const BUCKETS = [50, 100, 200, 500, 1000, 2000, 5000]

export function trackRequest(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const route = req.route?.path || req.baseUrl || req.path || 'unknown'
    const method = req.method
    const status = Math.floor(res.statusCode / 100) * 100
    const key = `${method} ${route} ${status}`
    const elapsed = Date.now() - start
    if (!requestTimings.has(key)) requestTimings.set(key, [])
    const timings = requestTimings.get(key)
    timings.push(elapsed)
    if (timings.length > 1000) timings.shift()
  })
  next()
}

export function getMetricsLines() {
  const lines = []
  lines.push(`# HELP http_request_duration_ms Request duration in milliseconds`)
  lines.push(`# TYPE http_request_duration_ms histogram`)
  for (const [key, timings] of requestTimings) {
    const total = timings.reduce((a, b) => a + b, 0)
    const count = timings.length
    const avg = count > 0 ? (total / count).toFixed(1) : '0'
    lines.push(`http_request_duration_ms_count{route="${key}"} ${count}`)
    lines.push(`http_request_duration_ms_sum{route="${key}"} ${total}`)
    lines.push(`http_request_duration_ms_avg{route="${key}"} ${avg}`)
    for (const bucket of BUCKETS) {
      const le = timings.filter(t => t <= bucket).length
      lines.push(`http_request_duration_ms_bucket{route="${key}",le="${bucket}"} ${le}`)
    }
    lines.push(`http_request_duration_ms_bucket{route="${key}",le="+Inf"} ${count}`)
  }
  return lines
}
