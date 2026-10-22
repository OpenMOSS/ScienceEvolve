---
name: sci-fusion-stellarator-turbulence-mechanism-discovery-w-f3dd267a
description: A reusable end-to-end workflow for generating, discriminating, and validating mechanism hypotheses in stellarator and magnetic-confinement fusion plasma research from observables.
scienceevolve-title: "Magnetic confinement fusion · stellarator turbulence mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Use this skill to transform an observational anomaly or performance gap in magnetic-confinement fusion plasmas into a structured mechanism-discovery campaign. The workflow guides an agent from research question formulation through hypothesis generation, multi-evidence validation, mechanism discrimination, and claim bounding, while keeping outputs at the conceptual research-design level.

# When to use

Use this skill when the user asks to:

- Explain unexpected confinement, transport, stability, or edge behavior in stellarators, tokamaks, reversed-field pinches, or related toroidal magnetic-confinement systems.
- Design non-operational studies that link magnetic topology, plasma profiles, fluctuations, or global performance to candidate physical mechanisms.
- Compare competing hypotheses for turbulence, island-related transport, burst-cycle dynamics, or equilibrium-stability transitions.
- Iterate between experiment, simulation, and reduced-model analysis to bound mechanistic claims.

Do not use this skill for operational device control, executable plasma settings, hazardous procedures, or unrelated domains.

# Inputs required

Before starting the workflow, collect or request:

- Research question or observable anomaly (e.g., anomalous transport, confinement transition, edge-localized burst, island interaction).
- Target system class and magnetic geometry family, stated conceptually.
- Available evidence types: experimental diagnostics, simulation outputs, equilibrium reconstructions, scaling laws, or literature benchmarks.
- Candidate mechanisms and their expected observable signatures.
- Constraints: safety boundaries, facility governance, diagnostic coverage, computational cost, and reproducibility requirements.
- Definitions of success, failure, and minimum evidence needed to advance or stop a research direction.

# Core Workflow

Execute the following stages in order. At each gate, decide whether to proceed, redesign, or stop.

## Stage 1 — Phenotype Definition & Evidence Audit
1. Define the observable phenotype: profile anomaly, confinement change, burst event, stability threshold, or topology-transport mismatch.
2. Audit available evidence and classify each source as direct measurement, reconstructed quantity, simulation output, or literature inference.
3. Map diagnostics to equilibrium geometry conceptually; note coverage gaps and calibration limits.

**Gate 1 (Evidence Sufficiency):** Stop and refine the question if the phenotype cannot be defined with uncertainty bounds or if evidence is purely anecdotal.

## Stage 2 — Mechanism Hypothesis Generation
1. Generate at least three competing hypotheses:
   - **Intrinsic mechanism**: pressure drive, curvature, shear, or mode coupling.
   - **Topology/geometry mechanism**: boundary shape, island location, stochastic layer, or field-period structure.
   - **Profile/regime mechanism**: collisionality, density, heating, or current profile.
   - **Confounder/alternative**: diagnostic artifact, wall interaction, impurity effect, or field error.
2. For each hypothesis, record: claimed mechanism, evidence strength (high / medium / low / speculative), key assumptions, discriminating observable, likely failure mode, and minimum viable validation step.

**Gate 2 (Candidate Viability):** If fewer than two hypotheses survive critical inspection, stop and broaden the search space or request additional data.

## Stage 3 — Minimum Viable Validation Design
1. Define conceptual independent variables: geometry class, topology indicator, profile regime, perturbation family, or operating phase.
2. Define dependent variables: bridge metric, transport proxy, stability indicator, event characteristic, or normalized performance ratio.
3. Establish controls:
   - **Baseline**: natural variability or standard configuration.
   - **Negative**: mechanism weakened or removed while other features are matched.
   - **Positive**: known benchmark or previously validated case.
   - **Geometry-matched**: isolates topology from global state.
   - **Path-dependent**: compares ramp-up and ramp-down trajectories when hysteresis is relevant.
4. Predefine failure criteria (e.g., effect disappears under controls, uncertainty dominates) and stop conditions (safety limits, irreproducibility, nonphysical assumptions).

**Gate 3 (Discrimination Feasibility):** If no conceptual control can distinguish the leading hypotheses, downgrade all to speculative and return to Stage 2.

## Stage 4 — Execution & Multi-Stream Analysis
1. **Normalize**: scale variables by system-relevant geometric or physical references; keep raw and normalized quantities separate.
2. **Equilibrium check**: verify consistency before interpreting stability or transport; flag model assumptions that are essential to the conclusion.
3. **Decompose**: separate indicators by candidate mechanism (pressure drive, curvature, shear, boundary coupling, mode structure, nonideal effects).
4. **Sensitivity test**: vary boundary conditions, profile shapes, reconstruction assumptions, and mode/perturbation families.
5. **Compare independent targets**: evaluate width, phase, flow, gradient, timing, and loss fraction separately; a model fitting only one target is weak unless others are unavailable by design.
6. **Residual diagnostics**: use mismatches to identify which assumption failed (e.g., phase fits but recovery fails → inspect flow restoration).

**Gate 4 (Robustness):** If conclusions collapse under sensitivity checks or alternative reconstructions, return to Stage 2 to reformulate hypotheses.

## Stage 5 — Mechanism Discrimination & Claim Bounding
1. Score each hypothesis against observations and controls.
2. Exclude mechanisms that fail negative controls or predict incorrect state ordering.
3. Bound surviving claims by evidence strength and regime:
   - **Source-verified**: directly supported by the current evidence corpus.
   - **Literature-supported**: consistent with independent published benchmarks.
   - **Model-supported**: consistent with simulation or reduced model under stated assumptions.
   - **Inferred / Speculative**: requires new data or crosses untested boundaries.

**Gate 5 (Exclusion):** If all hypotheses fail, preserve the negative result and generate alternatives. If exactly one survives controls, proceed to Stage 6.

## Stage 6 — Iteration or Redesign
- **If supported**: refine to more discriminating observables, test regime boundaries (collisionality, beta, scale), or advance to subsystem/integrated checks.
- **If partially supported**: split the hypothesis, add kinetic or non-MHD checks, or refine transport assumptions.
- **If contradicted**: archive negative evidence, update the mechanism map, and return to Stage 2.

**Gate 6 (Convergence):** If evidence strength does not improve after two full iteration cycles, stop and document boundary conditions.

## Stage 7 — Synthesis & Archival
1. Compile the research question, ranked hypotheses, validation plan, analysis record, iteration log, and claim boundaries.
2. Archive the decision trace, assumptions, and provenance references for peer review.

# Output Format

When using this skill, produce:

1. **Research question**: one sentence stating the mechanism-level question.
2. **Phenotype definition**: observable anomaly and evidence audit summary.
3. **Ranked hypotheses**: table with mechanism, evidence strength, key assumptions, discriminating observable, likely failure mode, and minimum viable validation.
4. **Validation plan**: conceptual variables, controls, metrics, stop conditions, and stage-gate criteria.
5. **Analysis record**: normalization approach, decomposition results, sensitivity checks, and residual diagnostics.
6. **Iteration log**: decisions to keep, revise, split, downgrade, or discard each hypothesis.
7. **Claim boundaries**: explicit labels on evidence strength and extrapolation limits.
8. **Validity and safety notes**: confounders, reproducibility requirements, and non-operational safety boundaries.

# Validation Gates

- **Evidence Sufficiency Gate**: The phenotype is defined with uncertainty bounds and evidence is not purely anecdotal.
- **Candidate Viability Gate**: At least two competing hypotheses survive critical inspection.
- **Discrimination Feasibility Gate**: Conceptual controls can distinguish among surviving hypotheses.
- **Robustness Gate**: Conclusions survive sensitivity checks, alternative reconstructions, and independent target comparisons.
- **Mechanism Exclusion Gate**: Negative controls falsify incorrect hypotheses; surviving claims are consistent with observations.
- **Convergence Gate**: Evidence strength improves or stabilizes within two iteration cycles; otherwise stop.

# Claim Boundaries

- Distinguish source-paper observations from agent-inferred extensions.
- Label every conclusion as **source-verified**, **literature-supported**, **model-supported**, **inferred**, or **speculative**.
- State regime boundaries where the claim should not be extrapolated (e.g., untested collisionality, beta regime, device scale, or heating method).
- Do not present single-device, single-simulation, or single-paper results as field-wide consensus.

# Failure Modes

- Diagnostic uncertainty dominates the expected effect size.
- Equilibrium inconsistency invalidates stability or transport interpretation.
- Chosen perturbation or mode family is too narrow and misses dominant physics.
- Hidden covariate (impurity, wall interaction, field error, diagnostic artifact, selection bias) mimics the mechanism signature.
- Negative control produces the same effect as the candidate mechanism.
- Conclusions depend on unconstrained model assumptions or nonphysical boundary conditions.
- Iteration loops without convergence because variables are confounded or evidence is insufficient.

# Validity Checks

- **Confounding**: Separate intrinsic mechanisms from wall stabilization, profile effects, mode-selection bias, numerical artifacts, and diagnostic geometry effects.
- **Reproducibility**: Require independent checks across shots, diagnostics, models, or cases; record filters, assumptions, exclusion criteria, and code versions.
- **Statistical validity**: Propagate uncertainty, avoid overinterpreting rare events, and use matched comparisons rather than single-case claims.
- **Model validity**: Verify equilibrium consistency, approximation limits, closure assumptions, and numerical convergence.
- **Boundary conditions**: State device class, configuration range, diagnostic coverage, and operating phase limits explicitly.
- **Evidence labeling**: Mark paper-supported, literature-supported, model-supported, inferred, and speculative claims distinctly.

# Provenance

- Derived from cluster 6 / subcluster 6.0: observable-driven mechanism discovery and validation.
- Synthesized from source skills: `stellarator-stability-exploration`, `rfp-magnetic-topology-thermal-exploration`, `magnetic-island-stability-research-design`, `edge-island-transport-exploration`, `stellarator-transport-research-agent`, `plasma-edge-burst-cycle-research`, `staged-fusion-research-planning`, `stellarator-research-exploration`.
- Preserves transferable research patterns across magnetic-confinement fusion domains without embedding paper-specific parameters, numerical results, or operational protocols.
