const LLM_BOT_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /Claude-Web/i,
  /ClaudeBot/i,
  /anthropic-ai/i,
  /PerplexityBot/i,
  /YouBot/i,
  /Applebot-Extended/i,
  /AdobeEdgeOptimize/i,
];

const ADOBE_EDGE_HOST = 'live.edgeoptimize.net';

function isLlmTraffic(userAgent) {
  if (!userAgent) return false;
  return LLM_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export default {
  async fetch(request, env) {
    const userAgent = request.headers.get('User-Agent') || '';
    const url = new URL(request.url);

    // Loop protection: already visited Adobe edge, go straight to origin
    if (request.headers.get('x-edgeoptimize-visited') === 'true') {
      return fetch(request);
    }

    // Human / SEO bot traffic — pass through unchanged
    if (!isLlmTraffic(userAgent)) {
      const originResponse = await fetch(request);
      return new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: {
          ...Object.fromEntries(originResponse.headers),
          'x-edgeoptimize-routed': 'false',
        },
      });
    }

    // LLM traffic — route to Adobe Edge
    const adobeUrl = new URL(request.url);
    adobeUrl.hostname = ADOBE_EDGE_HOST;

    const adobeHeaders = new Headers(request.headers);
    adobeHeaders.set('Host', env.TARGET_HOST);
    adobeHeaders.set('x-adobe-api-key', env.ADOBE_API_KEY);
    adobeHeaders.set('x-edgeoptimize-visited', 'true');
    adobeHeaders.set('x-forwarded-host', url.hostname);

    const adobeRequest = new Request(adobeUrl.toString(), {
      method: request.method,
      headers: adobeHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? request.body
        : undefined,
    });

    try {
      const adobeResponse = await fetch(adobeRequest);

      if (!adobeResponse.ok) {
        // Adobe edge error — fallback to origin silently
        console.error(`[OAE] Adobe edge returned ${adobeResponse.status}, falling back to origin`);
        return fetch(request);
      }

      return new Response(adobeResponse.body, {
        status: adobeResponse.status,
        statusText: adobeResponse.statusText,
        headers: {
          ...Object.fromEntries(adobeResponse.headers),
          'x-edgeoptimize-routed': 'true',
        },
      });
    } catch (err) {
      // Network error — fallback to origin
      console.error('[OAE] Adobe edge unreachable, falling back to origin:', err.message);
      return fetch(request);
    }
  },
};
