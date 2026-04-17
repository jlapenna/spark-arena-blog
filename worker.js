export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Dynamic Benchmarks Feed
    if (url.pathname === "/benchmarks.xml") {
      try {
        const response = await fetch("https://api.github.com/repos/spark-arena/recipe-registry/commits?per_page=15", {
          headers: {
            "User-Agent": "Spark-Arena-Worker",
            // Note: In production, you'd ideally use a GitHub token from env.GITHUB_TOKEN
          },
          cf: {
            cacheTtl: 300, // Cache for 5 minutes
            cacheEverything: true,
          }
        });

        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const commits = await response.json();

        const siteUrl = "https://spark-arena.com";
        const benchmarkEntries = commits.map((c) => {
          const commitUrl = c.html_url;
          const authorName = c.commit.author.name;
          const date = c.commit.author.date;
          const message = c.commit.message;
          const escapedMsg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const title = escapedMsg.split("\n")[0];

          return `  <entry>
    <title>${title}</title>
    <link href="${commitUrl}" />
    <id>${commitUrl}</id>
    <updated>${date}</updated>
    <summary>${escapedMsg}</summary>
    <author><name>${authorName.replace(/&/g, "&amp;")}</name></author>
    <category term="recipe-update" />
  </entry>`;
        }).join("\n");

        const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Spark Arena Raw Benchmarks</title>
  <subtitle>Raw benchmark recipes and registry updates from spark-arena/recipe-registry.</subtitle>
  <link href="${siteUrl}/benchmarks.xml" rel="self" />
  <link href="https://github.com/spark-arena/recipe-registry" />
  <id>https://github.com/spark-arena/recipe-registry</id>
  <updated>${new Date().toISOString()}</updated>
${benchmarkEntries}
</feed>`;

        return new Response(atomXml, {
          headers: {
            "Content-Type": "application/atom+xml; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          },
        });
      } catch (err) {
        return new Response(`Error generating feed: ${err.message}`, { status: 500 });
      }
    }

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
