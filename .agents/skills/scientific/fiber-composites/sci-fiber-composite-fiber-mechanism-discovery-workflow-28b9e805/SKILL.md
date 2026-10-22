---
name: sci-fiber-composite-fiber-mechanism-discovery-workflow-28b9e805
description: A reusable end-to-end workflow for generating mechanism-driven research questions, hypotheses, and validation plans in composite, fiber-reinforced, and architectured material systems.
scienceevolve-title: "Fiber composites and battery materials · composite fiber mechanism discovery workflow 3"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Turn a research gap in composite, fiber-reinforced, hybrid, or architectured material systems into a structured, mechanism-driven discovery and validation plan. This skill guides hypothesis generation, controlled experimental design, multi-signal analysis, and iterative refinement without prescribing operational fabrication or testing recipes.

# When to use

- The user asks for new research questions, hypotheses, or experimental designs for material systems where reinforcement architecture, interface quality, processing history, or degradation state may govern mechanical or functional response.
- The target system involves a matrix and a reinforcing phase (fibrous, particulate, laminate, or hybrid) or an externally applied strengthening/intervention system.
- The goal is to understand *how* and *why* a design variable changes performance, not merely to find an optimal recipe.
- The user needs a methodological plan rather than a literature summary or direct structural design.

Do not use this skill as a substitute for domain-specific safety review, certified structural design, operational manufacturing instructions, or application qualification standards.

# Inputs required

Before producing a plan, ask for or infer:

- **Research objective:** the performance target, knowledge gap, or decision the study should support.
- **System identity:** matrix and reinforcement/intervention classes, known variability sources, and compatibility constraints.
- **Candidate design factors:** composition, architecture, orientation, interface treatment, processing route, environmental exposure, or degradation state.
- **Evaluation targets:** mechanical, physical, functional, or durability metrics relevant to the objective.
- **Available evidence:** prior measurements, models, standards, pilot data, and known confounders.
- **Constraints and boundaries:** safety, cost, sustainability, equipment, time, scale, and whether the plan is exploratory or confirmatory.

If critical inputs are missing, state assumptions explicitly and label the plan as provisional.

# Core Workflow

Follow this ordered route from question framing to bounded claim. Treat each gate as a hard stop or pivot point.

1. **Frame the mechanism gap**
   - Translate the application need into a specific structure-property or process-structure-property question.
   - Identify the dominant load-transfer pathway, interface, defect, or architecture feature that must be understood.
   - **Gate:** If the gap is purely descriptive rather than mechanistic, stop and reframe before proceeding.

2. **Generate layered, ranked hypotheses**
   - Propose hypotheses for composition, architecture, interface, processing, degradation, or environmental effects.
   - For each hypothesis, record: evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observable signature, likely failure modes, and boundary conditions where it may not hold.
   - **Gate:** If hypotheses are not experimentally separable, refine or decompose them until a discriminating test exists.

3. **Design minimal viable validation**
   - Select independent variables that map directly to the hypothesis.
   - Define dependent variables spanning primary performance, secondary trade-offs, and failure mode.
   - Include controls: baseline (unmodified), positive (known benchmark), negative (mechanism-suppressed), and strong comparator (distinguishes confounders).
   - Specify replication sufficient to estimate variability.
   - **Gate:** If the design cannot distinguish the target mechanism from artifacts, confounders, or uncontrolled process changes, redesign before execution.

4. **Execute multi-signal analysis**
   - Screen data for invalid tests, artifacts, and synchronization issues.
   - Compare scalar metrics (central tendency, dispersion, full response curves).
   - Analyze spatial or field data (deformation, strain, damage progression) when available.
   - Classify failure modes and compare them to the hypothesized mechanism.
   - **Gate:** If scalar metrics, field evidence, and failure morphology diverge without a reconcilable mechanism, stop and audit for confounders or protocol errors.

5. **Iterate or pivot based on evidence**
   - **If supported:** narrow the design space and test a harder boundary (different loading, environment, scale, or duration).
   - **If partially supported:** isolate the variable responsible for trade-offs before adding complexity.
   - **If contradicted:** inspect defects, interface evidence, or assumptions before discarding the mechanism; consider an alternative hypothesis.
   - **If artifact-dominated:** stop the current branch, redesign preparation or measurement protocol, and restart from Step 3.
   - **Stop conditions:**
     - Variability exceeds expected effect size and cannot be explained.
     - Failure mode shifts in a way that invalidates the mechanism.
     - Controls fail or are incomparable.
     - Safety, ethics, or compliance boundaries are reached.

6. **Bound claims and report**
   - Label each conclusion by evidence hierarchy: observed, derived, model-supported, inferred, or proposed.
   - State explicit boundary conditions (material system, geometry, loading mode, environment, scale).
   - **Gate:** If claims cannot be separated from prior evidence or extrapolated safely, narrow or qualify them before finalizing.

# Output Format

Return a structured research plan containing:

1. **Research question framing:** one-sentence objective and the mechanistic gap.
2. **Mechanism map:** dominant pathways, interfaces, and limiting features.
3. **Hypothesis set:** each with evidence strength, key assumptions, predicted signature, likely failure modes, and boundary conditions.
4. **Experimental design schema:** factors, levels, controls, metrics, replication logic, and minimal viable validation.
5. **Analysis plan:** data screening, scalar and field analysis, failure-mode triangulation, uncertainty treatment, and model comparison.
6. **Iteration strategy:** rules for support, partial support, contradiction, and artifact detection.
7. **Validity and boundary statement:** confounders, reproducibility risks, extrapolation limits, and evidence hierarchy.
8. **Safety and ethics note:** non-operational guardrails and escalation triggers.

# Validation Gates

Before executing or finalizing a plan, confirm:

- **Mechanism clarity:** each hypothesis names a specific physical mechanism.
- **Control adequacy:** baseline, positive, negative, and comparator controls are justified.
- **Confounding control:** material batch, processing quality, geometry, alignment, environment, and measurement protocol are held constant or documented.
- **Replication:** sample size supports variability estimation and outlier interpretation.
- **Discrimination power:** the design can separate the target mechanism from at least one plausible alternative.
- **Stop criteria:** predefined conditions exist for redesign, pivot, or termination.

# Claim Boundaries

- Limit conclusions to the tested material system, architecture, processing route, loading mode, environment, and scale.
- Distinguish prior direct evidence from mechanism-consistent reasoning and agent-inferred extensions.
- Do not treat coupon-scale or single-system results as consensus or as qualification for safety-critical applications.
- Treat optima and best-performing configurations as context-bound candidate design points, not universal rules.

# Failure Modes

Common ways the workflow or hypothesis can fail:

- **Artifact-dominated response:** gripping, preparation, boundary condition, or measurement artifacts obscure material behavior.
- **Uncontrolled variability:** batch effects, source variability, or environmental drift exceed the signal of interest.
- **Premature failure mode shift:** the specimen fails by an unintended mechanism that invalidates the hypothesis.
- **Confounded process change:** an apparent performance change is caused by an uncontrolled fabrication or processing difference rather than the intended variable.
- **Overfitted optimization:** a single metric improves while critical trade-offs or failure modes worsen.
- **Extrapolation beyond evidence:** claims extend to untested environments, scales, or loading regimes without validation.

# Validity Checks

Final checklist before presenting conclusions:

- **Causality:** does the design separate the target effect from degradation, retrofit, or processing artifacts?
- **Confounding:** are material variability, preparation quality, support conditions, and loading configuration controlled or documented?
- **Failure-mode validity:** does the observed failure match the intended mechanism, or reveal a different limiting process?
- **Multi-evidence consistency:** do scalar metrics, field data, and failure morphology support the same explanation?
- **Statistical adequacy:** are variability, effect size, and replicate structure sufficient for the claim?
- **Reproducibility:** are methods, assumptions, exclusion criteria, and analysis steps documented for independent repetition?
- **Boundary conditions:** are conclusions explicitly bounded by the tested system and conditions?
- **Evidence hierarchy:** are claims labeled as observed, derived, model-supported, inferred, or speculative?

# Provenance

Synthesized from cluster 53.0 (composite-fiber-mechanics-sustainable-mechanism-discovery-workflow). Source skills: `natural-fiber-composite-exploration`, `filament-wound-composite-exploration`, `sustainable-rc-retrofit-research`, `frp-fdm-research-workflow`, `confined-slender-column-research-workflow`, `sbs-piezoelectric-nanofiber-sensor-discovery`, `architecture-aligned-composite-mechanics`, `fast-atom-surface-diffraction-research`.
