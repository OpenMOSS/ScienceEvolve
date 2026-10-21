---
name: sci-cosmology-simulation-mechanism-discovery-validation-bbd2330d
description: A reusable end-to-end workflow for discovering, discriminating, and validating physical mechanisms in multiscale computational models through controlled simulation, symmetry-guided hypothesis generation, and tiered evidence.
scienceevolve-title: "Galaxy, cosmology, and simulations · simulation mechanism discovery validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill helps an agent design reusable research workflows for multiscale computational physics and astrophysics. The workflow turns a baseline model mismatch or unresolved process into a testable mechanism question, designs controlled numerical experiments, validates reduced models against higher-fidelity references, and bounds all claims before they are used for new inference. It is not a summary of any single study and does not encode field-wide consensus.

# When to use

Use this skill when:

- A baseline model leaves systematic residuals or fails to generalize across a control variable, scale, or regime.
- The target system contains an unresolved, subgrid, or microphysical process that cannot be directly resolved in the intended simulation.
- You need to generate new research questions about how structural or symmetry features modify dynamics, profiles, or statistical templates.
- You must design controlled experiments, derive closure relations, recalibrate phenomenological templates, or validate a reduced model against resolved references.
- The work spans computational astrophysics, cosmology, nonlinear field theory, compressible/multiscale fluid dynamics, or related multi-physics modeling.

Do not use this skill for:

- Observational-only projects, unless the explicit goal is to connect unresolved physics to observable diagnostics through a simulation bridge.
- Operational laboratory protocols, hazardous procedures, or fabrication parameters.
- General-purpose tutoring or literature review generation.

# Inputs required

Before producing a research plan, collect or request:

- **Target system and baseline model:** the simulation, template, or theoretical framework that needs improvement.
- **Identified gap:** the mismatch, scale gap, or anomaly that motivates a mechanism search.
- **Candidate control variables:** structural, symmetry, spectral, or environmental variables expected to modulate the mechanism.
- **Reference data or benchmarks:** high-fidelity simulations, analytic limits, published benchmarks, or independent implementations.
- **Downstream use case:** the observable, inference goal, or decision context that the revised model must support.
- **Constraints:** computational budget, resolution limits, acceptable uncertainty, and reproducibility requirements.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Anchor the gap and define the mechanism question
Start from a reproducible mismatch between the baseline model and reference data or physical expectations. Define the unresolved contribution or structural anomaly in terms of a symmetry, scale, or spectral feature.
- **Decision gate:** Is the mismatch larger than numerical noise, boundary effects, and measurement uncertainty? If no, stop and audit controls.

## 2. Generate symmetry-guided mechanism hypotheses
Produce at least three ranked hypotheses:
- **Baseline hypothesis:** the system behaves like a known idealized limit under simple conditions.
- **Structure hypothesis:** heterogeneity, anisotropy, clustering, or symmetry breaking changes the mechanism relative to the baseline.
- **Closure/reduced-model hypothesis:** the net effect can be summarized by a compact relation between local control variables and integrated outcomes.
For each hypothesis record: evidence strength (high/moderate/low/not established), key assumption, minimal viable test, predicted signature, likely failure mode, and extrapolation boundary.

## 3. Design controlled experiments
Stage the study as a comparison matrix, not a single demonstration:
- **Baseline experiment:** reproduce a simple case with known behavior; verify conservation and stability.
- **Matched-environment perturbation:** hold the mean environment fixed while changing one structural or symmetry property.
- **Parameter sweep:** vary the local control variables; use sequential sweeps when cost is high and factorial sweeps when interactions are plausible.
- **Controls:** include baseline, matched-mean, negative (mechanism absent), positive (mechanism dominant), resolution, and measurement controls.
- **Decision gate:** Do the controls isolate the proposed mechanism from confounders? If no, redesign before executing.

## 4. Execute staged validation
Separate validation into tiers:
- **Offline / component validation:** test the mechanism or closure in isolation against filtered reference data, analytic limits, or benchmark problems.
- **Online / coupled validation:** embed the proposed model in the full solver or system; test long-time statistics, stability, and budget consistency.
- **Robustness validation:** repeat key comparisons with alternative resolutions, box sizes, numerical methods, or independent codes when feasible.
- **Decision gate:** Does the mechanism survive component tests? If no, revisit the predictor set or hypothesis. If coupled tests fail while offline tests pass, diagnose interaction effects, missing feedback, or implementation artifacts.

## 5. Analyze residuals and discriminate mechanisms
- Verify raw consistency (conservation, bookkeeping, boundary influence).
- Normalize by control variables; separate transient from asymptotic differences.
- Fit reduced relations only after confirming convergence and measurement robustness; prefer physically constrained forms.
- Stratify by regime (e.g., compressibility, density, scale, symmetry sector) rather than relying solely on aggregate metrics.
- **Decision gate:** Do residuals correlate with the control variable beyond what confounders or numerical artifacts can explain? If no, reject or refine the hypothesis.

## 6. Build and validate a reduced model
- Construct the minimal interpretable modification (closure, template, or parameter coupling) that removes the systematic trend.
- Validate on held-out configurations, independent observables, or downstream statistics not used in fitting.
- Compare against simpler alternatives; penalize added complexity unless it improves held-out prediction.
- **Decision gate:** Does the reduced model generalize and remain stable outside the training regime? If no, reduce flexibility, expand the training domain, or treat the model as descriptive rather than predictive.

## 7. Propagate to downstream observables and bound claims
- Translate model residuals or revised predictions into the final observable or inference space.
- Assess whether the change is scientifically meaningful for the stated downstream goal.
- State validity boundaries, extrapolation limits, and uncertainty sources.
- **Decision gate:** Is the improvement both scientifically impactful and numerically stable? If no, prefer the simpler baseline and document the boundary.

## 8. Iterate or terminate
Update the plan from systematic failure modes:
- If the baseline experiment fails, repair the setup before adding complexity.
- If a perturbation changes only transient behavior, keep the asymptotic closure simple.
- If outcomes are insensitive to a proposed variable, remove it and document the boundary.
- If effects are stochastic, model ensemble behavior or state the local-dependence boundary.
- If a simpler model explains the data equally well, abandon the complex hypothesis.
- **Stop conditions:** non-convergence, failure against controls, unresolved degeneracy, metric mismatch with the scientific goal, or inability to reproduce key results.

# Output Format

Return the research plan in this structure:

1. **Research question and gap statement**
   - Target system, baseline model, and unresolved process or anomaly.
2. **Hypothesis table**
   - For each hypothesis: mechanism, evidence strength, key assumptions, minimal test, predicted signature, likely failure mode, and extrapolation boundary.
3. **Experimental design**
   - Baseline, perturbation, sweep strategy, controls (negative, positive, resolution, measurement), and stop conditions.
4. **Analysis plan**
   - Consistency checks, residual diagnostics, regime stratification, fitting rules, uncertainty treatment, and visualization plan.
5. **Iteration rules**
   - Conditions that would support, weaken, refine, or reject each hypothesis.
6. **Validity and boundary statement**
   - Confounders, reproducibility requirements, parameter coverage limits, and claim-boundary language.

# Validation Gates

Before accepting any result, verify:

- **Numerical convergence:** key outcomes are stable under resolution and domain-size changes.
- **Measurement robustness:** alternative definitions of integrated quantities do not reverse conclusions.
- **Conservation consistency:** mass, momentum, energy, or other relevant budgets are internally consistent.
- **Control separation:** negative and positive controls produce distinguishable outcomes.
- **Cross-validation:** reduced models or fitted relations perform adequately on held-out data or independent observables.
- **Parameter coverage:** relations are not used outside sampled conditions without explicit warning.
- **Physical plausibility:** trends align with known limiting behavior and symmetries.
- **Reproducibility:** seeds, versions, initial states, measurement definitions, and analysis steps are recorded.

# Claim Boundaries

- Explicitly separate **paper-supported evidence**, **agent-inferred proposals**, and **unverified assumptions**.
- Label every conclusion as **demonstrated by the controlled workflow**, **inferred from comparison**, or **extrapolated beyond tested regimes**.
- Do not present a single simulation suite, template fit, or reduced model as observational truth or field-wide consensus.
- State the regime boundary where the model is expected to fail (e.g., missing physics, strong clustering, unresolved mixing, untested symmetry sectors).
- Distinguish evidence for a mechanism from evidence for a phenomenological description.

# Failure Modes

- The baseline mismatch is caused by numerical artifacts, boundary effects, or resolution limits rather than a missing mechanism.
- A hypothesis improves fit in one controlled setup but fails convergence checks or does not survive independent controls.
- Offline validation succeeds but online or coupled validation fails due to missing feedback, stability issues, or implementation artifacts.
- The reduced model overfits the training regime and requires retuning for each new case.
- A control variable correlates with a hidden variable (mass, environment, selection, resolution), producing spurious mechanism claims.
- Degeneracies (e.g., timing vs. amplitude, structure vs. mean state) prevent mechanism discrimination.
- The model improves on a training metric but fails to improve downstream observables or scientific inference.
- Hidden tuning, implementation details, or hardware differences masquerade as physical effects.

# Validity Checks

Before presenting conclusions, confirm:

- **Scope:** the target system belongs to the same broad class of multiscale computational modeling problems addressed by this workflow.
- **Evidence separation:** paper-supported findings are distinguished from new-system extrapolations.
- **Target clarity:** the unresolved quantity or mismatch is well-defined and computable from reference data.
- **Physical constraints:** conservation laws, symmetries, and limiting cases have been checked.
- **Controls:** baseline, negative, positive, ablation, and robustness controls are included and reported.
- **Statistical and numerical validity:** held-out data, convergence, distributional metrics, and uncertainty estimates are used.
- **Reproducibility:** data splits, filter definitions, metric definitions, and baseline descriptions are explicit enough to repeat.
- **Boundary conditions:** untested regimes (density, temperature, scale, redshift, Mach number, symmetry breaking) are stated as extrapolation boundaries.
- **Claim discipline:** conclusions are phrased as evidence for a modeling hypothesis, not as universal law.

# Provenance

- **Cluster / Subcluster:** 9 / 9.0
- **Workflow archetype:** symmetry-guided mechanism discovery and validation
- **Synthesized from source skills:** `unresolved-stellar-feedback-closure`, `reionization-self-consistent-simulation-workflow`, `cosmological-simulation-template-recalibration`, `compressible-sgs-closure-workflow`, `dark-matter-halo-profile-exploration`, `soliton-parametric-research-design`, `exascale-mission-driven-computational-research`, `astro-microphysics-solver-research`.
