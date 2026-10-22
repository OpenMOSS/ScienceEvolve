---
name: sci-quantum-symmetry-guided-evidence-analysis-workflow-800cc54a
description: A reusable end-to-end workflow for designing, validating, and auditing mechanism-driven claims in structured quantum, wave, and topological systems using symmetry-guided hypothesis generation and multi-modal evidence analysis.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided evidence analysis workflow 5"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to design, validate, and audit mechanism-driven claims in structured physical systems—such as quantum materials, topological circuits, photonic and wave systems, and correlated matter—using symmetry-guided hypothesis generation and multi-modal evidence analysis. The workflow converts a target research question into a falsifiable hypothesis, a controlled validation plan, and an auditable claim boundary without reproducing source-specific geometries or conclusions.

# When to use

Use this skill when the user asks to:

- Propose new research questions where symmetry, geometry, topology, or coupling structure may generate new observable phenomena.
- Design validation studies that require isolating a mechanism from baseline effects, artifacts, or accidental degeneracies.
- Audit existing claims about strong coupling, topological protection, resonance engineering, or correlation witnesses.
- Build iterative research plans that combine theory, simulation, and empirical benchmarks.

Applicable across quantum materials, nanophotonics, metamaterials, modular wave systems, and related platforms. Do not use this skill as a substitute for operational laboratory protocols, fabrication manuals, domain-specific safety reviews, or field-wide consensus generation.

# Inputs required

Before executing the workflow, collect or explicitly assume:

- **Target system class**: quantum material, photonic structure, circuit lattice, waveguide network, or hybrid platform.
- **Conventional constraint or baseline**: the known symmetry, geometry, or classification that limits the phenomenon in standard settings.
- **Proposed lever**: the symmetry breaking, geometry change, coupling pathway, or boundary condition hypothesized to alter the outcome.
- **Target observable**: spectrum, field map, response matrix, correlation function, transmission, phase, or other measurable output.
- **Available validation tools**: analytical models, numerical solvers, benchmark systems, or empirical measurements.
- **Constraints**: safety, computational, fabrication tolerance, measurement access, or ethical boundaries.
- **Prior evidence**: what is already validated versus what remains hypothetical.

# Core Workflow

Execute the following ordered route. Pause at each decision gate; iterate or stop if the gate fails.

1. **Frame the question and scope the mechanism**
   - State the phenomenon, the conventional constraint, and the proposed lever.
   - Define the system family, scale, and modality within which the claim will be tested.
   - *Gate*: Is the proposed lever physically distinct from the baseline and capable of altering the target observable? If no, stop and reformulate.

2. **Generate falsifiable hypotheses**
   - **Mechanism hypothesis**: how the lever enables or modifies the phenomenon.
   - **Signature hypothesis**: the specific observable consequence (e.g., degeneracy splitting, avoided crossing, phase jump, selection-rule change).
   - **Failure hypothesis**: the condition under which the signature should weaken, disappear, or relocate.
   - Assign **evidence strength** (speculative / weak / moderate / strong) based on analogy, model support, and prior validation.
   - List key assumptions, smallest falsification test, and extrapolation boundary.
   - *Gate*: Does the hypothesis predict a discriminating signature that is not merely a generic intensity change? If no, refine.

3. **Design minimal viable validation**
   - **Bare-subsystem characterization**: reference states of uncoupled or baseline components.
   - **Primary design**: the structured system under test.
   - **Controls**:
     - Baseline control: remove the lever while keeping the substrate fixed.
     - Negative control: preserve the suppressing symmetry or disable the proposed coupling.
     - Positive control: a known valid case or benchmark, if available.
     - Perturbation control: a targeted change that should alter the signature if the mechanism is correct.
     - Method/convention control: an independent analysis route or alternative normalization.
   - Define independent variables, dependent variables, primary metrics, and stop conditions.
   - *Gate*: Can the claimed mechanism be isolated from material amount, footprint, boundary effects, or numerical artifacts? If no, redesign controls.

4. **Execute multi-modal analysis**
   - Compute or measure the full response.
   - Decompose into candidate modes, channels, or subsystems.
   - Apply converging diagnostics (spectral, phase, field, correlation, state counting, or density indicators) rather than relying on a single feature.
   - Compare the primary design against all controls under matched conditions.
   - *Gate*: Do multiple independent diagnostics agree on the state assignment? If no, audit conventions, corrections, boundary conditions, and reference definitions before proceeding.

5. **Audit evidence and classify strength**
   - Map raw observables to theoretical diagnostics via explicitly documented conventions.
   - Apply only justified corrections; propagate uncertainty.
   - Re-evaluate evidence strength:
     - **Strong**: theory, simulation, and independent checks agree across controlled variants.
     - **Moderate**: held-out prediction or simulation support with consistent controls.
     - **Weak**: analogy or visual plausibility only.
     - **Inconclusive**: diagnostics disagree or controls fail.
   - *Gate*: Is the validation data independent of model-tuning data? If no, flag and downgrade.

6. **Iterate or pivot**
   - If evidence is strong: test robustness across geometry, disorder, loss, or model assumptions.
   - If evidence is moderate: add discriminating controls or refine the auxiliary structure.
   - If evidence is weak or inconclusive:
     - Audit for accidental symmetry restoration, independent mode crossing, or generic perturbation artifacts.
     - Revisit boundary conditions, finite-size effects, and numerical regularization.
   - **Stop conditions**:
     - The negative control reproduces the target signature without explanation.
     - The signature disappears under a perturbation that should not affect the claimed mechanism.
     - Results depend on undocumented assumptions, unsupported approximations, or unverified fitted parameters.
     - Visual plausibility is not matched by structural or physical validity.
     - Safety or domain constraints are violated.
   - *Gate*: After iteration, has the mechanism been isolated or the design rejected? If neither, bound the claim and stop.

7. **Bound claims and report**
   - Separate validated findings from new agent inference.
   - State the exact geometry, representation, observable, and validation level to which the claim applies.
   - Identify the next decisive test that could falsify the leading hypothesis.

# Output Format

Return the audit in this structure:

1. **Research question**: concise statement of the proposed problem and target system class.
2. **Hypothesis set**: mechanism, signature, and failure hypotheses with evidence strength, key assumptions, and smallest falsification test.
3. **Validation plan**: bare subsystems, primary design, control hierarchy, variables, metrics, and stop conditions.
4. **Analysis summary**: converging diagnostics used, control comparisons, evidence classification, and uncertainty handling.
5. **Iteration log**: updates to hypotheses, controls, or models after each cycle, with reasons for continuation or termination.
6. **Validity and scope statement**: reproducibility checks, main confounders, extrapolation boundaries, and separation of verified evidence from inference.

# Validation Gates

- **Mechanism distinctness**: The proposed lever must be physically distinguishable from the baseline.
- **Predictive specificity**: The hypothesis must predict a non-generic signature with a defined negative case.
- **Control isolation**: Controls must isolate the mechanism from material amount, footprint, boundary artifacts, and numerical effects.
- **Diagnostic convergence**: Multiple independent diagnostics must agree before elevating evidence strength.
- **Independence from tuning**: Validation data must be independent of the data used to tune the model or fit parameters.
- **Iteration termination**: The cycle must stop when negative controls match the primary design, assumptions are unsupported, or safety constraints are breached.

# Claim Boundaries

- Do not treat a single source paper or single-system demonstration as field-wide consensus.
- Do not present generated designs, model predictions, or simulation results as experimentally validated facts without independent checks.
- Distinguish theoretical prediction, simulation support, and empirical validation explicitly.
- Limit claims to the tested system family, geometry, scale, observable, and validation level.
- Avoid extrapolating performance or mechanism to untested platforms, materials, or operating regimes.

# Failure Modes

- **Accidental symmetry restoration**: The local motif unintentionally reintroduces the suppressing symmetry.
- **Baseline confounding**: Spectral or response changes are explained by material amount, thickness, or footprint rather than the proposed mechanism.
- **Independent crossing misidentified as coupling**: Two uncoupled modes cross without coherent hybridization.
- **Generic perturbation misidentified as structured control**: An unstructured auxiliary input produces the same effect as the encoded pattern.
- **Numerical or convention artifact**: Finite-size effects, discretization, mesh choices, normalization errors, or unstated corrections create spurious signatures.
- **Overfitting**: The result depends on a single unverified fitted parameter or a narrow geometry.
- **Support-region violation**: A proposed hybrid state or mode lies outside the spectral or parameter region where it can physically exist.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Mechanism isolation**: Controls differ from the primary design only in the intended variable.
- **Symmetry consistency**: Every predicted degeneracy, splitting, or selection-rule change is tied to a stated operation.
- **Control completeness**: Baseline, negative, positive, perturbation, and method controls are all defined.
- **Reproducibility**: Metadata, conventions, corrections, and model assumptions are documented enough for independent reconstruction.
- **Uncertainty propagation**: Measurement noise, calibration uncertainty, and model uncertainty are reported and carried through to the diagnostic.
- **Boundary discipline**: Conclusions do not exceed the tested geometry, representation, observable, or validation level.
- **Source separation**: Claims clearly distinguish what is validated in prior work from what is newly inferred by the agent.

# Provenance

Synthesized from cluster 105 / subcluster 105.0. Derived from source skills: `topolectrical-bidirectional-design`, `photonic-waveguide-resonance-discovery`, `perturbative-xuv-wavefront-exploration`, `geometry-altermagnet-research-design`, `organic-nanophotonics-surface-mode-coupling`, `quantum-magnet-entanglement-witness-design`, `exciton-metasurface-research-workflow`, `near-field-thermal-metamaterial-spectral-design`.
