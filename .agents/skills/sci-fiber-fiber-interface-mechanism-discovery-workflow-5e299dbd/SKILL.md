---
name: sci-fiber-fiber-interface-mechanism-discovery-workflow-5e299dbd
description: A reusable end-to-end workflow for generating, testing, and validating structure-mediated mechanism hypotheses in fiber, nanofiber, and composite interface systems through controlled observation and iterative discrimination.
scienceevolve-title: "Fiber composites and battery materials · fiber interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform an observed performance gap or structural anomaly in fiber-based, nanofiber, or composite interface systems into a disciplined, testable mechanism-discovery program. It guides an agent to hypothesize structure–property links, design minimal controlled comparisons, pair functional readouts with orthogonal structural evidence, and iterate until the mechanism is either supported, excluded, or reframed—without treating any single study as field consensus.

# When to use

Use when the user needs to:

- Propose new research questions or hypotheses for systems where fiber morphology, reinforcement architecture, interfacial chemistry, or hierarchical structure may control function.
- Design controlled studies that separate structural effects from compositional or processing artifacts.
- Interpret observational data (imaging, spectroscopy, transport, mechanical, electrochemical) to discriminate among competing mechanisms.
- Iterate an experimental plan based on ambiguous, contradictory, or partially supportive evidence.

Applicable domains include polymer composite fibers, nanofiber membranes, hierarchical nanomaterials, fiber-based energy devices, and functional fibrous carriers.

# Inputs required

Before executing the workflow, collect or infer:

- **System definition**: material classes (matrix, fiber, filler, electrolyte), architecture (continuous, branched, aligned, random), and relevant interfaces.
- **Functional target**: the performance metric, failure mode, or transformation of interest (e.g., transport, wear resistance, activity, retention, deformation response).
- **Observable inventory**: available structural probes (imaging, scattering, spectroscopy), functional assays, and environmental controls.
- **Prior evidence**: literature or preliminary data, labeled by strength (direct, analogous, speculative).
- **Constraints**: safety boundaries, reproducibility limits, sample availability, and non-operational scope.
- **Baseline comparator**: established control condition or benchmark for comparison.

# Core Workflow

Execute the following ordered stages. At each decision gate, pause and redesign if the criterion is not met.

## Stage 1: Gap Formalization & Mechanism Scoping

Convert the user’s observation into a precise functional gap. Identify the structural or interfacial variable suspected to control the gap. Map the suspected causal chain: stimulus or design lever → local process → structural evolution → functional outcome.

- **Decision gate**: Is the gap observable and the suspect variable manipulable with available resources?  
  - If no → Stop. Redefine scope or acquire new probes.

## Stage 2: Hypothesis Generation & Ranking

Generate 3–5 mechanism-based hypotheses. Format each as: structural/interfacial lever → local process → observable signature → functional outcome. Label each with evidence strength (strong, moderate, weak, speculative), key assumptions, predicted signatures, and likely failure modes.

- **Decision gate**: Are the top hypotheses falsifiable with the planned observables?  
  - If no → Refine hypotheses or expand the observable inventory before proceeding.

## Stage 3: Minimal Viable Validation Design

Design the smallest comparison matrix that can discriminate among the top-ranked hypotheses. Define:

- **Independent variable**: the structural or interfacial lever being tested.
- **Dependent variables**: primary functional metric and secondary structure-sensitive responses.
- **Covariates**: batch identity, geometry, environment, and preprocessing.
- **Controls**: baseline, negative (feature absent), process/sham, and positive benchmark if available.
- **Stop conditions**: unprocessable material, missing feature, controls equivalent, safety breach, or inability to separate morphology from chemistry effects.

- **Decision gate**: Can the design isolate the structural effect from composition, processing, and measurement artifacts?  
  - If no → Redesign controls or reduce complexity.

## Stage 4: Staged Perturbation & Observation

Characterize baseline structure and function before perturbation. Apply staged perturbation (conceptually distinct low, moderate, and high regimes, or presence/absence) while tracking the same object or strictly matched objects. Pair every functional readout with orthogonal structural evidence from the same or matched specimen.

- **Decision gate**: Is object identity maintained and artifact screened (drift, damage, contamination, contact change)?  
  - If no → Pause, diagnose, or redesign the perturbation sequence.

## Stage 5: Mechanism-First Analysis

Normalize all comparisons to matched geometry, loading, area, or mass basis. Quantify structural descriptors across representative regions rather than selected highlights. Classify the outcome for each hypothesis:

- **Supported**: structural variable changes and primary response changes as predicted.
- **Partially supported**: primary response changes but structural evidence is weak.
- **Ambiguous**: controls are confounded or variability is too large.
- **Not supported**: predicted response is absent despite successful structural manipulation.

Test interaction logic: does the structural variable change the effect of another variable?

- **Decision gate**: Does the evidence meet the threshold for mechanism discrimination?  
  - If supported → Proceed to Stage 7.  
  - If partially supported, ambiguous, or not supported → Proceed to Stage 6.

## Stage 6: Iteration or Redesign

Update the research plan based on the Stage 5 classification:

- **If supported**: Narrow the mechanism by varying one structural parameter at a time; add direct validation; test robustness under secondary constraints.
- **If partially supported**: Add discriminating measurements or controls to isolate interface, dispersion, porosity, or defect effects.
- **If ambiguous**: Improve measurement reliability, increase independent replication, or reassess whether the target property is sensitive enough to the proposed variable before changing the hypothesis.
- **If not supported**: Reformulate the bottleneck hypothesis and run the smallest discriminating test.

**Stop conditions**: Controls remain inconsistent; the structural feature is irreproducible; the variable cannot be reliably manipulated or measured; safety or compliance limits are exceeded; mechanism-specific evidence contradicts all current hypotheses.

- **Decision gate**: Is further iteration likely to yield discriminating evidence within constraints?  
  - If no → Stop and document failure modes.

## Stage 7: Boundary Bounding & Claim Framing

State explicit boundary conditions: material class, geometry, stimulus regime, environment, and measurement modality. Separate verified observations from inferred mechanisms and speculative extensions. Trim any claim that generalizes beyond the tested system.

- **Decision gate**: Are claims bounded and free of unsupported extrapolation?  
  - If no → Revise claims before output.

## Stage 8: Synthesis & Output Packaging

Compile the research question, gap, ranked hypotheses, experimental design, analysis plan, iteration log, and validity notes into the structured output. Ensure all elements passed the validation gates.

- **Decision gate**: Are all outputs aligned with the validation gates and claim boundaries?  
  - If yes → Deliver final package.

# Output Format

Return:

1. **Research question & gap**: concise problem statement and structural rationale.
2. **Ranked hypotheses table**: hypothesis, mechanism, evidence strength, key assumptions, predicted signatures, likely failure modes.
3. **Study design**: experimental unit, independent/dependent variables, control groups, minimal viable validation, and stop conditions.
4. **Analysis plan**: normalization rules, orthogonal evidence pairing, mechanism-discrimination criteria, and visualization strategy.
5. **Iteration log**: decision record for each cycle (supported/partial/ambiguous/unsupported) and resulting redesign.
6. **Validation gate summary**: confounders addressed, reproducibility checks, statistical validity, and artifact screening.
7. **Claim boundaries**: scope limits, extrapolation prohibitions, and evidence-status labels.

# Validation Gates

- **Observability gate**: The suspect structural or interfacial variable must be measurable and manipulable.
- **Control gate**: The design must include at least one negative control and one baseline control capable of isolating the proposed mechanism from processing artifacts.
- **Orthogonality gate**: Mechanism claims require at least two independent measurement classes (e.g., functional + structural, or spectroscopy + imaging).
- **Reproducibility gate**: Trends must be distinguishable from single-object or single-batch observations; independent replication is planned or acknowledged.
- **Safety gate**: All recommendations remain at the research-design level; no operational hazardous protocols are generated.

# Claim Boundaries

- Do not generalize a single-system result to an entire material class or application domain.
- Distinguish observation (structure changed), inference (mechanism suggested), and extrapolation (performance predicted under untested conditions).
- Avoid clinical, environmental-release, commercial-readiness, or product-approval claims without domain-specific validation.
- Label all conclusions with their evidence status: directly observed, inferred from controls, or speculative.

# Failure Modes

- **Morphology confounding**: The structural feature co-varies with composition, thickness, porosity, or defect density, obscuring causality.
- **Artifact dominance**: Contact drift, beam damage, heating, contamination, or measurement geometry explains the apparent signal.
- **Feature absence**: The intended interfacial modifier or structural feature is not present, not accessible, or not stable under test conditions.
- **Mechanism misattribution**: Functional improvement is real but caused by an uncontrolled variable (e.g., residual solvent, batch variation, unobserved recovery).
- **Overinterpretation**: Single-object, single-batch, or small-effect observations are treated as confirmed mechanisms.
- **Iteration deadlock**: Repeated cycles fail to discriminate hypotheses because controls are insufficient or the effect is below measurement resolution.

# Validity Checks

- **Confounding screen**: Have composition, processing history, geometry, orientation, environment, and measurement timing been held constant or recorded?
- **Direct validation**: Is there independent evidence that the structural variable changed as intended?
- **Statistical discipline**: Are sample counts, variance estimates, effect sizes, and predefined exclusion criteria reported?
- **Mechanism consistency**: Do structural, chemical, functional, and recovery data point to the same explanation?
- **Negative evidence**: Are null, weak, or contradictory results reported rather than suppressed?
- **Boundary explicitness**: Are limits of chemistry, geometry, stimulus, and environment stated for every claim?

# Provenance

- Derived from cluster 6.0 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: polymer-composite-wear-exploration, aligned-filler-membrane-discovery, flexible-fiber-energy-storage-research, branched-nanofiber-research-workflow, nanofiber-operando-exploration, electrospun-fiber-surface-graft-research, fdm-composite-filament-research-design, biomaterial-antibacterial-fiber-research-design.
- Paper-specific systems, parameters, and conclusions have been removed; only the shared workflow route is retained.
