# Section Modules

Use this file when drafting, rewriting, or checking a specific paper section. Always connect section writing back to `references/storyline-blueprint.md`.

In ScienceEvolve, the ranges and checks below are guidance. Apply them when the
assignment names a venue or length constraint; they are not a hidden completion
gate, and missing evidence is reported to Main rather than routed by Writing.

Use the steps below as internal writing control unless the user asks to see the plan. For direct polishing, line editing, compression, or LaTeX revision, return the revised text in the user's original format rather than exposing paragraph-role analysis.

Also apply `references/prose-quality-guardrails.md`. Section drafting must avoid defensive framing, symbolic question/claim labels in prose, formula dumping, number-only abstracts, third-person manuscript narration, and punctuation used as a substitute for logic.

## Module Template

For any section:

1. Determine the section role in the whole-paper story.
2. Decide paragraph roles before writing.
3. Draft paragraphs one role at a time.
4. Check local flow: one paragraph, one message.
5. Check global flow: section supports the main story and venue plan.
6. Check prose quality: stable terminology, no unsupported hype, no unnecessary repeated concepts, and varied sentence rhythm.
7. Update claim-evidence and reviewer-risk maps.

Show steps 1-2 only when the user requested a plan, outline, diagnosis, or explanation.

## Section-Length Guidance (ICLR/NeurIPS/ICML, ~9-page main text)

These are real-world ranges based on analysis of published CCF-A papers. Use as guidelines, not strict rules — a section may be1 page longer or shorter depending on the paper type.

| Section | Typical Range | Notes |
| --- | --- | --- |
| Abstract |0.15--0.25 page | Approximately150--250 words. |
| Introduction |1.0--1.5 pages | Must include motivation, gap, insight, contributions. |
| Related Work |0.75--1.25 pages | Optional before or after Method; can merge with Background. |
| Background / Preliminaries |0.5--0.75 page | Formal problem statement, notation, path-length or complexity arguments. |
| Method |2.0--3.5 pages | The largest section. Per-component motivation, equations, architecture details. |
| Experiments |2.0--3.0 pages | Setup (0.5p), main results (1.0p), ablations and analysis (1.0--1.5p). |
| Discussion / Analysis |0.5--1.0 page | Architecture-level analysis, failure modes, limitations. |
| Conclusion |0.2--0.4 page | Restate insight and evidence; no new claims. |

**Guidance:** For a page-limited AI paper, the Method and Experiments sections
often occupy4.0--6.5 pages. Use that as a drafting signal only when a target
length is explicit; it is not a requirement for an ScienceEvolve result.

**Underfilled check (optional):** If an explicit assignment target makes the
draft materially short, expand Method and Experiments with evidence-bound detail
first. Never pad the paper merely to reach an inferred page count.

## Abstract

Goal: give reviewers the whole paper in one pass.

Recommended moves:

1. Task and importance.
2. Specific gap or technical challenge.
3. Core insight or contribution.
4. Method mechanism at a high level.
5. Evidence summary with cautious claims.

Checks:

- Does every major abstract claim appear later with evidence?
- Is the method name understandable without hidden context?
- Does the abstract fit target venue style: concise for systems, precise for theory, contribution/evidence-balanced for AI/CV/NLP?
- Is the abstract built around the scientific contribution rather than a dense list of numeric improvements?

## Introduction

Goal: create reviewer curiosity and make the contribution feel necessary.

Recommended paragraph roles:

1. Task/application/value.
2. Existing methods and their progress.
3. Remaining gap and root technical reason.
4. Insight and proposed method.
5. Contributions and evidence preview.

Citation rules:

- Every prior-work claim in the introduction must have a citation. A paragraph that describes what "existing methods" do without citing any is incomplete.
- The introduction often carries12-20 citations in a broad paper, but use that
  range only as a diagnostic. Do not count citations as a completion gate.
- Use natural citation weaving: claim first, citation second. "Large-scale pretraining on web-scale data [4,5] has become the dominant paradigm..." not "Brown et al. [4] and Chowdhery et al. [5] proposed..."
- Do not use more than one "Author et al. [N]" as a sentence subject per paragraph. Prefer "Self-attention mechanisms [1]..." over "Vaswani et al. [1] proposed..."

Checks:

- Does the core challenge appear early enough?
- Is the root technical reason explicit?
- Does the introduction avoid defensive or incremental framing?
- Are prior methods used to motivate the gap rather than dumped as citations?
  Expand only when important prior work or evidence is missing.
- Do contribution bullets map to Method and Experiments?
- Would a skeptical reviewer understand why the work is not a small patch?

## Related Work

Goal: make novelty easy to verify.

Recommended structure:

1. 2-4 topic groups.
2. For each group: paradigm -> representative methods -> limitation tied to this paper -> distinction.
3. End with the closest gap the paper fills.

Citation rules:

- Each topic group should cite enough distinct works to support its claims; a
  range of3-8 is a useful guide, not a hard minimum.
- A typical broad CCF-A Related Work section may carry20-35 citations, but
  completeness depends on coverage and correctness rather than a count.
- Every factual claim about a research thread must be supported by specific citations, not vague references to "prior work."
- Do not cite a paper simply because it is famous in the field. Every cited paper must be relevant to the specific point being made.
- The closest competitor must be cited and discussed explicitly in its own sentence or paragraph. Do not bury it in a citation list.

Checks:

- Are strongest and recent competitors included?
- If closest work is unknown or fast-moving, leave a precise citation gap for
  Main rather than inventing citations or invoking a sibling agent.
- Is the distinction technical, not marketing language?
- Does Related Work prepare the reader for the Method?
- Are citations complete for all background claims? Every topic group should cite3+ works; if any group has fewer, expand or merge groups.

## Method

Goal: make the mechanism auditable and reproducible.

Pre-writing questions:

1. What modules exist?
2. For each module, what is the workflow?
3. Why is the module needed?
4. Why should it work?
5. What assumptions, hyperparameters, or implementation details matter?

Recommended structure:

1. Overview: setting, core idea, pipeline figure, section map.
2. Module sections: motivation -> design -> forward process -> technical advantage.
3. Implementation details: reproducible specifics.
4. Complexity, assumptions, or proof sketch when relevant.

Citation rules:

- Any borrowed component, architecture, or technique must cite its original source. Do not describe a well-known module as if it were original.
- Method sections typically need5-12 citations: one for each borrowed module, one for the base architecture, one for the training objective if adapted, and one for the optimization method.
- When describing a novel module, cite the closest prior module it builds on or replaces. This helps reviewers understand the novelty.

Style rule:

- Do not use bold inline labels (`\textbf{Input:}`, `\textbf{Output:}`, `\textbf{Architecture:}`) in every paragraph. Write prose that flows: "The encoder takes a sequence of tokens and produces contextualized representations through stacked self-attention layers" rather than "`\textbf{Encoder:}` The encoder uses self-attention."
- Do not let theorem statements, equations, or notation blocks replace explanation. Introduce their purpose before the formalism and explain their role afterward.
- Avoid `Q1`/`C1`-style labels for modules or claims unless the venue or task convention requires them.

Checks:

- Can a reviewer reconstruct the pipeline from text and figure?
- Does each module have motivation and technical advantage?
- Are inputs, outputs, notation, and symbols defined before use?
- Are design choices later validated by ablation, theorem, analysis, or user study?
- Are citations present for every borrowed component? If not, search for sources before finishing.

## Experiments

Goal: prove the claims reviewers care about.

Recommended structure:

1. Setup: datasets, metrics, baselines, protocol, implementation.
2. Main comparison: answer whether the method works.
3. Ablation: answer why it works.
4. Analysis: answer when it works, when it fails, and how robust it is.
5. Qualitative or case studies when the venue expects them.
6. Limitations or failure cases if not placed elsewhere.

Citation rules:

- Every baseline, dataset, and metric must be cited. A results table without baseline citations signals incomplete work.
- Experiments sections often need5-10 citations for datasets, metrics, and key
  baselines, but add them because they are relevant, not to satisfy a count.
- When comparing against prior published results, cite both the method paper and the source of the specific numbers being compared.
- Do not cite a baseline without having its results to compare against unless it is marked as future work.

Checks:

- Does each claimed contribution have a corresponding experiment?
- If datasets, baselines, ablations, benchmark design, or result-table values
  are missing, record the need for Main. Do not invent values or invoke a
  sibling agent from this reference.
- Are baselines strong, recent, and fair? Is every baseline cited?
- Are metrics standard and sufficient?
- Are ablations tied to modules and design choices?
- Do tables and figures each have one message?
- Are negative or boundary results handled honestly?

## Figures And Tables

Goal: make the paper inspectable before close reading.

**For LaTeX table beautification details, always load `references/table-style-guide.md`. It covers booktabs rules, number precision, narrow-column fixes, wide-table handling, caption style, and placement.**

Structural rules:

1. Every figure/table should answer one reviewer question.
2. Captions should state what, where, and the key takeaway — go above tables.
3. Tables must use `\toprule`, `\midrule`, `\bottomrule` from `booktabs`; never `\hline` or vertical rules.
4. Numbers in the same column must have the same decimal precision.
5. Best results should be bolded; use one highlighting convention throughout.
6. Narrow columns: abbreviate, `\raggedright`, `\small`, or `\makecell` — never let the compiler produce underfull hboxes.
7. Wide tables: `table*`, `\small`, or abbreviated headers — never squeeze columns.
8. Pipeline figures should show data flow, modules, and outputs without overcrowding.
9. Qualitative figures should avoid cherry-picking by showing representative successes and failures when possible.

Checks:

- Can the paper's contribution be understood from figures and captions?
- Are key claims visible in tables or figures?
- Are visual examples aligned with the text discussion?
- Are all tables free of vertical rules and `\hline`?

## Conclusion

Goal: leave a precise final takeaway.

Recommended moves:

1. Restate problem and core method.
2. State the key insight or contribution.
3. Summarize strongest evidence.
4. Bound limitations.
5. Point to future work without adding new claims.

Checks:

- Does it match the paper's actual evidence?
- Does it avoid introducing new technical material?
- Does the limitation sound like scope boundary rather than hidden fatal flaw?

## Limitations, Ethics, Broader Impact

Use when the venue requires or expects these sections.

Checks:

- Are limitations specific and bounded?
- Are datasets, human subjects, privacy, security, misuse, bias, or environmental concerns addressed when relevant?
- Are claims weakened where the limitation narrows validity?
- Does the section improve reviewer trust rather than read like boilerplate?

## Small Paragraph Edit Mode

When the user gives one paragraph:

1. Identify paragraph role.
2. State the intended message in one sentence.
3. Check sentence flow.
4. Check term consistency.
5. Check whether the paragraph repeats a concept without adding logic.
6. Check whether claims are supported or need softer wording.
7. Rewrite with the same technical meaning unless the user asks for structural changes.

Visible output default: the rewritten paragraph only, preserving Markdown/LaTeX/citation formatting. Add a short note only if a claim was softened, a citation/result looked unsupported, or the user asked for explanation.

## LaTeX Drafting Mode

When the user supplies only an idea and asks for a paper draft:

1. Read the target venue guide from `venue-guides/index.md` when one is named;
   if the target venue is missing or unspecified, use
   `ccf-latex-templates/NeurIPS/neurips_2026.tex` as the default template.
2. Establish a venue length budget using `length-budget-policy.md` only when
   the assignment supplies an explicit constraint.
3. Use the venue's template path and section conventions for the visible LaTeX draft.
4. Keep missing results, citations, figures, and theorem/proof details as `TBD` placeholders instead of inventing them.
5. Prefer a full submission-shaped draft with real section content over a short compilable skeleton.
6. Include any venue-freshness, page-count, or missing-evidence note in the
   worker summary after the LaTeX output; a missing page count never blocks
   returning the canonical paper.
