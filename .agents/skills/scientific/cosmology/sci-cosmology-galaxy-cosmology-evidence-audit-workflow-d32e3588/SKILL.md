---
name: sci-cosmology-galaxy-cosmology-evidence-audit-workflow-d32e3588
description: An end-to-end evidence analysis and claim audit workflow for astrophysics and cosmology research, guiding the decomposition of complex systems into testable hypotheses, controlled validation, and iterative claim bounding across simulations, observations, and multi-probe inferences.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cosmology evidence audit workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Guide agents through a reusable, end-to-end route for auditing scientific claims in galaxy, cosmology, and dark-matter research. The workflow translates complex physical systems into decomposed hypotheses, enforces controlled validation with hierarchical controls, and iteratively bounds conclusions until they are either supported by evidence or explicitly marked as extrapolation.

## When to use

- When investigating multi-component physical systems where signals must be separated from systematics.
- When comparing theoretical models, simulations, or machine-learning inferences against observations.
- When rare events, weak signals, or small-scale structures require cross-validation across multiple probes or tracers.
- When assessing whether a published method or result can be migrated to a new physical regime, dataset, or parameter space.
- When the task requires generating new research questions and experimental designs rather than summarizing existing conclusions.

## Inputs required

- Target physical system and its known or hypothesized components.
- Observable features, proxy quantities, or statistical summaries available from data or simulations.
- Baseline models or null hypotheses for comparison.
- Known error sources, selection effects, resolution limits, and data-quality constraints.
- Precision goals, acceptable systematic budgets, and stopping criteria.

## Core Workflow

1. **System Decomposition & Gap Definition**
   - Decompose the total observable into constituent contributions and cross-terms.
   - Identify the evidence gap: what is unexplained, untested, or contested.
   - Define the linear, transition, and non-linear (or equivalent) regimes relevant to the problem.
   - **Decision Gate 1**: Stop if the gap cannot be framed as a falsifiable comparison between at least one baseline and one alternative.

2. **Hypothesis Generation & Evidence Grading**
   - Formulate mechanistic hypotheses that map physical processes to observable signatures.
   - For each hypothesis, specify: mechanism statement, key assumptions, predicted signal, and failure modes.
   - Grade evidence strength (Strong / Moderate / Weak / Speculative) based on prior independent validation, not analogy.
   - **Decision Gate 2**: Downgrade or discard hypotheses that rely on single metrics, unverified extrapolations, or uncleaned samples.

3. **Minimal Viable Validation Design**
   - Select the smallest set of statistics, scales, or sample windows that can distinguish the leading hypothesis from the baseline.
   - Define hierarchical controls:
     - **Baseline control**: standard model or null effect.
     - **Strong control**: identical background with one altered mechanism or modeling choice.
     - **Negative control**: regime where the target signal should be absent or scrambled.
     - **Positive control**: regime where the target signal is known to exist.
   - Specify variables, evaluation metrics, and pre-registered failure criteria.
   - **Stop Condition A**: Halt if negative controls produce false positives or positive controls fail.

4. **Execution with Artifact & Systematic Diagnosis**
   - Perform data preparation, component separation, or feature extraction with full provenance logging.
   - Run artifact diagnosis before physical interpretation (e.g., resolution tests, selection-function checks, cross-resolution matching).
   - Quantify uncertainties from statistical noise, sample variance, model covariance, and mapping assumptions separately.
   - **Decision Gate 3**: If systematic residuals exceed the target budget or artifacts dominate the signal, pause interpretation and return to step 3 to refine controls.

5. **Model Comparison & Cross-Validation**
   - Compare baseline and alternative models within the same coordinate frame and uncertainty budget.
   - Use at least two independent diagnostic families (e.g., abundance plus spatial distribution, or morphology plus internal structure) to cross-validate any claimed mechanism.
   - Conduct sensitivity analyses by varying definitions, thresholds, smoothing scales, or noise realizations.
   - **Decision Gate 4**: If results are sensitive to arbitrary choices, label conclusions as definition-sensitive and stop generalization.

6. **Iteration & Update**
   - Attribute deviations to physical omission, definition inconsistency, statistical fluctuation, numerical artifact, or model mis-specification.
   - Update hypotheses: strengthen if supported by multiple independent metrics and controls; weaken or replace if contradicted.
   - Expand validation only after the minimal viable test passes; otherwise, narrow the scope.
   - **Stop Condition B**: Stop when residuals stabilize below target precision, controls agree, and extrapolation boundaries are explicitly mapped; or when the signal remains below the noise floor after two refinement cycles.

7. **Claim Audit & Extrapolation Bounding**
   - Classify every output claim as:
     - Observationally supported (current data plus valid controls).
     - Model-supported inference (simulation or theory consistent but not independently observed).
     - Extrapolation or speculation (beyond tested range).
   - Document boundary conditions: applicable scales, redshifts, mass ranges, selection limits, and model versions.
   - **Decision Gate 5**: Reject any claim presented as domain consensus if it derives from a single study, single simulation suite, or unvalidated proxy mapping.

## Output Format

1. **Research question and evidence gap statement.**
2. **Decomposition map**: components, cross-terms, and regime boundaries.
3. **Hypothesis table**: mechanism, evidence grade, key assumptions, failure modes, minimal validation.
4. **Validation design**: controls, variables, metrics, failure criteria, and stop conditions.
5. **Analysis log**: artifact diagnosis, systematic budget, uncertainty propagation, and sensitivity results.
6. **Iteration record**: updates to hypotheses, model changes, and control outcomes.
7. **Audited claim summary**: supported inferences, bounded extrapolations, and excluded mechanisms.
8. **Next-step recommendations**: additional data, alternative probes, or required robustness tests.

## Validation Gates

- **Gate 1: Falsifiability** — the problem must be reducible to a comparison between explicit baseline and alternative predictions.
- **Gate 2: Hypothesis cleanliness** — no hypothesis may rest solely on single-proxy, single-scale, or single-model evidence.
- **Gate 3: Systematic budget** — interpretation proceeds only if known systematics are quantified and do not dominate the target signal.
- **Gate 4: Cross-validation** — mechanistic claims require agreement across at least two independent diagnostic families.
- **Gate 5: Consensus check** — conclusions from single sources are labeled as study-specific and not generalized without independent replication.

## Claim Boundaries

- Distinguish "directly supported by current data and controls" from "consistent with model extrapolation" and "untested speculation."
- State the exact parameter, scale, redshift, and sample-selection boundaries beyond which the claim is unverified.
- Flag proxy-to-physical mappings that have not been independently calibrated in the target regime.
- Do not present simulation-only or single-survey results as observational facts or field consensus.

## Failure Modes

- **False positive**: negative controls yield apparent signal due to artifacts, selection bias, or overfitting.
- **False negative**: positive controls fail because of insufficient resolution, incorrect mapping, or masked systematics.
- **Definition sensitivity**: conclusions reverse when thresholds, smoothing scales, or identification criteria change.
- **Extrapolation collapse**: model performs only within the training or calibration interval and fails at boundaries.
- **Confounding dominance**: an unmodeled component (e.g., baryonic physics, environment, or selection function) explains the observed deviation.
- **Circular reasoning**: using the same data to both generate and test a hypothesis without independent validation.

## Validity Checks

- **Confounding audit**: assess whether cosmology, environment, redshift, mass, selection function, or noise could mimic the target signal.
- **Reproducibility**: document data versions, random seeds, selection rules, processing scripts, and model configurations.
- **Statistical validity**: ensure uncertainty estimates cover sample variance, covariance, and systematic error; avoid interpreting noise-dominated regimes.
- **Definition consistency**: verify that mass, bias, proxy, and normalization definitions are uniform across the analysis chain.
- **Boundary respect**: confirm that inference stays inside the validated scale, parameter, and redshift windows.
- **Negative-result handling**: if no signal is detected, report sensitivity limits and check whether absence of evidence has been confused with evidence of absence.

## Provenance

- Methodology synthesized from cluster 14.0 (galaxy-cosmology-cluster-dark-evidence-analysis-workflow archetype).
- Source skill references: cosmology-neutrino-lss-exploration; multi-probe-astronomy-survey-exploration; strong-lensing-research-pattern; astronomy-cluster-ml-cosmology-workflow; galaxy-cluster-formation-modeling; cosmology-free-streaming-research-design; warm-dark-matter-research-explorer; high-redshift-galaxy-clump-research-workflow.
- No paper-specific conclusions, numerical results, or operational protocols are reproduced.
