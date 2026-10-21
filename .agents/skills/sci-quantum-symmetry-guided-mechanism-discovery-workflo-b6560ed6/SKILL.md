---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-b6560ed6
description: A reusable end-to-end workflow for designing symmetry-guided mechanism discovery and validation studies across quantum, condensed-matter, and dynamical systems.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 10"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Use this skill to convert a candidate physical mechanism into a testable research program. The goal is to help an agent propose new questions, build minimal models, design controlled validations, analyze multi-observable evidence, and iterate on hypotheses in systems where symmetry breaking, phase transitions, transport regimes, or pattern selection may govern observable behavior. The workflow treats no single study as field consensus and keeps all claims bounded by the evidence.

## When to use

Use this skill when the user asks for:

- Research-question generation or hypothesis formulation around symmetry-protected limits, symmetry-breaking perturbations, or regime boundaries.
- Minimal model design and validation planning for quantum transport, correlated matter, phase-transition dynamics, elastic or pattern-forming systems, or coupled-order-parameter materials.
- Mechanism discrimination, multi-observable analysis plans, or controlled numerical or conceptual experimental designs.
- Critiques of whether a proposed mechanism is supported, underdetermined, or valid only in a narrow regime.

Do not use this skill for operational fabrication recipes, hazardous laboratory protocols, device-operation manuals, or general-purpose physics tutoring outside the mechanism-discovery context.

## Inputs required

Before generating a plan, request or infer:

- **Target system class** and relevant degrees of freedom.
- **High-symmetry or protected reference limit** with identifiable states, selection rules, or scaling behavior.
- **Candidate perturbation or symmetry-breaking mechanism** and how it is expected to alter the target observable.
- **Target observable(s)** such as spectral features, transport coefficients, response scaling, pattern selection, or correlation structures.
- **Available baseline data, benchmarks, or literature limits** needed to trust the model or measurement pipeline.
- **Feasible constraints** on modeling tools, measurement access, sample quality, and computational cost.
- **Known confounders** including disorder, environment, finite-size effects, background contributions, and initialization sensitivity.

## Core Workflow

Follow this ordered route. Apply the decision gates and stop conditions at each step.

1. **Anchor the gap and baseline**
   - Frame the research question around an unresolved boundary between established regimes or an unexplained response.
   - Identify the high-symmetry or protected reference limit and its expected degeneracies, selection rules, or scaling behavior.
   - Collect independent benchmarks or literature limits.
   - *Stop condition:* Halt if no protected limit or benchmark can be defined.

2. **Construct a minimal model**
   - Reduce to the smallest set of degrees of freedom, symmetries, and interactions that can host the candidate mechanism.
   - Represent physical processes as modular operations (e.g., propagation, conversion, scattering, coupling, accumulation).
   - State all assumptions explicitly and list omitted complexities.
   - *Stop condition:* Halt if the mechanism cannot be expressed without unsupported microscopic detail.

3. **Generate ranked, falsifiable hypotheses**
   - For each candidate mechanism, specify: predicted observable signature, causal chain, key assumptions, evidence strength (high / medium / low / speculative), strongest competing explanation, and likely failure mode.
   - Include at least one null or robustness hypothesis predicting no change outside singular regions.
   - *Gate:* Do not proceed if hypotheses lack discriminating signatures or clear falsification criteria.

4. **Design the validation matrix**
   - Define symmetry-distinct perturbation conditions; avoid using perturbation magnitude alone as the main variable.
   - Include: baseline, active mechanism condition, negative control (mechanism removed or symmetry restored), positive control (known benchmark limit), orthogonal control (varies a different parameter), and method control (convergence, calibration, or reference-method comparison).
   - Define primary, secondary, and diagnostic observables.
   - *Stop condition:* Halt if controls cannot separate the candidate mechanism from disorder, geometry, transparency, or artifact effects.

5. **Validate the baseline**
   - Confirm that the minimal model reproduces the protected limit and known benchmarks.
   - Check numerical convergence, sum rules, conservation laws, or measurement calibration as appropriate.
   - *Decision gate:* If baseline validation fails, return to Step 2 to revise the model. If it passes, proceed.

6. **Execute perturbations and collect multi-observable evidence**
   - Run the active condition and all controls.
   - Record the primary observable plus at least two independent secondary checks.
   - Decompose the response into mechanism-mediated and direct/background contributions where the formalism allows.
   - *Stop condition:* Halt if the effect is smaller than uncertainty, calibration limits, or background levels.

7. **Discriminate mechanisms through symmetry and regime analysis**
   - Compare perturbation-induced changes across conditions using symmetry decomposition, scaling tests, spectral assignment, phase maps, or regime boundaries.
   - Test whether negative or orthogonal controls reproduce the signature.
   - Quantify sensitivity to nuisance parameters, finite-size effects, boundary conditions, and model assumptions.
   - *Decision gate:* If controls explain the trend, reject or revise the hypothesis and return to Step 3. If the signature survives controls, proceed.

8. **Assess robustness and assign evidence strength**
   - Verify reproducibility across independent settings, solver choices, analysis pipelines, or disorder realizations.
   - Evaluate whether conclusions are invariant to reasonable assumptions.
   - Classify evidence:
     - **Strong:** supported by multiple independent checks and robust to solver/settings variation.
     - **Moderate:** consistent across partial observables or approximate methods, but sensitive to regime assumptions.
     - **Weak:** limited-size trend or single-model prediction without strong controls.
     - **Speculative:** extrapolation beyond the studied model class.
   - *Stop condition:* Halt if conclusions depend on arbitrary settings, single-observable trends, or unverified parameter choices.

9. **Propose bounded extensions (optional)**
   - Only after mechanistic validation, propose functional, transport, pattern-formation, or device-level implications as new boundary-conditioned hypotheses.
   - Identify additional mechanisms and tests required before accepting functional claims.
   - *Gate:* Do not extrapolate to other materials, larger perturbations, or device architectures without independent validation.

10. **Iterate or conclude**
    - **If supported:** Narrow the mechanism by removing redundant variables and propose the next discriminating test.
    - **If ambiguous:** Add stronger controls or select a more selective observable.
    - **If refuted:** Redesign the model basis, interaction treatment, or perturbation classification.
    - Document claim boundaries, residual risks, and provenance.

## Output Format

When using this skill, return:

1. **Research question** — One concise question tied to a target system and observable.
2. **Ranked candidate hypotheses** — Table with mechanism, predicted signature, evidence strength, key assumptions, competing explanations, likely failure modes, and discriminating controls.
3. **Minimal validation plan** — Baseline, perturbation arms, negative control, positive control, orthogonal control, method control, primary/secondary/diagnostic observables, success criteria, and stop conditions.
4. **Analysis workflow summary** — Steps for baseline validation, symmetry assignment, mechanism diagnosis, uncertainty assessment, and control comparison.
5. **Regime map or phase boundary summary** — Regions where the hypothesis is supported, ambiguous, or rejected.
6. **Iteration path** — How results update, narrow, or reject each hypothesis.
7. **Boundary statement** — What the claim supports, what remains speculative, what additional evidence is needed, and external-validity limits.

## Validation Gates

- **Baseline recovery gate:** The model or pipeline must reproduce the protected limit and known benchmarks before exploring new perturbations.
- **Control survival gate:** The predicted signature must exceed negative controls and known artifacts.
- **Multi-observable gate:** Conclusions must rest on at least two independent observables or checks, not a single peak, trend, or parameter sweep.
- **Mechanism exclusion gate:** The design must be able to address leading alternative mechanisms (e.g., disorder, geometry, transparency, background).
- **Robustness gate:** Results must survive sensitivity checks, independent replication, and reasonable variation of nuisance parameters.

## Claim Boundaries

- Distinguish source-supported findings, agent-inferred hypotheses, and speculative extensions explicitly.
- Limit claims to the tested symmetry regime, model class, parameter range, and finite-size window.
- Do not present single-study, single-model, or single-platform results as field consensus.
- Functional or device-level implications require separate validation and must be labeled as boundary-conditioned proposals.
- Avoid generalizing across material classes, platforms, or architectures without independent evidence.

## Failure Modes

- **Baseline validation fails:** The model cannot reproduce the protected limit or benchmark behavior.
- **Control confounding:** Negative or orthogonal controls reproduce the signature, indicating a hidden variable or artifact.
- **Degenerate mechanisms:** Multiple distinct mechanisms explain the same observable equally well.
- **Artifact dominance:** Boundary effects, finite-size artifacts, numerical settings, initialization sensitivity, or measurement choices explain the trend.
- **Overfitting:** Conclusions depend on narrow fitting windows, unconstrained parameters, or selective reporting of favorable regimes.
- **Extrapolation error:** Claims are extended to untested regimes, larger perturbations, or device behavior without independent validation.

## Validity Checks

- **Confounding:** Assess disorder, defects, substrate or environment, finite-temperature effects, relaxation, competing interactions, and nuisance parameters.
- **Reproducibility:** Document model assumptions, observable definitions, solver or measurement settings, convergence criteria, and analysis pipelines at a level sufficient for independent replication.
- **Boundary conditions:** Confirm that the assumed symmetry subgroup, perturbation regime, and approximation domain remain appropriate.
- **Statistical and numerical validity:** Report convergence tests, uncertainty estimates, sensitivity analysis, sum rules, conservation checks, and residual diagnostics.
- **External validity:** Avoid generalizing from one platform, material, or model class to the entire field without targeted validation.
- **Claim discipline:** Separate validated evidence from model predictions, symmetry inferences, and speculative implications.

## Provenance

- Synthesized from cluster 126.0 (symmetry-guided mechanism discovery and validation).
- Derived from source skills: strained-2d-exciton-symmetry-workflow, quantum-dot-spin-transport-exploration, hybrid-sns-scattering-workflow, magnetoelastic-scaling-research-workflow, open-quantum-loss-transport-exploration, elastic-buckling-spectral-lock-in-exploration, heavy-ion-phase-transition-pattern-discovery, saf-domain-wall-research-agent.
- Preserves shared methodological patterns without importing source-specific systems, materials, parameters, numerical results, or paper conclusions.
