# Source Notes

Use this file when explaining the scoring system or when current policy/literature grounding matters.

## Shared Registry

The authoritative CCFA source inventory is:

```text
../ccf-common/references/source-registry.yaml
```

Do not duplicate long URL lists in this skill. Add or update public source records in the shared registry, then run:

```powershell
python ..\ccf-common\scripts\check_sources.py
```

## Idea-Reviewer Use Rules

- Verify current venue policies from official conference pages when the user asks about latest rules, review forms, tracks, or deadlines.
- Use primary papers, proceedings pages, official project pages, or credible scholar pages for novelty checks.
- In standard mode, record public-safe search queries and closest-work evidence before making strong novelty claims.
- Treat unsearched prior art as uncertainty, not proof of novelty.
- Use public peer-review and research-question frameworks as scaffolds for judgment; do not copy their wording or treat them as venue-specific scoring forms.
- Follow `../ccf-common/references/privacy-and-evidence.md` before using private idea text in any search query.
- Apply the shared source-quality policy unless the user explicitly asks to discuss a specific excluded paper separately.
