---
name: sci-neuro-ml-assisted-mechanism-discovery-validation-wo-e4395e56
description: A reusable end-to-end workflow for discovering and validating candidate mechanisms in complex systems through hypothesis-driven surrogate modeling, nested baselines, and controlled machine learning comparison.
scienceevolve-title: "Neuromorphic computing and Ising optimization · ml assisted mechanism discovery validation workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

This skill guides agents to design reusable research plans that use machine learning as a disciplined tool for mechanism discovery and validation. It abstracts a shared pattern across physical, neural, and material domains: define a measurable phenomenon, generate competing mechanistic hypotheses, build a ladder of nested surrogate models with matched controls, and validate claims through held-out discrimination tests rather than predictive accuracy alone.

# When to use

Use this skill when the user asks to:

- Propose research questions about history-dependent, collective, emergent, or non-local behavior in physical, neural, or material systems.
- Compare mechanism-informed surrogates against generic baselines using controlled experiments or simulations.
- Design validation plans that discriminate between competing mechanisms rather than only optimizing fit.
- Iterate between hypothesis generation, model comparison, and claim bounding after preliminary results.

Do not use this skill for operational wet-lab protocols, clinical recommendations, safety-critical deployment decisions, or hazardous procedural instructions.

# Inputs required

Ask for or infer the following before producing a plan:

- Target system and the observable phenomenon or response quantity to be explained.
- Candidate mechanisms or governing processes thought to control the phenomenon.
- Available reference data and their provenance (experimental, simulation, literature, or synthetic).
- Baseline models or null hypotheses already used in the field.
- Dependency classification: whether behavior depends on current state, summarized history, full history, collective modes, or non-local interactions.
- Intended domain of applicability and known boundary conditions.
- Constraints on data generation, measurement cost, computation, or validation access.
- Candidate confounders and failure modes relevant to the system.

# Core Workflow

Follow this ordered route. At each decision gate, stop or iterate if the condition is not met.

1. **Phenomenon audit and gap definition**
   - Define the target signature and the baseline expectation.
   - Audit data for stationarity, sampling bias, selection effects, and preprocessing artifacts.
   - *Decision gate:* If the signature is unstable or likely artifactual, stop and revise data curation before proceeding.

2. **Dependency and mechanism diagnosis**
   - Classify the dependency structure (state-only, summarized-history, full-history, collective, or non-local).
   - Identify the explanatory gap: what current models or descriptions cannot yet distinguish.
   - *Decision gate:* If the dependency structure cannot be defined from available information, stop and collect more informative observations.

3. **Hypothesis generation**
   - Generate at least three competing mechanism hypotheses (e.g., local vs. non-local, structure-only vs. physics-informed, global vs. feature-specific).
   - For each hypothesis, state: evidence strength, key assumptions, distinguishing prediction, likely failure mode, and boundary conditions.
   - *Decision gate:* If hypotheses are not falsifiable with available data and models, reformulate them before proceeding.

4. **Model ladder design**
   - Construct nested baselines in order of increasing mechanistic specificity: simple baseline → generic surrogate → condition-aware model → mechanism-informed surrogate.
   - Match capacity, search budget, and training protocol across candidates to isolate the mechanism contribution.
   - *Decision gate:* If the proposed mechanism cannot be isolated via ablation, descriptor substitution, or architectural contrast, redesign the representation.

5. **Control and validation planning**
   - Define positive, negative, strong, boundary, and surrogate controls that isolate the target mechanism.
   - Plan data splits by trajectory identity, structure, condition, or time to prevent leakage; explicitly separate interpolation tests from extrapolation tests.
   - *Decision gate:* If the control set cannot discriminate the target mechanism from confounds, expand controls before execution.

6. **Training and comparative evaluation**
   - Fit all candidate models under the matched protocol.
   - Evaluate on frozen held-out sets using both aggregate metrics and mechanism-specific diagnostics.
   - *Iteration gate:* If generic baselines match or outperform the mechanism-informed model, return to Step 3 to refine hypotheses or descriptors.

7. **Mechanism discrimination and interpretation**
   - Attribute performance differences to the proposed mechanism using ablation, feature importance, sensitivity analysis, or reduced-model analysis.
   - Check whether improvement is explained by confounders (e.g., size, density, source bias, correlated descriptors).
   - *Decision gate:* If interpretation conflicts with the hypothesis or relies on spurious correlates, downgrade the claim and return to Step 4.

8. **Robustness and boundary testing**
   - Test stability across random seeds, split strategies, preprocessing choices, and input perturbations.
   - Probe domain boundaries to identify where the surrogate fails or changes regime.
   - *Stop condition:* If the mechanism-specific improvement is not robust, narrow the applicability domain or stop the claim.

9. **Claim bounding and reporting**
   - Classify each conclusion as verified (held-out evidence), inferred (model-supported), or speculative (untested).
   - State the applicability domain, boundary conditions, and unresolved failure modes.
   - *Stop condition:* Finalize deliverables and freeze the research plan.

# Output Format

When using this skill, return:

1. **Research question and gap analysis:** the phenomenon, baseline expectation, and explanatory gap.
2. **Dependency diagnosis:** classification of the required input-history or interaction structure.
3. **Ranked hypotheses table:** claim, evidence strength, key assumptions, distinguishing prediction, failure mode, and boundary.
4. **Model ladder and ablation plan:** baseline, generic surrogate, condition-aware, and mechanism-informed arms with isolation logic.
5. **Control table:** positive, negative, strong, boundary, and surrogate controls.
6. **Validation plan:** split logic, interpolation vs. extrapolation regime, metrics, and stopping criteria.
7. **Analysis plan:** mechanism-specific diagnostics, confounder checks, and interpretation rules.
8. **Iteration log:** how results at each gate update or redirect the hypothesis.
9. **Claim boundary statement:** what is verified, inferred, and speculative, plus the applicability domain.
10. **Failure mode summary:** known risks and how they are mitigated.

# Validation Gates

- **Data independence:** training, validation, and test trajectories or structures must be independent; no leakage across splits.
- **Control discrimination:** positive and negative controls must produce distinguishable signatures; surrogate controls must destroy the hypothesized structure while preserving low-order statistics.
- **Metric alignment:** primary metrics must reflect mechanism discrimination and domain relevance, not only aggregate accuracy.
- **Robustness:** mechanism-specific improvements must persist across multiple seeds, split strategies, and reasonable preprocessing variations.
- **Interpretability check:** feature importance or ablation effects must align with the proposed mechanism and not be dominated by confounders.

# Claim Boundaries

- Distinguish interpolation from extrapolation; do not claim validity outside the tested domain.
- Separate verified findings (held-out tests), inferred claims (model-based explanations), and speculative extensions (untested analogies).
- Do not generalize from one system, dataset, or model class to field-wide consensus without independent evidence.
- Avoid presenting surrogate-model agreement as proof of real-world safety, reliability, or universal correctness.
- Mark all source-specific examples as non-transferable illustrations unless externally validated.

# Failure Modes

- **Missing variables or sparse coverage:** the surrogate fails because critical inputs or histories are unobserved.
- **Reference bias:** validation depends on a single benchmark or synthetic dataset that does not represent the target domain.
- **Confounded controls:** negative or surrogate controls reproduce the target signature, indicating the control does not isolate the mechanism.
- **Mechanism misattribution:** improvement is driven by correlated descriptors, model capacity, or search bias rather than the proposed mechanism.
- **Extrapolation overclaim:** performance outside the training domain is treated as validated without explicit extrapolation tests.
- **Initialization or training instability:** results are sensitive to seeds or optimization dynamics, undermining reproducibility.
- **Metric mismatch:** aggregate accuracy improves while mechanism-specific behavior degrades or remains unexamined.

# Validity Checks

Before finalizing a plan or claim, verify:

- Does the input contain enough information to distinguish the hypothesized mechanisms?
- Are training, validation, and testing splits independent and documented?
- Are success criteria and primary metrics defined before model selection?
- Are uncertainties, outliers, and negative results reported?
- Is there independent validation beyond the data used for training or hyperparameter tuning?
- Are paper-specific parameters, materials, or network sizes avoided unless clearly marked as non-transferable examples?
- Is benchmark agreement distinguished from domain consensus?
- Are confounds such as nonstationarity, selection bias, and preprocessing artifacts explicitly addressed?

# Provenance

- Synthesized from cluster 5.2 (machine-learning-assisted mechanism discovery and validation).
- Derived from source skills: path-history-constitutive-modeling, collective-mode-component-stability-neural-networks, neural-adaptation-research-workflow, physics-informed-material-property-qspr, diffusive-homeostasis-network-exploration, cortical-spike-variability-research-design, computational-neuroscience-population-analysis, temporal-snn-research-workflow.
