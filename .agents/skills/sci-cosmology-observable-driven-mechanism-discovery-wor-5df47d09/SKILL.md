---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-5df47d09
description: A reusable end-to-end workflow for designing astrophysical research that discovers and validates mechanisms by anchoring hypotheses to observables, enforcing controlled comparisons, and iterating until evidence meets strict claim boundaries.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 8"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill guides an agent to design end-to-end research programs that discover and validate astrophysical mechanisms from heterogeneous observational and simulation data. It enforces an observable-anchored approach: frame questions in directly measurable quantities, generate competing hypotheses, construct controlled comparisons with strong validation gates, and iterate until claims can be bounded as observed, model-derived, or inferred.

# When to use

Use this skill when:
- The task concerns explaining a population anomaly, transition, scaling-law residual, or spatial feature in extragalactic or cosmological data.
- Available evidence includes heterogeneous tracers, survey catalogs, simulation outputs, or multi-modal maps that must be harmonized before comparison.
- The user needs a minimal viable validation plan with explicit controls, ablations, stopping conditions, and claim boundaries rather than a summary of known results.
- The goal is to compare observations with simulations or forward models to test whether a proposed mechanism is distinguishable from systematics or alternative physics.

Do not use this skill for operational facility instructions, hardware control, deterministic claims beyond supported evidence, or as a substitute for domain-specific statistical validation.

# Inputs required

Ask the user or environment for:
- Target scientific question and the observable anomaly or gap to be explained.
- Available data products: catalogs, imaging, spectra, simulations, mock observables, intensity maps, or derived statistics, plus their selection functions and known systematics.
- Candidate mechanisms or model classes to distinguish, and the baseline relation or population structure against which anomalies are defined.
- Definitions for key quantities and known calibration assumptions, non-detections, upper limits, or quality flags.
- Computational or observational constraints and the required level of evidence for decision-making.

# Core Workflow

Execute the following ordered route. At each decision gate, pause interpretation if the condition is not met.

1. **Frame the gap in observables**
   - State the target population and the directly measured quantities (e.g., flux, color, profile shape, correlation function).
   - Identify the baseline relation or expected behavior.
   - Define the anomaly as a residual or offset from that baseline, not as an inferred physical parameter.
   - *Decision gate:* If the anomaly cannot be expressed in observables with documented uncertainties, stop and reformulate.

2. **Generate competing hypotheses**
   - Propose mechanism hypotheses that map causal or structural explanations to observable signatures.
   - Propose systematic hypotheses: calibration, selection, projection, foreground, or instrument artifacts that could mimic the anomaly.
   - Propose null or alternative hypotheses: known population tails, misclassification, or chance alignment.
   - For each hypothesis, state evidence strength, key assumptions, predicted observable signatures, and likely failure modes.
   - *Decision gate:* If no hypothesis produces a falsifiable observable signature, stop.

3. **Design minimal viable validation and controls**
   - Define the smallest dataset, simulation test, or data split that can discriminate between hypotheses.
   - Specify positive controls (signal expected), negative controls (signal should be absent), and cross-probe controls (independent observable or tracer).
   - Match comparison samples on nuisance variables; hold confounders fixed.
   - Define metrics: trend consistency, residual structure, cross-tracer agreement, model-data mismatch, and uncertainty reduction.
   - Define stopping conditions: controls fail, sample is too biased, or systematics dominate the expected signal.
   - *Decision gate:* If minimal validation cannot be constructed with available inputs, pause and request additional data or simulations.

4. **Harmonize data and build a common frame**
   - Convert all inputs to common definitions, units, and quality tiers.
   - Document calibration assumptions, selection functions, masks, exclusions, and provenance.
   - Separate statistical uncertainty from systematic uncertainty.
   - For simulation comparisons, create mock observables with matched selection, noise, resolution, and geometry.
   - *Decision gate:* If metadata or provenance is insufficient for reproducibility, stop and audit before analysis.

5. **Execute observable-level comparison**
   - Compare observations and models at the level of spectra, photometry, profiles, or correlation functions before interpreting physical parameters.
   - Use independent tracers or probes to test the same mechanism; require cross-tracer agreement.
   - Compute primary statistics and robustness checks under alternative assumptions.
   - *Decision gate:* If independent tracers disagree in a pattern explained by calibration failure, stop the associated model branch.

6. **Diagnose systematics and stress-test**
   - Vary priors, calibration choices, selection thresholds, and definitions.
   - Run ablations: remove one tracer, one sample stratum, or one model module at a time.
   - Inspect residuals for structure indicating missing physics or unmodeled systematics.
   - *Decision gate:* If the signal disappears under reasonable alternative assumptions, downgrade the claim to tentative or unsupported.

7. **Infer physical plausibility and triangulate mechanisms**
   - Only after observable agreement and systematic checks, inspect physical histories or properties.
   - Use multiple diagnostics jointly to distinguish pathways.
   - Map scaling behavior or trend shapes onto candidate mechanisms.
   - *Decision gate:* If multiple mechanisms remain degenerate after all controls, stop claiming a unique explanation and state the degeneracy explicitly.

8. **Iterate or finalize**
   - Update the evidence ledger: record robust trends, calibration-sensitive trends, and disappeared trends.
   - Revise hypotheses: strengthen those explaining multiple observables; weaken or discard those fitting only one derived quantity.
   - Refine the design: add samples, tracers, or controls targeting the highest-uncertainty regime.
   - Make a final classification: **Accept** (controls pass, multiple probes agree), **Revise** (partial evidence), **Reject** (controls fail), or **Defer** (insufficient data).
   - *Stop conditions:*
     - The sample is too biased to test the hypothesis.
     - Independent tracers disagree due to unresolvable calibration.
     - Residuals remain structured after proposed mechanisms are included.
     - Models are indistinguishable after feasible controls.
     - The next step would not reduce uncertainty or discriminate mechanisms.

# Output Format

When using this skill, produce:

1. **Research question** — one sentence stating the target population, observable gap, and scientific goal.
2. **Evidence map** — classification of evidence as directly observed, model-derived, or agent-inferred, with known uncertainty sources.
3. **Hypotheses table** — columns: hypothesis, mechanism/systematic, evidence strength, key assumptions, predicted observable signature, likely failure mode.
4. **Experimental design** — target and comparison samples, variables, controls (positive, negative, cross-probe), ablations, metrics, and stopping conditions.
5. **Analysis plan** — data harmonization, observable-level comparison, cross-tracer validation, residual analysis, and uncertainty propagation.
6. **Iteration log** — current evidence strength, boundary conditions, and the next validation step or pivot condition.
7. **Claim boundary statement** — classification of each conclusion as directly supported, model-informed, tentative, or unsupported.

# Validation Gates

Before advancing past each major phase, confirm:
- **Controls pass** — negative controls show no spurious signal and positive controls recover expected behavior.
- **Cross-tracer agreement** — mechanism claims require agreement between at least two independent observables or probes.
- **Residual inspection** — residuals are checked for unmodeled structure rather than treated as noise.
- **Sensitivity documentation** — selection functions, calibration choices, and their alternatives are documented and tested.

# Claim Boundaries

- Distinguish directly observed quantities from model-derived inferences and agent-generated hypotheses.
- Treat single-object or single-tracer anomalies as motivation for further study, not as field consensus.
- Limit claims to the validated regime (e.g., redshift, mass, environment, data quality) and label extrapolations explicitly.
- Do not present model consistency as definitive proof of a physical mechanism.

# Failure Modes

- **Systematic mimicry** — calibration drift, selection bias, foregrounds, or projection effects create false anomalies.
- **Tracer degeneracy** — different physical states produce identical observable signatures under current data.
- **Model extrapolation** — applying a baseline relation or simulation outside its validated regime.
- **Control failure** — positive controls fail or negative controls show spurious signals, indicating pipeline or sample flaws.
- **Overfitting to residuals** — interpreting noise or small-number scatter as missing physics.

# Validity Checks

Before executing the workflow, verify:
- The anomaly is defined relative to a baseline with quantified scatter.
- At least two independent observables or tracers are available for cross-check.
- Selection functions, masks, and non-detections are documented.
- Candidate hypotheses are falsifiable with the available data or simulations.
- Definitions, units, and calibration assumptions are explicit and reproducible.

# Provenance

- Derived from cluster 21 / subcluster 21.0 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: galaxy-cold-gas-research-planning, computational-astro-mock-observables-workflow, high-redshift-quiescent-galaxy-exploration, galaxy-assembly-research-design, cosmological-survey-research-design, galaxy-transition-exploration, galaxy-merger-simulation-observation-framework, multi-tracer-intensity-mapping-reionization.
