---
name: sci-fiber-symmetry-guided-mechanism-discovery-and-valid-771027e5
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven research plans in quantum materials where symmetry, topology, and collective excitations govern emergent behavior.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery and validation workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Turn a candidate quantum material or structural motif into a disciplined, mechanism-focused research plan. This workflow guides hypothesis generation, staged validation, cross-probe discrimination, and claim bounding for emergent phenomena—such as topological order, spin-lattice coupling, anisotropic transport, or collective excitations—where symmetry and local structure are the central causal variables.

# When to use

Use this skill when the user asks to propose or evaluate research questions involving:
- Coupled quasiparticles (phonon, magnon, exciton, electron) and symmetry-selective hybridization.
- Layered, low-dimensional, or modulated materials where stacking, boundary structure, or anisotropy may drive electronic, optical, magnetic, or transport behavior.
- Topological or symmetry-protected modes and their boundary signatures.
- Mechanism discrimination between competing orders or reconstruction scenarios.

Do not use this skill as a general materials-science assistant, literature-review writer, or fabrication guide. It is strictly for non-operational research design and validation planning.

# Inputs required

- Target phenomenon and the observable that distinguishes it from related effects.
- Candidate material family, structural motif, or model system, including dimensionality and relevant symmetry constraints.
- Suspected coupling channels, order parameters, or symmetry-breaking fields.
- Available probes or modeling levels (e.g., structural, electronic, spectroscopic, transport, first-principles, effective models).
- Baseline systems lacking the suspected coupling or symmetry breaking.
- Constraints: computational budget, facility access, reproducibility requirements, and safety boundaries.

If inputs are missing, state assumptions explicitly and label resulting hypotheses as provisional.

# Core Workflow

Follow this ordered route. Do not skip a stage before its entry gate is satisfied.

1. **Frame the mechanism question**
   - Define the target phenomenon, the relevant degrees of freedom, and the symmetry context.
   - Identify the gap: what cannot be explained by an average-structure or single-phase model?
   - **Gate 1 — Clarity Gate:** Stop and reformulate if the phenomenon, observable, and symmetry constraints are undefined.

2. **Generate ranked mechanistic hypotheses**
   - Propose hypotheses that link structural motifs (e.g., stacking, dimensionality, anisotropy, termination, local coordination) to emergent behavior via symmetry-allowed coupling channels.
   - For each hypothesis record: mechanism, key assumptions, predicted observations, plausible failure modes, evidence strength (strong / moderate / weak / speculative), and boundary conditions.
   - Require at least one competing explanation.
   - **Gate 2 — Falsifiability Gate:** Stop if no hypothesis offers a testable prediction or a discriminating observation against alternatives.

3. **Design minimal validation plan with controls**
   - Define independent variables (structural, symmetry-breaking, environmental, or approximation-level) and dependent variables (spectral, transport, topological, optical, or response metrics).
   - Establish controls:
     - *Positive control:* a regime expected to show the target signature.
     - *Negative control:* a regime lacking the proposed mechanism.
     - *Strong control:* an independent structural, symmetry, or diagnostic check.
     - *Coupling-off / symmetry-reversal control:* ablation or inversion of the suspected channel.
     - *Artifact control:* calibration, baseline, and numerical robustness checks.
   - Specify minimal viable validation (smallest set that can falsify the hypothesis) and strong validation (broader sampling, method cross-checks).
   - **Gate 3 — Discrimination Gate:** Stop if the plan cannot distinguish the target mechanism from competing explanations.

4. **Execute staged evidence collection**
   - **Stage A — Structural & stability screening:** Confirm structural compatibility, required symmetries, and dynamic/energetic stability. Reject candidates that fail here unless instability itself is the research question.
   - **Stage B — Baseline characterization:** Characterize bare modes, isolated components, or normal-state behavior to establish a reference.
   - **Stage C — Mechanism-sensitive probing:** Collect evidence for coupled/reconstructed behavior (e.g., hybrid mode formation, band reconstruction, boundary localization, optical response changes). Advance only if Stage B is satisfied.
   - **Stage D — Independent diagnostic cross-check:** Verify with a complementary method, invariant, or probe that does not rely on the same observable.
   - **Gate 4 — Convergence Gate:** Stop or redesign if independent diagnostics conflict, controls fail, or the signal depends on an unverified approximation.

5. **Discriminate mechanisms and attribute causally**
   - Separate observations by evidence type (electronic, structural, optical, computational).
   - Attribute effects causally using paired comparisons: component versus stack, coupling-on versus coupling-off, normal versus ordered state, and independent-particle versus quasiparticle versus excitonic levels.
   - Require consistency across temperature, momentum, symmetry, and probe dependence.
   - **Gate 5 — Consistency Gate:** Stop if evidence types contradict, if the signal is explained by a simpler alternative, or if conclusions rely on a single uncontrolled observable.

6. **Bound claims and iterate**
   - Label each conclusion as source-paper-supported, cross-study-supported, or agent-inferred.
   - Document boundary conditions and failure modes explicitly.
   - **Decision:**
     - *Advance:* if the hypothesis survives all gates, propose stronger validation or a generalization test.
     - *Redesign:* if a specific assumption fails, revise the structural motif, coupling channel, symmetry argument, or model approximation and return to Step 2.
     - *Terminate:* if the candidate is unstable, the mechanism is indistinguishable from alternatives, or the effect is artifactual. Archive the failure mode as a boundary condition.
   - **Gate 6 — Advance/Terminate Gate:** Record the decision rationale before proceeding.

# Output Format

Return the following structured deliverables:

1. **Research question and mechanism map** — Target phenomenon, symmetry context, and identified gap.
2. **Ranked hypotheses** — Each with mechanism, assumptions, predictions, failure modes, evidence strength, and boundary conditions.
3. **Validation plan** — Variables, controls (positive, negative, strong, coupling-off, artifact), metrics, minimal viable validation, and stop conditions.
4. **Staged evidence summary** — Results per stage (A–D) with gate pass/fail status.
5. **Mechanism discrimination report** — Causal attribution, cross-probe consistency, and residual uncertainty.
6. **Iteration decision** — Advance, redesign, or terminate with rationale.
7. **Claim boundary statement** — Explicit limits on extrapolation and generality.
8. **Failure mode registry** — Documented risks that weakened or invalidated evidence.
9. **Validity and ethics checklist** — Confirmation that all validity checks and non-operational safety boundaries were addressed.

# Validation Gates

- **Clarity Gate:** The phenomenon, observable, and symmetry constraints must be defined before proceeding.
- **Falsifiability Gate:** Every hypothesis must have a testable prediction and at least one competing explanation.
- **Discrimination Gate:** The validation plan must include controls capable of distinguishing the target mechanism from alternatives.
- **Stability & Baseline Gate:** Structural compatibility, required symmetries, and dynamic stability must be satisfied; bare-mode or normal-state baselines must be established.
- **Convergence Gate:** Independent diagnostics and cross-checks must agree; conflicting evidence triggers redesign.
- **Consistency Gate:** Evidence across probes, approximations, and momentum/symmetry sectors must converge; single-observable claims are insufficient.
- **Advance/Terminate Gate:** An explicit decision to advance, redesign, or terminate must be recorded with boundary conditions.

# Claim Boundaries

- Do not generalize from a single candidate system or paper to field-wide consensus.
- Do not treat computational predictions, theoretical analogies, or correlated observations as experimental facts.
- Do not extrapolate beyond validated symmetry classes, stability regimes, energy scales, or length scales.
- Clearly separate source-paper evidence, current workflow evidence, and speculative inference.
- Avoid application-readiness or device-performance claims without mechanism-level controls and independent validation.
- State where the mechanism is expected to weaken, reverse, or disappear.

# Failure Modes

- **Structural/dynamic instability:** The candidate lacks the required symmetry or is dynamically unstable under the proposed conditions.
- **Competing order:** Charge, structural, magnetic, or surface order explains the observed signature without invoking the target mechanism.
- **Artifact dominance:** Surface/interface sensitivity, matrix-element effects, domain averaging, or numerical artifacts (convergence, finite-size, basis, screening) produce the signal.
- **Symmetry or labeling error:** Incorrect symmetry assignment, band/orbital labeling, or gap identification invalidates the mechanism.
- **Missing physics:** Omitted correlation effects, spin-orbit coupling, disorder, or anharmonicity alter the conclusion.
- **Insufficient discrimination:** The target mechanism cannot be separated from a simpler alternative with the available controls.
- **Non-robust boundary modes:** Predicted topological or localized boundary signatures fail under reasonable geometry or termination variations.

# Validity Checks

Before finalizing any plan or conclusion, verify:

- **Research question clarity:** Are the phenomenon, coupling channel, and symmetry conditions all defined?
- **Evidence labeling:** Are source-supported facts separated from agent-generated inferences?
- **Control validity:** Do positive, negative, strong, coupling-off, and artifact controls test distinct alternatives?
- **Cross-probe consistency:** Do structural, electronic, optical, transport, and computational evidence address the same mechanism?
- **Convergence and robustness:** Are numerical settings, model approximations, and finite-size effects tested?
- **Confounding factors:** Are disorder, defects, temperature, substrate, stacking variations, and damping considered?
- **Reproducibility:** Are inputs, symmetry conventions, analysis pipelines, and decision criteria documented?
- **Boundary conditions:** Are claims limited to validated regimes, and are non-consensus warnings included?
- **Safety and ethics:** Does the plan remain non-operational, respect institutional requirements, and avoid hazardous procedural detail?

# Provenance

This workflow was synthesized from Cluster 63, Subcluster 63.0 (symmetry-guided mechanism discovery and validation). Source skills contributing to the merge include:

- `anisotropic-orbital-magnetism-research-design`
- `2d-semiconductor-topology-exciton-research`
- `layered-cdw-stacking-exploration`
- `2d-superconductor-discovery-workflow`
- `vdW-heterostructure-optoelectronic-exploration`
- `chiral-magnon-phonon-research-design`
- `topological-phononics-research-agent`
- `moire-topological-collective-mode-research`

The workflow abstracts shared research stages and decision patterns without importing paper-specific conclusions, numerical parameters, or material recipes.
