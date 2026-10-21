---
name: sci-fiber-composite-fiber-interface-cathode-research-de-cef79b8d
description: End-to-end reusable workflow for generating falsifiable hypotheses, designing controlled validations, and iterating on composite, fiber, interface, and cathode material systems without embedding source-specific parameters or operational recipes.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface cathode research design workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent migrate a process–structure–property or structure–interface–performance research paradigm to new problems across composite, fiber-reinforced, interfacial, and cathode material systems. The workflow focuses on defining research gaps, generating falsifiable mechanism hypotheses, designing variable matrices with adequate controls, linking multi-scale evidence, and updating hypotheses based on empirical feedback.

## When to use

- When the user needs to propose new research questions for composite materials, fiber-reinforced structures, interfacial engineering, or electrochemical cathode/binder systems.
- When the goal is to design non-operational, verifiable research plans rather than execute hazardous fabrication protocols.
- When the task requires distinguishing verified methodological patterns from new-system inferences.
- Not for: paper summarization, term explanation, operational lab recipes, or direct provision of safety-critical execution parameters.

## Inputs required

- Target material system (matrix, reinforcement, interface phase, active material, or conductive network).
- Performance bottleneck or failure mode (mechanical, transport, interfacial, electrochemical, or structural).
- Candidate mechanism variables (process history, interface state, dispersion, loading, architecture, or chemical environment).
- Available characterization capabilities (structural, mechanical, electrochemical, thermal, or spectroscopic).
- Baseline and control options (unmodified baseline, alternative path, negative/positive controls).
- Constraints (safety, compliance, repeatability, scalability, environmental boundaries).

If inputs are incomplete, output "missing information and impact" first, then provide a draft hypothesis with annotated uncertainty.

## Core Workflow

### Stage 1: Problem Definition & Mechanism Mapping
1. Translate the performance gap into a mechanism-level question (e.g., how does a process or structural variable govern an intermediate state that determines performance?).
2. Decompose the system into controllable structural units and their functional roles (load transfer, transport, anchoring, conversion, stabilization).
3. Identify coupling between multiple bottlenecks; avoid reducing the problem to single-factor optimization.

**Decision Gate 1 (DG1):** Is the research question falsifiable and linked to an observable intermediate mechanism?
- If NO: Reframe the question from "improve performance" to "how does X govern Y via Z."
- If YES: Proceed to Stage 2.

### Stage 2: Hypothesis Generation & Evidence Stratification
1. Formulate candidate hypotheses using: "If [structural/intervention variable], then [mechanism change] leading to [measurable response], under [boundary conditions]."
2. Annotate each hypothesis with:
   - Evidence strength (Strong / Moderate / Weak / Speculative).
   - Key assumptions (material uniformity, interface stability, measurement validity).
   - Probable failure modes (agglomeration, debonding, transport blockage, over-modification, statistical underpowering).
   - Minimal viable validation path.
3. Explicitly separate verified methodological patterns from agent inferences applied to the new system.

**Decision Gate 2 (DG2):** Does the hypothesis set include at least one negative control, one positive/strong control, and a clear failure criterion?
- If NO: Add controls and stop conditions before proceeding.
- If YES: Proceed to Stage 3.

### Stage 3: Minimal Viable Validation Design
1. Define independent variables (process, structure, composition, interface treatment).
2. Define dependent variables (performance target, mechanistic proxy, robustness metric).
3. Establish control hierarchy:
   - Unmodified baseline (natural variation).
   - Strong control (confirms the assay can detect expected changes).
   - Negative control (absence of target mechanism; detects spurious signals).
   - Positive control (known effective intervention for calibration).
   - Retention condition (unseen material/thickness/environment to check generalization).
4. Prespecify evaluation metrics, success criteria, failure criteria, and stop conditions (safety, irreproducibility, baseline superiority, missing mechanism evidence).

**Decision Gate 3 (DG3):** Can the proposed experiment distinguish the target mechanism from confounding factors with the available sample size and characterization?
- If NO: Simplify variables or add mechanistic proxies.
- If YES: Proceed to Stage 4.

### Stage 4: Execution & Multi-Scale Analysis
1. Quality control: verify sample preparation consistency, batch records, and testing environment.
2. Descriptive statistics: report central tendency, dispersion, and uncertainty; avoid reporting only best-case values.
3. Mechanism linkage: align process/structure evidence with performance evidence in a causal chain.
4. Ablation/decomposition: remove or vary one functional module to isolate its contribution.
5. Triangulation: cross-validate using independent structural, kinetic, mechanical, or electrochemical indicators.

**Decision Gate 4 (DG4):** Is the mechanism–performance alignment consistent across multiple indicators?
- If NO: Flag as correlation-only; do not upgrade to causal claim. Proceed to Stage 5 for redesign.
- If YES: Proceed to Stage 5 for expansion or boundary testing.

### Stage 5: Iteration, Redesign & Stop
1. **If hypothesis is supported:** Expand to adjacent material systems, long-term stability, or multi-objective trade-offs; maintain independent replication.
2. **If partially supported:** Split the mechanism chain; test whether the effect arises from structure, interface, transport, or processing artifacts.
3. **If not supported:** Validate that controls functioned correctly; if yes, reject or narrow the hypothesis and redefine boundary conditions.
4. **If high variability:** Improve batch/process control, increase replication, or tighten inclusion/exclusion criteria.
5. **Stop conditions triggered:** Halt when safety/compliance limits are reached, controls fail, results are irreproducible, or performance gains lack mechanistic explanation.

**Decision Gate 5 (DG5):** After iteration, is the revised hypothesis still within the scope of the original material–performance–mechanism triangle?
- If NO: Return to Stage 1 to redefine the problem.
- If YES: Loop to Stage 3 with updated assumptions.

### Stage 6: Synthesis & Boundary Declaration
1. Summarize verified patterns, inferred patterns, and failed hypotheses.
2. State explicit applicability boundaries (material classes, process windows, test environments).
3. Archive the decision trail (DG1–DG5 outcomes, control performance, and negative results).

## Output Format

Each invocation must produce:

1. **Research Question**: One sentence stating target system, mechanism variable, and performance goal.
2. **Hypothesis Matrix**: For each hypothesis—statement, evidence strength, key assumptions, failure modes, minimal validation path.
3. **Validation Design**: Independent variables, dependent variables, control hierarchy, evaluation metrics, success/failure criteria, stop conditions.
4. **Analysis Plan**: Data quality checks, statistical approach, mechanism linkage method, ablation plan, triangulation strategy.
5. **Iteration Roadmap**: Actions for supported / partial / unsupported / high-variability outcomes.
6. **Boundary & Risk Statement**: Confounders, extrapolation limits, safety/compliance boundaries, and distinction between verified and inferred content.

## Validation Gates

- **Control Hierarchy Check**: Every design must include baseline, strong, negative, positive, and retention conditions before approval.
- **Mechanism–Performance Alignment Check**: Performance claims require at least one independent structural or kinetic indicator.
- **Non-Monotonicity Check**: If dose/loading/interaction strength is varied, scan for optimal windows and over-modification risks.
- **Replication Check**: Sufficient samples/batches to estimate variance; predefined outlier handling.
- **Safety/Compliance Check**: No operational hazardous parameters; research design stays within institutional safety and ethics boundaries.

## Claim Boundaries

- Distinguish "verified methodological pattern" (reusable research logic) from "inference for new system" (requires validation).
- Do not present single-study or single-batch results as domain consensus.
- Limit causal claims to the tested variable range and material–process window.
- Mark correlational findings as exploratory when mechanistic proxies are absent or inconsistent.

## Failure Modes

- **Hypothesis overreach**: Mechanism inferred from a single performance metric without structural/kinetic support.
- **Control deficiency**: Missing negative or strong control leading to ambiguous attribution.
- **Confounding dominance**: Uncontrolled batch, geometry, environment, or processing differences explain the observed effect.
- **Over-modification blind spot**: Non-monotonic response ignored; only a single optimum reported without testing excess.
- **Extrapolation error**: Laboratory screening results presented as engineering reliability or safety certification.
- **Irreproducibility**: High variance undetected due to insufficient replication or lack of batch records.

## Validity Checks

- **Confounders**: Material source, processing history, geometry, loading, environment, and measurement protocol must be documented and held constant across comparisons.
- **Statistical validity**: Report effect size alongside significance; disclose missing data and exclusion rules.
- **Repeatability**: Raw data, processing scripts, batch IDs, and test conditions must be traceable.
- **Boundary clarity**: State which material systems, device configurations, and test environments are excluded.
- **External validity**: Single-source evidence must not be generalized without independent replication or cross-system validation.

## Provenance

- Synthesized from cluster 29 / subcluster 29.0: composite-fiber-interface-cathode research design workflow cluster.
- Source skill references: `dry-electrode-mechanics-research-workflow`, `waste-biofiller-hybrid-composite-exploration`, `composite-crashworthiness-research-workflow`, `li-s-binder-research-workflow`, `fiber-composite-process-optimization`, `lithium-sulfur-binder-research-pattern`, `solvation-kinetics-interface-battery-research-workflow`, `li-s-battery-interface-exploration`.
- Methodological patterns were abstracted; no specific material parameters, numerical results, or paper conclusions are embedded in the reusable workflow body.
