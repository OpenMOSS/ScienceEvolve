---
name: sci-aqueous-aqueous-metal-battery-interface-mechanism-d-4ed68f90
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven research plans in aqueous metal battery interface engineering.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Turn an observed electrochemical failure phenotype into a testable mechanistic hypothesis and a staged validation plan. The workflow links molecular coordination, interfacial chemistry, deposition morphology, and device-level behavior through convergent evidence and controlled comparison, without reproducing any single study's conclusions.

## When to use

Use this skill when:
- Proposing new research questions for aqueous metal batteries where electrolyte and electrode interfaces jointly control degradation.
- Designing additive, coating, electrolyte, or separator strategies to address interfacial failure modes.
- Translating a reported interface mechanism into a reusable validation framework for adjacent chemistries.
- Critiquing experimental designs for missing controls, weak metrics, confounders, or overextended claims.

Do not use this skill for operational laboratory recipes, hazardous synthesis protocols, or non-electrochemical materials design.

## Inputs required

Collect the following before entering the workflow:

1. **Target system**: metal anode, cathode or counter electrode, electrolyte family, separator architecture, and intended cell format.
2. **Dominant failure mode**: observable phenotype such as uneven deposition, corrosion, gas evolution, capacity fade, impedance growth, or poor reversibility.
3. **Candidate intervention class**: additive, salt/anion, solvent/co-solvent, polymer matrix, artificial interphase, coating, or combined strategy.
4. **Available evidence**: literature precedents, preliminary electrochemical data, spectroscopy, microscopy, computational descriptors, or post-mortem analysis.
5. **Diagnostic capabilities**: categories of available characterization and modeling resources.
6. **Constraints**: safety limits, non-operational boundaries, reproducibility requirements, and environmental considerations.

## Core Workflow

1. **Failure-Mode Diagnosis**
   - Define the observable degradation phenotype independently of any proposed intervention.
   - Rank likely causes by evidence strength.
   - **Gate:** If the phenotype is not reproducible or is confounded by uncontrolled assembly variables, stop and refine the observation protocol.

2. **Mechanism Mapping & Hypothesis Generation**
   - Map the failure to a structural bottleneck (e.g., bulk solvation/coordination, interfacial chemistry, ion transport, field distribution, mechanical stability).
   - Generate at least three competing, mutually distinguishable hypotheses.
   - For each hypothesis, state: causal chain, evidence strength (weak/moderate/strong), key assumptions, discriminating prediction, and likely failure modes.
   - **Gate:** If no hypothesis yields a falsifiable prediction, stop and reformulate the research question.

3. **Validation Design with Controls**
   - Design a minimal viable validation plan with these arms:
     - Baseline (no intervention).
     - Target intervention.
     - Function-matched or chemically inert control.
     - Mechanism-probe control expected to weaken the suspected mechanism.
     - Positive/reference control when available.
   - Align variables to the causal chain without specifying operational recipes or hazardous parameters.
   - Define layered metrics: mechanism metrics → interface metrics → morphology metrics → device metrics.
   - **Gate:** If controls cannot isolate the proposed mechanism from confounders (e.g., viscosity, pH, wetting, conductivity), redesign before proceeding.

4. **Staged Evidence Collection**
   - Collect evidence across at least three independent layers in order:
     - Layer A: Material/structural (solvation, coordination, speciation, incorporation).
     - Layer B: Interfacial/kinetic (adsorption, charge-transfer resistance, transport, impedance).
     - Layer C: Morphological (deposit uniformity, interphase integrity, roughness).
     - Layer D: System-level (reversibility, cycling stability, full-cell retention).
   - **Gate after each layer:** If the observation contradicts the hypothesis prediction, proceed to Step 6 (Iteration). If evidence is ambiguous, add orthogonal diagnostics before advancing.

5. **Convergent Analysis & Mechanism Triangulation**
   - Analyze all arms under identical pipelines; compare the target against all controls before benchmarking literature.
   - Require directional agreement across Layer A–D to support the hypothesis.
   - Classify each claim as directly observed, indirectly inferred, or extrapolated.
   - **Gate:** If convergent agreement is absent, classify the mechanism as unproven and iterate. If a control matches the target, reject the hypothesis.

6. **Iteration or Redesign**
   - Attack the weakest causal link:
     - Missing structural evidence → revise intervention chemistry or architecture.
     - Missing interfacial evidence → add surface-specific diagnostics or revise adsorption/reaction model.
     - Morphology improves but reversibility does not → investigate interphase stability, dead metal, or side reactions.
     - Half-cell/symmetric-cell success but full-cell failure → examine cross-electrode compatibility, mass balance, and counter-electrode effects.
     - Controls replicate target effect → replace hypothesis with a broader explanation and design a discriminating orthogonal test.
   - **Stop condition:** Terminate if the intervention fails against the baseline under comparable conditions, if safety or environmental burden outweighs benefit, or if contradictory evidence persists after two iteration cycles.

7. **Boundary Mapping & Claim Bounding**
   - Define explicit operating boundaries: electrode loading, electrolyte amount, rate, temperature, cell format, and chemistry family.
   - Separate half-cell/symmetric-cell claims from full-cell claims.
   - Label all conclusions with evidence strength and generalization limits.
   - **Gate:** If claims extend beyond tested boundaries, trim or flag as speculative.

8. **Documentation & Archival**
   - Compile the research plan, decision log, validity checklist, and safety/ethics review into a reproducible, non-operational record.
   - **Stop:** Workflow is complete when the mechanism is either (a) supported by convergent evidence with bounded claims, or (b) rejected with documented controls and alternative explanations.

## Output Format

When using this skill, produce:

1. **Research question**: One concise question tied to a specific failure mode and system boundary.
2. **Mechanism map**: Suspected bottleneck, proposed causal chain from intervention to device behavior, and alternative explanations.
3. **Hypotheses table**: For each hypothesis: claim, evidence strength, key assumptions, discriminating prediction, likely failure mode, and minimal decisive test.
4. **Validation plan**: Experimental arms, controls, layered metrics, decision criteria, and stop conditions.
5. **Analysis plan**: Mechanism-first diagnostics, control-normalized interpretation, convergent-evidence rules, and uncertainty labeling.
6. **Iteration path**: Decision rules for supportive, mixed, contradictory, or control-matched outcomes.
7. **Validity and boundary statement**: Confounders, reproducibility requirements, external-validity limits, safety constraints, and claim discipline.

## Validation Gates

- **Phenotype reproducibility gate**: The failure mode must be observable and consistent before mechanistic attribution.
- **Falsifiability gate**: Every hypothesis must specify a result that would weaken or refute it.
- **Control isolation gate**: Controls must separate the proposed mechanism from generic additive effects, bulk transport changes, and assembly artifacts.
- **Orthogonal convergence gate**: Support requires agreement across at least three independent evidence layers (e.g., structural, interfacial, electrochemical).
- **Mechanism specificity gate**: At least one diagnostic must be capable of falsifying the proposed mechanism.
- **Boundary adherence gate**: Claims must not exceed tested chemistries, formats, and operating regimes.

## Claim Boundaries

- Distinguish **directly observed**, **indirectly inferred**, and **extrapolated** claims in every output.
- Do not generalize beyond the tested electrolyte family, electrode architecture, and cell format.
- Do not treat single-study or preliminary evidence as field consensus.
- Separate half-cell and symmetric-cell conclusions from full-cell performance claims.
- Avoid attributing device-level improvement to a molecular mechanism unless the intermediate causal links are supported.

## Failure Modes

- **Control-matched improvement**: The target intervention performs equivalently to a function-matched or inert control, indicating a non-specific mechanism.
- **Missing mechanism marker**: Performance improves without the predicted change in the intermediate structural or interfacial diagnostic.
- **Cross-layer contradiction**: Evidence from one layer (e.g., morphology) conflicts with another (e.g., kinetics or reversibility).
- **Scale-transfer failure**: Half-cell or symmetric-cell gains do not survive full-cell validation.
- **Confounded attribution**: Uncontrolled variables (electrode history, mass loading, separator, moisture, assembly pressure) explain the observed effect.
- **Trade-off dominance**: The intervention suppresses the target failure mode but introduces unacceptable polarization, transport resistance, or side reactions.
- **Safety or environmental disqualification**: The candidate creates hazards, toxic byproducts, or non-scalable burden that outweigh performance benefits.

## Validity Checks

Before finalizing any research plan or claim, verify:

- **Confounding**: Electrode loading, electrolyte amount, separator, cell pressure, temperature, counter-electrode behavior, and assembly history are matched or explicitly accounted for.
- **Comparability**: Half-cell and full-cell conditions are not mixed without caveats; normalization conventions are consistent.
- **Reproducibility**: Independent sample preparations, repeated cells, and quantitative variability are reported.
- **Statistical validity**: Predefined success criteria, comparable sample counts, uncertainty reporting, and transparent exclusion rules are in place.
- **Mechanistic specificity**: The proposed mechanism is distinguishable from pH changes, ionic strength, viscosity, generic shielding, or current redistribution.
- **External validity**: Transfer to other metal chemistries or architectures requires explicit compatibility testing, not analogy alone.
- **Safety and ethics**: The plan remains at the research-design level; hazardous operational details, abuse testing, and bypassing of institutional safety review are excluded.

## Provenance

- Synthesized from cluster **6.0** (aqueous-zinc-battery-interface-mechanism-discovery-workflow).
- Derived from source skills:
  - `zinc-battery-electrolyte-design` (c51fbc305e758e17)
  - `aqueous-zinc-electrolyte-exploration` (1aa16f3fd0a39bbf)
  - `conductive-interface-zinc-anode-research` (c5c4b79c208c592a)
  - `aqueous-zn-interphase-exploration` (9ba9519d969632ee)
  - `aqueous-battery-high-energy-research-design` (a033615995393b96)
  - `aqueous-manganese-battery-interface-research` (97f089ca8e73b342)
  - `zn-electrolyte-interface-research` (dfbc75b7a6ce6084)
  - `zinc-aqueous-battery-interface-exploration` (1386d1dbc9f03a77)
