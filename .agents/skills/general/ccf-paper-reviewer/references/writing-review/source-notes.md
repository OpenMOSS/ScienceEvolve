# Source Notes

Use this file when explaining writing-review provenance or checking current official venue rules.

## Shared Registry

The authoritative CCFA source inventory is:

```text
../ccf-common/references/source-registry.yaml
```

Do not duplicate long URL lists in this skill. Human repository maintainers may
add or update public source records in the shared registry and run repository
checks outside an ScienceEvolve role invocation. Review agents should treat the
registry as read-only and must not run skill-forger/skill-creator validation.

## Writing-Reviewer Use Rules

- Use official venue criteria for template, anonymity, page limit, artifact, ethics, and formatting rules when current-year policy matters.
- Verify official pages again when the user asks for latest-year requirements, review forms, page limits, anonymity, artifacts, ethics, or deadlines.
- Use CS paper-reading, peer-review, and author-guideline sources as method scaffolds, not as venue-specific scoring rules.
- Use CSPaper-style calibration only as a conceptual model for consistent diagnostic signals; do not claim exact percentiles or acceptance probability without a real calibration dataset.
- Convert every writing deduction into a location-specific revision action so
  Main can decide whether to feed it to `ccf-paper-writer`.
- For LaTeX/format issues, prefer the target venue's official template first; use ACM/IEEE author resources only when they match the user's venue family or provide general source-audit scaffolding.
