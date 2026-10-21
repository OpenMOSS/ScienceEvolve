---
name: sci-quantum-quantum-symmetry-evidence-analysis-workflow-c6986da4
description: Guide an agent through a reusable, symmetry-aware end-to-end workflow to generate hypotheses, design controlled validations, discriminate mechanisms, and audit claims about quantum or topological observables without overextending beyond tested boundaries.
scienceevolve-title: "Quantum materials and condensed matter · quantum symmetry evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents through an end-to-end workflow for symmetry-guided evidence analysis and claim audit in quantum, topological, and correlated systems. The pattern transfers across domains: frame a capability gap, construct symmetry-resolved hypotheses, validate with layered controls, discriminate mechanisms, and bound claims to tested regimes.

## When to use

Use this skill when the task is to propose or evaluate research questions where symmetry, mode structure, exchange statistics, disorder pathways, or mechanism deconvolution shape observable outcomes. It applies to theoretical design, simulation planning, and experimental concept generation. Do not use it for operational laboratory protocols, fabrication recipes, safety reviews, or general literature summaries.

## Inputs required

Before generating a plan, identify or request:

- **Target system class** and relevant degrees of freedom.
- **Known limiting regimes** or established baselines.
- **Candidate observables** and accessible probes.
- **Modeling or measurement framework** available for validation.
- **Constraints**: validity boundaries, computational or hardware limits, and non-operational safety boundaries.
- **Prior evidence map**: what is known, inferred, or speculative.

## Core Workflow

1. **Gap Framing & Boundary Setting**
   - Define the observable anomaly or missing bridge between structure and dynamics.
   - State the known limiting regimes and the intermediate or contested region.
   - Document assumptions about symmetry, dimensionality, and scale hierarchy.

2. **Symmetry-Aware Hypothesis Generation**
   - Construct a latent structural measure or symmetry-resolved mechanism hypothesis.
   - Formulate at least three competing hypotheses: primary, alternative, and compensation/cancellation.
   - Label evidence strength (e.g., literature-supported, model-supported, inferred, speculative).
   - List key assumptions and predicted failure modes for each.

3. **Minimal Validation Design**
   - Define independent variables that selectively tune the proposed mechanism.
   - Establish controls:
     - **Positive**: known configuration where the signature is expected.
     - **Negative**: configuration where the mechanism is removed or symmetry is broken.
     - **Robustness**: perturbation of disorder, finite size, loss, or detuning.
     - **Compensation**: paired mechanism variations to test cancellation.
   - Define system-level metrics, not only local maxima.
   - Set stopping conditions before data collection.

4. **Multi-Layer Analysis Execution**
   - **Layer 1 — Structural**: analyze symmetry, channel completeness, basis convergence, and mode inventory.
   - **Layer 2 — Coupling/Dynamics**: evaluate overlap, exchange pathways, anticrossing, or scaling behavior.
   - **Layer 3 — Uncertainty**: report distributions, sensitivity curves, and finite-size effects.
   - Maintain independent computation of structural measures from final observables.

5. **Decision Gate A — Robustness & Control Check**
   - Do positive and negative controls behave as predicted?
   - Does the signature survive under stated uncertainty and perturbation?
   - Is the metric distinguishable from baseline and background?
   - **If NO**: Stop or redesign the validation; revisit hypothesis assumptions.
   - **If YES**: Proceed to mechanism discrimination.

6. **Mechanism Discrimination & Model Comparison**
   - Compare competing models using a hierarchy of complexity.
   - Run ablation tests: remove one mechanism at a time and record changes.
   - Test identifiability: can coupling strength, detuning, and damping be estimated independently?
   - Prefer simpler models unless added complexity is justified by multiple observables.

7. **Decision Gate B — Claim Bounding & Identifiability**
   - Are the proposed observables degenerate, or do they distinguish mechanisms?
   - Is the evidence sufficient for the claim level (genuine, quasi-, candidate, unsupported)?
   - **If identifiability fails or mechanisms are degenerate**: Iterate with stronger controls or alternative observables.
   - **If supported**: Proceed to final audit.

8. **Iteration or Redesign**
   - **Support**: Sharpen the question toward boundary limits or next competing mechanism.
   - **Partial support**: Add a complementary observable or stronger control.
   - **Conflict**: Test hidden degrees of freedom, competing order, or finite-temperature effects.
   - **Boundary failure**: Restrict claims to the valid regime or reformulate with explicit corrections.
   - **Measurement failure**: Redesign the observable panel before interpreting physics.

9. **Final Claim Audit & Boundary Setting**
   - Calibrate claim language to evidence: observed, inferred, plausible, speculative.
   - State explicit validity boundaries (system size, interaction strength, symmetry class, operating regime).
   - Separate source-paper support from analogy-based inference and new-system inference.

## Output Format

Return the following:

1. **Research question and scope** with known limits and intermediate gap.
2. **Hypothesis map** with evidence strength, key assumptions, and failure modes.
3. **Validation plan** with variables, controls, metrics, and stopping conditions.
4. **Analysis plan** with layered checks and model-comparison rules.
5. **Decision log** for each gate (pass, fail, iterate).
6. **Claim boundary statement** with calibrated evidence labels.
7. **Iteration rules** for follow-up studies.

## Validation Gates

- **Gate A (Robustness)**: Controls must separate the mechanism from background; the signature must survive under stated uncertainty and perturbation.
- **Gate B (Identifiability)**: Mechanisms must be distinguishable; model parameters must be independently estimable from the chosen observables.
- **Gate C (Claim Calibration)**: Claim strength must match the evidence level; extrapolation beyond tested boundaries must be explicitly flagged.

## Claim Boundaries

- Claims are valid only within the tested symmetry class, scale regime, and uncertainty model.
- "Genuine" claims require exact criteria and convergence checks; "quasi-" or "candidate" claims apply when exact criteria are only approached.
- Do not generalize from a single platform or idealized model to an entire field.
- Distinguish verified claims, model-supported inferences, and agent-generated hypotheses.

## Failure Modes

- **Fragile optimum**: Signature vanishes under disorder, finite size, or parameter variation.
- **Confounding**: Observable is reducible to density, energy, preparation bias, or instrumental broadening.
- **Compensation**: Two mechanisms cancel in one observable but remain hidden without cross-checks.
- **Non-identifiability**: Model fits are degenerate or overparameterized.
- **Boundary violation**: Core assumptions such as scale hierarchy, symmetry, or linearity break down unnoticed.
- **Overclaiming**: Absence of a signature is presented as proof of a nonconventional phase, or model artifacts are treated as physical facts.

## Validity Checks

- **Mechanism clarity**: Does the effect follow from stated symmetry, overlap, or selection rules?
- **Control adequacy**: Are baseline, negative, positive, robustness, and compensation controls defined and passed?
- **Reproducibility**: Are assumptions, boundary conditions, normalization conventions, and parameter ranges documented?
- **Uncertainty coverage**: Are placement, geometry, spectral, fabrication, or numerical variations included?
- **Statistical validity**: Is sampling sufficient, and are uncertainties propagated through ratios and normalized quantities?
- **External validity**: Are conclusions limited to the modeled regime, and are extrapolations explicitly labeled?

## Provenance

- Synthesized from cluster 0.0 (symmetry-guided evidence analysis and claim audit).
- Source skill references: `nanophotonic-chiral-interface-exploration`, `quantum-plasmonics-mode-coupling-workflow`, `periodic-wave-svd-dark-mode-exploration`, `bosonic-many-body-indistinguishability-exploration`, `disorder-pathway-quantum-spin-liquids`, `enz-slab-vortex-research-workflow`, `heavy-ion-strangeness-research-design`, `low-dimensional-ultracold-crossover-exploration`.
- Paper-specific conclusions, operational protocols, and numerical parameters have been excluded; only transferable workflow structure is retained.
