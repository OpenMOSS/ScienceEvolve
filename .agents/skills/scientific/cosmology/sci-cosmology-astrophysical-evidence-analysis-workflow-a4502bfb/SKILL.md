---
name: sci-cosmology-astrophysical-evidence-analysis-workflow-a4502bfb
description: End-to-end evidence analysis and claim audit workflow for astrophysical and cosmological research, from hypothesis generation through multi-diagnostic validation to iterative claim bounding.
scienceevolve-title: "Galaxy, cosmology, and simulations · astrophysical evidence analysis workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Transform anomalies, weak signals, or hidden physical processes in astrophysical and cosmological systems into structured, testable research workflows. This skill guides the generation of competing hypotheses, the design of controlled validation strategies, and the iterative bounding of scientific claims through multi-evidence cross-validation—without reproducing single-study conclusions as domain consensus.

# When to use

- When investigating hidden, transient, or high-redshift processes that must be inferred indirectly from multi-scale observations, simulations, or synthetic diagnostics.
- When apparent scaling relations, alignment trends, gas-accretion signatures, or weak statistical signals require mechanistic explanation beyond descriptive fitting.
- When comparing competing theoretical models, simulation frameworks, or observational proxies in galaxy formation, cosmology, or related fields.
- When auditing whether a claim from a specific study generalizes across different samples, selection functions, redshifts, mass scales, or physical models.
- When designing studies that must separate physical evolution from selection effects, projection effects, foreground/background contamination, or systematic errors.

# Inputs required

- **Research target**: The hidden process, anomalous relation, or unobserved mechanism to be inferred or audited.
- **Data and models**: Observational catalogs, simulation snapshots, mock data, semi-empirical models, or theoretical frameworks, each with documented selection functions and known limitations.
- **Observable diagnostics**: Candidate proxies, statistical fields, structural properties, line diagnostics, or scaling relations that bridge hidden states to measurements.
- **Baseline and control resources**: Baseline (null) models, alternative mechanism models, randomized baselines, and known positive/negative control systems or samples.
- **Constraints**: Sample definitions, redshift/mass/scale ranges, resolution limits, calibration assumptions, data licenses, computational boundaries, and applicable safety/ethics policies.

# Core Workflow

1. **Anchor and Gap Definition**
   - Frame the research question around an anomaly, residual signal, or hidden process.
   - Establish a baseline or anchor relation/model that is less sensitive to the unknown mechanism.
   - *Decision gate*: If no credible anchor exists, stop and acquire foundational constraints before proceeding.

2. **Hypothesis Generation and Ranking**
   - Derive competing mechanisms with distinct observable predictions across multiple diagnostics.
   - For each hypothesis, specify: physical motivation, predicted direction in observables, key assumptions, and explicit failure modes.
   - Rank by evidence strength (strong / medium / weak) based on prior independent support and distinguishability.
   - *Decision gate*: If hypotheses lack falsifiable predictions or are observationally degenerate, return to Step 1 to refine the question or seek better diagnostics.

3. **Controlled Experimental Design**
   - Define target and control samples with explicit selection functions and proxy definitions.
   - Taxonomize variables: independent drivers, intermediate state variables, dependent observables, and confounders.
   - Institute controls:
     - **Positive control**: benchmark known to produce the target signal, confirming pipeline sensitivity.
     - **Negative control**: benchmark expected to lack the signal, detecting spurious trends or leakage.
     - **Strong control**: identical protocol applied to alternative data realizations or model variants to isolate the target mechanism from methodological artifacts.
   - Specify a **minimal viable validation**: the smallest test capable of discriminating the target hypothesis from the null.
   - Define **stopping conditions**: positive control fails; negative control shows signal; selection function is unrecoverable; mechanisms cannot be distinguished; results are numerically unstable or physically implausible.

4. **Multi-Diagnostic Execution**
   - Preprocess data with documented selection-function cuts, matching rules, coordinate definitions, and missing-data handling.
   - When using simulations, apply physical post-processing to generate synthetic observables under the same selection logic as real data.
   - Decompose total signals by structure, phase, or contributing mechanism to avoid attributing mixed signals to a single cause.
   - Evaluate multiple independent diagnostics simultaneously (e.g., spatial, kinematic, chemical, statistical, scaling).
   - Propagate all uncertainties: statistical, systematic, model-structural, and sample-variance.
   - *Decision gate*: If independent diagnostics contradict one another or systematics dominate the signal, halt interpretation and launch confounder diagnosis.

5. **Model Calibration and Claim Bounding**
   - Compare observed diagnostics against baseline and perturbed model predictions using the same measurement pipeline.
   - Perform cross-validation, out-of-sample tests, or independent-sample replication.
   - Grade each conclusion:
     - **Verified**: supported by multiple independent diagnostics and robust controls.
     - **Partially supported**: main diagnostic agrees, but secondary checks are incomplete.
     - **Compatible**: consistent with data, but not uniquely distinguished from alternatives.
     - **Tension**: conflicts with one or more diagnostics without full exclusion.
     - **Excluded**: multiple independent diagnostics consistently conflict.
     - **Insufficient data**: current precision or coverage cannot adjudicate.
   - *Decision gate*: If a conclusion rests on a single diagnostic or narrow parameter window, downgrade its evidence strength and mandate replication before generalization.

6. **Iteration or Termination**
   - Update the evidence matrix for each hypothesis: supporting data, refuting data, residual confounders, and boundary conditions.
   - *If* a mechanism is uniquely supported: extend to new regimes or tighten parameter constraints.
   - *If* results are ambiguous: add distinguishing diagnostics, refine sample definitions, or integrate independent data sources.
   - *If* results contradict predictions or controls fail: revisit the anchor relation, check for missing physics or selection effects, or retire the hypothesis.
   - *Stop*: Terminate when stopping conditions are met, when the evidence matrix stabilizes across iterations, or when required resources exceed the bounds of minimal viable validation.

# Output Format

Produce a structured evidence-analysis report containing:

1. **Research question and gap statement**: the anomaly or hidden process and why it matters.
2. **Evidence map**: verified facts, agent inferences, and key unknowns.
3. **Hypothesis cards**: for each candidate, list mechanism, observable predictions, evidence strength, key assumptions, and failure modes.
4. **Experimental design**: samples, variable taxonomy, positive/negative/strong controls, minimal viable validation, and stopping conditions.
5. **Analysis plan**: preprocessing, synthetic-observable generation, signal decomposition, multi-diagnostic comparison, and uncertainty propagation.
6. **Iteration plan**: triggers for continuation, modification, or termination.
7. **Validity and ethics checklist**: confounders, reproducibility requirements, boundary conditions, and data-compliance constraints.
8. **Confidence summary**: graded evidence with clear separation of verified content, model-dependent inference, and speculative extensions.

# Validation Gates

- **Anchor reliability**: The baseline relation or model must be independent of the anomaly being tested.
- **Falsifiability**: Every hypothesis must have a defined observational failure condition.
- **Control integrity**: Positive controls must recover expected signals; negative controls must remain consistent with null expectations.
- **Diagnostic independence**: Multiple diagnostics must probe distinct physical properties rather than the same underlying quantity.
- **Selection-function transparency**: Sample construction, cuts, and completeness must be explicitly documented and propagated.
- **Cross-source consistency**: Trends must be checked across observations, simulations, and alternative theoretical frameworks before elevation to strong evidence.

# Claim Boundaries

- Distinguish statistical prediction from causal mechanism.
- Distinguish model-dependent inference from observationally verified fact.
- Distinguish sample-specific findings from generalizable claims.
- Mark extrapolations beyond tested redshift, mass, scale, environment, or observational-depth regimes as provisional.
- Do not present single-study, single-simulation, or single-survey results as domain consensus.

# Failure Modes

- **Confounding**: Selection effects, projection effects, or unresolved foreground/background contamination mimic physical signals.
- **Proxy misalignment**: The observable proxy does not trace the intended physical quantity due to calibration bias, environmental dependence, or resolution limits.
- **Model degeneracy**: Multiple physical mechanisms produce observationally indistinguishable signatures.
- **Artifact misidentification**: Numerical instabilities, systematic residuals, or processing errors are mistaken for physical signals.
- **Overfitting**: Complex models fit noise in small, biased, or high-dimensional samples.
- **False extrapolation**: Empirical relations or simulation trends are applied outside their validated domain.

# Validity Checks

- **Confounder audit**: Explicitly test for selection-function bias, projection effects, environmental dependence, resolution sensitivity, and measurement-definition variation.
- **Reproducibility**: Record data versions, sample definitions, processing scripts, random seeds, model parameters, and exclusion rules.
- **Statistical rigor**: Use independent test sets, cross-validation, bootstrap or resampling methods, coverage tests, and corrections for multiple comparisons.
- **Sensitivity analysis**: Verify that conclusions hold under varying assumptions about errors, models, sample cuts, and proxy definitions.
- **Boundary audit**: Confirm and report applicability limits for mass, redshift, spatial scale, gas phase, and observational depth.

# Provenance

- Derived from cluster 8 (subcluster 8.0) of the scientific skills codex.
- Synthesized from representative source skills: galaxy-alignment-research-pattern, astrophysical-pmf-dwarf-galaxy-exploration, galaxy-gas-star-formation-exploration, high-redshift-gas-accretion-absorption-workflow, galaxy-halo-disk-structure-exploration, high-redshift-galaxy-bh-scaling-exploration, heavy-ion-qgp-exploration, and hi-intensity-mapping-cosmology-research.
- Domain-specific operational details, numerical parameters, instrument configurations, and paper-specific conclusions have been excluded per the merge protocol.
