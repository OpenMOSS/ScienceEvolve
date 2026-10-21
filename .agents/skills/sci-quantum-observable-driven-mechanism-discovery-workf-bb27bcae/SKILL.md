---
name: sci-quantum-observable-driven-mechanism-discovery-workf-bb27bcae
description: A reusable end-to-end workflow for discovering and validating hidden mechanisms behind anomalous observables through baseline comparison, hypothesis generation, controlled validation, and iterative model discrimination.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 19"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to discover and validate hidden mechanisms behind anomalous observables by structuring baseline comparison, latent-variable hypothesis generation, controlled validation, model discrimination, and iterative refinement into a single reusable workflow.

# When to use

Use this skill when:
- A target system shows reproducible deviations from an established baseline model or expected monotonic behavior.
- Existing descriptions are too simple to capture finite-size, fluctuation, boundary, correlation, or hidden-state effects, yet too detailed to apply generally.
- The goal is to propose new research questions, design validation studies, or discriminate among competing mechanisms using independent observables and strong controls.
- The user provides a baseline model, candidate observables, and constraints on data, simulations, or computations.

Do not use this skill for operational experimental protocols, hazardous physical procedures, instrument engineering, or as a substitute for domain-specific safety review.

# Inputs required

Before executing the workflow, obtain or infer:

1. **Target observable and baseline model**: the expected behavior and the model that currently describes it.
2. **Anomaly or residual gap**: the systematic deviation, non-monotonicity, or unexplained variation that motivates new mechanism exploration.
3. **Candidate mechanisms**: proposed hidden states, latent variables, missing interaction channels, or coarse-graining alternatives.
4. **Available evidence streams**: independent datasets, simulations, literature benchmarks, or scaling laws.
5. **Validation resources**: feasible controls, perturbations, cross-checks, and computational or observational budgets.
6. **Decision criteria**: pre-defined thresholds for what constitutes support, failure, or the need to revise assumptions.

# Core Workflow

Execute the following ordered route. At each gate, decide whether to proceed, iterate, or stop.

## 1. Baseline and anomaly characterization
- Define the observable operationally and state the baseline prediction.
- Quantify the deviation, residual scatter, or regime change.
- **Gate 1 — Reproducibility Gate**: Is the anomaly robust across independent samples, data cuts, preprocessing choices, or ensemble members?
  - **NO**: Document as likely artifact, noise, or confounding; stop or redesign measurement.
  - **YES**: Freeze the anomaly definition and proceed.

## 2. Mechanism hypothesis generation
- Propose the smallest set of hidden-state, latent-variable, or missing-physics hypotheses that could explain the anomaly.
- For each hypothesis, specify: evidence strength, key assumptions, discriminating predictions, and likely failure modes.
- Rank hypotheses by falsifiability, explanatory reach, and compatibility with known limiting behavior.
- **Gate 2 — Falsifiability Gate**: Can at least one orthogonal test distinguish each hypothesis from the baseline and from one another?
  - **NO**: Refine mechanisms or seek additional observables; iterate.
  - **YES**: Proceed with ranked hypotheses.

## 3. Validation design
- Define a minimal viable validation: one primary observable for the mechanism and one for the baseline.
- Specify controls:
  - **Baseline control**: expected behavior without the proposed mechanism.
  - **Negative control**: condition where the mechanism should be absent or suppressed.
  - **Positive control**: condition where the mechanism should be recoverable or amplified.
  - **Strong control**: independent observable sharing nuisance parameters but differing in signal sensitivity.
- State evaluation metrics, nuisance variables, and pre-registered stopping conditions.
- **Gate 3 — Feasibility Gate**: Can the minimal validation be executed with available resources?
  - **NO**: Downscope to a decisive proxy or pause pending data.
  - **YES**: Lock the design and proceed.

## 4. Execution and evidence collection
- Collect data or run simulations according to the locked design.
- Pre-register the analysis plan; separate confirmatory statistics from exploratory diagnostics.
- Extract observables, uncertainties, and control outcomes before model fitting.
- **Gate 4 — Consistency Gate**: Do independent evidence streams agree on sign, trend, and magnitude?
  - **NO**: Diagnose confounding, calibration, or systematic error; iterate.
  - **YES**: Proceed to discrimination.

## 5. Mechanism discrimination
- Compare each hypothesis against the baseline and against alternative models using the pre-defined metrics.
- Inspect residuals for systematic structure that indicates missing physics or definition artifacts.
- Test sensitivity to parameter choices, coarse-graining definitions, and boundary conditions.
- **Gate 5 — Identifiability Gate**: Does the preferred mechanism survive robustness checks and remain distinguishable from simpler alternatives?
  - **NO**: Demote to phenomenological, discard, or redesign test.
  - **YES**: Proceed to claim bounding.

## 6. Claim bounding and iteration
- Bound all claims to the validated regime, model class, and observable set.
- Document failure modes, residual risks, and any speculative extensions.
- **Gate 6 — Stop/Redirect Gate**:
  - **STOP** if the anomaly collapses to baseline under controls, if uncertainty overwhelms the effect, or if the mechanism requires untestable assumptions.
  - **ITERATE** if results are partial: revise the hidden-state definition, add a discriminating test, or narrow the domain of applicability.
  - **ACCEPT** if the mechanism is robust across controls, independent observables, and plausible perturbations; plan follow-up that changes one axis at a time.

# Output Format

Each execution should produce:

1. **Research question** — one concise question and its domain boundary.
2. **Gap diagnosis** — baseline strengths, baseline limitations, and why a new mechanism may be needed.
3. **Ranked hypotheses** — mechanism, evidence strength, key assumptions, testable predictions, and likely failure modes.
4. **Validation plan** — minimal viable validation, controls, variables, metrics, and stopping conditions.
5. **Analysis plan** — consistency checks, comparison strategy, uncertainty handling, and scaling or invariance tests.
6. **Iteration plan** — decision rules for null results, partial success, dataset tension, and model updates.
7. **Claim boundary statement** — applicability limits, confounders, reproducibility requirements, and residual risks.

# Validation Gates

The six gates in Core Workflow serve as the validation backbone:

| Gate | Purpose | Pass Criteria | Fail Action |
|---|---|---|---|
| Reproducibility | Confirm anomaly is real | Robust across cuts/samples | Stop or redesign |
| Falsifiability | Ensure hypotheses are testable | Orthogonal discriminant exists | Refine hypotheses |
| Feasibility | Confirm resources suffice | Minimal validation executable | Downscope or pause |
| Consistency | Confirm cross-stream agreement | Sign/trend/magnitude agree | Diagnose confounding |
| Identifiability | Confirm mechanism is distinguishable | Survives robustness checks | Demote or discard |
| Stop/Redirect | Decide termination or continuation | Clear accept/iterate/stop rule | Document and exit |

# Claim Boundaries

- Treat a single successful model fit or study as evidence for a mechanism, not as proof of universal presence.
- Distinguish observed results, model-supported inferences, and speculative extensions.
- Do not extrapolate beyond the validated regime, model class, or observable set without labeling the conclusion as speculative.
- Avoid presenting agent-generated extrapolations as field-wide consensus.

# Failure Modes

- **Artifact misidentification**: An anomaly driven by preprocessing, calibration drift, or finite sampling is mistaken for a physical mechanism.
- **Confounding by nuisance variables**: A hidden variable correlated with the proposed mechanism produces the same signature.
- **Overfitting**: Added model complexity improves fit without independent predictive gain.
- **Non-identifiability**: Competing hypotheses produce indistinguishable distributions or trends.
- **Circular definition**: The mechanism is defined using the same observable it purports to explain.
- **Insufficient sampling**: Rare events or high-order statistics are estimated from inadequate data.
- **Boundary violation**: Claims are extended to regimes where baseline assumptions, coarse-graining, or approximations break down.

# Validity Checks

Before finalizing any plan or result, verify:
- **Confounding**: Could standard backgrounds, environmental effects, measurement artifacts, or model choices reproduce the apparent signature?
- **Reproducibility**: Are results stable across independent datasets, ensembles, initial conditions, or subsamples?
- **Statistical validity**: Are uncertainties, covariances, multiple-comparison effects, and look-elsewhere issues handled appropriately?
- **Limiting behavior**: Does the extended model recover the baseline where it should?
- **Thermodynamic or structural consistency**: Do predicted relationships among observables agree with each other?
- **Model identifiability**: Can the data distinguish the proposed mechanism from simpler alternatives?
- **Boundary conditions**: Are claims limited to the validated state region, model class, and available observables?
- **Documentation**: Are data transformations, model definitions, fitting choices, and random seeds documented for independent rerun?

# Provenance

Synthesized from cluster 29.0 (subcluster 29.0), workflow archetype "observable-driven mechanism discovery and validation". Source skills: thermodynamic-kinetic-nucleation-exploration (38f547ea1e8e3b1e), cosmic-ray-dark-matter-research-design (4281cc365388fbe6), turbulence-superstatistics-research-agent (c913366251dc5370), complex-systems-entropy-exploration (arxiv-cmoat__2606.16312), protein-folding-rate-heterogeneity-exploration (84fa9b5b5936923d), landscape-anomaly-liquid-criticality (61a86fd60484abf4), nanofriction-competing-timescale-workflow (b48e3784bacf73e1), tmdc-quasiparticle-research-workflow (d72819924477ae97).
