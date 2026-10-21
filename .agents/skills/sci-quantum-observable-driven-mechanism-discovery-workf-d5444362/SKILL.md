---
name: sci-quantum-observable-driven-mechanism-discovery-workf-d5444362
description: A reusable end-to-end workflow for converting anomalous or unexplained observables into ranked mechanistic hypotheses, validating them through layered controls and model discrimination, and iterating until claims are bounded or rejected.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 27"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide an agent to transform an unexplained observation, regime gap, or baseline discrepancy into a rigorous, testable mechanism-discovery program. The workflow emphasizes decomposition of competing mechanisms, minimal viable validation with strong controls, orthogonal model comparison, and iterative claim bounding without treating any single study as domain consensus.

## When to use

- When a system shows an anomalous response, scaling behavior, structural signal, or transport feature that departs from an established baseline model.
- When the user needs to compare local/short-range mechanisms against emergent/collective ones, or distinguish intrinsic physics from extrinsic artifacts.
- When designing a new study that requires hypothesis generation, control structures, mechanism discrimination, and explicit stopping conditions.
- When moving from a single reported deviation to a reproducible, generalizable research question.
- Do not use this skill for operational laboratory protocols, hazardous material handling, or as a substitute for domain-specific safety reviews.

## Inputs required

- **Baseline model** or standard expectation and its stated validity boundaries.
- **Anomaly description:** the observable deviation, its context, and why existing explanations are insufficient.
- **Available evidence streams:** experimental observables, simulation outputs, imaging, spectroscopy, transport data, or structural information.
- **Candidate confounders:** known artifacts, disorder, finite-size effects, instrumental bias, or nuisance parameters.
- **Validation constraints:** accessible variables, control opportunities, computational or measurement budget, and non-operational safety boundaries.
- **Decision criteria:** what outcomes would support, weaken, or falsify a hypothesis.

## Core Workflow

1. **Frame the gap.** Define the baseline model, the observable deviation, and the regime where the baseline fails. Document why the anomaly is not already explained by accepted nuisances.
   - *Gate — Reproducibility & Nuisance Check:* If the anomaly cannot be reproduced across independent samples, realizations, or data subsets, or if it is fully explained by known nuisances, stop and document the outcome as resolved or artifactual.

2. **Decompose mechanisms.** Separate the observable into candidate mechanism families (e.g., local vs. collective, intrinsic vs. extrinsic, ordered vs. disordered). Treat boundaries between them as hypotheses, not assumptions.

3. **Generate ranked hypotheses.** For each mechanism family, produce at least three competing hypotheses. For each, specify:
   - Core claim and causal chain from microscopic variable to measured response.
   - Evidence strength (strong / moderate / weak / speculative).
   - Key assumptions required for the claim to hold.
   - Predicted signatures across at least two independent observables.
   - Likely failure modes and falsifiable outcomes.
   - *Gate — Discriminability Check:* If the hypotheses are observationally degenerate under available evidence, stop and redesign the study to add discriminating variables before proceeding.

4. **Design minimal viable validation.** Define the smallest set of comparisons that can distinguish the leading hypothesis from the strongest null or alternative.
   - Specify positive, negative, mechanism, and robustness controls.
   - Map independent variables, dependent variables, and confounders.
   - Predefine stopping conditions: controls fail, assumptions are violated, the signal is indistinguishable from noise, or multiple mechanisms remain degenerate.
   - *Gate — Feasibility Check:* If no feasible control can separate the top hypotheses, stop and flag the question as currently unresolvable with the proposed design.

5. **Execute layered analysis.** Perform data curation, baseline decomposition, and model comparison at a non-operational level.
   - Quantify the baseline contribution before adding complexity.
   - Estimate mechanism-specific signals using appropriate descriptors.
   - Compare nested models (baseline, extended, high-fidelity reference) with uncertainty intervals.
   - Propagate systematic and statistical uncertainties; check stability under alternative assumptions.
   - *Iteration trigger:* If the extended model fails to improve predictive validity beyond uncertainty, return to Step 3 and demote or revise the mechanism.

6. **Discriminate and bound claims.** Use orthogonal observables, cross-system comparisons, and control performance to rank explanations.
   - Require convergence of independent evidence before promoting a hypothesis.
   - Downgrade hypotheses that rely on ad hoc parameters or unconstrained assumptions.
   - *Gate — Convergence Check:* If independent observables disagree without a plausible shared mechanism, stop and inspect confounders or model misspecification before making mechanistic claims.

7. **Iterate or redesign.** Update the hypothesis table based on outcomes.
   - Promote hypotheses with multiple independent signatures; demote those requiring unsupported assumptions.
   - Add discriminating tests when two hypotheses fit the same data.
   - Escalate model complexity only when simpler models fail specified checks.
   - Document negative results as evidence that narrows the hypothesis space.
   - *Stop condition:* Converge on a bounded claim, pivot to a new research question, or halt when the hypothesis space is sufficiently narrowed or all viable paths are exhausted.

8. **Finalize and archive.** Produce the outputs, label evidence strength, mark inference boundaries, and record provenance.

## Output Format

For each invocation, return:

1. **Research question:** a concise, mechanism-focused question.
2. **Gap statement:** what the baseline explains, where it fails, and why the gap matters.
3. **Hypothesis table:** columns for hypothesis, mechanism family, evidence strength, key assumptions, predicted signatures, failure mode, and discriminating test.
4. **Validation plan:** minimal viable validation and strong controls, including variables, controls, primary observable, analysis method, and stopping conditions.
5. **Analysis plan:** decomposition steps, model comparison criteria, uncertainty propagation, robustness checks, and visualization strategy.
6. **Iteration rule:** how hypotheses will be updated based on possible outcomes.
7. **Validity and safety notes:** confounders, boundary conditions, reproducibility checks, and non-operational constraints.
8. **Evidence ledger:** separate sections for direct observation, model-dependent inference, and speculative extrapolation.

## Validation Gates

- **Reproducibility gate:** The anomaly and controls must be stable across independent samples, realizations, or data subsets before mechanistic interpretation.
- **Control gate:** Positive, negative, and mechanism controls must behave as expected; if they fail, halt interpretation and redesign.
- **Systematic gate:** Major uncertainty sources must be separated, estimated independently, and propagated transparently into derived quantities.
- **Identifiability gate:** Competing mechanisms must be statistically or observationally distinguishable; if degenerate, stop claiming discrimination.
- **Boundary gate:** Data must lie within the regime where the model is valid; near crossovers, asymptotic reasoning must be flagged.

## Claim Boundaries

- Limit claims to the tested systems, observables, and regimes.
- Distinguish direct observation from model-dependent inference and from speculative extrapolation.
- Do not treat single-study or single-observable agreement as field-wide consensus.
- Mark agent-generated hypotheses separately from literature-validated baselines.

## Failure Modes

- **Anomaly is artifactual:** The deviation arises from calibration error, background leakage, processing bias, or nuisance-parameter misspecification.
- **Mechanism degeneracy:** Multiple hypotheses produce indistinguishable observables under current constraints.
- **Overfitting:** A model explains the anomaly only by tuning unconstrained parameters or over-interpreting noise.
- **Regime violation:** The model is applied outside its derived validity boundary, rendering predictions unreliable.
- **Probe back-action:** The measurement or simulation method alters the phenomenon it seeks to characterize.
- **Confounding by hidden variables:** Uncontrolled disorder, heterogeneity, or finite-size effects mimic the proposed mechanism.
- **Premature convergence:** Stopping iteration before controls are satisfied or alternative mechanisms are excluded.

## Validity Checks

- **Null-model completeness:** Does the baseline include known noise, sampling limits, and processing choices?
- **Post hoc selection:** Were descriptors and statistics chosen before final evaluation?
- **Look-elsewhere burden:** Are implicit trials across descriptor families, subgroups, or energy regimes accounted for?
- **Robustness:** Do results survive alternative preprocessing, reconstruction choices, or model assumptions?
- **Statistical validity:** Are uncertainties, convergence, sampling windows, and sensitivity analyses reported?
- **External validity:** Are claims limited to tested regimes and not generalized without evidence?
- **Reproducibility:** Are inputs, selection logic, assumptions, and random seeds documented enough for independent reproduction?

## Provenance

- Synthesized from cluster 149 (subcluster 149.0) of the Codex scientific skills corpus.
- Derived from representative source skills: granular-metal-transport-exploration, phonon-coherence-thermal-transport-research, surface-adparticle-dynamics-exploration, helium-supersolid-research-design, cmb-geometric-anomaly-exploration, icosahedral-crystal-structure-exploration, cosmic-ray-spectral-workflow, superconductivity-microwave-anomaly-research.
- Preserves the shared observable-driven mechanism discovery and validation archetype without retaining domain-specific materials, parameters, or paper conclusions.
