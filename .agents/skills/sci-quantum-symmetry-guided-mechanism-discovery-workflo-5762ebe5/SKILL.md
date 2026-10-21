---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-5762ebe5
description: A reusable end-to-end workflow for generating, discriminating, and validating competing microscopic mechanisms in quantum materials by reconciling symmetry constraints with multi-observable evidence.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 57"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to turn an unresolved phenomenon in quantum materials into a structured research program. The workflow defines how to frame an anomaly, generate falsifiable hypotheses, build minimal contrast sets, evaluate stability and dynamical feasibility, map mechanisms to independent observables, and iterate until a claim is either supported, bounded, or rejected. It treats no single study as field-wide consensus and avoids source-specific material recipes.

# When to use

Use this skill when the user asks for:

- Research design or hypothesis generation for competing structural, electronic, phononic, magnetic, or topological orders.
- Validation planning that connects microscopic mechanisms to macroscopic observables such as transport, spectroscopy, diffraction, or response to external tuning.
- Iterative analysis after a candidate mechanism fails one or more consistency checks.
- Mechanism discrimination in superconducting, topological, correlated, or soft-lattice material families.

Do not use this skill as a general-purpose encyclopedia, a laboratory protocol generator, or a source of universal conclusions about any material class. Do not provide operational fabrication, synthesis, high-pressure, cryogenic, or hazardous procedural details.

# Inputs required

Before generating a plan, request or infer:

- **Target material class** and relevant symmetry or structural motif.
- **Unresolved phenomenon** and the baseline expectation it violates.
- **Candidate mechanisms** to compare (direct, indirect, symmetry-breaking, disorder-mediated, etc.).
- **Available evidence types** (spectroscopic, transport, diffraction, thermodynamic, first-principles, etc.).
- **Modeling or experimental tools** accessible for validation.
- **Constraints**: safety boundaries, computational budget, reproducibility requirements, and acceptable uncertainty.

If essential inputs are missing, state assumptions explicitly and mark conclusions as boundary-conditioned.

# Core Workflow

Follow this ordered route. Advance through a phase only if its decision gate is satisfied; otherwise iterate or stop.

## 1. Frame the gap and baseline
- Define the anomaly as a deviation from the expected behavior for the material class or symmetry limit.
- Identify the high-symmetry reference state and the independent observations that create the conflict.
- **Decision gate:** Is the gap bounded by at least two independent observations? If not, stop and refine the research question.

## 2. Generate ranked hypotheses
- Produce a set of competing mechanisms that could explain the anomaly. Include at least:
  - a direct mechanism,
  - an indirect or reconstruction mechanism,
  - a confounder or disorder-mediated explanation,
  - an alternative symmetry-breaking or topological pathway.
- For each hypothesis record: claim, key assumption, predicted multi-observable signature, evidence strength, and likely failure mode.
- **Decision gate:** Are the hypotheses mutually exclusive and falsifiable with available tools? If not, reformulate.

## 3. Build a minimal contrast set
- Select the smallest set of candidate states, models, or configurations that can discriminate among the leading hypotheses.
- Vary one symmetry-breaking or perturbation dimension at a time while holding other variables constant.
- Define controls:
  - **Positive control:** a known reference that reproduces the baseline trend.
  - **Negative control:** a case where the proposed mechanism should be inactive.
  - **Strong control:** an independent observable or model variant that tests the same mechanism through a different route.

## 4. Evaluate stability and feasibility
- Assess thermodynamic, dynamical, and mechanical stability for each candidate under comparable conditions. Do not rely on static energy alone.
- Include relevant corrections (temperature, pressure, anharmonicity, disorder, finite-size, or quantum effects) when they alter the reference state.
- **Decision gate:** Are candidates stable under the same corrections required to stabilize the reference? If a candidate fails, demote or discard it before proceeding.

## 5. Map mechanisms to observables
- Translate each surviving hypothesis into independent observable signatures across at least two classes (e.g., symmetry, spectral, transport, response to tuning).
- Explicitly state how symmetry constraints, selection rules, or conservation laws produce each signature.
- **Decision gate:** Does each hypothesis produce distinct, testable predictions in multiple observable classes? If not, flag it as under-constrained.

## 6. Execute minimal viable validation
- Run the smallest comparison that tests the leading hypothesis against the null model and the defined controls.
- Use ablation or reduced-model comparisons to isolate necessary ingredients; disagreement between reduced and complete treatments is a mechanism clue, not a numerical nuisance.
- **Decision gate:** Do results survive numerical convergence, reproducibility checks, and consistency across independent diagnostics? If not, iterate or stop.

## 7. Integrate evidence and iterate
- Score each hypothesis by multi-observable consistency, control behavior, and robustness to perturbations.
- **If supported:** promote the mechanism, narrow its boundary conditions, and design a follow-up that tests a new decisive observable.
- **If partially supported:** identify the missing ingredient (e.g., disorder, anharmonicity, competing order) and redesign the contrast set.
- **If rejected:** preserve the evidence trail, demote the mechanism, and elevate the next-best candidate.
- **If confounded:** separate correlated variables, add controls, and avoid causal claims until the confounder is isolated.
- **Stop conditions:**
  1. The leading candidate is falsified by controls or independent diagnostics.
  2. The anomaly depends entirely on unsupported assumptions or unresolved numerical sensitivity.
  3. Multiple independent observables conflict irreconcilably.
  4. The required validation exceeds safety, compliance, or resource boundaries.

# Output Format

Return results in this structure:

1. **Research question** — One concise question suitable for a new study.
2. **Gap and baseline** — The unresolved phenomenon, expected behavior, and why existing explanations are insufficient.
3. **Ranked hypotheses** — For each: claim, mechanism, key assumptions, predicted multi-observable signatures, evidence strength, and likely failure modes.
4. **Minimal validation plan** — Candidate states or models, variables, controls, primary observables, evaluation metrics, and stop conditions.
5. **Analysis plan** — Stability checks, observable mapping, ablation or reduced-model tests, uncertainty quantification, and ranking criteria.
6. **Iteration path** — Rules for promoting, revising, demoting, or replacing hypotheses based on support, partial support, rejection, or confounding.
7. **Validity and safety statement** — Confounding factors, reproducibility requirements, boundary conditions, and non-operational safety limits.

# Validation Gates

Before advancing past each phase, confirm:

- **Gap clarity:** The anomaly is defined against an explicit baseline and bounded by independent evidence.
- **Hypothesis falsifiability:** Each hypothesis can be weakened or rejected by at least one plausible experimental or computational outcome.
- **Stability consistency:** Candidate states are evaluated with the same level of theory and corrections as the reference state.
- **Multi-observable coverage:** No mechanism is accepted on the basis of a single observable class.
- **Control success:** Positive, negative, and strong controls are defined and produce interpretable outcomes.
- **Convergence and reproducibility:** Numerical or experimental results are stable under reasonable perturbations of settings, sampling, or model choices.

# Claim Boundaries

- Distinguish **equilibrium** phases from **metastable** or **kinetically trapped** states.
- Distinguish **directly observed** behavior from **model-supported** predictions and **agent-inferred** hypotheses.
- State the material class, symmetry, composition range, and thermodynamic regime over which the claim is intended to hold.
- Do not generalize from one material or one computational setup to an entire class without comparative evidence.
- Label conclusions as source-supported, model-supported, or speculative.

# Failure Modes

- **Stability failure:** Candidate phases are unstable under the same corrections that stabilize the reference.
- **Single-observable overfit:** The best candidate explains only one measurement class while contradicting another.
- **Methodological fragility:** Results depend strongly on uncontrolled numerical choices, undocumented assumptions, or poor convergence.
- **Confounder dominance:** An extrinsic variable (disorder, strain, stoichiometry, surface effects) explains the anomaly better than the proposed intrinsic mechanism.
- **Extrapolation risk:** The mechanism is invoked outside its validated structural, dynamical, or model regime.

# Validity Checks

Before presenting a plan or claim, verify:

- **Confounding factors:** extrinsic strain, disorder, sample history, surface-bulk differences, finite-size or finite-grid effects, and environmental background.
- **Reproducibility:** structural models, symmetry labels, method versions, convergence criteria, and analysis scripts are documented.
- **Statistical and numerical validity:** results are stable under convergence tests, sampling choices, and alternative reasonable approximations.
- **Boundary conditions:** equilibrium, metastable, and dynamic stability are distinguished; temperature, pressure, and composition limits are stated.
- **Mechanistic clarity:** the specific assumption that changes the mechanism ranking or interpretation is identified.
- **Evidence separation:** known facts, source-paper reasoning, model predictions, and agent-generated hypotheses are clearly labeled.

# Provenance

Derived from cluster 202 / subcluster 202.0, synthesized from the following source skills:
- `kagome-cdw-phonon-research-workflow`
- `hydrogenated-nickelate-mechanism-planning`
- `altermagnetic-tunnel-junction-research-workflow`
- `superconducting-nonequilibrium-device-exploration`
- `iii-v-defect-workflow`
- `thermoelectric-bond-mismatch-exploration`
- `pressure-phonon-thermal-transport-exploration`
- `high-pressure-ice-spectroscopy-exploration`
