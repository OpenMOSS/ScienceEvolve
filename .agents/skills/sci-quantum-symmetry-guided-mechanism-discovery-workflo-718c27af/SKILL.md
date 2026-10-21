---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-718c27af
description: A reusable end-to-end workflow for generating, discriminating, and validating competing microscopic mechanisms in quantum and topological systems using symmetry-resolved probes, convergent evidence, and iterative falsification.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 16"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides agents to formulate research questions and design validation plans for quantum, topological, and correlated systems where multiple microscopic mechanisms could explain the same observable. It abstracts a transferable pattern: start from a tension between theory and observation, generate competing symmetry-resolved hypotheses, demand convergent evidence from independent probes, and iteratively refine or falsify claims without treating any single study as universal consensus.

# When to use

Use this skill when:

- A transport, spectral, spatial, or dynamical anomaly suggests more than one microscopic explanation.
- The goal is to design a study that combines symmetry-resolved probes with topological or response signatures to distinguish competing ground-state or excitation mechanisms.
- You need to evaluate whether a proposed mechanism is supported by converging independent evidence rather than by an isolated signature.
- You are translating a specific system's evidence structure into a reusable framework for related platforms or model classes.
- An unexpected control result, theoretical inconsistency, or assignment conflict requires reassessing which hypotheses remain viable.

# Inputs required

Before producing a research plan, request or infer:

- **Target system class**: dimensionality, symmetry class, and relevant degrees of freedom (spin, valley, layer, orbital, sublattice, boundary channel).
- **Competing candidate mechanisms**: at least two plausible microscopic states or interaction terms.
- **Available probes and observables**: transport, spectroscopic, imaging, magnetic, thermodynamic, or computational diagnostics.
- **Known or assumed symmetries and selection rules**: including how they may be preserved or broken by perturbations.
- **Reference controls**: positive benchmarks where a mechanism is established, and negative conditions where it should be absent or suppressed.
- **Constraints**: feasibility limits, safety boundaries, sample or computational resources, and reproducibility requirements.
- **Existing evidence**: prior data, literature trends, preliminary observations, and known inconsistencies.

If inputs are missing, state assumptions explicitly and flag conclusions as provisional.

# Core Workflow

1. **Frame the gap**
   - Identify the tension between established theory and an unexplained observable (transport anomaly, spectral feature, boundary response, or symmetry violation).
   - Convert the gap into a falsifiable research question: “Which internal degree of freedom or interaction term reconciles observation X with constraint Y?”
   - *Stop condition*: If the anomaly can be explained by known artifacts or calibration errors, halt and redesign baselines.

2. **Generate competing mechanisms**
   - Produce at least three candidate hypotheses (e.g., conventional symmetry-broken, coherent/topological, texture/disorder-induced, and artifact/non-specific).
   - For each hypothesis, define: expected symmetry/transport/spectral signatures, evidence strength (high/medium/low/speculative), key assumptions, and likely failure modes.
   - Build a signature matrix: rows = hypotheses; columns = independent probes/observables; mark expected trends and ambiguous outcomes.
   - *Decision gate*: If fewer than two hypotheses make distinguishable predictions across available probes, stop and broaden the probe set or refine the question.

3. **Design convergent validation**
   - Select a primary order-parameter proxy tied to the proposed internal degree of freedom (spin, valley, layer, orbital, sublattice, or boundary channel).
   - Complement it with at least one independent probe accessing a different observable class (transport, spectroscopy, spatial imaging, dynamical response, or projected computation).
   - Define a control hierarchy: positive controls (known benchmark), negative controls (mechanism absent), strong controls (competing state with different symmetry signature), and artifact controls (instrumental, nonlocal, thermal, interference, finite-size).
   - Pre-register metrics and stop conditions before interpreting data.
   - *Decision gate*: If no feasible control can falsify the leading hypothesis, redesign the experiment before proceeding.

4. **Correlate evidence across probes**
   - Require co-variation of the primary proxy and the topological/transport/spectral signature across the same control parameter.
   - Demand alignment of onset, disappearance, hysteresis, and phase boundaries before assigning a microscopic mechanism.
   - Quantify uncertainty: report sensitivity to background subtraction, fitting choices, baseline correction, and realization variability.
   - *Stop condition*: If probes do not share a plausible phase boundary or show incompatible symmetry dependence, halt mechanism claims and test for confounders.

5. **Classify outcomes and update hypotheses**
   - **Confirming**: independent probes and controls converge on one mechanism → strengthen claim and test a sharper discriminant or adjacent regime.
   - **Partial**: one probe supports a phase but symmetry/microscopic evidence is incomplete → add the missing discriminant measurement.
   - **Contradictory**: probes imply incompatible symmetries or phase boundaries → introduce texture, disorder, interaction, or renormalization as explicit model variables; derive new predictions.
   - **Artifact-prone**: controls suggest non-specific or instrumental origin → redesign controls and analysis pipeline before interpreting mechanism.
   - *Iteration rule*: Prefer hypotheses that predict new discriminants over those that only rationalize existing data.

6. **Bound claims and terminate**
   - State the regime of validity (symmetry class, correlation regime, energy window, dimensionality, platform).
   - Label each claim as verified, inferred, or speculative.
   - Document which observation updated the model and which alternatives were weakened.
   - *Stop condition*: Terminate when the viable hypothesis set is narrowed to one robust candidate supported by convergent evidence, or when feasible discriminants are exhausted and the question remains open.

# Output Format

When using this skill, produce:

1. **Research question**: one concise, falsifiable question and why it is nontrivial.
2. **Candidate mechanisms table**: for each hypothesis, list expected signatures, evidence strength, key assumptions, and likely failure modes.
3. **Signature matrix**: hypotheses versus independent probes, marking expected trends and ambiguous outcomes.
4. **Minimal viable validation plan**: non-operational experimental or computational logic with primary probe, control hierarchy, metrics, and stop conditions.
5. **Analysis plan**: correlation tests, uncertainty treatment, robustness checks, and visualization strategy.
6. **Iteration plan**: how confirming, partial, contradictory, or artifact-prone results would update each hypothesis.
7. **Validity and ethics statement**: boundary conditions, reproducibility requirements, claim labels, and safety limitations.

# Validation Gates

Apply these gates before treating a hypothesis as credible:

- **Selection-rule validity**: confirm that the probe’s symmetry contrast is calibrated in regimes where the assignment is known.
- **Cross-probe alignment**: require shared onset, disappearance, hysteresis, and phase-boundary behavior across independent diagnostics.
- **Control sufficiency**: verify that positive, negative, strong, and artifact controls are present and interpreted.
- **Uncertainty quantified**: report confidence intervals, sensitivity to background subtraction, fitting models, and preprocessing choices.
- **Reproducibility**: require consistency across devices, realizations, tuning paths, measurement sequences, and independent analysis pipelines.
- **Thermodynamic and model consistency**: compare inferred ordering scales with temperature and field dependence; state where the theoretical model is expected to fail.

# Claim Boundaries

- Label claims as **established** (supported by multiple independent sources), **plausible** (consistent with the model under stated assumptions), **speculative** (depends on unverified extensions), or **unsupported** (contradicted or lacking mechanism).
- Restrict claims to the studied symmetry class, material or model family, correlation regime, energy window, and platform.
- Do not present agent-inferred hypotheses or single-source evidence as field-wide consensus.
- Separate mechanism-level robustness from platform-specific implementation details.

# Failure Modes

- **Isolated signature**: relying on a single probe, uncontrolled realization, or unverified assignment.
- **Confounding by symmetry breaking**: the perturbation or sample structure breaks the symmetry required for the proposed state.
- **Boundary or finite-size artifacts**: apparent topological, localized, or ordered modes arising from geometry, scale, or regularization choices.
- **Misassigned selection rules**: incorrect calibration of optical, orbital, layer, or spin contrast.
- **Overfitting**: post-hoc model adjustments that rationalize data without predicting new discriminants.
- **Extrapolation beyond validity**: applying a model outside its tested regime without reformulating source couplings, current operators, or boundary conditions.

# Validity Checks

Before finalizing a plan or conclusion, verify:

- **Gap validity**: the question addresses an unresolved intersection not already settled by existing diagnostics.
- **Diagnostic convergence**: spatial, spectral, topological, and dynamical evidence agree, or disagreements are explicitly explained.
- **Boundary-condition consistency**: open-boundary and periodic-boundary analyses are interpreted correctly and not mixed incoherently.
- **Realization independence**: disorder or amorphous results are reproducible across multiple independent samples or ensembles.
- **Metric validity**: localization, topology, and response metrics are appropriate for the chosen system class and dimensionality.
- **Current/operator consistency**: response currents, magnetization terms, and source couplings are derived from the same microscopic description.
- **Artifact checks**: evaluate nonlocal transport, optical interference, background drift, contact effects, pulse overlap, heating, and preprocessing artifacts.
- **Sample-structure checks**: consider disorder, strain, domain structure, inhomogeneity, impurity phases, and stacking variation.

# Provenance

- Derived from cluster 137, subcluster 137.0 of the Codex scientific skills corpus.
- Synthesized from source skills: `moire-topological-state-exploration`, `optical-correlation-spectroscopy-research`, `nonhermitian-boundary-topology-exploration`, `correlated-quantum-materials-rixs-workflow`, `topological-thermal-transport-research-design`, `core-exciton-spectroscopy-exploration`, `magnon-phonon-coupling-research-workflow`, and `amorphous-disordered-topological-research`.
- Preserves the shared logic of convergent mechanism diagnosis and symmetry-guided validation without reproducing any paper-specific system, material parameter, numerical result, or operational protocol.
