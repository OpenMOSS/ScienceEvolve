---
name: sci-immune-immune-repertoire-generation-selection-workf-d6ac3ffe
description: Decompose observed repertoire diversity into generation versus selection mechanisms using pre-selection proxies, comparative contexts, and repertoire-to-function mapping.
scienceevolve-title: "Antibody and immune recognition · immune repertoire generation selection workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design research questions and non-operational study plans for repertoire-like biological systems where observed diversity may reflect upstream generation, downstream selection, or their interaction. The goal is to distinguish generation bias from selection filtering, map repertoire composition to functional outcomes, and iterate hypotheses without overclaiming.

# When to use

Trigger this skill when the user asks to:

- Propose research questions in immune repertoire, somatic diversification, cell-state filtering, microbial or viral population filtering, synthetic variant-library selection, or evolutionary studies.
- Design studies that separate generation bias from selection or filtering.
- Interpret biased usage, enrichment, depletion, retention, or unexpectedly conserved patterns.
- Build a hypothesis portfolio with evidence strength, key assumptions, and failure modes.
- Plan minimal and stronger validation designs with controls and stopping rules.

Do not use this skill for clinical decision-making, operational wet-lab execution, or high-risk experimental protocols. Outputs must remain research-planning artifacts.

# Inputs required

Before producing a final plan, request or identify:

- Target system, organism, cell type, molecule class, or synthetic library.
- Diversity-generating mechanism and the final selected output or observed repertoire.
- Available or plausible proxy for the pre-selection or weakly filtered population.
- Contexts or environments expected to impose different filters.
- Feature classes to analyze, such as gene segment, sequence motif, length, charge, structure, pairing, expression, survival, or function.
- Data sources, annotation tools, inclusion criteria, and known technical limitations.
- Practical constraints, including biosafety, ethics, access, budget, timeline, and data-sharing limits.
- Intended output: research question list, hypothesis portfolio, experimental design, analysis plan, or iteration roadmap.

If critical inputs are missing, state assumptions explicitly and lower the evidence strength of resulting hypotheses.

# Core Workflow

1. **Define the biased output and biological question**
   - Identify the final population, phenotype, or repertoire state that appears enriched, depleted, structured, or unexpectedly conserved.
   - Frame the question in terms of generation bias, selection filtering, mixed mechanisms, or technical artifact.

2. **Characterize the generation process**
   - Determine how raw diversity is produced before downstream filtering (e.g., recombination, mutation, synthesis, sampling, diversification, or library construction).
   - Identify measurable proxies that approximate the immediate post-generation output with minimal downstream filtering.
   - **Gate:** If no plausible pre-selection proxy exists, stop and redesign the study scope or accept higher uncertainty.

3. **Establish comparative contexts**
   - Select contexts expected to alter generation, selection, or both.
   - Ensure comparability in measurement, annotation, and feature space across contexts.
   - **Gate:** If contexts differ in unmeasured confounders, flag limited interpretability and treat comparisons as exploratory.

4. **Build the comparison matrix**
   - Compare pre-selection proxy versus selected output within the same context.
   - Compare pre-selection proxies across contexts to infer generation differences.
   - Compare selected outputs across contexts to infer combined generation and selection differences.
   - Map feature-level distributions within each comparison.

5. **Discriminate mechanisms**
   - **Generation-only:** proxy and output shift together across contexts.
   - **Selection-only:** proxy remains similar while output changes.
   - **Mixed:** both proxy and output differ, but output shows stronger or feature-specific change.
   - **Artifact:** pattern disappears after coverage, annotation, sampling, or batch checks.
   - **Gate:** If mechanism classification is ambiguous after initial comparison, proceed to stronger controls rather than broadening the claim.

6. **Map repertoire to function**
   - Link feature classes or clonal groups to functional readouts without assuming equivalence.
   - Distinguish recognition breadth from functional breadth.
   - **Gate:** If functional linkage is absent, restrict claims to repertoire composition only.

7. **Validate with staged controls**
   - **Minimum viable validation:** one pre-selection proxy, one selected output, one context or feature contrast, a predefined null model, coverage and annotation checks, and a stopping rule for ambiguous results.
   - **Strong controls:** replicated sampling across independent units; positive and negative controls for expected enrichment or depletion; technical controls for capture, annotation, batch, and duplication artifacts; independent validation of at least one predicted enriched and one predicted depleted feature class.
   - **Gate:** If positive controls fail or negative controls match target signal, stop and redesign.

8. **Iterate by failure mode**
   - **Refine:** enrichment exists but specificity, diversity, or context evidence is incomplete → add the control that targets the dominant ambiguity.
   - **Pivot:** target presentation, proxy validity, or biological rationale appears inadequate → redesign the generation proxy or selection readout.
   - **Stop:** target and negative controls are indistinguishable, validation repeatedly fails, or results are dominated by non-specific artifacts.
   - **Update:** re-score each hypothesis after new evidence; split hypotheses into narrower subhypotheses if patterns change by feature class.

9. **Bound the claim**
   - Limit conclusions to the tested system, context, and feature space.
   - Separate paper-verified observations from new agent-generated hypotheses.
   - Stop generalizing when evidence strength, coverage, or context comparability is insufficient.

# Output Format

When using this skill, return the following structure:

1. **Research questions**
   - 3–5 prioritized questions.
   - For each: why it matters, what mechanism it targets, and what output would support or weaken it.

2. **Hypothesis portfolio**
   - Table with hypothesis, mechanistic rationale, evidence strength, key assumptions, likely failure modes, and boundary conditions.

3. **Minimum viable validation plan**
   - Pre-selection proxy, selected output, context or feature contrast, controls, metrics, and stop conditions.

4. **Strong-control extension**
   - Additional controls, replication, independent validation, and artifact checks.

5. **Analysis plan**
   - Comparison matrix, feature-level tests, uncertainty treatment, visualization strategy, and evidence-scoring rules.

6. **Iteration roadmap**
   - What result would increase, decrease, or split confidence in each hypothesis.

7. **Validity and safety check**
   - Confounders, proxy assumptions, ethical or biosafety boundaries, and claims that should not be generalized.

# Validation Gates

- **Proxy validity gate:** The pre-selection proxy must be plausibly less affected by downstream filtering than the final output. If proxy validity is uncertain, downgrade evidence strength.
- **Context comparability gate:** Compared contexts should differ primarily in the hypothesized filter. If unmeasured differences dominate, flag as a boundary condition.
- **Mechanism discrimination gate:** Patterns must survive coverage, annotation, batch, and sampling checks before mechanism assignment.
- **Functional linkage gate:** Repertoire-to-function claims require orthogonal validation; binding or recognition breadth alone does not establish functional relevance.
- **Reproducibility gate:** Results must be robust across independent samples, datasets, or batches before confidence is increased.

# Claim Boundaries

- Distinguish repertoire composition claims from functional mechanism claims.
- Treat single-system findings as context-specific evidence, not domain consensus.
- Do not infer clinical utility, diagnostic performance, or therapeutic relevance from repertoire or binding data alone.
- Separate sequence similarity, structural plausibility, and functional activity into distinct evidence levels.
- Label new hypotheses as inferred and uncertain until independently validated.

# Failure Modes

- **Proxy failure:** Pre-selection proxy is contaminated by downstream selection, making generation and selection indistinguishable.
- **Context confounding:** Compared contexts differ in unmeasured variables that independently alter repertoire composition.
- **Technical artifact:** Patterns driven by sampling depth, capture bias, annotation errors, batch effects, or clonal duplication.
- **Overgeneralization:** Extending findings from one model system, donor set, or engineered substrate to broader populations without validation.
- **Functional decoupling:** Repertoire feature correlates with but does not cause the functional outcome.
- **Premature convergence:** Selecting a single dominant clone or feature class without assessing diversity or independent replication.

# Validity Checks

Before finalizing a plan or interpretation, verify:

- **Confounding:** Can sampling depth, capture bias, annotation errors, batch effects, or clonal duplication explain the pattern?
- **Proxy validity:** Is the pre-selection proxy plausibly less affected by downstream filtering in this system?
- **Context comparability:** Are compared contexts different mainly in the hypothesized filter, or in many unmeasured ways?
- **Feature specificity:** Is the proposed mechanism tied to a measurable feature class rather than broad abundance alone?
- **Statistical validity:** Are tests appropriate for sparse categories, multiple comparisons, and dependent observations?
- **Reproducibility:** Are inclusion criteria, annotations, feature definitions, and analysis decisions traceable?
- **Evidence separation:** Are paper-verified observations clearly distinguished from new agent-generated hypotheses?
- **Risk boundary:** Does the plan avoid clinical advice, operational protocols, and directly executable hazardous parameters?

# Provenance

- Synthesized from cluster 56 / subcluster 56.0.split0.
- Source skills: repertoire-generation-selection-exploration (71e6df01e65dbc30), carbohydrate-antibody-discovery-workflow (c14c3bcc04303c80), hiv-vaccine-epitope-breadth-exploration (a435e237eff98402), recombinant-antigen-discovery-workflow (c7c7af5a0e4740cf), target-anchored-antigen-binder-discovery (767081514ab02bae), recombinant-autoantibody-repertoire-audit (55e8a8d455407baf), b-cell-receptor-editing-research-flow (a0aa788045574364), conserved-immunology-homolog-discovery (3782fb119b3f2ceb).
