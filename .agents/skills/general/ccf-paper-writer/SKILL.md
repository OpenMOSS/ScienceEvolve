---
name: ccf-paper-writer
description: "Plan, draft, revise, polish, compress, and presentation-adapt CCF research paper text while preserving user-supplied idea scope and evidence. Use for paper writing, abstract/introduction/related work/method/experiment writing, polishing, page/word compression, slides/poster/talk/Q&A preparation, 润色论文, 写作, 压缩论文, 报告展示. Do not perform full review, evidence audit, submission-package checks, or rebuttal as the main task."
metadata:
  ccf_skill_controls:
    handoff_question_mode: partial
    respect_session_denylists: true
    protect_idea_scope_in_writing: true
    private_material_safety: moderate
    shared_controls: ../ccf-common/references/
---

# CCF Paper Writer

## ScienceEvolve Integration (Authoritative)

When this skill is loaded by the ScienceEvolve Writing Agent, the ScienceEvolve project
record and the current Main assignment take precedence over the generic CCFA
workflow language below.

- Read the inbox and its context index first. Before drafting or revising,
  inspect every manuscript-relevant result listed under the Execution results,
  including the common project workspace, Execution handoffs, traces, and
  relevant files and results. These are the evidence source for the paper; do not
  infer that an experiment ran merely because it was planned.
- Treat the existing source in the common project workspace
  as the requested manuscript. Revise it in place when it exists and preserve
  valid scientific content. Do not create a parallel paper, status report, or
  Agent chronology.
- The system Controller chooses whether and when this Worker runs. Do not route to another agent,
  create a CCFA pipeline, maintain `ccfa.yaml` as workflow state, or add a
  stage gate of your own. Return the assigned writing result to Main.
- Keep the complete requested source and generated files in the common project
  workspace. Any Worker can write a paper when its prompt,
  Skills, and runtime permissions authorize it; a `writing` Agent is not
  required. If compilation is part of the assigned task, run it yourself,
  keep the resulting PDF beside the source, and report the command and
  diagnostic in the Worker handoff. The backend does not compile manuscripts,
  publish a canonical artifact, or apply a PDF gate.

## Invocation Controls

Use the task-mode and evidence guidance in `../ccf-common/references/` where it
helps the assigned writing task, but do not apply its handoff or routing
conventions. The system Controller owns every inter-agent transition.

This is the manuscript text owner. It also owns local compression and presentation adaptation because both change paper wording or paper-derived communication. Keep idea scope, method mechanism, experiments, numbers, and conclusions unchanged unless the user explicitly authorizes a research-scope change. Follow `../ccf-common/references/task-modes.md`, especially the output-flexibility rule: user-requested output format comes before this skill's internal checklist shape.

Do not invent results, baselines, experiments, reviewer impact, or missing evidence. For citations, never guess bib entries: search for the correct paper and obtain its bib entry before citing `references/citation-workflow.md`. Unsupported claims must be weakened, marked as needing evidence, or left unchanged with a risk note.

When running local writing self-review, score-risk checks, or reviewer-style revision loops, load `../ccf-common/references/review-output-standards.md`. Use scores as diagnostic feedback only; do not present them as acceptance probabilities.

## Core Rule

Write a scientific research article for the venue or format requested by the
user. Improve structure, section logic, paragraph roles, contribution framing,
claim-evidence alignment, reviewer-facing clarity, and concise presentation.
When no venue or manuscript format is specified, use the default NeurIPS LaTeX
template `ccf-latex-templates/NeurIPS/neurips_2026.tex`. The user-custom
exemplar cards may still guide prose and story shape, but they do not replace
that default template unless the user explicitly requests another format.
Do not silently substitute a CCF/NeurIPS template when the user specifies a
different venue, and do not turn a missing venue into a workflow blocker. Do
not use reference papers to copy wording, claims, examples, technical content,
or distinctive phrasing.

The visible output should feel like useful writing, not a process report. Use planning tables and checklists internally; show them only when the user asks for planning, audit status, or rationale.

Apply `references/prose-quality-guardrails.md` to all manuscript-facing prose. Avoid defensive or incremental framing, label-heavy symbols such as `Q1`/`C1`, formula dumping, number-only abstracts, punctuation-driven structure, overlong compound sentences, strange shorthand, third-person narration about "the paper", and unsupported hype. Prioritize cohesive paragraph logic, stable terminology, evidence-bounded claims, and varied sentence rhythm.

## Format And Output Policy

1. For polishing, rewriting, line editing, or compression of existing text, preserve the original format unless the user asks to restructure it. Keep LaTeX commands, section headings, citation keys, labels, equations, figure/table environments, Markdown headings, lists, and table shape intact whenever possible. Return the revised text in the same format first.
2. For one paragraph or one subsection, default to a direct improved version plus a short optional note only if a claim, number, citation, or meaning changed.
3. For a rough idea or "write from scratch" request, create the requested
   artifact rather than stopping at a plan. If the user names a target venue,
   use the matching local guide when it is available. If no venue is provided,
   use `ccf-latex-templates/NeurIPS/neurips_2026.tex` as the default LaTeX
   template and state that assumption briefly. User-supplied format and venue
   requests always take precedence; custom exemplars may guide style only.
4. If the user requests Markdown, Chinese prose, English prose, an outline, a full LaTeX file, a diff-style rewrite, or a section-only output, follow that request. Do not force the default CCF paper storyline order when the user's format is intentional.
5. Be flexible outside review tasks. When a choice could improve the paper but changes direction, present it as a concise question or option, for example: "可以把贡献改成 benchmark 视角吗？这会降低方法新颖性风险，但需要补数据集定位。"
6. Never invent results, baselines, experiments, reviewer impact, or missing evidence. Obtain correct citations through literature search per step5; never guess a bib entry. When evidence is absent, use `TBD`, a cautious placeholder, or a clearly marked "needs evidence" sentence.
7. Do not block drafting because current venue policy is not freshly verified. Use the local venue guide for draft shape and record any unresolved freshness or compliance issue in the worker summary so Main can decide what follows.
8. For full-paper requests, produce a full manuscript-level artifact: Abstract, Introduction, Background/Related Work or Preliminaries, Method, Experiments, Analysis/Ablation, Limitations, Ethics/Reproducibility when relevant, Conclusion, References, and Appendix/checklist placeholders if expected by the venue. Keep the manuscript sufficiently complete for the requested use; do not answer a full-paper request with only an abstract, outline, or short demo snippet.
9. If the manuscript needs more detail, expand with mechanism detail, related-work structure, experiment setup, analysis, limitations, or reproducibility notes grounded in available evidence. If it needs to be shorter, use local compression mode and `references/compression-rules.md`; never pad or invent evidence.
10. Keep outputs information-dense. Avoid boilerplate disclaimers and empty headings; each visible section should contain concrete paper content, evidence status, or actionable revision information.

## Modes

- `draft`: create or revise paper sections.
- `polish`: improve clarity, flow, terminology, and claim-evidence presentation.
- `compress`: shorten text to word/page limits using `references/compression-rules.md` without changing claims or numbers.
- `presentation`: convert a completed or near-completed paper into slides, poster, talk script, figure narration, and Q&A, without replacing submission review.

## Workflow

1. Identify mode, requested output format, target venue, paper type, draft state, available evidence, and whether idea-scope changes are authorized. Load `references/output-style-policy.md` whenever output format, source-format preservation, or from-scratch LaTeX drafting matters.
2. If the user supplied existing text, preserve its format and revise in place unless the user asked for a new structure.
3. **Select venue, template, and exemplars.** If the user names a target venue (e.g., "投CVPR", "for NeurIPS"), load the venue guide from `references/venue-guides/index.md` and the matched exemplar cards from `references/exemplars/index.md`. If no venue is specified, use `ccf-latex-templates/NeurIPS/neurips_2026.tex` as the default LaTeX template and load `references/custom-format/default-user-format.md` for optional user-custom writing exemplars. Exemplars affect writing moves and prose style, not the template, unless the user explicitly requests a different format. Consult `references/length-budget-policy.md` only when the user or the named venue supplies an explicit length constraint. A short seed idea must still become a complete manuscript when a full paper is requested; do not pad it to an implicit page target.
4. Build or update the global story with `references/storyline-blueprint.md`. For storyline generation, scientific storytelling, narrative design, paper/story structure, research insight framing, claim generation, abstract planning, or introduction planning, use its multi-expert storyline pipeline and expression logic. For ordinary drafting, use its compact arc: scientific origin -> knowledge gap -> scientific tension -> fundamental question -> core insight -> method mechanism -> evidence ladder -> bounded claim. Keep this internal unless the user asked for a plan.
5. **Prepare citations** (mandatory for full manuscripts and section drafts): load `references/citation-workflow.md`. Identify citation slots by section, search for literature for each slot when authorized, obtain correct bib entries, save them to the project `.bib` file, and insert cites naturally per the workflow. Do not guess a citation. If the closest competitor remains unknown, use an explicit placeholder or evidence-gap note and let Main decide whether more literature work is required.
6. For full-paper, abstract, introduction, method, experiment, conclusion, or exemplar-pattern tasks, load `references/prose-quality-guardrails.md` and `references/research-writing-patterns.md`, then draft or revise section by section using `references/section-modules.md` and `references/writing-checklists.md`. Apply compression or expansion only when an explicit user or venue length requirement calls for it.
7. For compression, load `references/compression-rules.md`; return compressed text in the same format and include a cut log only when requested or when content was materially removed.
8. For presentation adaptation, derive slides/poster/talk/Q&A only from the manuscript and supplied evidence, in the user's requested slide/poster/script format.
9. If current literature, baselines, or experiments are missing, record the evidence gap in the manuscript or result summary and let Main decide whether another agent is needed. Do not fill gaps by invention.
10. Before calling text ready, run the final prose self-audit in `references/prose-quality-guardrails.md`. Any review or further routing is decided by Main; do not invoke a CCFA handoff protocol yourself.

## Adaptive Output Contract

- Polish/rewrite/compress existing text: output the revised text first, in the same format. Add brief notes only for changed meaning, unsupported claims, or user-requested rationale.
- Draft from idea: output the requested artifact. For a manuscript request, default to a complete LaTeX research article using `ccf-latex-templates/NeurIPS/neurips_2026.tex` when no venue or format is specified, with explicit evidence boundaries and `TBD` placeholders only where evidence is genuinely missing. A user-specified venue or format takes precedence, and missing evidence never blocks returning the artifact.
- Section planning: output the section plan or paragraph roles only when the user asks for planning or the input is too incomplete to draft responsibly.
- Presentation: output slides, poster copy, talk script, or Q&A in the requested format.
- Full standard work may include a compact evidence-gap note in the worker summary; do not add a CCFA route or stage-state block to the manuscript.

## Reference Files

- `references/venue-guides/index.md` and `references/venue-guides/<venue>.md`: venue writing and format constraints.
- `ccf-latex-templates/NeurIPS/neurips_2026.tex`: default LaTeX template when the user/Main does not specify a venue or format.
- `references/output-style-policy.md`: user-format priority and edit-format preservation.
- `references/length-budget-policy.md`: optional venue length guidance and compression triggers; it does not require a local compile loop in ScienceEvolve.
- `references/research-writing-patterns.md`: section-level patterns, dense output rules, and exemplar-mode adaptation.
- `references/prose-quality-guardrails.md`: anti-defensive prose rules, paragraph cohesion, terminology consistency, evidence-bounded claims, sentence rhythm, and final prose self-audit.
- `references/storyline-blueprint.md`: whole-paper story, multi-expert storyline generation, scientific storytelling structure, and claim construction.
- `references/section-modules.md`: section drafting.
- `references/writing-checklists.md`: readiness checks.
- `references/score-lifting-loop.md`: score-risk improvement loop.
- `references/expert-review-loop.md`: reviewer-style self-check.
- `../ccf-common/references/review-output-standards.md`: quantitative feedback, reviewer-panel discipline, score-change conditions, and final output self-check.
- `references/compression-rules.md`: page/word compression.
- `references/table-style-guide.md`: LaTeX table beautification: booktabs rules, number precision, narrow-column fixes, caption style, and placement.
- `references/exemplars/`: style-move references; never copy content.
