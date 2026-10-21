---
name: sci-cosmology-galaxy-cluster-morphology-mechanism-disco-57cbd57b
description: A reusable end-to-end workflow for generating, discriminating, and validating physical mechanisms behind observed or simulated galaxy and cluster morphological features using multi-probe evidence, matched controls, and iterative model comparison.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cluster morphology mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill guides an agent through a transferable, observable-driven workflow for astrophysical mechanism discovery. It starts from a morphological anomaly or transition in galaxies, clusters, or related large-scale structures, generates competing physical and artifact hypotheses, designs discriminating multi-probe tests with matched controls, validates findings against simulations or independent observations, and iterates until claims are bounded by evidence. The goal is reusable research design, not the reproduction of any single study result.

# When to use

- When a user asks to explain an observed or simulated galaxy/cluster morphological feature (e.g., profile breaks, misaligned components, overdensities, tidal debris, kinematic decoupling).
- When designing a study to distinguish local physics from redistribution, accretion, feedback, environmental effects, or projection artifacts.
- When comparing observational proxies with simulated counterparts to test model agreement or identify hidden-structure candidates.
- When planning multi-probe validation using imaging, spectroscopy, kinematics, or simulation outputs.
- When iterating a pilot result toward stronger membership confirmation, mechanism discrimination, or bias diagnosis.

# Inputs required

- Target phenomenon class and the observable feature defining it.
- Available data products: imaging, spectroscopy, photometric catalogs, kinematic maps, simulation snapshots, merger trees, or mock observations.
- Candidate mechanisms to test and known alternative explanations.
- Comparison sample or plan for matched controls (positive, negative, geometry, environment).
- Measurement goals: structural, stellar-population, gas, kinematic, or dynamical quantities.
- Constraints on data access, computational resources, redshift/distance range, and acceptable uncertainty.
- Any domain-specific data-use, licensing, or compliance constraints.

# Core Workflow

1. **Phenomenon Framing and Scope Bounding**
   - Define the morphological feature operationally (e.g., radial break, misalignment, overdensity, stream).
   - State whether the feature is radial, azimuthal, kinematic, environmental, or time-dependent.
   - Identify the parent structure and separate the anomaly from the background before interpretation.
   - **Decision Gate:** If the feature cannot be defined independently of the mechanism being tested, stop and reformulate the observable definition.

2. **Mechanism Hypothesis Generation**
   - List candidate physical mechanisms (e.g., star formation threshold, stellar redistribution, gas accretion, mergers, feedback, dynamical heating).
   - Include artifact and null hypotheses (e.g., projection effects, selection bias, background contamination, template mismatch).
   - For each hypothesis, specify predicted multi-probe signatures (structure, kinematics, stellar populations, gas content, environment, formation history).
   - Tag evidence strength (speculative, plausible, supported, strongly supported), key assumptions, and likely failure modes.
   - **Decision Gate:** If fewer than two hypotheses make distinguishable predictions, stop and refine the observable or add hybrid mechanisms.

3. **Experimental and Control Design**
   - Define target and comparison populations with explicit inclusion/exclusion criteria.
   - Construct matched controls:
     - *Positive control:* a known or injected case expected to show the feature.
     - *Negative control:* a regime or sample where the feature or mechanism should be absent.
     - *Strong control:* same data analyzed with the mechanism removed or under altered assumptions.
     - *Geometry/projection control:* varied orientations, apertures, or radial regions.
     - *Environment control:* isolated versus group/crowded environments.
   - Pre-register primary metrics, decision criteria, and stopping conditions before analysis.
   - **Decision Gate:** If data products and simulations are incommensurable or controls are infeasible, redesign the study or downgrade to a pilot scope.

4. **Multi-Probe Analysis and Decomposition**
   - Screen data quality, calibration, spatial coverage, and contamination; flag low-quality regions.
   - Decompose overlapping components (host vs. substructure, gas vs. stars) using phase-space, kinematic, or photometric separation.
   - Extract structural profiles, position-velocity diagrams, or geometric proxies with uncertainties.
   - Compare trends across independent observables (e.g., age, metallicity, gas, star formation, kinematics) in the same physical zones.
   - Propagate systematic and statistical uncertainties separately.
   - **Decision Gate:** If the signal is not robust to alternative masks, binning, decomposition methods, or background subtraction, halt and report instability.

5. **Simulation and Model Validation**
   - Compare observations with truth-known mocks, simulations, or independent anchor measurements using matched definitions, apertures, and projections.
   - Quantify method bias, scatter, and projection effects separately.
   - Verify that the predicted mechanism signature appears in positive controls and is suppressed in negative controls.
   - **Decision Gate:** If simulations fail to recover the expected signature under matched conditions, diagnose whether the discrepancy arises from model physics, resolution, or analysis mismatch before proceeding.

6. **Mechanism Discrimination and Evidence Classification**
   - Evaluate each hypothesis against the multi-probe evidence.
   - Classify the outcome per hypothesis: `supports`, `weakly supports`, `does not support`, or `inconclusive`.
   - Rank mechanisms by consistency across independent probes and controls.
   - **Decision Gate:** If no mechanism is strongly preferred and alternatives remain indistinguishable, proceed to iteration rather than forcing a conclusion.

7. **Iteration or Redesign**
   - Update the hypothesis ledger: strengthen evidence only when independent observables agree; downgrade when they conflict.
   - Refine or replace falsified mechanisms; add hybrid explanations if single causes fail.
   - Expand the sample only after minimal validation confirms pipeline stability; contract to cleaner subsamples if degeneracy dominates.
   - Add discriminating observables or simulations that directly address the strongest remaining failure mode.
   - **Decision Gate:** If the leading hypothesis survives an independent control without outcome leakage, finalize a bounded claim. Otherwise, return to Step 2 or 3.

8. **Uncertainty Audit and Final Bounding**
   - Summarize measurement, model-form, selection, and interpretation uncertainties.
   - State boundary conditions (mass, morphology, environment, redshift, profile type) where the conclusion applies.
   - Archive rejected hypotheses, critical assumptions, and analysis choices.
   - **Stop Condition:** Deliver the bounded research product once reproducibility and validity checks are satisfied.

# Output Format

When using this skill, return:

1. **Research question** and phenomenon definition.
2. **Candidate mechanisms** with predicted multi-probe signatures and evidence tags.
3. **Study design** including target sample, control schema, variables, and pre-registered metrics.
4. **Analysis plan** with quality screening, decomposition, cross-probe comparison, and uncertainty propagation steps.
5. **Validation plan** describing simulation matching, control execution, and robustness checks.
6. **Ranked hypotheses** updated with evidence classification and failure modes.
7. **Claim boundary statement** limiting scope to the tested sample, definitions, and assumptions.
8. **Iteration roadmap** specifying the next minimal experiment or diagnostic needed to reduce dominant uncertainty.

# Validation Gates

- **Feature independence:** The observable is defined before mechanism assignment.
- **Distinguishability:** Each hypothesis makes at least one unique prediction testable with available data.
- **Commensurability:** Observations and simulations use matched definitions, projections, and apertures.
- **Control integrity:** Positive and negative controls behave as expected before interpreting target results.
- **Robustness:** Conclusions survive reasonable variations in masking, binning, decomposition, and background treatment.
- **Cross-probe consistency:** Independent observables agree before a mechanism is strongly supported.
- **Outcome leakage check:** No hypothesis was added or modified solely after seeing the result.

# Claim Boundaries

- Do not present single-sample or single-simulation findings as universal laws.
- Distinguish directly measured quantities from inferred physical mechanisms and model-dependent interpretations.
- Avoid claiming a mechanism is proven when evidence is only consistent with it; retain alternatives until independently contradicted.
- Do not extrapolate beyond the tested mass, redshift, environment, or morphological range without explicit boundary statements.
- Do not provide operational telescope, instrument, or facility execution instructions.

# Failure Modes

- **Projection or geometry dominance:** The apparent feature is an overlap or viewing-angle artifact. *Response:* prioritize geometry controls and multi-view inspection before physical interpretation.
- **Mechanism degeneracy:** Multiple hypotheses predict similar signatures. *Response:* design a discriminating measurement rather than expanding the narrative.
- **Control mismatch:** Target and control samples differ in depth, selection, or quality. *Response:* rebuild matched controls or downgrade to a pilot test.
- **Systematic uncertainty dominates:** Calibration, foreground, or template choices drive the result. *Response:* halt and quantify systematics before scientific claims.
- **Small-sample or selection bias:** The sample is too limited or biased for the intended generalization. *Response:* constrain claims to the studied population and propose expansion criteria.
- **Simulation mismatch:** Models fail positive/negative controls. *Response:* diagnose whether the issue is physics, resolution, or analysis mismatch before using the simulation to validate observations.

# Validity Checks

Before finalizing any plan or result, verify:

- **Confounding:** Have projection, inclination, substructure, environment, and aperture effects been controlled?
- **Reproducibility:** Are selection criteria, masks, reduction choices, and analysis parameters documented for independent replication?
- **Statistical validity:** Are uncertainties propagated, sample sizes adequate, and multiple comparisons or post-hoc interpretations flagged?
- **Mechanism specificity:** Does each mechanism make a prediction that alternatives do not, and are negative controls present?
- **Subpopulation hiding:** Do binned averages conceal distinct dynamical states or object classes?
- **External validity:** Is the claim bounded to the tested system, sample, and measurement pipeline?
- **Data provenance:** Are sources, simulations, and derived products properly attributed and versioned?

# Provenance

This skill was synthesized from cluster 21 (subcluster 21.1), workflow archetype *observable-driven mechanism discovery and validation*, drawing on the shared workflow routes of the following source skills: `disk-galaxy-profile-break-research`, `polar-ring-galaxy-simulation-explorer`, `astronomy-manuscript-research-workflow`, `rare-signpost-overdensity-exploration`, `tidal-kinematics-research-workflow`, `cluster-shape-observation-simulation-skill`, `cluster-mass-multi-probe-bias-exploration`, and `cmb-line-tomography-research-workflow`. It encodes no paper-specific numerical results, cosmological parameters, or operational protocols.
