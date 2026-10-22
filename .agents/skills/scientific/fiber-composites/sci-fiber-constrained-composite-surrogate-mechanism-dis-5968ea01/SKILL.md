---
name: sci-fiber-constrained-composite-surrogate-mechanism-dis-5968ea01
description: A reusable end-to-end workflow for designing, validating, and iterating machine-learning-assisted mechanism discovery in constrained physical systems, coupling surrogate modeling with controlled benchmarking and explicit claim bounding.
scienceevolve-title: "Fiber composites and battery materials · constrained composite surrogate mechanism discovery"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent plan and execute reusable scientific discovery workflows where machine-learned surrogates, operators, or constrained models replace expensive simulations or experiments to explore mechanisms in complex physical systems. The skill structures the full route from gap definition and hypothesis generation through surrogate validation, mechanism discrimination, and claim bounding, while keeping all conclusions tied to evidence strength and explicit failure modes.

## When to use

Use when the user needs to:
- Formulate research questions for physical systems where direct high-fidelity evaluation is prohibitively expensive.
- Design studies that couple learned surrogates with physical constraints, sparse observations, or multi-scale models.
- Validate whether a surrogate-driven mechanism explanation holds against independent references, ablations, or controlled comparisons.
- Iterate between model improvement, hypothesis refinement, and scope limitation.

Do not use for operational laboratory protocols, clinical recommendations, or safety-critical engineering sign-off.

## Inputs required

- Target system class and the physical fields, states, or observables to predict.
- Known governing principles, conservation laws, or structural constraints relevant to the system.
- Baseline evaluation method (high-fidelity simulator, trusted oracle, or experimental benchmark) and its known limitations.
- Candidate surrogate or operator family and its intended role in the workflow.
- Hypothesis scope: interpolation, extrapolation, or mechanism discrimination.
- Available data: training distributions, sparse observations, held-out test regimes, and known coverage gaps.
- Evaluation metrics: accuracy, physical consistency, computational cost, diversity, robustness, or Pareto trade-offs.
- Constraints: hard feasibility limits, soft preferences, safety or ethics boundaries, and resource budgets.

## Core Workflow

1. **Gap Definition & Scope Bounding**
   - Reframe the user need as a bottleneck in the current evaluation loop (cost, resolution, data sparsity, or generalization).
   - Define the claim boundary: interpolation, mild extrapolation, or untested regime.
   - *Decision gate:* Stop if the target observable cannot be defined independently of the surrogate.

2. **Mechanism Decomposition & Descriptor Selection**
   - Identify coupled fields, mediators, or state variables that link inputs to target observables.
   - Select measurable mediators that can be validated separately from end-to-end outcomes.
   - Document which relationships are mechanistic, empirical, or uncertain.

3. **Hypothesis Generation**
   - Produce at least three ranked hypotheses in the form: “If [mechanism] holds, then [surrogate/intervention] should improve [observable] under [condition].”
   - For each hypothesis record: evidence strength (strong/moderate/weak/speculative), key assumptions, and likely failure modes.
   - *Decision gate:* Reject or merge hypotheses that lack a minimal falsification test.

4. **Surrogate/Operator Construction & Pre-validation**
   - Train or select the surrogate using high-fidelity reference data that covers stable, boundary, and near-degenerate states.
   - Validate the surrogate independently on held-out cases, including boundary and stress-test regimes, before composing it into larger workflows.
   - Check physical plausibility (conservation, invariants, monotonicity) and compare against reduced baselines.
   - *Decision gate:* If surrogate error is high or systematically biased on held-out boundary cases, stop and revise data coverage or model architecture.

5. **Controlled Study Design**
   - Define minimal viable validation: one primary output, one mediator, one physical constraint, and a fair baseline.
   - Establish controls:
     - **Positive control:** condition expected to amplify the mechanism.
     - **Negative control:** condition expected to suppress or isolate artifacts.
     - **Baseline:** existing solver, heuristic, or reference without the surrogate.
     - **Ablation:** remove one component (constraint, coupling, data source) at a time.
   - Pre-register stop conditions: surrogate violates known constraints, controls fail, or improvement falls within uncertainty.

6. **Execution & Layered Analysis**
   - Run evaluations and separate analyses by level:
     - **Surrogate level:** aggregate and boundary-case error, relative-state ordering, uncertainty calibration.
     - **Mechanism level:** mediator behavior, coupling consistency, physical residual checks.
     - **System level:** end-to-end objective, robustness across problem variants, cost trade-offs.
   - Visualize residuals and field differences; do not rely solely on scalar summaries.

7. **Benchmarking & Disagreement Diagnosis**
   - Compare results against the independent baseline/oracle and external benchmarks when available.
   - Classify any disagreement into: data-coverage gap, surrogate limitation, sampling artifact, confounding variable, reference-method bias, or true novel mechanism.
   - *Decision gate:* If disagreement is unclassified, iterate with targeted data or revised controls before claiming mechanism validation.

8. **Iteration or Redesign**
   - If surrogate fails independent tests → improve training coverage, representation, or decomposition.
   - If mediator and outcome mismatch → inspect missing physics, incorrect coupling, or measurement artifacts.
   - If results are promising but narrow → expand to broader regimes with stronger controls.
   - If all variants fail or controls contradict the hypothesis → narrow the claim boundary or retire the hypothesis.
   - *Stop condition:* Halt if hard constraints are violated, diversity collapses, surrogate uncertainty is too high for ranking, or safety/ethics boundaries are reached.

9. **Claim Bounding & Reporting**
   - Label each conclusion as: confirmed, partially supported, unsupported, or inconclusive.
   - Separate paper-supported patterns, domain-consistent analogies, and agent-inferred extensions.
   - State the validated regime, known failure modes, and extrapolation boundary explicitly.

## Output Format

1. Research question and scope boundary.
2. Mechanism map or coupling graph linking inputs → mediators → observables.
3. Ranked hypothesis table with evidence strength, assumptions, and failure modes.
4. Experimental/study design table: variables, controls, metrics, and stop conditions.
5. Surrogate pre-validation summary: held-out errors, boundary-case performance, and physical consistency checks.
6. Analysis plan and results: field-level accuracy, mediator behavior, system-level metrics, and residual diagnostics.
7. Benchmark comparison and disagreement diagnosis.
8. Iteration log: changes made, evidence updates, and retired hypotheses.
9. Validity checklist and explicit claim boundaries.

## Validation Gates

- Surrogate must pass independent held-out validation before being used for mechanism claims.
- Controls (positive, negative, baseline, ablation) must be defined before execution.
- Physical consistency checks must be satisfied before end-to-end performance is interpreted.
- External benchmark or independent reference must be consulted before claiming discovery.
- All conclusions must be labeled with evidence strength before final output.

## Claim Boundaries

- Distinguish interpolation within validated training coverage from extrapolation beyond it.
- Do not generalize from a single surrogate run, narrow parameter set, or one benchmark case to universal mechanism claims.
- Treat computational predictions as hypotheses until independently validated; never present them as experimental proof or engineering certification.
- Limit scope to the tested control-parameter regime, observation density, and surrogate architecture.

## Failure Modes

- **Surrogate failure:** poor boundary-case performance, systematic bias, memorization, or violation of physical constraints.
- **Coverage failure:** training data lacks boundary, metastable, rare, or extreme states relevant to the claim.
- **Confounding:** improvements caused by tuning, data leakage, simulator artifacts, or baseline disadvantage rather than the proposed mechanism.
- **Mediator mismatch:** surrogate predicts the target accurately but through incorrect physical pathways; mediator and end-to-end outcome decouple.
- **Sampling or optimization collapse:** search collapses to near-duplicates, single-objective tunneling, or diversity loss.
- **Extrapolation overreach:** claims extend beyond the validated input distribution or physical regime.
- **Irreducible uncertainty:** sparse observations, high noise, or unresolved scales prevent discriminating between competing mechanisms.

## Validity Checks

- **Confounding:** Are baselines fair (same objective, evaluator, and comparable budget)? Is data leakage eliminated?
- **Reproducibility:** Are splits, seeds, preprocessing, loss terms, and stopping criteria documented?
- **Statistical validity:** Are repeated runs, uncertainty estimates, and effect sizes reported for stochastic components?
- **Physical validity:** Do predictions respect known conservation laws, invariants, and boundary conditions?
- **Observational validity:** Are sparse observations sufficient, unbiased, and compatible with predicted fields?
- **Model degeneracy:** Can different assumptions produce indistinguishable outputs? If so, is a discriminator proposed?
- **Scope discipline:** Are new claims labeled as hypotheses until validated independently?

## Provenance

- Synthesized from cluster 41.1 (machine-learning-assisted mechanism discovery and validation).
- Source skills: physics-constrained-neural-topology-research (2305.04107), mlff-nested-sampling-exploration (2308.11426), photonic-surrogate-model-design (10.1364_oe.27.029620), discontinuous-fiber-composite-research-design (fiber__10.3390_jcs2040063), llm-guided-evolutionary-materials-discovery (2510.22503), icm-enrichment-energetics-research-pattern (astro-ph_0109471), acoustic-fibrous-materials-research-workflow (fiber__10.1177_1528083718805714), operator-learning-data-assimilation-skill (10.1016_j.jcp.2021.110698).
