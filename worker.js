export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Dynamic Benchmarks Feed
    if (url.pathname === "/benchmarks.xml") {
      try {
        const repos = ["recipe-registry", "community-recipe-registry"];
        const fetchCommits = repos.map(repo => 
          fetch(`https://api.github.com/repos/spark-arena/${repo}/commits?per_page=10`, {
            headers: { "User-Agent": "Spark-Arena-Worker" },
            cf: { cacheTtl: 300, cacheEverything: true }
          }).then(async r => {
            if (!r.ok) return [];
            const json = await r.json();
            return json.map(c => ({ ...c, _repo: repo }));
          })
        );

        const results = await Promise.all(fetchCommits);
        const allCommits = results.flat().sort((a, b) => 
          new Date(b.commit.author.date) - new Date(a.commit.author.date)
        ).slice(0, 20);

        const siteUrl = "https://spark-arena.com";
        const benchmarkEntries = allCommits.map((c) => {
          const commitUrl = c.html_url;
          const authorName = c.commit.author.name;
          const date = c.commit.author.date;
          const message = c.commit.message;
          const repoLabel = c._repo === "recipe-registry" ? "[Official]" : "[Community]";
          
          const escapedMsg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const title = `${repoLabel} ${escapedMsg.split("\n")[0]}`;

          return `  <entry>
    <title>${title}</title>
    <link href="${commitUrl}" />
    <id>${commitUrl}</id>
    <updated>${date}</updated>
    <summary>${escapedMsg}</summary>
    <author><name>${authorName.replace(/&/g, "&amp;")}</name></author>
    <category term="${c._repo}" />
  </entry>`;
        }).join("\n");

        const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Spark Arena Raw Benchmarks</title>
  <subtitle>Aggregated benchmark recipes from official and community registries.</subtitle>
  <link href="${siteUrl}/benchmarks.xml" rel="self" />
  <link href="https://github.com/spark-arena" />
  <id>https://github.com/spark-arena/registries</id>
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
