---
name: sci-catalysis-observable-driven-mechanism-discovery-wor-db9c0ce7
description: A reusable end-to-end workflow for generating mechanism-based hypotheses, designing minimal validation studies with orthogonal evidence, and iterating toward discriminated mechanistic claims in materials and catalysis research.
scienceevolve-title: "Asymmetric catalysis · observable driven mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Convert a materials or catalysis performance bottleneck into a structured mechanism-discovery program. The goal is to generate ranked, falsifiable hypotheses; design minimal validation experiments with strong controls; triangulate evidence across orthogonal observables; and iterate until mechanistic claims are either supported, bounded, or rejected.

## When to use

Use when exploring new research questions in chiral, correlated, layered, or ligand-driven materials and catalysts where multiple competing mechanisms could explain observed behavior, especially when structure–function relationships are ambiguous, hidden channels or interfaces may dominate, and claims require cross-method validation before generalization.

## Inputs required

- Target system class and the performance or structural bottleneck.
- Candidate mechanism variables (e.g., precursor pathway, ligand topology, interfacial channel, domain coupling, active-site structure).
- Available orthogonal measurement modalities (e.g., spectroscopy, transport, imaging, scattering, kinetic assays).
- Baseline evidence and literature context.
- Constraints: safety boundaries, reproducibility requirements, accessible methods, and stopping criteria.

## Core Workflow

1. **Frame the Bottleneck and Candidate Mechanisms**
   - State the observable limitation (e.g., selectivity loss, unexpected transport, structural ambiguity).
   - Enumerate competing explanations: bulk, surface, interface, defect, background, alternative pathway, or measurement artifact.
   - *Gate:* If the bottleneck cannot be decomposed into distinct, testable candidates, refine the research question before proceeding.

2. **Generate Ranked, Falsifiable Hypotheses**
   - For each candidate, build a causal chain: design/pathway variable → structural or electronic change → predicted observable signature.
   - Tag each hypothesis with evidence strength (strong / moderate / weak / speculative), key assumptions, predicted orthogonal observations, and likely failure modes.
   - *Gate:* If a hypothesis cannot be falsified with available methods, redesign or scope it down.

3. **Design Minimal Validation**
   - Vary one dominant mechanism variable at a time while holding others comparable.
   - Define controls: baseline, negative, positive/benchmark, mechanistic, and replicate.
   - Define metrics across at least two independent measurement classes (structural, functional, spectroscopic, transport, kinetic, or imaging).
   - Predefine failure criteria and stop conditions (e.g., controls fail, orthogonal evidence contradicts the mechanism, safety constraints exceeded).
   - *Gate:* If the design cannot isolate the target mechanism from confounders, add discriminating controls or change the variable.

4. **Collect Orthogonal Evidence**
   - Acquire data from independent method classes; record metadata (batch, history, sequence).
   - Screen for unintended phases, contamination, aging, or composition drift before interpreting electronic or catalytic trends.
   - *Gate:* If data quality is insufficient (poor reproducibility, calibration mismatch, ambiguous blanks), halt and diagnose.

5. **Discriminate Mechanisms by Triangulation**
   - Compare predicted vs. observed signatures for each hypothesis.
   - Build a cross-method comparison table; mark agreements, discrepancies, and unresolved channels.
   - Classify each hypothesis as supported, partially supported, contradicted, or inconclusive.
   - *Gate:* Require at least two converging independent evidence streams to support a mechanism. If methods disagree, classify the discrepancy and generate a channel-mixing or artifact hypothesis before claiming causality.

6. **Bound Claims and Update the Model**
   - Restrict conclusions to the tested system class, substrate scope, measurement regime, and sample population.
   - Update the mechanism model: strengthen supported links, revise assumptions for partial matches, reject falsified hypotheses.
   - *Gate:* If a claim appears generalizable, label it as a speculative extension requiring new validation; do not treat it as established.

7. **Iterate or Redesign**
   - **Confirmatory:** Test boundary conditions (new substrate, perturbation level, alternative stack or environment).
   - **Contradictory:** Identify the dominant failure mode, change one design variable, add one discriminating control, and repeat the minimal validation.
   - **Inconclusive:** Introduce an additional orthogonal measurement or refine structural probes before expanding scope.
   - *Stop conditions:* Repeated failure under well-controlled conditions; unresolved confounding; champion observation lacks statistical support; safety/compliance limits reached; mechanism model is falsified.

8. **Document and Report**
   - Compile the control table, ranked hypotheses, claim boundaries, failure modes, and iteration history.
   - Maintain a living evidence matrix distinguishing direct observation, inferred mechanism, and speculative extension.

## Output Format

When using this skill, produce:

1. **Research question and bottleneck framing** — the observable limitation and why it matters.
2. **Ranked hypothesis table** — mechanism, evidence strength, key assumptions, predicted orthogonal signatures, likely failure modes, and minimal validation for each.
3. **Minimal validation plan** — design matrix, controls, metrics, failure criteria, and stop conditions.
4. **Cross-method triangulation summary** — agreements, discrepancies, unresolved channels, and discrepancy classification.
5. **Updated mechanism model** — supported, revised, and rejected claims with explicit boundary conditions.
6. **Iteration roadmap** — next experiments for confirmatory, contradictory, or inconclusive outcomes.
7. **Validity and safety notes** — confounders, reproducibility requirements, non-operational safety boundaries, and generalization limits.

## Validation Gates

- **Falsifiability gate:** Every hypothesis must have a defined observation that would reject it before experimentation begins.
- **Control gate:** Negative and mechanistic controls must behave as expected before interpreting test results.
- **Orthogonality gate:** Mechanistic claims require at least two independent evidence streams; single-method claims are treated as provisional.
- **Reproducibility gate:** Champion or single-sample observations must be separated from distribution-level or batch-replicated behavior.
- **Consistency gate:** Cross-method predictions must converge or produce a justified discrepancy classification before causality is assigned.
- **Scope gate:** Claims must be explicitly bounded to the tested system class, substrate scope, and measurement regime.

## Claim Boundaries

- Distinguish literature-supported patterns from agent-inferred extensions and speculative hypotheses.
- Limit mechanism claims to the tested material family, ligand class, substrate scope, and measurement context.
- Do not extrapolate from single-sample, single-batch, or single-flake observations.
- Label computational or structural model predictions as hypotheses unless supported by experimental evidence.
- Avoid stating field-wide consensus from any single source or study.

## Failure Modes

- Hidden channel dominance (e.g., interface, bulk, defect, or background pathway masks the target mechanism).
- Overinterpretation of single-method, single-sample, or champion-only data.
- Confounding from uncontrolled variables such as composition drift, aging, contamination, or measurement artifact.
- False mechanism attribution due to missing negative controls or inadequate baseline comparison.
- Champion-sample bias without statistical support across replicates or batches.
- Model non-identifiability when structural or kinetic data are ambiguous or underdetermined.
- Safety or compliance boundary violations that force redesign or termination.

## Validity Checks

- **Confounding:** Check batch effects, sample history, instrument background, calibration drift, environmental exposure, and operator-dependent variability.
- **Statistical validity:** Require replication, uncertainty estimates, predefined exclusion rules, and sensitivity checks for derived metrics.
- **Mechanistic validity:** Require converging evidence from independent measurements before assigning causality; do not infer mechanism from performance metrics alone.
- **Boundary conditions:** State explicitly where conclusions do not apply (untested chemistries, substrates, environments, or measurement regimes).
- **Literature validity:** Treat any single paper as one evidence source, not as field-wide consensus.
- **Safety validity:** Maintain non-operational guidance; flag hazards for institutional safety review and trained personnel.

## Provenance

Synthesized from cluster 0.0 (observable-driven mechanism discovery and validation). Derived from source skills: pathway-first-kesterite-photovoltaics, chiral-multinuclear-copper-enzyme-model-research, dual-scale-topological-material-exploration, responsive-core-shell-microgel-research, liquid-metal-oxide-film-exploration, asymmetric-catalysis-ligand-design, coordination-polymer-crystal-exploration, sc-co2-catalyst-exploration. Paper-specific conclusions, numerical results, material-specific parameters, and operational protocols were excluded from the reusable workflow body.
