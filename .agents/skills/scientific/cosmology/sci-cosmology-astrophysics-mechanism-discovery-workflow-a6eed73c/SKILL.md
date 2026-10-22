---
name: sci-cosmology-astrophysics-mechanism-discovery-workflow-a6eed73c
description: A reusable end-to-end workflow for designing observable-driven mechanism discovery and validation studies in astrophysics and cosmology.
scienceevolve-title: "Galaxy, cosmology, and simulations · astrophysics mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Use this skill to design rigorous, end-to-end research plans that turn observational gaps or simulation mismatches into testable mechanistic hypotheses, controlled validation designs, and bounded claims. It emphasizes discriminating among competing physical, numerical, and observational explanations using multi-observable evidence and explicit iteration gates.

# When to use

- When the user asks to propose new research questions in astrophysics, cosmology, galaxy formation, or large-scale structure.
- When designing simulation-based or observation-guided analyses to explain transitions, tensions, or anomalies.
- When the task requires hypothesis generation with evidence strength, controls, failure modes, and stopping conditions.
- When evaluating whether a proposed mechanism is plausible without overclaiming from a single dataset or model.

# Inputs required

Before producing a research plan, ask for or infer:

- **Target phenomenon:** the observable transition, discrepancy, or tension to be explained.
- **Baseline model:** the established explanation or reference framework being challenged.
- **Candidate mechanism classes:** physical, environmental, numerical, or systematic alternatives to compare.
- **Evidence sources:** available simulations, surveys, catalogs, archival data, or analytic expectations.
- **Comparison requirements:** needed controls, independent probes, and robustness checks.
- **Decision goal:** mechanism discrimination, model selection, sensitivity analysis, or uncertainty reduction.

# Core Workflow

Follow this ordered route. Apply decision gates and stop conditions at each stage.

1. **Define the observable gap or tension**
   - Express the problem as a measurable deviation from a baseline or a movement across a population boundary.
   - Separate empirical gaps from theoretical and methodological gaps.
   - **Decision gate:** If the gap cannot be stated as a quantitative, measurable difference, stop and reformulate before proceeding.

2. **Generate competing mechanism hypotheses**
   - Build at least three candidates: a physical mechanism, a null or baseline explanation, and an alternative (systematic, numerical, or environmental).
   - For each hypothesis, specify: causal chain, predicted direction of change, key assumptions, evidence strength (high / medium / low / speculative), and explicit failure modes.
   - **Decision gate:** If hypotheses lack falsifiable signatures or predict identical observables, return to step 1 and refine the gap.

3. **Design controlled validation**
   - Define baseline, intervention, negative control, positive control, and robustness variants.
   - Specify independent variables (mechanism assumptions, environment, numerical choices) and dependent variables (primary observable, secondary stability observables, diagnostic mediators).
   - Set a minimum viable validation: baseline + negative control + primary observable + at least two secondary observables + uncertainty estimate.
   - **Stop condition:** If controls cannot be matched or the primary observable is insensitive to the intervention, stop and redesign.

4. **Run staged analysis**
   - **Screening stage:** Test the primary directional effect and most likely collateral deviations using simplified or reduced-cost contexts.
   - **Validation stage:** For shortlisted candidates, apply higher-statistics or more realistic contexts with multiple observable families and alternative parametrizations.
   - Construct aligned histories or relative comparisons; detect transition points; measure precursor lags.
   - Generate synthetic observables when comparing models to data.
   - **Decision gate:** If a candidate fails screening (wrong direction, excessive tuning, or unacceptable disruption of stability observables), exclude it.

5. **Discriminate mechanisms**
   - Score each surviving hypothesis by: temporal precedence, amplitude consistency, robustness across numerical choices, agreement with multiple independent observables, and control behavior.
   - Rank hypotheses and identify remaining degeneracies.
   - **Decision gate:** If multiple mechanisms remain degenerate, design a discriminant test or independent tracer check before drawing conclusions.

6. **Iterate or redesign**
   - If timing fails: demote the mechanism and search for earlier precursors.
   - If amplitude fails: test auxiliary processes without treating the original mechanism as proven.
   - If numerical sensitivity is high: classify the result as model-dependent until convergence is demonstrated.
   - If the effect is system-specific: treat as a case study and require a representative sample before generalizing.
   - If observations conflict: check selection effects, calibration, and post-processing assumptions before rejecting the mechanism.
   - **Stop condition:** Stop if the signal is indistinguishable from artifacts, controls fail without explanation, or the hypothesis is too broad to generate a decisive test.

7. **Uncertainty audit and claim bounding**
   - Separate measurement uncertainty, model uncertainty, selection effects, and interpretation uncertainty.
   - State boundary conditions (e.g., mass range, redshift, environment, resolution regime).
   - Label evidence strength for every claim and distinguish source-supported patterns from agent-inferred extensions.
   - **Final gate:** If claims exceed the evidence base or generalize beyond tested regimes, downgrade or split the conclusion.

# Output Format

Return the following structured products:

1. **Research question and gap framing** — concise question and why it matters.
2. **Hypothesis table** — mechanism, evidence strength, key assumptions, predicted precursor/signature, and failure mode.
3. **Experimental design** — sample or system definition, variables, baseline, controls, minimum viable validation, and stopping conditions.
4. **Analysis plan** — primary, secondary, and diagnostic metrics; robustness checks; synthetic observables; and visualization strategy.
5. **Mechanism ranking and exclusion summary** — scored candidates and degeneracy notes.
6. **Iteration log** — updates, confounders identified, and next decisive test.
7. **Validity and boundary statement** — confounders, reproducibility requirements, and generalization limits.
8. **Evidence map** — separation of paper-supported patterns, agent-inferred extensions, and untested assumptions.

# Validation Gates

- **Temporal validity:** Proposed causes precede the observable transition or tension.
- **Counterfactual validity:** Removing or reducing the driver changes the expected outcome.
- **Confounding control:** Selection, calibration, environment, and numerical choices are matched or explicitly modeled.
- **Numerical robustness:** Conclusions are stable across reasonable resolution, aperture, finder, and definition choices.
- **Multi-observable consistency:** The proposed mechanism improves the primary observable without unacceptable degradation elsewhere.
- **Observational validity:** Mock or derived observables agree with independent data and do not rely on a single catalog or classification cut.
- **Statistical validity:** Uncertainties, correlated errors, and multiple comparisons are addressed.
- **Reproducibility:** Data lineage, selection cuts, analysis definitions, and configuration provenance are documented.

# Claim Boundaries

- Distinguish observed patterns from mechanism claims.
- Label extrapolations, simulation outputs, and untested assumptions clearly.
- Limit causal language to designs that support causal interpretation (temporal precedence plus controlled variation).
- Mark population-level claims as illustrative when derived from small or special samples.
- Separate source-paper findings from agent-generated inferences.

# Failure Modes

- The apparent effect appears only under one resolution, aperture, classification choice, or tracer.
- Controls fail (negative control shows the target effect, or positive control fails).
- The proposed cause changes after the transition rather than before it.
- The mechanism improves one observable while violating another core constraint.
- The result depends on undocumented choices, unsupported assumptions, or post hoc tuning.
- The signal is indistinguishable from known systematics or analysis artifacts.
- The hypothesis space is too narrow and omits plausible systematic or numerical alternatives.

# Validity Checks

- **Gap validity:** Is the gap based on missing evidence, conflicting evidence, or merely untested assumptions?
- **Claim-evidence alignment:** Does each conclusion follow from the data and controls actually used?
- **Model degeneracy:** Can a competing mechanism produce the same observable pattern?
- **Parametrization dependence:** Do conclusions survive reasonable alternative functional forms?
- **Tracer dependence:** Do results persist across independent measurement bases?
- **External validity:** Are claims limited to the tested regime and not overgeneralized?
- **Consensus boundary:** Are single-study findings presented as one study's findings rather than field-wide consensus?

# Provenance

- Synthesized from cluster 10.0 (observable-driven mechanism discovery and validation).
- Source-skill references: galaxy-quenching-research-design, astronomy-research-question-design, cosmological-disk-galaxy-simulation-design, cosmology-tension-mechanistic-simulation-skill, dark-sector-cosmology-research-pattern, astronomy-research-question-validation, galaxy-feedback-simulation-workflow, astronomy-research-communication-workflow.
- Preserves methodological patterns without embedding paper-specific conclusions, numerical parameters, or operational protocols.
