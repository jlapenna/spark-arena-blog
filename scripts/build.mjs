import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(BLOG_ROOT, "dist");

const SKIP_DIRS = new Set([".git", "dist", "scripts", "node_modules"]);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "post";
}

function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(markdown) {
  const escaped = escapeHtml(markdown);
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      i += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim();
      const code = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      out.push(`<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      out.push("<hr />");
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      out.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      out.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraph = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s+/.test(lines[i]) && !/^[-*]\s+/.test(lines[i].trim()) && !/^\d+\.\s+/.test(lines[i].trim()) && !/^```/.test(lines[i].trim()) && !/^---+$/.test(lines[i].trim())) {
      paragraph.push(lines[i].trim());
      i += 1;
    }

    out.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return out.join("\n");
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function extractExcerpt(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("-") || /^\d+\./.test(line) || line.startsWith("```")) {
      continue;
    }
    return line.length > 180 ? `${line.slice(0, 177)}...` : line;
  }
  return "Read this technical deep dive.";
}

async function walkMarkdownFiles(rootDir) {
  const results = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(path.join(dir, entry.name));
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  await walk(rootDir);
  return results;
}

function pageTemplate({ title, description, content, backHref = "/", backLabel = "Back to Blog" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Spark Arena Blog</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <style>
    :root {
      --bg: #080c08;
      --bg-alt: #0f1510;
      --card: #121a13;
      --text: #edf3ed;
      --muted: #a7b5a7;
      --line: #263226;
      --brand: #76b900;
      --brand-soft: #92d11d;
      --link: #8fda4a;
      --shadow: rgba(118, 185, 0, 0.18);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      background:
        radial-gradient(1100px 500px at -10% -20%, rgba(118,185,0,0.16), transparent 50%),
        radial-gradient(900px 400px at 110% 0%, rgba(118,185,0,0.12), transparent 45%),
        linear-gradient(180deg, var(--bg), #070907);
      font-family: "IBM Plex Sans", "Segoe UI", "Inter", Arial, sans-serif;
      line-height: 1.7;
    }
    .wrap {
      max-width: 980px;
      margin: 0 auto;
      padding: 2.25rem 1rem 4rem;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .brand {
      color: var(--brand);
      font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.86rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .back {
      color: var(--muted);
      text-decoration: none;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0.4rem 0.8rem;
      font-size: 0.9rem;
    }
    .back:hover {
      color: var(--text);
      border-color: var(--brand);
    }
    .card {
      background: linear-gradient(180deg, rgba(18,26,19,0.92), rgba(14,20,14,0.93));
      border: 1px solid var(--line);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 24px 80px -45px var(--shadow);
    }
    h1, h2, h3, h4, h5, h6 {
      line-height: 1.24;
      margin: 1.4em 0 0.55em;
      color: #f4fff4;
    }
    h1 { font-size: clamp(1.9rem, 5.4vw, 2.85rem); margin-top: 0.2em; }
    h2 { font-size: clamp(1.35rem, 3.5vw, 1.95rem); }
    h3 { font-size: clamp(1.12rem, 2.8vw, 1.35rem); }
    p { color: var(--text); margin: 0.9em 0; }
    ul, ol { margin: 0.9em 0 1.1em 1.2em; }
    li { margin: 0.38em 0; }
    a { color: var(--link); text-underline-offset: 3px; }
    a:hover { color: var(--brand-soft); }
    strong { color: #ffffff; }
    code {
      font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      background: #0c130d;
      border: 1px solid #253225;
      border-radius: 0.35rem;
      padding: 0.1rem 0.35rem;
      color: #e1f0ce;
      font-size: 0.92em;
    }
    pre {
      background: #0a0f0a;
      border: 1px solid #253225;
      border-radius: 0.8rem;
      padding: 0.95rem 1rem;
      overflow: auto;
      margin: 1.1em 0;
    }
    pre code { border: 0; padding: 0; background: transparent; color: #dbe8d2; }
    hr { border: 0; border-top: 1px solid var(--line); margin: 1.6rem 0; }
    .footer {
      margin-top: 1.5rem;
      color: var(--muted);
      font-size: 0.9rem;
      text-align: center;
    }
    .post-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.95rem;
      margin-top: 1.1rem;
    }
    .post-card {
      background: #0e140f;
      border: 1px solid var(--line);
      border-radius: 0.8rem;
      padding: 0.95rem;
      text-decoration: none;
      color: inherit;
      display: block;
      transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
    }
    .post-card:hover {
      transform: translateY(-2px);
      border-color: #3c5a20;
      box-shadow: 0 15px 45px -30px rgba(118,185,0,0.45);
    }
    .post-card h3 {
      margin: 0;
      font-size: 1.03rem;
      color: #f0fff0;
    }
    .post-card p {
      margin: 0.55rem 0 0;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.45;
    }
    @media (max-width: 680px) {
      .wrap { padding-top: 1.25rem; }
      .card { padding: 1rem; }
      .topbar { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <div class="topbar">
      <div class="brand">Spark Arena · Tech Blog</div>
      <a class="back" href="${backHref}">${backLabel}</a>
    </div>
    <article class="card">
      ${content}
    </article>
    <div class="footer">Generated static blog · deployable on Cloudflare Workers</div>
  </main>
</body>
</html>`;
}

async function ensureCleanDist() {
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });
}

async function main() {
  await ensureCleanDist();

  const markdownFiles = await walkMarkdownFiles(BLOG_ROOT);
  const postFiles = markdownFiles
    .filter((abs) => {
      const rel = path.relative(BLOG_ROOT, abs).replace(/\\/g, "/");
      return rel !== "README.md" && rel !== "index.md";
    })
    .sort();

  const posts = [];

  for (const absPath of postFiles) {
    const rel = path.relative(BLOG_ROOT, absPath).replace(/\\/g, "/");
    const raw = await fs.readFile(absPath, "utf8");
    const title = extractTitle(raw, path.basename(rel, ".md"));
    const excerpt = extractExcerpt(raw);

    const relNoExt = rel.replace(/\.md$/i, "");
    const slugParts = relNoExt.split("/").map(slugify);
    const routePath = `/posts/${slugParts.join("/")}/`;
    const outDir = path.join(DIST_DIR, "posts", ...slugParts);

    const contentHtml = renderMarkdown(raw);
    const html = pageTemplate({
      title,
      description: excerpt,
      content: contentHtml,
      backHref: "/",
      backLabel: "All Posts",
    });

    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "index.html"), html, "utf8");

    posts.push({ title, excerpt, routePath, source: rel });
  }

  const indexPath = path.join(BLOG_ROOT, "index.md");
  let indexIntro = "<h1>Technical Blog</h1><p>Technical notes and deep dives from Spark Arena.</p>";
  try {
    const indexMarkdown = await fs.readFile(indexPath, "utf8");
    indexIntro = renderMarkdown(indexMarkdown);
  } catch {
    // Fallback intro already set
  }

  const cards = posts
    .map(
      (post) => `<a class="post-card" href="${post.routePath}"><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.excerpt)}</p></a>`
    )
    .join("\n");

  const indexContent = `${indexIntro}\n<h2>Latest Posts</h2>\n<div class="post-grid">${cards || "<p>No posts found.</p>"}</div>`;
  const indexHtml = pageTemplate({
    title: "Blog",
    description: "Spark Arena technical blog.",
    content: indexContent,
    backHref: "https://spark-arena.com/",
    backLabel: "spark-arena.com",
  });

  await fs.writeFile(path.join(DIST_DIR, "index.html"), indexHtml, "utf8");

  console.log(`Built ${posts.length} post(s) into ${DIST_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
