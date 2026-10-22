---
name: sci-cosmology-galaxy-matter-cosmological-feedback-evide-072a023e
description: A reusable end-to-end workflow for generating falsifiable hypotheses, designing multi-source evidence analysis, and auditing astrophysical claims across scales from halos to cosmological feedback.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy matter cosmological feedback evidence analysis workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Help an agent transform open questions in astrophysics and cosmology into structured, auditable research workflows. The skill focuses on mechanism discrimination, multi-evidence triangulation, and explicit claim bounding rather than reproducing specific study conclusions or operational procedures.

## When to use

- The user needs to propose new research questions or falsifiable hypotheses about galaxy formation, matter distribution, cosmological evolution, or feedback processes.
- The task involves comparing competing mechanisms using simulation, observation, catalog, or multimessenger data.
- The user needs to design controls (positive, negative, strong), define stop conditions, and bound inference validity before drawing conclusions.
- The goal is to migrate methodological patterns from one astrophysical system to another (for example, from halo substructure to heliospheric shocks or from cluster shocks to cosmological filaments).
- Do not use for operational instrument commands, hazardous procedures, reproducing exact numerical results from a single paper, or generating executable engineering parameters.

## Inputs required

- **Research tension or anomaly**: A clear statement of the gap between observation and the baseline model, or between two observables that should be consistent.
- **Baseline model and competing mechanisms**: At least one baseline explanation and two or more alternative mechanisms that could resolve the tension.
- **Available data assets**: Catalogs, simulation snapshots, images, spectra, time-series, particle distributions, or model outputs, including their scale, resolution, and known systematics.
- **System description**: Physical scale range, environment type, selection function, coordinate framework, and known contaminants or data gaps.
- **Success criteria**: Pre-defined outcomes that would support, weaken, or falsify each candidate mechanism.

## Core Workflow

Execute the following steps in order. At each decision gate, pause, evaluate, and only proceed if the gate passes; otherwise, follow the prescribed stop or iterate action.

### 1. Tension Formalization
Convert the open question into a falsifiable proposition of the form: *If mechanism M holds, then observable O should deviate from baseline B under conditions C, and this deviation cannot be explained by confound X.*
- **Gap analysis**: Identify why the baseline model is insufficient and whether the gap arises from data quality, model simplification, or genuine new physics.
- **Decision gate (G1)**: Is the tension well-posed, non-trivial, and addressable with available or obtainable data?
  - *No*: Stop. Reformulate the question or request additional constraints.
  - *Yes*: Proceed to hypothesis generation.

### 2. Mechanism Hypothesis Generation
Generate at least two competing mechanisms. For each mechanism, produce:
- **Mechanism chain**: A causal chain from hidden variable to intermediate process to observable signature.
- **Observable predictions**: Quantitative or qualitative differences expected in data.
- **Evidence strength**: High / Medium / Low / Exploratory, with justification.
- **Key assumptions**: Physical conditions required for the mechanism to operate.
- **Failure modes**: Specific ways the mechanism could be wrong or indistinguishable from alternatives.
- **Decision gate (G2)**: Do the hypotheses produce mutually distinguishable predictions with the available data?
  - *No*: Refine discriminators (add observables, change scale, or seek multi-channel signatures) or stop and flag degeneracy.
  - *Yes*: Proceed to evidence mapping.

### 3. Evidence Mapping & Audit
Catalog all relevant evidence and classify each item as **verified**, **inferred**, or **untested**.
- Identify hidden variables, proxy quantities, and information-loss points (for example, projection, propagation, or selection effects).
- Map each mechanism to the evidence required to support or reject it.
- **Decision gate (G3)**: Is the evidence sufficient to discriminate the mechanisms after accounting for gaps?
  - *No*: Flag critical gaps and pause for data acquisition or downgrade to exploratory.
  - *Yes*: Proceed to experimental design.

### 4. Experimental or Observational Design
Define the study architecture:
- **Variables**: Independent (scale, environment, time), dependent (target observable), model (coupling form, efficiency), and confounding (selection, calibration, geometry).
- **Controls**:
  - *Baseline control*: Standard model without the new mechanism.
  - *Positive control*: A scenario or synthetic dataset where the mechanism should produce a known signal.
  - *Negative control*: A scenario where the mechanism should be absent, testing for false positives.
  - *Strong control*: Independent dataset, geometry, or algorithm that cross-checks the primary result.
- **Evaluation metrics**: Discriminative power, multi-signal consistency, robustness to threshold or parameter changes, reproducibility, and physical interpretability.
- **Stop conditions**: Define when to halt the current design; for example, all mechanisms are excluded by observation, mechanisms remain indistinguishable after adding complexity, or new assumptions violate known constraints.
- **Decision gate (G4)**: Are the controls independent, feasible, and capable of breaking degeneracies?
  - *No*: Redesign controls or downgrade the claim scope.
  - *Yes*: Proceed to analysis.

### 5. Analysis Pipeline Execution
Run the analysis in stratified stages:
1. **Data preparation**: Harmonize coordinate systems, units, time stamps, versions, and quality masks. Document selection functions and known artifacts.
2. **Quality control**: Flag noise, calibration drift, missing data, and instrument limits. If critical variables fail quality checks, stop and request remediation.
3. **Event or structure identification**: Detect candidate regions, events, or substructures using predefined rules. Record selection criteria to avoid cherry-picking.
4. **Mechanism-stratified analysis**: Separate contributions by candidate mechanism rather than averaging them into an uninterpretable mean.
5. **Multi-metric comparison**: Compare not only totals but also spatial distributions, spectral shapes, temporal evolution, and statistical distributions.
6. **Uncertainty quantification**: Propagate measurement errors, model systematics, and theoretical uncertainties. Report parameter degeneracies.
- **Decision gate (G5)**: Does the analysis pass internal consistency and quality checks?
  - *No*: Halt, diagnose pipeline failures, and return to step 4 or 2.
  - *Yes*: Proceed to inference.

### 6. Inference & Claim Grading
Grade each mechanism against the evidence:
- **Supported**: Target signal persists, conflicting signals diminish, and alternatives cannot equally explain the data.
- **Partially supported**: Explains one signal but conflicts with another, or mechanism degeneracy remains.
- **Not supported**: Key prediction fails or conflicting signal is not mitigated.
- **Indeterminate**: Data are insufficient to adjudicate.
- Explicitly separate *verified patterns* (reproduced across independent samples) from *new inferences* (agent-generated hypotheses for this specific problem).
- **Decision gate (G6)**: Does the evidence meet the pre-defined success criteria without violating negative controls?
  - *No*: Proceed to iteration.
  - *Yes*: Proceed to claim packaging.

### 7. Iteration & Convergence Check
Update the hypothesis portfolio based on outcomes:
- **If supported but weak**: Add independent constraints or orthogonal observables; check for hidden confounders before adding model complexity.
- **If partially supported**: Introduce stronger discriminators or second observables; avoid overfitting a single metric.
- **If not supported**: Check confounders, calibration, and selection effects first. If robust, reformulate the mechanism or return to tension formalization.
- **If indeterminate**: Reduce scope to a narrower, testable sub-question or acquire higher-fidelity data.
- **Stop conditions**: End iteration when (a) all candidate mechanisms are excluded, (b) candidates cannot be distinguished and no new discriminator exists, (c) added model complexity yields no explanatory gain, or (d) key physical assumptions are violated.

### 8. Claim Boundary & Output Packaging
Document the final state:
- State applicability boundaries (scale, environment, redshift, resolution, physics approximations).
- List extrapolation limits and residual risks.
- Package all deliverables into the Output Format below.

## Output Format

Produce the following structured deliverables:

1. **Research Question** — One-sentence falsifiable statement and the origin of the tension (gap, anomaly, or theoretical conflict).
2. **Evidence Map** — Tabulated evidence classified as verified, inferred, or untested, with provenance and known gaps.
3. **Ranked Candidate Hypotheses** — Table columns: mechanism, observable prediction, evidence strength, key assumptions, failure modes.
4. **Experimental Design** — Variables, baseline/positive/negative/strong controls, evaluation metrics, and stop conditions.
5. **Analysis Plan** — Pipeline steps, quality gates, stratification method, and uncertainty propagation strategy.
6. **Validation & Boundary Notes** — Confounders, reproducibility requirements, statistical validity checks, and extrapolation limits.
7. **Iteration Rules** — Update strategy for each outcome class (supported, partial, unsupported, indeterminate).
8. **Failure Mode Register** — Documented risks, mitigations applied, and residual uncertainties.

## Validation Gates

Before any claim is finalized, the following gates must be satisfied:

- **Confounder audit**: Enumerate and control for selection effects, projection effects, propagation losses, calibration drift, background contamination, and geometric degeneracies.
- **Reproducibility audit**: Ensure data versions, processing scripts, thresholds, coordinate transformations, random seeds, and algorithm parameters are documented and traceable.
- **Statistical validity**: Account for sample covariance, non-independent repeated sampling, selection functions, multiple comparisons, and threshold sensitivity.
- **Mechanism uniqueness**: Actively compare alternatives; do not confirm a mechanism solely by rejecting the baseline.
- **Boundary check**: Confirm that conclusions do not exceed the scale, environment, resolution, or data quality of the inputs.

## Claim Boundaries

- Distinguish **verified statistical candidates**, **physical candidates requiring additional data**, and **exploratory inferences**.
- Single-system, single-snapshot, or single-model-family results constitute feasibility evidence only; they cannot be treated as domain consensus.
- Model fit success indicates preference, not proof of mechanism uniqueness.
- Absence of a predicted signal is only meaningful if the analysis sensitivity has been quantified and reported.
- Cross-scale extrapolation (for example, from simulation to observation, from one halo to a population, or from one wavelength to another) requires independent justification and must be explicitly flagged.

## Failure Modes

| Failure Mode | Description | Mitigation |
|---|---|---|
| **Hypothesis degeneracy** | Competing mechanisms produce indistinguishable observables. | Seek geometry-sensitive, time-dependent, or multi-wavelength discriminators; report preference rather than proof. |
| **Confounding dominance** | Systematic errors or selection effects mimic mechanism signals. | Deploy negative controls, synthetic injection tests, and blind analysis protocols. |
| **Overfitting to single metric** | Mechanism explains one observable but fails consistency with others. | Require multi-signal consistency before upgrading evidence strength. |
| **Premature extrapolation** | Conclusions applied beyond validated scale or environment. | State explicit boundary conditions and require out-of-sample tests. |
| **Algorithmic artifact** | Detection, clustering, or model bias creates spurious candidates. | Cross-check with independent algorithms, sweep parameters, and run null-field tests. |
| **Assumption violation** | Key physical assumptions (for example, equilibrium, symmetry, smoothness) fail in the target regime. | State assumptions explicitly and validate with independent diagnostics or synthetic data. |

## Validity Checks

Use this checklist before finalizing any claim:

- [ ] All major confounders have been enumerated and controlled.
- [ ] Reproducibility artifacts (data versions, scripts, thresholds, seeds) are documented.
- [ ] Statistical tests account for sample covariance, selection function, and multiple comparisons.
- [ ] Mechanism alternatives have been actively compared; the baseline is not the only rejected option.
- [ ] Boundary conditions (scale, redshift, resolution, physics approximations) are stated.
- [ ] Evidence strength has been calibrated against positive controls or synthetic data.
- [ ] Negative controls pass (no false positives under the null).
- [ ] The uncertainty budget includes measurement, systematic, and theoretical components.

## Provenance

- Methodological synthesis derived from cluster **30.0** (galaxy-matter-cosmological-feedback-evidence-analysis-workflow).
- Source skill references: `galaxy-cluster-shock-obliquity-research`, `near-sun-heliophysics-research-planning`, `stellar-halo-hierarchical-exploration`, `heliophysics-source-connectivity-exploration`, `modified-gravity-curvature-matter-research-skill`, `multimessenger-neutron-star-eos-exploration`, `early-galaxy-hi-reservoir-workflow`, `cosmological-substructure-exploration`.
- No specific paper conclusions, numerical parameters, instrument recipes, or operational protocols are inherited.
