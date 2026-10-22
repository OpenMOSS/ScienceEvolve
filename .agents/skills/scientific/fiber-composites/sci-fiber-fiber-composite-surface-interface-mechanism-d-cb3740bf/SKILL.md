---
name: sci-fiber-fiber-composite-surface-interface-mechanism-d-cb3740bf
description: A reusable end-to-end workflow for designing mechanism-discovery research in fiber-reinforced and surface-interface composite systems, from gap definition through multi-scale validation to iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · fiber composite surface interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent translate a performance gap in fiber-reinforced, particulate, or surface-interface composite systems into a rigorous, mechanism-driven research plan. The workflow teaches reusable scientific reasoning: define a design tension, map cross-scale causal chains, generate ranked hypotheses, validate through controlled multi-scale experiments, and iterate without copying source-specific material recipes or treating single-study observations as field consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions in composite, fiber-reinforced, cementitious, polymer, or bioinspired material systems.
- Design experiments around architecture, interface, reinforcement, or matrix modifications.
- Compare controlled variants and connect performance to microstructure, chemistry, or interface mechanisms.
- Interpret mechanical, dynamic, durability, or functional results with structural evidence.
- Plan a minimal viable validation study before broader materials campaigns.

Do not use this skill for operational laboratory recipes, hazardous procedural instructions, clinical treatment design, structural engineering qualification, or production-process specification.

# Inputs required

Ask for or infer before designing a plan:

- Target material system class and application context.
- Performance bottleneck or design tension (e.g., strength versus ductility, durability versus processability).
- Candidate intervention: architectural, chemical, interfacial, or processing variable.
- Baseline or comparator system.
- Available characterization and testing capabilities.
- Decision criteria: mechanical, dynamic, durability, functional, or sustainability metrics.
- Safety, regulatory, environmental, and equipment constraints.

If key inputs are missing, state assumptions explicitly and separate verified information from speculative choices.

# Core Workflow

Execute the following ordered route. Pause at each decision gate; stop or redesign if the gate criteria are not met.

## 1. Define Gap and Performance Tension
Frame a specific, testable research question around a bottleneck that blocks practical use. Identify the trade-off between the target improvement and the risk to a secondary property (e.g., processability, stability, cost).

## 2. Construct Cross-Scale Mechanism Map
Build an explicit causal chain before proposing experiments:
- **Process/Chemistry input:** what the intervention introduces.
- **Structure/Microstructure pathway:** expected changes in porosity, phase distribution, interface morphology, dispersion, or orientation.
- **Performance/Mechanical pathway:** expected changes in load transfer, crack initiation or propagation, energy dissipation, or durability.
- **Boundary assumptions:** conditions that must hold for the chain to remain valid.

## 3. Generate and Rank Hypotheses
For each candidate mechanism, produce hypotheses using the template:
> If [intervention A] is applied to [system class], then [metric set X] should change because [mechanism M] alters [causal pathway], assuming [key controls].

Annotate each with:
- Evidence strength (strong, moderate, weak, speculative).
- Key assumptions.
- Predicted observable signature.
- Likely failure mode.
- Extrapolation boundary.

Prioritize hypotheses that are testable with a small design space and that distinguish between competing mechanisms.

## 4. Design Minimal Viable Validation (MVV)
Define the smallest experiment that can falsify the leading hypothesis:
- Baseline control (no intervention).
- Scaffold or process control (same matrix without the active mechanism).
- Ordered intervention levels sufficient to detect nonlinear or threshold behavior.
- Positive or negative comparators when they isolate mechanism from artifact.
- Replication plan and predefined stop conditions.

**Decision Gate A — Design Viability:** Confirm that controls are ethically and practically feasible. If not, reformulate the comparison matrix.

## 5. Stage 1: Feasibility and Process Screening
Execute process-level or fresh-state characterization first:
- Verify that the intervention was implemented as intended (chemical state, dispersion, architecture).
- Assess processability, stability, homogeneity, and safety-relevant handling indicators.
- Record covariates: batch, preparation history, environment, and measurement timing.

**Decision Gate B — Feasibility Gate:** If the modified system fails process stability, homogeneity, or safety checks, stop performance testing and redesign the intervention or processing strategy.

## 6. Stage 2: Structure and Interface Characterization
Collect microstructural and interfacial evidence:
- Confirm intended structural features (morphology, porosity, interface quality, phase identity).
- Quantify defects, voids, agglomeration, or orientation effects.
- Compare structural metrics across baseline and intervention levels statistically.

**Decision Gate C — Structural Confirmation:** If the mechanism-required structural change is absent, label the hypothesis as unsupported and pivot to alternative explanations (e.g., particle packing, processing artifacts).

## 7. Stage 3: Performance and Durability Testing
Measure application-relevant endpoints under controlled conditions:
- Mechanical, dynamic, functional, or durability responses.
- Matched baseline and control comparisons.
- Variability reporting and dose-response or time-response trends.
- Failure mode classification (interfacial, cohesive, mixed, substrate damage).

## 8. Multi-Scale Convergence Analysis
Integrate evidence across scales:
- Normalize outcomes against baseline.
- Plot metrics versus intervention level to identify monotonic, peaked, or threshold behavior.
- Evaluate trade-offs across the balanced scorecard (e.g., strength versus ductility versus processability).
- Check whether performance outliers correlate with processing defects or uncontrolled covariates.

**Decision Gate D — Mechanism Convergence:** Upgrade the mechanism claim only when chemical or process, structural, and performance evidence align. If performance improves without structural or mechanism support, downgrade the claim to empirical and require follow-up.

## 9. Mechanism Discrimination and Claim Update
Classify each hypothesis:
- **Supported:** all evidence layers align.
- **Partially supported:** some endpoints align but mechanism or boundary evidence is incomplete.
- **Contradicted:** predicted endpoints do not appear despite adequate measurement.
- **Ambiguous:** confounding or variability prevents conclusion.

Update the mechanism map based on the weakest link. Separate source-supported logic from new-system inference.

## 10. Iterate, Pivot, or Stop
Choose the next step based on the classification:
- **Continue:** if supported, test one adjacent variable or add boundary conditions (environment, aging, alternative substrate).
- **Modify:** if partially supported, add a discriminating structural or process measurement.
- **Pivot:** if contradicted, revise the causal chain or consider alternative mechanisms before changing application claims.
- **Stop:** if safety, reproducibility, or evidence quality is insufficient; if improvement in one metric severely degrades another without application justification; or if variability exceeds effect size.

# Output Format

When using this skill, deliver:

1. **Research question and gap statement:** focused bottleneck and performance tension.
2. **Mechanism map:** cross-scale causal chain with boundary assumptions.
3. **Ranked hypotheses:** each with evidence strength, assumptions, predicted signature, failure mode, and boundary.
4. **Experimental design:** MVV, variants, controls, variables, metrics, replication, and stop conditions.
5. **Staged execution plan:** feasibility, structure, and performance testing with decision gates.
6. **Analysis plan:** normalization, trade-off evaluation, dose-response modeling, and failure-mode classification.
7. **Iteration roadmap:** continue, modify, pivot, or stop rules for each outcome class.
8. **Validity and safety notes:** confounders, reproducibility requirements, claim boundaries, and non-operational constraints.

# Validation Gates

The workflow contains four mandatory gates:

- **Gate A — Design Viability:** Controls and comparators are feasible; the experiment can isolate the intended variable without unsafe or noncompliant procedures.
- **Gate B — Feasibility Gate:** The modified system passes process stability, homogeneity, and prerequisite structural checks before performance testing proceeds.
- **Gate C — Structural Confirmation:** The microstructural or interfacial signature required by the mechanism is observed; if absent, the hypothesis is downgraded.
- **Gate D — Mechanism Convergence:** Chemical or process, structural, and performance evidence are consistent before upgrading a mechanism claim.

# Claim Boundaries

- Do not treat single-study or single-system results as field-wide consensus.
- Do not extrapolate laboratory screening to structural, clinical, aerospace, marine, or long-term service performance without dedicated validation.
- Distinguish bulk performance from surface-only or single-metric improvements.
- Label durability, aging, and environmental claims as unverified unless supported by direct evidence.
- Keep outputs at the research-design level; avoid presenting speculative application claims as validated engineering guidance.

# Failure Modes

- **Confounding:** The intervention covaries with dispersion, porosity, orientation, batch, or processing history.
- **Uncontrolled variability:** Replication is insufficient to separate material noise from measurement error.
- **Mechanism-performance mismatch:** Performance improves but structural or failure-mode evidence contradicts the proposed causal chain.
- **Single-metric optimization:** A formulation improves one endpoint while critically degrading another, masked by ranking on peak value alone.
- **Boundary violation:** Claims are extrapolated beyond the tested material family, geometry, environment, or loading condition.
- **Safety or compliance block:** The planned comparison requires unsafe, unapproved, or operationally sensitive procedures.

# Validity Checks

Before finalizing any research plan or interpretation, verify:

- **Gap validity:** The question addresses a specific bottleneck, not a broad desire for better materials.
- **Control adequacy:** Baseline, scaffold, process, and relevant positive or negative comparators are included.
- **Confounding control:** Architecture, chemistry, and processing differences are separated from the intervention effect.
- **Statistical validity:** Endpoints are predefined, replicates are reported with dispersion, and significance is not treated as practical sufficiency.
- **Mechanism validity:** Each mechanism claim links to an independent evidence stream (chemical, structural, or morphological).
- **Metric validity:** Normalization accounts for density, thickness, fraction, or geometry differences where applicable.
- **Reproducibility:** Material sources, preprocessing, architecture, test conditions, and environmental history are documented.
- **Extrapolation boundary:** Untested domains (fatigue, fire, toxicity, field qualification) are explicitly excluded.

# Provenance

This skill was synthesized from cluster 0, subcluster 0.0, representing an end-to-end mechanism discovery and validation archetype. Source skills contributing to the merge include:

- `woven-hybrid-composite-research`
- `particle-tribology-composite-research`
- `nanofiber-platform-research-workflow`
- `uv-stable-fiber-copolymer-design`
- `sustainable-fiber-concrete-exploration`
- `cementitious-magnetic-water-research-design`
- `mussel-inspired-dental-adhesive-research`
- `uhpc-reactive-interface-research`

Provenance is preserved as cluster and subcluster identifiers and source-skill references only; no paper-specific conclusions, parameters, or operational protocols are included in the reusable workflow body.
