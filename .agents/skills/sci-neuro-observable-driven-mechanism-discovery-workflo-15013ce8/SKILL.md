---
name: sci-neuro-observable-driven-mechanism-discovery-workflo-15013ce8
description: A reusable end-to-end workflow for proposing, validating, and bounding mechanistic hypotheses across physical, statistical, and computational systems by linking observable gaps to controlled experiments and simulations.
scienceevolve-title: "Neuromorphic computing and Ising optimization · observable driven mechanism discovery workflow 5"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

## Purpose

Use this skill to transform an observable gap in a complex system into a structured research program that discriminates among competing mechanistic explanations. It guides hypothesis generation, minimal validation design, multi-source evidence integration, and conservative claim updating without overgeneralizing from single studies.

## When to use

Use this skill when:

- A user asks to explain why a system behaves as observed under specific conditions, or why a model and observation disagree.
- The task requires designing studies to test whether a proposed mechanism (e.g., long-range interaction, non-equilibrium flux, stochastic sampling, phase transition, or temporal memory) is necessary or sufficient.
- The task involves comparing a detailed model against a reduced model, or benchmarking a physics-inspired algorithm or hardware substrate against strong digital or theoretical baselines.
- The user needs an iteration plan that updates hypotheses based on controlled evidence rather than post-hoc interpretation.

Do not use this skill for operational attack recipes, hazardous fabrication instructions, clinical guidance, deployment-ready certification, or as a substitute for domain-specific safety review.

## Inputs required

Ask for or identify:

- **Target system class and observable gap**: the behavior, mismatch, or scaling anomaly that needs explanation.
- **Current baseline**: the simplest model, method, or theory that currently describes the system.
- **Candidate mechanisms**: hypothesized interactions, dynamics, structures, or representations that could close the gap.
- **Evidence sources**: available simulation, experimental, analytical, or literature assets.
- **Constraints**: computational budget, data access, safety limits, and acceptable evidence strength.
- **Desired output**: research question, validation plan, analysis protocol, or decision memo.

## Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, stop and redesign before proceeding.

1. **Frame the observable gap**
   - Define the target behavior, mismatch, or anomaly as a reproducible difference between observation and baseline prediction.
   - Separate the raw observation from its interpretation.
   - **Gate**: If the gap cannot be expressed as a reproducible observable difference under defined conditions, stop and refine the question.

2. **Generate mechanistic hypotheses**
   - For each candidate mechanism, produce: a concise hypothesis statement, a predicted observable signature, evidence strength (`strong` / `moderate` / `weak` / `speculative`), key assumptions, and likely failure modes.
   - Rank hypotheses by falsifiability and the availability of a minimal discriminative test.
   - **Gate**: If no hypothesis can be tested with available resources, stop and scope down the system or question.

3. **Design minimal viable validation**
   - Select the smallest system, instance, or protocol that can discriminate the leading hypothesis from the baseline.
   - Define strong controls:
     - **Baseline control**: the current standard under identical evaluation conditions.
     - **Positive control**: a configuration known to produce the target behavior or signature.
     - **Negative control**: a configuration where the proposed mechanism is absent, weakened, or randomized.
     - **Ablation/substitution control**: a variant where the candidate mechanism is removed or replaced by a static approximation while other choices are held fixed.
   - Define metrics: direct observables, mechanism-specific proxies, derived properties, and robustness indicators.
   - Define stop conditions: resource exhaustion, control failure, inconclusive pilot, safety boundary, or contradiction of core assumptions.
   - **Gate**: If controls cannot be matched across variants in data, protocol, and resource budget, redesign before proceeding.

4. **Execute controlled comparison**
   - Run the minimal validation, preserving random seeds, splits, preprocessing, and stopping rules.
   - Collect evidence from all available streams (simulation, experiment, theory, literature benchmark).
   - **Gate**: If positive or negative controls fail, diagnose the setup before interpreting the target result.

5. **Integrate and reconcile evidence**
   - Compare results across evidence streams.
   - Label findings as: directly observed, simulator-supported, experiment-supported, or inferred.
   - Reconcile disagreements by auditing assumptions (e.g., simulator idealization, measurement confounders, finite-size effects, disorder sampling).
   - **Gate**: If evidence streams contradict and the cause is unresolved, flag the result as inconclusive and narrow the claim.

6. **Discriminate mechanisms**
   - Attribute performance differences to specific mechanisms using ablation outcomes, error patterns, sensitivity analysis, and regime-specific behavior.
   - Exclude mechanisms that do not produce their predicted signatures.
   - **Gate**: If multiple mechanisms remain indistinguishable, do not rank them arbitrarily; design a decisive follow-up test.

7. **Update claim boundaries**
   - Classify conclusions as: supported under tested conditions, unsupported, or unresolved.
   - State explicit boundary conditions: regimes, system sizes, interaction ranges, or model classes where the claim does not apply.
   - **Gate**: If evidence supports only a narrow setting, do not generalize.

8. **Iterate or terminate**
   - If the hypothesis is supported, escalate to stronger validation (larger scale, held-out regimes, transfer tests, or alternative baselines).
   - If the hypothesis fails, preserve the negative result, record boundary conditions, and reformulate the mechanism.
   - If results are inconclusive, redesign the minimal test with sharper discriminants or stronger controls.
   - **Stop** when the research question is answered within stated boundaries, resources are exhausted, or the claim is sufficiently bounded.

## Output Format

When using this skill, return:

1. `Research question`: the precise observable-driven question.
2. `Gap and baseline`: current understanding and why it is insufficient.
3. `Ranked hypotheses`: table with mechanism, predicted signature, evidence strength, key assumptions, and failure modes.
4. `Validation plan`: minimal viable validation, controls, metrics, data boundaries, and stop conditions.
5. `Evidence ledger`: results by source (simulation, experiment, theory), labeled by support level and any cross-stream disagreements.
6. `Mechanism discrimination`: which mechanisms are excluded, supported, or unresolved, with reasoning.
7. `Claim boundary`: explicit limits of validity, extrapolation warnings, and non-transferable assumptions.
8. `Iteration path`: next decisive test, termination rationale, or redesign plan.

## Validation Gates

- **Observable framing gate**: the gap must be a reproducible difference, not an interpretation.
- **Resource feasibility gate**: the minimal validation must be executable within stated constraints.
- **Control validity gate**: positive and negative controls must behave as expected before target interpretation.
- **Evidence consistency gate**: disagreements between evidence streams must be audited, not averaged away.
- **Mechanism exclusion gate**: unsupported mechanisms must be explicitly excluded rather than ignored.
- **Claim bounding gate**: conclusions must be tagged with tested conditions and boundary limits before dissemination.

## Claim Boundaries

- Distinguish "supported under tested assumptions" from "proven universally."
- Do not extrapolate across dimensions, interaction ranges, coupling distributions, hardware generations, or problem families without new evidence.
- Separate algorithmic efficiency claims from physical mechanism claims.
- Label simulator-only results as conditional on modeling assumptions.
- Label single-system, single-instance, or single-regime results as context-specific.
- Avoid treating a single high-fidelity fit as proof that the underlying mechanism is correct.

## Failure Modes

- Overfitting to calibration data, a single trajectory, or a narrow parameter window.
- Confounding by hidden variables, noise, preprocessing choices, or split design.
- Simulator-experiment mismatch due to idealized boundary conditions, coarse graining, or missing physics.
- Finite-size, finite-time, or finite-sample artifacts mistaken for mechanism signatures.
- Ablation ambiguity: removing one mechanism also removes correlated effects, producing false negatives.
- Baseline unfairness: mismatched data, resources, capacity, or stopping criteria between comparators.
- Overgeneralization from a single problem family, device, material, or dynamical regime.
- Conflating improved sampling or optimization efficiency with validation of a physical hypothesis.

## Validity Checks

Before presenting results, verify:

- **Scope**: Does the claim address the specific observable gap rather than absolute truth?
- **Baseline alignment**: Are comparators matched for data, resources, protocol, and stopping criteria?
- **Control validity**: Did positive, negative, baseline, and ablation controls behave as expected?
- **Data leakage**: Are training, calibration, and test conditions separated consistently across all variants?
- **Statistical robustness**: Are uncertainties, repeated trials, variance, and sample-to-sample variability reported?
- **Reproducibility**: Are definitions, splits, seeds, preprocessing steps, and evaluation criteria specific enough to audit?
- **Evidence labeling**: Are proven observations, plausible mechanisms, and speculative extrapolations clearly separated?
- **Boundary conditions**: Are limitations, confounders, and non-transferable assumptions explicitly stated?
- **Safety and ethics**: Is the study design non-operational, within approved boundaries, and free of high-risk procedural detail?

## Provenance

- Synthesized from cluster 5.0 (observable-driven mechanism discovery and validation).
- Source skill references: `puf-security-boundary-research-design`; `physics-decomposed-materials-mlip-design`; `spin-glass-monte-carlo-research-flow`; `computational-neuron-model-reduction`; `probabilistic-ising-optimization-agent`; `imt-neuromorphic-device-exploration`; `chaos-dynamics-ml-exploration`; `statistical-physics-inference-research-design`.
- No paper-specific parameters, numerical results, material recipes, or operational protocols are included in this reusable workflow body.
