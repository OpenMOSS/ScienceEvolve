---
name: sci-aqueous-aqueous-battery-interface-evidence-workflow-919ddf10
description: End-to-end evidence analysis and claim audit workflow for aqueous battery interface research, from failure-mode problem definition through hypothesis generation, controlled validation, multi-scale analysis, and iterative mechanism closure.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery interface evidence workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Translate observed electrochemical performance degradation into a structured, auditable research program. This workflow guides problem definition, hypothesis generation with explicit mechanism chains, minimum viable validation design, multi-modal evidence integration, and iterative refinement while enforcing claim boundaries and preventing unsupported extrapolation.

# When to use

- When proposing new research questions around aqueous battery interfaces, electrode-electrolyte stability, or interphase engineering.
- When migrating a mechanistic insight from one material system to another and needing to re-validate assumptions.
- When designing experiments to test whether an interface modification improves performance through a specific causal pathway rather than by confounding factors.
- When auditing existing claims for mechanism–evidence consistency, reproducibility, and boundary conditions.
- Not for generating operational fabrication recipes, hazardous protocols, or deployment-ready engineering parameters.

# Inputs required

- **Target system scope**: electrode and electrolyte classes, cell configuration, and known degradation modes.
- **Candidate intervention**: additive, coating, electrolyte modification, or structural motif under investigation.
- **Available evidence**: literature findings, preliminary data, computational results, or characterization capabilities.
- **Constraints**: safety boundaries, equipment limits, reproducibility requirements, and environmental compliance scope.
- **Evaluation goals**: performance metrics, mechanism confirmation, or boundary mapping.

# Core Workflow

## Stage 1: Degradation decomposition and problem scoping
1. Decompose performance degradation into electrode-side, electrolyte-side, and full-cell coupling channels.
2. Identify observable signatures for each channel.
3. Define one to two dominant interface bottlenecks to target.
4. **Stop condition**: If degradation cannot be mapped to any observable interface signature, pause and request more data.

## Stage 2: Hypothesis generation with mechanism chains
1. Map each bottleneck to functional requirements (e.g., ion selectivity, water activity reduction, mechanical compliance).
2. Generate candidate hypotheses using the template: *Intervention X → interface structure Y → transport/reaction change Z → electrochemical outcome W.*
3. Annotate each hypothesis with:
   - Evidence strength (high / medium / low)
   - Key assumptions
   - Predicted failure modes (e.g., over-adsorption, insulating layer, precursor consumption)
4. **Decision gate**: Reject hypotheses that cannot be falsified by at least two independent evidence classes.

## Stage 3: Minimum viable validation (MVV) design
1. Define experimental variables: intervention, mechanism mediators, and performance outcomes.
2. Establish a control hierarchy:
   - **Baseline**: unmodified system
   - **Negative control**: missing the key functional motif
   - **Mechanism control**: single-variable perturbation isolating one causal link
   - **Positive control**: known benchmark strategy
   - **System control**: half-cell vs. full-cell cross-check
3. Set success criteria: a mechanism signal must be detectable before performance optimization is attempted.
4. **Stop condition**: If controls cannot isolate the proposed mechanism from confounders, redesign before execution.

## Stage 4: Evidence collection and layered analysis
1. Collect data across three layers:
   - **Structure/composition**: interface existence, uniformity, coverage, and evolution
   - **Kinetics/transport**: impedance, deposition behavior, ion mobility, and interfacial dynamics
   - **Performance/stability**: efficiency, cycle life, failure mode timing, and boundary behavior
2. Perform causal matching: link each performance shift to at least one structural or kinetic antecedent.
3. **Decision gate**: If structural or kinetic evidence contradicts performance trends, flag pseudoscience risk and halt mechanism claims.

## Stage 5: Mechanism closure and claim bounding
1. Upgrade a hypothesis to a *supported mechanism* only when:
   - Multiple independent data layers align,
   - Controls exclude non-specific effects,
   - Trends are reproducible across replicates or batches.
2. Explicitly state boundary conditions: applicable electrode/electrolyte classes, load ranges, cycle stages, and environmental windows.
3. **Decision gate**: If evidence is single-modal or single-batch, downgrade the claim to *preliminary correlation*.

## Stage 6: Iterate, pivot, or terminate
- **If fully supported**: Expand to harsher boundaries (higher load, longer cycles, alternative configurations) and test transferability.
- **If partially supported**: Diagnose the missing evidence layer; design targeted perturbation experiments.
- **If unsupported**: Do not discard the intervention automatically; test whether failure arises from precursor selection, surface mismatch, or test artifacts. Generate a revised hypothesis.
- **Stop condition**: Terminate when the hypothesis is either validated across independent conditions with mechanism closure, or when repeated MVV failures indicate the causal chain is invalid.

## Stage 7: Audit and archival
1. Compile an evidence matrix: hypothesis, supporting data, contradictory data, confidence level, and boundary limits.
2. Separate literature-derived facts from agent-inferred extrapolations.
3. Document failure modes and null results.

# Output Format

The agent should produce:

1. **Research question definition**: target system, dominant failure channel, and scope boundary.
2. **Ranked hypothesis list**: mechanism chain, evidence strength, key assumptions, and predicted failure modes.
3. **MVV plan**: variables, control hierarchy, evaluation metrics, and stop conditions.
4. **Analysis protocol**: data layers, causal matching rules, and visualization strategy.
5. **Iteration roadmap**: decision rules for support / partial-support / non-support.
6. **Claim boundary statement**: what is verified, what is inferred, and what remains unknown.
7. **Provenance log**: source-skill references for methodological lineage.

# Validation Gates

- **Mechanism falsifiability**: Every hypothesis must specify an observation that would invalidate it.
- **Control hierarchy**: No mechanism claim without baseline, negative, and mechanism controls.
- **Cross-modal agreement**: Structural, kinetic, and performance evidence must converge before mechanism upgrade.
- **Reproducibility threshold**: Key conclusions require independent replication or cross-batch validation.
- **Boundary explicitness**: Every claim must carry stated material, geometric, and operational boundaries.

# Claim Boundaries

- Distinguish *verified in this system* from *analogous inference* and from *agent speculation*.
- Do not extrapolate single-paper results as field consensus.
- Do not infer long-term stability from short-term performance.
- Do not generalize from half-cell to full-cell without explicit coupling checks.
- Mark all computational results as explanatory, not confirmatory, unless paired with experimental validation.

# Failure Modes

- **Hypothesis drift**: Mechanism claims expand beyond the evidence; counter-evidence is ignored.
- **Confounding collapse**: Multiple variables change simultaneously; attribution becomes impossible.
- **Single-modal overreach**: One characterization technique is used to prove a complex interface mechanism.
- **Performance-only reasoning**: Cycle life or capacity data alone are treated as mechanism proof.
- **Boundary violation**: Conclusions are applied outside stated material, load, or environmental limits.
- **Replication gap**: Single-batch or single-sample results are reported as established facts.

# Validity Checks

Before finalizing any output:

- **Confounders**: Have electrolyte bulk properties, electrode loading, assembly pressure, porosity, and batch variation been accounted for?
- **Reproducibility**: Are replicate samples, cross-validation, and outlier handling documented?
- **Statistical rigor**: Are effect sizes, uncertainty ranges, and sample sizes reported for quantitative claims?
- **Mechanism consistency**: Do structure, kinetics, and performance metrics tell a coherent story?
- **Control adequacy**: Are blank, negative, mechanism, and positive controls all present and interpretable?
- **Extrapolation risk**: Are inferences clearly separated from directly verified results?

# Provenance

Methodological lineage derived from cluster 11.0 ("interface-zinc-aqueous-battery-evidence-analysis-workflow") and synthesized from source skills:

- `aqueous-battery-interface-exploration` (e051bdabde9b1782)
- `aqueous-zn-anode-interface-exploration` (c184e8d29ad012a9)
- `aqueous-battery-interface-research` (e5a10afdf3f50d46)
- `defect-engineered-interface-zinc-anode-research` (c0f2ba4b6130e942)
- `interface-regulation-electrochemical-validation` (be5f03ab2f3b8ba7)
- `aqueous-zinc-halogen-battery-research-workflow` (5abe07c6b6d387f8)
- `zinc-battery-interface-electrolyte-workflow` (935702d673023347)
- `zinc-anode-interphase-research` (544cf3377d26e63b)

No specific material parameters, operational protocols, or paper conclusions are adopted from the source skills.
