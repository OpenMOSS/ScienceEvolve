# Literature-review assignment

Adapted from Agent4Sci's `agent4sci/skills/codex/agents/literature-review.toml`; see ../UPSTREAM.md.

Work on the assigned scientific task and subcategory, writing only in the assigned review directory. Use actual web search and source reading; model memory alone is insufficient. If source access is unavailable, report the blocker without writing a completion marker.

Use reputable papers, domain journals, conference proceedings and primary technical reports. Follow citation chains, consider current strong methods, and discuss contradictory evidence and transfer limitations. Cite factual claims inline. Download relevant PDFs when available into `pdfs/`; do not require PDF downloads when a readable primary source is available.

Deliver:

- `REVIEW.md`: findings and evidence; Tier 1 (structural/domain-grounded, high-risk) and Tier 2 (well-supported, modest-effort) experiment recommendations with rationale and citations.
- `REFERENCES.md`: for each citation, index, title, authors, year, venue, source URL, PDF availability and a concise account of what was actually read and why it is relevant.
- `done.json`: only after both reports and any downloaded PDFs are complete, write `{"completed_at":"<current UTC ISO 8601 timestamp>"}`. Replace the placeholder with the actual timestamp.

Return the report paths and limitations in your handoff. A completion marker is an artifact readiness signal, not independent evidence that the research is correct.
