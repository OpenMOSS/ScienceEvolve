# Writing Checklists

Use this file to prevent omissions during planning, drafting, revision, score-risk auditing, and final readiness checks. Load `../../ccf-common/references/task-modes.md` when deciding quick versus standard mode. For writing tasks, this checklist is usually internal. Show checklist status only when the user asks for audit/rationale, when the output feeds another CCFA skill, or when an unresolved risk affects reliability.

In ScienceEvolve, these are internal writing checks. They do not create a stage gate,
require a compile loop, or trigger another agent. Return the requested Worker
artifact with any unresolved evidence listed for the system Controller.

## Quick Mode Checklist

Use this for one paragraph, one small subsection, or single-pass polish:

- Venue or style assumption is clear enough for the local edit.
- Paragraph or subsection role is identified.
- Technical meaning, results, datasets, baselines, and conclusion direction are preserved.
- Local claims are supported, softened, or flagged.
- No citation, result, experiment, or reviewer impact is invented.
- Prose follows `prose-quality-guardrails.md`: no defensive framing, label-heavy symbols, number-only abstract style, third-person manuscript voice, or punctuation-driven structure.
- Full paper storyline, full score-risk loop, and final-readiness checks are skipped unless the user requests standard mode.

Visible output default: put the revised text first and preserve the user's original Markdown/LaTeX/citation format. Use this compact status only when useful:

```text
Mode: quick
Local checks:
Skipped standard checks:
Unresolved:
```

## Standard Mode Checklist

Use the remaining checklist sections for full sections, whole papers, score-risk work, final readiness, literature-linked writing, or output that feeds another CCFA module.

## Intake Checklist

- Target venue, track, and paper type are known, or the user-custom format is explicitly assumed.
- Deadline pressure and desired output granularity are known: plan, rewrite, line edit, review, or final check.
- Available materials are listed: manuscript, appendix, figures, tables, reviews, code, experiments, references, style exemplars.
- Missing materials that affect confidence are named.
- Claims that cannot be verified from provided materials are not treated as facts.

## Venue And Style Checklist

- Venue family is mapped with `ccf-a-venue-map.md` when a CCF-A target is named.
- Venue expectations are selected from `venue-adapters.md`.
- If a manuscript is requested and no venue is named, use the default LaTeX
    template `ccf-latex-templates/NeurIPS/neurips_2026.tex`; user-custom
    exemplars may guide prose and story shape without replacing the template.
- If a target venue is named but no local venue guide exists, preserve the
  requested source format and record the unresolved format question for Main.
- Exemplar cards are used only for writing moves, not wording or technical content.
- Venue-specific evidence package is visible: baselines, ablations, proof, user study, systems evaluation, security threat model, visual evidence, or theory proof as appropriate.

## Global Story Checklist

Every major output must preserve this chain:

```text
task -> gap -> root challenge -> insight -> method mechanism -> evidence -> limitation
```

Check:

- The problem is concrete enough for the venue's audience.
- The gap explains why prior work is insufficient.
- The root challenge is technical, scientific, empirical, or human-centered, not just "existing methods fail."
- The insight explains why the proposed method should work.
- The method mechanism connects to the insight.
- The evidence package tests the central claim.
- The limitation bounds the claim honestly.

## Section Revision Checklist

- The section role is named before revision.
- Each paragraph has one main message.
- The first sentence of each paragraph signals that message.
- Terminology is stable across sections.
- Previously defined concepts are not repeated without adding new logic.
- Transitions show cause, contrast, consequence, refinement, or example.
- Sentence lengths vary naturally; the paragraph does not repeat the same syntactic template.
- Figures and tables are introduced before interpretation.
- Captions state what the reviewer should learn.
- The section ends with the intended next-step logic when appropriate.

## Prose Quality Checklist

Use with `prose-quality-guardrails.md` before calling a draft polished:

- The manuscript speaks from the authors' scientific position, not from a third-person report about "the paper" or imagined reviewers.
- The abstract contains task, gap, insight or method, evidence, and scope; it is not a column of numbers in sentence form.
- `Q1`, `Q2`, `C1`, `C2`, `RQ1`, and similar labels are absent from running prose unless explicitly required.
- Equations, theorems, and symbols are introduced with their scientific purpose and do not appear as dense blocks without narration.
- Quotation marks, colons, dashes, slashes, arrows, and bracketed labels are not used as substitutes for logical transitions.
- Long compound sentences are split when they mix motivation, mechanism, evidence, and conclusion.
- Canonical terms are used consistently across abstract, introduction, method, experiments, and conclusion.
- Strong claims avoid hype and are scoped to available evidence.
- Each paragraph progresses by cause, contrast, refinement, example, or consequence.

## Claim-Evidence Checklist

For every major Abstract, Introduction, and Conclusion claim:

```text
Claim:
Location:
Evidence:
Evidence type:
Support level: strong / adequate / weak / absent
Required action:
```

Rules:

- Supported claims may be sharpened.
- Weakly supported claims must be narrowed or tied to stronger evidence.
- Unsupported claims must be removed, weakened, or marked as requiring new evidence.
- Evidence hidden only in the appendix must be signposted in the main text.

## Reviewer-Risk Checklist

Scan for:

- unclear contribution,
- weak novelty positioning,
- missing or stale related work,
- significance unclear for the venue,
- unsupported central claim,
- weak baseline,
- missing ablation, proof, user study, or system evaluation,
- unfair protocol or metric,
- reproducibility gap,
- figure/table readability issue,
- overclaim,
- generic limitation,
- ethics or responsible-research issue,
- venue mismatch.

## Score-Lifting Checklist

Use with `score-lifting-loop.md` for internal diagnostic feedback. The system Controller decides
whether to call `ccf-paper-reviewer`, `ccf-literature-searcher`, or
`ccf-experiment-designer`; Writing records the blocker and does not invoke a
sibling route itself.

- Current likely score or stance is stated.
- Target score or readiness threshold is stated.
- Top score blockers are ranked by severity.
- Each blocker has a fix class: writing-fixable, analysis-fixable, citation/positioning, figure/table, reproducibility, requires-new-result, accepted-limitation, or venue-mismatch.
- Literature-search, experiment-design, and compression blockers are separated from ordinary prose fixes.
- Writing-only fixes are separated from fixes requiring new experiments, proofs, studies, or baselines.
- Conditional review-risk effect is attached only to concrete changes.
- After revision, the same reviewer concern is re-tested.

## Final Readiness Checklist

Before calling a paper or section ready, check:

- The target venue/custom format is clear.
- The global story is internally consistent.
- The prose quality checklist has no high-risk pattern remaining.
- Central claims have visible support.
- Closest prior work and strongest baselines are handled.
- Venue-specific evidence is visible in the main paper.
- Limitations are honest and bounded.
- Reproducibility and ethics details are present where relevant.
- No high-severity issue remains unlabeled.
- The worker summary states any skipped checks and unresolved risks when they
  affect reliability; unresolved evidence does not prevent returning `paper.tex`.

## Minimal Checklist Status

Use this compact status when output space is limited:

```text
Checklist status:
- Venue/style:
- Storyline:
- Section roles:
- Prose quality:
- Claim-evidence:
- Reviewer risks:
- Score-risk:
- Final readiness:
- Unresolved:
```
