---
name: sci-cosmology-galaxy-halo-lensing-cosmological-mechanis-231b283f
description: Guide agents through an end-to-end mechanism discovery and validation workflow for galaxy, halo, lensing, and cosmological inference, combining hypothesis generation, controlled simulation or mock validation, mechanism discrimination, and uncertainty-aware iteration.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy halo lensing cosmological mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Guide agents in designing reusable end-to-end research plans that discover and validate astrophysical or cosmological mechanisms governing galaxies, halos, lensing signals, or large-scale structure. The workflow emphasizes separating physical mechanisms from methodological artifacts through hypothesis decomposition, multi-tracer or multi-probe controlled comparisons, mock-calibrated validation, and iterative uncertainty auditing.

# When to use

Use this skill when:

- Proposing or evaluating research questions where observed signals may arise from multiple competing physical or systematic mechanisms.
- Tasks involve galaxy or halo properties, weak or strong lensing systematics, cosmological probes, substructure, or large-scale structure dynamics.
- Designing validation experiments using simulations, mocks, or independent implementations to test mechanism hypotheses.
- Comparing model families, pipelines, or observational proxies when direct observation is incomplete or degenerate.
- Generating research plans, validation strategies, or robustness assessments rather than field-wide consensus claims or operational observing recipes.

Do not use this skill as a general cosmology tutorial, a replacement for domain-specific simulation documentation, or a source of definitive observational conclusions.

# Inputs required

Before producing a research plan, obtain or define:

- **Target research question:** the specific mechanism, systematic, or model discrimination to be tested.
- **Available data or simulation suites:** catalogues, mocks, or forecasts with selection functions, masks, completeness, and resolution limits.
- **Candidate observables, tracers, or probes:** measurements with documented uncertainties and known nuisance parameters.
- **Competing model families or hypotheses:** alternative physical or systematic explanations that could produce the observed signal.
- **Baseline assumptions:** background models, contamination estimates, geometry priors, or nuisance-parameter families.
- **Intended downstream inference:** mass, concentration, abundance, efficiency, geometry, or cosmological parameters to be constrained.
- **Evidence standard and constraints:** required precision, independent validation needs, computational budget, and reproducibility requirements.

# Core Workflow

Follow this ordered end-to-end route. Treat each **Gate** as a hard decision point; if the condition is not met, apply the associated stop or iteration rule before proceeding.

1. **Frame the mechanism decision problem**
   - Define the observable signal and the competing physical or systematic explanations that could produce it.
   - State the decision the study must make: model discrimination, systematic quantification, proxy validation, or pipeline verification.
   - **Gate:** If the question lacks a falsifiable mechanism distinction, stop and reformulate the research question.

2. **Decompose hypotheses into mechanism layers**
   - Separate hypotheses by physical factor (abundance, efficiency, geometry, environment, projection, coupling) or systematic factor (selection, contamination, resolution, method bias).
   - Tag each hypothesis with a predicted observable signature, evidence strength, key assumptions, and failure modes.
   - **Gate:** If no hypothesis can be tested with available data or simulations, downgrade to exploratory scoping and list missing inputs.

3. **Design controlled validation architecture**
   - Define baseline, alternative, and stress-test models or treatments.
   - Specify positive controls (regimes with known outcomes), negative controls (regimes with no expected signal), strong controls (cross-method or cross-probe comparisons), and ablation controls (removing one variable or information channel).
   - Pre-register evaluation metrics, tolerance thresholds, and minimal viable validation criteria.
   - **Gate:** If no independent validation path exists, halt and request additional simulation or data resources.

4. **Harmonize inputs across probes and catalogues**
   - Align parameter bases, coordinate systems, selection functions, masks, completeness, and nuisance definitions across all datasets and methods.
   - Document all cuts, transformations, tracer definitions, and redshift or scale conventions.
   - **Gate:** If input consistency cannot be verified, pause for data audit before analysis.

5. **Execute primary analysis with separable components**
   - Apply appropriate techniques (mixture modeling, profile measurement, structure finding, forecast comparison, lineage tracking) while keeping mechanism contributions separable.
   - Maintain separable terms for baseline, alternative, and nuisance components so each can be audited.
   - **Gate:** If baseline or positive-control reproduction fails, stop for pipeline debugging before interpreting scientific differences.

6. **Validate against simulated or synthetic truth**
   - Test proxy behavior, calibration relations, and recovery of known signals in mocks or resolved regimes.
   - Vary resolution, scale coverage, redshift, model freedom, and error models to map failure regimes.
   - **Gate:** If mocks fail to recover expected signals, or if negative controls produce false positives, stop mechanism claims and diagnose method failure.

7. **Discriminate mechanisms via sensitivity decomposition**
   - Quantify which assumption, parameter, or model family most affects the conclusion.
   - Separate changes caused by target physics from those caused by numerical choices, methodological assumptions, or nuisance-parameter compensation.
   - **Gate:** If conclusions reverse under plausible alternative assumptions, bound claims as conditional or speculative.

8. **Audit uncertainty and propagate bounds**
   - Combine statistical, systematic, and model-form uncertainties.
   - Report degeneracy structure, correlation orientation, and uncertainty intervals, not only scalar constraints.
   - **Gate:** If uncertainty dominates the signal, reclassify the result as an upper limit, feasibility study, or hypothesis generation.

9. **Iterate or redesign based on gate outcomes**
   - **If validation fails:** Fix recipe consistency, input harmonization, or numerical stability before changing scientific interpretation.
   - **If probes or methods disagree:** Diagnose whether disagreement is physical or artifactual; do not average incompatible results.
   - **If hypothesis is supported:** Narrow boundary conditions and design stronger discriminating tests.
   - **If hypothesis is weakened:** Add nuisance parameters, reduce scale assumptions, or test less constrained model extensions.
   - **Stop condition:** Cease iteration when additional complexity no longer changes mechanism rankings, when reproducibility thresholds are met, or when unresolved assumptions dominate the conclusion.

# Output Format

When using this skill, return:

1. **Research question and mechanism map** — the decision problem, observable signal, and competing explanations.
2. **Hypothesis portfolio** — each hypothesis with evidence strength, key assumptions, predicted signature, and failure modes.
3. **Experimental design** — baseline and alternative models, controls, variables, metrics, minimal viable validation, and stopping conditions.
4. **Analysis plan** — pre-registered choices, fitting or comparison sequence, diagnostics, and robustness checks.
5. **Validation gate log** — pass/fail/stop decisions at each gate with justification.
6. **Iteration record** — documented updates, boundary changes, and complexity stops.
7. **Claim boundary statement** — separation of validated, conditional, and speculative conclusions with explicit extrapolation limits.

# Validation Gates

- **Mechanism falsifiability:** Every hypothesis must state a predicted observable signature that could reject it.
- **Control response:** Positive controls must confirm known behavior; negative controls must not produce spurious signal.
- **Cross-method agreement:** Independent implementations or probes must agree within pre-specified tolerance before results are treated as reliable.
- **Mock fidelity:** Synthetic recovery must confirm pipeline behavior before observational claims are advanced.
- **Stability:** Conclusions must survive reasonable changes in scale cuts, binning, priors, and nuisance inclusion.
- **Input consistency:** Parameter bases, selection functions, and coordinate conventions must be aligned across all compared datasets.

# Claim Boundaries

- **Validated:** Directly supported by independent controls, mock calibration, and cross-checks within the tested domain.
- **Conditional:** Supported only under specific model families, parameter ranges, or subsamples; requires explicit caveats.
- **Speculative:** Plausible but lacking empirical validation; requires future data or simulation.
- **Explicitly excluded:** Do not present single-study, single-simulation, or single-pipeline results as field-wide consensus.

# Failure Modes

- **False convergence:** Agreement between methods or apparent stability across settings is mistaken for correctness.
- **Proxy decoupling:** An observable proxy loses correlation with the hidden driver due to mergers, miscentring, noise, or environmental evolution.
- **Contamination bias:** Background, interlopers, or selection effects mimic the target mechanism.
- **Degeneracy oversight:** Nuisance parameters or model extensions cancel or mimic the signal of interest.
- **Extrapolation beyond evidence:** Analytic or simulation results are applied outside their validated domain.
- **Downstream leakage:** Catalog-level errors propagate uncorrected into population-level or cosmological inference.
- **Prior domination:** Fitted quantities track prior boundaries rather than data.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** Can substructure, projection, environment, or selection explain the signal instead of the proposed mechanism?
- **Parameter basis:** Are varied, fixed, and derived parameters defined consistently across comparisons?
- **Covariance and cross-talk:** Are shared systematics, cross-correlations, or overlapping selections included or explicitly bounded?
- **Numerical reproducibility:** Are interpolation choices, derivative schemes, binning, and conventions documented enough for another agent to reproduce the plan?
- **Selection dependence:** Does the result depend on arbitrary cuts, quality thresholds, or sample definition?
- **Boundary limits:** Are claims restricted to tested mass ranges, redshifts, resolutions, survey volumes, or scale regimes?
- **Evidence labeling:** Are paper-supported, cross-study-supported, and agent-inferred claims clearly separated?
- **Statistical validity:** Are uncertainties estimated with resampling, posterior intervals, or mock calibration appropriate to the sample?

# Provenance

- Synthesized from cluster 23.0 (galaxy-halo-lensing-cosmological-mechanism-discovery).
- Source skill references: cosmological-forecast-validation, cosmological-void-dynamics-exploration, reionization-source-exploration, indirect-dark-matter-substructure-research-workflow, subhalo-finder-reliability-workflow, cluster-lensing-orientation-proxy, tidal-stream-geometric-reconstruction, astrophysics-interloper-research-workflow.
- Methodological patterns abstracted from peer-reviewed astrophysics and cosmology literature; no specific numerical results, operational protocols, or paper conclusions are preserved in the reusable workflow body.
