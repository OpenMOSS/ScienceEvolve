---
name: sci-aqueous-aqueous-zinc-battery-interface-mechanism-di-49f10d1a
description: A reusable end-to-end workflow for designing, discriminating, and validating interfacial mechanisms in aqueous metal batteries through falsifiable hypotheses, matched controls, and iterative bottleneck switching.
scienceevolve-title: "Aqueous battery interfaces · aqueous zinc battery interface mechanism discovery workflow 4"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide an agent to design and validate mechanism-driven research for aqueous metal battery interfaces. The workflow turns observable application constraints into falsifiable hypotheses, constructs matched control matrices, discriminates mechanisms via converging orthogonal evidence, and iterates by switching bottlenecks until claims are bounded by evidence.

# When to use

Use this skill when the user asks to:

- Propose new research questions or hypotheses for aqueous zinc or related aqueous metal battery interfaces, electrolytes, anodes, or cathodes.
- Design minimal, controlled experiments that isolate interfacial mechanisms from performance artifacts.
- Discriminate among competing mechanisms such as transport limitation, interfacial kinetics, side reactions, or structural degradation.
- Validate or refute a proposed interface regulation strategy using electrochemical, structural, and chemical evidence.
- Iterate a research plan after ambiguous, negative, or partial results.

Do not use this skill for unrelated battery chemistries, unrelated domains, or direct operational laboratory protocols.

# Inputs required

Before executing the workflow, request or infer:

- **Target system**: aqueous metal battery chemistry, electrode configuration, and cell format.
- **Application constraint**: energy density, power density, cycle life, reversibility, mechanical flexibility, or safety.
- **Dominant failure mode**: suspected bottleneck such as nonuniform deposition, corrosion, passivation, side reactions, transport limitation, or interphase instability.
- **Candidate intervention class**: electrolyte additive, interfacial regulator, host architecture, separator modification, or electrode design motif.
- **Available evidence**: prior literature, preliminary data, computational clues, and accessible characterization methods.
- **Safety and ethics boundaries**: institutional review constraints, materials handling limits, and environmental considerations.

# Core Workflow

## 1. Bottleneck Framing & Hypothesis Generation
- Define the application constraint and map it to a dominant bottleneck category (interfacial kinetics, mass transport, wetting, corrosion, deposition uniformity, interphase stability).
- Generate 3–5 mechanism-linked hypotheses. Each hypothesis must state:
  - the proposed design change;
  - the expected interfacial mechanism;
  - a measurable signature that would support or falsify it;
  - key assumptions;
  - likely failure modes;
  - evidence strength (weak / moderate / strong).
- **Decision Gate 1 — Candidate Gate**: Reject hypotheses that lack falsifiable signatures or rely on unverified cross-system extrapolation. If no hypothesis survives, stop and refine the bottleneck map.

## 2. Study Design & Control Matrix
- Define the primary comparison: proposed intervention versus a matched baseline with comparable geometry, loading, cell format, and measurement context.
- Assemble controls:
  - **Positive benchmark**: established reference for contextual comparison only.
  - **Negative / inactive control**: isolates the specific interfacial effect from background behavior.
  - **Architecture control**: separates material effects from device-architecture effects.
  - **Dose / intensity control**: tests a mechanism window rather than a single condition.
- Select orthogonal diagnostics spanning at least:
  - interface structure or composition;
  - transport / kinetics;
  - morphology / phase evolution;
  - reversibility / durability.
- Define primary metrics (polarization, efficiency, retention) and secondary metrics (corrosion indicators, byproduct distribution, mechanical integrity).
- **Decision Gate 2 — Stability Gate**: Abort if matched baselines are impossible, if safety or waste concerns are unresolved, or if the plan replicates paper-specific recipes instead of abstract design logic.

## 3. Mechanism Discrimination & Evidence Collection
- Collect evidence across the causal chain:
  `interfacial environment → interfacial structure → morphology / contact → transport / kinetics → reversibility → device-level outcome`.
- For each hypothesis, maintain an evidence table tracking:
  - supporting electrochemical evidence;
  - supporting structural / chemical evidence;
  - contradicting evidence;
  - controls that passed or failed.
- **Decision Gate 3 — Functional Validation Gate**: Label results as exploratory if performance improves without interfacial evidence, or as mechanistically informative without performance improvement. Do not advance to mechanism claims unless at least two independent evidence types converge.

## 4. Analysis & Bottleneck Classification
- Normalize comparisons against confounders (loading, area, geometry, electrolyte amount, separator, packaging).
- Classify observed behavior into bottleneck categories (cathode kinetics, anode degradation, electrolyte incompatibility, transport limitation, architecture failure).
- Triangulate the mechanism: require aligned trends across electrochemical, transport/wetting, morphology/phase, and durability data.
- Separate intrinsic interfacial activity from artifacts of increased area, conductivity, or transport.
- Quantify uncertainty: report variability, replicate consistency, and failure frequency rather than best-case values.
- **Decision Gate 4 — Claim Bounding Gate**: Downgrade claims to "partially supported" or "ambiguous" if controls cannot separate mechanisms, if only one metric improves while a coupled failure worsens, or if model-cell gains disappear under matched conditions.

## 5. Iteration & Stop Conditions
Based on the evidence profile, choose one path:
- **Continue**: Converging evidence supports the mechanism and gains persist under matched controls; proceed to boundary testing.
- **Refine**: Mechanism is plausible but limited by a secondary variable (wetting, mechanical integrity); redesign to isolate that variable.
- **Decouple**: Combined material-architecture improvements lack clear attribution; add component-isolation controls.
- **Switch Bottleneck**: The intended variable did not change or an unintended failure dominates; return to Stage 1 with an updated failure-mode diagnosis.
- **Reject**: Improvement depends on unmatched comparisons, non-reproducible behavior, or unresolved safety issues; archive negative constraints.
- **Escalate Validation**: Only after reproducible, mechanism-consistent minimal studies succeed; broaden to full-cell relevance and practical boundary conditions.
- **Stop condition**: Halt if further iteration improves a narrow metric while worsening overall reversibility, stability, or safety.

## 6. Claim Finalization & Boundary Setting
- Label each conclusion by claim type:
  - **Measured**: directly observed.
  - **Inferred**: plausibly explained by the mechanism.
  - **Speculative**: untested or system-specific.
- Define transferability boundaries: metal chemistry, electrode architecture, operating mode, and state-of-charge window.
- Document residual risks and the specific evidence that would revise or refute each claim.

# Output Format

Return the following structured deliverables:

1. **Research question**: one falsifiable question tied to an application constraint.
2. **Bottleneck map**: suspected limiting process and supporting rationale.
3. **Hypotheses**: 3–5 mechanism-linked hypotheses with evidence strength, assumptions, and failure modes.
4. **Experimental design schema**: variables, matched baseline, controls, orthogonal diagnostics, metrics, and stop conditions.
5. **Analysis plan**: normalization rules, bottleneck classification, mechanism triangulation, uncertainty quantification, and evidence tables.
6. **Iteration plan**: decision rules for continue / refine / decouple / switch / reject / escalate.
7. **Validity and boundary statement**: confounders, extrapolation limits, and evidence that would change the conclusion.
8. **Safety and ethics statement**: non-operational safety review needs, waste considerations, and claim boundaries.

# Validation Gates

Before advancing between workflow stages, confirm:

- **Confounding control**: Comparisons use matched electrodes, loading, contact area, assembly, and measurement context.
- **Mechanism consistency**: At least two independent diagnostic streams support any mechanism claim.
- **Reproducibility**: Key comparisons include independent replicates; variability and failure frequency are reported.
- **Statistical validity**: Conclusions are proportional to evidence; selective reporting and multiple-comparison risks are acknowledged.
- **Boundary testing**: Claims are restricted to the tested metal chemistry, architecture, and operating mode unless broader evidence is explicitly provided.

# Claim Boundaries

- Distinguish **measured**, **inferred**, and **speculative** claims in every output.
- Do not generalize from one metal anode to all aqueous metal batteries.
- Do not generalize from one cell format or architecture to others without matched evidence.
- Do not infer commercial readiness, intrinsic safety, or environmental benefit from laboratory electrochemical performance alone.
- Do not present single-study or review-derived patterns as field-wide consensus.

# Failure Modes

- **Misattribution**: Performance improvement is credited to the wrong mechanism because controls were unmatched or incomplete.
- **Single-metric optimization**: A narrow gain masks a coupled failure (improved kinetics with worsened corrosion).
- **Overgeneralization**: A result from one metal, additive, or architecture is applied to chemically distinct systems.
- **Best-case bias**: A single favorable sample or curve is treated as representative without variability reporting.
- **Premature escalation**: Full-cell or practical claims are made before model-cell mechanism consistency is established.
- **Descriptor collision**: A structural modulation changes too many variables to support causal attribution.

# Validity Checks

- **Confounding variables**: Electrode area, thickness, loading, porosity, active-site exposure, oxygen availability, electrolyte amount, separator choice, impurities, catalyst mass, conductivity, mechanical strain, and thermal behavior.
- **Reproducibility**: Repeat comparisons with independently prepared components; preselect metrics; preserve raw time-series and post-operation diagnostics.
- **Boundary conditions**: Avoid treating short-term laboratory stability as long-term durability; avoid treating half-cell behavior as full-cell proof without compatibility checks.
- **Evidence proportionality**: Ensure claim strength matches the weakest link in the evidence chain.

# Provenance

Derived from cluster **51.1** (observable-driven mechanism discovery and validation), synthesized from the following source skills:
- `aqueous-metal-air-research-workflow` (e852cf4022073b52)
- `azib-interface-additive-research` (a1e3d629f741d2a2)
- `zinc-battery-dual-use-electrolyte-design` (36ed0c486700c0de)
- `hydrogel-electrolyte-azib-cathode-research` (67f3e8e1d4ca4b77)
- `aqueous-zinc-anode-interface-exploration` (00eb2dcdc4f72eba)
- `aqueous-zinc-halogen-battery-research-design` (680d95781d8b9d80)
- `aqueous-metal-ion-cathode-design` (aafa72c1fe132592)
- `aqueous-zinc-proton-storage-exploration` (a5ed1b7235bfd7e1)
