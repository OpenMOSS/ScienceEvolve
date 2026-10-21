---
name: sci-quantum-quantum-symmetry-evidence-analysis-workflow-485f2266
description: Guides the design of end-to-end theoretical and computational research programs that use symmetry, structure, or conservation principles to generate falsifiable hypotheses, enforce controlled validation, and audit claims without overgeneralizing from single-source results.
scienceevolve-title: "Quantum materials and condensed matter · quantum symmetry evidence analysis workflow 2"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill helps an agent transform a quantum or condensed-matter research problem into a reusable, symmetry-guided investigation. It abstracts a common pattern across resource theories, tensor networks, defect constructions, scattering amplitudes, and field-theoretic analyses: anchor a stable reference, generate hypotheses from structural invariants, validate through layered controls and benchmark recovery, and bound claims by evidence strength. The goal is methodological reuse, not reproduction of any specific paper's conclusions.

# When to use

Use this skill when the user asks to:

- formulate research questions where symmetry, conservation, or structural invariants play a central role;
- generate hypotheses about mechanism, operation-class equivalence, or resource quantification;
- design theoretical or computational validation plans with strong controls;
- audit whether a standard approximation misses collective or symmetry-constrained contributions;
- iterate on a claim when benchmarks, consistency checks, or transferability tests fail.

Do not use for experimental hardware protocols, fabrication recipes, operational security analysis, or as a general-purpose physics tutorial.

# Inputs required

Before generating a plan, collect or infer:

- target system or problem class;
- stable reference structure (ground state, asymptotic limit, known benchmark, or free set);
- symmetry, conservation law, or structural invariant to exploit;
- candidate operation classes, representations, or approximations to compare;
- intended observable or task metric;
- available computational or theoretical tools;
- known benchmarks or limiting cases for validation.

If any input is missing, state the assumption explicitly and label dependent conclusions as provisional.

# Core Workflow

1. **Frame the gap and anchor the reference**
   - Define the research gap relative to a stable reference that preserves the relevant symmetry or structure.
   - State what counts as a local disturbance, allowed operation, or trivial case in this reference.
   - *Decision gate:* Is the reference well-defined and stable under the symmetry? If not, stop and refine the reference.

2. **Generate structure-guided hypotheses**
   - Propose hypotheses linking structural invariants (symmetry, conservation, block structure, analyticity) to observable consequences.
   - For each hypothesis, specify: mechanism, expected zero-condition or limiting behavior, evidence strength (proven / supported / conjectural / speculative), key assumptions, and failure modes.
   - *Decision gate:* Does every hypothesis have a falsifiable prediction and a minimal validation test? If not, reformulate.

3. **Design controlled validation**
   - Define independent variables (structural class, operation set, representation, regime) and dependent variables (observable, residual, monotonicity, scaling).
   - Establish controls: positive (known limit), negative (absent structure), boundary (near-threshold), baseline (standard approximation), and symmetry/conservation checks.
   - Preset stop conditions before execution: reference instability, invariant violation, narrow benchmark agreement, or numerical instability.
   - *Decision gate:* Are controls sufficient to distinguish mechanism from artifact? If not, add controls.

4. **Execute layered analysis**
   - **Layer A — Consistency:** Verify symmetry preservation, conservation residuals, and correct trivial-limit behavior.
   - **Layer B — Benchmark recovery:** Reproduce known limits and canonical results; flag discrepancies before interpreting new findings.
   - **Layer C — Mechanism discrimination:** Compare candidate representations or operation classes; attribute differences only after excluding normalization, boundary, or gauge artifacts.
   - *Decision gate:* Do consistency and benchmark checks pass? If not, diagnose the failure mode and loop to Step 3 or Step 2.

5. **Iterate and refine**
   - If consistency fails → revisit assumptions, reference, or symmetry compatibility.
   - If benchmarks fail → check definitions, normalization, or limit ordering.
   - If mechanism is ambiguous → add controls, narrow the regime, or weaken the hypothesis.
   - If a stop condition triggers → halt, document the failure, and bound claims.
   - Loop back to Step 2 or Step 3 until multiple independent checks are satisfied.

6. **Bound claims and package outputs**
   - Label every claim by evidence strength and state explicit transferability boundaries.
   - Compile the deliverables listed in Output Format.
   - *Decision gate:* Are claims bounded and reproducibility requirements stated? If not, add validity notes.

# Output Format

1. Research question and gap statement.
2. Reference structure and symmetry/conservation assumptions.
3. Hypothesis table with evidence strength, assumptions, and failure modes.
4. Validation design: variables, controls, metrics, and stop conditions.
5. Layered analysis results: consistency checks, benchmark recovery, and mechanism discrimination.
6. Iteration log: revisions triggered and current evidence status.
7. Claim boundary statement: proven, supported, conjectural, and speculative regions.
8. Reproducibility and validity checklist.

# Validation Gates

- **Reference stability:** The reference preserves the relevant symmetry and supports a locality or consistency principle.
- **Control adequacy:** Positive, negative, boundary, and baseline controls are defined before analysis.
- **Symmetry/conservation consistency:** The proposed mechanism respects the stated invariants; residuals or violations are quantified.
- **Benchmark reproduction:** Known limits and canonical results are recovered under shared assumptions.
- **Evidence separation:** Paper-derived patterns are distinguished from new-system inferences and speculative extensions.
- **Reproducibility:** Definitions, assumptions, convergence criteria, and environment are documented sufficiently for independent reconstruction.

# Claim Boundaries

- **Proven:** Statements that follow from explicit assumptions through derivation or accepted benchmark reproduction.
- **Supported:** Numerically or construction-level validated for a specified class, with full generality open.
- **Conjectural:** Plausible from analogy or partial structure, lacking direct validation.
- **Speculative:** Depends on multiple unverified assumptions; must be flagged as such.
- Do not treat single-source results as field-wide consensus. Do not extrapolate beyond tested regimes without labeling the inference.

# Failure Modes

- **Reference instability:** The chosen reference breaks under the symmetry or lacks a well-defined free set.
- **Hidden approximation:** A standard method assumes an unverified simplification that suppresses a required structural gradient or collective mode.
- **Artifact contamination:** Representation-specific baselines, gauge choices, or boundary conditions create spurious signals mistaken for physical effects.
- **Narrow benchmark agreement:** The hypothesis holds only for a finely tuned example or single benchmark family.
- **Sector mixing or coupling:** Perturbative and nonperturbative contributions, or different symmetry sectors, are not cleanly separated.
- **Symmetry breaking:** The proposed mechanism violates the organizing conservation law or invariance under free operations.
- **Numerical instability:** Results depend on initialization, discretization, or precision in a way that undermines mechanistic interpretation.

# Validity Checks

- Does the measure or mechanism respect the intended free operations or structural constraints?
- Are representation-specific artifacts removed or normalized?
- Is the zero-resource, trivial-limit, or asymptotic behavior recovered correctly?
- Are symmetric examples supplemented by asymmetric or boundary cases?
- Are lower bounds distinguished from exact characterizations or optimality claims?
- Are all new claims labeled by evidence strength?
- Are assumptions about state families, operation classes, and regulator choices explicit?
- Are limitations, confounders, and extrapolation boundaries stated explicitly?

# Provenance

- Synthesized from cluster 106.0 (symmetry-guided evidence analysis and claim audit).
- Source skills: gaussian-resource-quantifier-design, symmetry-aware-tensor-network-research, finite-resource-quantum-coherence-research, set-symmetry-defect-research-workflow, conservation-constrained-josephson-modeling, borel-summability-supersymmetric-qft-research-planning, asymptotic-dressed-scattering-workflow, quantum-resource-cross-representation-workflow.
