---
name: sci-neuro-ml-assisted-mechanism-discovery-validation-wo-8e9d8f71
description: A reusable end-to-end workflow for discovering and validating latent, collective, or non-equilibrium mechanisms in complex physical, quantum, or adaptive systems using interpretable machine learning, controlled comparisons, and iterative claim bounding.
scienceevolve-title: "Neuromorphic computing and Ising optimization · ml assisted mechanism discovery validation workflow 2"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Help an agent design reproducible studies that use interpretable or physics-informed modeling to discover collective variables, adaptive mechanisms, or non-equilibrium structure, and validate them through matched baselines, controlled ablations, and explicit claim bounding. Treat each application as a new validation problem; do not treat source demonstrations as field consensus.

# When to use

Use this skill when the user asks to:

- Propose research questions about state transitions, phase boundaries, regime changes, or hidden collective variables in high-dimensional data.
- Compare classical and nonclassical (e.g., quantum or non-equilibrium) model extensions against matched baselines.
- Infer effective structure—such as order parameters, sensitivity spectra, history kernels, or latent manifolds—from observations.
- Validate whether an adaptive, driven, or collective mechanism improves explanation beyond marginal or short-range baselines.
- Design robustness checks under subsampling, perturbation, noise, distribution shift, or alternative model classes.

Do not use this skill for clinical decision-making, direct neural diagnosis, high-risk operational protocols, executable biological or material fabrication procedures, or claims that require causal intervention evidence without independent validation.

# Inputs required

Before producing a research plan, collect or infer:

- **Target system and observable type:** configurations, trajectories, fields, spike trains, spectra, or other structured measurements.
- **Baseline model or null mechanism:** the simplest explanation that must be beaten.
- **Proposed mechanism:** collective, latent, nonclassical, adaptive, history-dependent, or driven structure that may explain observed behavior.
- **Data resources:** reference/train data with known conditions; held-out/test data; control conditions.
- **Domain constraints:** known symmetries, invariants, conservation laws, or locality assumptions.
- **Practical limits:** sampling budget, compute budget, measurement noise, ethical boundaries, and reproducibility requirements.

If any input is missing, state the assumption explicitly and mark dependent conclusions as provisional.

# Core Workflow

Execute the following ordered route. At each gate, stop or redesign if the condition is not met.

1. **Frame the mechanism gap.**  
   Define the baseline model and identify exactly which assumption it fails under the proposed mechanism, drive, or representation.  
   *Gate:* If the baseline is undefined or the gap is purely predictive without mechanistic content, stop and refine the research question.

2. **Generate ranked hypotheses.**  
   Produce at least three falsifiable hypotheses linking the proposed mechanism to observable consequences. For each, specify: evidence strength (strong / moderate / weak / speculative), key assumptions, a discriminating prediction, and a likely failure mode.  
   *Gate:* If no hypothesis can be falsified with available data or simulation resources, stop.

3. **Construct a model ladder.**  
   Build a hierarchy from the simplest baseline upward:  
   marginal / independent → pairwise / short-range → latent / collective / nonclassical → domain-mechanistic interpretation.  
   Each rung must add exactly one mechanistic ingredient.  
   *Gate:* If a simpler rung explains the data within uncertainty, do not escalate complexity.

4. **Design controlled validation.**  
   Specify reference and test conditions. Define:  
   - **Negative controls:** remove or randomize the proposed structure.  
   - **Positive controls:** conditions where the target structure is known and recoverable.  
   - **Strong controls:** plausible alternative mechanisms (e.g., low-rank, classical analogue, short-memory).  
   - **Confounder controls:** separate drive effects from heating, drift, sampling bias, preprocessing artifacts, or measurement instability.  
   *Gate:* If matched controls are infeasible, downgrade all claims to speculative and flag boundary conditions.

5. **Infer effective structure.**  
   Fit models from reference data using tractable objectives (likelihood, pseudo-likelihood, bound surrogate, or comparable). Extract descriptors: order parameters, sensitivity spectra (stiff vs. sloppy directions), history kernels, latent features, or symmetry-aligned representations.  
   *Gate:* If inference is unstable under resampling, initialization, or perturbation, halt and diagnose identifiability before interpreting structure.

6. **Evaluate predictive and structural evidence.**  
   Test held-out likelihood, reconstruction, task performance, or decoding accuracy. Inspect whether gains survive marginal controls and whether inferred structure is stable across subsamples, regimes, and preprocessing choices.  
   *Gate:* If held-out performance does not improve over the best simpler ladder rung, reject the mechanism at this complexity level and return to Step 3.

7. **Probe regimes and boundaries.**  
   Scan control parameters or contextual variables to locate transitions, uncertainty maxima, or qualitative changes. Compare against independent descriptors or naturalistic input statistics.  
   *Gate:* If boundary estimates shift unpredictably across independent samples or depend on arbitrary coordinate choices, stop and redesign sampling or representation.

8. **Discriminate mechanisms.**  
   Use ablations and matched baselines to attribute gains to the proposed mechanism rather than added capacity, optimization artifacts, or confounders. Separate claims about expressivity, trainability, sampling validity, and task performance.  
   *Gate:* If ablated or classical controls perform equally well, exclude the proposed mechanism.

9. **Bound claims and iterate.**  
   Distinguish effective statistical structure from direct mechanistic causality. Label each conclusion as paper-supported, agent-inferred, or speculative. State boundary conditions (system class, noise level, regime).  
   *Iteration trigger:* If results are ambiguous, return to Step 3 with a revised ladder or Step 4 with stronger controls.  
   *Stop condition:* Stop when the mechanism is interpretable, robust under controls, and bounded by explicit extrapolation limits.

# Output Format

When using this skill, return:

1. **Research question** — concise question with domain boundary and mechanistic focus.
2. **Ranked hypotheses** — table with mechanism, evidence strength, key assumptions, discriminating prediction, and likely failure mode.
3. **Model ladder** — baseline → structured → latent → domain, noting what each rung explains and why escalation is or is not justified.
4. **Validation plan** — reference/test conditions, control types, conceptual variables, evaluation metrics, and stop conditions.
5. **Analysis plan** — inference strategy, predictive checks, structural stability checks, regime probing, and uncertainty quantification.
6. **Iteration plan** — how supportive, neutral, contradictory, or ambiguous results update each hypothesis.
7. **Claim boundary statement** — what is supported, inferred, or speculative; validity limits and extrapolation boundaries.
8. **Provenance note** — cluster and source-skill references, not paper conclusions.

# Validation Gates

Before presenting results, confirm:

- **Baseline validity:** controls isolate the proposed structure and are matched for information and optimization budget.
- **Identifiability:** the mechanism is distinguishable from simpler baselines and known confounders.
- **Statistical validity:** held-out splits, confidence intervals, resampling, and multiple-comparison risks are handled.
- **Computational validity:** inference is tractable and not dominated by numerical instability or convergence artifacts.
- **Sampling validity:** empirical samples or approximations are checked against exact or high-confidence references when feasible.
- **Conditioning validity:** clamping, marginalization, or approximate conditional procedures match the task definition.
- **Reproducibility validity:** preprocessing, seeds, splits, model choices, and failed attempts are documented.

# Claim Boundaries

- Effective couplings, latent features, order parameters, sensitivity directions, and history kernels are descriptive statistical constructs unless independent causal or domain evidence supports a stronger claim.
- Do not equate model improvement with proof of the proposed physical, quantum, or biological mechanism.
- Distinguish exact small-system evidence from approximate large-system evidence.
- Separate hardware-dependent or simulation-specific results from general mechanism claims.
- Mark every conclusion with evidence strength and explicit boundary conditions.

# Failure Modes

- **Confounding by observability:** low-activity or poorly observed components bias inferred structure.
- **Technical drift:** recording, preprocessing, or tracking instability mimics mechanism.
- **Model dependence:** alternative model classes produce different sensitive directions or latent features.
- **Surrogate mismatch:** bound, relaxation, or approximate objective diverges from the target loss.
- **Capacity artifacts:** gains come from added parameters rather than the proposed mechanism.
- **Non-identifiability:** multiple mechanisms explain the same observable equally well.
- **Overgeneralization:** single-system, small-scale, or single-regime results treated as field consensus.

# Validity Checks

- Does the model reduce to the known baseline when the proposed mechanism or drive is absent?
- Are deterministic and stochastic effects explicitly separated?
- Are positive, negative, strong, sampling, and representation controls included?
- Do results persist under held-out validation, resampling, and alternative preprocessing?
- Are uncertainty estimates reported for fitted effective quantities and boundary locations?
- Are claims limited to the tested system and clearly labeled by support level?
- Can another researcher reproduce the analysis from the described model and data treatment?

# Provenance

- Synthesized from cluster 25.0 (machine-learning-assisted mechanism discovery and validation).
- Derived from source skills: statistical-physics-representation-exploration, neural-network-sloppiness-research-design, quantum-boltzmann-research-design, temporal-adaptation-efficient-coding, spin-torque-non-equilibrium-activation, bound-constrained-quantum-probabilistic-research, neural-adaptive-history-workflow, physics-informed-explainable-ml-skill.
- Source papers provide methodological patterns only; all claims must be re-validated for each new system, dataset, and model class.
