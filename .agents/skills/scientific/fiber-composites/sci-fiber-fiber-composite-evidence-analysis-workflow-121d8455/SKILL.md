---
name: sci-fiber-fiber-composite-evidence-analysis-workflow-121d8455
description: A reusable end-to-end workflow for proposing, validating, and auditing evidence-based claims in fiber and composite material research through controlled hypothesis generation, multi-modal experimentation, and structured iteration.
scienceevolve-title: "Fiber composites and battery materials · fiber composite evidence analysis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform a materials research idea into a defensible, reproducible evidence-analysis workflow for fiber-involved composite systems. It guides an agent to generate falsifiable hypotheses, design controlled comparisons, link multi-modal observations to mechanisms, and bound claims—without reproducing paper-specific results or prescribing unsafe operational procedures.

# When to use

Use this skill when the user asks to:

- Propose new research questions for fiber-reinforced composites, textile architectures, porous fiber systems, cementitious fiber composites, soft composite sensors, or active polymer composites.
- Design non-operational research plans that compare material variants, architectures, or processing strategies.
- Plan multi-modal validation linking structure, property, and performance through experiments and models.
- Audit whether a hypothesis is sufficiently supported, falsifiable, and bounded by evidence.
- Diagnose failures or discrepancies in composite or fiber material behavior.

Do not use this skill for certified structural design, clinical advice, executable hazardous protocols, or as a substitute for institutional safety review.

# Inputs required

Before generating a research plan, collect or infer:

1. **System definition**: material class, fiber or matrix type, architecture, scale, and intended service environment.
2. **Target performance**: functional requirement, mechanical metric, physical response, or sensing output of interest.
3. **Design variable**: the primary controllable feature hypothesized to affect performance (e.g., architecture, interface, filler, stimulus).
4. **Available evidence**: prior experiments, simulations, imaging, spectroscopy, or literature trends.
5. **Baseline and comparators**: unmodified reference, negative control, positive or benchmark control, and process control where feasible.
6. **Constraints**: safety limits, measurement access, reproducibility requirements, and intended claim boundaries.

If inputs are incomplete, state assumptions explicitly and design the first pass as a minimal viable validation rather than a definitive study.

# Core Workflow

Follow this ordered end-to-end route, applying decision gates and stop conditions at each stage.

1. **Frame the gap and bound the question**
   - Define the unresolved performance gap and the specific structure-property claim to be tested.
   - **Decision gate**: Is the question falsifiable and bounded to a testable material system? If no, refine scope or stop.

2. **Generate mechanism-linked hypotheses**
   - Map the design variable to a mechanistic intermediate and then to an observable prediction.
   - Label evidence strength (strong / moderate / weak / speculative), key assumptions, likely failure modes, and a stop condition for each.
   - **Decision gate**: Does every hypothesis have a falsifiable prediction and a minimal validation test? If no, strengthen before proceeding.

3. **Design controlled comparison**
   - Specify baseline, modified variant(s), negative control, positive or benchmark control, and process controls.
   - Lock independent variables, dependent variables, covariates, and primary metrics.
   - Predefine acceptance, inconclusive, and rejection thresholds.
   - **Decision gate**: Can the primary variable be isolated from processing, geometry, and environmental confounders? If no, redesign controls.

4. **Execute minimal viable validation**
   - Collect the smallest dataset that can challenge the core causal chain.
   - **Stop conditions**: Safety limits exceeded; controls fail; measurement variability dominates expected effect; modification degrades essential properties without compensating benefit.

5. **Analyze with mechanism separation**
   - Apply consistent preprocessing and exclusion rules across all groups.
   - Quantify effect size with uncertainty; check multi-metric consistency.
   - Separate results into observed, inferred, and extrapolated categories.
   - **Decision gate**: Do results exceed noise and match the predicted direction? If inconclusive, improve resolution or reduce variability before expanding.

6. **Validate against independent evidence**
   - Compare predictions with reference measurements, alternative characterization, or model trends.
   - Require trend agreement and mechanistic plausibility before interpreting detailed parameters.
   - **Decision gate**: Does independent evidence support the proposed mechanism? If contradictory, diagnose discrepancy (geometry, boundary conditions, missing physics, or metric mismatch) before iterating.

7. **Iterate or pivot**
   - **Supported**: Conceptually optimize the design variable and test boundary conditions.
   - **Partially supported**: Identify the bottleneck (e.g., interface, architecture, transition, dispersion) and revise one variable at a time.
   - **Contradicted**: Reject or reframe the hypothesis; stop if the causal chain is invalidated.
   - **Inconclusive**: Add targeted controls or improve measurement fidelity.
   - **Stop condition**: Hypothesis invalidated after targeted revision; mechanism cannot be distinguished from confounding; or further tuning worsens both target and essential metrics.

8. **Audit claims and bound outputs**
   - Label every claim as observed, inferred, analogous, or speculative.
   - Restrict claims to the tested material family, architecture, loading regime, and measurement scale.

# Output Format

When using this skill, produce:

1. **Research question** — One concise, bounded question tied to a performance gap.
2. **Gap and rationale** — What is unresolved, what evidence supports it, and what remains uncertain.
3. **Hypothesis set** — For each hypothesis: evidence strength, mechanism, key assumptions, predicted result, likely failure mode, minimal validation, and stop condition.
4. **Experimental design** — Baseline, modified groups, controls, independent variables, controlled variables, primary metrics, and stop conditions.
5. **Analysis plan** — Data preprocessing, uncertainty reporting, multi-metric consistency checks, visualization rules, and interpretation guidelines.
6. **Iteration plan** — Decision rules for supported, partially supported, contradicted, and inconclusive outcomes.
7. **Validity and safety review** — Confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.
8. **Claim boundary statement** — Evidence labels and explicit scope limits.

# Validation Gates

Before accepting a proposed research plan or conclusion, verify:

- **Gap validity**: The research question addresses a real unresolved problem, not only a single prior conclusion.
- **Mechanism validity**: The hypothesis specifies how the design variable alters the target behavior through a mechanistic intermediate.
- **Control validity**: Baseline, negative, positive or benchmark, and process controls are defined where feasible.
- **Confounding control**: Geometry, mass, porosity, processing history, environmental exposure, and measurement conditions are tracked.
- **Measurement validity**: Metrics are extracted by repeatable, comparable methods tied to the application requirement.
- **Statistical validity**: Effect size, uncertainty, replication plan, and rejection criteria are defined before testing.
- **Model validity**: Model parameters are identifiable, assumptions explicit, and sensitivity analysis planned.
- **Boundary validity**: Claims are limited to the tested material family, architecture, loading regime, and scale.
- **Reproducibility**: Data processing, exclusion rules, model assumptions, and reporting templates are documented.
- **Safety validity**: The plan avoids high-risk operational details and remains within approved institutional controls.

# Claim Boundaries

- **Observed**: Directly supported by data from the current study.
- **Inferred**: Supported by mechanism reasoning plus controls, but not directly measured.
- **Analogous**: Supported by comparable systems; requires validation in the current system.
- **Speculative**: Plausible but untested; clearly marked as requiring future work.
- Do not treat single-source evidence as domain consensus.

# Failure Modes

- **Mechanism failure**: The proposed causal chain does not operate (e.g., weak interface, absent reversible transition, invalid scaling assumption).
- **Process confounding**: Apparent effect caused by dispersion heterogeneity, voids, thickness variation, or processing history rather than the design variable.
- **Measurement artifact**: Noise, drift, calibration error, or mismatched metric obscures the true effect.
- **Model misalignment**: Simplifications, boundary condition mismatch, or non-identifiable parameters produce misleading predictions.
- **Control failure**: Baseline or negative control behaves unexpectedly, invalidating the comparison.
- **Scale mismatch**: Lab-scale observation does not translate to the intended application scale or environment.
- **Trade-off reversal**: Improvement in the target metric degrades an essential property beyond the predefined tolerance.

# Validity Checks

- Are hypotheses falsifiable with defined rejection criteria?
- Are controls sufficient to isolate the design variable from processing and environmental artifacts?
- Are all primary metrics tied to the application requirement rather than material novelty alone?
- Are working range, failure criteria, and stopping conditions defined before testing?
- Are confounders (temperature, humidity, contact quality, geometry, aging) addressed in the design or analysis?
- Is variability quantified through replicates, repeated cycles, or multiple channels?
- Are model inputs grounded in measured properties where possible, and are simplifications stated?
- Are exclusions and preprocessing decisions documented before interpretation?
- Are safety and ethics constraints appropriate, non-operational, and aligned with institutional review?

# Provenance

- Synthesized from cluster 71, subcluster 71.0 (composite-fiber-cellulose-natural-evidence-analysis-workflow).
- Source skills: nanofiber-composite-exploration, 3d-woven-composite-modeling-workflow, biomass-fiber-shape-memory-research-workflow, tunable-active-composite-research-design, thermally-exposed-fiber-concrete-research, soft-composite-sensing-research-flow, viscoelastic-domain-bridge-research, biofiber-porous-foam-acoustic-research.
- Represents the shared "observable-driven evidence analysis and claim audit" archetype across fiber and composite material domains.
