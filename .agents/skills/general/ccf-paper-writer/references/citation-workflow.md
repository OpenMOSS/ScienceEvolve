# Citation Workflow

Use this file for every paper draft that requires references. The goal is to produce a manuscript where citations are plentiful, natural, and correct—not sparse and parenthetical.

## ScienceEvolve Runtime Note

Search and citation integrity remain important, but this reference does not
own inter-agent routing. If a source or literature search is missing, record a
precise evidence gap or placeholder and return the assigned `paper.tex`; Main
decides whether to schedule a literature or integrity agent. Do not block
Writing on a sibling handoff or a final submission check.

## Core Principle

**Search → Bib → Cite.** Never write a citation from memory or guess a bib entry. Every citation must originate from a verified bib entry stored in the project's `.bib` file.

## The Problem With Sparse Citations

A CCF-A submission with fewer than25–40 references (for AI/ML/CV/NLP papers) signals shallow literature engagement. The introduction and related work alone should carry15–25 citations. The method and experiments add another10–20. An under-cited paper reads as naive or uninformed.

## Citation Density Guidance

The table gives typical ranges for planning a broad paper. It is not a
validation schema or a minimum-count gate; relevance, correctness, and claim
coverage matter more than hitting a number.

| Section | Minimum citations | Typical range | What to cite |
| --- | --- | --- | --- |
| Abstract |0 |0 | Rarely needed; cite only a defining prior work if essential |
| Introduction |8 |12—20 | Field-defining works, recent progress, closest competitors, tools/datasets used |
| Related Work |15 |20—35 | Every discussed topic group gets3—8 citations |
| Method |3 |5—12 | Prior modules you build on, borrowed components, theoretical foundations |
| Experiments |3 |5—10 | Baselines, datasets, metrics, prior results you compare against |
| Conclusion |0 |0—2 | Only when naming a specific future direction tied to existing work |

For AI/ML/CV/NLP papers, a very small reference set can signal missing
positioning, but the count is only a diagnostic. Expand related work when a
claim or comparison needs support; never add references solely to reach a
threshold.

## Workflow

### Step1: Identify Citation Slots

Before drafting each section, scan for where citations are needed:

- **Introduction paragraph1 (task/momentum):**2—4 citations to field-defining or recent high-impact works.
- **Introduction paragraph2 (prior-work ladder):**3—6 citations to successive prior approaches.
- **Introduction paragraph3 (remaining gap):**1—2 citations to works that most closely approach the gap.
- **Introduction paragraph4 (method preview):**0—1 citation if building on a known architecture.
- **Related Work each topic group:**3—8 citations per group.
- **Method each borrowed component:**1 citation to the original source.
- **Experiments each baseline/dataset/metric:**1 citation.

Mark each slot with a placeholder: `[CITE: topic/need]`. Collect all placeholders before searching.

### Step2: Search For Literature

For each citation slot, determine the search strategy:

- **Known paper exists:** Use the exact title to find the bib entry via DBLP, Semantic Scholar, or arXiv.
- **Topic gap:** Record a targeted search request with the task area, year
  range, venue preference, and claim the citation should support. If a search
  tool or result is already supplied in the current assignment, use it; do not
  invoke or require another agent yourself.
- **Baseline/dataset:** Search for the official paper or technical report; prefer the venue version over arXiv when available.

Do not invent paper titles, author names, or bib keys. If a search returns nothing useful, mark the slot as `[UNFILLED]` and note the search attempted.

### Step3: Obtain Bib Entries

For every paper found, obtain a complete, correct bib entry. Preferred sources in order:

1. DBLP (most consistent formatting for CS venues)
2. Semantic Scholar API
3. Official venue proceedings page
4. arXiv export

A correct bib entry must include: author list (complete, not "et al."), title, venue abbreviation, year, and at minimum a DOI or URL. Do not truncate author lists with "and others."

Save every bib entry to the project's `.bib` file immediately. Use this naming convention for bib keys:

```
<firstauthor-lowercase><year><first-title-word>
```

Example: `vaswani2017attention`, `he2016deep`, `brown2020language`.

Maintain exactly one `.bib` file per paper project. Do not scatter references across multiple files.

### Step4: Insert Citations Naturally

This is the most important step. Citations must read as part of the narrative, not as parenthetical interruptions.

**Bad patterns to avoid:**

- ❌ "Gehring et al. (2017) proposed ConvS2S..." (author-name parenthetical)
- ❌ "ConvS2S was proposed by Gehring et al. (2017)..." (citation as afterthought)
- ❌ "In [17], the authors proposed..." (bracket-first, content-second)
- ❌ "Several works [1,2,3,4,5] have studied..." (citation-dump without narrative)

**Good patterns to use:**

- ✅ "Fully convolutional architectures [17] replaced recurrence with gated linear units..." (citation supports the claim, not the sentence structure)
- ✅ "The Transformer [1] established self-attention as the dominant sequence-modeling primitive..." (named method + citation)
- ✅ "Training deep networks became feasible with residual connections [2] and batch normalization [3]..." (two citations woven into one sentence)
- ✅ "Recent work has pushed this further through larger-scale pretraining [4,5] and architectural innovations [6,7]..." (grouped citations with a narrative spine)

**Rules for natural citation:**

1. Put the claim first, then the citation. The sentence should make sense without the brackets.
2. Use the method/dataset name as the subject when citing a well-known work: "BERT [8] introduced masked language modeling..."
3. When citing multiple works, group them by what they share: "contrastive objectives [9,10,11]" or "diffusion-based approaches [12,13]."
4. Do not repeat the same citation in consecutive sentences. Group related statements and cite once at the end.
5. In related work, each paragraph should cite3—8 distinct works.
6. Never use "et al." in the running text as a noun. Write "prior work on neural translation [17,18,19]" not "Gehring et al. [17]."

### Step5: Verify Citations

After drafting each section:

1. Check that every `\cite{...}` key exists in the project `.bib` file.
2. Verify that no citation is invented or guessed.
3. Use the per-section ranges as a diagnostic and confirm that important claims
   have support; there is no numeric completion gate.
4. Run a quick scan: does every factual claim about prior work have a citation?

### Step6: Update Bib File Continuously

As drafting progresses, the `.bib` file grows. After every writing session:

1. Deduplicate entries (same paper, different keys).
2. Normalize venue names (e.g., "Advances in Neural Information Processing Systems" → "NeurIPS").
3. Remove any entry not actually cited in the current draft.
4. Run `bibtex` or `biber` to catch formatting errors before submission.

## Coordination Notes

- **Before drafting:** If the paper's closest competitors, baselines, or
  related-work clusters are unknown, leave explicit placeholders or an evidence
  gap for Main. Do not draft with guessed citations.
- **During drafting:** As each section is written, fill citation slots using this workflow. Do not defer all citations to a final pass.
- **After drafting:** Main may schedule an integrity audit; Writing should only
  check the entries it can inspect in the current workspace.
- **Before submission:** Main may schedule a venue/package check. It is not a
  Writing prerequisite.

## Quick Checklist

```text
Citation slots identified: yes / no
All slots filled or marked UNFILLED: yes / no
Project .bib file exists and is current: yes / no
No citations invented or guessed: yes / no
Per-section density meets minimums: yes / no
Every \cite{} key exists in .bib: yes / no
Natural citation pattern (claim first, then cite): yes / no
No "Author et al. (Year)" as running-text subject: yes / no
```
