// Vercel serverless function — triggers the yahoo-sync GitHub Actions workflow.
// Requires GITHUB_PAT env var (PAT with `workflow` scope) set in Vercel dashboard.

const OWNER = "adamleepurvis";
const REPO  = "poorpickles";
const WORKFLOW = "yahoo-sync.yml";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.GITHUB_PAT;
  if (!token) {
    return res.status(500).json({ error: "GITHUB_PAT not configured in Vercel env vars" });
  }

  const { league = "all" } = req.body || {};

  // Trigger workflow dispatch
  const dispatchResp = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main", inputs: { league } }),
    }
  );

  if (!dispatchResp.ok) {
    const text = await dispatchResp.text();
    return res.status(dispatchResp.status).json({ error: text });
  }

  // Brief delay so the run appears in the API, then fetch its URL
  await new Promise((r) => setTimeout(r, 2500));

  const runsResp = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  const runs = await runsResp.json();
  const runUrl =
    runs.workflow_runs?.[0]?.html_url ||
    `https://github.com/${OWNER}/${REPO}/actions`;

  return res.status(200).json({ ok: true, runUrl });
}
