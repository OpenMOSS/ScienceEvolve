---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-dcf01cbc
description: A reusable end-to-end workflow for generating competing hypotheses, designing symmetry-aware validation studies, and iteratively discriminating microscopic mechanisms in quantum, magnetic, and interfacial systems without relying on source-specific parameters or operational protocols.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 69"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to turn ambiguous observations, anomalous responses, or competing order parameters into structured mechanism-discovery programs. The workflow extracts a reusable logic: define competing symmetry-aware hypotheses, map each to selective observable fingerprints, validate through controlled contrasts and counterfactual checks, and iterate until claims are bounded by evidence.

## When to use

Use this skill when:

- A system exhibits an anomalous dynamic or static feature near a phase boundary, symmetry-breaking point, or competing-order regime.
- Multiple microscopic mechanisms could explain the same observable, and they differ in symmetry class, coupling pathway, or selection rules.
- The user needs research-question generation, non-operational experimental design, or analysis planning for quantum materials, spin systems, photonic interfaces, or correlated phases.
- The goal is to discriminate mechanisms rather than reproduce a known result or summarize literature.

Do not use for clinical advice, executable laboratory protocols, materials synthesis recipes, or purely descriptive literature summaries.

## Inputs required

Before producing a research plan, collect or infer:

- **Target system class** and the unresolved structural, dynamical, or order-parameter question.
- **Candidate mechanisms or models** that differ in symmetry, coupling topology, or predicted fingerprint.
- **Available observables** and their known symmetry selectivity or conservation-rule sensitivity.
- **Tuning variables** that can toggle, weaken, or rotate the target phenomenon.
- **Baseline models** and known confounders.
- **Safety and compliance constraints** relevant to the platform.

## Core Workflow

### 1. Anomaly Framing & Hypothesis Generation
- Define the anomaly as a departure from an established baseline model, not as an isolated curiosity.
- Generate at least three competing hypotheses: a target mechanism, a baseline-model omission, and an artifact or independent source.
- Map each hypothesis to a symmetry class, selection rule, order-parameter component, or conservation-law channel.
- Label evidence strength (strong / moderate / weak / speculative), state key assumptions, and list plausible failure modes.
- **Decision gate — Candidate gate:** If fewer than two competing mechanisms can be articulated and distinguished in principle, stop and request additional domain input.

### 2. Fingerprint & Selection-Rule Mapping
- For each hypothesis, derive predicted observable fingerprints using symmetry arguments, selection rules, or coupling topology.
- Identify a selective observable or measurement channel that preferentially reports the disputed variable.
- Define selection-rule controls to verify the observable’s symmetry sensitivity.
- **Decision gate — Observable gate:** If no observable can distinguish the candidate set, redesign the measurement strategy before proceeding.

### 3. Minimal Viable Validation Design
- Design the smallest experiment or calculation that can falsify the leading hypothesis.
- Define independent variables (tuning dimensions), dependent variables (fingerprints), and covariates.
- Specify controls: inactive-regime, active-regime, positive, negative, symmetry, and counterfactual / ablation controls.
- State stop conditions: controls fail, parameters are unidentifiable, residuals are systematic, or safety constraints are violated.
- **Decision gate — Safety gate:** If the design requires unsafe or unsupported operational details, abstract it further or stop.

### 4. Execution & Baseline Separation
- Collect data under matched history or initialization conditions.
- Separate baseline behavior from anomalous-regime behavior before model fitting.
- Document calibration, normalization, and history conditions.
- **Decision gate — Reproducibility gate:** If baseline reproducibility fails or history conditions are incompatible across measurements, halt and diagnose.

### 5. Mechanism Discrimination Analysis
- Apply the pre-registered selection-rule filter to all candidates equally.
- Compare observed fingerprints with predicted fingerprints using both positive matches and explicit mismatches.
- Fit competing models (target, baseline, artifact) and quantify improvement with transparent metrics.
- Propagate uncertainty and inspect residuals for systematic deviations.
- **Decision gate — Residual gate:** If the best model depends on a single weak feature, unvalidated assumption, or ad hoc parameter adjustment, downgrade the evidence and return to Step 3.

### 6. Robustness & Counterfactual Audit
- Test necessity of the proposed mechanism via ablation, counterfactual, or symmetry-breaking controls.
- Check consistency across tuning dimensions, independent preparations, or alternative representations.
- Verify that negative controls remain negative and positive controls remain positive.
- **Decision gate — Control gate:** If a negative control produces the target signature, reject the hypothesis and return to Step 1.

### 7. Iteration & Claim Bounding
- Rank surviving hypotheses by explanatory breadth, control coverage, and robustness.
- Update evidence labels and boundary conditions.
- Decide the next action:
  - **If** co-variation and controls are strong → propose broader validation or a new tuning dimension.
  - **If** ambiguous → add a discriminating variable or cross-check (return to Step 3).
  - **If** contradicted → abandon the hypothesis and generate an alternative (return to Step 1).
- **Stop condition:** Halt when the leading hypothesis predicts all tested regimes, survives controls, has explicit boundary conditions, and no simpler explanation remains.

## Output Format

When using this skill, produce:

1. **Research question** — concise statement of the anomaly and why mechanism resolution matters.
2. **Hypothesis portfolio** — table with mechanism, evidence strength, symmetry class, predicted fingerprint, key assumptions, and failure modes.
3. **Validation design** — minimal viable study with variables, controls, metrics, and stop conditions.
4. **Analysis plan** — feature extraction, model comparison, uncertainty propagation, and residual checks.
5. **Iteration roadmap** — decision rules for strengthening, revising, or rejecting each hypothesis.
6. **Validity and boundary statement** — confounders, reproducibility requirements, claim limits, and safety constraints.

## Validation Gates

- **Candidate gate:** At least two competing mechanisms must be articulable and distinguishable in principle.
- **Observable gate:** A selective observable or symmetry filter must exist for the candidate set.
- **Control gate:** All designs must include positive, negative, and counterfactual controls.
- **Reproducibility gate:** Baseline behavior must be repeatable under matched conditions.
- **Residual gate:** Systematic residuals must trigger model extension or redesign, not ad hoc fitting.
- **Safety gate:** Designs must remain at the research-planning level; unsafe operational details trigger abstraction or stop.

## Claim Boundaries

- Distinguish paper-supported evidence, agent-inferred hypotheses, and extrapolated claims.
- Limit conclusions to the tested platform, tuning range, and observable class.
- Do not treat single-system results as field-wide consensus.
- Separate measured features from inferred assignments.
- State where the mechanism should fail (e.g., weak coupling, strong noise, symmetry-forbidden regimes, or uncontrolled drift).

## Failure Modes

- **Hypothesis failure:** The proposed mechanism is absent in negative controls or contradicted by counterfactual tests.
- **Artifact failure:** Instrument drift, calibration bias, history effects, or confounding variables mimic the target signature.
- **Model failure:** Baseline model omission or overfitting explains the anomaly without a new mechanism.
- **Leakage failure:** Uncontrolled degrees of freedom (e.g., multimode mixing, spatial gradients, decoherence channels) dominate the signal.
- **Design failure:** Controls are insufficient, parameters are unidentifiable, or the observable lacks selectivity.
- **Extrapolation failure:** Claims are extended beyond the validated tuning range or system class.

## Validity Checks

- **Confounding:** Are preparation, geometry, detection, or environment unintentionally biased? Are disorder, drift, or heterogeneity independently characterized?
- **Causal isolation:** Does each contrast vary only the intended factor while others are monitored?
- **Model validity:** Are background assumptions appropriate for the measurement regime? Are fitted parameters constrained by data rather than interchangeable?
- **Statistical validity:** Is uncertainty propagated? Are simpler null models rejected before accepting complex mechanisms?
- **Reproducibility:** Are results consistent across repeated runs, independent preparations, and alternative analysis pipelines?
- **Boundary conditions:** Are claims limited to the tested regime? Are missing predicted features explained by sensitivity limits rather than used to reject models decisively?

## Provenance

- Synthesized from cluster 153.0 (symmetry-guided mechanism discovery and validation).
- Source skill references: `non-hermitian-atom-light-research`, `correlated-materials-transition-inversion-workflow`, `oam-cv-entanglement-research-workflow`, `stochastic-polarization-symmetry-breaking-research`, `condensed-matter-symmetry-fingerprint-research`, `surface-force-research-design`, `hysteretic-magnetic-response-exploration`, `multilevel-spin-subspace-exploration`.
- Representative workflow stages: hypothesis_generation, data_analysis, iteration_or_redesign, mechanism_discrimination, study_design, uncertainty_audit.
