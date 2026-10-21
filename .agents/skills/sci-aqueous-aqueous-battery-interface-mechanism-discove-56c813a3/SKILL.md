---
name: sci-aqueous-aqueous-battery-interface-mechanism-discove-56c813a3
description: A reusable, end-to-end workflow for generating, testing, and iterating mechanism hypotheses at aqueous battery interfaces through controlled experiments and multi-layered evidence.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery interface mechanism discovery workflow 5"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Help an agent design and execute a mechanism-discovery research program for aqueous battery interfaces where unstable transport, deposition, dissolution, or side reactions limit performance. The workflow transforms an observed failure mode into competing hypotheses, stages validation from component to device level, and iterates based on evidence strength while bounding claims.

# When to use

Use this skill when the user asks to:

- Propose new research questions around aqueous battery interfaces (anode, cathode, electrolyte, or interphase).
- Design controlled experiments to discriminate among competing interfacial mechanisms.
- Convert observational data (electrochemical, structural, spectroscopic, imaging) into updated hypotheses.
- Evaluate whether a proposed interface intervention is mechanistically supported or artifactual.

Do not use this skill to provide executable lab protocols, operational parameters, safety procedures, or claims that a single study establishes field-wide consensus.

# Inputs required

Ask for or infer the following before producing a plan:

- Target interface class and operating environment (e.g., metal-anode|electrolyte, cathode|electrolyte, solid|liquid interphase).
- Dominant failure mode or bottleneck (e.g., nonuniform deposition, dissolution, passivation, competitive side reaction).
- Candidate interventions, modifiers, or host architectures, if any.
- Available characterization and testing capabilities described at a high level (electrochemical, structural, chemical, imaging, modeling).
- Baseline system for comparison.
- Primary success criteria (e.g., interface uniformity, stable transport, lower interfacial drift, improved retention).
- Safety, compliance, and reproducibility constraints.

If critical inputs are missing, state assumptions explicitly and mark downstream claims as inferred or speculative.

# Core Workflow

1. **Bottleneck Definition & Hypothesis Generation**
   - Define the local interfacial instability and separate it from aggregate performance loss.
   - Generate at least three competing mechanism hypotheses: a primary mechanism, a thermodynamic-dynamic reconciliation (if bulk predictions conflict with observations), and at least one alternative (transport limitation, artifact, coupled degradation, or side-reaction dominance).
   - For each hypothesis, specify the predicted local signature, evidence strength (`strong` / `moderate` / `weak` / `speculative`), key assumptions, likely failure modes, and falsifying observations.
   - **Decision gate / Stop condition**: If no hypothesis can be falsified by interface-level evidence before full-device optimization, reformulate the research question.

2. **Control Hierarchy & Experimental Staging**
   - Design a staged validation funnel: minimal viable validation first, then strong validation.
   - Establish controls:
     - **Baseline**: current system without the proposed intervention.
     - **Processing / architecture / material controls**: isolate host, modifier, or route effects.
     - **Negative control**: expected not to enrich the desired local environment or mechanism.
     - **Positive control**: known reference condition, if available.
     - **Instrument / process controls**: confirm probe validity and rule out geometry or data-processing artifacts.
   - Define independent variables (intervention, descriptor-shifting factors), mediator variables (local-environment descriptors), dependent variables (selectivity, reversibility, stability, morphology), and confounders (loading, geometry, surface area, impurities, history).
   - Pre-register stop conditions: safety/feasibility boundaries, descriptor measurability thresholds, and reproducibility criteria.
   - **Decision gate / Stop condition**: If controls cannot isolate the proposed mechanism from morphology, processing, or contact changes, redesign before execution.

3. **Component-Level Mechanism Probing**
   - Execute minimal viable validation:
     - Compare baseline versus intervention under mild and target operating conditions.
     - Measure the candidate descriptor and macroscopic outcome in both conditions.
     - Include at least one control that rejects a trivial explanation.
   - Validate subsystem mechanisms in order:
     - Material compatibility among host, modifier, and active medium.
     - Transport behavior and interfacial resistance drift.
     - Interface uniformity and failure-onset shift.
   - **Decision gate / Stop condition**: If component-level evidence contradicts the primary hypothesis, archive it and pivot. If evidence is ambiguous, add mechanism-specific probes before integration. If evidence supports the hypothesis, proceed.

4. **Multi-Layer Analysis & Mechanism Discrimination**
   - Analyze evidence hierarchically:
     1. Data integrity (calibration, normalization, replicate variance).
     2. Material compatibility.
     3. Transport behavior.
     4. Interface behavior (uniformity, temporal drift).
     5. Post-operation morphology and chemistry (use blinded or randomized scoring if subjective).
     6. Mechanistic modeling (test physical plausibility only, not as a substitute for data).
     7. Device-level performance (only after the interface mechanism survives falsification).
   - Use ratio, relative, or selectivity descriptors rather than single-species abundance.
   - Map each observation to the hypothesis set: `supports`, `weakens`, `refutes`, or `inconclusive`.
   - **Decision gate / Stop condition**: If material, transport, interface, and model evidence do not converge on one hypothesis, return to Stage 1 or 2.

5. **Integration & Robustness Validation**
   - Evaluate integrated full-cell or full-system behavior only after component-level coherence is established.
   - Test robustness across independent batches, environmental exposure, and realistic operating perturbations.
   - Identify tradeoffs: improvements in one metric that worsen a coupled failure.
   - **Decision gate / Stop condition**: If full-device improvement lacks component-level support or is explained by accounting artifacts, downgrade the claim and search for alternative explanations.

6. **Iteration or Redesign**
   - **Strong evidence**: Expand validation to broader conditions, structural variants, and higher-cycle counts.
   - **Moderate evidence**: Add controls that isolate geometry, chemistry, loading, or processing effects.
   - **Weak or contradictory evidence**: Revise the mechanism map, promote an alternative hypothesis, or abandon the direction.
   - **Performance without mechanism**: If metrics improve but mechanism probes do not align, reformulate the hypothesis before claiming success.
   - Archive rejected hypotheses with the reason for rejection.
   - **Decision gate / Stop condition**: Define the next minimal test based on the weakest evidence layer; stop when safety indicators, mechanism contradictions, or reproducibility failures dominate expected benefit.

# Output Format

For each use of this skill, return:

1. **Research question**: concise statement of the new problem tied to a specific degradation bottleneck.
2. **Mechanism hypothesis map**: primary hypothesis and alternatives, each with evidence strength, key assumptions, predicted local signature, likely failure modes, and falsifying observations.
3. **Experimental design**: baseline, controls (processing, architecture, material, negative, positive, instrument), variables, minimal viable validation, strong validation additions, and pre-registered stop conditions.
4. **Analysis plan**: descriptor layers, decision rules, expected directionality, confounder tests, and mechanism-attribution rules.
5. **Iteration plan**: how results would strengthen, weaken, pivot, or stop each hypothesis.
6. **Validity and safety summary**: confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Hypothesis falsifiability**: Can the mechanism be rejected by interface-level evidence before device optimization?
- **Control adequacy**: Do controls isolate the intervention from processing, morphology, and contact artifacts?
- **Descriptor measurability**: Is the proposed local-environment descriptor measurable with acceptable confidence?
- **Component-before-integration**: Are subsystem mechanisms validated before full-device claims?
- **Evidence convergence**: Do at least two independent evidence streams support the mechanism?
- **Reproducibility**: Are independent batches and variance considered, not only best-case results?

# Claim Boundaries

- Distinguish `paper-supported` (source cluster), `inferred` (logically transferred to the new system), and `speculative` (dependent on unverified assumptions) claims.
- Do not treat single-study findings as field consensus.
- Separate lab-scale observations from practical deployment or commercialization claims.
- Limit full-device claims by device-level controls and consistent accounting basis.
- State boundary conditions (material class, stress range, operating regime, chemistry) beyond which the hypothesis should not be assumed to hold.

# Failure Modes

- The intervention improves performance through an artifact (loading, contact area, surface area, measurement drift).
- The descriptor changes but the outcome does not, or vice versa, breaking the causal link.
- The mechanism is supported at component level but fails at integration due to coupled degradation.
- Side reactions or parasitic processes dominate the functional signal.
- The active species is trapped in an inactive state or retained without restoration.
- Controls show similar behavior to test samples, indicating poor mechanistic specificity.
- Safety or compliance constraints prevent reliable validation.

# Validity Checks

- **Confounding**: Have thickness, density, porosity, contact area, pressure, conversion, batch effects, temperature, humidity, instrument geometry, and sample history been controlled or recorded?
- **Reproducibility**: Are independent preparations, repeated measurements, predefined exclusion criteria, and blinded scoring included?
- **Statistical validity**: Are primary endpoints predefined, matched controls used, and uncertainty estimated?
- **Mechanistic consistency**: Do material, transport, interface, model, and device evidence support the same causal story?
- **Boundary conditions**: Are chemistry, architecture, cycling regime, and scale limits stated?
- **Extrapolation**: Are new-system claims labeled as inference unless independently validated?

# Provenance

- Synthesized from cluster **29.0** (observable-driven mechanism discovery and validation).
- Source skill references: `piezoelectric-solid-electrolyte-research` (375e48e44a9388ba), `aqueous-zinc-cathode-research-pattern` (fc5c3659f0b56229), `aqueous-zinc-competitive-pathway-research` (0ae18bda320b2205), `temperature-robust-hydrogel-electrolyte-research` (e2c0ef67f73efe66), `eutectic-anode-research-pattern` (f98f0d1fc5fe97e9), `anode-free-dual-ion-research-workflow` (f490d077dee306fb), `aqueous-zinc-cathode-research-workflow` (aa1ba9613a00528f), `layered-host-mvmb-research-workflow` (2d63137600755b0c).
