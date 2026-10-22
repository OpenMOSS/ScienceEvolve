---
name: sci-cosmology-galaxy-cosmology-halo-cluster-mechanism-d-9cadadee
description: A reusable end-to-end workflow for discovering and validating astrophysical mechanisms across galaxies, halos, clusters, and cosmological fields using anomaly-driven hypotheses, controlled experiments, and multi-source validation.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cosmology halo cluster mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent design and execute reusable end-to-end research workflows for discovering and validating physical mechanisms in astrophysical and cosmological systems. The workflow moves from anomaly identification through hypothesis generation, controlled validation, independent cross-checks, and iterative refinement, without treating any single study as universal consensus.

# When to use

Use this skill when the user asks to:
- Explain an unexpected pattern, excess variance, or discrepancy in astrophysical data or simulations.
- Design a study to discriminate competing mechanisms such as feedback, accretion, environmental evolution, or dark matter microphysics.
- Validate a proposed proxy, tracer, or mapping between latent physical quantities and observables.
- Plan simulation-to-observable tests, multi-probe analyses, or sparse-tracer inference studies.

Do not use this skill for operational instrument control, hazardous procedures, fabrication recipes, or as a substitute for domain-specific software validation.

# Inputs required

Before starting, collect or infer:
- Target system and regime (e.g., galaxy population, halo, cluster, intergalactic medium, stellar halo).
- Baseline model or expected behavior against which an anomaly is defined.
- Candidate mechanisms and their predicted observable signatures.
- Available data, simulations, or mock-generation resources.
- Known nuisance factors: selection, completeness, contamination, resolution, calibration, geometry, and masking.
- Independent validation data or diagnostics not used for primary calibration.
- Intended output type: research question, experimental design, analysis plan, or feasibility assessment.

If any input is missing, state the assumption explicitly and mark the resulting evidence strength as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

**Step 1: Anomaly framing and robustness check**
- Define the observable anomaly or model gap with a precise mismatch statement.
- Test robustness under alternative data cuts, selection variations, and known systematics.
- **Decision Gate 1:** If the anomaly vanishes under reasonable alternative assumptions, STOP and reframe the research question.

**Step 2: Hypothesis generation**
- Formulate a mechanism hypothesis (proposed physical cause and its predicted signature).
- Formulate at least one alternative hypothesis (a different mechanism or nuisance process).
- Formulate a null/failure hypothesis (artifact, selection effect, or baseline explanation).
- For each hypothesis, state: key assumptions, expected pattern, evidence strength label (strong / moderate / weak / speculative), and likely failure modes.
- **Stop condition:** If no falsifiable prediction can be stated, STOP and redefine the question.

**Step 3: Experimental design**
- Define variables: target mechanism, mediators, observables, and nuisance parameters.
- Establish controls:
  - Positive control: known regime where the signal should appear.
  - Negative control: regime where the signal should be absent.
  - Sensitivity/ablation controls: vary selection, resolution, geometry, proxy definition, or mapping assumptions.
- Choose a primary statistic tied to the hypothesis and at least one orthogonal cross-check statistic.
- Define minimal viable validation: the smallest test that could materially change confidence.
- **Decision Gate 2:** If controls cannot be constructed, or if baseline and modified conditions are not matched except for the target ingredient, STOP and redesign.

**Step 4: Data generation or preparation**
- Prepare the observational sample or generate mock/synthetic data preserving survey or simulation properties.
- Apply consistent selection, masking, noise, and censoring rules to both data and mocks.
- Document provenance, versions, and assumptions.
- **Stop condition:** If the data or mocks lack the resolution, volume, or sampling to resolve the claimed mechanism, STOP and revise the data product.

**Step 5: Primary analysis and cross-validation**
- Compute the primary statistic.
- Compute the orthogonal statistic sensitive to a different causal link or pipeline stage.
- Validate tracer representativeness or proxy mapping against the parent population.
- Compare with independent measurements in overlap regions when available.
- **Decision Gate 3:** If primary and cross-check statistics contradict without explanation, STOP and diagnose pipeline or model failure before interpreting mechanisms.

**Step 6: Control comparison and mechanism discrimination**
- Compare results across positive, negative, and sensitivity controls.
- Discriminate the proposed mechanism from alternatives using distribution shape, tail behavior, scale dependence, redshift evolution, or subgroup structure.
- Verify that the proposed mechanism outperforms the null model and nuisance models on held-out diagnostics.
- **Decision Gate 4:** If negative controls reproduce the signal, or if the mechanism cannot outperform the null model, STOP and downgrade the evidence strength.

**Step 7: Uncertainty quantification and evidence assignment**
- Propagate statistical, systematic, model, and sampling uncertainties separately.
- Assign evidence strength based on: causal proximity of the observable to the mechanism, robustness of controls, success of independent validation, and stability under ablations.
- Label claims as: supported, constraining, inconclusive, or refuting for this setup.
- **Stop condition:** If the signal is smaller than the dominant systematic uncertainty, STOP and report a bound rather than a detection.

**Step 8: Iteration or finalization**
- If evidence is strong and stable, map boundary conditions and propose the single most informative next discriminator.
- If evidence is weak or ambiguous, identify the dominant uncertainty and design the next minimal test.
- If the mechanism fails, revise the hypothesis or pivot to an alternative.
- Document all decisions, assumptions, and boundary limits.

# Output Format

When using this skill, produce:

1. **Research question and gap statement** — concise anomaly or model gap.
2. **Hypothesis table** — for each hypothesis: claim, predicted signature, evidence strength, key assumptions, and failure modes.
3. **Experimental design** — variables, controls (positive, negative, sensitivity), metrics, and stop conditions.
4. **Analysis plan** — primary and cross-check statistics, uncertainty method, and diagnostic pipeline.
5. **Iteration roadmap** — next test or ablation based on the current evidence state.
6. **Validity and ethics notes** — confounders, reproducibility checks, boundary conditions, and data-use constraints.

# Validation Gates

- **Gate 1 (Anomaly robustness):** The anomaly persists under reasonable data cuts, selection variations, and systematic checks.
- **Gate 2 (Control integrity):** Positive and negative controls behave as intended; the pipeline is matched across conditions except for the target ingredient.
- **Gate 3 (Cross-statistic consistency):** Primary and orthogonal statistics agree, or their disagreement is explained by a known confounder.
- **Gate 4 (Mechanism discrimination):** The proposed mechanism outperforms null and alternative models on independent diagnostics.
- **Gate 5 (Systematic bound):** The inferred signal exceeds the dominant systematic uncertainty.

# Claim Boundaries

- Limit claims to the tested population, redshift/epoch, spatial scale, tracer class, and simulation or observational regime.
- Treat any new proxy, mapping, or population transfer as a hypothesis requiring independent validation.
- Distinguish model-dependent inferences from direct observational facts.
- Do not generalize from a single system, realization, snapshot, or survey.
- Mark untested transfer claims as hypotheses, not conclusions.

# Failure Modes

- The anomaly is caused by data processing, selection effects, survey geometry, or artifacts rather than new physics.
- The tracer or proxy is unrepresentative of the parent population.
- Calibration or mapping depends on the effect under test (circular reasoning).
- Model or simulation uncertainty exceeds the expected signal.
- Inference is dominated by priors, tolerance choices, distance metrics, or simulation boundaries.
- Global agreement hides contradictory spatial, temporal, or subgroup diagnostics.
- Multiple confounders can reproduce the same signature.
- The mechanism explains the mean trend but fails in the tails, extremes, or independent cross-checks.

# Validity Checks

- **Confounding:** Can selection, geometry, contamination, completeness, resolution, or binning explain the result?
- **Reproducibility:** Are criteria, cuts, assumptions, data versions, and random seeds documented so an independent analyst can reconstruct the study?
- **Statistical validity:** Is uncertainty estimated with appropriate covariance, resampling, or ensemble methods? Are post-hoc metrics avoided?
- **Boundary conditions:** Are claims restricted to the validated domain and not extrapolated beyond it?
- **External validity:** Is a single result treated as a research direction rather than universal consensus?
- **Causal proximity:** Is the observable closely linked to the proposed mechanism, or is the connection speculative?
- **Non-circular calibration:** Is calibration independent of the effect under test?

# Provenance

- Derived from cluster 19, subcluster 19.0 of the scientific skills codex.
- Synthesized from source skills: abundance-matched-clustering-validation; globular-cluster-dark-channel-constraints; early-type-galaxy-halo-kinematics-skill; agn-feedback-simulation-workflow; ionizing-background-inference-workflow; galactic-chemodynamics-merger-hypothesis-design; strong-lens-latent-structure-research; cosmology-simulation-observable-workflow.
- Preserves methodological patterns without endorsing paper-specific conclusions, numerical parameters, or operational protocols.
