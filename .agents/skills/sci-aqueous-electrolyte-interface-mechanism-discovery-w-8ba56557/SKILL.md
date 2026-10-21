---
name: sci-aqueous-electrolyte-interface-mechanism-discovery-w-8ba56557
description: A reusable end-to-end workflow for generating falsifiable mechanism hypotheses, designing minimal validation experiments with strong controls, and converging on causal explanations for electrolyte-interface behavior in electrochemical energy storage systems.
scienceevolve-title: "Aqueous battery interfaces · electrolyte interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Help an agent transform an observed electrochemical bottleneck into a mechanism-driven research plan. The workflow teaches a reusable pattern: frame coupled bottlenecks, generate competing hypotheses, design staged validation with orthogonal diagnostics, and iterate until the mechanism is supported, revised, or rejected.

# When to use

Use this skill when the user needs to:

- Design research questions for electrolyte, interface, or electrode stability in metal-ion or metal-anode electrochemical systems.
- Generate hypotheses about ion transport, interphase formation, deposition morphology, or side-reaction suppression.
- Plan controlled comparisons and ablation studies to isolate a proposed mechanism.
- Critique whether a performance improvement has a defensible mechanistic basis.
- Iterate after ambiguous, contradictory, or incomplete results.

Do not use for operational laboratory protocols, safety instructions, device fabrication recipes, or treating single-study results as field consensus.

# Inputs required

Before producing a plan, request or infer:

- **Target system**: electrode and electrolyte class, cell architecture, and operating environment.
- **Observable bottleneck**: nonuniform deposition, high polarization, interfacial decomposition, poor reversibility, or coupled failure modes.
- **Candidate intervention**: additive, coating, solvation modifier, host structure, or processing change.
- **Available diagnostics**: electrochemical, structural, spectroscopic, microscopic, computational, or surface-sensitive probes.
- **Constraints**: safety boundaries, material availability, reproducibility standards, and allowed level of operational detail.
- **Intended output**: hypothesis map, experimental design, analysis plan, iteration strategy, or critique.

If inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

1. **Frame the coupled bottleneck**
   - Define the observable failure as an interaction among transport, interfacial chemistry, and electrode processes.
   - **Decision gate**: Is the bottleneck falsifiable and measurable? If not, refine the research question before proceeding.

2. **Build a mechanism map**
   - Identify expected active processes, competing side processes, irreversible sinks, transport constraints, and mechanical or contact stress points.
   - Label each element as directly supported, inferred, or speculative.
   - **Decision gate**: Are the active and competing processes distinguishable with available diagnostics? If not, redefine the map.

3. **Generate competing hypotheses**
   - Produce at least three hypotheses that could explain the bottleneck.
   - For each, state the causal claim, predicted signatures across diagnostic families, key assumptions, likely failure modes, and evidence strength.
   - **Decision gate**: Can the hypotheses be distinguished by a feasible experiment? If not, redesign the hypotheses.

4. **Design minimal viable validation**
   - Define the smallest comparison set that can falsify the leading hypothesis.
   - Required comparators: baseline, target intervention, negative control (mechanism removed or inert analogue), and positive control (known reference) when available.
   - Define independent, dependent, and controlled variables; pre-register success, failure, and stop criteria.
   - **Decision gate**: Are controls sufficient to isolate the proposed mechanism from confounders? If not, add controls before proceeding.

5. **Collect orthogonal evidence**
   - **Layer 1 – Interaction/structure**: Confirm chemical interaction, coordination change, or structural transformation.
   - **Layer 2 – Transport/kinetics**: Measure ionic conductivity, interfacial resistance, charge-transfer behavior, or polarization trends.
   - **Layer 3 – Morphology/spatial uniformity**: Quantify deposition uniformity, porosity, or contact evolution with predefined sampling regions.
   - **Layer 4 – Interphase/reversibility**: Assess surface chemistry, byproduct formation, and plating/stripping efficiency.
   - **Layer 5 – System translation**: Evaluate whether local improvements persist in full-cell or practical-format tests.
   - **Stop condition**: If Layer 1 or 2 contradicts the hypothesis, pause and redesign before scaling effort.

6. **Analyze and discriminate mechanisms**
   - Map each result to the mechanism map.
   - Classify conflicts as mechanistic, measurement-based, or system-level.
   - Retain only mechanism components supported by matched controls and orthogonal evidence.
   - **Decision gate**: Do orthogonal diagnostics agree? If not, resolve contradictions before claiming a mechanism.

7. **Bound claims and test robustness**
   - Label each claim as directly supported, indirectly supported, or speculative.
   - Vary one stressor at a time (rate, loading, temperature, cell format) to identify boundary conditions.
   - **Stop condition**: If improvements disappear under matched controls or practical conditions, downgrade or reject the claim.

8. **Iterate or terminate**
   - **If supported**: Escalate to harder boundaries or broader system classes.
   - **If partially supported**: Add discriminating controls or revise the intervention.
   - **If unsupported**: Return to Step 3 with revised hypotheses or stop the branch.
   - **Termination conditions**: Stop if inactive controls reproduce the improvement; if full-cell behavior contradicts half-cell without a plausible coupled explanation; if replicate variability exceeds informational value; or if safety or ethical limits are reached.

# Output Format

When using this skill, produce:

1. **Research question**: A concise statement of the bottleneck and target system.
2. **Mechanism map**: Active processes, side processes, irreversible sinks, and uncertainty labels.
3. **Hypothesis table**: For each hypothesis, include claim, evidence strength, key assumptions, predicted signatures, likely failure modes, and boundary conditions.
4. **Validation plan**: Minimal viable experiments, comparator set, independent/dependent/controlled variables, primary metrics, and stop conditions.
5. **Analysis plan**: Orthogonal diagnostic integration, conflict diagnosis rules, causal update logic, and evidence-strength classification.
6. **Iteration plan**: Decision rules for promoting, revising, or stopping each hypothesis branch.
7. **Validity checklist**: Confounders, reproducibility requirements, statistical checks, and boundary conditions.
8. **Safety and ethics boundary**: Non-operational constraints, claim limits, and institutional review requirements.

# Validation Gates

- **Falsifiability gate**: Every hypothesis must specify an observation that would weaken or reject it.
- **Control gate**: Comparisons must include baseline, intervention, and at least one mechanism-isolation control.
- **Orthogonality gate**: Mechanism claims require agreement across at least two independent diagnostic families.
- **Reproducibility gate**: Replicated measurements or cells are required before claiming robustness.
- **System gate**: Model-system claims must be checked against full-cell or practical-format behavior before claiming relevance.
- **Boundary gate**: Claims must specify operating limits where the mechanism is expected to hold or fail.

# Claim Boundaries

- Distinguish paper-supported mechanisms from new-system inferences and speculative extensions.
- Do not generalize from one material family, cell format, or study to the entire field.
- Treat device performance as a downstream readout, not as proof of mechanism.
- Report trade-offs explicitly (e.g., improved interfacial stability at the cost of reduced bulk transport).

# Failure Modes

- **Hypothesis failure**: The proposed mechanism is contradicted by negative controls or orthogonal diagnostics.
- **Confounding failure**: Improvements are traced to loading, conductivity, impurity, cell geometry, or measurement artifacts rather than the intended mechanism.
- **Translation failure**: Model-system or half-cell gains disappear in full-cell or practical configurations.
- **Robustness failure**: Results are not reproducible across replicates, batches, or boundary conditions.
- **Iteration failure**: Competing hypotheses cannot be discriminated with available diagnostics or constraints.
- **Safety/ethics failure**: The proposed validation would require operational hazardous procedures or unreviewed scale-up.

# Validity Checks

- **Confounding**: Check impurity, moisture, salt, solvent, separator, electrode history, assembly protocol, loading, and contact differences.
- **Reproducibility**: Require replicated cells or measurements; report variability and outliers transparently.
- **Orthogonality**: Avoid causal claims based on a single assay class.
- **Morphology sampling**: Use predefined image regions and quantitative descriptors.
- **Surface-analysis integrity**: Distinguish true interphase signals from handling, air exposure, or contamination artifacts.
- **Statistical clarity**: Report effect direction, variability, and whether comparisons are paired or independent.
- **Boundary conditions**: Vary one stressor at a time to identify where the mechanism breaks.
- **System-level relevance**: Confirm that local improvements are not erased by full-cell constraints.
- **Evidence labeling**: Mark each claim as directly supported, inferred for the new system, or speculative.

# Provenance

- Derived from cluster 4 / subcluster 4.0 ("observable-driven mechanism discovery and validation").
- Synthesized from source skills: `ddb001864c1760a5`, `307b2472da2c7ae4`, `238f081aece9edcf`, `9ed739da9af60209`, `a9a625edfd607ac8`, `9b2977639997241c`, `7c091834525a91fb`, `c4e80ccd95810ef8`.
- Preserves the shared workflow route: coupled-bottleneck framing → competing-hypothesis generation → minimal validation with strong controls → converging-evidence analysis → claim-bounded iteration.
