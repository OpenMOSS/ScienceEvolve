# Length Budget Policy

Use this file whenever drafting, expanding, compressing, or submission-preparing a full manuscript.

## ScienceEvolve Runtime Note

In ScienceEvolve this file is advisory rather than a stage gate. Apply a page or
word budget only when the user or Main assignment names one, or when a target
venue makes the constraint relevant. Do not infer a hidden submission target
from a short request, and do not delay the Writing result while measuring pages.
The Worker returns the requested source and generated files in its persistent
shared workspace. A Worker may compile the source when the assignment needs
that check, but the backend does not compile it asynchronously, publish a
canonical artifact, or create a compilation gate.

## Core Rule

A venue-aware paper draft may target the venue's usable main-body budget when
that constraint is part of the assignment. A short idea is not permission to
invent a short paper when the user asked for a complete manuscript, but neither
is an implicit page target a reason to pad the text. Expand with
evidence-bound content, `TBD` placeholders, and concrete experiment/analysis
scaffolds rather than inventing results.

**When an explicit AI-conference page limit applies, it normally covers main
text only; references, appendix, acknowledgements, and standalone limitations
sections may be excluded according to the current venue policy.** Use the
available budget to add substantive evidence-bound content when useful, but do
not pad an ScienceEvolve manuscript or treat unused space as a failure by itself.

## Budget Setup

Before full-manuscript drafting, establish:

```text
Target venue:
Template / style:
Main-body page limit:
References counted? yes / no / unknown
Appendix counted? yes / no / unknown
Draft target:
Allowed draft tolerance:
Final submission target:
```

Use the venue guide first when a venue or explicit limit is supplied. If the
local guide lacks a clear page limit, record the uncertainty and let Main decide
whether a later compliance check is needed; do not infer a mandatory target or
route another agent from this reference.

Default draft targets:

- Strict page-limited submissions: when explicitly requested, use the venue's
  stated limit and leave room for the final compliance pass.
- Early internal drafts: choose a useful length for the evidence and requested
  output; there is no ScienceEvolve default percentage target.
- Demos, tutorials, or smoke tests: may be shorter only when the user explicitly says demo, sample, short, toy, or skeleton.
- Final submission: when the assignment is a submission package, keep the
  manuscript at or below the verified official limit after compression.

Slight mismatch is acceptable:

- Under target by <= 15%: acceptable for an internal draft if all required sections have substantive content.
- Under target by > 15%: expand only when the target is an explicit assignment
  requirement; otherwise record the missing detail as an evidence or scope note.
- Over target by <= 10%: acceptable for a draft; schedule compression only if
  the assignment requires it.
- Over target by > 10%: provide a compression plan or compress when requested;
  do not block the Worker result.

## Section Budget

For AI/ML/CV/NLP-style 8-10 page main-body papers:

| Section | Typical share |
| --- | ---: |
| Abstract | 0.15-0.25 page |
| Introduction | 1.0-1.5 pages |
| Related Work / Background | 0.75-1.25 pages |
| Method | 2.0-3.0 pages |
| Experiments | 2.0-3.0 pages |
| Analysis / Ablation / Limitations | 0.75-1.5 pages |
| Conclusion | 0.2-0.4 page |

Adjust by venue family:

- Systems/networking/security papers usually need more method, system design, threat model, implementation, and evaluation detail.
- Theory papers need theorem statements, proof ideas, and technical overview in the main text.
- HCI papers need research questions, participants, procedure, measures, ethics, and analysis method.
- Database/mining papers need problem formalization, algorithm details, complexity, datasets, baselines, and scalability analysis.

## Expansion Before Compression

If a full manuscript is under target, expand in this order:

1. Sharpen the Introduction challenge chain and contribution/evidence preview.
2. Add a focused Related Work contrast with closest-work groups.
3. Make the Method auditable: notation, module motivation, algorithm/pipeline, complexity, assumptions.
4. Add experiment setup details: datasets, metrics, baselines, implementation, hyperparameters.
5. Add main-result, ablation, robustness, efficiency, and failure-analysis scaffolds.
6. Add limitations, ethics/reproducibility, and appendix pointers where expected.

Allowed expansion content:

- Mechanism explanations derived from the user's idea.
- `TBD` placeholders for missing results, figures, and citations.
- Experiment-table templates with empty cells.
- Evidence requirements and planned analyses.
- Clearly marked assumptions.

Forbidden expansion content:

- Invented numerical results.
- Invented citations or baselines.
- Unsupported claims of novelty, superiority, or reviewer reaction.
- Padding, generic field background, or repeated motivation.

## Expansion Content Order

When a manuscript is under target, expand in this priority order---each step adds substantive content, not filler:

1. **Introduction bottleneck exposition:** explain why existing methods fail structurally, not just empirically. Add concrete path-length, complexity, or capability arguments.
2. **Background/Preliminaries:** add formal problem definition, notation, and structural analysis (e.g., complexity tables, dependency path arguments).
3. **Method detail:** add per-component motivation (why this module, what gap it fills), forward equations, and connection to the global insight.
4. **Experiment setup:** add dataset statistics, preprocessing details, baselines with rationale, metric definitions, implementation notes.
5. **Results and analysis:** add result tables, complexity comparisons, ablation motivations (why each test matters), and caveat notes.
6. **Discussion:** add architecture-level analysis (why it works, regime of applicability, failure modes).
7. **Limitations and ethics:** add concrete scope boundaries, failure-mode analysis, and domain-specific impact notes.
8. **References:** ensure all cited works appear in the bibliography with complete metadata.

## Length And Compilation Note

When writing a TeX file and a LaTeX engine is available, compilation may be
performed as an optional local inspection if the assignment asks for it. In
ScienceEvolve, never make compilation a Writing prerequisite and never enter a
compile/expand/recompile loop:

1. Return the source even when no compiler is available.
2. If compilation is assigned and available, run it as a Worker task and record
   the command and result in the shared workspace and Worker handoff.
3. If compilation is unavailable, record the environment blocker and request
   Controller or user help according to the workflow policy.
4. The system Controller decides whether a later revision or submission check is warranted.

If compilation is unavailable, estimate with section budgets and mark page count as `not compiled`.

## Output Status

For full manuscripts, include or record this only when a length constraint was
part of the assignment:

```text
Length budget:
Current length:
Status: underfilled / target-fit / draft-over / final-over / not compiled
Expansion or compression action:
Remaining evidence gaps:
```
