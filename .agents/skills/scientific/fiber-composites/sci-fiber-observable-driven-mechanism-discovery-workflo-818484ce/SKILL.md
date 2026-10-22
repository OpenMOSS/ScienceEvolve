---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-818484ce
description: Reusable end-to-end workflow for designing mechanism-driven studies in multifunctional material systems, coupling bottleneck framing, evidence-tiered hypotheses, controlled validation, and bounded claim generation.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 23"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to guide mechanism-driven research design for multifunctional material systems—such as composites, energy devices, textiles, fibers, and porous scaffolds—where coupled transport, structural, interfacial, or processing phenomena limit performance. The goal is to convert observable evidence into discriminating hypotheses, controlled validation plans, and explicitly bounded claims, without reproducing source-specific materials, parameters, or conclusions.

# When to use

Use this skill when the user asks to:

- Generate research questions for systems with coupled or conflicting functional requirements (e.g., blocking versus transporting, stiff versus soft, conducting versus insulating).
- Design experiments that isolate a proposed mechanism from artifacts using spatial, structural, or process contrasts and matched controls.
- Analyze whether a performance gain is caused by architecture, accessibility, interfacial change, or confounding variables.
- Iterate a study plan based on mechanism-level evidence rather than headline metrics alone.
- Evaluate trade-offs between primary and secondary properties (e.g., transport versus resistance, wicking versus strength).

Do not use this skill as an operational synthesis manual, a hazardous procedure generator, a clinical efficacy evaluator, or a source of field-wide consensus derived from single studies.

# Inputs required

Ask the user or environment for:

- Target system class and the application-level bottleneck.
- Suspected coupled processes, mobile species, phases, or functional conflicts.
- Candidate architectures, material phases, process levers, or structural variables.
- Available characterization, imaging, transport, mechanical, or electrochemical measurements.
- Baseline systems and benchmark architectures for comparison.
- Safety, compliance, resource, and reproducibility constraints.
- Whether the task is hypothesis generation, study design, data interpretation, or iteration planning.

If required inputs are missing, state assumptions explicitly and label conclusions as inferred.

# Core Workflow

Execute the following ordered route. Pause at each decision gate until the condition is satisfied; if a stop condition is triggered, return to the indicated step.

1. **Bottleneck Framing & Coupling Map**
   - Define the application-level performance limitation.
   - Map beneficial and harmful species, charges, phases, or structural features.
   - Identify functional conflicts: requirements that a single homogeneous component cannot simultaneously satisfy.

2. **Hypothesis Generation with Evidence Tiers**
   - **Bottleneck hypothesis**: state which coupled process limits the system.
   - **Spatial/structural hypothesis**: propose where distinct functions should be assigned and why position or architecture matters.
   - **Mechanism hypothesis**: predict the observable change (e.g., flux uniformity, crossover reduction, deposition morphology, recovery behavior) if the mechanism is real.
   - **Boundary hypothesis**: predict where the design may fail (e.g., excessive loading, added resistance, poor wetting, mechanical collapse).
   - Label each hypothesis with evidence strength (`high`, `medium`, `low`), key assumptions, and likely failure modes.

3. **Study Design & Control Matrix**
   - Define the minimal viable validation set that can falsify the central mechanism.
   - Include: baseline control without the proposed architecture; single-function controls isolating each proposed role; negative control with similar structure but without intended function; benchmark control from prior work.
   - Select primary mechanism metrics, secondary trade-off metrics, and failure-onset metrics.
   - Define stop conditions: control failure, material instability, safety concern, or inability to isolate variables.

   > **Decision Gate 1 — Control Sufficiency**: Are controls sufficient to distinguish the proposed mechanism from composition, geometry, processing history, or measurement artifacts? If no, redesign controls before proceeding.

4. **Mechanism Discrimination Experiment**
   - Collect at least two independent evidence streams (e.g., structural imaging plus transport measurement, or electrochemical data plus microscopy).
   - Maintain matched geometry, composition, and environmental conditions across groups.
   - Record variability, batch identity, and measurement context.

5. **Data Analysis & Triangulation**
   - Verify control behavior before interpreting test groups.
   - Compare modified versus baseline within matched contexts.
   - Test whether structure, composition, or process changes align with property outcomes.
   - Classify each conclusion:
     - `direct observation`
     - `control-supported inference`
     - `model-supported inference`
     - `literature analogy`
     - `speculative extension`

   > **Decision Gate 2 — Mechanism Convergence**: Do independent evidence streams support the same mechanism? If ambiguous, add direct readouts; if contradictory, proceed to Step 7.

6. **Simulation or Model Consistency Check** (when applicable)
   - Compare model predictions to measured critical states or trends.
   - Use model-measurement disagreement to identify missing physics (e.g., defects, connectivity, pinning, wetting, boundary effects).
   - Treat model agreement as support for assumptions, not as independent proof.

7. **Iteration or Redesign**
   - **If supported**: refine the design space and test boundary conditions (loading, scale, environment).
   - **If partially supported**: diagnose trade-offs (e.g., improved transport but increased resistance; improved retention but slower kinetics).
   - **If rejected**: pivot to an alternative mechanism or architectural lever.
   - **If controls fail**: pause causal interpretation and audit material identity, geometry, or measurement validity.
   - Update evidence strength and assumptions after each cycle.

   > **Decision Gate 3 — Claim Readiness**: Has the mechanism been validated independently of headline performance? If no, return to Step 3.

8. **Claim Bounding & Documentation**
   - State explicit boundaries: material class, scale, environment, and device format.
   - Separate paper-supported precedent from new-system inference.
   - Document residual failure modes, trade-offs, and risks.

# Output Format

When using this skill, return:

1. **Research question**: one clear question tied to a coupled bottleneck.
2. **Evidence map**: what is `paper-supported`, `literature-supported`, `inferred`, or `speculative`.
3. **Hypotheses table**: for each hypothesis, the mechanism, evidence strength, key assumptions, and failure modes.
4. **Experimental design**: variables, controls, primary and secondary metrics, and stop conditions.
5. **Analysis plan**: mechanism readouts, control comparison logic, trade-off assessment, and claim classification rules.
6. **Iteration plan**: decision rules for confirm, refine, diagnose, or pivot outcomes.
7. **Validity and safety notes**: confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Control Sufficiency Gate**: Baseline, single-function, negative, and process controls must be defined and plausibly behaved before causal claims.
- **Mechanism Isolation Gate**: At least two independent evidence streams must converge before accepting a mechanism.
- **Trade-off Transparency Gate**: Performance gains must be reported alongside penalties (e.g., added resistance, mass, volume, complexity, or degradation).
- **Scale/Boundary Gate**: Claims must be bounded to tested conditions; extrapolation requires explicit validation.

# Claim Boundaries

- **Direct observation**: measured outcome only.
- **Control-supported inference**: causal claim permitted only with appropriate controls.
- **Model-supported inference**: model agreement supports underlying assumptions, not standalone proof.
- **Speculative extension**: requires a labeled validation plan; do not present as established.
- Do not generalize from a single material system, device format, or study to field-wide consensus.

# Failure Modes

- Confounding by added mass, volume, surface area, or processing history.
- Activation, conditioning, or early-cycle artifacts masking the true mechanism.
- Measurement artifacts in imaging, impedance, kinetic extraction, transport, or mechanical data.
- Single-function control matches the full design, invalidating synergy claims.
- Performance gain accompanied by an unacceptable trade-off (e.g., stability loss, safety risk).
- Model-measurement divergence without identified cause.
- Structural evidence absent despite property improvement, leaving mechanism unresolved.

# Validity Checks

Before finalizing a plan or claim, check:

- **Confounding**: Do groups differ only in the intended variable, or do composition, geometry, environment, or measurement context vary?
- **Representativeness**: Are localized images or single batches treated as provisional unless bulk sampling is representative?
- **Reproducibility**: Are repeated measurements, independent batches, and variability reported for strong claims?
- **Statistical validity**: Are trends, effect sizes, and uncertainty reported rather than headline averages alone?
- **Consensus boundary**: Are single-study findings labeled as system-specific rather than field consensus?

# Provenance

- Synthesized from cluster `11.0` (observable-driven mechanism discovery and validation).
- Source skills: `coupled-flux-battery-research-design`, `dual-function-interface-battery-research-design`, `porous-material-stiff-soft-exploration`, `multifunctional-composite-research-workflow`, `textile-wicking-research-design`, `fiber-liquid-wetting-research-skill`, `metallic-tape-process-structure-property-exploration`, `functional-fiber-nanocomposite-research`.
- Preserves the shared workflow route: bottleneck framing → evidence-tiered hypothesis generation → control-matrix design → mechanism discrimination → multi-stream triangulation → iteration/redesign → explicit claim bounding.
