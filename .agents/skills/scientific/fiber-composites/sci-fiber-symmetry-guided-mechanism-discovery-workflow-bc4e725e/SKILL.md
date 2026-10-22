---
name: sci-fiber-symmetry-guided-mechanism-discovery-workflow-bc4e725e
description: A reusable end-to-end workflow for discovering and validating hidden mechanisms in composite, interfacial, transport, or quantum systems using symmetry analysis, competing-scale decomposition, and controlled ablation.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to turn an ambiguous observation or design goal in a coupled system into a discriminating research plan. The workflow guides the generation of mechanistic hypotheses, designs minimal validations that isolate candidate mechanisms from confounders, and iterates until evidence supports, refutes, or bounds each claim.

# When to use

Use this skill when:

- A user asks to explain an anomalous response, non-monotonic trend, or symmetry-breaking behavior in a system with coupled fields, boundaries, or scales.
- The goal is to distinguish between competing mechanisms (e.g., direct versus mediated coupling, geometric versus constitutive effects, quantum versus classical limits).
- Designing a study to map how a perturbation at one scale or boundary propagates to an observable at another.
- Proposing validation through simulation, controlled comparison, or minimal-model analysis.

Do not use this skill for operational laboratory protocols, clinical decision-making, manufacturing recipes, or hazardous material handling instructions.

# Inputs required

Before starting, obtain or explicitly assume:

1. **System abstraction**: relevant degrees of freedom, boundaries, symmetries, and coupled fields.
2. **Target observable**: the response, anomaly, or function to be explained or optimized.
3. **Candidate mechanisms**: plausible coupling pathways (direct, symmetry-mediated, geometric, scale-competing, etc.).
4. **Baseline state**: a reference configuration or model expected to lack the proposed mechanism.
5. **Available evidence**: prior theory, simulation, or experiment, with known limitations.
6. **Constraints**: safety, ethical, computational, experimental, or regulatory boundaries.
7. **Discrimination criteria**: what result would support, weaken, or falsify each hypothesis.

# Core Workflow

Execute the following steps in order. At each decision gate, pause and redesign if the condition is not met.

## 1. Symmetry Audit and Mechanism Abstraction

- Decompose the system into subsystems and identify the coupling pathway that could produce the target observable.
- List all relevant symmetries (spatial, temporal, gauge, etc.) and determine which contributions are allowed, forbidden, or vanish by symmetry.
- Represent each candidate mechanism by the minimal set of fields or components needed to capture the effect while retaining the symmetry that creates it.

**Decision Gate**: Is the target observable symmetry-allowed under the proposed mechanism? If no, revise the mechanism or definitions before proceeding.

## 2. Competing-Scale Mapping

- Identify dimensionless ratios or competing scales whose relative magnitude determines which mechanism dominates.
- Derive or state the limiting behavior in each asymptotic regime (e.g., weak versus strong coupling, near versus far field, rigid versus compliant response).
- Map where regime crossovers should occur.

**Decision Gate**: Are there at least two distinguishable regimes where different hypotheses predict qualitatively different behavior? If no, simplify to a single-mechanism test.

## 3. Hypothesis Generation

- Produce 3–5 falsifiable hypotheses using the template:  
  *If [mechanism] dominates under [regime/condition], then [observable] should [trend/sign] because [coupling pathway].*
- Label evidence strength for each: **strong** (direct prior support), **moderate** (symmetry or limiting-case support), **weak** (analogy), or **speculative** (untested extension).
- List key assumptions and at least three failure modes per hypothesis (e.g., wrong dominant scale, invalid linearization, overlooked boundary condition, noise dominance).

**Decision Gate**: Are the hypotheses mutually exclusive or do they predict distinct signatures? If they are indistinguishable with available tools, redesign the observable or controls.

## 4. Minimal Validation Design

- Define the smallest comparison that can distinguish the leading hypothesis from the baseline and from alternatives.
- Specify controls:
  - **Baseline control**: reference state without the perturbation.
  - **Negative control**: state that removes the proposed mechanism while preserving surface similarities.
  - **Positive control**: known case where the mechanism should operate.
  - **Strong/orthogonal control**: varies a confounding factor while holding the target mechanism constant.
- Define independent variables (perturbation type, regime, geometry), dependent variables (response metrics), and evaluation metrics (prefer dimensionless ratios).
- State stop conditions: controls fail, uncertainty dominates, or mechanism cannot be isolated.

**Decision Gate**: Can the mechanism be isolated with the available resources and constraints? If no, scope down or switch to a computational minimal model.

## 5. Execution and Baseline Subtraction

- Run simulations, experiments, or analyses according to the design.
- Quantify and subtract the baseline contribution to isolate the mechanism-induced correction.
- Record raw observations separately from interpretations.

**Decision Gate**: Is the corrected signal resolvable above noise and uncertainty? If no, stop and improve sensitivity, increase replication, or redesign.

## 6. Mechanism Discrimination

- Compare results against the predictions of each hypothesis.
- Perform ablation checks: remove one suspected mechanism at a time in the model and verify whether the anomaly persists.
- Verify symmetry consistency: predicted nonzero effects must survive; predicted null effects must remain null under controls.
- Verify regime consistency: check asymptotic limits and crossover locations.

**Decision Gate**: Does one hypothesis survive all controls and ablations?  
- **If yes**: proceed to robustness testing.  
- **If multiple survive**: return to Step 3 to refine hypotheses with additional discriminators.  
- **If none survive**: reject current hypotheses and return to Step 2 to identify missing scales or couplings.

## 7. Robustness and Stress Testing

- Perturb assumptions one at a time: boundary conditions, material parameters, geometry, noise, disorder, delay, or finite-size effects.
- Test whether the conclusion depends on fragile tuning, narrow windows, or idealized detection.

**Decision Gate**: Does the mechanism survive reasonable perturbations without qualitative change?  
- **If yes**: bound the claim to the tested regime and proceed.  
- **If no**: downgrade the claim to a narrow regime or conditional observation.

## 8. Claim Bounding and Iteration

- State the validity boundary explicitly: model class, scale, geometry, and parameter regime.
- Separate verified findings, model-supported inferences, and speculative extrapolations.
- Package outputs (see Output Format).
- If residual ambiguity remains, define the next minimal validation and iterate from Step 4.

**Stop Conditions** (global):
- The effect size is smaller than uncertainty after adequate replication.
- Controls behave contrary to expectation, indicating a hidden confounder.
- The conclusion requires an unsupported parameter choice or unverified material assumption.
- Safety, ethical, or compliance constraints are violated.
- The mechanism cannot be discriminated from alternatives with available tools.

# Output Format

For each invocation, produce:

1. **Research question**: concise statement of the anomaly or target function.
2. **Mechanistic framing**: coupled subsystems, symmetries, and candidate pathways.
3. **Ranked hypotheses**: 3–5 items with evidence strength, key assumptions, and failure modes.
4. **Validation plan**: minimal viable comparison, controls, variables, metrics, and stop conditions.
5. **Analysis plan**: baseline subtraction, symmetry audit, ablation strategy, regime checks, and uncertainty assessment.
6. **Iteration roadmap**: decision rules for supportive, contradictory, and null results.
7. **Claim boundary statement**: what is verified, inferred, or speculative, and where the claim should not be extrapolated.
8. **Validity and safety notes**: confounders, reproducibility checks, and ethical boundaries.

# Validation Gates

- **Symmetry Gate**: The observable must be symmetry-allowed; controls must respect predicted nulls.
- **Baseline Gate**: Background contributions must be quantified and subtracted before mechanism attribution.
- **Control Gate**: Negative and positive controls must behave as expected before target results are interpreted.
- **Regime Gate**: Asymptotic limits must match theoretical expectations or established benchmarks.
- **Robustness Gate**: Conclusions must not rest on a single untested parameter or narrow numerical window.
- **Reproducibility Gate**: Key observables must be stable under refinement, replication, or independent verification.

# Claim Boundaries

- **Verified**: Directly follows from reproduced simulations, derived equations, or controlled observations in the tested system.
- **Supported**: Consistent across multiple parameter sweeps, related models, or converging evidence lines.
- **Speculative**: Depends on untested platform assumptions, analogical extension, or extrapolation beyond the validated regime.
- Do not generalize from a single system instance to domain-wide consensus.
- Flag any analogical extension as requiring independent validation before application to new materials, platforms, or scales.

# Failure Modes

- **Wrong dominant mechanism**: The assumed coupling is subdominant to an overlooked effect (e.g., geometry, noise, or alternative symmetry channel).
- **Invalid reduction**: A simplifying assumption (linear response, small deformation, Markovianity, far-field, continuum) breaks down in the tested regime.
- **Overlooked boundary condition**: A change in constraints (no-slip, pinned, periodic, open) alters the predicted response qualitatively.
- **Confounding**: The signal arises from baseline effects, measurement artifacts, disorder, or finite-size effects rather than the proposed mechanism.
- **Numerical artifact**: Insufficient convergence, mesh sensitivity, or solver settings produce spurious features.
- **Overextrapolation**: Applying a validated mechanism to an untested scale, material, or regime without new validation.

# Validity Checks

Before finalizing any plan or conclusion, verify:

- All assumptions (symmetry, boundary conditions, dimensionality, timescale, noise model) are explicit and justified.
- Controls are adequate to isolate the claimed mechanism from confounders.
- Metrics are pre-registered and tied to the hypothesis, not selected post-hoc.
- Uncertainty is quantified and reported alongside effect sizes.
- Source-specific numerical values, thresholds, or material parameters are not reused as universal constants.
- Operational hazards are excluded from recommendations.
- Evidence is labeled by strength and separated from agent-inferred extensions.

# Provenance

- Synthesized from cluster **25.1** (symmetry-guided mechanism discovery and validation).
- Derived from source skills: `deformable-interface-active-particle-research`, `babinet-metamaterial-research-design`, `endohedral-fullerene-interface-exploration`, `quantum-measurement-feedback-state-engineering`, `chemo-mechanical-battery-interface-exploration`, `quantum-hall-bilayer-research-workflow`, `lis-sulfur-ion-transport-design`, `oxide-glass-composition-exploration`.
- Represents a domain-agnostic merge of interface-coupling, transport, quantum-control, and composite-system reasoning patterns.
