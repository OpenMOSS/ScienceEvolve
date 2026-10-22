---
name: sci-quantum-observable-driven-mechanism-discovery-workf-52e3af77
description: A reusable end-to-end workflow for generating hypotheses, designing controlled validations, and iterating to discover or constrain hidden mechanisms from observable signatures across physical systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 9"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to transform an ambiguous observable, system-level symptom, or scale-bridging gap into a falsifiable mechanism-discovery program. It guides the agent through hypothesis generation, minimal viable study design, layered control strategies, analysis, and iterative refinement while bounding claims and preserving uncertainty. The workflow abstracts patterns from kinetic transport, rare-event detection, jet-medium interactions, quantum transport, metamaterials, gravitational-wave astrophysics, accelerator beam dynamics, and disordered material inference.

# When to use

- The user has a qualitative observation, system-level anomaly, or indirect measurement and wants to identify the underlying mechanism.
- The user needs to design a study—experimental, simulation, or observational—that discriminates among competing explanations.
- The user wants to compare a target system against reference regimes using controls and scaling arguments.
- The user seeks to iterate from an initial hypothesis to a refined claim with explicit evidence strength and failure modes.

Do not use this skill for operational execution protocols, clinical recommendations, hazardous procedures, or as a substitute for domain-specific safety review.

# Inputs required

Before starting, obtain or infer:

- Target system class and dominant observable.
- The hidden property, mechanism, or scale-bridging gap to be probed.
- Available reference regimes, baseline models, or benchmark systems.
- Perturbation axes or control knobs that can modulate the candidate mechanism.
- Known confounders, nuisance parameters, background sources, or measurement artifacts.
- Available data sources: experiments, simulations, archival observations, or calibration samples.
- Desired claim level: topology observation, mechanism validation, scaling comparison, or model-supported extrapolation.
- Safety, regulatory, or facility constraints that bound the design space.

# Core Workflow

1. **Frame the gap and anchor the observable**
   - Define the decision-relevant symptom or scale-bridging question.
   - Identify why existing observables or models are insufficient.
   - State the hidden property or mechanism to be probed.

2. **Generate ranked hypotheses**
   - For each candidate mechanism, produce an entry with: claim, scale level, mechanistic rationale, evidence strength (high / medium / low), key assumptions, likely failure mode, minimal falsification observation, and strongest alternative explanation.
   - Distinguish empirically supported, mechanistically plausible, and speculative inferences.
   - **Decision gate:** If no hypothesis is falsifiable with available resources, stop and redefine the gap or observable.

3. **Design minimal viable validation (MVV)**
   - Define baseline, perturbation, positive control, negative control, and robustness conditions.
   - Specify independent variables (perturbation, geometry, regime), dependent variables (topology, response feature, rate), and confounders.
   - Establish evaluation metrics: reproducibility, effect size relative to uncertainty, and discriminatory power between hypotheses.
   - **Stop condition:** If the MVV cannot discriminate the leading hypothesis from its strongest alternative, redesign the perturbation or observable before proceeding.

4. **Execute data collection or simulation**
   - Acquire observations, run simulations, or extract archival data under the MVV design.
   - Archive raw products, calibration metadata, and analysis code versions.
   - **Decision gate:** If data quality, simulation convergence, or coverage is insufficient, halt and address instrumentation or modeling gaps.

5. **Extract and localize features**
   - Convert raw data into topology descriptors, time-frequency features, response curves, or component-resolved signals.
   - Quantify uncertainty from sampling, resolution, projection, noise, or numerical method.
   - Localize the feature to a physical region, scale, or process when possible.

6. **Compare against references and alternatives**
   - Contrast the target system with baseline, negative control, and reference regimes.
   - Use scaling, dimensionless arguments, or similarity parameters to locate the system relative to known limits without claiming equivalence.
   - Decompose aggregate signals into mechanism-specific components where feasible.

7. **Test mechanism with sensitivity and orthogonal checks**
   - Run sensitivity analysis: vary target and nuisance parameters to rank effects on the observable.
   - Propagate uncertainty into the inference.
   - Perform orthogonal validation: use an independent observable or simulation module to test the same mechanism.
   - **Decision gate:** If the feature appears in the negative control or the orthogonal check contradicts the mechanism, downgrade the hypothesis and return to step 2.

8. **Iterate and update**
   - If controls behave as expected and the feature is robust, increase confidence and proceed to mechanism discrimination.
   - If the effect is weak or confounded, redesign the observable, control, or normalization to improve sensitivity.
   - If the feature depends on a single analysis choice or arbitrary boundary, halt and revise the analysis plan.
   - If multiple mechanisms fit, generate a decision matrix linking observables to mechanisms and return to step 3 with a new discriminator.
   - **Stop conditions:** Stop if the claim requires a regime outside the tested system without additional evidence; if background or nuisance uncertainty dominates; or if the signal is not reproducible.

9. **Bound and report**
   - Classify evidence as strong, moderate, or weak based on controls, replication, and model agreement.
   - State the extrapolation boundary for every conclusion.
   - Separate observation from scaling comparison, mechanism inference, and extrapolation.

# Output Format

When using this skill, produce:

1. **Research question** — One sentence stating the scale-bridging or mechanism-discovery question.
2. **Gap and rationale** — Why current observables or models are insufficient.
3. **Ranked hypotheses** — Table with hypothesis, scale level, mechanism, evidence strength, key assumptions, likely failure mode, minimal falsification observation, and strongest alternative.
4. **Study design** — Baseline, perturbation, controls (positive, negative, robustness), variables, metrics, and stop conditions.
5. **Analysis plan** — Feature extraction, localization, reference comparison, sensitivity analysis, uncertainty propagation, and orthogonal checks.
6. **Iteration plan** — Decision rules for strengthening, weakening, or refuting hypotheses after each outcome.
7. **Validity and safety boundaries** — Confounders, reproducibility checks, extrapolation limits, and non-operational safety constraints.
8. **Claim boundary** — What can be concluded from the proposed validation and what cannot yet be concluded.

# Validation Gates

- Does the plan test a mechanism rather than merely substitute one model system for another?
- Are observations sufficient to distinguish real structures from artifacts?
- Are similarity parameters used as analogies with uncertainty rather than proof of equivalence?
- Are controls present for background drift, nuisance parameters, projection, and measurement artifacts?
- Are claims separated into observation, scaling comparison, mechanism inference, and extrapolation?
- Are alternative effective-medium, background, kinetic, or nuisance explanations considered?
- Are reproducibility and analysis sensitivity addressed?
- Are conclusions bounded by the tested geometry, regime, and measurement method?

# Claim Boundaries

- Distinguish paper-supported reasoning, established theory, agent-generated inferences, and speculative extensions.
- Label conclusions as demonstrated, supported, speculative, or not supported.
- Do not treat a single positive result, one simulation family, or one model system as field-wide consensus.
- Limit transfer claims to systems sharing the same causal-chain structure; mark extrapolation to new materials, energies, or regimes as requiring independent validation.

# Failure Modes

- The proposed feature appears only once or under a single analysis method.
- Background forcing, nuisance parameters, or reconstruction artifacts explain the structure better than the proposed mechanism.
- The signal persists when the proposed mechanism is removed (negative control failure).
- The signal disappears when required interaction contrast or perturbation is present.
- Simulation or model agreement depends on untested or arbitrary assumptions.
- The claim requires a regime outside the tested system without additional evidence.
- Target and nuisance parameters are non-identifiable from the available observable.

# Validity Checks

- **Confounding:** Can background, disorder, morphology, transport, boundary reflections, or detector effects mimic the feature?
- **Identifiability:** Does the response contain enough information to distinguish the target mechanism from alternatives?
- **Reproducibility:** Are samples, simulations, or observations replicated enough to estimate variability? Are analysis choices documented?
- **Statistical validity:** Are uncertainties combined correctly? Are tests predefined? Is multiple testing corrected?
- **Model hierarchy:** Are minimal and complex models compared, and are their validity boundaries stated?
- **Boundary sensitivity:** Does the conclusion change when zone definitions, binning, or analysis parameters vary?
- **Mechanistic specificity:** Does the feature distinguish the proposed mechanism from plausible alternatives?

# Provenance

- Derived from cluster 146.0 (archetype: observable-driven mechanism discovery and validation).
- Synthesized from source skills: kinetic-collective-flow-research; collider-neutrino-exploration-workflow; heavy-ion-photon-tagged-jet-workflow; helical-liquid-thermal-valve-exploration; history-dependent-phononic-exploration; supernova-gw-core-mode-research-workflow; accelerator-surface-process-exploration; organic-semiconductor-indirect-inference.
- Source-specific systems, materials, parameters, numerical results, and paper conclusions have been removed to produce a domain-agnostic workflow.
