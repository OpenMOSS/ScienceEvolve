---
name: sci-aqueous-aqueous-metal-battery-mechanism-discovery-w-2dd8cb1c
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven research in aqueous metal battery electrolytes and interfaces.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery mechanism discovery workflow 4"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Help an agent design and execute an observable-driven mechanism discovery and validation workflow for aqueous metal battery electrolytes and interfaces. The skill abstracts a shared research pattern into a reusable route: frame coupled bottlenecks as interacting mechanisms, generate falsifiable hypotheses, stage controlled validations with converging multi-scale evidence, and iterate based on graded claims rather than single-metric performance.

# When to use

Use this skill when the user needs to propose new research questions, design comparative studies, or interpret results for aqueous metal battery systems where performance is governed by coupled interfacial, transport, and side-reaction processes. Trigger it for tasks involving electrolyte additive concepts, interphase regulation, deposition morphology control, solvation modulation, or full-cell stability validation at a non-operational planning level. Do not use this skill to provide manufacturing instructions, executable laboratory protocols, hazardous handling details, or to treat any single study as field-wide consensus.

# Inputs required

Before executing the workflow, obtain or infer:

- **Target chemistry and architecture**: metal anode class, cathode family, electrolyte type, separator, and intended operating regime.
- **Dominant failure modes**: deposition instability, corrosion, gas evolution, passivation, side-product accumulation, transport limitation, or cathode–anode coupling failure.
- **Candidate intervention classes**: additive, co-solvent, surface modifier, host structure, or interphase precursor, described by mechanism-relevant features rather than trade names.
- **Available evidence**: prior literature, preliminary data, spectra, imaging, electrochemical curves, simulation outputs, or conceptual assumptions.
- **Baselines and controls**: unmodified system, chemically similar inactive variants, and benchmark strategies supported by prior evidence.
- **Constraints and claim level**: safety boundaries, reproducibility requirements, instrumentation access, and whether the goal is screening, mechanism proposal, or pre-prototype validation.

If any input is missing, state assumptions and mark downstream conclusions as provisional.

# Core Workflow

1. **Frame the Coupled Bottleneck**
   - Define the failure mode as an interaction among interfacial chemistry, ion transport, and parasitic processes, not as a single performance deficit.
   - **Decision Gate:** If the bottleneck cannot be decomposed into at least two interacting mechanisms (e.g., solvation–interphase, transport–side reaction), refine the problem scope before proceeding.

2. **Construct the Mechanism Chain**
   - Build a causal chain linking the candidate intervention to molecular or interfacial changes, then to mesoscale morphology or kinetics, and finally to cell-level observables.
   - Require at least one observable proxy for each link.
   - **Decision Gate:** If any link lacks a measurable proxy, redesign the chain or add diagnostics before hypothesis generation.

3. **Generate Competing Hypotheses**
   - Produce a portfolio of at least three falsifiable hypotheses. For each, state: the mechanism claim, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observations, likely failure modes, and boundary conditions.
   - Prioritize hypotheses that separate mechanism from performance and that can be falsified with minimal experiments.
   - **Decision Gate:** If hypotheses are not mutually exclusive or lack falsification criteria, refine them before designing experiments.

4. **Design Staged Validation**
   - Define independent, dependent, and confounding variables conceptually without prescribing operational parameters.
   - Specify controls: baseline (unmodified), negative (mechanism-disabled or chemically inactive), mechanism control (similar but non-functional variant), and positive/benchmark (if supported by prior evidence).
   - Plan diagnostics across scales: bulk structure or solvation, interfacial chemistry, deposition morphology, electrochemical reversibility, and full-cell behavior.
   - State stop conditions upfront: controls fail, the intervention destabilizes another component, diagnostics contradict the mechanism, or results depend on a single narrow configuration.
   - **Decision Gate:** If the design cannot isolate the proposed mechanism from confounders (e.g., viscosity, conductivity, loading, surface area), add controls or ablation variants.

5. **Collect and Layer Evidence**
   - Execute the minimal viable validation by comparing baseline, single-lever, and combined interventions.
   - Evaluate mechanism proxies first (spectroscopic signatures, impedance trends, adsorption indicators) before interpreting cell-level performance.
   - **Decision Gate:** If mechanism proxies are absent or contradict performance trends, halt causal interpretation and flag for iteration.

6. **Attribute and Grade Claims**
   - Attribute performance gains to the proposed mechanism only if at least two independent evidence families agree.
   - Grade each claim: direct evidence, supporting evidence, indirect inference, or speculative extension.
   - Define boundary conditions where the mechanism should weaken, saturate, or reverse.
   - **Decision Gate:** If evidence is insufficient for the intended claim level, downgrade the claim or mark it as provisional.

7. **Stress-Test Boundaries**
   - Evaluate whether the mechanism persists under varied conceptual conditions (rate, loading, cathode pairing, temperature regime, cell format).
   - Identify the threshold beyond which benefits saturate or fail.
   - **Decision Gate:** If the mechanism fails under modest stress, restrict claims to the tested regime and redesign for broader stability.

8. **Iterate or Terminate**
   - **Proceed** if mechanism and performance align, controls are robust, and boundaries are characterized: strengthen the hypothesis and advance to the next validation stage (e.g., full-cell, scaled format).
   - **Redesign diagnostics** if performance improves without mechanism evidence; test alternative explanations such as artifacts, impurity effects, or cathode-side changes.
   - **Redesign intervention** if mechanism evidence is strong but performance is flat; check transport penalties, cathode incompatibility, or integration limits.
   - **Abandon or pivot** if both mechanism and performance fail, controls are ambiguous, or safety and ethics constraints dominate.
   - **Stop** if results are irreproducible, contradictory, or require operational hazards to proceed.

# Output Format

When using this skill, produce:

1. **Research question**: one concise question tied to a coupled bottleneck.
2. **Mechanism map**: a short causal chain linking intervention features to interfacial, morphological, and cell-level observables.
3. **Hypothesis portfolio**: at least three hypotheses, each with evidence strength, key assumptions, predicted observations, likely failure modes, and boundary conditions.
4. **Experimental design schema**: conceptual variables, controls, multi-scale diagnostics, minimum viable validation, and stop conditions.
5. **Analysis plan**: mechanism linkage, confounder checks, visualization strategy, and evidence-grading criteria.
6. **Iteration roadmap**: decision rules for positive, mixed, negative, and non-monotonic outcomes.
7. **Validity and safety review**: confounders, reproducibility requirements, boundary limits, and non-operational safety boundaries.

# Validation Gates

- **Hypothesis Gate**: Competing hypotheses are falsifiable, mechanism-linked, and bounded by explicit assumptions.
- **Control Gate**: Baseline, negative, mechanism, and positive controls are defined; major confounders are identified and matched across comparisons.
- **Convergence Gate**: At least two independent evidence families support any causal mechanism claim.
- **Attribution Gate**: Performance improvements are separated from nonspecific bulk changes (e.g., viscosity, conductivity, electrode loading).
- **Boundary Gate**: Claims are restricted to tested chemistries, cell formats, and operating regimes unless additional evidence is provided.

# Claim Boundaries

- Claims apply only to the tested chemistry, electrode pair, electrolyte family, and measurement regime.
- Do not extrapolate from single-cell, short-duration, or model-system results to broad technology readiness or consensus.
- Distinguish paper-supported patterns, cross-study support, and agent-inferred hypotheses in every output.
- Never present a single study’s observations as field-wide consensus.

# Failure Modes

- **Confounding dominance**: Apparent improvement is driven by cell geometry, loading, or measurement artifacts rather than the proposed mechanism.
- **Mechanism misattribution**: A single favorable metric is treated as proof of the entire causal chain.
- **False synergy**: Combined interventions appear superior when only one lever is actually active.
- **Integration failure**: Electrode-level improvements are lost upon full-cell pairing due to cathode incompatibility or electrolyte depletion.
- **Boundary violation**: Mechanism benefits are claimed beyond the tested regime or chemistry.
- **Irreproducibility**: Results depend on uncontrolled preparation variability or narrow, unreplicated conditions.

# Validity Checks

- **Confounding**: Match cell architecture, electrode loading, separator, electrolyte amount, and protocol across compared systems.
- **Control adequacy**: Include baseline, mechanism, negative, and positive controls where available.
- **Mechanistic consistency**: Require agreement among structural, interfacial, kinetic, morphological, and cell-level evidence before claiming causality.
- **Reproducibility**: Require repeated measurements or independent replicates for screening claims; independent batches for stronger claims.
- **Statistical validity**: Report variability, outliers, normalization basis, and uncertainty; avoid overclaiming small differences.
- **Artifact detection**: Distinguish true interphase formation from residues, contamination, or preparation artifacts.
- **Boundary clarity**: State where the mechanism should weaken, saturate, or reverse.

# Provenance

- Synthesized from cluster **20.2** ("observable-driven mechanism discovery and validation") of the Codex scientific skills corpus.
- Derived from source skills: `aqueous-zn-battery-interface-exploration` (81cd48538e1593f4), `dual-ion-aqueous-zn-anode-exploration` (d31164b6e15a2883), `low-temperature-zmb-electrolyte-design` (b8da1ca4378fb2d9), `aqueous-zinc-interface-microenvironment-exploration` (9492549035c058b3), `zinc-anode-interface-research-workflow` (664fc07c1a854e82), `dynamic-interphase-ion-transport-research` (77d8c6b584b3d76d), `interfacial-coordination-deposition-research` (aa9cde9a6576f399), `aqueous-zinc-interface-exploration` (75691c3bef44faa7).
- Source-specific materials, numerical parameters, and paper conclusions have been removed; only the shared workflow route is retained.
