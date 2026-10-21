---
name: sci-fiber-fiber-composite-polymer-interface-evidence-an-60d604e0
description: End-to-end evidence analysis and claim audit workflow for fiber-reinforced polymer composite interface research, from bottleneck identification through hypothesis generation, minimal validation design, multi-scale analysis, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · fiber composite polymer interface evidence analysis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent translate performance bottlenecks in fiber-reinforced polymer composites into structured, auditable research programs. The workflow moves from gap definition through mechanism mapping, falsifiable hypothesis generation, minimal validation design, multi-indicator analysis, and iterative claim bounding—without replicating source-specific material recipes or paper conclusions.

## When to use

- When proposing new research questions around fiber-matrix interface performance, load transfer, durability, or process-structure-property relationships.
- When evaluating whether an interface modification, structural change, or processing route plausibly improves composite performance.
- When designing experiments that must distinguish interface mechanisms from artifacts, defects, or bulk property changes.
- When auditing existing claims to determine if evidence supports causal inference or only correlational trends.

## Inputs required

- Target composite system described generically (reinforcement class, matrix class, intended performance domain).
- Performance bottleneck or observed failure mode (e.g., debonding, property scatter, environmental degradation).
- Candidate mechanism variables (interface chemistry, morphology, dispersion, orientation, processing history).
- Available evidence tier: direct measurement, indirect analogy, theoretical inference, or unexplored conjecture.
- Constraints: safety boundaries, reproducibility requirements, and applicable characterization scope.

## Core Workflow

1. **Bottleneck & Gap Definition**  
   State the performance shortfall and its operational context. Decompose the bottleneck into candidate structure, interface, or process variables.  
   *Decision gate:* If the bottleneck cannot be mapped to at least one observable structure, interface, or process variable, stop and reformulate the research question.

2. **Mechanism Mapping**  
   Build a causal graph linking candidate variables to the bottleneck. Tag observable intermediate variables and known confounders (e.g., volume fraction variations, processing defects, environmental state).  
   *Decision gate:* If the map lacks an observable intermediate connecting the candidate cause to the performance outcome, return to Step 1.

3. **Hypothesis Generation**  
   Produce 2–4 falsifiable hypotheses. Each must include:  
   - Evidence strength (high / medium / low / insufficient)  
   - Key assumptions required for the causal chain to hold  
   - Predicted observable signatures across at least two measurement scales  
   - Stated failure modes (conditions that would invalidate the hypothesis)  
   *Decision gate:* If no hypothesis is distinguishable from its alternatives with available or attainable indicators, stop and expand characterization scope.

4. **Validation Design**  
   Construct a minimal viable validation matrix:  
   - Baseline (unmodified system)  
   - Positive control (known effective reference, non-source-specific)  
   - Negative control (intervention blocked or inert)  
   - Process control (same handling without target mechanism change)  
   Define independent variables, dependent variables, covariates, and pre-registered stop conditions.  
   *Decision gate:* If the matrix cannot isolate the interface/structure mechanism from processing artifacts or bulk property changes, redesign before proceeding.

5. **Evidence Collection & Quality Control**  
   Gather multi-scale data (structural, interfacial, mechanical, thermal, or transport as relevant). Record provenance, batch identifiers, repeat counts, and anomaly handling rules.  
   *Stop condition:* Abort if data quality fails predefined thresholds (excessive missing data, control group anomaly, irreproducible baseline).

6. **Multi-Indicator Analysis**  
   Analyze structure, interface, and performance indicators jointly. Use dimensionless groups or normalized metrics to compare across conditions. Quantify uncertainty (repeatability, confidence intervals, effect size).  
   *Decision gate:* If structure and interface indicators move opposite to performance, or if controls fail, classify as confounded and return to Step 2.

7. **Claim Adjudication**  
   Classify each hypothesis:  
   - **Supported:** Convergent evidence across scales; assumptions hold; controls valid.  
   - **Partially supported:** Performance trend observed but mechanism evidence incomplete, or mechanism evidence exists without significant performance change.  
   - **Not supported:** Predicted signatures absent or contradicted by controls.  
   - **Assumption violated:** A prerequisite fails, invalidating the test.  
   *Decision gate:* If adjudication is "not supported" or "assumption violated," proceed to Step 8 with a revised or alternative hypothesis.

8. **Iteration or Termination**  
   - If supported: Narrow the boundary of applicability and design stronger specificity tests.  
   - If partially supported: Isolate the weakest link in the causal chain and return to Step 4 with targeted diagnostics.  
   - If not supported: Document failure modes, revise mechanism map, and return to Step 3.  
   *Stop conditions:*  
   (a) Mechanism evidence remains absent after two cycles.  
   (b) Performance gains are offset by defect introduction or increased scatter.  
   (c) Reproducibility cannot be achieved across batches.  
   (d) Safety or compliance boundaries are reached.

## Output Format

The agent should produce:

1. **Research question** and bottleneck statement.
2. **Mechanism map** with confounder tags.
3. **Hypothesis table** (evidence strength, assumptions, predicted signatures, failure modes).
4. **Validation matrix** (groups, variables, controls, stop conditions).
5. **Analysis summary** (quality checks, cross-scale correlations, uncertainty quantification).
6. **Claim adjudication** with boundary statements.
7. **Iteration plan** or termination rationale.
8. **Validity and safety notes**.

## Validation Gates

- Structural evidence must precede performance interpretation.
- Controls must validate before mechanism claims are accepted.
- Uncertainty must be quantified before ranking hypotheses.
- Reproducibility must be demonstrated before boundary expansion.

## Claim Boundaries

- Distinguish "observed in this system" from "generalizable to other fiber-matrix combinations."
- Distinguish "consistent with mechanism" from "mechanism proven."
- Do not extrapolate across scales, chemistries, or processing routes without explicit re-validation flags.
- Mark all analogical inferences (cross-material or cross-literature) as low-evidence until independently tested.

## Failure Modes

- **Confounding:** Bulk property changes or processing artifacts mistaken for interface effects.
- **Overfitting:** Mechanism inferred from a single indicator or unreplicated sample.
- **Weak boundary layer:** Intervention creates a new failure mode (e.g., embrittlement, plasticization) that offsets gains.
- **Non-monotonicity:** Optimal window missed because only extreme values were tested.
- **Irreproducibility:** Batch-to-batch variation exceeds treatment effect.
- **Assumption drift:** Key premises (e.g., uniform dispersion, linear response) fail during testing.

## Validity Checks

- **Confounder audit:** fiber volume fraction, orientation, porosity, processing history, environmental state, and measurement geometry.
- **Reproducibility:** independent repeats, batch tracking, and documented exclusion criteria.
- **Statistical adequacy:** pre-registered primary indicators, reported effect sizes, and uncertainty propagation.
- **Mechanistic consistency:** structural, interfacial, and performance indicators must point in the same direction; if not, list alternative explanations.
- **Limit consistency:** models should reduce to known limits (e.g., zero reinforcement, infinite interface stiffness) without contradiction.
- **External validity:** single-study or single-system results must not be presented as field consensus.

## Provenance

- Synthesized from cluster 2 / subcluster 2.0 (fiber-composite-polymer-interface evidence analysis).
- Source skill references: soft-interface-mechanics-research, natural-fiber-composite-thermal-exploration, fiber-composite-structure-process-property-exploration, composite-photonic-film-research-design, shape-memory-fiber-exploration, polymer-fiber-bonding-research, composite-interface-exploration, plant-fiber-composite-interface-exploration.
- No source-specific material recipes, numerical parameters, or paper conclusions are embedded in the workflow body.
