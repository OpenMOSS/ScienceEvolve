---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-b0d34ed3
description: A reusable end-to-end workflow for transforming performance bottlenecks into falsifiable mechanism hypotheses, validating them with orthogonal multi-scale evidence, and iterating under strict claim boundaries.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow 5"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents to convert observed performance limitations into rigorous, mechanism-centered research plans. This workflow provides a transferable pattern for hypothesis generation, control-rich validation design, multi-scale evidence analysis, and iterative claim refinement. It is designed for electrochemical and materials systems where structure, transport, and interfacial processes couple to produce device-level behavior.

# When to use

Trigger this skill when a user asks to:

- Propose new research questions rooted in a measurable bottleneck or failure mode.
- Design non-operational validation plans with explicit controls, metrics, and stop conditions.
- Connect multi-scale observations (electrochemical, morphological, structural, spectroscopic, computational) to a causal mechanism.
- Evaluate whether a proposed intervention is mechanistically plausible rather than merely performance-matching.
- Iterate on hypotheses after initial experiments or diagnostics.

Do not use this skill to generate executable laboratory protocols, hazardous operating parameters, or deployment recommendations for unvalidated devices.

# Inputs required

Before producing a plan, request or infer:

- **Target system class**: device architecture, active materials, electrolyte or medium family, and operating regime.
- **Performance bottleneck**: the specific failure mode, limitation, or degradation pathway to address.
- **Candidate interventions**: additive, coating, architectural, compositional, or process levers under consideration.
- **Available diagnostics**: electrochemical, microscopy, diffraction, spectroscopy, impedance, modeling, or other characterization categories.
- **Baseline comparators**: standard or untreated system, inert analogue, and any accepted benchmark.
- **Constraints**: safety boundaries, environmental limits, reproducibility requirements, and practical scaling considerations.

If critical inputs are missing, state assumptions explicitly and label conclusions as provisional.

# Core Workflow

Execute the following stages in order. At each decision gate, choose to advance, revise, or stop.

## Stage 1: Bottleneck scoping and observability check
1. Define the device-level bottleneck in measurable terms (e.g., capacity fade, rate limitation, interfacial instability).
2. Decompose the bottleneck into candidate mechanism layers: bulk transport, interfacial reaction, nucleation/growth, mechanical degradation, or chemical transformation.
3. **Decision Gate 1 — Observable?** If the bottleneck cannot be linked to at least one measurable descriptor, stop and reformulate the research question.

## Stage 2: Mechanism-linked hypothesis generation
1. Generate 3–6 falsifiable hypotheses using the template:
   - **Hypothesis**: concise causal claim linking an intervention to a mechanism and an observable signature.
   - **Key assumption**: what must hold for the hypothesis to remain plausible.
   - **Predicted signature**: the independent diagnostic evidence expected if the hypothesis is true.
   - **Possible failure mode**: the observation that would weaken or falsify it.
   - **Evidence strength**: strong, moderate, weak, or speculative.
2. Prioritize hypotheses that explain multiple linked observations or that couple structure, transport, and interface.
3. **Decision Gate 2 — Falsifiable?** If a hypothesis cannot be falsified with available diagnostics, revise or discard it before proceeding.

## Stage 3: Minimum viable validation design
1. Define the smallest experiment or comparison that can test the core claim:
   - **Baseline**: system without the intervention.
   - **Intervention**: system with the proposed change.
   - **Controls**: negative control (inert analogue), structural control (variant lacking key functionality), and positive/benchmark control if available.
2. Specify independent, dependent, and blocking variables without fixing hazardous or operational parameters.
3. Predefine primary and mechanism-tier metrics aligned with the causal chain.
4. **Decision Gate 3 — Isolable?** If the proposed mechanism cannot be isolated from confounders (loading, area, contact, impurities, history), redesign controls before execution.

## Stage 4: Multi-scale evidence collection
1. Collect orthogonal evidence across at least two independent categories:
   - Device-level: electrochemical performance, retention, efficiency, impedance.
   - Interface/morphology: surface evolution, deposition uniformity, coating integrity.
   - Structural/chemical: phase identity, chemical-state distribution, bonding environment.
   - Transport/kinetic: diffusion, migration, charge-transfer, desolvation proxies.
   - Computational: simplified models, adsorption energies, or barrier estimates.
2. **Decision Gate 4 — Convergent?** If evidence streams contradict one another, stop mechanistic claims and investigate confounders or alternative explanations.

## Stage 5: Mechanism discrimination and claim bounding
1. Compare intervention against all controls using predefined metrics.
2. Attribute performance changes only when mechanism evidence and device metrics align.
3. Classify each claim as:
   - **Measured**: directly supported by data.
   - **Inferred**: consistent with data but requiring further validation.
   - **Speculative**: extrapolated beyond tested conditions.
4. State boundary conditions explicitly (chemistry, loading, format, protocol, stress regime).
5. **Decision Gate 5 — Bounded?** If the claim requires extrapolation beyond tested boundaries without new evidence, narrow or downgrade it.

## Stage 6: Iteration or redesign
1. Apply result-pattern rules:
   - **Performance + mechanism improve**: strengthen hypothesis; advance to boundary testing.
   - **Performance improves, mechanism absent**: propose alternative mechanism; add isolating controls.
   - **Mechanism present, performance unchanged**: identify next bottleneck (transport, compatibility, kinetics).
   - **Controls match intervention**: downgrade specificity; search for shared confounders.
2. Update hypotheses, evidence strength, and assumptions.
3. **Decision Gate 6 — Continue?** If results are irreproducible, safety concerns emerge, or the mechanism remains indistinguishable from confounders, stop or pivot.

## Stage 7: Synthesis and archival
1. Compile the final research question, ranked hypotheses, validation plan, analysis summary, and iteration history.
2. Label all claims by evidence class and boundary.
3. Archive what was tested, what failed, and what remains unresolved.

# Output Format

When using this skill, produce:

1. **Research scope**: target system, bottleneck, and constraints.
2. **Mechanism map**: layered decomposition of the bottleneck into candidate causal pathways.
3. **Hypothesis table**: for each hypothesis, include the causal claim, key assumptions, predicted signatures, failure modes, and evidence strength.
4. **Validation plan**: minimum viable design with baseline, intervention, controls, variables, metrics, and stop conditions.
5. **Analysis plan**: how each diagnostic supports or weakens the mechanism, and how contradictions will be handled.
6. **Iteration plan**: decision rules for advance, revise, or stop based on result patterns.
7. **Validity and boundary statement**: confounders, reproducibility requirements, generalization limits, and non-operational safety constraints.

# Validation Gates

Before advancing past Stage 3, confirm:
- The research question is mechanism-centered, not performance-only.
- Each hypothesis includes a causal chain, key assumption, predicted signature, and falsification condition.
- The control set isolates the proposed mechanism from processing artifacts, material identity, and measurement bias.
- At least two independent diagnostic categories are available to test the mechanism.
- Reproducibility criteria (replicates, batch variation, exclusion rules) are predefined.

# Claim Boundaries

- Do not generalize conclusions beyond the tested chemistry, device format, loading, protocol, or stress regime.
- Do not treat a single successful intervention or source study as field-wide consensus.
- Distinguish paper-validated observations from agent-inferred extrapolations for every new research question.
- Avoid claiming practical readiness, commercial viability, or universal superiority from laboratory-scale evidence.

# Failure Modes

- **Unfalsifiable hypothesis**: the proposed mechanism cannot be distinguished from alternatives with available diagnostics.
- **Inadequate controls**: baseline or comparator groups fail to isolate the intervention effect.
- **Confounder dominance**: loading, contact area, impurities, history, or format differences explain the observed change.
- **Missing mechanism evidence**: performance improves but the proposed causal pathway lacks orthogonal support.
- **Irreproducibility**: results vary across independent repeats without identifiable cause.
- **Trade-off blindness**: the intervention suppresses one failure mode while creating a new bottleneck (transport penalty, compatibility loss, instability).
- **Safety or ethics breach**: the design requires unreviewed hazardous operations or unsustainable practices.

# Validity Checks

Before finalizing recommendations, verify:
- **Confounding**: mass loading, thickness, contact, conductivity, impurities, pretreatment, and environmental drift are considered.
- **Control adequacy**: baseline, negative, structural, and benchmark controls are included where feasible.
- **Replication**: independent preparations, repeated measurements, and variability reporting are planned.
- **Statistical validity**: matched comparisons, predefined metrics, uncertainty estimates, and explicit outlier handling.
- **Mechanistic convergence**: electrochemical, structural, morphological, and modeling evidence point to the same pathway without contradiction.
- **Boundary conditions**: claims are limited to the tested system and operating window.
- **Evidence separation**: each claim is labeled as measured, inferred, or speculative.

# Provenance

- Derived from cluster `64.0` (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `zinc-ion-capacitor-carbon-design`, `multifunctional-interface-zinc-battery-research`, `lignin-zinc-ion-energy-storage-research`, `aqueous-zinc-electrolyte-additive-research`, `alkaline-zinc-additive-deposition-workflow`, `zinc-energy-storage-research-pattern`, `morphochemical-zinc-anode-research`, `harsh-condition-aqueous-zinc-battery-interface-design`.
