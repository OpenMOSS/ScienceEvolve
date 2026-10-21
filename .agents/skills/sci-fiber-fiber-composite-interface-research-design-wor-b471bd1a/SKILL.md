---
name: sci-fiber-fiber-composite-interface-research-design-wor-b471bd1a
description: End-to-end research design workflow for hybrid, fiber-reinforced, and interface-dominated material systems, covering hypothesis generation, controlled experimentation, multi-scale analysis, and iterative validation.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface research design workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Provide a reusable, mechanism-driven research design workflow for multi-phase, hybrid, and interface-critical material systems. The workflow translates performance gaps into falsifiable hypotheses, designs minimal viable validations with strong controls, and iterates based on multi-scale evidence triangulation—without prescribing operational fabrication steps or material-specific recipes.

## When to use

- The user needs to formulate new research questions for hybrid composites, fiber-reinforced systems, layered architectures, or materials where interfaces dominate performance.
- The task requires generating candidate hypotheses, designing experiments, defining evaluation metrics, or planning iterative validation cycles.
- The user wants to migrate methodological patterns from literature to a new material system, structure, or application context.
- Do not use when the request demands direct operational protocols, hazardous fabrication parameters, manufacturing scale-up details, clinical/health efficacy claims, or treatment of a single paper’s conclusions as domain consensus.

## Inputs required

- **Target system**: Material classes, architecture type, and known constraints.
- **Performance gap**: Specific deficits in mechanical, transport, thermal, acoustic, electrochemical, or functional behavior mapped to an application need.
- **Prior evidence**: Literature clues, preliminary data, modeling capabilities, and available characterization methods.
- **Design constraints**: Resource limits, safety boundaries, environmental/ethical limits, and non-negotiable performance thresholds.
- **Evaluation priorities**: Primary metrics, secondary constraints, failure criteria, acceptable uncertainty, and extrapolation scope.

## Core Workflow

1. **Decompose the performance gap into a mechanism map**
   - Map the observed deficit onto candidate mechanism nodes (e.g., interfacial load transfer, phase connectivity, transport pathways, structural stability, environmental degradation).
   - Identify which nodes are actionable via design variables and which are fixed constraints.
   - **Decision gate — Scope gate**: If the gap cannot be decomposed into testable mechanism nodes, stop and refine the problem definition.

2. **Generate ranked, falsifiable hypotheses**
   - Produce 2–5 candidate hypotheses using the format: *structural intervention → mechanism change → observable metric → predicted directional effect*.
   - Annotate each with evidence strength (high / medium / low), key assumptions, and explicit failure modes.
   - **Decision gate — Candidate gate**: Reject hypotheses that are not falsifiable, rely solely on analogy without structural rationale, or exceed safety/resource boundaries.

3. **Design a minimal viable validation (MVV)**
   - Define independent variables (structural, interfacial, compositional), dependent variables (mechanism-level and performance-level metrics), and controlled confounders.
   - Establish a control hierarchy:
     - **Baseline**: unmodified reference system.
     - **Negative control**: system lacking the target mechanism but otherwise similar.
     - **Positive control**: known benchmark or validated strategy.
     - **Process control**: accounts for preparation and measurement variability.
   - Pre-register stop conditions (e.g., no improvement over baseline, mechanism–performance contradiction, irreproducibility, unacceptable trade-offs).
   - **Decision gate — Safety/compliance gate**: If the MVV design requires operational hazardous protocols or unreviewed exposure risks, redesign to non-operational boundaries or halt.

4. **Acquire multi-scale evidence**
   - Collect data across structural, interfacial, mechanism-specific, and performance scales.
   - Record sample provenance, batch identifiers, environmental history, and test conditions.
   - **Decision gate — Data quality gate**: If repeat samples show unacceptable dispersion, batch inconsistencies, or missing metadata, halt and audit preparation/measurement chains before proceeding.

5. **Triangulate and analyze**
   - Compare target systems against the full control hierarchy under normalized conditions.
   - Require at least two independent evidence classes to support any mechanism claim (e.g., structural + kinetic, or interfacial + performance).
   - Distinguish correlation from causation; flag potential confounders (e.g., density, thickness, porosity, loading, history).
   - **Decision gate — Mechanism exclusion gate**: If independent evidence classes conflict and cannot be reconciled by identified confounders, downgrade the claim strength or reject the hypothesis.

6. **Assess robustness and boundary conditions**
   - Verify trend consistency across repeats, batches, and boundary variations.
   - Evaluate multi-objective trade-offs; flag Pareto frontiers or irreconcilable conflicts.
   - **Decision gate — Robustness check**: If results are irreproducible, dominated by uncontrolled variability, or violate critical constraints, return to Step 2 (hypothesis revision) or Step 3 (redesign).

7. **Iterate or terminate**
   - **Fully supported**: Extend to stricter boundary conditions or adjacent systems; update evidence strength to high only after independent replication.
   - **Partially supported**: Refine the mechanism map and design decoupling experiments to isolate competing variables.
   - **Unsupported**: Preserve raw data, update the causal map, and formulate alternative hypotheses.
   - **Decision gate — Iteration gate**: After a pre-defined number of cycles or if stop conditions are triggered, finalize the claim boundary statement and exit the loop.

8. **Synthesize the study plan and claim boundary statement**
   - Compile the research question, hypothesis record, experimental design, analysis logic, and iteration history.
   - Explicitly label the evidentiary status of each conclusion (directly observed, mechanism-inferred, or extrapolated).

## Output Format

Deliver a structured study plan containing:

1. **Research question** — One-sentence definition of the scientific problem and its mechanism bottleneck.
2. **Candidate hypotheses** — Table with columns: hypothesis statement, mechanism chain, evidence strength, key assumptions, failure modes, minimal validation approach.
3. **Experimental design** — Variables, control hierarchy, evaluation metrics, and pre-registered stop conditions.
4. **Analysis plan** — Data handling, multi-evidence triangulation rules, statistical approach, and mechanism attribution logic.
5. **Iteration plan** — Actions for fully supported, partially supported, unsupported, and side-effect outcomes.
6. **Validity and boundary statement** — Confounders checked, reproducibility requirements, extrapolation limits, and non-operational safety boundaries.

## Validation Gates

- **Scope gate**: The performance gap must resolve into testable mechanism nodes before hypothesis generation proceeds.
- **Candidate gate**: Every hypothesis must be falsifiable and bounded by explicit key assumptions.
- **Safety/compliance gate**: Experimental designs must remain at the research-planning level; operational hazard details are excluded.
- **Data quality gate**: Raw data must pass repeatability and metadata completeness checks before analysis.
- **Mechanism exclusion gate**: Mechanism claims require convergent evidence from at least two independent measurement classes.
- **Robustness check**: Trends must replicate across samples/batches and survive normalization for confounders.
- **Iteration gate**: A hard stop or pivot is enforced when pre-registered stop conditions are met or after a capped number of redesign cycles.

## Claim Boundaries

- **Observation-level claims**: Describe measured trends under the exact tested conditions.
- **Mechanism-level claims**: Require convergent multi-scale evidence and explicit control comparisons; must be labeled as “supported,” “partially supported,” or “not supported.”
- **Extrapolation-level claims**: Cross-system, cross-scale, or cross-environment inferences are permitted only as analogies labeled “requires independent validation.”
- Do not present single-study or single-sample results as domain consensus, statistical proof, or guaranteed performance.

## Failure Modes

- **Hypothesis drift**: Hypotheses become untestable because key variables are coupled or definitions are vague.
- **Confounding dominance**: Performance changes arise from thickness, density, loading, history, or environmental differences rather than the target mechanism.
- **Mechanism misattribution**: A single evidence stream is over-interpreted as causal proof without control triangulation.
- **Irreproducibility**: Uncontrolled preparation or measurement variance produces spurious trends.
- **Unsafe extrapolation**: Laboratory-scale observations are projected to unverified engineering, clinical, or environmental contexts.
- **Iteration lock-in**: Continuing to optimize a failed hypothesis because stop conditions were not pre-registered or enforced.

## Validity Checks

- **Confounders**: Have material content, geometry, porosity, density, processing history, environment, and test protocols been normalized or recorded?
- **Reproducibility**: Are independent repeats, batch variations, and outlier handling rules documented?
- **Statistical validity**: Is sample size and uncertainty reporting appropriate for the claimed effect direction?
- **Mechanism consistency**: Do structural, interfacial, kinetic, and performance evidence point to the same explanation?
- **Boundary conditions**: Are conclusions restricted to the tested material classes, architectures, and environments?
- **Control integrity**: Does the control hierarchy include baseline, negative, positive, and process controls under identical test conditions?
- **Evidence labeling**: Is every conclusion tagged by its evidentiary source and strength?

## Provenance

This workflow was synthesized from cluster `61.0` (cluster_id 61) of the scientific skills codex. Representative source skills contributing to the merged pattern include:

- `li-s-battery-binder-research-workflow` (skill_id: `10.1016_j.carbon.2024.118807`)
- `hybrid-composite-thermal-research` (skill_id: `fiber__10.1016_j.compstruct.2018.05.009`)
- `janus-conductive-fiber-research` (skill_id: `fiber__10.1021_acsami.5c24720`)
- `natural-fiber-hybrid-composite-exploration` (skill_id: `fiber__10.3390_jcs8010031`)
- `li-s-battery-shuttle-research-workflow` (skill_id: `10.1007_s40820-023-01223-1`)
- `hybrid-laminate-research-exploration` (skill_id: `fiber__10.1016_j.compstruct.2018.11.037`)
- `fiber-acoustic-structure-research-workflow` (skill_id: `fiber__10.1177_00405175221084736`)
- `lithium-sulfur-battery-research-exploration` (skill_id: `10.1002_adfm.202405814`)

These sources provided the shared methodological pattern; no source-specific material systems, numerical results, or paper conclusions are embedded in this reusable workflow.
