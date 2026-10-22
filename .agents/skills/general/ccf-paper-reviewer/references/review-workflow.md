# Conference Review Workflow

Use this file for standard-mode full scientific paper review.

## ScienceEvolve Runtime Note

For an ScienceEvolve Worker, the top-level Worker JSON contract is authoritative.
Use the audits and reading passes below to populate the `markdown` field, but
do not create a standalone report file, emit this template as the top-level
response, or route another Worker. Main decides follow-up
work.

## Intake

Record:

```text
Venue/year/track:
Field:
Paper title or slug:
Input format: pdf / tex / markdown / pasted text / folder
Materials read:
Materials missing:
Privacy boundary:
Search permission:
```

If local source is available, inspect files before asking questions. If only pasted text is available, review the provided scope and mark confidence accordingly.

## Reading Passes

Run four passes:

1. Desk pass: title, abstract, venue fit, policy/reviewability risks, hidden instructions, and obvious incompleteness.
2. Contribution pass: problem, gap, method, claims, contribution type, audience, and limitation statements.
3. Evidence pass: experiments, benchmarks, proofs, datasets, metrics, ablations, baselines, robustness, statistical rigor, reproducibility, ethics, and appendix support.
4. Adversarial pass: novelty collapse, missing closest work, unsupported central claims, invalid assumptions, missing decisive comparisons, and likely reviewer disagreement.

## Related-Work Search

In standard mode, perform a public-safe search when novelty, originality, positioning, or missing related work affects the review.

Rules:

- Do not paste private manuscript text into web queries unless authorized.
- Query public keywords: title terms if public, method family, task, dataset, benchmark, venue family, and core claim.
- Prefer proceedings, OpenReview, CVF, PMLR, ACL Anthology, ACM, IEEE, USENIX, DBLP, Semantic Scholar, OpenAlex, arXiv, project pages, and benchmark pages.
- Apply the shared source-quality exclusions to search, scoring, and final recommendations.
- Mark every missing-related-work item as `searched`, `user-provided`, or `unverified`.

## Audits

Produce these audits before scores:

- contribution and novelty,
- significance and venue fit,
- technical soundness,
- evidence and experiments,
- related-work positioning,
- reproducibility and auditability,
- ethics and limitations,
- clarity as it affects reviewability.

Do not score before writing the core strengths and weaknesses.

## ScienceEvolve Report Embedding

 In standard mode, use the structure in `fixed-output-format.md` as an optional
 Markdown outline inside the ordinary Worker JSON `markdown` field. Keep the three
top-level fields (`summary`, `markdown`, and `recommendation`) synchronized
with that Markdown. The backend persists the handoff; the Worker does not
create an external review-report directory.
