---
name: sci-quantum-symmetry-guided-evidence-analysis-workflow-69d4aba5
description: A reusable end-to-end workflow for generating, validating, and auditing scientific claims using symmetry, conservation, and structural constraints across theory, simulation, and experiment.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to plan and execute research projects that use symmetry, conservation laws, and structural constraints to separate mechanisms, rank hypotheses, and bound claims. The workflow transfers a reasoning pattern—starting from a discrepancy or bottleneck, extracting exact or semi-exact constraints, designing minimal validation with strong controls, and iterating based on evidence—without embedding any single material, model, or experimental system.

## When to use

Use this skill when:
- The research domain involves competing mechanisms, overlapping observables, or latent channels that must be disentangled.
- Symmetry, topology, conservation laws, or invariance arguments can restrict allowed behaviors or bound candidate explanations.
- Designing studies that combine multiple diagnostics (global/local, spectral/spatial, linear/nonlinear) to avoid single-signal overinterpretation.
- The user needs a structured hypothesis table, validation plan, analysis protocol, and iteration rules before committing to large-scale simulation or experiment.
- Claims must be audited for confounders, finite-size effects, boundary artifacts, and model-specific assumptions.

## Inputs required

Before producing a plan, request or identify:
- **Target phenomenon or discrepancy:** the observed gap, unexpected signature, or performance bottleneck.
- **Structural constraints:** known symmetries, conservation laws, exact relations, or invariance principles that bound admissible explanations.
- **Candidate mechanisms:** competing hypotheses or latent channels that could produce the observed behavior.
- **Observable set:** primary and complementary diagnostics available (experimental, numerical, or analytical).
- **Control resources:** accessible positive, negative, internal, and robustness controls.
- **Scope and boundaries:** regime of validity, acceptable approximations, safety or compliance limits, and stopping criteria.

## Core Workflow

Follow this ordered end-to-end route, enforcing the decision gates and stop conditions at each stage.

1. **Frame the gap and extract constraints.**
   Reframe the research question from "what is unknown?" to "what constraints must any valid description satisfy?" Identify exact, semi-exact, symmetry-derived, or conservation bounds that restrict admissible mechanisms.
   **Decision Gate 1 — Constraint Gate:** If the constraints are ill-defined or inapplicable to the target regime, stop and refine the target phenomenon before proceeding.

2. **Build a minimal mechanism model.**
   Assemble the smallest set of tunable contributions or latent channels that can produce the observed discrepancy while respecting the extracted constraints. Separate universal relations from model-specific closure assumptions.
   **Decision Gate 2 — Model Gate:** If the candidate model violates a verified generic constraint under compatible definitions, reject or revise it immediately.

3. **Generate ranked hypotheses.**
   For each candidate mechanism, produce a hypothesis entry containing: core claim, predicted observable trend across at least two independent diagnostics, evidence strength (established / plausible / speculative / unsupported), key assumptions, likely failure mode, boundary of validity, and minimal validation test. Prioritize hypotheses that are falsifiable with available resources.

4. **Design minimal validation.**
   Define independent variables (structural, excitation, perturbation), dependent variables (primary and complementary observables), and nuisance variables. Specify positive, negative, internal, and robustness controls. Set evaluation metrics tied to constraint satisfaction, mechanism discrimination, and reproducibility.
   **Decision Gate 3 — Design Gate:** If the test cannot distinguish the hypothesis from confounders or nuisance effects, redesign the observable set or downgrade the claim scope.

5. **Execute and collect evidence.**
   Perform simulations, measurements, or analytical checks using the complementary diagnostic suite. Record calibration, preprocessing choices, and boundary conditions. Do not rely on a single signal for mechanism assignment.

6. **Analyze with constraint-aware auditing.**
   Test generic constraints first; apply class-specific relations only after documenting structural evidence for the relevant class. Use joint distributions of orthogonal observables to decompose mixed signals. Compare results against all controls. Quantify uncertainty, finite-size effects, convergence limits, and sensitivity to analysis choices.
   **Decision Gate 4 — Robustness Gate:** If independent diagnostics disagree within stated uncertainty, treat the claim as provisional, split the hypothesis into competing sub-mechanisms, and require an additional distinguishing diagnostic before strengthening the claim.

7. **Update or terminate.**
   - *If constraints are satisfied and diagnostics agree:* Strengthen the hypothesis, narrow the mechanism, and propose a held-out prediction or broader perturbation test.
   - *If constraints are violated:* Diagnose whether the violation stems from misclassification, approximation failure, incorrect regime selection, or missing physics. Reject or revise the candidate accordingly.
   - *If results are inconclusive:* Add an orthogonal proxy, improve calibration, or increase statistical power before stronger claims.
   **Stop conditions:** Terminate if target and nuisance responses scale identically; if controls fail; if the signature is explainable by known systematics; if the claim requires extrapolation beyond verified boundary conditions; or if safety, compliance, or resource limits prevent controlled validation.

8. **Bound the claim.**
   Classify each conclusion as directly observed, model-inferred, extrapolated, or speculative. State the narrowest valid regime, symmetry class, and approximation validity. Separate evidence for structural analogy from evidence for final phenomenon realization.

## Output Format

When using this skill, produce:

1. **Research question and gap** — concise statement of the discrepancy and why existing evidence is insufficient.
2. **Constraint map** — generic constraints, class-specific constraints, required assumptions, and expected diagnostic value.
3. **Ranked hypothesis table** — claim, mechanism, evidence strength, key assumptions, predicted signature, likely failure mode, and minimal validation test.
4. **Validation design** — variables, controls, metrics, and stop conditions.
5. **Analysis plan** — diagnostic hierarchy, joint-observable strategy, uncertainty handling, and model-to-data comparison rules.
6. **Iteration rules** — decision tree for agreement, quantitative failure, diagnostic conflict, finite-size dominance, or constraint violation.
7. **Claim boundary statement** — validity limits, confounders, reproducibility requirements, and residual speculation.

## Validation Gates

- **Constraint Gate:** Constraints are well-posed, applicable, and derived from exact or robust symmetry arguments.
- **Model Gate:** The minimal mechanism model respects all generic constraints; violations trigger immediate revision.
- **Design Gate:** The validation plan includes falsifiable comparisons and discriminative controls.
- **Robustness Gate:** Independent diagnostics agree within uncertainty; perturbations do not destroy the signature.
- **Claim-Bounding Gate:** Evidence is classified and extrapolation limits are explicitly stated before dissemination.

## Claim Boundaries

- Distinguish structural or symmetry analogy from direct demonstration of the target phenomenon.
- Limit claims to the tested regime, symmetry class, and model validity; avoid generalizing from a single system without cross-system replication.
- Mark model-inferred, extrapolated, and simulation-based conclusions separately from directly observed evidence.
- Do not present a single study or model as field-wide consensus.

## Failure Modes

- **Proxy failure:** Optimizing an indirect metric that does not capture the target mechanism.
- **Partner/coupling failure:** Missing a necessary multicomponent structure, reference object, or coupled channel.
- **Misclassification:** Applying class-specific constraints to a system lacking the required structural properties.
- **Diagnostic conflict:** Independent observables yield incompatible conclusions without an identified resolution path.
- **Finite-size or boundary dominance:** Artifacts from limited system size, open boundaries, transients, or scan gradients mistaken for bulk behavior.
- **Systematic mimicry:** Nuisance effects (drift, calibration error, background, disorder, numerical artifacts) reproduce the target signature.
- **Overfitting:** Tuning a model or design to one dataset without an independent predictive test.
- **Unsupported extrapolation:** Extending claims beyond verified symmetry class, energy regime, or approximation validity.

## Validity Checks

- **Assumption audit:** Every exact, scaling, symmetry, stationarity, and boundary assumption is listed.
- **Observable audit:** Complementary diagnostics use compatible conventions and refer to the same variable, regime, and dynamical state.
- **Control audit:** Positive, negative, internal, and robustness controls are present and discriminative.
- **Regime audit:** Asymptotic, transient, finite-size, and crossover regimes are separated.
- **Reproducibility audit:** Estimates are stable across system sizes, boundary conditions, analysis windows, and independent runs.
- **Evidence audit:** Claims are labeled as verified, inferred, or speculative; source-paper findings are separated from new-agent inferences.

## Provenance

- Synthesized from cluster 77.0 ("symmetry-guided evidence analysis and claim audit").
- Derived from source skills: `quantum-spin-ladder-research-planning`, `thz-wakefield-photonic-exploration`, `ion-surface-electron-emission-workflow`, `stochastic-dynamics-constraint-guided-research`, `higher-landau-level-quantum-geometry-design`, `dressed-atom-spin-interaction-exploration`, `nonhermitian-photonic-design-exploration`, `metasurface-bic-spectral-lineshape-exploration`.
