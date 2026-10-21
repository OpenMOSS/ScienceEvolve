---
name: sci-fiber-symmetry-guided-mechanism-discovery-workflow-4e72f21e
description: A reusable end-to-end workflow for proposing, isolating, and validating candidate mechanisms in complex computational systems through symmetry-aware hypothesis generation, controlled model variants, and iterative uncertainty bounding.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery workflow 5"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents in designing disciplined research programs to discover and validate mechanisms in complex computational systems—such as optimized structures, quantum or classical transport models, multi-agent systems, or sparse-evidence learning tasks—by isolating controlling variables, enforcing structural invariants, and iterating from controlled failures rather than from paper-specific conclusions.

# When to use

Use this skill when a user asks to:
- Generate new research questions about an unresolved mechanism, pathway, or causal link in a computational model.
- Design controlled computational experiments (simulations, optimizations, statistical inference, or sampling studies) to test competing hypotheses.
- Compare competing mechanisms or formulations under low-resource, sparse-evidence, or high-uncertainty conditions.
- Plan sensitivity, robustness, convergence, or benchmark validation studies for numerical or data-driven models.
- Convert a published method into a transferable experimental framework rather than summarizing its results.

Do not use this skill for wet-lab operational recipes, clinical protocols, fabrication instructions, or safety-critical engineering certification.

# Inputs required

Before producing a research plan, request or infer:
- **Target system class** and the specific unresolved mechanism or observable tension.
- **Modeling paradigm** available (e.g., first-principles, continuum, discrete, statistical, machine-learning, symbolic).
- **Candidate controlling variables**, symmetries, or structural invariants suspected to govern the mechanism.
- **Baseline models**, benchmark configurations, or literature controls for comparison.
- **Resource constraints**: compute budget, data or label budget, resolution, sample size, or memory budget.
- **Uncertainty tolerance** and the intended downstream use of the result.
- **Safety, ethics, and domain-governance constraints**.

If information is missing, state assumptions and mark them as weak points in the proposed design.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Frame the mechanism gap
- Define the outcome to explain and the unresolved step in the causal chain.
- Isolate the suspected controlling interface, symmetry, or structural invariant.
- **Decision gate — Scope:** If the problem cannot be narrowed to a single contested mechanism, decompose it before proceeding.

## 2. Generate bounded hypotheses
- For each candidate mechanism, state: claim, controlling variable, evidence strength, key assumptions, critical diagnostics, failure modes, and boundary.
- **Decision gate — Falsifiability:** If a hypothesis cannot be materially changed by available data or compute, reformulate or deprioritize it.

## 3. Design minimal viable validation
- Establish a stable reference configuration.
- Vary one major factor at a time; include symmetry-preserving and symmetry-breaking variants where relevant.
- Define negative, positive, benchmark, and method controls.
- Pre-register metrics, stop conditions, and claim boundaries.
- **Decision gate — Control adequacy:** If the design cannot distinguish mechanism occurrence from numerical or model artifact, add diagnostics or stop.

## 4. Execute and diagnose
- Verify reference stability and internal consistency before the mechanism onset.
- Detect whether, where, and how the proposed pathway occurs.
- Inspect structural descriptors, order parameters, or rare events that explain convergence or failure.
- **Decision gate — Stability:** If the reference is unstable or the signal depends on a single unresolved artifact, stop and redesign.

## 5. Audit robustness and uncertainty
- Compare resolution, discretization, sampling, or method variants.
- Propagate uncertainty from primary estimates into derived quantities.
- Audit low-resource, sparse-data, or boundary-dominated regions separately.
- **Decision gate — Robustness:** If qualitative conclusions reverse under small control changes without explanation, classify as ambiguous and stop.

## 6. Compare alternatives and bound claims
- Evaluate results against baselines, controls, and literature benchmarks.
- Classify each hypothesis as supported, revised, ambiguous, or failed.
- State explicit boundaries: untested variables, regimes, and extrapolation limits.
- **Decision gate — Extrapolation:** If claims extend beyond tested assumptions without labeling, retract or bound them.

## 7. Iterate or terminate
- **Strengthen:** Extend to nearby regimes or higher fidelity if the mechanism persists across controls.
- **Revise:** Narrow the controlling variable range or decouple mechanism robustness from observational viability.
- **Split:** Separate claims when different diagnostics answer different questions.
- **Abandon:** Reject the hypothesis if it is artifactual, indistinguishable from alternatives, or contradicted by strong controls.
- **Stop conditions:** Terminate if (a) the reference is unstable, (b) the signal is resolution- or method-dependent without convergence, (c) a small control change reverses conclusions, (d) the model class is inappropriate for the decisive process, or (e) extrapolation exceeds tested assumptions.

# Output Format

Produce results in this structure:

1. **Research question and scope**
   - One-sentence question and why it is unresolved.

2. **Mechanism map**
   - Competing pathways.
   - Expected diagnostic signatures.

3. **Ranked hypotheses table**
   - Columns: Claim, Evidence strength, Key assumptions, Critical diagnostics, Likely failure modes, Boundary.

4. **Study plan**
   - Reference case.
   - Variables and controls (negative, positive, benchmark, method).
   - Primary and secondary metrics.
   - Stop conditions.

5. **Analysis plan**
   - Mechanism diagnostics.
   - Robustness checks (resolution, sampling, method).
   - Uncertainty propagation.
   - Comparison strategy.

6. **Validation gates summary**
   - Pass/fail status per gate with rationale.

7. **Iteration plan**
   - Next actions for each hypothesis state (strengthen, revise, split, abandon).

8. **Claim boundaries and limitations**
   - Confounders.
   - Reproducibility requirements.
   - Untested variables and regimes.
   - Clear separation between supported findings and new inference.

# Validation Gates

- **Scope gate:** The mechanism is isolated to a testable sub-problem, not the entire system.
- **Falsifiability gate:** Hypotheses can be materially changed by the proposed experiment.
- **Control gate:** Negative, positive, benchmark, and method controls are present and matched.
- **Stability gate:** The reference case is stable and internally consistent before mechanism onset.
- **Robustness gate:** Qualitative conclusions persist across resolution, discretization, or sampling changes.
- **Uncertainty gate:** Reported differences exceed combined physical and numerical uncertainty.
- **Extrapolation gate:** Claims are explicitly bounded to tested regimes and assumptions.

# Claim Boundaries

- Do not generalize beyond tested physics, model classes, geometries, regimes, or data distributions.
- Do not treat single-study success as field-wide consensus.
- Clearly separate paper-supported findings, current measurements, and agent-generated extrapolations.
- State assumptions about symmetry, invariants, low-resource approximations, and untested variables.
- Label any downstream model mapping as conditional until independent validation is performed.

# Failure Modes

- Mechanism is a numerical artifact (mesh, resolution, sampling, or solver dependent).
- Mechanism occurs only under post-processing or threshold choices that are not theoretically justified.
- Hypothesis is indistinguishable from an alternative after controls are applied.
- Improvement in one metric degrades another through coupled effects without explanation.
- Sparse or uncertain observations are mistaken for model physics.
- Over-regularization or over-compression destroys the target signal.
- Dense-cluster bias, label leakage, or representation artifacts in low-resource settings.
- Memory or summary statistics lose information needed for coordination or discrimination.

# Validity Checks

- **Confounding:** Check initialization, mesh or discretization, solver settings, preprocessing, post-processing, and visualization choices.
- **Reproducibility:** Record reference cases, controlled variants, physical variables, numerical settings, failed controls, and ambiguous cases.
- **Statistical validity:** Use repeated runs, convergence behavior, or uncertainty intervals; avoid population claims from limited models or stochastic trials.
- **Mechanistic validity:** Ensure a plausible mechanism exists for both expected and anomalous results.
- **Boundary validity:** Test limiting cases, symmetry limits, and parameter asymptotics.
- **Information-structure validity:** Confirm that partial-observation, decentralized, or low-resource assumptions match the target setting.
- **Metric validity:** Verify that metrics align with the practical goal (e.g., early retrieval, convergence, or agreement) rather than aggregate convenience.

# Provenance

- Synthesized from cluster 19.0 (symmetry-guided mechanism discovery and validation).
- Source-skill references: subchandra-double-detonation-research, dermal-permeation-md-workflow, substructure-network-virtual-screening-workflow, regularized-topology-optimization-workflow, isogeometric-topology-optimization-research-workflow, uncertainty-aware-fusion-model-validation, memory-compressed-mean-field-control-research, substitution-based-lexical-sense-discovery.
- Paper details, operational protocols, and numerical results from source skills are excluded from this reusable workflow body.
