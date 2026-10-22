---
name: sci-fiber-composite-nanofiber-polymer-interface-evidenc-836da6e0
description: A reusable end-to-end workflow for designing, validating, and auditing evidence in composite, nanofiber, and polymer interface research through mechanism-driven hypotheses and observable-driven claim boundaries.
scienceevolve-title: "Fiber composites and battery materials · composite nanofiber polymer interface evidence analysis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill guides agents through a transferable, end-to-end scientific workflow for proposing research questions, generating mechanism-based hypotheses, designing minimal validation plans, analyzing structure-property-function evidence, and auditing claims in materials research involving composites, nanofibers, polymers, and interfaces. The workflow emphasizes separating verified evidence from inference, using controls to isolate mechanisms, and iterating only when structure explains function better than confounders.

# When to use

Use this skill when a user asks to:

- Propose new research questions or hypotheses for composite, nanofiber, polymer, or interface systems.
- Design minimal validation plans with appropriate controls and stop conditions.
- Analyze experimental or simulation evidence to link structure to function.
- Audit whether a claim is supported by mechanism, performance, or artifact.
- Iterate on a material design after initial results.

Do not use this skill for operational fabrication recipes, hazardous procedural instructions, clinical advice, or as a substitute for domain-specific safety certification.

# Inputs required

Before executing the workflow, identify or request:

- Target application context and functional bottleneck.
- Candidate material family or architecture concept.
- Suspected failure mode or limiting mechanism.
- Available characterization and evaluation capabilities.
- Baseline or benchmark systems for comparison.
- Constraints: safety, reproducibility, boundary conditions, and extrapolation limits.

If inputs are missing, state assumptions explicitly and label them as unvalidated.

# Core Workflow

1. **Frame the Gap and Research Question**
   - Translate the application need into a measurable materials question.
   - Identify whether the bottleneck is structural, interfacial, transport-related, architectural, or environmental.
   - Define the boundary conditions under which the question is valid.

2. **Generate Mechanism-Based Hypotheses**
   - For each candidate design lever, state the expected mechanism linking structure to function.
   - Assign evidence strength (strong, moderate, weak, speculative).
   - List key assumptions and likely failure modes.
   - **Decision Gate 1:** Discard hypotheses that are not falsifiable or lack a measurable mediator.

3. **Design Minimal Viable Validation**
   - Select independent variables (one primary lever at a time for mechanism isolation).
   - Define dependent variables: structural verification, mechanism indicators, performance metrics, and robustness metrics.
   - Establish controls: baseline, negative, positive/reference, and confounder controls.
   - Set evaluation criteria and stop conditions before data collection.
   - **Decision Gate 2:** If the plan cannot isolate the proposed mechanism from confounders, redesign controls or narrow the question.

4. **Collect and Quality-Check Observations**
   - Verify sample identity, processing history, and measurement calibration.
   - Document variability, replicates, and missing data.
   - Check that structural features were actually produced as intended.
   - **Stop Condition:** If fabrication quality or data quality is insufficient, pause and resolve before interpreting results.

5. **Analyze Structure-Function Evidence**
   - Compare candidates against controls using normalized metrics and uncertainty estimates.
   - Test whether the intended structural mediator explains the functional change.
   - Map trade-offs (e.g., performance versus stability, one function versus another).
   - Classify each hypothesis as supported, partially supported, contradicted, or inconclusive.
   - **Decision Gate 3:** If controls perform similarly to the candidate, reject or weaken the mechanism claim.

6. **Audit Claims and Boundaries**
   - Separate directly observed evidence from inferred or extrapolated claims.
   - Limit conclusions to the tested system, composition range, and boundary conditions.
   - Label evidence provenance: directly observed, supported by comparable prior evidence, inferred, or speculative.
   - **Decision Gate 4:** If the claim requires extrapolation beyond tested boundaries, flag it as requiring further validation.

7. **Iterate or Terminate**
   - **If supported:** Narrow the design space and test robustness under relevant boundary conditions (e.g., loading, environment, aging).
   - **If partially supported or ambiguous:** Measure missing mediators or add discriminator experiments before changing multiple variables.
   - **If contradicted:** Reformulate the mechanism hypothesis and select a different structural lever.
   - **If artifact or confounded:** Diagnose the source and redesign the validation plan.
   - **Stop Condition:** Terminate the branch if the mechanism is unsupported, variability is unacceptable, safety or compliance concerns are unresolved, or the result holds only in a narrow regime irrelevant to the research question.

8. **Document and Report**
   - Compile the research question, hypotheses, validation plan, analysis, iteration decisions, and residual uncertainties.
   - Include validity notes and safety boundaries.

# Output Format

When using this skill, produce:

1. **Research Question** — Focused question, gap, and boundary conditions.
2. **Mechanism Map** — Design axes, expected mechanisms, target failure modes, and alternative explanations.
3. **Hypotheses Table** — Hypothesis, evidence strength, key assumptions, critical variables, likely failure modes, and boundary conditions.
4. **Minimal Validation Plan** — Variables, controls, metrics, decision criteria, and stop conditions.
5. **Analysis Summary** — Data quality checks, control comparisons, mechanism support, trade-off visualization, and hypothesis classification.
6. **Iteration Decision** — Keep, revise, abandon, or escalate with rationale.
7. **Claim Audit** — Evidence labeling, boundary limits, and residual risks.
8. **Validity and Safety Notes** — Confounders, reproducibility checks, extrapolation boundaries, and non-operational safety constraints.

# Validation Gates

- **Falsifiability Gate:** Every hypothesis must imply a measurable consequence and a result that would weaken it.
- **Control Gate:** The design must include a baseline and at least one negative or orthogonal control to isolate the proposed mechanism.
- **Mechanism Isolation Gate:** Apparent performance gains must be traced to the intended structural mediator, not to confounders such as loading, thickness, density, or processing artifacts.
- **Reproducibility Gate:** Claims require variability estimates across replicates or batches; single-run observations are treated as preliminary.
- **Boundary Gate:** Conclusions must state the regime (material family, scale, environment, loading condition) where they are valid.

# Claim Boundaries

- Do not treat single-study observations as field-wide consensus.
- Do not extrapolate in vitro or lab-scale findings to clinical, commercial, or field-deployment claims without dedicated validation.
- Distinguish paper-verified mechanisms, transferable design principles, new hypotheses, and speculative extrapolations.
- Avoid unsupported claims about health, environmental benefit, regulatory compliance, or product readiness.

# Failure Modes

- **Confounded mechanism:** Performance changes arise from uncontrolled variables rather than the intended design lever.
- **Weak reproducibility:** High variability across replicates obscures true effects.
- **Over-interpretation:** Morphology or single-metric improvements are treated as proof of mechanism without control-separated evidence.
- **Extrapolation error:** Results from one material family, scale, or environment are applied to untested contexts.
- **Artifact dominance:** Material effects such as leaching, adsorption, or nonspecific stress are mistaken for functional responses.
- **Trade-off neglect:** Improving one target property degrades another without explicit balancing criteria.

# Validity Checks

- **Confounding:** Are composition, architecture, processing history, and testing protocol aligned across compared samples?
- **Control adequacy:** Do baseline, negative, positive, and orthogonal controls separate mechanism from artifact?
- **Reproducibility:** Are replicates, batches, and uncertainty estimates documented?
- **Statistical validity:** Are tests appropriate for the design, sample size, and multiple comparisons?
- **Measurement validity:** Could assay sensitivity, imaging bias, or environmental drift explain the result?
- **Mechanistic consistency:** Do structural descriptors, transport indicators, and performance metrics point in the same direction?
- **External validity:** Is the candidate system structurally similar enough to prior evidence to justify comparison?
- **Evidence labeling:** Are source-paper observations, literature support, and agent-generated inferences clearly separated?

# Provenance

- Synthesized from cluster 66, subcluster 66.1: composite-nanofiber-polymer-interface-evidence-analysis-workflow.
- Source skill references: porous-fiber-composite-research-design; natural-fiber-basalt-composite-research-design; lipid-polymer-gene-delivery-research; li-s-cathode-research-workflow; lis-sulfur-host-design-workflow; electrospinning-nanofiber-research-workflow; graphdiyne-research-workflow; microfiber-endocrine-organ-chip-design.
- Workflow archetype: observable-driven evidence analysis and claim audit.
