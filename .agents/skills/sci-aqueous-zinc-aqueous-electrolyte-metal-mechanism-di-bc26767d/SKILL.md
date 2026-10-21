---
name: sci-aqueous-zinc-aqueous-electrolyte-metal-mechanism-di-bc26767d
description: A reusable end-to-end workflow for generating, testing, and bounding mechanistic claims in aqueous metal-electrolyte electrochemical systems through staged hypothesis validation, multi-modal evidence integration, and iterative redesign.
scienceevolve-title: "Aqueous battery interfaces · zinc aqueous electrolyte metal mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Guide agents to design research questions and validation plans for aqueous metal-electrolyte electrochemical systems using an observable-driven mechanism discovery pattern. The workflow emphasizes localizing performance bottlenecks to interfacial, kinetic, or structural mechanisms; constructing falsifiable hypotheses; and validating them through converging multi-modal evidence rather than single-metric performance claims.

## When to use

Use this skill when a user needs to propose new research directions, design experiments, or interpret data for aqueous metal batteries, electrodeposition systems, or related electrochemical devices where performance is limited by ambiguous interfacial, transport, or degradation mechanisms. It applies to cathode and anode interfacial engineering, electrolyte modification, host-structure stabilization, and kinetic regime analysis.

Do not use this skill for general literature review, operational synthesis or fabrication instructions, non-electrochemical domains, or requests requiring executable hazardous procedures.

## Inputs required

Before generating a plan, identify or request:

- **Target system family** and dominant failure mode (e.g., interfacial instability, sluggish kinetics, structural degradation, non-uniform deposition).
- **Suspected mechanism class** (e.g., charge transfer, mass transport, nucleation, passivation, dissolution, interphase chemistry).
- **Candidate design variable** (e.g., local regulating motif, electrolyte modifier, interfacial architecture, host stabilizing feature).
- **Available characterization modalities** (electrochemical, structural, chemical-state, morphological, transport, spectroscopic).
- **Baseline and comparator systems** for matched controls.
- **Safety, compliance, and resource constraints** governing the proposed research.

If key inputs are missing, state assumptions explicitly and mark dependent conclusions as provisional.

## Core Workflow

Execute the following phases in order. Treat each **Gate** as a hard stop or redesign trigger.

1. **Bottleneck Localization & Gap Framing**
   - Translate the device-level limitation into a candidate mechanistic bottleneck (interfacial chemistry, transport, or structural evolution).
   - Identify the condition mismatch: what the active site or interface requires versus what the bulk environment permits.
   - **Gate:** If the bottleneck cannot be expressed as an observable mechanism with measurable signatures, stop and refine the research question.

2. **Hypothesis Generation & Ranking**
   - Propose mechanism-first hypotheses that link the design variable to an observable causal chain: structure/local chemistry → transport/kinetics → operation stability → performance.
   - For each hypothesis, specify: evidence strength (strong/moderate/weak/speculative), key assumptions, predicted signatures, and a falsifying outcome.
   - Rank by falsifiability and feasibility of minimal validation.
   - **Gate:** If no hypothesis can be falsified with available measurements, stop and expand the characterization scope.

3. **Study Design with Hierarchical Controls**
   - Stage validation as a ladder:
     a. *Minimum viable mechanism check* — simplest setup that can detect the proposed interaction or species.
     b. *Discrimination* — matched comparison of candidate vs. baseline under identical architecture and processing rules.
     c. *Stability-window check* — verify the dominant reaction occurs within the relevant electrochemical and chemical stability boundary.
     d. *Robustness screening* — perturb design-variable density, environmental conditions, or architecture to identify boundary behavior.
   - Define controls: negative (absence of motif/modifier), positive (known benchmark), structural/morphology control, inactive analogue, and pre/post-operation reference.
   - Specify independent variables, dependent variables (primary and mechanism metrics), confounding variables to block, and stop conditions.
   - **Gate:** If controls cannot isolate the design variable from confounders (e.g., conductivity, loading, morphology, surface area), redesign before data collection.

4. **Regime-Aware Data Collection**
   - Identify measurement regimes where the target mechanism dominates the signal.
   - Flag or exclude data regions dominated by mass transport, side reactions, uncontrolled interfacial evolution, or instrument artifacts.
   - Collect converging evidence across modalities: electrochemical response, structural/chemical-state evolution, morphology, transport descriptors, and post-operation state.
   - **Gate:** If the target regime is ambiguous or side reactions dominate the response, stop and simplify the interface or perturbation strategy.

5. **Mechanism Discrimination & Model Comparison**
   - Fit competing mechanistic interpretations to data from the valid regime only.
   - Compare models on parameter identifiability, physical plausibility, and repeatability—not visual fit alone.
   - Stress-test common analytical shortcuts against regime-aware descriptors; use disagreement as diagnostic evidence.
   - Exclude mechanisms that contradict orthogonal evidence.
   - **Gate:** If competing models remain indistinguishable, add orthogonal experimental constraints or halt mechanism claims.

6. **Causal-Chain Integration & Artifact Screening**
   - Link evidence explicitly: design variable → interfacial/structural change → kinetic/transport behavior → operational stability → device performance.
   - Screen for alternative causes: surface-area artifacts, substrate passivation, impurity effects, side reactions, mass-loading differences, assembly variation, and non-active contributions.
   - Label each causal link as *supported*, *inferred*, or *speculative*.
   - **Gate:** If performance improves without mechanism-level evidence, treat the result as exploratory and require additional diagnostics before claiming mechanism.

7. **Claim Bounding & Output Packaging**
   - Classify each claim by evidence type:
     - *Demonstrated* — matched controls and converging evidence in the target system.
     - *Inferred* — consistent with mechanism evidence but not directly causally demonstrated.
     - *Analogical* — supported by similar systems or literature benchmarks; requires re-validation.
     - *Speculative* — agent-proposed for the new system; no direct evidence yet.
   - Document failure modes that would weaken or falsify the claim under the tested conditions.
   - State boundary conditions (material family, environment, architecture) where extrapolation is prohibited.
   - **Gate:** If claims exceed the tested system, downgrade to the appropriate weaker class and specify required validation.

8. **Iteration or Redesign**
   - Update the research direction based on the weakest causal link:
     - *Performance failure* → revisit design-variable integration, density, or compatibility.
     - *Mechanism evidence weak* → add direct diagnostics for local chemistry, interfacial state, or speciation.
     - *Stability failure* → investigate degradation pathways (leaching, passivation, structural collapse, side-product accumulation).
     - *Controls fail* → resolve comparability before interpreting candidate differences.
     - *Evidence strong* → propose the next perturbation (alternative motif, host, or environment).
   - **Stop conditions:** Abort if the design variable cannot be confirmed; if controls remain ambiguous after redesign; if safety/compliance boundaries are breached; or if the core hypothesis is falsified.

## Output Format

When using this skill, return a concise research-design memo containing:

1. **Research question** — focused bottleneck and proposed mechanism-mediated solution.
2. **Gap diagnosis** — why existing approaches leave the bottleneck unresolved.
3. **Ranked hypotheses** — 2–5 hypotheses, each with evidence strength, key assumptions, predicted signatures, failure modes, and boundary.
4. **Study plan** — staged validation ladder, variables, hierarchical controls, primary and mechanism metrics, and stop conditions.
5. **Analysis plan** — regime checks, causal-chain mapping, model comparison strategy, and artifact screening.
6. **Iteration rules** — how each possible outcome updates or rejects hypotheses.
7. **Claim boundary statement** — what is demonstrated, inferred, analogical, or speculative.
8. **Validity and safety review** — confounders, reproducibility needs, boundary conditions, and compliance constraints.

## Validation Gates

Apply these gates before executing or finalizing any plan:

- **Mechanism-specificity gate:** Every design variable must map to at least one observable indicator that can distinguish it from generic performance improvement.
- **Control adequacy gate:** Negative, positive, structural, inactive analogue, and pre/post controls must be defined and interpretable.
- **Regime validity gate:** The selected data region must satisfy the assumptions of the proposed kinetic or mechanistic model.
- **Transport-separation gate:** Mass-transfer and charge-transfer contributions must be distinguishable; do not misattribute transport-limited behavior to interfacial chemistry.
- **Cross-scale gate:** Microscopic or mechanism-level descriptors should be linked to independent device-level outcomes, not only to fitted curves.
- **Reproducibility gate:** Claims must rely on trends across repeated measurements or independent samples, not single traces.
- **Confounder gate:** Morphology, loading, surface area, impurities, contact resistance, and assembly variation must be normalized or explicitly discussed.
- **Safety and compliance gate:** The plan must remain at the research-design level, with hazardous execution deferred to qualified personnel and approved protocols.

## Claim Boundaries

Label all claims using this hierarchy:

- **Demonstrated:** Supported by matched baseline comparisons, converging multi-modal evidence, and valid controls in the target system.
- **Inferred:** Consistent with mechanism-level observations but lacking direct causal proof in the target system.
- **Analogical:** Transferred from literature benchmarks or chemically similar systems; requires independent re-validation.
- **Speculative:** Proposed by the agent for the new system; treat as a working hypothesis until tested.

Do not extrapolate claims to untested chemistries, electrode architectures, electrolyte formulations, or operating regimes without additional validation. A successful design in one system is evidence for a design principle, not a guarantee for another.

## Failure Modes

Common ways the workflow or the underlying research plan can fail:

- **Hypothesis failure:** The proposed mechanism is not observed, or the design variable is chemically or structurally inactive.
- **Regime failure:** The measurement regime is dominated by mass transport, side reactions, or uncontrolled interfacial evolution, invalidating mechanistic interpretation.
- **Control failure:** Baseline and candidate systems are not comparable in morphology, loading, surface area, or preparation history.
- **Artifact misattribution:** Performance gains arise from conductivity changes, wetting improvements, surface roughening, substrate contributions, or activation effects rather than the intended mechanism.
- **Non-monotonic response:** Design-variable tuning produces competing beneficial and detrimental effects (e.g., improved coordination vs. blocked transport) that obscure mechanism.
- **Stability failure:** The candidate improves initial performance but degrades due to motif leaching, passivation, structural collapse, or side-product accumulation.
- **Overgeneralization:** Single-system success is treated as a universal field consensus without replication or boundary testing.

## Validity Checks

Before finalizing a research plan or interpretation, confirm:

- The bottleneck is framed as an observable mechanism, not a generic performance gap.
- Hypotheses are falsifiable and ranked by evidence strength.
- The study design includes staged validation and hierarchical controls.
- Measurement regimes are validated for the target mechanism.
- Competing models are compared using identifiable, physically plausible parameters.
- The causal chain is explicit, with unsupported links labeled as hypotheses.
- Alternative explanations (surface area, impurities, side reactions, assembly variation) are screened.
- Conclusions are limited to the tested system unless broader evidence is explicitly cited.
- The distinction between verified observations and agent-inferred mechanisms is explicit.
- Safety, compliance, and environmental constraints are addressed at the planning level.

## Provenance

- Derived from cluster **55.0** ("observable-driven mechanism discovery and validation") of the Codex scientific skills corpus.
- Synthesized from source skills: `aqueous-zinc-polymer-cathode-exploration`, `aqueous-zinc-halogen-electrode-exploration`, `regime-aware-zinc-kinetics-research`, `electrochemical-anode-research-design`, `interfacial-regulation-zinc-ion-battery-research`, `layered-ion-host-research-design`, `interface-structure-electrochemical-exploration`, `zinc-anode-interfacial-electrolyte-research`.
- Paper-specific materials, numerical parameters, operational protocols, and conclusions have been removed; only the reusable workflow structure, decision logic, and validation pattern are retained.
