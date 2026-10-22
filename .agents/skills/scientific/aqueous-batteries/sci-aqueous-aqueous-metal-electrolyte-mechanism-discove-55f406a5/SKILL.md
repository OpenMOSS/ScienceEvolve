---
name: sci-aqueous-aqueous-metal-electrolyte-mechanism-discove-55f406a5
description: Guide an agent through an end-to-end, observable-driven workflow to discover and validate electrolyte and interfacial mechanisms in aqueous metal electrochemical systems, from coupled failure-mode analysis through multi-scale hypothesis testing to bounded claim generation.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal electrolyte mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide an agent through an end-to-end, observable-driven workflow to discover and validate electrolyte and interfacial mechanisms in aqueous metal electrochemical systems. The workflow couples system-level failure analysis, mechanistic hypothesis generation, controlled non-operational validation design, multi-scale evidence triangulation, and iterative claim bounding.

# When to use

Use this skill when the user needs to:

- Generate new research questions around electrolyte or interface regulation in aqueous metal batteries or related electrochemical systems.
- Translate device-level failures into molecular or interfacial mechanistic hypotheses.
- Design concept-level validation plans with explicit baselines, controls, and stop conditions.
- Connect solvation structure, interfacial chemistry, deposition morphology, and transport evidence to cell-level performance.
- Iterate hypotheses based on discordant multi-scale data or unexpected control outcomes.

Do not use this skill for operational laboratory recipes, manufacturing SOPs, directly executable protocols, or as a source of field-wide consensus.

# Inputs required

Before executing the workflow, obtain or infer:

- **System boundary**: metal anode, electrolyte class, cathode family, separator, and intended application context.
- **Observable failure**: dominant instability such as nonuniform deposition, parasitic reactions, interphase instability, cathode dissolution, or capacity fade.
- **Candidate levers**: additive, solvent/co-solvent, salt, interface modifier, or coating concept.
- **Validation capabilities**: available characterization (spectroscopy, microscopy, electrochemistry, simulation) and cell formats.
- **Constraints**: non-operational boundary, safety governance, environmental limits, material availability, and scalability concerns.

If critical inputs are missing, state assumptions explicitly and keep outputs at a conceptual design level.

# Core Workflow

1. **System decomposition and gap definition**
   - Map coupled failure modes across anode, cathode, and electrolyte as a system problem rather than isolated symptoms.
   - Identify the mechanistic bottleneck: solvation structure, interfacial water activity, ion transport, electric-field distribution, interphase stability, or compatibility mismatch.
   - **Decision Gate 1**: Is the failure linked to a testable electrolyte/interface variable? If no, stop and redefine scope.

2. **Mechanism chain construction**
   - Build an explicit causal chain: intervention → molecular descriptor → interfacial change → morphology/transport change → device metric.
   - Label each link as directly measurable, inferred, or assumed.
   - **Decision Gate 2**: Does the chain contain at least one falsifiable intermediate observable? If no, reformulate the chain before proceeding.

3. **Hypothesis generation and scoring**
   - Formulate a primary mechanism hypothesis and at least one competing alternative.
   - For each, state: mechanism, evidence strength (strong/moderate/weak/speculative), key assumptions, and a predicted observation that would falsify it.
   - **Decision Gate 3**: Can the primary hypothesis be distinguished from alternatives with the available readouts? If no, redesign controls or readouts.

4. **Minimal validation design (non-operational)**
   - Define a baseline and a hierarchy of controls: negative control (lacks proposed mechanism), structural control (similar but non-functional analogue), and benchmark control if available.
   - Select independent variables (composition class, functional feature), dependent variables (reversibility, interfacial signature, morphology), and context variables (geometry, temperature).
   - Predeclare success metrics, failure criteria, and stop conditions before evidence collection.
   - **Decision Gate 4**: Does the design isolate one mechanism and include at least two orthogonal readout layers? If no, refine the control set.

5. **Evidence collection and layered analysis**
   - Gather orthogonal evidence across scales: molecular/solvation, interfacial/kinetic, morphological, electrochemical, and device-level.
   - Analyze each layer independently using matched baselines and predefined descriptors.
   - **Decision Gate 5**: Is data quality sufficient (stable baselines, replicate consistency, no dominant artifacts)? If no, halt and audit experimental design.

6. **Mechanism triangulation and discordance handling**
   - Compare evidence layers against the mechanism chain.
   - **If aligned**: strengthen the hypothesis and proceed to claim bounding.
   - **If metrics improve but descriptors do not**: treat as confounded; pivot to alternative mechanisms or hidden variables.
   - **If descriptors align but metrics do not**: identify missing transport, compatibility, or mechanical constraints.
   - **If model-scale and device-scale disagree**: investigate counter-electrode coupling, mass balance, or inventory effects.
   - **Decision Gate 6**: Is there convergent support for one mechanism? If no, return to Step 3 or 4.

7. **Claim bounding and validation**
   - State boundary conditions: chemistry family, cell format, temperature window, and scale limits.
   - Separate measured facts, mechanistic inferences, and speculative extensions.
   - Audit confounders (transport artifacts, loading, impurities, geometry) and reproducibility needs.
   - **Decision Gate 7**: Are claims bounded, reproducible, and free from unsafe extrapolation? If no, narrow or downgrade claims before output.

8. **Iteration or termination**
   - **If supported**: propose the next extension as a conditional hypothesis with explicit new boundaries.
   - **If partially supported**: redesign to isolate unresolved mechanism links.
   - **If contradicted**: abandon or reframe; document the failure mode for future agents.
   - **Stop conditions**: safety or environmental review fails; baseline instability prevents fair comparison; controls outperform the candidate; mechanism evidence is absent despite performance change; scaling claims are made without format-relevant validation.

# Output Format

When using this skill, produce:

1. **Research question**: one sentence stating the coupled failure and target boundary.
2. **Mechanism map**: variables, descriptors, expected trends, and competing effects.
3. **Hypotheses table**: for each hypothesis—mechanism, evidence strength, key assumptions, falsification test, and likely failure mode.
4. **Validation plan**: baseline, controls, variables, metrics, and stop conditions at a non-operational design level.
5. **Analysis plan**: how evidence layers will be compared, normalized, and integrated into a causal chain.
6. **Iteration rules**: decision criteria for strengthening, pivoting, narrowing, or stopping.
7. **Validity and safety notes**: confounders, boundary conditions, reproducibility checks, and non-operational safety constraints.

# Validation Gates

- **Gate 1 (Scope)**: Failure mode is linked to a testable electrolyte/interface variable.
- **Gate 2 (Falsifiability)**: Mechanism chain contains at least one falsifiable intermediate observable.
- **Gate 3 (Discrimination)**: Primary hypothesis can be distinguished from alternatives with available readouts.
- **Gate 4 (Isolation)**: Validation design isolates one mechanism and includes ≥2 orthogonal readout layers.
- **Gate 5 (Quality)**: Data quality is sufficient for interpretation (matched baselines, replicate consistency).
- **Gate 6 (Convergence)**: Multi-scale evidence converges on one mechanism rather than contradicting it.
- **Gate 7 (Boundaries)**: Claims are bounded by chemistry family, format, temperature, and scale; measured and inferred claims are separated.

# Claim Boundaries

- Limit conclusions to the tested chemistry family, electrolyte class, cell format, and operating window.
- Distinguish directly measured observables from mechanistic inferences and speculative extensions.
- Do not extrapolate short-term or small-format behavior to practical devices, commercial viability, or consumer safety without additional validation.
- Do not present single-study observations as field-wide consensus.

# Failure Modes

- **Confounded mechanism**: Performance improvement is driven by bulk transport, viscosity, or geometric artifacts rather than the proposed interfacial mechanism.
- **Scale translation failure**: Half-cell or symmetric-cell gains do not survive in full-cell or practical-format validation.
- **Control inadequacy**: Negative or structural controls fail to isolate the mechanism, leading to ambiguous attribution.
- **Discordance ignored**: Misalignment between molecular descriptors and device metrics is overlooked to preserve the hypothesis.
- **Premature scaling**: Claims about scalability, safety, or deployment are made without format-relevant evidence.
- **Unsafe extrapolation**: Laboratory results are generalized beyond tested boundary conditions.

# Validity Checks

Before finalizing output, verify:

- **Confounding control**: Baseline, negative, structural, and transport controls are present and matched.
- **Reproducibility**: Independent repeats or explicit uncertainty reporting supports key trends.
- **Mechanistic consistency**: Molecular, interfacial, morphological, and electrochemical evidence point to the same mechanism.
- **Statistical validity**: Metrics are compared across distributions or repeated measurements, not single best-case traces.
- **Boundary conditions**: Claims are explicitly scoped to tested families, formats, temperatures, and scales.
- **Model validity**: Simulations are treated as hypothesis generators unless force fields and experimental signatures are independently checked.
- **Safety and environment**: Hazardous or high-risk aspects remain at non-operational design level; environmental and waste implications are acknowledged.

# Provenance

Synthesized from cluster 20, subcluster 20.1. Source skills: `multi-solvent-zni-battery-exploration`, `zinc-electrolyte-exploration-skill`, `aqueous-zinc-interface-exploration`, `dual-electrode-solvation-regulation-battery-research`, `zinc-anode-interface-exploration`, `electrolyte-solvation-metal-anode-exploration`, `zinc-ion-electrolyte-research-workflow`, `biodegradable-hydrogel-sei-research-exploration`. Source-specific conclusions and parameters have been abstracted into the transferable workflow pattern above.
