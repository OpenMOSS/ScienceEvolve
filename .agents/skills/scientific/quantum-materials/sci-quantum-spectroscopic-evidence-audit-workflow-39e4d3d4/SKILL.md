---
name: sci-quantum-spectroscopic-evidence-audit-workflow-39e4d3d4
description: Observable-driven end-to-end workflow for generating testable hypotheses from spectroscopic anomalies, designing controlled validation, and auditing mechanistic claims against cross-evidence boundaries.
scienceevolve-title: "Quantum materials and condensed matter · spectroscopic evidence audit workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Transform ambiguous or anomalous spectroscopic observations into structured, testable research questions. Guide the agent to bound mechanistic claims by designing minimal validations, comparing competing models through residual and cross-evidence analysis, and enforcing strict claim hierarchies. The workflow is method-agnostic across spectroscopic modalities and intended for research design and analysis planning, not operational execution.

# When to use

- When spectral data contain unresolved peaks, anomalous linewidths, unexpected temperature/field/perturbation responses, or systematic residuals that defy baseline explanation.
- When multiple databases, models, or experiments disagree on peak assignment or mechanism.
- When designing a study to distinguish competing microscopic mechanisms using spectroscopic fingerprints.
- When migrating an analytical method from one material, molecule, or quantum system to another.
- When auditing whether a spectral feature supports a mechanistic claim or could arise from artifacts, background, or confounding degrees of freedom.

# Inputs required

- **Target system**: Generic physical description (composition, symmetry, known energy levels, relevant degrees of freedom, phase/state).
- **Spectral evidence**: Available or planned spectroscopic data modalities, resolution, calibration lineage, and quality metrics.
- **Anomaly definition**: Specific observable discrepancies (peak position, intensity, width, asymmetry, background, spectral weight transfer, lifetime).
- **Baseline models**: Established theoretical or empirical models, their known domains of validity, and documented failure modes.
- **Control opportunities**: Accessible reference systems, null conditions, isotopic/structural perturbations, or independent measurement channels.
- **Constraints**: Non-operational safety boundaries, data governance, computational limits, and ethical/compliance scope.

# Core Workflow

1. **Observable Framing & Question Definition**
   - Anchor the research question to reproducible spectral anomalies or cross-source discrepancies, not to a preferred mechanism.
   - Translate anomalies into observable terms (energy, intensity, lineshape, temperature/perturbation trend, spectral weight).
   - *Decision gate*: Confirm anomaly reproducibility across independent measurements, calibrations, or data subsets. If unreproducible, stop; diagnose data quality and preprocessing first.

2. **Hypothesis Portfolio Construction**
   - Generate ≥2 competing mechanistic hypotheses plus a null/artifact hypothesis.
   - Map each hypothesis to a multi-channel observable fingerprint (≥2 independent spectral or correlative signatures).
   - Assign evidence strength tiers (High / Medium / Low / Speculative) with explicit rationale.
   - List key assumptions and falsification criteria for each hypothesis.
   - *Decision gate*: Every retained hypothesis must have at least one falsifiable prediction distinct from competitors. If not, refine or drop.

3. **Control Architecture & Minimal Viable Validation**
   - Define independent variables (spectral region, sample condition, perturbation, isotopic substitution) and dependent spectral observables.
   - Specify positive controls (known reference signatures), negative controls (absence of target interaction), and strong controls (cross-condition or cross-modality comparisons).
   - Preset stop conditions: signal irreproducibility, control failure, model non-identifiability, or boundary violation.
   - *Decision gate*: Verify that the proposed validation can discriminate the leading two hypotheses. If not, redesign before proceeding.

4. **Tiered Spectral Analysis & Model Comparison**
   - Record all preprocessing choices (calibration, background, normalization, smoothing) with versioned provenance.
   - Fit baseline model first; catalog its success and failure regions.
   - Introduce candidate mechanism models incrementally; justify each added parameter by its effect on multiple observables, not just residual reduction.
   - Compare all models on identical data windows using identical metrics.
   - Perform residual diagnostics to distinguish systematic structure from noise.
   - Quantify parameter uncertainties, correlations, and identifiability.
   - *Decision gate*: Candidate models must improve explanation of ≥2 independent observables without overfitting. If improvement is single-observable or parameter-unstable, reject or simplify.

5. **Cross-Evidence Integration**
   - Assemble an evidence matrix mapping each hypothesis against every evidence class (spectral, computational, thermodynamic, structural).
   - Require convergent support: upgrade confidence only when ≥2 independent evidence channels consistently favor one hypothesis.
   - Document conflicting evidence explicitly; do not suppress.
   - *Decision gate*: Mechanistic claims require convergent cross-evidence. If only one channel supports, downgrade to exploratory.

6. **Claim Auditing & Boundary Setting**
   - Classify outputs into:
     - *Data-supported facts*: directly observed spectral trends.
     - *Model-supported inferences*: parameter ranges or mechanism directions constrained by fits.
     - *Agent speculations*: predictions for new systems or untested conditions.
   - State boundary conditions explicitly (applicable energy ranges, temperature windows, system classes, symmetry constraints).
   - Flag any claim relying on a single dataset, single model, or single observable.
   - *Decision gate*: High-confidence claims must pass all controls and show cross-evidence convergence. If not, downgrade or retract.

7. **Iteration or Termination**
   - **If supported**: generate follow-up predictions for adjacent conditions; expand to complementary observables.
   - **If partially supported**: narrow the mechanism's scope; identify missing evidence; design next minimal validation.
   - **If unsupported/artifact**: document failure modes; update the null model; terminate the hypothesis line.
   - **If inconclusive**: improve uncertainty quantification or add an independent observable before expanding the parameter space.
   - *Stop conditions*: hypothesis falsified by controls; reproducibility failure; systematic uncertainty exceeds signal; resource or safety boundary reached; alternative explanation is simpler and equally predictive.

# Output Format

Deliverables must include:

1. **Research question**: Observable definition, anomaly description, and scientific motivation.
2. **Hypothesis portfolio**: ≥3 competing hypotheses with evidence strength, key assumptions, falsifiable predictions, and failure modes.
3. **Validation design**: Variables, control hierarchy, minimal viable validation, evaluation metrics, and preset stop conditions.
4. **Analysis plan**: Preprocessing protocol, tiered model specification, residual diagnostics, uncertainty budget, and visualization scheme.
5. **Evidence matrix**: Cross-channel support status for each hypothesis.
6. **Iteration plan**: Update rules for support, partial support, non-support, and inconclusive outcomes.
7. **Claim boundary statement**: Explicit classification of facts vs. inferences vs. speculations, with applicability limits.
8. **Validity summary**: Confounders checked, reproducibility status, statistical validity, and residual risks.

# Validation Gates

- **Reproducibility gate**: Anomaly appears in independent measurements or data subsets processed through alternative pipelines.
- **Discrimination gate**: Experimental design can theoretically distinguish the top two hypotheses via predicted observable differences.
- **Model gate**: Candidate model improves multiple independent observables and shows stable parameters across fit initializations and window choices.
- **Convergence gate**: Mechanistic claim is supported by ≥2 independent evidence channels (spectral, computational, or correlative).
- **Boundary gate**: All conclusions specify applicability limits; no single-study results are stated as domain consensus.

# Claim Boundaries

- **Permitted claims**: Observable trends documented in the dataset; relative model performance on the tested data window; parameter constraints derived from fits with reported uncertainties.
- **Requires qualification**: Mechanistic interpretations supported by only one evidence channel; extrapolations to adjacent temperatures, dopings, or system sizes.
- **Prohibited claims**: Causal mechanism proven by a single spectral feature; direct translation of one system's fitted parameters to an untested system; operational fabrication or hazardous procedural prescriptions; presentation of single-study findings as established field consensus.

# Failure Modes

- **Overfitting**: Adding parameters to absorb residuals that stem from preprocessing or background errors rather than physics.
- **Host/background confounding**: Misattributing spectral features to the target mechanism when they originate from substrate, solvent, instrument response, or environmental background.
- **Calibration drift**: Interpreting frequency/intensity shifts as physical when they arise from instrumental instability or reference changes.
- **Model non-identifiability**: Multiple parameter sets or competing models produce indistinguishable spectral shapes, leading to false uniqueness claims.
- **Single-observable reliance**: Basing a mechanistic conclusion on one peak, one line, or one temperature point without cross-checks.
- **Processing artifact**: Features introduced by smoothing, interpolation, background subtraction, or normalization that are mistaken for real signals.
- **False negative**: Concluding absence of a feature due to insufficient sensitivity or inappropriate model window, when a more suitable analysis would reveal it.

# Validity Checks

- **Confounders**: Review substrate peaks, impurities, orientation effects, sample heterogeneity, instrument baseline, and processing choices.
- **Reproducibility**: Verify consistency across repeated measurements, independent samples, alternative fit algorithms, and blinded reanalysis.
- **Statistical validity**: Report parameter uncertainties, correlation matrices, residual distributions, model selection criteria, and multiple-comparison safeguards.
- **Computational validity**: When using theoretical spectra, verify that boundary conditions, interaction ranges, and selection rules are commensurate with experiment.
- **Identifiability**: Check whether spectral parameters are uniquely constrained by the data or suffer from degeneracy.
- **Boundary discipline**: Confirm that every conclusion states its applicable system class, energy/temperature range, and symmetry regime.
- **Evidence provenance**: Clearly separate "established method patterns," "current-data inferences," and "agent-generated speculations."

# Provenance

- Derived from cluster `110`, subcluster `110.0`.
- Synthesized from source skills: `lanthanide-molecule-spectroscopy-research-agent` (`8e2ec1a4cbdcb58d`), `endofullerene-thz-ir-spectroscopy-exploration` (`8d2f08d1602bb7fc`), `kagome-cdw-spectroscopy-research-pattern` (`f2acea7b76aa3eac`), `double-perovskite-spectroscopy-exploration` (`99dc9243339eca48`), `quantum-many-body-spectral-thermalization-workflow` (`ba06c3baa453aa67`), `high-resolution-molecular-spectral-line-discovery` (`13ed36a2e5474b61`), `cuprate-strange-metal-arpes-modeling` (`8f2d101de170811c`), `quantum-surface-spectroscopy-ysr-exploration` (`3c2fd0c9c80a4d79`).
