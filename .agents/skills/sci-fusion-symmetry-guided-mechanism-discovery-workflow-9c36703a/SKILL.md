---
name: sci-fusion-symmetry-guided-mechanism-discovery-workflow-9c36703a
description: A reusable end-to-end workflow for generating, testing, and validating physical mechanisms in near-symmetric or symmetry-breaking confined systems through staged hypothesis generation, controlled computational or diagnostic studies, and iterative claim bounding.
scienceevolve-title: "Magnetic confinement fusion · symmetry guided mechanism discovery workflow 2"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

Help an agent formulate research questions, design controlled studies, and bound claims when investigating how deviations from an ideal symmetry or invariant structure create or modify physical mechanisms in confined systems. The workflow treats the idealized baseline as a reference, introduces controlled deviations, and uses staged validation to separate verified behavior from inference.

## When to use

Use this skill when the user asks to:

- Propose new research questions about mechanism emergence, suppression, or modification due to symmetry breaking or near-ideal optimization.
- Design computational, theoretical, or diagnostic validation plans for confined systems with nested invariants, periodic structures, or optimized baselines.
- Transfer a validated methodological pattern from one configuration or regime to a new target while preserving component-level checks.
- Evaluate whether a proposed mechanism explains observed behavior rather than numerical artifacts, boundary effects, or confounding variables.
- Iterate hypotheses based on controlled evidence without overgeneralizing from a single study.

Do not use this skill for operational device control, hazardous experimental procedures, or as a substitute for facility-specific safety and authorization protocols.

## Inputs required

Request or infer before starting:

- **Target system class** and the idealized baseline property (e.g., exact symmetry, invariant surface, conserved action, or suppressed transport channel).
- **Deviation family**: the type, scale, and structure of the symmetry-breaking perturbation or configuration change.
- **Regime ordering**: dimensionless parameters that define the asymptotic validity of the baseline and perturbation expansions.
- **Available tools**: models, solvers, diagnostics, or datasets applicable to the target, plus their known validated ranges.
- **Observables**: metrics that can distinguish the hypothesized mechanism from alternatives.
- **Reference validation**: independent benchmarks, stronger calculations, or established limiting theories for comparison.
- **Constraints**: computational budget, reproducibility requirements, safety boundaries, and data-access limits.

If inputs are missing, state assumptions explicitly and mark dependent claims as provisional.

## Core Workflow

Execute the following stages in order. Do not advance past a gate until its criteria are met.

### 1. Frame the research gap and baseline invariant
- Define the scientific question as a mechanism problem: which ideal property suppresses or enables a specific behavior, and how does a controlled deviation change it?
- Identify the domain gap by separating verified baseline behavior from uncertain perturbed behavior.
- **Gate 1:** The baseline invariant must be explicitly defined and verifiable in the unperturbed limit. If the invariant cannot be stated or checked, stop and reformulate the question.

### 2. Generate candidate mechanism hypotheses
- Map each candidate mechanism to a physical or geometric interpretation (e.g., resonance overlap, layer formation, mode coupling, or flux-friction balance).
- For each hypothesis, specify:
  - Evidence strength (e.g., source-verified, cross-supported, inferred, speculative).
  - Key assumptions about ordering, geometry, closure, and regime.
  - Predicted observable signatures.
  - Likely failure modes (e.g., layer overlap, invalid expansion, hidden resonance, numerical artifact).
  - Minimum viable validation and stop conditions.
- **Gate 2:** At least three competing or complementary hypotheses must be articulated, including a null hypothesis where the deviation does not produce the expected mechanism. If fewer than three are viable, stop and broaden the search space.

### 3. Design a minimal validation matrix
- Define study arms:
  - **Baseline**: unperturbed or reference case.
  - **Benign perturbation**: small deviation expected to preserve dominant behavior.
  - **Stress case**: deviation challenging the baseline assumptions.
  - **Negative control**: case where the mechanism should be absent or strongly reduced.
  - **Positive control**: case where the mechanism is known or expected to appear.
  - **Reference arm**: stronger calculation or independent benchmark when available.
- Classify variables into physics, numerical, and diagnostic layers; change the fewest variables needed to test each hypothesis.
- Define primary metrics tied to mechanism attribution and secondary metrics for robustness.
- **Gate 3:** Every study arm must have explicit stop conditions (e.g., baseline reproduction failure, control misclassification, unresolved singularities, or violation of ordering assumptions). If stop conditions are missing, redesign before execution.

### 4. Reproduce baseline and verify components
- Confirm that the unperturbed system recovers the expected invariant structure and known limiting behavior.
- Validate individual computational or diagnostic kernels against analytical limits, independent codes, or manufactured solutions before integrated tests.
- **Decision:** If baseline or component checks fail, halt integrated claims and return to implementation or model reformulation.

### 5. Execute controlled perturbation studies
- Apply deviations one at a time or in a designed sequence that isolates causal contributions.
- Record sensitivity to deviation amplitude, structure, and regime ordering.
- Monitor for emergent behavior not predicted by the outer expansion (e.g., new resonant layers, stochastic zones, or sign reversals).
- **Decision:** If results depend strongly on unresolved numerical choices without a convergence trend, stop and refine discretization or sampling.

### 6. Decompose and attribute mechanisms
- Separate total behavior into baseline, candidate mechanism, and residual contributions.
- Link each contribution to the hypothesized cause only if controls rule out obvious numerical, geometric, or boundary alternatives.
- Check self-consistency of closures and constraints (e.g., balance equations, conservation laws, or quasineutrality).
- **Decision:** If the incoherent or residual component remains structured, or if attribution requires cherry-picked initial conditions, reject the hypothesis and revisit the background model.

### 7. Compare against references and robustness checks
- Compare predictions with stronger calculations, independent benchmarks, or limiting theories.
- Test sensitivity to coordinate choices, resolution, interpolation, normalization, and postprocessing.
- Verify that agreement is not caused by matched artifacts between the test and reference methods.
- **Gate 4:** Claims may advance only if they survive at least one independent comparison or robustness check. If all comparisons fail or are unavailable, downgrade evidence strength and mark claims as provisional.

### 8. Iterate or terminate
- **If evidence supports the hypothesis:** define the validated boundary, test a contrasting regime or perturbation class, and consider scaling up complexity only after component confidence is maintained.
- **If evidence is ambiguous:** add decisive diagnostics, refine the observable, or reduce the problem to the smallest subsystem preserving the mechanism.
- **If evidence contradicts the hypothesis:** record the failure mode, revise the mechanism sketch, and propose a narrower or alternative hypothesis.
- **If stop conditions trigger:** terminate the study arm, document the limiting factor, and recommend a model or regime change.
- **Decision:** Promote a hypothesis only after it survives positive, negative, and reference checks. Reject or narrow it when boundary violations are identified.

### 9. Bound and document claims
- Label each conclusion as verified, conditionally supported, inconclusive, or refuted.
- Separate source-verified claims from agent-inferred or speculative extensions.
- State extrapolation boundaries: regime, geometry, perturbation class, and diagnostic range.
- Archive inputs, assumptions, decision log, and analysis scripts for reproducibility.

## Output Format

When using this skill, produce:

1. **Research question** — one concise question linking baseline property, deviation, and target observable.
2. **Hypothesis table** — at least three hypotheses with evidence strength, key assumptions, predicted signatures, failure modes, and minimum viable validation.
3. **Validation matrix** — study arms, variables, controls, metrics, and stop conditions.
4. **Analysis plan** — decomposition strategy, reference comparison, numerical checks, and interpretation rules.
5. **Iteration log** — decision record after each evidence stream, including updated evidence strength and next test.
6. **Bounded claim summary** — verified, conditionally supported, inconclusive, or refuted conclusions with explicit extrapolation limits.
7. **Validity and safety notes** — confounders, reproducibility checks, and non-operational safety boundaries.

## Validation Gates

Before advancing between stages, confirm:

- The baseline invariant is explicitly defined and checkable.
- Hypotheses include a null alternative and failure modes.
- Study arms include positive, negative, and reference controls.
- Component-level checks precede integrated claims.
- Stop conditions are defined for every arm.
- Mechanism attribution is supported by controls, not only by correlation.
- Independent comparison or robustness check has been attempted.
- Claims are graded and bounded before dissemination.

## Claim Boundaries

- Do not present single-study evidence as field-wide consensus.
- Do not extrapolate beyond the tested regime, geometry, perturbation class, or diagnostic range.
- Do not infer macroscopic performance (e.g., confinement quality, heat-load tolerance) from reduced-model indicators alone.
- Do not claim diffusion, stochasticity, or instability onset without phase-memory, trajectory, or convergence checks.
- Distinguish detection of a signal from validation of its causal mechanism.

## Failure Modes

- **Baseline invalidity:** The assumed invariant does not exist or is not reproduced in the unperturbed limit.
- **Ordering violation:** The perturbation or parameter leaves the asymptotic regime assumed by the model.
- **Control misclassification:** Positive or negative controls fail, indicating diagnostic or implementation error.
- **Artifact-driven agreement:** Agreement with reference is caused by shared numerical approximations rather than physical correctness.
- **Layer overlap or singularity:** Multiple phase-space or scale layers interact in a regime where the model is invalid.
- **Confounding by boundaries:** Boundary effects, coordinate singularities, or stochastic regions dominate the observable.
- **Overextrapolation:** Claims extend to regimes where closure assumptions, collisionality, or geometry are untested.
- **Irreproducible sensitivity:** Results change qualitatively under reasonable numerical or postprocessing variations.

## Validity Checks

Before finalizing any plan or conclusion, verify:

- **Model validity:** Governing equations, perturbation class, and neglected physics are explicit.
- **Geometry validity:** Coordinate singularities, boundary representations, and symmetry assumptions are appropriate.
- **Mechanism validity:** Terms are mapped to physical interpretations rather than treated as black-box scores.
- **Control validity:** Baseline, positive, negative, and reference controls are included and passed.
- **Numerical validity:** Convergence, resolution, conservation, and residual thresholds are checked.
- **Reference validity:** Independent benchmarks are used rather than treating source methodology as universal truth.
- **Boundary validity:** Claims are limited to tested regimes and configurations.
- **Reproducibility:** Inputs, transformations, assumptions, and decision rules are documented.
- **Extrapolation validity:** New hypotheses are labeled separately from source-verified evidence.

## Provenance

- Synthesized from cluster `15.1` (symmetry-guided mechanism discovery and validation), count 55.
- Source skills: `stellarator-gyrokinetic-research-workflow`, `mhd-local-stability-research-workflow`, `nonaxisymmetric-plasma-transport-research`, `qa-stellarator-microinstability-research`, `wavelet-burst-plasma-research-design`, `near-omnigeneous-transport-exploration`, `magnetic-surface-stochasticity-workflow`, `resilient-nonresonant-divertor-research`.
- Preserves the shared pattern of baseline-definition, controlled deviation, mechanism attribution, and iterative claim bounding without reproducing paper-specific conclusions or operational parameters.
