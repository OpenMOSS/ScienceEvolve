---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-fc4890ea
description: A reusable end-to-end workflow for designing controlled astrophysical simulation studies that isolate causal mechanisms from observable discrepancies, validate them through ablation and robustness checks, and bound claims before observational comparison.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 7"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent design reusable, mechanism-focused research plans in computational astrophysics. The workflow turns observable discrepancies or structural anomalies into testable hypotheses, defines controlled numerical experiments with strong causal isolation, and validates inferred mechanisms against multiple independent diagnostics without overclaiming.

# When to use

Use when the user asks to:

- Propose new research questions about feedback-driven restructuring, transport, population scaling relations, or multi-observable anomalies in self-gravitating or plasma systems.
- Design controlled numerical experiments to test whether a physical process causally produces a predicted signature.
- Compare competing mechanisms for an observed or simulated anomaly.
- Build an evidence chain from simulations to observable-derived diagnostics while preserving uncertainty and boundary conditions.

Do not use for clinical, biological, chemical, or laboratory experimental design. Do not use as a general astrophysics encyclopedia or telescope-operations guide.

# Inputs required

Before generating a research plan, collect or infer:

- **Target system class**: the category of object or environment to be studied.
- **Observable discrepancy or anomaly**: the population-level mismatch, unexpected profile, or kinematic feature that motivates the study.
- **Candidate mechanisms**: feedback cycles, accretion, mergers, transport, cooling, environmental stripping, or effective subgrid processes.
- **Physical components and scales**: e.g., collisionless matter, gas, stars, central engines, magnetic fields, and the relevant spatial or temporal regimes.
- **Available modeling framework**: simulation type, dimensionality, resolution constraints, subgrid prescriptions, and post-processing capabilities.
- **Observational or synthetic diagnostics**: scaling relations, column densities, kinematic maps, morphology fractions, or spectral signatures for comparison.
- **Known uncertainties and confounders**: resolution limits, initial-condition sensitivity, projection effects, selection biases, and missing physics.

# Core Workflow

Follow this ordered end-to-end route. Treat each stage as a gate; revisit earlier stages if a gate fails.

## Stage 1: Frame the anomaly and define the gap
1. State the observable discrepancy relative to a baseline model or established expectation.
2. Identify whether the gap concerns abundance, spatial distribution, kinematics, thermal state, chemical enrichment, or structural profile.
3. **Decision gate**: If the anomaly cannot be expressed as a measurable difference between a baseline and an observation or prediction, stop and refine the question.

## Stage 2: Generate mechanism-centered hypotheses
1. Propose at least three competing mechanisms that could plausibly cause the anomaly.
2. For each hypothesis, specify:
   - The causal claim in if-then form.
   - Key physical assumptions and enabling conditions.
   - Predicted primary and secondary diagnostic signatures.
   - Evidence strength (strong, moderate, weak, speculative).
   - Concrete failure modes.
3. Distinguish prior domain evidence from new inferences.
4. **Decision gate**: If hypotheses cannot be cast as testable contrasts with distinct predictions, return to Stage 1.

## Stage 3: Design controlled numerical experiments
1. **Baseline**: Build a reference model that reproduces the expected unmodified behavior.
2. **Mechanism variants**: Add, remove, or alter one candidate mechanism at a time while holding initial conditions and other physics fixed.
3. **Controls**:
   - *Negative control*: disable the candidate mechanism.
   - *Positive control*: a regime where the mechanism should produce a known signature.
   - *Environment control*: vary ambient conditions to separate internal from external shaping.
   - *Numerical control*: test resolution, geometry, or solver dependence.
   - *Reduced/ablation control*: weaken or remove sub-components of the mechanism.
4. Define independent variables, dependent diagnostics, and nuisance variables.
5. **Stop condition**: Stop if variants are not controlled enough to isolate the mechanism, if the effect depends on undocumented boundary choices, or if the mechanism improves one diagnostic while worsening another central observable.

## Stage 4: Execute and track causal chains
1. Verify initialization comparability across baseline and variants.
2. Track temporal causality: confirm the proposed cause precedes the structural response.
3. Monitor intermediate steps (e.g., fuel supply, activation, displacement, fallback, energy conversion) rather than only final states.
4. **Iteration gate**: If the mechanism fails to activate, test missing ingredients (fuel, coupling, duty cycle). If the effect is weak, check mass or energy budgets and competing processes. If causal ordering is unclear, add time-resolved diagnostics.

## Stage 5: Analyze with observable-derived diagnostics
1. Convert raw simulation outputs into synthetic observables using consistent projection, sampling, and selection logic.
2. Compare full distributions, not only central tendencies or single snapshots.
3. Use production-weighted or population-weighted metrics when assessing system-level relevance.
4. Test robustness:
   - Alternative center definitions or classification thresholds.
   - Different projection angles or sightline sampling.
   - Subgrid model variants.
5. **Decision gate**: If conclusions depend strongly on a single unresolved structure, projection choice, or center definition, treat them as conditional and return to Stage 3.

## Stage 6: Validate across multiple observables
1. Require consistency across primary and secondary diagnostics before strengthening a claim.
2. Check compensation: ensure a mechanism that improves transmission or structure does not suppress source production or another linked quantity.
3. Compare against independent observational constraints without overclaiming.
4. **Stop condition**: Stop if the mechanism fits one observable but violates another independent constraint.

## Stage 7: Bound claims and plan iteration
1. Label each claim as prior evidence, result-supported inference, or speculative extrapolation.
2. State boundary conditions: regimes, environments, and scales where the mechanism is tested versus untested.
3. Define the next discriminating test if multiple mechanisms remain degenerate.
4. **Iteration gate**: If results are ambiguous, redesign with a new contrast, finer ablation, or additional observable. If all variants fail, return to Stage 2 to generate new candidates.

# Output Format

Return the following structured sections each time the skill is invoked:

1. **Research question** — One concise sentence describing the new question and target system.
2. **Evidence framing** — Prior support, new inference, and boundary beyond which extrapolation is unwarranted.
3. **Hypothesis set** — At least three hypotheses, each with mechanism, key assumptions, expected signatures, evidence strength, and failure modes.
4. **Experimental design** — Baseline, mechanism variants, strong controls, negative and positive controls, variables held fixed, evaluation metrics, and stop conditions.
5. **Analysis plan** — Causal-chain diagnostics, structural or population metrics, robustness checks, synthetic-observable construction, and compensation checks.
6. **Iteration plan** — Actions for mechanism non-activation, weak effects, degeneracy, boundary sensitivity, and numerical non-robustness.
7. **Validity and ethics statement** — Main confounders, reproducibility requirements, uncertainty boundaries, and domain-specific safety considerations.

# Validation Gates

Before advancing past each stage, confirm:

- **Causal isolation**: The key comparison varies only the intended mechanism.
- **Baseline adequacy**: The control reproduces the expected unmodified behavior.
- **Temporal ordering**: The proposed cause is observed before the effect.
- **Recurrence**: Sustained or repeated processes are demonstrated, not inferred from a single snapshot.
- **Numerical robustness**: Results survive resolution, geometry, and subgrid checks.
- **Observational comparability**: Model quantities are converted into observables with selection effects acknowledged.
- **Competing mechanisms**: Alternatives have been compared or explicitly ruled out by design.

# Claim Boundaries

- Treat simulation outputs as model-dependent evidence, not direct observational truth.
- Do not present one suite’s agreement as proof of a complete physical model.
- Distinguish validated mechanism support from plausible inference or speculative extension.
- Avoid generalizing from rare, extreme, or single-system results to typical populations without additional evidence.
- State explicitly where the mechanism remains untested (e.g., other redshifts, mass regimes, tracers, or simulation codes).

# Failure Modes

- **Mechanism non-activation**: The candidate process fails to trigger due to missing fuel, inefficient coupling, or incorrect timing.
- **Weak or null structural response**: The mechanism operates but is overwhelmed by competing processes such as contraction, heating, or environmental stripping.
- **Degeneracy**: Multiple mechanisms produce indistinguishable final states or observable signatures.
- **Boundary dominance**: Apparent effects are driven by numerical boundaries, initial conditions, or projection artifacts rather than physics.
- **Compensation**: Improved transmission or feedback efficiency is offset by reduced source production or abundance.
- **Overfitting to one diagnostic**: The model matches a single observable while failing independent linked constraints.
- **Scale mismatch**: Small-scale assumptions are applied outside their validated range.

# Validity Checks

- **Confounding**: Are initial conditions, environments, and post-processing matched across variants?
- **Selection effects**: Does the synthetic observable account for survey completeness, detection thresholds, and projection bias?
- **Statistical validity**: Are population claims supported by sufficient ensemble size and variance estimates?
- **Reproducibility**: Are model versions, initial conditions, random seeds, analysis scripts, and metric definitions documented?
- **Subgrid sensitivity**: Do conclusions depend on unresolved prescriptions for cooling, feedback, accretion, or transport?
- **Budget closure**: Are mass, energy, momentum, metal, and feedback budgets internally consistent?
- **External validity**: Is the result generalized only to regimes where it was explicitly tested?

# Provenance

- Derived from cluster 4 / subcluster 4.0 (galaxy-feedback-simulation-halo-mechanism-discovery-workflow).
- Synthesized from source skills: `agn-feedback-core-formation-workflow`, `reionization-escape-workflow`, `galaxy-simulation-research-workflow`, `high-redshift-hi-absorption-research-design`, `high-redshift-quasar-research-workflow`, `galaxy-dynamics-orbit-signature-exploration`, `magnetically-driven-relativistic-outflow-research`, `simulation-effective-mechanism-research`.
- Preserves the shared archetype: observable-driven mechanism discovery and validation through controlled simulation experiments.
