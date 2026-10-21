---
name: sci-aqueous-electrolyte-aqueous-anode-mechanism-discove-b71369c6
description: Reusable end-to-end workflow for generating falsifiable hypotheses and staged validation plans to discover and discriminate electrolyte and interfacial mechanisms in aqueous metal-anode systems.
scienceevolve-title: "Aqueous battery interfaces · electrolyte aqueous anode mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

This skill guides an agent through an observable-driven mechanism discovery and validation loop for electrolyte and metal-anode interface research. It abstracts the shared logic from aqueous battery discovery papers into a domain-adjacent workflow: map a practical failure mode to coupled molecular and interfacial mechanisms, design tiered experiments with strict controls, collect orthogonal multiscale evidence, discriminate mechanisms through causal consistency checks, and iterate until claims are bounded by direct evidence or explicit falsification.

## When to use

- When the user asks for a research plan, hypothesis set, or validation framework for aqueous metal-anode batteries or chemically adjacent rechargeable metal batteries.
- When the task involves electrolyte engineering, interfacial regulation, solvation-structure control, or deposition-stability problems.
- When the user needs to connect molecular-scale design levers to device-level outcomes through mechanistic inference rather than empirical screening alone.
- Do not use for operational synthesis recipes, hazardous procedural instructions, or unrelated domains.

## Inputs required

Before generating a plan, identify or request:

- Target metal-anode chemistry and electrolyte family.
- Dominant failure mode (e.g., unstable deposition, side reactions, corrosion, gas evolution, transport loss).
- Candidate design motifs or regulation levers (e.g., solvation modulators, interfacial layers, network architectures).
- Available characterization and modeling resources (spectroscopy, imaging, electrochemical diagnostics, simulation).
- Baseline system and intended comparators.
- Success metrics, acceptable stop conditions, and practical constraints (safety, format, loading).

## Core Workflow

1. **Gap Definition & Failure-Mode Mapping**
   - Frame the research gap as a mismatch between a practical operating requirement and a known, observable failure mode.
   - Separate primary mechanisms from secondary symptoms. Identify observables that define success or failure.
   - *Decision gate*: If the failure mode cannot be linked to an electrolyte or interfacial variable, stop and redefine scope.

2. **Hypothesis Generation & Ranking**
   - Translate the failure mode into falsifiable mechanistic hypotheses using design levers: solvation structure, interfacial chemistry, ion transport, wetting/nucleation, and mechanical integrity.
   - For each hypothesis, record: evidence strength (high/medium/low), key assumption, mechanistic link, minimal validation test, and likely failure mode.
   - *Decision gate*: If no hypothesis is falsifiable with available resources, refine the question or stop.

3. **Tiered Validation Design**
   - Define baseline, negative, positive, single-function, and matrix/additive controls before data collection.
   - Stage validation as a funnel:
     a. Physicochemical compatibility and transport plausibility.
     b. Molecular/local-structure diagnostics.
     c. Interface and morphology validation.
     d. Electrochemical performance in diagnostic cells.
     e. Translation to full-cell or practical-format stress tests.
   - Predefine metrics and stop conditions for each tier.
   - *Decision gate*: If controls cannot isolate the proposed mechanism, redesign the factor table.

4. **Multiscale Evidence Collection**
   - Gather orthogonal evidence across scales: molecular coordination, mesoscale structure, interfacial products, deposition morphology, and device-level electrochemical response.
   - Use matched conditions across candidate and control arms.
   - *Decision gate*: If mechanism-level signals are absent despite performance changes, flag ambiguous attribution and add diagnostics before proceeding.

5. **Causal Analysis & Mechanism Discrimination**
   - Build a mechanism-to-evidence map linking each molecular/interfacial claim to specific observables.
   - Check cross-scale trend consistency. If a candidate improves performance without the expected mechanism signal, search for alternate explanations.
   - Attribute improvements only when the candidate outperforms relevant controls under comparable conditions.
   - *Decision gate*: Route evidence to one of three bins:
     - **Supported**: mechanism signal and performance metric both improve versus controls.
     - **Ambiguous**: mixed signals or missing links.
     - **Contradicted**: expected mechanism signal is absent or opposite.

6. **Iteration or Redesign**
   - **Supported**: Proceed to robustness checks (stress conditions, independent batches, format translation).
   - **Ambiguous**: Design the smallest orthogonal experiment that discriminates between competing mechanisms; preserve a baseline arm.
   - **Contradicted**: Revise the mechanism or abandon the candidate; preserve the negative result as a boundary condition.
   - *Decision gate*: Stop pursuing a candidate when it shows uncontrolled side reactions, poor reproducibility, no mechanism-supported advantage over baseline, or gains that vanish under broader conditions.

7. **Claim Bounding & Documentation**
   - State boundary conditions (chemistry, format, temperature, loading) beyond which claims do not apply.
   - Separate verified observations from inferred mechanisms and speculative extensions.
   - Document residual risks and safety constraints.

## Output Format

Return a structured research package containing:

1. **Research question** — concise problem statement and target system.
2. **Gap and rationale** — why the question matters and the evidence gap it addresses.
3. **Ranked hypotheses** — table with evidence strength, key assumptions, mechanistic links, minimal validation, and likely failure modes.
4. **Experimental design schema** — staged plan with variables, controls, diagnostics, metrics, and stop conditions.
5. **Analysis plan** — mechanism-to-evidence map, control logic, and criteria for supporting or falsifying each link.
6. **Iteration rules** — decision tree for supported, ambiguous, or contradicted results.
7. **Validity and safety checks** — confounders, reproducibility needs, boundary conditions, and non-operational safety constraints.
8. **Evidence classification** — explicit labels separating verified observations, inferred mechanisms, and proposed next steps.

## Validation Gates

- **Mechanism isolation**: The experimental design must include controls that distinguish the proposed mechanism from simple physical blocking, incidental morphology effects, or uncontrolled variable changes.
- **Cross-scale consistency**: Molecular, interfacial, and device-level data must tell a coherent story before a mechanism is accepted.
- **Control adequacy**: Baseline, negative, single-function, and positive/benchmark controls must be present and matched.
- **Reproducibility**: Key claims require independent replicates and, where possible, independent batches; variability must be reported.
- **Stress robustness**: Mechanism claims must survive at least one relevant stress condition (e.g., rate, temperature, format translation) beyond the initial narrow test window.

## Claim Boundaries

- Do not claim a solvation structure, interphase, or deposition mechanism without direct or strongly convergent evidence.
- Do not treat a single electrolyte family or interfacial motif as a universal solution for all metal-anode chemistries.
- Do not infer practical viability, commercial readiness, or safety certification from half-cell or narrow-format data alone.
- Distinguish paper-supported patterns from agent-inferred hypotheses and label speculative extrapolations explicitly.

## Failure Modes

- **Hypothesis unfalsifiable**: The proposed mechanism cannot be isolated with available controls or diagnostics.
- **Confounding dominance**: Apparent performance gains arise from cell geometry, loading, electrolyte volume, temperature history, or substrate differences rather than the intended mechanism.
- **Half-cell mirage**: Anode-level improvements disappear in full-cell or practical-format tests due to cathode incompatibility, crossover, or stack-level impedance.
- **Mechanistic overclaiming**: A single spectroscopic shift or performance curve is interpreted as proof of a complex molecular mechanism.
- **Narrow-regime artifact**: Benefits exist only under a specific narrow condition and vanish under stress or translation.
- **Safety oversight**: A candidate improves electrochemical metrics while worsening gas evolution, corrosion, or thermal stability.

## Validity Checks

- **Confounding variables**: Verify comparable cell format, electrode loading, separator, temperature, voltage window, and history across all arms.
- **Statistical validity**: Require repeated cells, report variability, and use pre-defined acceptance criteria before interpreting marginal improvements.
- **Mechanistic independence**: Avoid inferring ion regulation from cycling stability alone; require morphology, transport, and side-reaction evidence.
- **Synergy verification**: Do not claim multifunctional synergy unless single-function controls demonstrate that multiple features contribute non-redundantly.
- **Boundary condition audit**: Explicitly state whether claims apply to half-cells, full cells, pouch cells, or only specific laboratory formats and chemistries.
- **Literature boundary**: Compare with broader literature but do not present one paper or one successful formulation as field consensus.

## Provenance

- Derived from cluster `26.1` (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `eutectic-electrolyte-zinc-battery-exploration`, `zib-micellar-gel-electrolyte-research-workflow`, `antifreeze-zinc-electrolyte-research`, `zinc-ion-electrolyte-interfacial-regulation`, `interface-regulated-metal-anode-research`, `high-flux-zinc-anode-interface-exploration`, `electrolyte-solvation-zinc-anode-discovery`, and `solid-state-metal-sulfur-research-workflow`.
- Paper-specific systems, materials, and numerical results have been removed to produce a reusable workflow archetype.
