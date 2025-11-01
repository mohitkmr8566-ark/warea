export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://warea.vercel.app";

  const content = `
User-agent: *
Allow: /

Sitemap: ${baseUrl}/api/sitemap.xml
Host: ${baseUrl.replace(/^https?:\/\//, "")}
`;

  res.setHeader("Content-Type", "text/plain");
  res.write(content.trim());
  res.end();
}
