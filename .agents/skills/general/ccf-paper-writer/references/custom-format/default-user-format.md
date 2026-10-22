# Default User-Custom Writing Format

Use this writing-style reference whenever the user asks for paper writing, planning, polishing, or review but does not specify a target venue, journal, or conference. It supplies the user's preferred prose, story shape, and exemplars; it does not replace the default LaTeX template. State the assumption: "No target venue was specified, so I am using the user-custom writing style with the default NeurIPS template."

In ScienceEvolve, this custom format is a writing aid, not a hidden review or
workflow gate. Return the assigned manuscript and list evidence gaps for the
system Controller; do not require a self-review loop, a score, compilation, or
a sibling agent call unless the Controller explicitly assigns it.

## Template Selection

For a from-scratch LaTeX manuscript without a user-specified venue or format,
use `ccf-latex-templates/NeurIPS/neurips_2026.tex`. The custom exemplars below
may shape the prose and narrative, but they do not replace the NeurIPS template.
A user-specified venue or output format always takes precedence.

## Source Exemplars

The current custom format is distilled from two user-provided exemplar cards:

- ICLR family: `references/exemplars/cards/llava-4d.md`
- CVPR: `references/exemplars/cards/vggt.md`

These are not ordinary venue-best-paper defaults. They are the user's own preferred writing examples. Load both cards before drafting unless the user asks to exclude one.

## Writing Shape

Use this structure:

1. Task and capability gap: begin from a concrete capability the field cares about, then show why current systems fail in a physical, dynamic, geometric, or deployment-relevant setting.
2. Prior-work ladder: present prior work as successive partial progress, not as a citation list.
3. Root challenge: identify the missing representation, missing output family, missing temporal/spatial reasoning, or missing direct prediction path.
4. Core insight: express one observation that makes the method feel inevitable.
5. Mechanism preview: name the main modules by their roles in the story.
6. Evidence promise: map each contribution to a measurable task, ablation, benchmark, qualitative example, or downstream use.
7. Boundary: explicitly avoid claims that require an actual target venue, uncollected experiments, or unsupported novelty.

## Section Defaults

Abstract:

- One sentence for the capability gap.
- One sentence for the limitation of current approaches.
- Two to three sentences for method mechanism and outputs.
- One sentence for dataset, benchmark, or evaluation package if present.
- One sentence for results or expected evidence, calibrated to the actual proof available.

Introduction:

- Paragraph 1: field momentum and why the problem matters.
- Paragraph 2: prior-work ladder and remaining failure mode.
- Paragraph 3: root observation or design insight.
- Paragraph 4: method overview with modules and output definitions.
- Paragraph 5: contribution bullets, each linked to evidence.

Method:

- Define inputs and outputs before architecture.
- Explain the representation or token family before fusion or training details.
- Separate model, data, training, and inference if all exist.
- Use module names that reflect reviewer-facing function.

Experiments:

- Main comparison first.
- Then ablations tied to contribution bullets.
- Then qualitative examples that expose the motivating failure mode.
- Then efficiency, scaling, or downstream evidence if claimed.
- Then limitations and failure cases.

## Closed-Loop Generation

If the user explicitly asks for a self-review, the following loop is available
as an internal diagnostic. Otherwise skip it and return the manuscript:

1. Draft using this custom format.
2. If requested, simulate reviewer views and record their evidence-based risks.
3. If requested, assign a diagnostic score with reasons.
4. Revise high-severity writing issues only when the assignment asks for a
   revision; otherwise list them for Main.
5. Do not repeat the loop solely to satisfy a template.

## Citation Rules

When using this custom format, follow the citation workflow in `references/citation-workflow.md`:

- The introduction may use12-20 citations when the evidence warrants it; these
  are not a numeric gate.
- Related Work may use3-8 citations per topic group when the topic breadth
  requires it; never add citations only to reach a count.
- Every baseline, dataset, and borrowed module must be cited.
- Use claim-first citation style: the sentence makes its point, then the bracket provides attribution.
- Do not use "Author et al. [N]" as a sentence subject. Use the finding or method as the subject.
- No `\textbf{Label:}` scaffolding in prose paragraphs. Write continuous arguments.
- Treat total citation count as a diagnostic signal, not a completion gate.

## Output Contract

When this default writing style is active, return:

1. The requested manuscript or revision in its requested format.
2. A concise evidence-gap note when needed.
3. The custom-format assumption only when it helps explain an output choice.
4. Review score or critique only when explicitly requested or assigned by the Controller.

## Maintenance

The custom exemplar list is intentionally easy to edit. To add or remove future examples, use the separate skill `custom-exemplar-curator`. That skill should generate candidate cards, schemas, and edit instructions for the user to review manually; it should not silently change the custom exemplar set.
