---
name: sci-dft-functionalization-organometallic-activation-mec-4085f949
description: A reusable end-to-end workflow for generating, testing, and validating mechanistic hypotheses in homogeneous catalysis and organometallic functionalization, from gap identification through iterative discrimination to claim bounding.
scienceevolve-title: "Organometallic catalysis and DFT · functionalization organometallic activation mechanism discovery"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

This skill guides agents through a reusable, non-operational workflow for mechanism discovery and validation in homogeneous catalysis and organometallic functionalization. It connects catalyst or ligand design, substrate scope, and reaction class to testable mechanistic hypotheses, controlled experimental plans, and bounded claims without reproducing any single paper's specific chemistry.

# When to use

Use this skill when:

- A user asks for new research questions in ligand-controlled catalysis, C–H activation, cross-coupling, cycloaddition, asymmetric synthesis, redox-neutral catalysis, or directed functionalization.
- The task requires translating literature patterns into testable hypotheses rather than summarizing known results.
- The agent must propose experimental plans at a design level, including controls, mechanistic probes, and iteration rules.
- The research question involves balancing activity, selectivity, substrate scope, catalyst stability, and mechanistic plausibility.

Do not use this skill as a substitute for domain-specific safety review, laboratory protocol development, or operational execution of hazardous chemistry.

# Inputs required

Before generating a research plan, collect or request:

- Target reaction class and desired bond-forming or bond-activating transformation.
- Candidate catalyst, ligand, or directing-group design space.
- Known benchmark systems and relevant comparison sets.
- Substrate, coupling-partner, or unsaturated-partner classes of interest.
- Available analytical or mechanistic probes at a high level.
- Safety, regulatory, and waste constraints relevant to the chemistry.
- Whether the goal is hypothesis generation, experimental planning, literature-gap analysis, mechanistic interpretation, or route design.

# Core Workflow

Follow this ordered end-to-end route. At each decision gate, satisfy the criteria before proceeding; otherwise, iterate, redesign, or stop.

## 1. Frame the gap and bound the design space
- Identify a synthetic or mechanistic limitation (e.g., strong-coordination requirements, poor functional-group tolerance, unresolved selectivity, prefunctionalization burden).
- Compare mature reaction manifolds with harder analogues (precious vs. first-row metal, C(sp²) vs. C(sp³), directed vs. nondirected, intramolecular vs. intermolecular).
- Define the boundary of the testable space: catalyst component class, reaction class, substrate panel, and benchmark set.
- **Decision gate — Gap Clarity:** If the question is not tied to a clear, falsifiable gap, stop and refine the research question.

## 2. Generate mechanistic hypotheses
- Propose causal hypotheses that link a catalyst/ligand/substrate descriptor to a specific step in the catalytic cycle (activation, partner transfer, bond formation, product release, or deactivation).
- Include at least one competing hypothesis that explains the same observable through a different pathway.
- Assign evidence strength (High / Medium / Low) based on direct precedent, analogy, or theory.
- List key assumptions (e.g., ligand stability, metal speciation, substrate compatibility) and likely failure modes (e.g., deactivation, unproductive binding, competing activation).
- **Decision gate — Distinguishability:** If hypotheses cannot be discriminated by the proposed controls and probes, redesign the hypothesis set before proceeding.

## 3. Design minimal viable validation
- Select a representative model system that contains the target activation site and the proposed selectivity handle.
- Define a non-operational variable matrix: catalyst/ligand class, substrate electronics/sterics, partner class, and directing-group geometry.
- Specify controls:
  - Positive / benchmark controls.
  - Negative controls (missing catalyst, missing directing group, inactive variant).
  - Mechanistic controls (geometry isomer, competing-pathway substrate, reagent-substitution).
  - Analytical controls.
- Define evaluation metrics: product formation, selectivity ratios, functional-group tolerance, mass balance, reproducibility, and mechanistic probe response.
- Define stop conditions: no product above background, controls invalidate the design element, selectivity collapses, mechanistic probes contradict the hypothesis, or safety constraints are violated.
- **Decision gate — Control Integrity:** If the plan lacks controls that can falsify the main hypothesis, redesign the experiment schema.

## 4. Collect outcomes and compare controls
- Record conversion, yield, selectivity, isomer distribution, byproduct profile, and mass balance.
- Compare every result against benchmark and negative controls before interpreting trends.
- **Decision gate — Background Check:** If product formation is not distinguishable from background or if controls fail, stop and audit confounders (purity, atmosphere, analytical artifacts).

## 5. Discriminate mechanisms and analyze
- Map outcome changes to catalytic-cycle steps:
  - Activation-limited: substrate or electrophile dependence.
  - Transfer-limited: coupling-partner dependence.
  - Elimination/release-limited: steric or geometric dependence.
  - Stability-limited: activity loss, precipitation, or inconsistent results.
- Triangulate evidence using orthogonal diagnostics (isotope effects, stereochemical probes, kinetic data, spectroscopic signatures, computational comparisons).
- Classify each result as Supports, Weakens, Contradicts, or Inconclusive relative to each hypothesis.
- **Decision gate — Mechanistic Resolution:** If the mechanism remains ambiguous after orthogonal probes, pause scope expansion and add discriminating experiments before optimizing.

## 6. Iterate or redesign
- Update evidence strength for each hypothesis based on the new data.
- Identify the most likely limiting step and revise one dominant mechanistic assumption per iteration.
- Select the next experiment that best distinguishes the top two remaining hypotheses.
- Iteration rules:
  - Activation appears limiting → tune electronic or binding-related descriptors.
  - Partner transfer appears limiting → tune lability, geometry, or partner compatibility.
  - Bond formation or product release appears limiting → tune steric and geometric descriptors.
  - Catalyst deactivation appears limiting → prioritize robustness or alternative architecture.
  - Evidence is inconsistent → audit controls, purity, and analytical methods before changing the chemical hypothesis.
- **Decision gate — Convergence:** If three iterative cycles fail to resolve ambiguity or if the key control shows the proposed design element is unnecessary, pivot to an alternative hypothesis or stop.

## 7. Bound claims and validate
- State boundary conditions: applicable ligand families, metals, substrates, reaction classes, and partner types.
- Separate claims by provenance:
  - Source-supported observations.
  - Literature-supported analogies.
  - Agent-inferred hypotheses requiring independent validation.
- Ensure mechanistic claims are supported by at least two independent lines of evidence or are explicitly labeled speculative.
- Confirm reproducibility across independent preparations before broad claims.
- **Decision gate — Claim Bounding:** If claims exceed the tested design space or lack sufficient evidence, downgrade them to plausible or speculative, or reject them.

## 8. Finalize recommendations
- Compile a ranked hypothesis table with updated evidence strength, assumptions, and failure modes.
- Summarize the experimental design schema, analysis plan, and iteration history.
- Issue a final recommendation for each hypothesis: **Advance**, **Revise**, **Pause**, or **Reject**.
- Flag safety, waste, and regulatory constraints that must be reviewed before any laboratory implementation.

# Output Format

When using this skill, return:

1. **Research question and bounded design space** — the gap, target transformation, and scope limits.
2. **Literature-gap analysis** — source-supported, literature-supported, and agent-inferred claims separated.
3. **Ranked hypothesis table** — hypothesis, mechanistic rationale, evidence strength, key assumptions, predicted discriminators, and likely failure modes.
4. **Experimental design schema** — minimal viable validation, variables, controls, evaluation metrics, and stop conditions.
5. **Analysis plan** — how outcomes map to catalytic-cycle steps, evidence classification, and uncertainty handling.
6. **Iteration plan** — decision rules for positive, negative, mixed, and irreproducible results.
7. **Validation gates summary** — which gates were passed and which require revisit.
8. **Final recommendation** — advance, revise, pause, or reject for each hypothesis, with claim boundaries and safety notes.

# Validation Gates

- **Gap Clarity Gate:** The research question addresses a clear synthetic or mechanistic limitation and is not merely a restatement of a known result.
- **Distinguishability Gate:** Hypotheses are mechanistically specific and can be discriminated by at least one proposed control or probe.
- **Control Integrity Gate:** The design includes positive, negative, mechanistic, and analytical controls capable of falsifying the main hypothesis.
- **Background Check Gate:** Product formation and selectivity are distinguishable from background, decomposition, and analytical artifacts.
- **Mechanistic Resolution Gate:** Mechanistic claims rest on orthogonal evidence types, not solely on yield or conversion.
- **Convergence Gate:** Iteration converges toward a refined hypothesis within a bounded number of cycles; persistent ambiguity triggers a pivot or stop.
- **Claim Bounding Gate:** Conclusions are explicitly limited to tested substrate classes, catalyst families, and reaction contexts.

# Claim Boundaries

- Do not extrapolate beyond the tested ligand, substrate, metal, partner, or reaction-class space.
- Do not treat a single paper, single precedent, or single substrate success as field consensus.
- Do not present agent-inferred hypotheses as validated facts; label them as speculative until independently supported.
- Do not guarantee synthetic feasibility, scalability, or safety based on research-design outputs alone.
- Distinguish desired bond activation from competing pathways (C–H activation, reduction, substitution, decomposition, oligomerization) before claiming selectivity.

# Failure Modes

- **Hypothesis not falsifiable:** The proposed mechanism cannot be tested because controls or probes are missing.
- **Control inadequacy:** Negative or mechanistic controls are absent, making it impossible to separate catalyst effects from substrate bias or background.
- **Confounding dominance:** Uncontrolled variables (precursor quality, purity, atmosphere, analytical method) obscure the true trend.
- **Mechanistic overreach:** A proposed intermediate or transition-state model is treated as proven when it is merely consistent with the data.
- **Irreproducible signals:** Results depend on a single run, ambiguous analytical signal, or uncharacterized batch variation.
- **Scope bias:** Substrate panels are chosen only from expected successes, masking boundary failures.
- **Safety boundary violation:** The plan drifts into hazardous chemistry without appropriate institutional review.

# Validity Checks

Before presenting conclusions, verify:

- **Confounders:** Catalyst precursor, ligand quality, substrate purity, medium, additive class, atmosphere, and analytical method are considered.
- **Benchmark quality:** Comparisons use relevant conventional systems, not only weak baselines.
- **Mechanistic support:** The descriptor-step link is supported by at least two independent evidence types or labeled speculative.
- **Reproducibility:** Representative cases are repeated or independently prepared before broad claims.
- **Boundary conditions:** Claims state applicable ligand families, metals, substrates, and reaction classes.
- **Literature status:** Single studies are not presented as domain consensus.
- **Safety and compliance:** Proposed chemistry remains within appropriate institutional and regulatory oversight; no operational hazardous protocols are generated.

# Provenance

Synthesized from cluster 17, subcluster 17.0. Derived from source skills: `ferrocenylphosphine-ligand-catalysis-exploration` (test0840), `cobalt-csp3-h-functionalization-research-planning` (refix_3), `directing-group-olefin-ch-activation-design` (test1580), `redox-neutral-ch-functionalization-agent` (test1631), `weak-coordination-ch-functionalization-exploration` (test0468), `asymmetric-allylic-alkylation-route-design` (test0802), `borylrhodium-directing-group-exploration` (test0948), and `organometallic-cycloaddition-selectivity-explorer` (test0466). Paper-specific conclusions, numerical results, and operational parameters have been excluded.
