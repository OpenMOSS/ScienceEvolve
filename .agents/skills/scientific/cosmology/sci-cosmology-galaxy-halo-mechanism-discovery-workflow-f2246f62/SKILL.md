---
name: sci-cosmology-galaxy-halo-mechanism-discovery-workflow-f2246f62
description: A reusable end-to-end workflow for discovering and validating astrophysical mechanisms that connect dark matter halos, satellite galaxies, and large-scale structure through controlled multi-model comparison and anomaly triangulation.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy halo mechanism discovery workflow 2"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Help an agent turn a discrepancy between baseline cosmological models and observed or simulated galaxy/halo properties into a falsifiable, iterative research program. The workflow separates physical mechanisms from implementation artifacts, selection effects, and numerical systematics by enforcing matched comparisons, multi-observable consistency, and explicit stopping conditions.

## When to use

Use this skill when the user asks to:

- Explain a mismatch between dark-matter-only or baseline galaxy-formation predictions and observed satellite, dwarf, or halo properties.
- Design controlled experiments to isolate baryonic feedback, environmental processing, dark matter microphysics, or accretion-history effects.
- Validate whether a candidate anomaly in galaxy clustering, satellite anisotropy, or halo structure is robust across models, selections, and projections.
- Generate hypotheses and iteration plans for large-scale structure tests beyond standard two-point statistics.

Do not use this skill as a substitute for running full simulations, deriving new primary observations, or asserting field-wide consensus from a single comparison.

## Inputs required

Before executing the workflow, collect or infer:

- **Target discrepancy**: the baseline model, observed pattern, and specific mismatch (trend-level or scatter-level).
- **System class**: host halos, satellite populations, dwarf galaxies, or large-scale tracers; redshift and environment regime.
- **Model assets**: available simulations, mock catalogues, semi-analytic models, or analytic frameworks; resolution limits and known assumptions.
- **Observational anchors**: survey selection functions, completeness limits, masking, and measurement definitions.
- **Candidate mechanisms**: internal baryonic processes, environmental forcing, dark matter properties, or selection/projection effects.
- **Success criteria**: whether the goal is model rejection, mechanism isolation, parameter bounding, or hypothesis generation.

## Core Workflow

1. **Frame the discrepancy and anchor to a common structure**
   - Define the mismatch in measurable terms. Distinguish trend-level from scatter-level discrepancies.
   - Anchor the comparison to a shared underlying structure (e.g., the same dark-matter simulation, halo catalogue, merger-tree framework, or matched initial conditions) so that model differences are easier to isolate.
   - **Gate**: If no common underlying structure or consistent observable space can be identified, stop and request inputs.

2. **Generate competing hypotheses**
   - Produce at least three hypotheses covering:
     - Null / baseline compatibility.
     - Selection, projection, or catalogue-resolution bias.
     - Population-bookkeeping or calibration artifact.
     - Physical mechanism (internal transformation, environmental forcing, dark matter microphysics, or accretion history).
   - For each hypothesis, state: evidence strength, key assumptions, predicted signatures, and failure modes.
   - **Gate**: If hypotheses cannot be formulated with falsifiable predictions, stop and refine the discrepancy definition.

3. **Design controlled comparisons**
   - Define independent variables: mechanism presence, selection rules, mark definitions, redshift, environment, and model family.
   - Define dependent variables: robust observables such as kinematic proxies, density profiles, clustering statistics, and scaling relations.
   - Establish controls:
     - **Baseline / negative control**: model without the proposed mechanism.
     - **Positive control**: known signal or injected anomaly that the pipeline should recover.
     - **Selection control**: alternative cuts, masks, and completeness assumptions.
     - **Stress-test control**: alternative baryonic model or subgrid prescription that changes assumptions without changing the target mechanism.
   - **Gate**: If the design cannot distinguish the candidate mechanism from selection bias or implementation variation, redesign before proceeding.

4. **Execute matched measurement and multi-observable analysis**
   - Measure the same observables across all model variants and observations at comparable physical scales.
   - Compare one-point and multi-point statistics; avoid collapsing joint structure into a single scalar unless justified.
   - Stratify by population, environment, luminosity, or accretion history before aggregating.
   - Compute residuals and localize where models diverge most strongly.
   - **Gate**: If measurement definitions are inconsistent across catalogues or resolution limits prevent measurement at the relevant scale, stop and harmonize inputs.

5. **Calibrate significance and test against null ensembles**
   - Construct null ensembles (randomized orientations, parent-population resampling, shuffled associations) matched to the selection function.
   - Estimate rarity and uncertainty, accounting for sample variance, shot noise, and covariance.
   - Compare joint-distribution tests against simpler marginal baselines to verify information gain.
   - **Gate**: If null calibration is unstable or the ensemble is too small for rare-event estimation, broaden validation or simplify the statistic.

6. **Adjudicate mechanisms and bound claims**
   - Attribute discrepancies to the candidate mechanism only if structural diagnostics show the expected intermediate change and the result survives stress-test controls.
   - Translate mismatches into bounded constraints: state which regimes, populations, and assumptions are challenged.
   - Grade evidence as direct, indirect, consistency-based, or speculative.
   - **Gate**: If the result depends on a single selection choice, undocumented preprocessing, or one model implementation, downgrade confidence and iterate.

7. **Iterate or terminate**
   - **If robust across models and selections**: strengthen the mechanism hypothesis; design a sharper prediction or cross-population test.
   - **If fragile or model-specific**: revise toward implementation bias or selection effect; test alternative catalogues or membership rules.
   - **If abundance agrees but spatial/kinematic structure disagrees**: investigate spatial assignment, satellite treatment, or halo occupation effects.
   - **If joint tests reject but marginals do not**: investigate dependence structure and population mixing before claiming a new physical effect.
   - **Stop conditions**:
     - The observed system cannot be mapped reliably into the model catalogue.
     - Selection functions or uncertainties dominate the measured signal.
     - The result depends on a single poorly constrained object class or parameterization.
     - The null ensemble is too small for stable inference.
     - The candidate anomaly disappears under a defensible control.
     - A simpler baseline method gives the same decision with lower complexity.

## Output Format

Return a structured research plan containing:

1. **Research question** — falsifiable question tied to the discrepancy and target system.
2. **Hypothesis matrix** — ranked hypotheses with evidence strength, assumptions, predicted signatures, and failure modes.
3. **Experimental design** — model set, controls, variables, primary and secondary observables, metrics, and stopping conditions.
4. **Analysis plan** — matched measurement pipeline, stratification strategy, residual diagnostics, and uncertainty decomposition.
5. **Iteration roadmap** — result-dependent next steps and confidence update rules.
6. **Validity statement** — confounders, reproducibility requirements, boundary conditions, and data-use constraints.

## Validation Gates

- **Common-structure gate**: Compared catalogues or simulations share the same underlying structure, units, redshift definitions, mass definitions, and selection logic where required.
- **Calibration-leakage gate**: Observables used to tune models are identified and not presented as independent predictions.
- **Selection-function gate**: Conclusions survive alternative sample cuts, bins, completeness assumptions, and survey masks.
- **Resolution gate**: Relevant radii, masses, and populations are above convergence thresholds; numerical artifacts are ruled out.
- **Mechanism-isolation gate**: Internal, environmental, and combined effects can be distinguished from one another and from implementation choices.
- **Statistical gate**: Differences exceed expected model-to-model scatter; uncertainty intervals account for sample size, binning sensitivity, and covariance.
- **Reproducibility gate**: Data versions, model versions, preprocessing steps, selection cuts, random seeds, and metric definitions are documented.

## Claim Boundaries

- Treat model rejection as evidence against the full model plus data-processing assumptions, not as proof of a single alternative.
- Do not generalize results beyond the tested redshift, mass range, environment, tracer population, or model ensemble.
- Separate evidence for a physical mechanism from evidence for a bookkeeping, calibration, or implementation choice.
- Distinguish observation-supported findings from simulation-supported inferences and agent-generated hypotheses.
- Avoid presenting a single catalogue comparison, simulation suite, or observed system as field-wide consensus.

## Failure Modes

- **Selection-dominant signal**: The apparent anomaly is driven by survey footprint, detection completeness, distance uncertainty, or membership cuts rather than physics.
- **Projection artifact**: Apparent flattening, alignment, or clustering arises from viewing geometry or observational masks.
- **Calibration degeneracy**: Agreement with an observable is explained by calibration rather than predictive power.
- **Compensating error**: A model fits one statistic while failing another due to offsetting inaccuracies.
- **Numerical artifact**: Resolution limits, force accuracy, or treatment of unbound material mimics a physical effect.
- **Over-interpreted tail**: Rare-event significance is overstated due to insufficient null-ensemble coverage or multiple-comparison issues.
- **Implementation confound**: Differences trace back to one simulation code, subgrid prescription, or catalogue pipeline rather than a generic mechanism.

## Validity Checks

- Are discrepancies caused by survey limits, censoring, heterogeneous source classes, or inconsistent data cuts?
- Do geometry and kinematics yield independent information before being combined into joint rarity estimates?
- Are simulated and observed samples selected with comparable morphology, mass, aperture, and quality criteria?
- Are measurement definitions (sizes, velocities, luminosities, halo masses) compatible across models and data?
- Does the result survive alternative substructure finders, galaxy-assignment rules, and feedback prescriptions?
- Are confidence intervals estimated with appropriate resampling, mock-based covariance, or uncertainty propagation?
- Are selection cuts, random seeds, catalog versions, and plotting choices recorded for independent audit?

## Provenance

- Synthesized from cluster 7.2 (galaxy-satellite-halo-cosmology-mechanism-discovery-workflow).
- Source skills: `semi-analytic-galaxy-mock-catalogue-research`, `galaxy-satellite-anomaly-explorer`, `multidimensional-goodness-of-fit-research-design`, `galaxy-formation-constraint-discovery`, `baryon-aware-satellite-structure-research`, `modified-gravity-density-marked-clustering`, `baryon-aware-dwarf-satellite-dynamics`, `satellite-anisotropy-research-design`.
- Preserves only transferable method patterns; excludes paper-specific numerical results, simulation setups, and parameter values.
