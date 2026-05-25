import { Octokit } from 'octokit';

// GitHub API helper - creates authenticated client from session
export function getOctokit(req) {
  return new Octokit({ auth: req.user.accessToken });
}

// Create octokit from raw token
export function getOctokitFromToken(token) {
  return new Octokit({ auth: token });
}

// Rate limit aware request wrapper with auto-retry
export async function withRateLimit(octokit, fn, io, username) {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error) {
    if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
      const resetTime = parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
      const waitMs = resetTime - Date.now();

      if (io && username) {
        io.to(`user:${username}`).emit('farm:ratelimit', {
          retryAfter: Math.max(0, waitMs),
          resetTime,
          message: `Rate limited. Auto-retrying in ${Math.ceil(waitMs / 1000)}s`
        });
      }

      if (waitMs > 0) {
        await sleep(waitMs + 1000);
        try {
          const retryResult = await fn();
          return { success: true, data: retryResult };
        } catch (retryError) {
          return { success: false, error: 'rate_limited_retry_failed', message: retryError.message };
        }
      }
    }
    throw error;
  }
}

// Fetch current rate limit status
export async function getRateLimitStatus(octokit) {
  try {
    const { data } = await octokit.rest.rateLimit.get();
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: data.rate.reset,
      used: data.rate.used
    };
  } catch {
    return null;
  }
}

// Sleep utility
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
