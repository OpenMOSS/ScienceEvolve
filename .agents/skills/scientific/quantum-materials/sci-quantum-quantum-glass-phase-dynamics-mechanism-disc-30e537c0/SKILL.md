---
name: sci-quantum-quantum-glass-phase-dynamics-mechanism-disc-30e537c0
description: Guide research agents through symmetry-guided mechanism discovery and validation in systems with competing phases, symmetry instabilities, or nonlinear dynamics.
scienceevolve-title: "Quantum materials and condensed matter · quantum glass phase dynamics mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide research agents to discover and validate microscopic mechanisms in systems where symmetry, phase competition, and nonlinear dynamics govern emergent behavior. The workflow structures hypothesis generation, nested control design, multi-source evidence integration, and iterative claim bounding.

# When to use

Use this skill when a user asks to propose research questions, design studies, analyze data, or iterate models for systems exhibiting suspected phase boundaries, symmetry instabilities, competing interactions, or nonequilibrium order. Do not use it as a universal recipe for all materials discovery, as a substitute for domain-specific safety review, or as a source of operational experimental or fabrication procedures.

# Inputs required

Before generating a plan, collect or infer:

- Target system class and its known limits or established baselines.
- Candidate tuning axes expected to move the system between distinct symmetry or phase regimes.
- Available observables and methods (experimental, computational, or theoretical).
- Functional or structural target that plausibly depends on symmetry changes, order-parameter dynamics, or emergent constraints.
- Constraints on comparability, safety, environmental compliance, and measurement or simulation history.
- Prior evidence distinguishing directly supported findings from analogical inferences or speculation.

# Core Workflow

Follow this ordered route. At each decision gate, stop or redesign if the condition is not met.

1. **Frame the gap and anchor in known limits**
   - Define the target phenomenon by contrast against established baselines.
   - Identify the specific model mismatch, symmetry anomaly, or scaling violation that motivates new mechanism hypotheses.
   - **Decision gate:** If the gap cannot be expressed as a falsifiable discrepancy from a known limit, refine the research question before proceeding.

2. **Generate symmetry-guided mechanism hypotheses**
   - Propose 3–5 competing mechanisms linked to symmetry changes, phase competition, emergent conservation laws, or topological constraints.
   - For each hypothesis, specify: predicted observable signatures, evidence strength (strong/moderate/weak/speculative), key assumptions, and explicit failure modes.
   - Tag evidence provenance as directly supported, analogical, or speculative.
   - **Decision gate:** If hypotheses do not predict distinct, testable signatures across independent observables, return to step 1.

3. **Design a discriminating study with nested controls**
   - Select independent variables that span single-phase, boundary-adjacent, and suspected coexistence regimes.
   - Define groups: baseline, boundary-adjacent, target, and artifact-control.
   - Specify positive controls (known behavior), negative controls (mechanism-suppressed regime), strong controls (protocol/method variants), and alternative-model checks.
   - Choose orthogonal observables to probe structure, dynamics, response, and scaling from independent angles.
   - **Stop condition:** If the design cannot separate the target mechanism from extrinsic confounders (e.g., microstructure, boundary conditions, measurement artifacts), redesign before execution.

4. **Execute minimal viable validation**
   - Collect the smallest dataset or simulation ensemble needed to discriminate the primary hypothesis from the strongest alternative.
   - Verify that controls reproduce expected behavior and that the target signature is detectable above noise.
   - **Decision gate:** If controls fail or the target signature is absent, stop. Revisit assumptions (step 2) or study design (step 3).

5. **Integrate multi-source evidence into a mechanism map**
   - Combine structural, dynamical, response, and computational evidence into a unified causal chain.
   - Overlay observables across the tuning axis to test whether signatures are coincident, adjacent, or separated.
   - Quantify uncertainties: statistical, systematic, finite-size, and method-dependent.
   - **Decision gate:** If independent observables contradict each other or if the functional maximum does not align with structural/dynamic indicators, flag the mechanism as unverified and halt claim formation.

6. **Discriminate mechanisms and bound claims**
   - Apply consistency checks (scaling relations, dimensionless ratios, cross-method comparison) to exclude alternatives.
   - Distinguish necessary from sufficient conditions, and correlation from causation.
   - Bound claims to the tested symmetry, scale, and parameter regime.
   - **Stop condition:** If no mechanism survives exclusion or if the dominant explanation is an extrinsic artifact, report negative results and stop.

7. **Iterate or escalate**
   - **If supportive:** Increase confidence and design stronger validation (protocol invariance, perturbation invariance, cross-system test).
   - **If mixed:** Narrow the tuning range or add the single most informative discriminating observable.
   - **If negative:** Demote the hypothesis, test the next-ranked alternative, and update the mechanism map.
   - **Iteration rule:** Update evidence strength, assumptions, and claim boundaries after each cycle before expanding scope.

# Output Format

For each use of this skill, return:

1. **Research question** — One concise, mechanism-focused question.
2. **Gap and rationale** — What is unknown, why it matters, and the known-limit mismatch.
3. **Hypothesis table** — Columns: hypothesis, mechanism chain, evidence strength, key assumptions, predicted observables, failure modes, evidence provenance.
4. **Study design** — Tuning axis, groups, controls, orthogonal observables, minimal viable validation, and stop conditions.
5. **Analysis plan** — Preprocessing, transition/detection logic, multi-source integration, uncertainty quantification, and model comparison.
6. **Mechanism map** — Integrated causal chain linking symmetry/phase signatures to emergent behavior, with explicit ambiguity flags.
7. **Iteration log** — Update rules for supportive, mixed, or negative outcomes.
8. **Validity assessment** — Confounders, reproducibility checks, extrapolation limits, and safety/compliance boundaries.

# Validation Gates

- **Control gate:** Baselines and controls reproduce known behavior; artifact controls are inactive.
- **Consistency gate:** Independent observables and methods converge on the same mechanism interpretation within stated uncertainties.
- **Robustness gate:** Conclusions survive alternative models, fit ansätze, systematic variations, and sensitivity tests.
- **Exclusion gate:** At least one competing mechanism is ruled out by the evidence.
- **Scope gate:** Claims are explicitly bounded to the tested parameter regime, symmetry sector, and system class.

# Claim Boundaries

- Separate **necessary** from **sufficient** conditions for the observed phenomenon.
- Distinguish **correlation** from **causal mechanism**; report them separately.
- Label claims by evidence type: directly supported, analogical inference, or speculative extension.
- Restrict generalization to the tested tuning range, boundary conditions, and observable set; do not treat single-system results as field-wide consensus.

# Failure Modes

- **Confounding:** Extrinsic variables (microstructure, boundary conditions, measurement history, platform noise) mimic the target signature.
- **Structural ambiguity:** Overlapping signatures, finite-size effects, or symmetry mimicry produce false coexistence or false criticality claims.
- **Overfitting:** Mechanism is inferred from a single observable, fit window, or simulation size without cross-checks.
- **Insufficient authority:** Perturbation, observation window, or statistical power is too weak to resolve barriers or exclude alternatives.
- **Premature extrapolation:** Claims extend beyond the validated tuning range or system class.

# Validity Checks

Before presenting conclusions, verify:

- **Confounding check:** Could extrinsic factors explain the observed trend better than the proposed mechanism?
- **Probe consistency:** Do independent structural, dynamic, and response diagnostics support the same interpretation?
- **Model robustness:** Do conclusions survive alternative fitting models, scaling ansätze, and method choices?
- **Statistical validity:** Are trends replicated across comparable samples or ensembles, with uncertainties propagated?
- **Reproducibility:** Are design choices, analysis parameters, exclusion criteria, and random seeds documented for independent replication?
- **Boundary validity:** Are conclusions limited to the tested regime, or are extrapolations clearly labeled as hypotheses?

# Provenance

Synthesized from cluster 220.0 (symmetry-guided mechanism discovery and validation). Source skills: ferroelectric-mpb-exploration, anisotropic-magnetic-critical-scaling, shell-buckling-stability-landscape-research, prethermal-corner-mode-research, frustrated-magnet-phase-diagram-workflow, qcd-critical-point-fluctuation-exploration, heavy-ion-rare-probe-exploration, dual-phase-topological-scaling-workflow.
