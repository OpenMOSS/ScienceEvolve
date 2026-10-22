---
name: sci-quantum-observable-driven-mechanism-discovery-workf-3a1c8faa
description: A transferable end-to-end workflow for framing observable anomalies, generating ranked mechanistic hypotheses, designing minimal validation with controls, and iterating through multi-level model comparison to bound claims.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 22"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Enable agents to convert anomalous observations into structured mechanism-discovery and validation programs. The workflow guides hypothesis generation, minimal validation design, multi-level model comparison, and iterative claim refinement while keeping conclusions bounded by evidence.

# When to use

Use this skill when the user asks to:

- Explain why a baseline model fails in a specific regime.
- Propose research questions around an observable anomaly.
- Design experiments, simulations, or observational tests to discriminate competing mechanisms.
- Build a modeling hierarchy or compare alternative explanations.
- Iterate between theory and evidence to refine or reject hypotheses.

Do not use this skill for operational execution of hazardous procedures, clinical or human-subject research, or as a substitute for domain-specific safety review.

# Inputs required

Before generating a research plan, request or identify:

- The target observable and the baseline model or expectation it contradicts.
- The regime of interest (parameter window where the anomaly appears).
- Candidate mechanisms and competing explanations.
- Available data, simulation, or observational modalities and their resolution limits.
- Perturbation axes (tuning knobs that can vary mechanism strength).
- Known confounders, nuisances, and systematic effects.
- Constraints on feasibility, ethics, and safety.

# Core Workflow

Execute the following ordered route. Pass each decision gate before advancing; return to earlier steps when a gate fails.

1. **Frame the anomaly and baseline gap.**  
   State the observable deviation and the simplest accepted model that should apply. Define the regime where the baseline is expected to hold and where it fails.  
   > **Gate 1 — Reproducibility:** If the deviation is not reproducible across independent samples, runs, or datasets, stop and resolve data quality before proceeding.

2. **Decompose candidate mechanisms.**  
   Separate the anomaly into competing mechanistic contributions (e.g., local interaction, collective effect, topological constraint, symmetry change, artifact).  
   > **Gate 2 — Candidate sufficiency:** If fewer than two competing mechanisms can be articulated, document the default explanation and flag the risk of confirmation bias.

3. **Generate ranked hypotheses.**  
   For each candidate, produce a hypothesis record containing: concise claim; evidence strength (strong / moderate / weak / speculative); key assumptions; predicted discriminative signature; alternative explanations; decisive discriminator; and extrapolation boundary.  
   > **Gate 3 — Falsifiability:** If no hypothesis yields a testable signature with a defined falsification condition, stop and redefine the observable or acquire new data.

4. **Design minimal viable validation.**  
   Define independent variables, dependent variables, and nuisance variables. Specify positive controls (mechanism should dominate), negative controls (mechanism should vanish), strong controls (sweep coupling while holding other conditions fixed), and artifact controls. Pre-register evaluation metrics and stopping conditions.  
   > **Gate 4 — Feasibility & Safety:** If the design requires unsafe operational details, hazardous protocols, or unfeasible fabrication parameters, revise to a non-operational conceptual design.

5. **Execute multi-level analysis.**  
   Implement a modeling hierarchy: (a) baseline model, (b) reduced correction model isolating the leading mechanism, (c) full model relaxing restrictive assumptions. Compare outputs across levels. Verify limiting-case consistency, parameter identifiability, and sensitivity to boundary conditions, regularization, and analysis windows.  
   > **Gate 5 — Limiting-case consistency:** If the full model does not recover the baseline in the appropriate limit, debug the implementation before interpreting results.

6. **Discriminate mechanisms.**  
   Compare model predictions to observations using pre-registered metrics. Test whether the proposed mechanism improves prediction for multiple independent observables or only one. Evaluate whether alternative models explain the data equally well.  
   > **Gate 6 — Control fidelity:** If negative controls reproduce the claimed signature, reject or revise the hypothesis. If positive controls fail, re-examine model assumptions.

7. **Update confidence and iterate.**  
   Classify each hypothesis as: **retain** (specific predictive gain and robust controls), **revise** (explains only part of the data or requires uncontrolled tuning), or **reject** (contradicted by controls or independent parameters).  
   > **Gate 7 — Iteration trigger:** If all hypotheses are rejected, return to Step 2. If one is retained, proceed to Step 8.

8. **Bound claims and plan the next test.**  
   State the regime where the mechanism is supported, list residual risks, and propose the next minimal discriminator to broaden or narrow the claim.  
   > **Stop condition:** Halt extrapolation when residuals grow outside tested regimes, when claim boundaries are untested, or when independent replication is unavailable.

# Output Format

When using this skill, produce:

1. **Research question and baseline gap** — the anomaly and the model it challenges.
2. **Ranked hypothesis set** — 2–5 hypotheses with evidence strength, key assumptions, predicted signatures, failure modes, and extrapolation boundaries.
3. **Minimal validation plan** — variables, controls (positive, negative, strong, artifact), metrics, and pre-registered stopping conditions.
4. **Multi-level analysis summary** — baseline, reduced, and full model comparisons; limiting-case checks; sensitivity notes.
5. **Mechanism discrimination result** — retained, revised, or rejected status; model comparison; cross-observable consistency.
6. **Iteration roadmap** — next discriminator test, scope expansion or contraction rules.
7. **Claim boundary statement** — regime limits, confounders, uncertainty sources, and provenance labels.

# Validation Gates

- **Reproducibility Gate:** The anomaly must be reproducible across independent samples, runs, or datasets.
- **Artifact Gate:** The signature must not appear in negative controls or artifact-only models.
- **Limiting-Case Gate:** The full model must recover the baseline model in the appropriate asymptotic limit.
- **Identifiability Gate:** Mechanism parameters must be constrained by independent observables, not degenerate with background or nuisance parameters.
- **Cross-Observable Gate:** The mechanism should improve prediction for at least two independent observables or diagnostics.
- **Robustness Gate:** Conclusions must be stable under plausible variations in boundary conditions, analysis choices, and error models.
- **Statistical Gate:** Uncertainty must be propagated; model comparison must account for parsimony and out-of-sample consistency.

# Claim Boundaries

- Limit claims to the tested regime, system class, and observable set.
- Distinguish source-supported methodology, model-consistent inference, and agent-inferred extrapolation.
- Do not present single-system or single-model results as field-wide consensus.
- Flag claims that depend on unverified assumptions about continuity between regimes.
- State whether inferred parameters are local, global, or measurement-dependent.

# Failure Modes

- **Baseline misidentification:** The assumed baseline model is inappropriate for the tested regime.
- **Overfitting:** The mechanism explains only one observable or requires ad hoc tuning for each dataset.
- **Confounding:** Nuisance variables (disorder, selection effects, finite-size, environmental drift) reproduce the signature.
- **Degeneracy:** Multiple distinct mechanisms produce indistinguishable signatures with the current data.
- **Extrapolation error:** Claims are extended beyond the validated regime without continuity arguments.
- **Representation artifact:** The anomaly depends on coordinate choice, discretization, smoothing, or postselection.
- **Non-identifiability:** Mechanism parameters cannot be separated from background model parameters.

# Validity Checks

Before finalizing any output, verify:

- Confounding mechanisms have been explicitly listed and controlled.
- The proposed discriminator separates the target mechanism from alternatives, not just from a straw-man baseline.
- Data reduction steps are separated from mechanistic interpretation.
- Uncertainties are reported for measurements, inferred parameters, and model comparisons.
- Boundary conditions and regime limits are stated.
- Reproducibility criteria (preprocessing, fitting windows, random seeds, exclusion criteria) are documented.
- Source-specific operational details, hazardous protocols, and fabrication parameters are excluded.
- Provenance labels distinguish source-supported methodology from new inferences.

# Provenance

- Derived from cluster 170 / subcluster 170.0 ("observable-driven mechanism discovery and validation").
- Synthesized from source skills: soft-interface-singularity-research, high-temperature-superconductivity-amplitude-phase-exploration, scale-free-reaction-diffusion-workflow, nuclear-eft-scale-symmetry-exploration, quantum-network-foundation-test-design, morphological-attractor-research-workflow, fqh-edge-tunneling-workflow, stellar-wake-subhalo-exploration.
- Domain-specific systems, parameters, numerical results, and paper conclusions have been abstracted away to produce a transferable, non-operational workflow.
