---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-1ca12e93
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in quantum, topological, and correlated matter, moving from gap identification through hypothesis generation, minimal validation design, layered analysis, and claim-bounded iteration.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 48"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to turn observations in quantum, transport, spin, topological, or correlated systems into reusable, symmetry-guided mechanism-discovery campaigns. The goal is not to reproduce any single study, but to help an agent identify conceptual gaps, generate falsifiable hypotheses, design minimal validations with strong controls, analyze evidence layer by layer, and iterate responsibly while bounding claims.

# When to use

Trigger when competing mechanisms in quantum, correlated, or topological systems produce similar observables and symmetry analysis can discriminate among them. Use when distinguishing closely related phases or states by symmetry properties, when designing cross-probe or component-resolved studies, when mapping anomaly boundaries, or when engineering and validating non-equilibrium states. Do not use for operational lab recipes, device fabrication, hazardous procedures, or as a substitute for domain-specific safety review.

# Inputs required

Before generating a research plan, collect or infer:

- **Target system class** and relevant degrees of freedom.
- **Baseline theory** or established description and its structural assumptions.
- **Candidate mechanisms** and their symmetry properties.
- **Available observables and probes**, distinguishing local from average, global from component-resolved, and structural from functional readouts.
- **Known confounders and artifacts**, such as disorder, boundary effects, finite-size contributions, or measurement geometry biases.
- **Constraints**: theoretical, computational, experimental access, and safety boundaries.

# Core Workflow

Follow this ordered end-to-end route. Pause at each decision gate; iterate or stop if the gate conditions are not met.

1. **Symmetry Audit and Gap Formulation**
   - Identify the conceptual gap: where existing labels or theories fail to distinguish mechanisms that produce different observable consequences.
   - Classify relevant symmetries (broken and unbroken) for candidate states, order parameters, and observables.
   - Define the operational distinction between the candidate mechanism and nearest alternatives using symmetry-compatible language.
   - *Decision gate*: If the gap cannot be framed as a symmetry-resolvable distinction, stop and refine the research question.

2. **Hypothesis Generation**
   - For each candidate mechanism, state the hypothesis, predicted observable sequence or signature, evidence strength (strong / moderate / weak / speculative), key assumptions, and failure modes.
   - Include at least one conservative extension, one mechanism-focused hypothesis, and one disconfirming or artifact hypothesis.
   - Ensure each hypothesis links a symmetry property to a measurable discriminant.
   - *Decision gate*: If a hypothesis lacks a falsifiable prediction or symmetry-linked discriminant, reformulate before proceeding.

3. **Minimal Validation Design**
   - Design the smallest credible study that can discriminate the leading hypotheses.
   - Define independent variables, dependent variables mapped directly to the mechanism, and context variables.
   - Specify controls: positive, negative, alternative-class, boundary/artifact, and regime controls.
   - Predefine evaluation metrics aligned with the mechanism rather than magnitude alone, and state stop conditions.
   - *Decision gate*: If the minimal validation cannot distinguish the primary hypothesis from at least one serious alternative, redesign before execution.

4. **Execution and Provenance Logging**
   - Run the study at a conceptual level; record system or model choices, parameter regimes, preprocessing steps, calibration status, and analysis version.
   - Maintain linkage between raw and processed outputs.
   - *Decision gate*: If data quality is insufficient or provenance is incomplete, pause and address gaps before analysis.

5. **Layered Analysis**
   - Establish baseline behavior from the standard theory or control case.
   - Perform component-resolved or cross-probe decomposition (e.g., local versus average, bulk versus boundary, global versus sector-resolved).
   - Locate boundaries, scaling regimes, or sequence changes with uncertainty estimates.
   - Test simple scaling only in explicitly justified regimes; inspect residuals and exponent stability.
   - Compare mechanism-based models against alternatives using symmetry-consistent criteria.
   - *Decision gate*: If controls fail, artifacts dominate, or the signal is not reproducible, stop and revisit the validation design.

6. **Mechanism Discrimination and Claim Bounding**
   - Map observed sequences or signatures to the symmetry-based classification.
   - Grade evidence as supported, weakened, inconclusive, or rejected.
   - Bound claims by regime, sample or model validity, and extrapolation limits.
   - Separate source-supported inferences from agent-inferred extensions.
   - *Decision gate*: If evidence supports the hypothesis and controls pass, refine the model and test a stronger prediction. If evidence is ambiguous, add targeted controls. If evidence contradicts the hypothesis, identify whether the failure is empirical, model-based, regime-based, or artifact-based, then return to Step 2 or 3.

7. **Iteration and Stop Conditions**
   - Update the hypothesis ledger with observed outcomes and revised evidence strength.
   - Iterate only when new experiments resolve competing mechanisms, not merely to refine numerical details.
   - **Stop if**:
     - controls consistently fail;
     - the signature is non-reproducible;
     - an alternative explanation explains the evidence equally well;
     - key assumptions are unsupported;
     - boundary or safety constraints are breached;
     - the mechanism is reduced to a narrow regime with no broader discriminant.

# Output Format

Return a structured research plan containing:

1. **Research question**: concise question tied to a symmetry or mechanism boundary.
2. **Symmetry classification**: relevant state, counterpart, operation set, and gap statement.
3. **Hypotheses**: 2–4 hypotheses with evidence strength, key assumptions, predicted signatures, and failure modes.
4. **Validation design**: minimal viable validation, variables, controls, metrics, and stop conditions.
5. **Analysis plan**: baseline comparison, component decomposition, boundary and scaling checks, model comparison, and uncertainty treatment.
6. **Iteration plan**: hypothesis ledger update rules and next decisive tests.
7. **Validity and boundary statement**: confounders, reproducibility checks, regime limits, and non-operational safety constraints.
8. **Provenance log**: source-skill references and model or data lineage.

# Validation Gates

- **Symmetry validity**: Does the classification correctly distinguish the candidate from its transformed counterparts under the defined operation set?
- **Control validity**: Are positive, negative, alternative-class, boundary, and artifact controls sufficient to rule out competing mechanisms?
- **Reproducibility**: Are results consistent across independent samples, models, analysis pipelines, or orientations?
- **Mechanism specificity**: Do competing mechanisms make different predictions that the observables can resolve?
- **Statistical validity**: Are uncertainties, fit ranges, residuals, and decision thresholds pre-specified and reported?
- **Extrapolation validity**: Are conclusions limited to the tested regime, or are they being overgeneralized?

# Claim Boundaries

- Distinguish symmetry-allowed possibilities from empirically demonstrated effects.
- Separate established evidence from agent-inferred extensions.
- Do not treat single-study or single-system results as field-wide consensus.
- Avoid assigning labels solely because a result resembles a known class.
- State the boundary of validity for every mechanism claim (e.g., linear-response regime, specific dimensionality, clean limit).

# Failure Modes

- **Gap misframing**: The research question is too broad or not resolvable by symmetry analysis.
- **Hypothesis unfalsifiability**: Predictions are vague or lack discriminating observables.
- **Control failure**: Negative or alternative-class controls produce the target signature, indicating artifact or confounder dominance.
- **Boundary artifact**: Finite-size, geometry, disorder, or boundary effects dominate the intended bulk or intrinsic mechanism.
- **Overfitting**: Scaling laws or model fits are forced outside justified regimes.
- **Extrapolation error**: Claims extend beyond the validated similarity or regime boundary.
- **Global averaging trap**: Component-specific or local structure is hidden by full-system averages.

# Validity Checks

Before finalizing any plan or interpretation, verify:

- **Confounding factors**: disorder, defects, strain, finite-size effects, inhomogeneity, calibration bias, analysis leakage, heating, or protocol imperfections.
- **Local-versus-average ambiguity**: Are local and average descriptors being conflated?
- **Probe specificity**: Does each observable measure the intended descriptor?
- **Model dependence**: Are conclusions robust to alternative symmetry-consistent models?
- **Partition stability**: For component-resolved analyses, are labels physically motivated and stable under reasonable changes?
- **Consensus discipline**: Do not present one paper’s result as field-wide consensus.

# Provenance

- Derived from cluster `160.0` (symmetry-guided mechanism discovery and validation).
- Synthesized from source skills: `altermagnetism-research-pattern`, `superconductivity-anomalous-hall-exploration`, `correlated-oxide-cross-probe-exploration`, `gradient-defect-research-workflow`, `quantum-nonlinear-oscillator-synchronization-exploration`, `one-dimensional-quantum-gas-non-equilibrium-criticality`, `time-chirality-symmetry-exploration`, `fluid-keplerian-transport-agent`.
- Preserve provenance as references only; do not treat source conclusions as universal defaults.
