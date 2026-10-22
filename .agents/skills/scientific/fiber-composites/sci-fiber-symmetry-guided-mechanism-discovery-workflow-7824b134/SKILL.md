---
name: sci-fiber-symmetry-guided-mechanism-discovery-workflow-7824b134
description: A reusable end-to-end workflow for designing structure-function research plans that use symmetry, selection rules, and cross-modal controls to discover, discriminate, and validate transport or response mechanisms in materials systems.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery workflow 3"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent transform an ambiguous materials observation into a rigorous, testable mechanism-discovery plan. The workflow treats structural symmetry, selection rules, and function-decoupled design as central levers to generate hypotheses, discriminate competing explanations, and bound claims using matched controls and iterative validation.

## When to use

Use when a user asks to design new research questions, experiments, or validation plans for materials systems where structure, symmetry, or interfacial organization governs transport, optical, electrochemical, or mechanical response. Applicable to low-dimensional nanomaterials, porous hosts, flexible architectures, molecular probes, and extreme-condition phases. Do not use for clinical decision-making, operational lab instructions, or high-risk experimental execution.

## Inputs required

- Target system class, dimensionality, and known structural variables.
- Observed or intended response (transport, optical, electrochemical, mechanical, etc.).
- Candidate structural or symmetry-breaking perturbations.
- Available measurement modalities and cross-modal links.
- Baseline or reference behavior.
- Constraints: safety boundaries, non-operational scope, reproducibility needs, and intended evidence strength.

## Core Workflow

1. **Frame the Gap and Bottleneck**  
   Identify the mismatch between observed response and existing structural or symmetry-based explanations. Classify the bottleneck as transport-limited, interface-limited, defect-mediated, or symmetry-dependent.  
   **Decision gate:** If the bottleneck cannot be linked to a structural or symmetry variable, stop and refine the research question.

2. **Build the Structure-Function-Symmetry Map**  
   Map each candidate structural feature to a functional role (e.g., retention, transport, conductivity, interfacial coupling). Identify selection rules or symmetry constraints that govern the target response. Define how a perturbation should alter the observable.  
   **Decision gate:** If the map lacks a physically justified link to a measurable observable, return to step 1.

3. **Generate Ranked Mechanism Hypotheses**  
   Formulate mechanism-first hypotheses: each states the structural/symmetry lever, predicted response, and falsification condition. Include at least one alternative mechanism and one boundary hypothesis. Label evidence strength (speculative, weak, moderate, strong) and key assumptions.  
   **Decision gate:** If no hypothesis can be falsified by available or feasible measurements, redesign the variable space before proceeding.

4. **Design the Validation Plan with Matched Controls**  
   Define minimal viable validation: baseline, negative control, positive/mechanism control, and process control. Specify independent variables (structural or symmetry perturbation), dependent variables (response metrics), and nuisance variables. Pre-define stop conditions (e.g., controls fail, background dominates, symmetry breaking is unmeasurable).  
   **Decision gate:** If controls cannot isolate the proposed mechanism from confounders (loading, environment, probe artifacts), redesign the plan.

5. **Acquire and Pre-register Analysis**  
   Pre-register comparison baselines, analysis windows, and primary metrics. Collect cross-modal data linked through a shared response-function framework rather than raw peak matching. Maintain independent structural labels before spectral interpretation to avoid circular reasoning.

6. **Discriminate Mechanisms**  
   Build an evidence matrix (hypotheses vs. measurement channels). Compare nested models and check selection-rule consistency. Quantify uncertainty from calibration, background, normalization, and fit parameters.  
   **Decision gate:** If multiple models fit equally well without independent constraints, mark the result as ambiguous and proceed to iteration.

7. **Iterate Based on Failure Mode**  
   - **Supported:** Independent channels converge and alternatives are excluded. Narrow the design or test boundary conditions.  
   - **Ambiguous:** Partial agreement remains. Add a discriminating control or cross-modal measurement; do not repeat the same assay.  
   - **Unsupported:** Controls reproduce the signal or contradict the mechanism. Reject or revise the hypothesis and inspect confounders.  
   - **System-level failure:** Gains do not survive cycling, deformation, or environmental drift. Redefine the validation target.  
   **Stop condition:** Terminate if two consecutive iterations fail to resolve ambiguity, and recommend reframing the structural variable.

8. **Bound Claims and Archive Evidence**  
   Classify each claim as exploratory, supported, mechanistic, or generalizable. State domain limits (material class, environment, measurement regime, symmetry conditions). Clearly separate source-paper-supported patterns from agent-inferred analogies.

## Output Format

Return a structured report containing:

1. **Research question** — Bottleneck classification and gap statement.
2. **Structure-function-symmetry map** — Feature-to-function assignments and selection-rule links.
3. **Ranked hypotheses** — Table with mechanism, evidence strength, key assumptions, failure modes, and minimal test.
4. **Validation plan** — Variables, matched controls, primary metrics, secondary diagnostics, and stop conditions.
5. **Analysis plan** — Evidence matrix, nested-model comparison, uncertainty propagation, and selection-rule checks.
6. **Iteration plan** — Decision rules for supported, ambiguous, unsupported, and system-level outcomes.
7. **Validity and boundary statement** — Confounders addressed, reproducibility checks, claim limits, and provenance notes.

## Validation Gates

- **Causal clarity:** Every mechanism claim must be paired with a control that was actually included.
- **Symmetry and selection-rule check:** Differences must be shown to arise from intrinsic material response, not probe geometry, polarization, or momentum-transfer artifacts.
- **Normalization robustness:** Conclusions must survive alternative physically justified normalization choices.
- **Model identifiability:** Competing models must be distinguishable given the available data and constraints.
- **Cross-modal convergence:** Mechanism claims require agreement across at least two independent measurement channels.
- **Reproducibility:** Independent batches, samples, or devices are required for claims beyond exploratory.

## Claim Boundaries

- Do not generalize from a single material system, interface, or measurement regime to the broader field.
- Distinguish phase discovery from property proof, and proxy evidence from direct measurement.
- Limit solution-to-surface and surface-to-device extrapolations unless explicitly validated.
- Mark theory-guided predictions as distinct from experimentally verified mechanisms.
- Label agent-inferred analogies as conditional until tested in the target system.

## Failure Modes

- **Weak or nonspecific signal:** The proposed mechanism produces no detectable or non-unique response.
- **Confounding by matrix or interface:** Controls indicate the active feature is not responsible for the observed effect.
- **Unstable or non-identifiable models:** Fits require unjustified complexity or yield unstable, correlated parameters.
- **Symmetry or probe artifact:** The apparent mechanism is an artifact of probe geometry, selection rules, or post-processing.
- **System-level degradation:** Electrochemical, mechanical, or environmental instability invalidates long-term claims.
- **Overgeneralization:** Findings from one structural variant are extended to untested systems without independent validation.

## Validity Checks

- **Confounders addressed:** Substrate, environment, contamination, charging, drift, loading, conductivity, and processing differences are considered.
- **Reproducibility:** Repeated measurements, independent samples, and transparent outlier handling are documented.
- **Statistical validity:** Uncertainty estimates, multiple-comparison risks, and appropriate sample counts are reported.
- **Boundary conditions:** Claims are limited to tested structural classes, symmetry regimes, and operating contexts.
- **Evidence labeling:** Source-paper patterns, model inferences, and new hypotheses are clearly separated.
- **Non-operational scope:** No operational lab recipes, hazardous protocols, or fabrication parameters are included.

## Provenance

- Derived from cluster 45.0 (symmetry-guided mechanism discovery and validation).
- Synthesized from representative source skills: `eis-biointerface-research-workflow`, `nanocarbon-optical-response-research`, `fabric-flexible-energy-storage-exploration`, `extreme-condition-materials-discovery`, `redox-active-molecular-probe-research-design`, `low-dimensional-exciton-defect-exploration`, `hierarchical-host-energy-material-workflow`, `interferometric-common-mode-sensing-research`.
- Preserves methodological patterns without transferring source-specific materials, parameters, numerical results, or paper conclusions.
