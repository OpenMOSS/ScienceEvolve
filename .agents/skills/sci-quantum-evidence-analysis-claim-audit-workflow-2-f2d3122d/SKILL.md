---
name: sci-quantum-evidence-analysis-claim-audit-workflow-2-f2d3122d
description: An end-to-end evidence analysis and claim audit workflow for proposing falsifiable hypotheses, designing controlled validations, and iteratively bounding mechanistic claims in quantum and condensed matter research.
scienceevolve-title: "Quantum materials and condensed matter · evidence analysis claim audit workflow 2"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents through a reusable research design cycle that transforms model-observation gaps into falsifiable hypotheses, validates them through minimal controlled experiments or simulations, and audits resulting claims against alternative explanations and inferential boundaries. This skill is abstracted from quantum phases, wave phenomena, superconducting and ferroelectric systems, and related fields, but contains no domain-specific operational protocols or material recipes.

## When to use

- When existing baseline models fail to explain observed anomalies in spectral, transport, structural, or dynamical data.
- When you need to generate competing mechanistic hypotheses and rank them by evidence strength rather than plausibility alone.
- When designing validation plans that require positive, negative, model, and strong controls to distinguish signal from artifact.
- When auditing whether a conclusion should be classified as verified, inferred, speculative, or unsupported.
- When iterating after an initial validation to update hypotheses, redesign controls, or bound claim scope.

## Inputs required

- Baseline model or theoretical framework with known assumptions and documented failure modes.
- Observational or experimental data, including quality metadata and known systematics.
- Target research question framed as a falsifiable mechanism statement.
- Reference systems or control conditions for baseline and alternative-mechanism comparisons.
- Constraints: safety and compliance boundaries, resource limits, reproducibility requirements, and acceptable uncertainty thresholds.

## Core Workflow

1. **Gap Framing and Question Formulation**
   - Identify the specific deviation between baseline prediction and observation.
   - Reframe the anomaly as a falsifiable mechanism question: "If mechanism X dominates, observable Y should vary with Z in direction W."
   - *Decision gate*: If the anomaly cannot be expressed as a falsifiable prediction, stop and reformulate.

2. **Evidence Mapping and Strength Annotation**
   - Catalog all evidence as **Verified** (reproducible observation or established theory), **Inferred** (model-consistent but untested in the target system), or **Speculative** (analogical or exploratory).
   - Identify inferential gaps between each evidence piece and the target claim.
   - *Decision gate*: If no verified evidence anchors the chain, downgrade all downstream claims to speculative.

3. **Hypothesis Generation with Failure Modes**
   - Generate at least three competing hypotheses: a target mechanism hypothesis, a null or baseline hypothesis, and at least one alternative mechanism or non-mechanistic hypothesis.
   - For each hypothesis, define: key mechanism, explicit predictions, critical assumptions, and at least three failure modes (model breakdown, observational artifact, confounding variable).
   - Assign evidence strength (High / Medium / Low) with justification; never treat a single source as domain consensus.

4. **Minimal Viable Validation Design**
   - Design the smallest experiment, simulation, or observation that can distinguish the top two hypotheses.
   - Specify independent variables, dependent variables, and control variables.
   - Include a positive control (known signal), a negative control (signal absent), a model control (baseline vs mechanism model), and a strong control (alternative mechanism variant).
   - Define quantitative evaluation metrics and pre-registered stopping conditions.

5. **Baseline-First Analysis and Contribution Decomposition**
   - Apply the simplest baseline model first; document where and how it fails.
   - Introduce the mechanism model only after baseline failure is established; check that improvement is localized to the target anomaly rather than global overfitting.
   - Decompose the total signal into distinct contributions (modes, regions, physical channels); avoid single-channel or single-peak attribution.
   - *Decision gate*: If the mechanism model requires more free parameters than the anomaly warrants without out-of-sample prediction, stop and simplify.

6. **Decision Gate Evaluation**
   - Compare results against pre-registered predictions:
     - **Support**: Predictions, controls, and repeats align.
     - **Partial Support**: Trend aligns but confounders or coverage gaps remain.
     - **Unsupported**: Key prediction fails or the negative control invalidates the signal.
     - **Undecidable**: Data quality or control power is insufficient.
   - *Decision gate*: If the outcome is Undecidable, do not proceed to claim formation; return to step 4 to improve measurement design.

7. **Iterative Update or Termination**
   - **If Supported**: Increase control rigor (cross-system, cross-method), narrow claim boundaries, and test a new discriminating prediction.
   - **If Partially Supported**: Refine hypothesis scope, split confounding factors, and design a follow-up validation targeting the weakest link.
   - **If Unsupported**: Reject or archive the hypothesis; revisit the evidence map for alternatives.
   - **If Termination Triggered**: Stop if the negative control replicates the target signal, key assumptions are violated, or safety and compliance boundaries are reached.

8. **Claim Auditing and Boundary Setting**
   - Classify each output claim as **Data fact**, **Analysis inference**, **Model interpretation**, or **Extrapolation**.
   - Explicitly state boundary conditions (scale, symmetry, temperature, statistical regime) beyond which claims must be downgraded.
   - Document all assumptions, excluded alternatives, and residual risks.

## Output Format

Each invocation must produce:

1. **Research Question**: One-sentence falsifiable mechanism question.
2. **Evidence Map**: Verified, inferred, and speculative evidence with inferential gaps noted.
3. **Hypotheses Table**: For each hypothesis—mechanism, evidence strength, key assumptions, predictions, and failure modes.
4. **Validation Design**: Minimal viable validation, variables, controls (positive / negative / model / strong), metrics, and stop conditions.
5. **Analysis Plan**: Baseline-first decomposition, model comparison rules, contribution separation, and conclusion grading criteria.
6. **Iteration Plan**: Actions for support, partial support, unsupported, and undecidable outcomes.
7. **Claim Boundary Statement**: Explicit scope, excluded alternatives, and downgrade rules for extrapolation.
8. **Confidence Statement**: Clear separation of data facts, inferences, and extrapolations.

## Validation Gates

- **Falsifiability Gate**: The research question must yield at least one observable that could disprove the target hypothesis.
- **Evidence Anchor Gate**: At least one verified evidence piece must connect to the target system; otherwise, claims remain speculative.
- **Control Discrimination Gate**: The validation design must include controls capable of distinguishing the target mechanism from baseline and at least one alternative.
- **Overfitting Gate**: Mechanism models must not introduce more free parameters than justified by out-of-sample or control predictions.
- **Reproducibility Gate**: Key conclusions must be stable across independent data subsets, analysis paths, or numerical settings.

## Claim Boundaries

- Claims are bounded to the verified parameter regime (scales, symmetries, temperatures, fields, statistical power) of the validation.
- Extrapolation to new systems, untested conditions, or different observables requires explicit re-validation and must be labeled as inference or speculation.
- Single-source results are never treated as domain consensus.
- Causal language is reserved for cases where structural, control, and dynamical evidence converge; correlation alone supports only associational claims.

## Failure Modes

- **Model Failure**: Baseline or mechanism model breaks down (non-physical solutions, instability, or failure to reproduce known limits).
- **Artifact Confounding**: Signal replicates in negative controls or is driven by calibration drift, background, geometry, numerical settings, or processing choices.
- **Undecidable Discrimination**: Candidate and alternative mechanisms produce indistinguishable predictions within current uncertainty.
- **Boundary Violation**: Conclusions are applied outside the validated regime without downgrade or re-validation.
- **Inference Inflation**: Speculative or inferred evidence is presented as verified fact.

## Validity Checks

- **Confounding Check**: List geometric, environmental, instrumental, numerical, and processing factors that could mimic the target signal.
- **Reproducibility Check**: Verify stability across independent samples, data segments, analysis pipelines, or code configurations.
- **Statistical Check**: Confirm adequate sample size, uncertainty propagation, multiple-comparison correction, and pre-registered thresholds.
- **Model Check**: Validate that baseline failures are reproducible and that mechanism improvements are not due to added flexibility alone.
- **Boundary Check**: Ensure all conclusions specify applicable regimes and that extrapolations are explicitly flagged.
- **External Consistency Check**: Compare with independent constraints; note contradictions rather than suppressing them.

## Provenance

- Synthesized from cluster 117.0 ("quantum-phase-wave-superconducting-evidence-analysis-workflow").
- Source skills: nonlocal-plasmon-eels-workflow, dielectric-haloscope-axion-search, spin-nematic-quadrupole-wave-research, rare-isotope-beta-decay-workflow, confined-magnon-exploration, high-entropy-ferroelectric-multiscale-exploration, qcd-phase-transition-ccsn-gw-exploration, antiferromagnet-spin-orbit-torque-exploration.
- All domain-specific systems, materials, parameters, and paper conclusions have been removed; only the shared workflow structure is retained.
