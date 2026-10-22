---
name: sci-quantum-mechanism-driven-claim-audit-workflow-24e6f264
description: End-to-end workflow for mechanism-driven hypothesis generation, controlled validation design, and iterative evidence auditing across quantitative scientific domains.
scienceevolve-title: "Quantum materials and condensed matter · mechanism driven claim audit workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent transform observational gaps or theoretical inconsistencies into rigorous, mechanism-driven research questions. The workflow generates competing hypotheses, designs minimal controlled validation, hierarchically analyzes evidence, and iteratively audits claim boundaries to prevent over-interpretation.

# When to use

Trigger this skill when:

- A user needs to move beyond phenomenological description to mechanism-level explanation.
- Existing standard methods yield ambiguous, unstable, or incomplete results for a target system.
- The task requires designing validation with strong controls (positive, negative, baseline, artifact) rather than reproducing known conditions.
- The user must audit which evidence supports a causal claim versus correlation, inference, or extrapolation.

Do not use for pure literature summarization, operational protocol generation, or domain-specific parameter tuning without a mechanism question.

# Inputs required

1. **System scope and boundaries**: Target regime, known inapplicable limits, and dimensional or geometric constraints.
2. **Existing evidence corpus**: Verified measurements, simulations, structural data, or theoretical baselines, annotated by confidence level.
3. **Controllable variables**: Adjustable structural, Hamiltonian, experimental, or computational descriptors.
4. **Observable targets**: Primary response metrics and candidate diagnostic signatures.
5. **Model assumptions**: Candidate theoretical frameworks, approximation hierarchies, or symmetry constraints.
6. **Constraints**: Reproducibility requirements, resource limits, safety and ethics boundaries, and data provenance rules.

# Core Workflow

1. **Gap Definition & Scope Bounding**
   - Articulate the specific observable inconsistency or theoretical gap. Declare system boundaries and explicitly exclude out-of-scope regimes.
   - *Stop condition*: If the gap cannot be expressed as a falsifiable discrepancy between observation and expectation, halt and reformulate.

2. **Evidence Inventory & Strength Grading**
   - Catalog all existing evidence (experimental, numerical, theoretical) and classify each item as verified, model-inferred, analogical, or speculative.
   - *Decision gate*: If no evidence reaches at least model-inferred status for the target system, downgrade to exploratory observation before hypothesis generation.

3. **Mechanism Hypothesis Generation**
   - Generate 2–4 competing, mechanism-based hypotheses. For each, specify:
     - Claim and mechanistic rationale
     - Key assumptions and their validity limits
     - Discriminating predictions that differ across hypotheses
     - Evidence strength (Strong / Moderate / Weak / Speculative)
     - Likely failure modes and confounders
   - *Decision gate*: If hypotheses lack discriminating predictions or share identical failure modes, return to Step 1.

4. **Controlled Validation Design**
   - Define independent variables, dependent variables, and hierarchical response decomposition.
   - Institute controls:
     - **Baseline**: Reference state with minimal perturbation.
     - **Positive control**: Known configuration expected to produce the target signature.
     - **Negative control**: Configuration expected to suppress the target signature.
     - **Artifact control**: Variation of numerical or measurement parameters to detect method-induced signals.
   - Specify minimal viable validation criteria and predefined stop conditions.
   - *Stop condition*: If controls cannot be constructed due to unmanageable confounding, pause and redesign variables.

5. **Hierarchical Execution & Analysis**
   - Acquire data or perform calculations. Analyze in hierarchical order:
     - Total response extraction
     - Channel decomposition (separating target mechanism from background and artifact channels)
     - Mechanism-specific signal identification
   - At each level, record evidence strength and flag deviations from expected behavior.
   - *Iteration gate*: If artifact controls trigger, return to Step 4 to refine the protocol. If negative controls yield target signatures, halt and diagnose confounders.

6. **Robustness & Alternative-Explanation Audit**
   - Test whether the observed signal replicates across independent samples, calculation seeds, parameter windows, or measurement configurations.
   - Evaluate whether alternative mechanisms explain the same signal more parsimoniously.
   - Check model premises (symmetries, approximations, boundary conditions).
   - *Decision gate*: If the signal fails replication or an alternative mechanism cannot be ruled out, downgrade the claim strength.

7. **Claim Bounding & Conclusion Grading**
   - Classify each conclusion:
     - **Data-supported**: Directly observed under controlled comparison.
     - **Model-inferred**: Requires theoretical mediation; assumptions explicitly stated.
     - **Weak evidence / speculative**: Analogical or single-instance only.
     - **Unreliable extrapolation**: Beyond validated boundaries.
   - State explicit boundary conditions for every claim.

8. **Iteration or Redesign**
   - **If fully supported**: Extend to adjacent parameter regimes or increase perturbation complexity; return to Step 1 with new scope.
   - **If partially supported**: Refine hypotheses by introducing mediating variables or mixed mechanisms; return to Step 3.
   - **If unsupported or contradicted**: Abandon or archive the hypothesis; return to Step 1 or Step 3.
   - **Terminate**: If fundamental assumptions are violated, safety or ethical limits are reached, or resources are exhausted.

# Output Format

Produce a structured research audit containing:

1. **Research question and gap statement**
2. **Evidence map**: Verified / inferred / weak / extrapolated
3. **Ranked hypotheses**: Each with evidence strength, key assumptions, discriminating predictions, and failure modes
4. **Validation plan**: Variables, controls, minimal viable test, metrics, and stop conditions
5. **Analysis plan**: Hierarchical decomposition and confounder checks
6. **Iteration plan**: Decision branches for support, partial support, contradiction, or null result
7. **Validity statement**: Boundary conditions, reproducibility requirements, and residual risks

# Validation Gates

- **Candidate gate**: Hypotheses must be falsifiable and yield discriminating predictions before validation begins.
- **Control gate**: Positive, negative, and artifact controls must be defined and must pass before mechanism claims are advanced.
- **Robustness gate**: Key trends must replicate across independent samples, seeds, calculation windows, or measurement configurations.
- **Model-applicability gate**: Theoretical frameworks used for inference must satisfy their stated premises; otherwise, downgrade conclusions.
- **Extrapolation gate**: Claims must not cross stated system boundaries without explicit re-validation.

# Claim Boundaries

- **Data-supported**: Directly observed in the current study with controlled comparison.
- **Model-inferred**: Consistent with data under explicit assumptions, but mediated by a theoretical framework.
- **Weak evidence / speculative**: Supported only by analogy, preliminary trend, or single-instance observation.
- **Unreliable extrapolation**: Outside the validated parameter range, geometry, or model class.

Never present model-inferred or weak evidence as data-supported.

# Failure Modes

- **Confounding dominance**: An uncontrolled variable co-varies with the independent variable and mimics the target mechanism.
- **Method artifact**: The signal originates from numerical settings, initialization, preprocessing, finite-size effects, or measurement geometry rather than the target physics.
- **Model misapplication**: A theoretical framework is applied outside its derived limits (e.g., scaling law beyond its regime, symmetry assumptions violated).
- **Overfitting to single instances**: Conclusions rely on a single sample, seed, spectral window, or parameter set without replication.
- **Premature causal inference**: Correlation or simultaneous change is interpreted as mechanism-driven causation without temporal ordering or control.
- **Boundary violation**: Claims are extended to regimes where the governing equations, constitutive relations, or experimental geometry change.

# Validity Checks

- **Confounder audit**: List all variables that could co-vary with the target mechanism and specify independent checks for each.
- **Reproducibility audit**: Require replication across independent runs, samples, or sub-windows; report failures and variance.
- **Statistical and numerical audit**: Report uncertainties, residuals, sensitivity to fitting windows, normalization choices, and outlier treatment.
- **Alternative explanation audit**: Every mechanism claim must be paired with at least one viable alternative and a test that can distinguish them.
- **Symmetry and conservation audit**: Ensure final claims respect the fundamental symmetries, conservation laws, or selection rules of the target system.
- **Provenance audit**: Clearly separate verified evidence, analogical reasoning, and new agent inferences.

# Provenance

- Derived from cluster 225.0 (candidate: quantum-plasma-spin-tensor-network-evidence-analysis-workflow).
- Synthesized from source skills: superconductor-vortex-creep-workflow, tensor-network-architecture-optimization, xray-dichroism-jt-quantum-materials, magnetic-damping-scaling-research, strongly-correlated-boson-exploration, space-time-topological-wave-exploration, representation-geometry-research-workflow, complex-oxide-structure-property-exploration.
- Domain-specific systems, materials, numerical parameters, and paper conclusions have been removed to produce a reusable cross-domain workflow.
