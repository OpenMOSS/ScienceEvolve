---
name: sci-neuro-ml-mechanism-discovery-validation-workflow-88b855cb
description: Design and execute end-to-end mechanism-discovery studies using machine learning, with control-rich validation, uncertainty auditing, and bounded claims across scientific domains.
scienceevolve-title: "Neuromorphic computing and Ising optimization · ml mechanism discovery validation workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Use this skill to design and execute reusable, end-to-end research workflows for discovering and validating mechanisms in complex systems using machine learning. It provides a science-first pattern that separates mechanism hypotheses from benchmark performance, enforces control-rich validation, and bounds claims by evidence strength and domain regime.

# When to use

Use this skill when the user asks to:

- Propose and test mechanism-driven hypotheses in scientific ML settings such as quantum, cosmological, neuromorphic, time-series, or robustness domains.
- Design experiments that compare learned representations, sampling strategies, augmentations, or platform behaviors against strong baselines and domain constraints.
- Validate whether an observed ML improvement arises from a proposed mechanism rather than confounding, leakage, or shortcut learning.
- Iterate from minimal validation to scaled studies with explicit stopping conditions and claim boundaries.

Do not use this skill for operational deployment of safety-critical systems, clinical decision-making, or as a substitute for domain-specific regulatory validation.

# Inputs required

Before generating a plan, collect or infer:

- **Target phenomenon or inference task** and its scientific or operational context.
- **Candidate mechanism** or structural hypothesis linking model behavior to system properties.
- **Available data modalities**, simulation environments, or measurement channels.
- **Baseline methods** and trusted references for comparison.
- **Evaluation priorities**: predictive quality, calibration, robustness, interpretability, computational cost, or downstream utility.
- **Constraints**: compute budget, risk level, reproducibility requirements, and ethical boundaries.

# Core Workflow

Follow this ordered route from hypothesis to bounded claim. Do not skip stages.

### 1. Frame the scientific gap and mechanism hypothesis
State the target phenomenon and why existing explanations are insufficient. Propose a mechanism that links a specific structural cause to an observable effect.  
**Decision gate:** Is the hypothesis falsifiable and scoped to a specific regime? If not, reformulate before proceeding.

### 2. Architect the study
Select representations, data modalities, baseline methods, and evaluation metrics. Define independent variables, dependent variables, and nuisance factors. Build a ladder of controls: baseline, negative, positive, ablation, and randomization.  
**Decision gate:** Do controls isolate the claimed mechanism from confounders? If not, add controls or narrow the scope.

### 3. Minimal viable validation (MVV)
Execute the smallest experiment that can falsify the core hypothesis. Inspect representation stability, signal coherence, and control behavior.  
**Stop condition:** If MVV fails, controls are violated, or results are artifact-dominated, stop and redesign before scaling.

### 4. Staged evidence collection
Collect downstream performance, distributional, and mechanistic metrics across relevant regimes. Maintain strict separation between training, validation, and held-out test conditions. Sweep perturbation families, operating points, or data subdomains that stress the mechanism.

### 5. Uncertainty and robustness audit
Quantify statistical uncertainty across seeds, splits, initializations, or realizations. Test sensitivity to distribution shift, adversarial conditions, or domain variation. Check for leakage, shortcut learning, and evaluation mismatch.  
**Decision gate:** Do results remain stable under resampling and perturbation? If not, bound claims to stable regimes only.

### 6. Mechanism discrimination and exclusion
Use ablations and diagnostics to compare the proposed mechanism against alternative explanations. Determine whether observed effects arise from the intended cause or from capacity differences, preprocessing artifacts, or spurious correlations.  
**Decision gate:** Can alternative explanations be ruled out? If not, weaken claims to partial support or correlation.

### 7. Calibration and coordinate mapping
Relate learned, variational, or generated coordinates to physically meaningful or task-relevant quantities. Verify consistency across multiple observables or metrics.  
**Decision gate:** Does the mapping remain consistent across regimes? If calibration drifts, diagnose representation or manifold error before claiming validity.

### 8. Iterate or redesign
- **If evidence supports the hypothesis:** plan stronger validation or scale to harder regimes.
- **If evidence is mixed:** update assumptions and run targeted diagnostics.
- **If evidence refutes the hypothesis:** document failure modes and pivot or abandon.  
**Stop condition:** Predefined stopping rules are met (robustness threshold, overhead budget, claim boundary, or safety limit).

### 9. Bound claims and package outputs
Classify conclusions by evidence strength: supported, partially supported, or speculative. State explicit applicability boundaries. Document reproducibility artifacts and residual risks.

# Output Format

When using this skill, return a concise research package with:

1. **Research question and scoped hypothesis** — one clear question tied to a domain gap and the mechanism under test.
2. **Hypothesis table** — columns: hypothesis, evidence strength, key assumptions, predicted outcome, likely failure mode, minimal test.
3. **Experimental design** — variables, controls, metrics, MVV plan, and stop conditions.
4. **Analysis plan** — signal/representation inspection, distributional checks, downstream evaluation, and mechanism diagnostics.
5. **Iteration log** — evidence updates, revision actions, and the next minimal test.
6. **Validity and ethics statement** — confounders, boundaries, reproducibility requirements, and safety limits.

# Validation Gates

- **Falsifiability gate:** The hypothesis must be testable by a minimal experiment.
- **Control gate:** Negative, positive, ablation, and baseline controls must be defined before execution.
- **Coherence gate:** Generated representations, signals, or predictions must pass domain-plausibility checks.
- **Stability gate:** Results must replicate across seeds, splits, or realizations within stated uncertainty.
- **Mechanism-exclusion gate:** Alternative explanations must be addressed before claiming causal support.
- **Calibration gate:** Learned coordinates or uncertainties must align with target quantities across multiple observables.
- **Overhead gate:** Cost and complexity must remain within the deployment or compute budget.

# Claim Boundaries

- Distinguish paper-supported patterns from agent inferences and speculative extensions.
- State the exact regimes (data types, system sizes, temperature ranges, perturbation families, threat models) where claims are tested.
- Do not extrapolate beyond the validated domain without labeling the claim as speculative.
- Separate optimization quality from sampling or mechanistic quality when relevant.

# Failure Modes

- **Representation mismatch:** The chosen encoding does not preserve task-relevant structure.
- **Confounding:** Gains arise from data leakage, preprocessing, capacity differences, or evaluation artifacts.
- **Shortcut learning:** The model exploits spurious correlations rather than the intended mechanism.
- **Artifactual robustness:** Defenses or improvements appear strong due to evaluation mismatch or gradient masking.
- **Calibration drift:** Learned coordinates or uncertainties become inconsistent across regimes.
- **Narrow validity:** Results hold only for a specific seed, split, benchmark, or narrow workload.
- **Extrapolation collapse:** Performance degrades outside the training or calibration domain.

# Validity Checks

- **Confounding and leakage:** Verify splits, duplicates, shared provenance, and temporal leakage.
- **Baseline adequacy:** Compare against domain-standard and simple strong baselines.
- **Statistical validity:** Report uncertainty, repeated runs, and appropriate multiple-comparison controls.
- **Reproducibility:** Document seeds, preprocessing, model configurations, and evaluation protocols.
- **Interpretability:** Confirm that diagnostics align with the proposed mechanism, not just architecture.
- **Boundary documentation:** Explicitly note where the method should not be used.

# Provenance

- Synthesized from cluster 11.0 (machine-learning-assisted mechanism discovery and validation).
- Source skill references: `geometric-timeseries-augmentation-research`, `astronomy-ml-research-design`, `analog-dnn-noise-propagation-research`, `federated-adversarial-robustness-workflow`, `quantum-annealing-sampling-research-design`, `neural-thermal-variational-research`, `physics-guided-cosmology-research`, `neuromorphic-platform-research-design`.
- No specific paper parameters, numerical results, or operational protocols are included.
