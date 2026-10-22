---
name: sci-quantum-symmetry-guided-evidence-analysis-workflow-f1d54ce6
description: A reusable end-to-end workflow for symmetry-guided evidence analysis and claim audit in quantum, topological, and layered materials research.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided evidence analysis workflow 2"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to design, validate, and audit research claims in materials physics by coupling symmetry analysis with multi-property evidence chains. The workflow teaches a transferable method: define a functional gap, audit hidden assumptions in standard models, generate mechanism-linked hypotheses, validate through staged gates with strong controls, and bound claims by evidence strength.

# When to use

Use this skill when the user asks to propose new research questions, design validation studies, or audit claims in quantum materials, topological systems, magnetic semiconductors, spintronic interfaces, or layered heterostructures where symmetry breaking, perturbation response, or transport behavior is central.

Do not use this skill for experimental synthesis protocols, device fabrication instructions, hazardous operational procedures, or as a substitute for domain-wide consensus.

# Inputs required

Before producing a research plan, request or infer:

- Target functional gap or research question.
- Candidate material family or structural motif.
- Standard model or decomposition used to interpret the target observable.
- Perturbation axes (e.g., strain, field, adsorption, substitution, interface, symmetry breaking).
- Available evidence types (computational, experimental, literature).
- Constraints (stability, synthesis, environmental, methodological, resource).
- Desired output type (hypothesis set, validation plan, audit report, iteration strategy).

If key inputs are missing, state assumptions explicitly and mark resulting hypotheses as lower evidence strength.

# Core Workflow

1. **Define the contrast and audit the standard model**
   - Frame the research question as a well-defined contrast (e.g., perturbed vs. unperturbed, boundary vs. bulk).
   - Identify the standard model or decomposition used to compute the target observable.
   - Expose hidden assumptions (fixed state populations, symmetry-protected cancellations, smooth boundaries, transferability claims).
   - **Decision Gate 1:** Is the contrast well-defined and is at least one hidden assumption explicitly identified? If no, refine the question before proceeding.

2. **Build the design space**
   - Select a parent structural motif and a controlled set of perturbations.
   - Enumerate plausible candidates; exclude chemically or structurally incompatible variants.
   - **Decision Gate 2:** Does the design space allow mechanistic interpretation rather than black-box optimization? If no, narrow the variable set.

3. **Baseline characterization**
   - Establish baseline descriptors: structure, stability, electronic structure, and relevant order parameters (magnetic, topological, transport).
   - Confirm structural plausibility and appropriate symmetry class.
   - **Decision Gate 3 (Stability Gate):** Does the baseline pass structural and dynamical stability checks? If no, redesign the parent motif before property analysis.

4. **Generate mechanism-linked hypotheses**
   - Baseline hypothesis: expected functionality in the unperturbed state.
   - Perturbation hypothesis: how the tuning knob changes state energies, orbitals, exchange, or symmetry.
   - Boundary-case hypothesis: the missing contribution that appears when hidden assumptions fail.
   - Trade-off hypothesis: predicted conflicts between target properties.
   - Failure hypothesis: the most likely falsification path.
   - Assign evidence strength (strong, moderate, weak, speculative) and define predicted signatures plus control predictions.
   - **Decision Gate 4:** Are hypotheses falsifiable and do they predict both presence and absence across cases? If no, reformulate.

5. **Design the validation plan**
   - Define arms: baseline, modified, mechanism, and robustness.
   - Institute controls:
     - Negative/symmetry control: effect should vanish or reverse.
     - Positive control: known benchmark behavior.
     - Method control: independent formulation or approximation tier.
   - Define minimal viable validation (smallest decisive check).
   - Predefine criteria for support, ambiguity, contradiction, and stop.
   - **Decision Gate 5:** Can the proposed controls distinguish the target mechanism from nuisance effects? If no, add orthogonal observables or perturbations.

6. **Execute staged evidence collection**
   - Layer 1 — Structure & stability: confirm plausibility after perturbation.
   - Layer 2 — Electronic & symmetry analysis: inspect band structure, orbital character, and symmetry-derived response.
   - Layer 3 — Functional descriptors: collect magnetic, transport, topological, or optical indicators as relevant.
   - Layer 4 — Perturbation response: compare baseline and modified systems under matched conditions.
   - Layer 5 — Robustness: test sensitivity to method choices, perturbation magnitude, and configuration space.
   - At each layer, separate raw observations from model-dependent inferences.
   - **Iteration/Stop:** If a candidate fails an essential layer, stop advancing it; iterate the perturbation or design space. If all candidates fail the same layer, revise the structural motif or mechanism.

7. **Discriminate mechanisms and synthesize evidence**
   - Decompose the observable into standard and candidate contributions.
   - Verify the candidate contribution appears in the boundary case and is suppressed in the symmetry control.
   - Cross-check agreement between independent formulations or measurement modalities.
   - Grade each claim:
     - **Strong:** multiple independent checks agree; controls behave as predicted.
     - **Moderate:** passes essential layers under stated assumptions.
     - **Weak:** relies on a single favorable metric or unvalidated approximation.
     - **Speculative:** requires untested synthesis, disorder, interfaces, or extrapolation.
   - **Decision Gate 6:** Does the evidence favor the proposed mechanism over alternatives? If ambiguous, flag for additional validation and lower evidence strength.

8. **Iterate or redesign**
   - If stability fails → revise composition, phase, or stabilization strategy.
   - If the target state is incompatible → change the perturbation family or parent material.
   - If results are method-sensitive → cross-validate before claiming.
   - If negative/symmetry controls mimic the test signal → stop and redefine the research question.
   - Update the hypothesis table with revised assumptions, failure modes, and next minimal validation.
   - **Stop Condition:** Terminate when candidates no longer improve the multi-objective profile, when experimental validation is required, or when conclusions depend on a single unverified assumption.

9. **Audit and finalize outputs**
   - Compile claim boundaries, documented failure modes, and residual risks.
   - Separate paper-supported methods from agent-inferred hypotheses.
   - Deliver the structured research product.

# Output Format

When using this skill, produce a structured report containing:

1. **Research question** — concise statement of the functional gap and contrast.
2. **Standard model audit** — hidden assumptions and known validity boundaries.
3. **Ranked hypotheses** — baseline, perturbation, boundary-case, trade-off, and failure hypotheses with evidence strength, key assumptions, predicted signatures, and likely failure modes.
4. **Validation plan** — arms, variables, controls (negative, symmetry, positive, method), minimal viable validation, metrics, and stop conditions.
5. **Analysis plan** — staged workflow from structure to functional descriptors, decomposition strategy, convergence checks, and robustness tests.
6. **Iteration plan** — update rules for each failure mode and stop conditions.
7. **Validity and boundary assessment** — confounders, reproducibility checks, extrapolation limits, and evidence-separation notes.
8. **Safety and ethics notes** — non-operational boundaries and compliance considerations.

# Validation Gates

- **Contrast clarity:** The observable is defined consistently across all formulations and comparisons.
- **Stability gate:** Structural and dynamical plausibility is confirmed before interpreting functional properties.
- **Symmetry gate:** The candidate contribution is predicted to appear in the boundary case and vanish or reverse in the symmetry control.
- **Control gate:** Negative, positive, symmetry, and method controls are designed and interpreted before claiming causality.
- **Mechanism gate:** A causal chain links the perturbation to microscopic changes and then to the functional outcome.
- **Robustness gate:** Results remain stable under sensitivity checks, alternative models, and reasonable approximation variations.
- **Evidence-separation gate:** Paper-supported findings, analogical extensions, and speculative proposals are explicitly labeled.

# Claim Boundaries

- Computational predictions are not experimental facts; distinguish evidence of principle from feasibility.
- Single-paper or single-candidate results are not domain consensus.
- Perturbation-enhanced performance is reported as conditional on the perturbation and approximation tier.
- Claims are restricted to tested candidate families, symmetry classes, and perturbation regimes.
- Exact numerical thresholds from source studies are not transferred to new systems without re-evaluation.

# Failure Modes

- Structural implausibility or dynamical instability after perturbation.
- Loss of required ground state (e.g., magnetic order, topological gap, semiconducting behavior).
- Competing configurations or mechanisms not ruled out by controls.
- Mechanism asserted without structural, orbital, or symmetry-based evidence.
- High sensitivity to uncontrolled approximations, numerical settings, or basis choices.
- Proxy observable dominated by nuisance variables (substrate, disorder, finite size, environment).
- Non-identifiable parameters in reduced-order or forward models.
- Extrapolation across symmetry classes or beyond tested boundary conditions.

# Validity Checks

- **Conceptual:** Are compared systems physically comparable? Does the hypothesis predict both presence and absence?
- **Symmetry:** Is the control case symmetry-preserving and the boundary case symmetry-breaking as intended? Could another cancellation mask the effect?
- **Numerical:** Do results converge under stricter settings? Are decompositions stable under reasonable analysis choices?
- **Reproducibility:** Are assumptions, controls, and negative results documented? Can the reasoning be reproduced?
- **Statistical:** Is uncertainty propagated? Is overfitting avoided? Are sensitivity and identifiability tested?
- **Causality:** Does the control handle change internal states in the predicted direction? Do specificity controls fail to show the signature?

# Provenance

- Derived from cluster 107.0 (symmetry-guided evidence analysis and claim audit).
- Synthesized from source skills: `dlhc-2d-semiconductor-research-workflow`, `twod-magnetic-semiconductor-exploration`, `magnetic-topological-materials-research-workflow`, `field-tunable-layered-interface-research-planning`, `2d-magnetic-semiconductor-research-design`, `photovoltaic-absorber-workflow`, `dynamic-transient-material-strength-exploration`, `layered-magnetic-anisotropy-perturbation-workflow`.
- Preserves shared methodology: stability-first gating, mechanism-linked hypothesis generation, coupled multi-property analysis, strong control design, and evidence-strength grading.
