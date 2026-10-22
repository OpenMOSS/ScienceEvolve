---
name: awesome-ai-research-writing-director
description: Help Main turn project evidence and reviews into precise scientific-manuscript assignments for Writing.
---

# Awesome AI Research Writing Director

This is a Main-only routing and task-framing skill. It teaches Main how to
commission Writing; it is not a drafting skill for the Writing worker.

## Routing boundary

- First decide the next agent from the actual scientific bottleneck.
- Never select Writing merely because this skill is loaded, an Execution run
  ended, or a manuscript exists.
- If a claim still lacks experiments, implementation, data, or verification,
  select Execution. Use this skill only after independently deciding that
  manuscript work is now the best next action.
- Main must not draft or edit the manuscript itself. When Writing is selected,
  return `nextAgent: writing` and use the method below to construct `task` and
  `successCriteria`.

## Inspect before commissioning Writing

Establish the following from the authoritative project record:

1. The current canonical `paper.tex` path, version, and valid content, if it
   exists.
2. The exact completed experiments, tables, figures, measurements, artifacts,
   and limitations that the manuscript may cite.
3. The research question, evidence-backed central claim, contribution boundary,
   and strongest comparison or ablation.
4. The latest applicable review and the concrete revisions it requires.
5. The target venue, language, format, and section or length constraint when the
   user has specified them.

Do not send Writing a claim that the record cannot support. If bibliographic
details are not verified, require an explicit citation placeholder rather than
an invented reference.

## Select a bounded writing operation

Choose one primary operation and add secondary passes only when they are needed
for the same canonical revision:

- **Scientific draft or structural revision:** organize the existing evidence
  around the research question, gap, central claim, contributions, methods,
  experiments, results, discussion, limitations, and conclusion.
- **Experimental analysis:** turn supplied results into a conclusion-first
  analysis of baseline or SOTA comparisons, sensitivity, efficiency tradeoffs,
  ablations, failure modes, and uncertainty.
- **Targeted contraction:** reduce length without removing technical details,
  parameters, qualifications, or the meaning of a claim.
- **Targeted expansion:** make an implicit premise, causal link, or conclusion
  explicit without adding data, novelty, mechanisms, or unsupported facts.
- **Academic-language polish:** improve grammar, precision, clarity, and flow
  with common, readable academic vocabulary while preserving established terms.
- **Logic red-line check:** change text only for a real contradiction,
  ambiguous reference, inconsistent terminology, broken argument, or serious
  language error; do not rewrite sound prose merely for variation.
- **Natural-prose pass:** remove empty grandeur, promotional language,
  mechanical transitions, repetitive templates, unnecessary emphasis, and
  ornamental complexity. Prefer semantic flow over transition-word stacking.
- **Figure or table caption integration:** write precise, self-contained
  captions that state what is shown, the comparison or setup, and the meaning of
  symbols or uncertainty without claiming more than the visual supports.
- **Reviewer-driven revision:** align introduction claims with experimental
  evidence, verify fair and complete baselines, separate repairable presentation
  issues from structural evidence gaps, and resolve each actionable weakness.

## README-derived writing rules to put in the assignment

Apply the rules relevant to the selected operation:

- Use concise, rigorous, coherent scientific prose and familiar words. Avoid
  inflated vocabulary when a direct term is available.
- Preserve the author's valid content and style. Make the minimum change that
  fixes the identified problem; do not substitute synonyms just to look edited.
- Keep normal manuscript prose in connected paragraphs unless a true algorithm,
  definition, or compact enumeration is clearer as a list.
- Avoid gratuitous bold, italics, quotation marks, and dashes. Express emphasis
  through the scientific argument.
- Preserve existing LaTeX commands, labels, references, and mathematical
  formulas. Escape LaTeX-special characters introduced by the revision.
- Do not expand a standard field abbreviation unless the manuscript needs the
  definition. Avoid informal contractions in English academic prose.
- By default, describe the method, architecture, and current experimental
  findings in the present tense; use another tense when chronology or a
  historical fact genuinely requires it.
- A shortening pass must retain every material result, experimental parameter,
  condition, and qualification. An expansion pass may expose only reasoning
  supported by the existing text and evidence.
- Experimental prose must be strictly data-grounded. Lead with the main finding,
  then give the decisive values or comparisons and the reasoning they support.
  Report uncertainty and efficiency tradeoffs when the record contains them.
- Captions must remain factual and self-contained. Do not use promotional verbs
  or vague claims in place of what the figure or table actually shows.
- Keep Agent names, invocation chronology, workflow gates, hashes, storage
  bookkeeping, and platform operations out of the scientific narrative except
  for indispensable reproducibility details.

## Construct the Main decision

The Writing assignment in `task` should contain, in this order:

1. **Objective and operation:** state whether Writing is drafting, revising,
   analyzing results, polishing, checking logic, naturalizing prose, or
   integrating captions.
2. **Canonical target:** require revision in place of the existing `paper.tex`,
   or creation of the first canonical `paper.tex`; never request a separate
   technical report.
3. **Authoritative evidence:** name the concrete results, artifacts, tables,
   figures, and review findings to use, plus the claims each can support.
4. **Scientific narrative:** state the research question, central claim,
   contribution boundary, and the section-level argument that needs work.
5. **Required changes:** list the smallest substantive changes needed and any
   review items that must be resolved.
6. **Constraints:** include the relevant rules above, the venue or format, and a
   prohibition on fabricated measurements and citations.
7. **Deliverable:** require exactly one complete, compilable canonical
   `paper.tex`, even when the primary operation targets only part of the paper.

Make `successCriteria` observable. It should check claim-to-evidence alignment,
resolution of named review issues, preservation of valid material, scientific
article structure, LaTeX integrity, and production of the canonical paper.
Do not use vague criteria such as “improve the paper.”

## Provenance

The method categories and editing principles above are an operational synthesis
of the README in
`https://github.com/Leey21/awesome-ai-research-writing`, reviewed at commit
`c07628b453309a1fb131ee105b2f01190162bc6c`. The README output wrappers were
adapted to ScienceEvolve: Writing must return the complete canonical manuscript, not
translation notes or a modification log.
