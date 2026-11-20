# SEO tooling installation

Verified 22 October 2026. The GitHub repository and [claude-seo.md catalog](https://claude-seo.md/skills) describe the **same suite**, so it was installed once rather than duplicated.

## Installed and verified

- Source: [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo), commit `6be93f45064ffbadced572b5d5c95f55fd263af0`, version 2.5.0, MIT license.
- All **26 core catalog skill directories** installed under `~/.codex/skills/` using the system skill-installer helper, pinned to that commit. Direct Python download encountered a local CA-certificate error; the helper's supported Git method succeeded without disabling TLS verification.
- Shared scripts, data, schema, extension source and agent reference documents copied into `~/.codex/skills/seo/`, following the upstream manual-install layout. Installed Markdown runtime/reference paths were adapted to Codex directories. Source checkout is retained in the private planning workspace under `tooling/claude-seo/`.
- Isolated runtime provisioned by the bundled launcher. `claude-seo doctor --json` reports `ready: true`, `browser_ready: true`, Python 3.13 and no reasons for failure. Python dependencies are in the managed environment, not installed globally.
- All 26 entrypoints have matching names/descriptions and resolved execution paths. A managed `parse_html.py` smoke run successfully reproduced the legacy homepage's `https://example.com/` canonical.
- Original install provenance is saved locally at `~/.codex/skills/seo/installation-provenance.json`. Skills become discoverable by Codex on the next turn. The installed runtime was usable for the smoke check in this turn.

This is a Codex skills/manual-runtime installation, not a claim that Claude Code plugin commands, native specialist-agent registration, every integration or all upstream tests were exercised. No optional paid provider accounts, hooks or outreach automations were enabled. Source references may describe capabilities that require separate credentials.

## SEOcrawl MCP — configured, authentication incomplete

The [official setup](https://seocrawl.ai/mcp) specifies `https://mcp.seocrawl.ai`. Added that Streamable HTTP endpoint as the global Codex MCP server `seocrawl` and verified its configuration. It contains no embedded bearer token or account credentials.

The normal OAuth sign-in attempt failed during dynamic client registration with **HTTP 401 Unauthorized**, before account consent could be completed. A supported CLI retry using CIMD reported that the server does not advertise CIMD with token endpoint authentication method `none`. Consequently no Search Console, Analytics, ranking or SEOcrawl project data was accessed. The plugin-directory search returned no SEOcrawl result in this session. Configuration is not proof of a working/authenticated connection.

Vendor account/client authorization remains an external dependency. Do not invent a client ID, weaken TLS, buy a subscription or place credentials in this repository to bypass it. The vendor also offers supported ChatGPT/Claude connection paths on its setup page; support for the particular Codex OAuth flow needs confirmation if registration continues to fail. More integrations may be available in the [plugin directory](https://chatgpt.com/plugins).

SEOcrawl's account/plan requirements are separate from the free skill suite. Search Console can also be used directly after owner verification; the website and its SEO checks do not depend on a paid SEOcrawl connection.

## Website workflow

Use focused planning, technical, page, content, image, schema and sitemap skills as needed. Keep claims grounded in primary Google documentation and measured output. The suite's templates are guidance: do not enforce arbitrary word counts, fabricate client results or claim that a heuristic tool score proves ranking. See the [strategy and acceptance gates](strategy.md).
