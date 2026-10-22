---
name: sci-cosmology-galaxy-halo-cosmology-structure-mechanism-d729c119
description: A reusable end-to-end workflow for discovering and validating astrophysical mechanisms that connect galaxy, halo, and large-scale structure populations to their formation histories and environments through controlled simulation-observation comparison and iterative hypothesis testing.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy halo cosmology structure mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Guide agents in designing transferable, end-to-end research programs for galaxy, halo, and cosmological structure formation. The workflow generates mechanism-grounded hypotheses, calibrates models against population-level observables, discriminates among competing physical explanations via ablation and forward modelling, and validates claims through independent diagnostics and robustness checks.

# When to use

Use this skill when the user needs to:

- Propose new research questions linking galaxy or halo morphology, scaling relations, substructure, orientation, or large-scale arrangement to formation mechanisms.
- Design simulation-observation comparison studies where hidden physics must be inferred via observable proxies.
- Test whether a population-level anomaly or trend reflects a genuine mechanism, a selection effect, or a simulation artefact.
- Iterate between hypothesis generation, experimental design, and model comparison for cosmological structure populations.

Do not use this skill as a general astrophysics encyclopedia, as a substitute for model documentation, or as a source of field-wide consensus claims derived from single studies.

# Inputs required

Before producing a study plan, obtain or infer:

- **Target population and taxonomy:** the object class, split, or structure definition and how it maps to physical structure versus observational proxies.
- **Observable constraints:** population-level summaries and their uncertainties, such as distributions, scaling relations, angular statistics, or spatial arrangements.
- **Simulation or generative backbone family:** the underlying simulation suite, mock catalogue, or synthetic population to be used across model variants.
- **Calibration and validation split:** explicit separation between datasets used for fitting and datasets reserved for independent testing.
- **Candidate mechanisms:** physical processes to test, such as accretion, feedback, mergers, instability, environmental quenching, or dark-sector effects.
- **Selection and mapping model:** survey geometry, completeness, selection function, projection effects, and the forward model from intrinsic quantities to observables.
- **Known systematics:** classification uncertainty, measurement error, resolution limits, cosmic variance, foregrounds, and stochastic realisation variance.

# Core Workflow

Follow this ordered route, applying decision gates at each stage and iterating when a gate fails.

## 1. Operationalize the population and anomaly
Define the population split, structure class, or measurable mismatch before any model fitting. Fix taxonomy, selection rules, and detection criteria in advance.
- **Decision gate:** If the population cannot be defined reproducibly, or the anomaly cannot be expressed as a measurable population-level difference, stop and refine the research question.

## 2. Establish baseline and competing hypotheses
Formulate a null or baseline model, target mechanism hypotheses, nuisance hypotheses, and artefact hypotheses. For each hypothesis specify the predicted observable shift, evidence strength, key assumptions, and likely failure modes.
- **Decision gate:** If hypotheses lack discriminating predictions or cannot be falsified with available data, stop and reformulate before proceeding.

## 3. Build a common backbone and map to data space
Fix the underlying simulation, catalogue, or generative population across all model variants. Translate intrinsic quantities into the same observational representation via forward modelling, incorporating selection, completeness, projection, and measurement uncertainty.
- **Decision gate:** If the backbone cannot be validated against independent references, or the mapping from intrinsic to observable space is ill-defined, pause and address systematics before interpreting visible populations.

## 4. Design controlled experiments with ablation or contrast
Vary one mechanism family at a time while holding the backbone constant. Include baseline, negative, positive, and nuisance controls. Define minimal viable validation and explicit stopping conditions.
- **Decision gate:** If a mechanism requires simultaneous tuning of unrelated processes to produce an effect, flag as degenerate and stop expanding that hypothesis.

## 5. Execute population-level comparison
Compare full distributions or robust distributional summaries between model variants and observations. Stratify by mechanism-relevant variables. Compute metrics for each population separately and in aggregate.
- **Decision gate:** If aggregate agreement masks population-level failure, reject aggregate-only claims and iterate on the mechanism or taxonomy.

## 6. Apply independent validation diagnostics
Test predictions against held-out observables not used in calibration, such as formation histories, merger histories, environmental dependence, or higher-order statistics.
- **Decision gate:** If the model passes calibration but fails independent diagnostics, revise the mechanism rather than accepting the calibration fit.

## 7. Run robustness and sensitivity checks
Repeat key comparisons under alternative but defensible definitions, apertures, proxies, selection cuts, model resolutions, and stochastic realisations. Quantify host-to-host variance, cosmic variance, and classification uncertainty.
- **Decision gate:** If conclusions reverse under reasonable alternative definitions, or depend on a single untested assumption, downgrade or reject the claim.

## 8. Update, split, or reject hypotheses
Promote mechanisms that improve multiple observables under common input; demote mechanisms that only fix one metric or depend on a single assumption. Split hypotheses by regime if discrepancies are scale-, mass-, redshift-, or environment-dependent. If all candidate mechanisms fail, reconsider the taxonomy, backbone, or observable.
- **Stop condition:** Stop iterating when extra complexity improves only the already-fitted data and not conditional or sensitivity tests. Stop if the leading degeneracy remains unmodelled or if the target regime lies outside the calibration range.

# Output Format

When using this skill, produce:

1. **Research question:** one concise, mechanism-focused question tied to the target population.
2. **Evidence map:** observed constraints, workflow patterns supported by source skills, broader literature support, and agent-inferred assumptions.
3. **Ranked hypotheses:** at least three hypotheses (target, nuisance, artefact) each with predicted signature, evidence strength, key assumptions, failure modes, and boundary conditions.
4. **Experimental design:** common backbone, calibration-validation split, control groups, mechanism contrasts, variable definitions, metrics, and stop conditions.
5. **Analysis plan:** forward-modelling steps, distributional comparison strategy, independent diagnostic tests, uncertainty propagation, and robustness checks.
6. **Iteration rules:** conditions for upgrading, downgrading, splitting, or rejecting each hypothesis.
7. **Validity and ethics statement:** confounders, reproducibility requirements, selection risks, extrapolation boundaries, and communication cautions.

# Validation Gates

- **Population definition gate:** the split or structure class must be fixed before outcome inspection.
- **Hypothesis discrimination gate:** each hypothesis must predict a distinct observable shift or conditional trend.
- **Backbone validation gate:** the structural scaffold must be plausible against independent references before interpreting visible populations.
- **Calibration discipline gate:** fitted observables, fitted parameters, and held-out diagnostics must be explicitly documented.
- **Mechanism isolation gate:** single-mechanism ablations must be attempted before combined mechanism claims.
- **Robustness gate:** conclusions must survive alternative definitions, selection cuts, and model implementations.
- **Claim bounding gate:** conclusions must be stated as conditional on the adopted model family, data assumptions, and tested regime.

# Claim Boundaries

- Restrict claims to the tested mass range, redshift range, luminosity range, environment, aperture, selection function, and model family.
- Distinguish simulation-verified behaviour, forward-modelled predictions, observation-informed inferences, and agent-generated extrapolations.
- Do not treat agreement in one implementation or survey as field consensus.
- Label empirical fits as descriptive unless their parameters map directly to the proposed physical mechanism.

# Failure Modes

- **Taxonomy failure:** the population split or structure definition is contaminated, irreproducible, or mixes physically distinct populations.
- **Degeneracy failure:** multiple mechanisms or nuisance effects produce identical observable signatures under the tested design.
- **Overfitting failure:** a mechanism improves one metric while worsening others, or success depends on a narrow, unvalidated configuration.
- **Selection failure:** survey incompleteness, projection effects, or foreground residuals create or erase the apparent signal.
- **Backbone failure:** the simulation or generative model lacks the resolution, physics, or variance needed for the target regime.
- **Extrapolation failure:** claims are extended beyond the calibrated domain without new validation.

# Validity Checks

- Are target, nuisance, and artefact hypotheses explicitly compared?
- Are observed and simulated samples selected by identical criteria?
- Are calibration and validation datasets strictly separated and documented?
- Does the analysis compare full distributions rather than single-point summaries?
- Are uncertainties propagated from measurement, classification, model stochasticity, cosmic variance, and selection effects?
- Are residuals checked for structured patterns and non-standard distributional shapes?
- Are multi-property gains real, or are observables redundant after conditioning?
- Are conclusions stable under alternative definitions, apertures, and model variants?
- Is the evidence strength of each hypothesis updated based on robustness and sensitivity outcomes?

# Provenance

- Synthesized from cluster 22, subcluster 22.2 of the scientific skills codex.
- Derived from source skills: morphological-lf-constrained-galaxy-evolution; galaxy-satellite-population-exploration; cosmic-web-orientation-exploration; galaxy-cluster-proxy-forward-modeling; hot-halo-mass-proxy-research; cosmology-growth-history-halo-exploration; extragalactic-magnetic-field-research-design; cosmological-structure-anomaly-validation.
- Workflow archetype: end-to-end mechanism discovery and validation.
