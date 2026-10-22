---
name: sci-fiber-fiber-polymer-composite-hypothesis-workflow-3ce046c8
description: End-to-end reusable workflow for generating mechanistic hypotheses, designing controlled experiments, and iterating evidence-based conclusions in fiber-reinforced polymer composite research.
scienceevolve-title: "Fiber composites and battery materials · fiber polymer composite hypothesis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help agents translate performance gaps in fiber-reinforced polymer composites into testable mechanistic hypotheses, design minimal viable validation with strong controls, analyze multi-scale evidence chains, and iterate based on structured decision gates. The workflow abstracts shared research patterns across bio-based, synthetic, and hybrid fiber systems without embedding material-specific parameters, numerical results, or conclusions from individual papers.

## When to use

- When proposing new research questions for fiber-reinforced polymer composites involving natural, synthetic, recycled, or hybrid fibers.
- When connecting interface, dispersion, or structural variables to mechanical, thermal, rheological, functional, or degradation behavior.
- When designing experiments that must distinguish fiber contributions, matrix contributions, interface effects, and processing artifacts.
- When iterating material design based on multi-scale characterization and statistical validation.
- Not for clinical or medical applications, operational lab recipes, direct manufacturing scale-up, or safety-critical structural certification without additional engineering review.

## Inputs required

Before execution, gather or request:

- **Target application and performance priorities**: stiffness, toughness, thermal stability, processability, durability, or environmental performance.
- **Candidate material classes**: fiber type, matrix type, and interface strategy at a conceptual level (not specific commercial grades or doses).
- **Known constraints**: equipment capabilities, safety boundaries, statistical power requirements, environmental/ethical limits, and regulatory context.
- **Prior evidence**: literature trends, preliminary data, observed failure modes, and baseline performance benchmarks.
- **Boundary conditions**: which variables may vary, which must be fixed, and minimum acceptable thresholds for key metrics.

If inputs are insufficient, output an "information gaps" list and a low-risk exploratory question rather than unsupported conclusions.

## Core Workflow

Execute the following ordered route. Do not skip decision gates.

1. **Scope and Gap Definition**
   - Frame the performance gap as a specific, testable material mechanism (e.g., load transfer, dispersion limit, defect accumulation, phase morphology).
   - Identify whether the bottleneck most likely resides in the fiber phase, matrix phase, interphase, or processing/assembly history.
   - **Decision Gate A (Testability)**: If the gap cannot be expressed as a falsifiable mechanism, stop and reformulate the research question.

2. **Mechanism Mapping**
   - Decompose the system into fiber, matrix, interphase, and structural/assembly levels.
   - List observable intermediate mechanisms that could explain the macroscopic gap (e.g., interfacial adhesion, fiber orientation/distribution, porosity, network formation, thermal degradation).
   - **Decision Gate B (Falsifiability)**: If no observable intermediate mechanism can be defined, stop; the hypothesis is not empirically testable.

3. **Hypothesis Generation**
   - Generate candidate hypothesis cards. Each card must include:
     - Core prediction (if X changes, then Y mechanism occurs, producing Z observable shift).
     - Evidence strength: high (literature-supported in analogous systems), medium (mechanistically plausible), or low (speculative/analogous).
     - Key assumptions required for the prediction to hold.
     - Failure modes (e.g., over-treatment damage, brittle interphase, agglomeration, processing degradation).
     - Falsifiable indicators (data patterns that would reject the hypothesis).
   - Prioritize hypotheses that are minimally viable: testable with few variables, clear contrasts, and measurable multi-scale indicators.

4. **Experimental Design**
   - Define variable hierarchy:
     - Independent variables: fiber content, interface strategy, assembly method, or environmental exposure (conceptual, not operational parameters).
     - Controlled variables: material batch, moisture state, thermal history, specimen geometry, and test environment.
     - Response variables: mechanical, thermal, rheological, morphological, and functional metrics.
   - Establish mandatory controls:
     - Baseline matrix (no fiber/filler).
     - Unmodified fiber/filler (no interface treatment).
     - Process control (same processing without target modification).
     - Positive control (known effective strategy for this class of materials).
     - Negative control (inert or blocking strategy expected to produce no improvement).
   - Set evaluation tiers: primary (application-critical), mechanism (intermediate explanatory), and risk (degradation, batch variance, safety, processability).
   - Pre-define stop conditions: unacceptable safety risk, baseline irreproducibility, uncontrollable confounders, or severe performance trade-offs that violate constraints.

5. **Structural and Quality Validation Gate**
   - Before attributing performance differences to the target mechanism, verify that the intended structures/interfaces exist (e.g., dispersion state, interphase formation, phase morphology, fiber length retention).
   - Audit data quality: batch records, replication, missing data, outlier rules, instrument calibration, and environmental logs.
   - **Decision Gate C (Fidelity)**: If structural validation fails or data quality is insufficient, pause performance interpretation and fix preparation or measurement protocols.

6. **Multi-Scale Evidence Analysis**
   - Link observations across scales:
     - Molecular/interphase: chemical/physical interaction indicators.
     - Microscale: dispersion, defects, fiber dimensions/orientation, porosity, interface morphology.
     - Macroscale: mechanical, thermal, rheological, functional, and degradation responses.
   - Apply appropriate statistical methods; report effect sizes, confidence intervals, and uncertainty. Avoid relying solely on significance testing.
   - Map performance changes to mechanism predictions. Flag inconsistencies as evidence for alternative explanations or uncontrolled confounders.

7. **Mechanistic Evaluation Gate**
   - Classify findings:
     - **Supported**: Performance trend aligns with interphase/structure evidence, statistical support is adequate, and confounders are ruled out.
     - **Phenomenological**: Performance changes but interphase/structure evidence is absent or contradictory; mechanism remains unverified.
     - **Limited**: Statistically detectable but practically negligible effect size.
     - **Refuted/Confounded**: Results contradict prediction or are better explained by processing artifacts, measurement error, or alternative mechanisms.
   - **Decision Gate D (Rigor)**: Do not advance to iteration until the classification is justified by multi-scale evidence and statistical adequacy.

8. **Iteration, Pivot, or Termination**
   - **If supported**: Narrow the design space; add robustness checks (batch-to-batch, environmental exposure, long-term aging); test boundary conditions.
   - **If partially supported**: Disentangle interactions by isolating one variable at a time; add mechanism-specific characterization.
   - **If refuted**: Document failure modes; check key assumptions (processing damage, unexpected phase behavior, moisture effects); generate competing hypotheses.
   - **If performance trade-offs emerge**: Use multi-objective framing rather than single-metric optimization; explicitly record non-negotiable constraints.
   - **Termination triggers**: Uncontrolled safety hazards, invalid controls, irreproducible data, inability to distinguish mechanism from artifact, or violation of ethical/safety boundaries.

9. **Synthesis and Boundary Setting**
   - Assemble a structured research record.
   - Explicitly separate verified observations, mechanism inferences, and untested extrapolations.
   - State applicability boundaries: material classes, variable ranges, processing routes, and environmental conditions tested.

## Output Format

When using this skill, produce:

1. **Research question and system boundaries**: target application, performance gap, and non-negotiable constraints.
2. **Mechanism map and candidate hypothesis table**: hypotheses, evidence strength, key assumptions, failure modes, and falsifiable indicators.
3. **Minimal viable experimental design**: variable hierarchy, control groups, evaluation tiers, and stop conditions.
4. **Analysis plan**: multi-scale evidence chain, statistical methods, visualization strategy, and uncertainty handling.
5. **Iteration roadmap**: decision branches for supported, partially supported, and refuted outcomes.
6. **Validity checklist and claim boundary statement**: explicit classification of conclusions as verified, inferred, or speculative, with generalizability limits.

## Validation Gates

- **Gate A (Testability)**: The performance gap must be framed as a falsifiable material mechanism before proceeding.
- **Gate B (Falsifiability)**: Every hypothesis must have observable intermediate mechanisms and predefined rejection criteria.
- **Gate C (Structural Fidelity)**: Intended microstructures and interfaces must be confirmed before performance is attributed to the target mechanism.
- **Gate D (Statistical Rigor)**: Claims require adequate replication, effect size reporting, and checked model assumptions.
- **Gate E (Mechanistic Coherence)**: Chemical, thermal, morphological, and mechanical evidence must point to a consistent explanation; inconsistencies trigger confounder review.

## Claim Boundaries

- **Verified**: Directly supported by current experimental data and valid controls within the tested system.
- **Inferred**: Mechanistically plausible and consistent with analogous literature, but not directly proven in the present system.
- **Speculative**: Depends on additional untested assumptions; must be flagged as pending validation.
- Do not present single-system results as domain consensus.
- Do not extrapolate beyond tested material combinations, processing histories, or environmental conditions.
- Do not convert laboratory material performance into structural safety, human exposure safety, or environmental certification without dedicated validation.

## Failure Modes

- **Hypothesis failure**: Predicted interface/structure improvement does not occur; performance gains are actually driven by uncontrolled confounders (e.g., porosity, orientation, moisture).
- **Experimental failure**: Controls are invalid (positive control ineffective, negative control shows improvement), indicating systemic preparation or measurement errors.
- **Analysis failure**: Single-scale interpretation (e.g., mechanical data without morphological evidence) leads to false mechanism attribution.
- **Iteration failure**: Adding variables or complexity despite unresolved data quality, invalid controls, or uncharacterized structural states.
- **Safety/Ethics failure**: Generating operational hazardous protocols, or extrapolating laboratory data to safety-critical applications without appropriate review.

## Validity Checks

Before finalizing any output, confirm:

- **Confounders controlled**: fiber source/morphology, moisture content, thermal history, processing defects, batch variance, specimen geometry, and test conditions are recorded and constrained.
- **Controls present**: baseline matrix, unmodified fiber, process control, positive control, and negative control are all defined.
- **Replication and randomization**: sufficient repeats, independent batches, and blinded measurement protocols where feasible.
- **Statistical adequacy**: model assumptions verified, effect sizes reported, multiple comparisons addressed, and exploratory findings labeled as such.
- **Mechanistic consistency**: multi-scale evidence forms a coherent chain; contradictions are explained rather than ignored.
- **Boundary conditions**: explicit limits on material classes, variable ranges, and environmental applicability.
- **Non-operational**: no direct fabrication recipes, hazardous parameters, equipment settings, or scaling protocols are included.

## Provenance

- Synthesized from cluster 24.0 (composite-fiber-interface-polymer-hypothesis-workflow).
- Derived from source skills: bio-composite-exploration-workflow; aramid-nanofiber-composite-research-workflow; interphase-guided-composite-research; natural-fiber-biocomposite-exploration; sustainable-fiber-composite-exploration; natural-fiber-hybrid-composite-exploration; biocomposite-research-exploration; biodegradable-polymer-composite-exploration.
- Represents the shared end-to-end workflow route for hypothesis generation, controlled experimentation, and evidence-based iteration in fiber-reinforced polymer composite research.
