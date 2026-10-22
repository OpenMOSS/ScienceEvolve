---
name: sci-cosmology-galaxy-formation-mechanism-discovery-via-d5020d30
description: A reusable end-to-end workflow for discovering, discriminating, and validating physical mechanisms in galaxy formation and cosmological simulations through staged hypothesis generation, controlled ablation, and symmetry-aware benchmarking.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy formation mechanism discovery via simulation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill guides an agent to turn an ambiguous astrophysical simulation problem into a structured, reusable research workflow. It is designed for computational cosmology and galaxy formation studies where the central challenge is to identify which physical mechanism—or combination of mechanisms—produces an observed behavior. The workflow covers hypothesis generation, staged numerical validation, mechanism discrimination, and conservative claim bounding.

# When to use

Use this skill when the user asks to:

- Propose new research questions about galaxy formation, cosmological structure, astrophysical plasmas, or multiscale feedback.
- Design numerical experiments to attribute causality to specific physical processes.
- Validate subgrid models, solver behavior, transport closures, or scaling relations against controlled baselines.
- Compare constrained simulation ensembles to random or matched controls.
- Iterate on hypotheses from simulation outputs, merger trees, or population-level diagnostics.

Do not use this skill for observational-only inference without a simulation-derived hypothesis, laboratory operational protocols, or hardware-specific implementation manuals.

# Inputs required

Before generating a research plan, collect or infer:

- **Target regime:** the astrophysical environment, scale range, and epoch of interest.
- **Phenomenon to explain:** the observable, scaling relation, or structural feature that needs mechanistic explanation.
- **Candidate mechanisms:** physical processes that could plausibly drive the phenomenon, with expected diagnostic signatures and known confounders.
- **Symmetry or conservation constraints:** expected invariants, symmetries, or limiting behaviors the model must respect.
- **Available assets:** simulation codes, benchmark solutions, reference catalogs, or prior validated results.
- **Abstraction budget:** acceptable simplifications (e.g., dimensionality, resolution, subgrid representation) for the first attribution stage.
- **Claim boundary:** the regimes, scales, and populations to which the conclusion must apply.

If inputs are missing, state assumptions explicitly and downgrade evidence strength accordingly.

# Core Workflow

Execute the following ordered route. Pass through each decision gate before advancing; if a gate fails, iterate or stop.

## 1. Frame the gap and define the mechanism space
- State the scientific claim and identify why existing explanations are insufficient.
- List all evolving variables and their couplings (e.g., density, temperature, fields, transport coefficients).
- **Decision Gate 1 (Specificity):** Is the target phenomenon narrow enough to link to a specific mechanism? If not, decompose the phenomenon into sub-problems.

## 2. Build a symmetry-aware mechanism map
- For each candidate mechanism, record: affected variables, dependencies, expected diagnostic signature, and likely confounders.
- Identify symmetries, conservation laws, or limiting cases that must be preserved.
- **Stop condition:** If no mechanism produces a distinguishable signature, stop and redefine the diagnostic space.

## 3. Generate falsifiable hypotheses
- Use the template: *If mechanism M dominates under conditions C, then diagnostic D should change in direction E relative to control K, provided competing mechanisms do not dominate in regime R.*
- Tag each hypothesis with: evidence strength (high / medium / low / speculative), key assumptions, mechanism link, and failure modes.
- **Decision Gate 2 (Testability):** Does each hypothesis have a minimal viable validation that could falsify it? If not, refine or discard.

## 4. Design a staged validation ladder
- **Rung 1 – Minimal model / analytic benchmark:** Test mapping fidelity, conservation, and known-answer behavior.
- **Rung 2 – Mechanism isolation:** Idealized setup where only the target mechanism and its strongest competitor operate.
- **Rung 3 – Controlled ablation:** Full physics versus baseline, process-off, and reduced-mechanism variants.
- **Rung 4 – Application-scale probe:** Realistic environment only after lower rungs pass.
- Define strong controls for each rung: baseline, positive control (mechanism should be visible), negative control (mechanism should be absent), and robustness variants (resolution, definition, closure).
- **Stop condition:** If Rung 1 fails, fix numerical validity before adding physical complexity.

## 5. Execute experiments and local-to-global attribution
- Run the minimal viable validation first.
- Compare local diagnostics (gradients, fluxes, phase-space features) before interpreting global outcomes (integrated rates, scaling relations, morphology).
- Use contribution breakdowns and sensitivity tests to isolate causality.
- **Decision Gate 3 (Discrimination):** Does the target mechanism change the diagnostic while controls remain unchanged? If not, reject the hypothesis or test for confounded process coupling.

## 6. Audit uncertainty and robustness
- Test sensitivity to: resolution, sampling, boundary conditions, subgrid assumptions, measurement definitions, and alternative closures.
- Check for numerical artifacts (diffusion, stiffness, convergence failures) that could mimic physical effects.
- **Decision Gate 4 (Robustness):** Does the conclusion survive stronger controls and definition changes? If not, downgrade evidence strength and redesign.

## 7. Bound claims and separate evidence tiers
- Distinguish: verified benchmark behavior, direct mechanism evidence, application-scale plausibility, and speculative extrapolation.
- State explicitly where the conclusion applies and where it must not be generalized.
- **Decision Gate 5 (Claim bounding):** Are conclusions limited to the tested regime, scale, and model family? If not, stop and narrow the claim.

## 8. Iterate or pivot
- Update evidence strength and mechanism map based on passed/failed controls.
- If the hypothesis survives, escalate complexity one factor at a time.
- If the hypothesis fails, revise the mechanism map rather than tuning parameters.
- **Stop condition:** Stop if conservation checks fail, the result disappears under stronger controls, the conclusion depends on an omitted dominant process, or further runs would only increase scale without reducing uncertainty.

# Output Format

When using this skill, return:

1. **Research question:** concise, falsifiable question tied to a specific mechanism or solver capability.
2. **Mechanism map:** candidate mechanisms, affected variables, expected signatures, and confounders.
3. **Hypotheses table:** each with evidence strength, key assumptions, failure modes, and minimal validation.
4. **Validation ladder:** minimal model, isolation test, ablation arms, and application-scale probe with controls and stop conditions.
5. **Analysis plan:** local diagnostics, global diagnostics, temporal evolution, contribution breakdowns, and sensitivity checks.
6. **Iteration rules:** how results confirm, refine, compete, reject, or park each hypothesis.
7. **Validity and boundary statement:** explicit limits on numerical, physical, and generalization claims.

# Validation Gates

Before advancing between workflow stages, verify:

- **Gap clarity:** The phenomenon is decomposed into testable sub-problems.
- **Mechanism distinguishability:** Each candidate predicts a unique or separable diagnostic signature.
- **Benchmark independence:** The validation case is distinct from the new experiment.
- **Control completeness:** Baseline, positive, negative, and robustness controls are defined and matched.
- **Diagnostic hierarchy:** Local metrics are inspected before global conclusions are drawn.
- **Numerical validity:** Conservation, convergence, and stability checks pass at the current rung.
- **Extrapolation discipline:** Claims are tagged by evidence tier and regime boundary.

# Claim Boundaries

- **Verified:** Behavior reproduced against known benchmarks or conservation limits within the tested model.
- **Supported:** Mechanism attribution survives ablation and strong controls in idealized or isolated tests.
- **Plausible:** Application-scale results are consistent with the mechanism but not uniquely explained by it.
- **Speculative:** Any inference beyond the simulated regime, resolution, subgrid model, or observable definition.

Never present simulation outputs as direct observational facts. Never generalize from a single realization, solver, or environment without qualification.

# Failure Modes

- **Numerical mimicry:** Discretization artifacts, diffusion, or solver stiffness masquerade as physical mechanisms.
- **Confounded attribution:** Multiple mechanisms change the same diagnostic; ablations are insufficient to separate them.
- **Missing dominant process:** A key physics component omitted from the mechanism map explains the result.
- **Overextrapolation:** Conclusions are applied to regimes, scales, or populations not represented in the validation ladder.
- **Definition dependence:** Results reverse under alternative measurement definitions, binning, or selection cuts.
- **Control contamination:** Baseline or control samples are drawn from mismatched conditions or contaminated by the target signal.
- **Insufficient statistics:** Rare events or small samples drive population-level claims without uncertainty quantification.

# Validity Checks

Before accepting a result, check:

- **Confounding:** Could an untested variable (environment, geometry, resolution, closure) explain the same diagnostic?
- **Timescale / scale separation:** Are all relevant dynamical, chemical, thermal, and transport scales resolved enough for attribution?
- **Network / model adequacy:** Does the reduced model hide a pathway that controls the target observable?
- **Numerical independence:** Are stiffness, interpolation, coupling errors, and boundary artifacts unlikely to drive the result?
- **Reproducibility:** Are model assumptions, initial conditions, process inclusions, diagnostic definitions, and analysis scripts recorded?
- **Boundary conditions:** Are conclusions limited to the tested regime, scale range, environment class, and observable set?
- **Evidence separation:** Are prior results, direct tests, and new inferences clearly labeled?

# Provenance

This skill was synthesized from cluster 28 (subcluster 28.1), workflow archetype "symmetry-guided mechanism discovery and validation," drawing on the following source skills:

- `astrochemical-coupled-kinetics-workflow` (10.1093/mnras/stu114)
- `anisotropic-plasma-simulation-research` (10.1093/mnras/staf1073)
- `computational-astro-hydro-solver-validation` (10.1111/j.1365-2966.2012.21466.x)
- `multiphase-galactic-wind-research-design` (10.1093/mnras/stae2589)
- `high-redshift-seeding-workflow` (10.1093/mnras/stab3439)
- `hybrid-quantum-nonlinear-pde-cosmology-exploration` (10.1103/physrevresearch.6.013282)
- `high-redshift-galaxy-mzr-exploration` (10.3847/2041-8213/ad4cee)
- `constrained-simulation-merger-tree-exploration` (10.1051/0004-6361/201731911)
