export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Normalize common routes for static blog hosting
    let pathname = url.pathname;
    if (pathname === "") pathname = "/";

    // Serve static assets from the generated dist directory
    const assetResponse = await env.ASSETS.fetch(new Request(new URL(pathname, request.url), request));
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // Fallback to index for unknown routes
    return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
  },
};
