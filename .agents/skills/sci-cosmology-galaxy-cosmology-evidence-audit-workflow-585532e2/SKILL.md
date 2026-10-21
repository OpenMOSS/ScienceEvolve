---
name: sci-cosmology-galaxy-cosmology-evidence-audit-workflow-585532e2
description: Reusable end-to-end workflow for designing, analyzing, and auditing evidence chains that connect astrophysical mechanisms to observable signals across galaxy formation, cosmology, lensing, and simulation-observation comparisons, with explicit claim boundaries and iterative stop conditions.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cosmology evidence audit workflow 2"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Transform astrophysical research questions into auditable, end-to-end evidence chains. This workflow guides the generation of falsifiable hypotheses, the design of strong controls and minimum viable validations, the decomposition of systematic biases, and the explicit grading of claims—ensuring that conclusions about hidden physical quantities are distinguished from artifacts of selection, measurement, or model assumptions.

# When to use

- When investigating whether local or small-scale astrophysical systems encode large-scale cosmological or environmental information.
- When comparing simulation outputs to observational statistics and diagnosing whether discrepancies arise from physics, measurement protocols, or sample definitions.
- When designing studies that use multi-wavelength, multi-tracer, or time-domain data to infer hidden variables via forward-modeling, Bayesian inference, or interpretable regression.
- When auditing the strength of an existing claim by testing it against null controls, alternative models, and cross-dataset migration.
- Do not use for: executable observatory operation instructions, pure literature summaries without new hypothesis design, or black-box predictive modeling without mechanistic interpretability.

# Inputs required

- **Research question**: A clearly defined, falsifiable claim about a target parameter, scaling relation, or physical mechanism.
- **Data sources**: Simulation catalogs, observational surveys, or multi-messenger datasets with documented selection functions, redshift ranges, and error models.
- **Physical models**: Candidate mechanisms, baseline theoretical predictions, and alternative model families.
- **Proxy mappings**: Definitions linking hidden quantities to observable signals (e.g., lensing shear, dynamical tracers, surface brightness, time delays).
- **Control strategies**: Availability of positive, negative, and alternative-model controls, including mock data or shuffled labels.
- **Constraints**: Computational budget, reproducibility requirements, applicable mass/redshift/scale ranges, and known systematic uncertainty sources.

# Core Workflow

1. **Gap Formalization & Audit Scope**  
   Frame the research question as a conditional, falsifiable statement. Identify whether the gap is in physical mechanism, measurement equivalence, selection bias, or model coverage.  
   *Decision gate: Stop if the question cannot be expressed as a testable conditional claim with a predefined failure mode.*

2. **Mechanism Mapping**  
   Construct a causal chain from input physics to observable signal to measurable metric. Identify hidden variables, proxy quantities, environmental couplings, and nuisance parameters.  
   *Decision gate: Stop if no physically motivated path connects the target quantity to an observable proxy.*

3. **Hypothesis Portfolio Generation**  
   Generate at least three competing hypotheses: (i) mechanism-driven, (ii) environment-driven or selection-bias-driven, and (iii) measurement-artifact-driven. For each, specify evidence strength (strong/medium/weak), key assumptions, predicted observable signatures, and predefined failure criteria.  
   *Decision gate: Stop if the hypotheses are not mutually distinguishable with the available data modalities.*

4. **Equivalence & Control Design**  
   Establish a common measurement space between simulation and observation where applicable. Design controls:  
   - **Positive**: Known-signal recovery to validate the pipeline.  
   - **Negative**: Null/background/shuffled labels to detect spurious correlations.  
   - **Strong**: Identical pipeline with one altered module to isolate mechanism effects.  
   - **Alternative-model**: Different physics or selection functions to test model degeneracy.  
   Define quantitative stop conditions before execution.  
   *Decision gate: Stop if controls cannot isolate the target mechanism from measurement bias or known confounders.*

5. **Minimum Viable Validation (MVV)**  
   Execute the smallest analysis unit that tests the central causal link: a single simulation suite, a narrow redshift slice, a restricted parameter space, or a fast proxy model. Evaluate the signal against null and alternative controls.  
   *Iteration trigger: If null or alternative controls replicate the signal, return to Step 3 or 4 to reformulate features or controls. If the signal survives, proceed.*

6. **Full Analysis & Inference**  
   Apply the validated pipeline to the full dataset. Decompose likelihoods by independent data modalities where possible. Propagate uncertainties from measurement error, model simplification, environment, and selection function. Prefer distribution estimates over point estimates.  
   *Decision gate: Stop if systematic uncertainty equals or exceeds the target effect, if priors dominate constraints, or if convergence diagnostics fail.*

7. **Bias Decomposition & Model Comparison**  
   Quantify contributions from physical mechanisms, measurement protocols, sample selection, numerical resolution, and background contamination. Compare alternative models on equal footing (same data coverage, comparable priors).  
   *Decision gate: Stop if model degeneracy prevents distinguishing competing mechanisms, or if the result depends on an unvalidated nuisance parameter.*

8. **Evidence Grading & Claim Bounding**  
   Classify each conclusion into tiers:  
   - **Tier A**: Directly supported by current data and controls.  
   - **Tier B**: Supported only under specific model assumptions.  
   - **Tier C**: Extrapolation or inference requiring further validation.  
   - **Tier D**: Unsupported or contradicted by controls.  
   Explicitly state applicability boundaries: mass range, redshift, spatial scale, model family, and dataset scope. Distinguish simulation-internal findings from observational claims.

9. **Iteration or Termination**  
   If evidence is Tier B or C, design the next validation step (broader parameter space, independent tracer, cross-simulation migration, or refined control).  
   *Stop conditions*: Terminate if the signal is explained by confounders, if validity is restricted to a single dataset/parameter range, if key assumptions are unverifiable, or if extrapolation beyond stated boundaries is required.

# Output Format

Each invocation should produce:

1. **Research Question**: Falsifiable statement with target parameter and scope.
2. **Mechanism Map**: Causal chain from physics to observable, with key assumptions and proxy definitions.
3. **Hypothesis Portfolio**: Table of candidate hypotheses with evidence strength, assumptions, predictions, and failure modes.
4. **Experimental Design**: Variables, controls (positive/negative/strong/alternative), MVV plan, metrics, and stop conditions.
5. **Analysis Plan**: Data preparation, artificial observation pipeline (if sim-to-obs), likelihood decomposition, uncertainty propagation, and convergence checks.
6. **Bias Decomposition**: Estimated contributions from physics, measurement, selection, and numerical effects.
7. **Iteration Decision**: Next-step validation or termination rationale based on evidence tier.
8. **Validity & Boundary Statement**: Confounders checked, reproducibility requirements, statistical validity, and explicit extrapolation limits.

# Validation Gates

Before claiming success, confirm:

- **Confounder isolation**: Selection effects, environment, redshift, mass range, and measurement systematics are modeled or bounded.
- **Reproducibility**: Data versions, random seeds, code paths, selection rules, and analysis scripts are documented.
- **Statistical validity**: Independent test sets, coverage checks, convergence diagnostics, and multiple-comparison controls are applied.
- **Control integrity**: Negative controls do not produce the target signal; positive controls recover it within tolerance.
- **Boundary clarity**: Applicable ranges for mass, redshift, scale, model family, and dataset are stated; extrapolation is explicitly flagged.

# Claim Boundaries

- **Simulation-internal claims**: Findings validated only within simulated parameter spaces must not be presented as observational cosmological consensus.
- **Observable claims**: Any claim about real universes requires additional accounting for selection functions, measurement errors, completeness, and independent data validation.
- **Mechanism claims**: Attribution to a specific physical process requires that alternative models be excluded by controls, not merely that one model fits.
- **Generalization claims**: Cross-dataset or cross-redshift validity must be demonstrated, not assumed from single-suite performance.

# Failure Modes

- **Spurious correlation**: Signal arises from selection functions, sample contamination, or environmental covariance rather than the target mechanism.
- **Measurement bias misattribution**: Differences between simulation and observation are explained by proxy definitions or artificial observation pipelines, not new physics.
- **Single-dataset overfitting**: Relationship holds only in one simulation suite, redshift slice, or mass bin and fails migration tests.
- **Model leakage**: Target information enters through feature construction, sampling strategy, or simulation labels.
- **Prior dominance**: Inference results are driven by unvalidated priors rather than data.
- **Degeneracy collapse**: Multiple physically distinct models produce indistinguishable observables, preventing mechanism identification.
- **Extrapolation illusion**: Empirical fits are treated as physical laws beyond their calibrated domain.

# Validity Checks

- **Confounders**: Subgrid physics, feedback, resolution, finite volume, object definitions, line-of-sight structure, host contamination, and instrument systematics.
- **Measurement consistency**: Simulation quantities and observational proxies share common definitions; conversions are documented.
- **Reproducibility**: Fixed seeds, versioned inputs, documented pipelines, and archived intermediate products.
- **Statistical rigor**: Effect sizes with uncertainties, calibrated intervals, resampling stability, and correction for selection effects.
- **Boundary enforcement**: No extrapolation beyond verified mass, redshift, scale, or parameter ranges.
- **Model fairness**: Alternative models tested with equivalent data constraints and prior transparency.
- **Falsifiability**: Each core hypothesis has predefined observational outcomes that would weaken or invalidate it.

# Provenance

- Derived from cluster `11`, subcluster `11.0` (galaxy-cosmology-simulation-lensing-evidence-analysis).
- Synthesized from representative source skills: `galaxy-cosmology-symbolic-tracer`, `galaxy-halo-lensing-exploration`, `grb-radio-afterglow-research-planning`, `dark-matter-signal-discovery-workflow`, `galaxy-simulation-observation-comparison`, `cosmological-simulation-universal-scaling`, `tidal-stream-bayesian-simulation-sampling`, `lensed-multimessenger-cosmography-workflow`.
- Preserves no paper-specific numerical results, operational protocols, or unsupported conclusions.
