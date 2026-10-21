---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-279bb436
description: A reusable end-to-end workflow for designing research plans that infer physical mechanisms from astrophysical observables, simulations, or survey data, validate them through layered controls and uncertainty audits, and iterate until claims are bounded and reproducible.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 5"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Transform an astrophysical observable, survey dataset, or simulation output into a staged mechanism-discovery and validation research plan. The workflow guides hypothesis generation, experimental design, controlled comparison, systematic diagnosis, uncertainty propagation, and iterative claim refinement for galaxy, cosmology, lensing, and large-scale-structure problems.

# When to use

Use this skill when the user asks to:

- Propose new research questions from survey, imaging, spectroscopic, lensing, clustering, or simulation data.
- Design studies that distinguish intrinsic physical mechanisms from numerical, instrumental, or systematic artifacts.
- Compare estimators, definitions, probes, or inference methods under realistic noise, selection, and calibration constraints.
- Validate whether an inferred signal is robust across resolutions, domains, operational definitions, or model assumptions.
- Plan forecast, calibration, compression, or substructure studies where observable-to-mechanism inference is central.

Do not use this skill for operational instrument commands, routine plotting without research design, literature summarization without hypothesis generation, or asserting single-paper results as field-wide consensus.

# Inputs required

Before generating a research plan, identify or request:

- **Target observable and scientific question:** e.g., lensing shear, clustering, photometry, halo properties, substructure signals, or latent quantities such as redshift.
- **Data sources:** survey specifications, simulation suites, mock catalogs, compressed data products, or observational catalogs.
- **Candidate mechanisms:** physical processes, estimator choices, calibration hypotheses, model families, or structured representations.
- **Domain boundaries:** redshift range, mass scale, resolution limit, survey footprint, population strata, or data-generation regime.
- **Baseline methods:** current best-practice estimators, templates, reference models, or conventional summaries.
- **Known systematics and nuisances:** selection effects, calibration offsets, numerical artifacts, domain shifts, definition sensitivities, or shortcut-learning risks.
- **Validation resources:** independent samples, control simulations, cross-check datasets, reference truths, or computational budget.
- **Claim scope:** what outcomes would constitute support, refutation, or inconclusive evidence for each hypothesis.

# Core Workflow

Follow this ordered route. Do not skip a layer if its gate fails.

## 1. Frame the inference gap
- Define the target observable, the latent physical mechanism, and the decision-relevant uncertainty.
- Bound the claim scope: state what would constitute support, refutation, or inconclusiveness.
- **Gate:** If the mechanism is not identifiable in principle from the available data, stop and reformulate.

## 2. Generate ranked mechanism hypotheses
- Produce candidate hypotheses linking observable to mechanism.
- For each, record: mechanism description, evidence strength, key assumptions, predicted signature, likely failure modes, and minimal viable test.
- **Gate:** If no hypothesis is falsifiable with available resources, stop and expand inputs or narrow the scope.

## 3. Design controlled comparisons
- Select baseline and candidate configurations (estimators, probes, definitions, models, or data combinations).
- Define independent variables, stratification axes, and pre-registered metrics.
- Specify controls: baseline, positive, negative, strong, ablation, and domain/estimator cross-checks.
- State stop conditions before execution.
- **Gate:** If controls cannot isolate the mechanism from known nuisances, redesign before executing.

## 4. Execute layered validation
- **Layer A — Construction/Calibration:** Verify data integrity, reference-model consistency, sample matching, and initial equilibrium or calibration quality. Resolve artifacts before interpreting dynamics or signals.
- **Layer B — Population/Transfer:** Test signal persistence across object classes, redshift/mass regimes, resolutions, survey patches, or data-generation domains. Check for domain-shift and shortcut-learning.
- **Layer C — Observable/Downstream:** Propagate to final observables, scaling relations, or inferred parameters. Evaluate whether estimator or definition choices alter qualitative conclusions.
- **Decision gates:**
  - If Layer A fails, halt and repair construction/calibration.
  - If Layer B shows domain-specific artifacts, diagnose nuisances before mechanism claims.
  - If Layer C reveals definition sensitivity, bound claims to specific operational choices.

## 5. Audit uncertainty and systematics
- Separate statistical, model, and assumption uncertainty.
- Evaluate selection effects, covariance validity, resolution dependence, nuisance-parameter flexibility, and calibration realism.
- Check that reported uncertainties match empirical scatter.
- **Gate:** If systematics dominate the signal or uncertainty is unquantified, stop and redesign.

## 6. Discriminate mechanisms and bound claims
- Compare hypotheses using the evidence table; exclude mechanisms that fail controls or are indistinguishable from artifacts.
- Classify each claim as supported, partially supported, inconclusive, or refuted.
- Explicitly state claim boundaries: regimes where the result applies and where it does not.
- **Gate:** If the leading mechanism remains indistinguishable from alternatives, return to Step 2 or 3.

## 7. Iterate or terminate
- If inconclusive, propose the next minimal decisive test.
- If refuted, return to hypothesis generation or experimental redesign.
- If supported, document reproducibility requirements and define release boundaries.
- **Stop conditions:**
  - The model or data cannot reproduce basic target constraints or trusted calibration.
  - Resolution, definition, or domain swaps alter conclusions without a convergence trend.
  - The signal appears only under uncontrolled settings, narrow tuning, or specific preprocessing.
  - Numerical, instrumental, or systematic artifacts fully explain the signal.
  - The mechanism is indistinguishable from alternatives with current data.

# Output Format

Produce the following artifacts:

1. **Research question and gap statement** — Target observable, latent mechanism, and decision-relevant uncertainty.
2. **Ranked hypothesis table** — Hypothesis, mechanism, evidence strength, key assumptions, likely failure modes, minimal viable test.
3. **Study design** — Variables, stratification, controls, metrics, and stop conditions.
4. **Validation plan** — Layered checks (construction/calibration, population/transfer, observable/downstream), uncertainty audit, and systematic diagnostics.
5. **Analysis plan** — Aggregate metrics, stratified diagnostics, outlier audit, ablation logic, and downstream propagation tests.
6. **Control table** — Baseline, positive, negative, strong, ablation, and domain/estimator controls with expected outcomes.
7. **Claim boundaries and failure modes** — Supported regimes, extrapolation limits, and known risks.
8. **Iteration decision** — Adopt, modify, defer, or reject; next recommended experiment if inconclusive.

# Validation Gates

- **Identifiability gate (Step 1):** The mechanism must be inferable from the available data in principle.
- **Falsifiability gate (Step 2):** At least one hypothesis must be testable with available resources.
- **Isolation gate (Step 3):** Controls must be able to separate the mechanism from nuisances.
- **Construction gate (Layer A):** Data integrity, calibration, and initial consistency must pass before signal interpretation.
- **Transfer gate (Layer B):** Signal must persist across domains, resolutions, or populations, or be explicitly bounded.
- **Downstream gate (Layer C):** Conclusions must survive propagation to final observables and estimator/definition swaps.
- **Uncertainty gate (Step 5):** Systematics must not dominate the signal; uncertainties must be quantified.
- **Exclusion gate (Step 6):** The preferred mechanism must be distinguishable from alternatives and artifacts.

# Claim Boundaries

- Distinguish paper-supported methodological lessons from agent inferences for a new system.
- Distinguish calibrated, inferred, extrapolated, and speculative claims.
- State regime boundaries explicitly: redshift, mass, resolution, survey depth, population type, or data-generation domain.
- Do not present single-study, single-simulation, or single-survey results as field-wide consensus.
- Label results that depend on specific operational definitions, estimators, or preprocessing as conditional.

# Failure Modes

- **Confounding:** Domain, selection, preprocessing, or covariate entanglement mimics a physical signal.
- **Shortcut learning:** Models exploit nuisance correlations instead of robust scientific signal.
- **Matched-model bias:** Synthetic data and theory predictions share simplifying assumptions, producing overly optimistic agreement.
- **Definition/estimator mismatch:** Different operational definitions produce incompatible results that are mixed without conversion.
- **Calibration breakdown:** Reference models fail on control samples, or correction terms overfit and fail to generalize.
- **Numerical or instrumental artifacts:** Discreteness, softening, boundary effects, resolution limits, detector systematics, or compression errors explain the signal.
- **Covariance misspecification or inference instability:** Incorrect covariance models or unconverged chains produce spurious precision or bias.
- **Overfitting:** Flexible nuisance models or estimator tuning absorb signal or produce unstable extrapolations.
- **Population-specific gains:** Apparent improvements vanish under stratification, ablation, or cross-domain transfer.

# Validity Checks

- **Claim boundary check:** Separate verified results from agent-generated hypotheses and extrapolations.
- **Confounder check:** Evaluate whether covariates, selection effects, or leakage create spurious associations.
- **Control check:** Confirm positive controls pass, negative controls fail, strong controls rule out overfitting, and ablations isolate mechanisms.
- **Resolution/convergence check:** Ensure conclusions persist or converge as resolution, sample size, or chain length increases.
- **Calibration check:** Verify that reference models are validated on independent data and that reported uncertainties match empirical scatter.
- **Reproducibility check:** Document assumptions, sample definitions, splits, software versions, random seeds, and analysis decisions.
- **Generalization check:** Test across domains, estimators, populations, or data-generation regimes relevant to the research question.
- **Representation-task consistency check:** For structured or learned representations, confirm that latent-space organization aligns with task-level performance.
- **Stopping check:** Halt interpretation when numerical, systematic, or instrumental artifacts can explain the signal, or when convergence is absent.

# Provenance

- Derived from cluster 35.1 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `self-consistent-galaxy-model-workflow`, `cosmology-multiprobe-forecast-design`, `cosmological-data-compression-workflow`, `dark-matter-substructure-extrapolation`, `photometric-calibration-scr-research`, `halo-mass-definition-research`, `low-resolution-spectrophotometry-research-workflow`, `cosmology-domain-adaptive-structured-inference`.
- Paper-derived reasoning patterns are reused; specific numerical results, parameters, materials, and operational protocols are excluded.
