---
name: sci-quantum-symmetry-guided-evidence-analysis-workflow-e0bd5455
description: A reusable end-to-end workflow for generating hypotheses, designing controlled validations, and auditing claims in symmetry-driven scientific research across quantum, topological, and nonlinear systems.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided evidence analysis workflow 4"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides an agent through a symmetry-guided evidence analysis and claim audit. It converts a known baseline or protected structure into testable hypotheses about how controlled perturbations or competing mechanisms alter system behavior, then validates those hypotheses through staged controls, multi-level diagnostics, and iterative mismatch classification.

# When to use

Use this skill when:
- Proposing research questions about symmetry breaking, competing mechanisms, or protected-to-perturbed transitions.
- Designing theoretical, computational, or conceptual studies where a baseline descriptor is known to fail or be incomplete.
- Comparing candidate mechanisms, protocols, or structures against a reference state or bound.
- Auditing whether observed phenomena originate from proposed symmetry changes or from confounding artifacts.
- Iterating between hypothesis generation, minimal validation, and claim bounding.

# Inputs required

Before producing a plan, request or infer:
- Target phenomenon or transformation class.
- Baseline system or reference state with known behavior.
- Proposed perturbation, mechanism, or complexity layer.
- Observable descriptors or diagnostics that distinguish states or mechanisms.
- Available validation tools (analytical, numerical, or conceptual).
- Constraints on assumptions, resources, and operational boundaries.

If any input is missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Baseline anchoring and gap diagnosis
- Define the reference state and confirm it lacks the target phenomenon under stated assumptions.
- Identify why standard descriptors, direct paths, or lower-order methods are insufficient.
- **Gate — Candidate gate:** If the baseline is unknown, unstable, or already exhibits the phenomenon, stop and characterize before proceeding.

## 2. Symmetry and mechanism decomposition
- Map the symmetries, conservation laws, or structural invariants that protect the baseline.
- Define a controlled perturbation that modifies specific symmetries while preserving interpretability.
- Decompose competing tendencies, hierarchy levels, or resource contributions.

## 3. Hypothesis generation and ranking
- Generate hypotheses in this order: mechanism, symmetry/topology, robustness, and boundary.
- For each, label evidence strength (proven, theorem-supported, simulation-supported, heuristic, speculative), key assumptions, predicted signatures, and failure modes.
- **Gate — Claim bounding:** Clearly separate baseline-supported claims from analogical inferences and unverified extensions.

## 4. Validation design with controls
- Design a minimal viable validation.
- Define positive, negative, diagnostic, and baseline controls.
- Specify independent variables, dependent variables, parameter slices, and pre-registered stopping criteria.
- **Gate — Falsifiability:** If no concrete prediction can falsify the hypothesis, redesign the perturbation or descriptor.

## 5. Staged evidence collection
- **Stage 1 — Subsystem diagnostics:** Verify controls, baseline behavior, and descriptor consistency.
- **Stage 2 — Mechanism isolation:** Vary one symmetry or perturbation at a time; compare against orthogonal controls.
- **Stage 3 — Integrated validation:** Evaluate bound saturation, scaling behavior, or end-to-end performance against the reference.
- **Gate — Stability gate:** If controls fail or independent diagnostics disagree without explanation, halt and audit.

## 6. Multi-level analysis and cross-check
- Compare results across independent descriptors, hierarchy levels, or observables.
- Check for bound saturation, moment matching, phase-sequence consistency, or topological invariant agreement.
- Test robustness under alternative assumptions, resolutions, or parameterizations.
- **Gate — Robustness check:** If results collapse under justified variations, downgrade claims and revisit assumptions.

## 7. Mismatch classification and iteration
- Classify discrepancies as: mechanism failure, parameter-slice failure, diagnostic failure, state-label failure, or model-boundary failure.
- Iterate by modifying one element at a time in this priority: refine labels, improve diagnostics, adjust parameter slices, then revise the mechanism or model.
- **Gate — Iteration gate:** Re-score evidence strength and tighten claim boundaries before expanding scope or scaling up.

## 8. Mechanism exclusion and claim audit
- Rule out alternative explanations using competing-phase checks, orthogonal controls, and ablation tests.
- Bound claims to the tested model class, symmetry regime, resource budget, and parameter range.
- Produce a claim-boundary table linking each conclusion to its evidence level and limiting assumptions.
- **Gate — Mechanism exclusion:** If confounding explanations cannot be ruled out, issue conditional claims only.

## 9. Stop and exit conditions
- **Stop** if the hypothesis is falsified, no plausible competing mechanism exists, the baseline is misspecified, results depend on unstable settings, or the claim scope exceeds evidence.
- **Exit** with a ranked hypothesis set, validated research plan, or a failure-mode report with actionable redesign directions.

# Output Format

Return a structured research audit containing:
1. **Research question and gap statement.**
2. **Baseline definition and perturbation map.**
3. **Ranked hypotheses** with evidence strength, assumptions, predicted signatures, and failure modes.
4. **Validation design** with controls, variables, parameter slices, and stop criteria.
5. **Analysis plan** with cross-checks, robustness tests, and uncertainty handling.
6. **Iteration log** with mismatch classifications, update rules, and next smallest tests.
7. **Claim boundary table** separating proven, theorem-supported, simulation-supported, and speculative results.
8. **Validity and safety notes** covering confounders, reproducibility requirements, and non-operational boundaries.

# Validation Gates

- **Candidate gate:** The baseline is sufficiently characterized and lacks the target phenomenon under stated conditions.
- **Stability gate:** Controls reproduce expected behavior and independent diagnostics converge within expected uncertainty.
- **Robustness gate:** The effect persists across alternative descriptors, resolutions, and justified model perturbations.
- **Mechanism-exclusion gate:** Alternative explanations are ruled out by orthogonal controls or ablation tests.
- **Iteration gate:** Evidence is re-scored and claim scope is adjusted before any expansion to new regimes or scales.

# Claim Boundaries

- Distinguish results that are analytically proven, theorem-supported, numerically demonstrated, analogically inferred, or speculative.
- Restrict claims to the tested symmetry class, model assumptions, resource budget, and parameter regime.
- Do not extrapolate from minimal models to universal behavior without explicit bridging arguments.
- Separate what is supported by the source methodology from what is agent-inferred for the new system.

# Failure Modes

- **Baseline misspecification:** The reference system already exhibits the phenomenon or is poorly understood.
- **Perturbation ambiguity:** The modification affects multiple symmetries or mechanisms simultaneously, preventing clean interpretation.
- **Diagnostic disagreement:** Independent descriptors yield conflicting classifications that cannot be resolved.
- **Control failure:** Positive or negative controls behave unexpectedly, indicating hidden variables or misidentified baselines.
- **Overfitting to parameter slices:** Results are valid only in a narrow, unrepresentative regime without convergence checks.
- **Claim overreach:** Conclusions generalize beyond the tested model class, dimensionality, symmetry assumptions, or resource limits.

# Validity Checks

- Are baseline states and protecting symmetries explicitly defined?
- Are positive, negative, diagnostic, and baseline controls included and pre-registered?
- Are independent, dependent, and nuisance variables clearly separated?
- Are success, failure, and stopping criteria defined before evidence collection?
- Is evidence strength explicitly labeled for every hypothesis and claim?
- Are numerical convergence, optimizer stability, finite-size effects, and sampling uncertainty documented?
- Are alternative mechanisms and competing states/phases explicitly considered?
- Is the claim boundary limited to the tested assumptions and model class?

# Provenance

- Synthesized from cluster 36.0 (symmetry-guided evidence analysis and claim audit).
- Source skills: arxiv-cmoat__2606.12572 (solvable-reference-reentrancy-discovery), 025abfdbae602df1 (nonlinear-cv-entanglement-exploration), 08eae7ca928e4918 (quantum-state-preparation-geometric-research-design), b075577b1a8eb918 (measurement-based-unitary-design-exploration), 3b39ad1fc51b760a (quantum-thermodynamic-cooling-research-design), 77fca7014c2221b6 (symmetry-guided-self-assembly-pathway), 48a5e16ce6456010 (photonic-symmetry-polarization-exploration), a75278263b19732a (low-noise-twin-field-qkd-research).
