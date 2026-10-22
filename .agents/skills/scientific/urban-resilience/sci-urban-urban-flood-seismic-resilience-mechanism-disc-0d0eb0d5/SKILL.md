---
name: sci-urban-urban-flood-seismic-resilience-mechanism-disc-0d0eb0d5
description: A reusable end-to-end workflow for designing research studies that discover and validate mechanisms underlying urban resilience, flood, seismic, and infrastructure performance from observable evidence.
scienceevolve-title: "Urban hazard resilience · urban flood seismic resilience mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

This skill guides an agent in transforming observable hazard, performance, or vulnerability patterns into structured, testable research designs. It abstracts a shared pattern across urban flooding, seismic structural assessment, drainage and green infrastructure monitoring, and community resilience studies: decompose the system, generate mechanism-linked hypotheses, design controlled validation, and iterate from mismatch. The goal is research planning and hypothesis generation, not operational implementation or field execution.

# When to use

Use this skill when the user asks to:
- Generate new research questions about how urban systems respond to hazards or interventions.
- Design studies that compare candidate mechanisms explaining observed outcomes.
- Plan validation frameworks for model, sensor, or survey-based inference.
- Structure iteration rules for when initial hypotheses conflict with evidence.

Do not use this skill for operational emergency response, construction directives, site-specific engineering design approval, or executable high-risk operational parameters.

# Inputs required

Before producing a study plan, ask for or infer:
- **System boundary**: urban domain, structural system, infrastructure network, or community unit of interest.
- **Observable outcome**: flood extent, damage state, performance metric, defect signal, or resilience indicator.
- **Decision context**: whether the goal is mechanism discrimination, predictive validation, comparative assessment, or intervention evaluation.
- **Evidence inventory**: available observational data, remote-sensing products, monitoring records, surveys, or simulation resources, with known resolution and coverage.
- **Candidate mechanisms**: plausible physical, structural, hydrological, ecological, or socio-institutional processes that could explain the outcome.
- **Constraints**: data gaps, access limits, safety considerations, privacy rules, computational bounds, and governance context.

# Core Workflow

1. **Frame the system and decision gap**
   - Define the outcome and the coupled system (e.g., terrain-drainage-exposure, structure-demand-performance, or household-collective-institutional layers).
   - State the research question in terms of mechanism discrimination or performance comparison.
   - *Decision gate*: If the question cannot be framed as a testable contrast between at least one candidate mechanism and a baseline, stop and reformulate.

2. **Decompose into candidate mechanisms**
   - Map domains: sources, pathways, storage/sinks, exchanges, structural elements, or social layers.
   - Distinguish occurrence mechanisms from severity/performance mechanisms.
   - Mark which links are directly evidenced, inferred, or unknown.
   - *Decision gate*: If fewer than two plausible mechanisms exist, treat the study as exploratory mapping rather than mechanism discrimination.

3. **Generate ranked hypotheses**
   - For each candidate, write: *If mechanism X operates under context Y, then observable Z should differ from baseline B.*
   - Assign evidence strength (strong, moderate, weak, speculative).
   - Record key assumptions, likely failure modes, boundary conditions, and minimal viable validation.
   - *Decision gate*: If a hypothesis cannot be falsified with available or obtainable evidence, remove or redesign it.

4. **Design minimal viable validation**
   - Define unit of analysis, variables (independent, dependent, contextual), and comparison structure.
   - Specify controls: baseline, positive, negative, confounding, and sensitivity.
   - Separate calibration/training evidence from independent validation evidence.
   - Predefine stop conditions (e.g., confounders dominate, controls fail, data coverage is insufficient).
   - *Decision gate*: If the design cannot isolate the target mechanism from known confounders, simplify the scope or add stronger controls.

5. **Execute staged analysis**
   - Inventory data provenance, resolution, uncertainty, and known biases.
   - Descriptive: characterize gradients and outcome distributions.
   - Diagnostic: test associations, spatial/temporal overlays, and stratified comparisons.
   - Mechanistic: compare simplified versus coupled representations; trace failure modes.
   - *Decision gate*: If results do not survive baseline comparisons or sensitivity checks, proceed to iteration.

6. **Discriminate mechanisms and bound claims**
   - Compare observed patterns against each hypothesis.
   - Exclude mechanisms contradicted by negative controls or confounding checks.
   - Update evidence strength; narrow claim scope to validated contexts.
   - *Decision gate*: If no mechanism survives independent validation, report null results and boundary limits.

7. **Audit uncertainty and generalizability**
   - Quantify sensitivity to assumptions, parameters, and data sources.
   - State boundary conditions and transferability limits explicitly.
   - *Decision gate*: If scenario or policy implications extend beyond validated ranges, label them conditional and speculative.

8. **Iterate or redesign**
   - Use mismatch diagnostics to revise hypotheses, mechanism maps, or study design.
   - Preserve negative results as boundary evidence.
   - *Stop conditions*: Terminate if confounders dominate, data quality is irredeemable, controls fail repeatedly, or the model cannot reproduce required behavior at independent validation points.

# Output Format

When using this skill, produce:
1. **Research question** and system boundary.
2. **Mechanism map** linking domains, processes, and observable signals.
3. **Ranked hypotheses** with evidence strength, assumptions, failure modes, and minimal validation tests.
4. **Study design** including units, variables, controls, and stop conditions.
5. **Analysis plan** with staged workflow and robustness checks.
6. **Iteration rules** for updating hypotheses from mismatch.
7. **Claim boundary statement** specifying what is validated, provisional, or inferred.
8. **Validity and ethics summary** covering confounders, reproducibility, safety limits, and non-operational boundaries.

# Validation Gates

- **System framing gate**: The research question must be expressible as a mechanism-baseline contrast.
- **Hypothesis falsifiability gate**: Every active hypothesis must have a defined observation that could weaken or reject it.
- **Design isolation gate**: The study design must include at least one control that addresses the primary confounding pathway.
- **Evidence separation gate**: Calibration and validation evidence must be separated before interpreting performance.
- **Mechanism survival gate**: Claims require independent validation; calibration-only success is insufficient for mechanism acceptance.
- **Uncertainty bounding gate**: Scenario or transfer claims must carry explicit boundary conditions and sensitivity notes.

# Claim Boundaries

- This skill produces research designs and hypotheses, not operational directives, engineering approvals, or emergency instructions.
- Local or single-study findings are not treated as universal field consensus.
- Correlation and association patterns are not presented as causal proof without temporal ordering, controls, or appropriate identification.
- Simulation and model outputs are labeled as conditional on assumptions and validated ranges.
- Community and infrastructure vulnerability findings are framed as decision-support evidence, not as deterministic predictions or stigmatizing characterizations.

# Failure Modes

- **Mechanism misspecification**: The assumed causal chain omits a dominant process (e.g., backwater effects, demand amplification, or communication gaps).
- **Confounding dominance**: A contextual variable (e.g., rainfall heterogeneity, maintenance history, or socioeconomic gradient) explains the outcome better than the target mechanism.
- **Equifinality**: Multiple distinct mechanisms produce the same observable pattern, preventing unique discrimination.
- **Overfitting to calibration**: The model or pattern fits the tuning data but fails at independent validation.
- **Scale mismatch**: Conclusions change when the spatial or temporal unit of analysis changes, undermining stability.
- **Reporting bias**: Observable outcomes reflect exposure or reporting intensity rather than true hazard or performance differences.

# Validity Checks

Before finalizing a study plan, verify:
- **Confounding**: Have environmental variability, land-use change, maintenance status, boundary conditions, material properties, demand representation, governance changes, and socioeconomic gradients been considered?
- **Measurement validity**: Do indicators match the claimed mechanism and affected population? Are perception, reported behavior, observed behavior, and administrative records distinguished?
- **Statistical validity**: Are sample sizes adequate, uncertainty intervals reported, multiple comparisons addressed, and spatial/temporal dependence accounted for?
- **Reproducibility**: Are data sources, processing steps, assumptions, model configurations, and failed runs documented?
- **Boundary validity**: Are system type, hazard context, climate regime, governance setting, and data quality similar enough to justify transfer?
- **Ethical validity**: Are safety, privacy, community consultation, data governance, and non-operational boundaries addressed?

# Provenance

- Derived from cluster 4 / subcluster 4.0 ("observable-driven mechanism discovery and validation").
- Synthesized from source skills: coupled-hydrodynamic-flood-exploration, urban-convective-rainfall-warning-research, drainage-defect-monitoring-research, urban-pluvial-flood-terrain-exploration, seismic-performance-workflow, urban-flood-research-design, urban-flood-resilience-exploration, urban-green-infrastructure-research-design.
