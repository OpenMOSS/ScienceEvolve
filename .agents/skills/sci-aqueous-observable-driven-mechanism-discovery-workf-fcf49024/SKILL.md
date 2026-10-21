---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-fcf49024
description: Reusable end-to-end workflow for generating, discriminating, and validating mechanistic hypotheses in complex interfacial or material systems using orthogonal evidence, matched controls, and iterative claim bounding.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow 6"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents to transform observed failures or performance gaps in complex interfacial or material systems into testable mechanistic hypotheses, validate them through staged orthogonal evidence and matched controls, and iterate with explicit claim bounding and stop conditions.

# When to use

Use when the user asks to:

- Propose new research questions for systems where a desired transport, reaction, storage, or recovery pathway competes with parasitic degradation or structural failure.
- Design hypothesis-driven validation plans involving interfacial regulation, material architecture, compositional modification, or phase partitioning.
- Compare candidate mechanisms before selecting experiments, or interpret results across multiple characterization modalities.
- Iterate after mixed, negative, or mechanism-inconsistent results.

Do not use as a recipe for copying a specific study’s materials, parameters, or numerical results. Do not generate executable high-risk operational procedures.

# Inputs required

Before producing a plan, identify:

- Target system class and active species or charge carrier.
- Dominant failure mode or bottleneck (e.g., parasitic reaction, unstable deposition, transport limitation, structural degradation, phase separation failure).
- Desired productive pathway to preserve.
- Candidate modifier, scaffold, reductant, or design concept, if any.
- Available orthogonal characterization tools (e.g., spectroscopy, imaging, electrochemical diagnostics, transport probes, diffraction, modeling).
- Baseline system and feasible controls.
- Safety, ethics, and compliance constraints.
- Goal: exploratory hypothesis generation or confirmatory experimental planning.

# Core Workflow

1. **Scope and bottleneck definition**
   - Localize the dominant failure relative to the productive pathway.
   - Identify whether the bottleneck is interfacial, bulk, structural, or coupled across components.
   - *Decision gate:* If the bottleneck cannot be localized to a testable mechanism, return to scope refinement.

2. **Mechanism-linked hypothesis generation**
   - Generate at least three distinct, falsifiable hypotheses.
   - For each, define: claim, mechanistic basis, evidence strength (weak / moderate / strong), key assumptions, predicted observations, likely failure modes, and a minimal falsification test.
   - Rank by fewest unsupported assumptions and clearest discriminability.
   - *Decision gate:* If hypotheses overlap or lack falsifiable predictions, reformulate before proceeding.

3. **Staged validation design**
   - Define independent, dependent, and controlled variables.
   - Construct a control matrix: baseline, negative, mechanism, structural, single-function, and inert analogues where applicable.
   - Pre-register a claim–evidence matrix stating what observation would support or falsify each hypothesis.
   - Define success, failure, and stop criteria before data collection.
   - *Decision gate:* If controls cannot rule out bulk, preparation, measurement, or environmental confounders, redesign.

4. **Orthogonal evidence collection**
   - Gather evidence from at least two independent streams (e.g., structural, compositional, interfacial, transport, performance).
   - Pass identity / purity and reproducibility checks before interpreting property or mechanism claims.
   - Separate raw observations from interpretations.
   - *Decision gate:* If identity / purity is unresolved or replicates disagree, halt mechanism interpretation and revisit preparation or measurement integrity.

5. **Mechanism discrimination**
   - Compare observations against the pre-registered claim–evidence matrix.
   - Grade evidence: **Strong** (multiple independent streams + controls align), **Moderate** (partial convergence), **Weak** (single stream or missing controls), **Insufficient** (contradictory or non-replicable).
   - Exclude hypotheses contradicted by controls or lacking mechanism-consistent intermediate evidence.
   - *Decision gate:* If evidence does not converge, flag the ambiguity and specify the missing probe or control needed to discriminate.

6. **Claim bounding**
   - Label each conclusion as observation, source-supported inference, agent-inferred extension, or speculative.
   - State boundary conditions: system classes, operating windows, and contexts where the mechanism may fail.
   - Avoid presenting single-study findings as field-wide consensus.
   - *Decision gate:* If claims exceed evidence strength, downgrade or split into sub-claims.

7. **Iteration or stop**
   - **If supported:** Escalate to higher-fidelity validation or full-system integration.
   - **If partially supported:** Split the hypothesis into sub-claims and design a test targeting the weakest assumption.
   - **If failed:** Preserve the negative result and pivot to an alternative hypothesis or design class.
   - **Stop conditions:** Mechanism probe contradicts the proposed map; controls perform identically to the candidate; effect disappears under realistic conditions; safety or compliance constraints are violated; mass balance or measurement integrity is uncompensated.

# Output Format

Produce:

1. Research question and localized bottleneck statement.
2. Mechanism map linking function to interfacial or structural behavior.
3. Ranked hypotheses table (claim, evidence strength, assumptions, failure modes, disconfirming observations).
4. Experimental design plan (variables, control matrix, measurement categories, success / stop criteria).
5. Analysis plan (claim–evidence matrix, confounder checks, evidence grading rules).
6. Iteration plan (decision rules for supported, partial, negative, or contradictory outcomes).
7. Validity and safety summary.
8. Explicit claim boundary statement separating observations, inferences, and speculation.

# Validation Gates

- **Identity / purity gate:** Confirm composition, phase, and reproducibility before property claims.
- **Control adequacy gate:** Verify that baseline, negative, mechanism, and structural controls are matched and can rule out confounders.
- **Mechanism consistency gate:** Require at least one independent structural or interfacial measurement for every performance claim.
- **Statistical validity gate:** Require pre-defined criteria, replicate variability, and uncertainty reporting before accepting trends.
- **System-relevance gate:** Confirm that component-level gains survive in integrated or realistic configurations before claiming practical relevance.

# Claim Boundaries

- Do not extrapolate from a single source study to universal mechanism consensus.
- Distinguish mechanism claims from performance-only observations.
- Label agent-inferred extensions separately from directly supported observations.
- State explicit boundary conditions (material classes, environmental limits, device formats) beyond which the hypothesis is unverified.
- Do not translate screening or component-level results into deployment, clinical, or commercial recommendations.

# Failure Modes

- **Hypothesis is descriptive, not falsifiable:** Claims predict only “improved performance” without a mechanism-linked observable.
- **Controls are mismatched:** Differences in preparation, loading, geometry, or environment obscure causality.
- **Confounding dominates:** Bulk, impurity, or measurement artifacts explain the observation better than the proposed mechanism.
- **Overextrapolation:** Mechanism validated in one system is assumed to transfer to another without new controls.
- **Selective emphasis:** Negative results, failed controls, or contradictory evidence are discarded rather than used to refine the hypothesis.
- **Synergy without support:** Combined-function benefits are claimed without evidence that single-function controls underperform.

# Validity Checks

Before finalizing any plan, verify:

- The research question targets a specific mechanism, not only a performance metric.
- Each hypothesis has a falsifiable prediction and a defined minimal test.
- The control matrix can rule out bulk, preparation, measurement, and environmental artifacts.
- Metrics capture both the suppression of the parasitic pathway and the preservation of the productive pathway.
- Success, failure, and stop criteria are defined before testing.
- Reproducibility, uncertainty, and raw-data preservation are addressed.
- The plan includes negative controls and, where feasible, mechanism or positive controls.
- Proposed mechanisms have clear boundary conditions and plausible failure modes.

# Provenance

Synthesized from cluster 18 / subcluster 18.1. Derived from source skills: `aqueous-zn-interface-research-workflow`, `aqueous-zinc-electrolyte-interface-design`, `interface-regulation-zn-anode-research`, `electrochemical-dual-function-material-design`, `weak-interaction-zinc-interface-design`, `scaffold-guided-layered-electrode-design`, `coordination-complex-research-design`, and `cathode-recycling-research-design`. Source-specific materials, parameters, and conclusions have been abstracted; only the shared workflow route and evidence logic are retained.
