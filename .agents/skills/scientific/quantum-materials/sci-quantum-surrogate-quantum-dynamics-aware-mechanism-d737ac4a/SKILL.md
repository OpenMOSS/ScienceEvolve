---
name: sci-quantum-surrogate-quantum-dynamics-aware-mechanism-d737ac4a
description: Use this skill when designing end-to-end research plans that combine expensive high-fidelity references with interpretable surrogate approximations to discover and validate mechanisms in complex dynamical systems.
scienceevolve-title: "Quantum materials and condensed matter · surrogate quantum dynamics aware mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help an agent design reusable end-to-end research plans for discovering and validating mechanisms in complex dynamical systems by coupling expensive high-fidelity references with interpretable surrogate approximations.

## When to use

Use this skill when the user needs to:
- Propose research questions where a computationally expensive reference limits broad exploration.
- Design physics-aware or structure-aware surrogate models that preserve hypothesized mechanisms.
- Validate whether a reduced representation retains the target mechanism across regimes.
- Iterate between hypothesis generation, surrogate construction, and mechanistic interpretation.

Do not use this skill for operational deployment, experimental hardware recipes, clinical or outbreak response, or safety-critical decision-making.

## Inputs required

- Target dynamical system and observable of interest.
- High-fidelity reference method or trusted benchmark.
- Candidate surrogate class or approximation strategy.
- Regime variables to test (e.g., phase, scale, noise, structure, temperature).
- Baseline models for comparison (naive and strong).
- Computational constraints, acceptable uncertainty, and stopping criteria.

## Core Workflow

1. **Define bottleneck and frame mechanism question.**  
   Identify the quantity that is too expensive for repeated evaluation and cast the research goal as a falsifiable claim about a structural driver or dynamical pathway.  
   - *Decision gate:* Stop if the question cannot be expressed as a falsifiable mechanism hypothesis with a predicted observable signature.

2. **Generate layered hypotheses.**  
   For each candidate mechanism, state the hypothesis, mechanistic rationale, evidence strength (high / medium / low), key assumptions, predicted signatures, and likely failure modes.  
   - *Iteration trigger:* If no hypothesis reaches at least “medium” evidence strength, return to gap analysis and literature review before building models.

3. **Design reduced representation.**  
   Select descriptors, bases, or local-environment features that encode the hypothesized mechanism while removing expensive degrees of freedom.  
   - *Decision gate:* Stop if the representation violates known symmetries, conservation laws, or structural constraints of the target system.

4. **Build and calibrate surrogate.**  
   Train or derive the approximation using the reduced representation. Prefer models whose assumptions can be inspected and tested under distribution shift.  
   - *Stop condition:* If the surrogate cannot outperform a simple baseline on held-out interpolation data, escalate to descriptor redesign or data expansion. Do not proceed to downstream validation.

5. **Validate against reference under matched constraints.**  
   Compare surrogate and reference on identical inputs. Report error distributions, physical consistency, and regime-dependent residuals.  
   - *Decision gate:* If discrepancies are systematic, return to Step 3 to revise the representation. If discrepancies are random but large, return to Step 4 to check coverage or model capacity.

6. **Test transferability and boundaries.**  
   Evaluate extrapolation to untrained regimes using explicit boundary cases and negative controls.  
   - *Stop condition:* Do not claim broad transferability unless target regimes are represented in the validation set. Narrow the claimed scope if performance degrades outside interpolation.

7. **Mechanistic interpretation and iteration.**  
   Use validated surrogate predictions to discriminate between hypotheses. Update the mechanism model, then either iterate from Step 2 with refined hypotheses or finalize the research plan.  
   - *Iteration trigger:* If downstream observables are insensitive to surrogate improvements, reassess whether the original bottleneck was correctly identified.

## Output Format

When using this skill, return:

1. **Research question and mechanistic framing** — concise bottleneck statement and target observable.
2. **Hypothesis portfolio** — 2–4 hypotheses with evidence strength, key assumptions, predicted signatures, and failure modes.
3. **Surrogate design summary** — representation choice, baseline comparisons, and calibration results.
4. **Validation report** — reference comparison, error decomposition, physical-consistency checks, and distributional diagnostics.
5. **Boundary analysis** — regimes of validity, transferability limits, and negative-control outcomes.
6. **Iteration plan** — triggers for descriptor revision, model replacement, or scope narrowing.
7. **Validity and ethics statement** — confounders, reproducibility requirements, uncertainty, and safety boundaries.

## Validation Gates

- **Interpolation gate:** The surrogate must exceed both simple and strong baselines on held-out data from the training distribution before any extrapolation is attempted.
- **Physical-consistency gate:** Predictions must respect known symmetries, limits, and qualitative trends; violations trigger descriptor redesign.
- **Fair-comparison gate:** Reference and surrogate must use matched inputs, preprocessing, and evaluation metrics so that differences are attributable to the approximation.
- **Boundary gate:** Explicit negative controls and boundary cases must be included; claims must be restricted to tested regimes.

## Claim Boundaries

- Distinguish proven theoretical bounds, numerically supported patterns, and speculative extrapolations.
- Separate paper-supported methodological patterns from new-system inferences.
- Do not present single-study surrogate success as universal mechanism discovery.
- Limit claims to the tested observable, regime variables, and system classes.

## Failure Modes

- **Descriptor failure:** The reduced representation omits a hidden long-range correlation or symmetry, causing systematic residuals.
- **Distribution shift:** The target regime occupies a different descriptor space than the training regime, producing silent failures.
- **Baseline insufficiency:** The surrogate appears valid only because the baseline is artificially weak.
- **Overfitting to initial conditions:** Agreement arises from narrow initialization or post-selection rather than robust mechanism capture.
- **Approximation breakdown:** The surrogate works in regular regimes but fails near critical points, separatrices, or strong-correlation regions.
- **Confounding by nuisance variables:** Apparent mechanism is actually driven by uncontrolled variables such as noise, finite-size effects, or preprocessing artifacts.

## Validity Checks

Before presenting conclusions, check:
- **Confounding:** Are upstream inputs, preprocessing, and nuisance variables controlled or explicitly varied?
- **Reproducibility:** Are data splits, descriptor definitions, random seeds, and analysis settings documented for independent reruns?
- **Statistical validity:** Are uncertainty estimates, confidence intervals, and sample sizes reported? Are test sets independent of training data?
- **Mechanistic consistency:** Does each discrepancy map to a plausible physical explanation or approximation assumption?
- **Downstream relevance:** Do surrogate errors propagate to the intended observables, or are they hidden by averaging?
- **Scope discipline:** Are paper-derived patterns separated from project-specific inferences?

## Provenance

Synthesized from cluster 73.0 (machine-learning-assisted mechanism discovery and validation) source skills: `gbs-graph-research-workflow`, `flat-histogram-bottleneck-research`, `network-epidemic-dynamics-workflow`, `magnetic-material-ml-lsf-workflow`, `quantum-bell-communication-complexity-workflow`, `quantum-measurement-feedback-chaos-exploration`, `excitonic-surrogate-research-workflow`, `quantum-circuit-observable-exploration`.
