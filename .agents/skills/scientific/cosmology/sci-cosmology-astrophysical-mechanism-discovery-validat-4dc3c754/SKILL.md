---
name: sci-cosmology-astrophysical-mechanism-discovery-validat-4dc3c754
description: A reusable end-to-end workflow for designing astrophysical research plans that turn observable phenomena into ranked mechanism hypotheses, controlled validation tests, and bounded claims using multi-evidence analysis and simulation plausibility checks.
scienceevolve-title: "Galaxy, cosmology, and simulations · astrophysical mechanism discovery validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

This skill guides an agent in designing reproducible research plans for astrophysical and cosmological systems where the goal is to discover and validate mechanisms behind observable phenomena. It structures the process from initial phenomenon framing through multi-evidence analysis, controlled comparison, simulation plausibility testing, and iterative claim refinement, ensuring that conclusions are bounded by evidence strength and explicitly tested against systematic alternatives.

## When to use

Use this skill when the user wants to:

- Propose or evaluate research questions about cosmic structures, galaxy systems, diffuse media, or gravitational phenomena where multiple physical mechanisms could explain the same observable signature.
- Compare competing mechanisms such as feedback-driven transport, hierarchical assembly, environmental processing, projection effects, or selection biases.
- Design simulation-observation bridge studies, multi-tracer validation plans, or null-test frameworks.
- Discriminate genuine physical signals from foregrounds, backgrounds, calibration artifacts, or model systematics.
- Generate ranked hypotheses with explicit failure modes, controls, and stopping conditions.

Do not use this skill for operational telescope or detector control, hardware commissioning, laboratory safety procedures, or as a substitute for domain-specific simulation code. Do not treat single-study findings as field-wide consensus.

## Inputs required

Before producing a research plan, identify or request:

- **Target phenomenon and system class:** the observable pattern, physical regime, and environment under study.
- **Available evidence streams:** observational data types (imaging, spectroscopy, astrometry, time-domain), simulation outputs, catalogs, or literature constraints.
- **Baseline model and null expectation:** the best-understood predictive framework and what it predicts for the observable.
- **Candidate mechanisms:** physical processes, systematic effects, and nuisance factors that could produce the observed signature.
- **Known confounders and systematics:** selection functions, projection effects, calibration limits, completeness, contamination, and resolution boundaries.
- **Desired claim type:** detection, classification, physical interpretation, model comparison, or methodological improvement.
- **Constraints:** computational resources, reproducibility requirements, data licensing, and feasibility limits.

If inputs are missing, state assumptions explicitly and label all downstream conclusions as provisional.

## Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, stop or redesign before proceeding.

1. **Frame the Phenomenon and Gap**
   - State the observable pattern, discrepancy, or tension.
   - Separate measured quantities from physical interpretations.
   - Identify the specific evidence gap that prevents decisive mechanism attribution.
   - **Gate:** If the phenomenon cannot be expressed as a falsifiable question or no null expectation exists, stop and reformulate.

2. **Generate Competing Mechanism Hypotheses**
   - Produce at least three hypotheses: the leading physical mechanism, at least one alternative physical mechanism, and at least one systematic or nuisance explanation.
   - For each hypothesis, record: concise claim, mechanism class, evidence strength (strong / moderate / weak / speculative), key assumptions, expected discriminating signatures, and likely failure modes.
   - **Gate:** If only one hypothesis is conceivable, construct an explicit null or control hypothesis to enable falsification.

3. **Design Controlled Validation**
   - Define **minimal viable validation**: the smallest test that can reject the weakest version of a hypothesis.
   - Specify **controls**:
     - Negative controls: samples or synthetic data where the proposed signal should be absent.
     - Positive controls: established cases or simulated injections where the signal should be recoverable.
     - Robustness controls: alternative definitions, cuts, calibration checks, and parameter variations.
     - Population controls: matched field or unrelated samples processed through the same pipeline.
   - Define independent variables, dependent variables, nuisance variables, and primary metrics.
   - **Gate:** If no credible negative or positive control can be constructed, downgrade the study to exploratory and flag the limitation.

4. **Execute Multi-Evidence Analysis**
   - Analyze independent evidence streams separately before combining (e.g., spatial, kinematic, spectroscopic, photometric, simulation-derived).
   - Fit the baseline model and inspect residuals against calibrated background or null expectations.
   - Compare observed signatures with generic simulation scenarios or analytic plausibility models to test degeneracy, not to assert a unique history.
   - **Gate:** If independent diagnostics contradict one another, pause to inspect confounders, projection effects, or calibration mismatches before combining.

5. **Mechanism Discrimination and Claim Grading**
   - Evaluate each hypothesis against control outcomes and diagnostic agreement.
   - Exclude mechanisms that fail controls or are reproduced by known systematics.
   - Grade each conclusion:
     - **Observed:** directly measured with minimal model dependence.
     - **Inferred:** supported by multiple independent diagnostics and rejected alternatives.
     - **Speculative:** motivated by analogy or limited data; requires further testing.
   - **Gate:** If the leading mechanism cannot be separated from an unassigned residual class or correlated nuisance, demote it to inconclusive.

6. **Uncertainty Audit and Robustness Check**
   - Test sensitivity to sample selection, aperture definitions, smoothing parameters, background models, membership criteria, projection corrections, and priors.
   - Verify that candidate structures or trends persist across reasonable algorithmic choices and sub-samples.
   - **Gate:** If the signal disappears or reverses under robust variations, downgrade or reject the associated claim.

7. **Iterate or Redesign**
   - **If supported:** strengthen by adding independent diagnostics, broader samples, or hierarchical modeling; define explicit boundary conditions (mass, redshift, environment, tracer).
   - **If inconclusive:** identify the limiting factor (low information, model degeneracy, unresolved systematics) and redesign the test.
   - **If rejected:** generate follow-up questions and alternative hypotheses.
   - **Stop conditions:**
     - Controls fail to separate mechanism from nuisance.
     - Effect vanishes under matched controls or reasonable parameter variations.
     - Measurement uncertainty dominates the predicted effect.
     - The hypothesis becomes unfalsifiable with available data.
     - Shared-parameter combination across heterogeneous units is unjustified.

## Output Format

When using this skill, return:

1. **Problem framing** — Phenomenon, target regime, available evidence, and gap statement.
2. **Ranked hypothesis table** — Mechanism class, claim, evidence strength, key assumptions, expected signatures, failure modes, and minimal validation for each hypothesis.
3. **Experimental design** — Variables, controls (negative, positive, robustness, population), metrics, minimal viable validation, strong validation path, and stop conditions.
4. **Analysis plan** — Multi-evidence workflow, baseline fitting, residual analysis, simulation plausibility comparison, and robustness checks.
5. **Iteration roadmap** — Rules for upgrading, downgrading, splitting, or replacing hypotheses based on possible outcomes.
6. **Validity and boundary statement** — Confounders, reproducibility requirements, statistical limits, untested regimes, and ethics or compliance constraints.

## Validation Gates

Pass each gate before advancing to the next workflow stage or finalizing outputs:

- **Gap clarity gate:** The phenomenon is separated from interpretation and framed as a falsifiable question.
- **Hypothesis diversity gate:** At least one physical alternative and one systematic alternative are explicitly considered.
- **Control feasibility gate:** Negative and positive controls are defined and matched in sensitivity, selection, and calibration.
- **Diagnostic independence gate:** Evidence streams are genuinely independent, not redundant summaries of the same information.
- **Simulation scope gate:** Simulations are scoped as plausibility and degeneracy probes, not as observational proof.
- **Robustness gate:** Conclusions survive reasonable variations in definitions, samples, and nuisance models.
- **Claim calibration gate:** Final wording matches the assigned evidence strength and does not overstate single-study results as consensus.

## Claim Boundaries

Do not claim:

- That a single observed system or simulation suite proves a universal population law.
- That simulation agreement with observations constitutes unique observational confirmation.
- That residual or unassigned processes are confirmed mechanisms.
- Causal dominance without showing that the effect persists after matched controls and mechanism-specific decomposition.
- Extrapolations beyond tested mass, redshift, environment, or tracer regimes without labeling them as speculative.

Always distinguish observed quantities, inferred mechanisms, and speculative evolutionary outcomes.

## Failure Modes

This workflow can fail or be misapplied when:

- A hypothesis is constructed to be unfalsifiable with available data or controls.
- Controls are mismatched in sensitivity, selection function, or calibration, producing false separation or false agreement.
- Independent diagnostics are conflated or are actually dependent summaries of the same underlying data.
- Simulations are interpreted as proof of a unique history rather than as tests of plausibility and degeneracy.
- A claim is generalized from a single sample, epoch, or model suite to an entire population.
- Iteration continues despite met stop conditions, producing unfounded confidence.
- Projection, foreground, or systematic effects are mistaken for physical signal because nuisance models are inadequate.

## Validity Checks

Before finalizing the research plan or any claim, verify:

- **Selection effects:** Could the sample definition, completeness, or eligibility criteria create the apparent pattern?
- **Calibration and systematics:** Could instrument, survey, reduction, or model choices explain the signal?
- **Contamination:** Are unrelated populations, foregrounds, backgrounds, interlopers, or duplicates present?
- **Model dependence:** Does the conclusion rely on a specific prior, parametrization, subgrid model, or algorithmic choice?
- **Statistical validity:** Are uncertainties, intrinsic scatter, sample sizes, and multiple-comparison risks handled appropriately?
- **Reproducibility:** Are sample definitions, exclusions, model versions, random seeds, and analysis pipelines documented?
- **Boundary conditions:** Which system classes, redshift ranges, environments, and data qualities remain untested?
- **Causal language discipline:** Are dominant-driver and mechanism claims framed as conditional on sample, measurement, and model assumptions?

## Provenance

- Synthesized from cluster 32.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: hierarchical-stellar-structure-research; galaxy-spin-evolution-research-design; gravitational-wave-baseline-consistency-research; cosmic-web-multitracer-exploration; cosmic-chemical-evolution-exploration; icm-chemical-enrichment-research; icm-metallicity-scaling-research-design; astronomy-research-question-validation-workflow.
- Methodological patterns abstracted from multi-evidence phase-space assembly, baseline-consistency exploration, source-transport-reservoir-observable coupling, and simulation-observation bridge studies. No specific paper conclusions, numerical results, or operational protocols are included.
