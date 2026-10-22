---
name: sci-aqueous-aqueous-battery-interface-mechanism-discove-a4b8aa42
description: A reusable end-to-end workflow for generating hypotheses, designing staged validation experiments, and iterating on mechanism discovery for aqueous battery interfaces and electrode-electrolyte interactions.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery interface mechanism discovery workflow 3"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents in translating observable performance limitations into testable mechanistic hypotheses for aqueous battery interfaces, then validating or falsifying those hypotheses through staged experiments with matched controls, converging evidence, and bounded claims.

# When to use

Use this skill when the user asks to:

- Propose research questions or hypotheses about aqueous battery interfaces, anodes, electrolytes, or electrode-electrolyte interactions.
- Design non-operational validation plans to discriminate among competing interfacial or bulk mechanisms.
- Evaluate whether a proposed material, electrolyte additive, or architectural change plausibly addresses a bottleneck.
- Iterate on a design path based on mechanism-sensitive evidence rather than single-metric improvement.
- Bound claims by evidence strength and distinguish paper-supported patterns from new inferences.

Do not use for clinical or biological research, non-electrochemical systems, or to provide operational lab recipes, hazardous protocols, fabrication parameters, or step-by-step execution instructions.

# Inputs required

Before producing a plan, request or infer:

- Target aqueous battery chemistry and component of interest (anode, cathode, electrolyte, interface).
- Dominant performance bottleneck or failure mode (e.g., side reactions, dendrite growth, passivation, dissolution, transport limitation).
- Candidate intervention and its proposed mechanistic role.
- Available characterization and electrochemical methods.
- Constraints: safety, cost, scalability, environmental compliance, and equipment limitations.
- Desired output depth: research question, hypothesis portfolio, experimental design, analysis plan, or iteration roadmap.

If key inputs are missing, state assumptions clearly and mark downstream claims as provisional.

# Core Workflow

1. **Bottleneck Framing & Mechanism Mapping**
   - Convert the observed performance limitation into a specific, testable bottleneck.
   - List plausible bulk, interfacial, and transport mechanisms that could produce the observed symptom.
   - **DG1 — Scope Specificity:** If the bottleneck cannot be linked to at least two distinct observable mechanisms, refine the scope before proceeding.

2. **Hypothesis Generation**
   - Build causal-chain hypotheses: `Intervention -> Process Change -> Cell-Level Metric -> Failure-Mode Reduction`.
   - Tag each hypothesis with evidence strength (high / medium / low / speculative), key assumptions, discriminating tests, and falsification signals.
   - **DG2 — Falsifiability:** If a hypothesis lacks a clear observation that would weaken or reject it, reformulate before designing experiments.

3. **Staged Validation Design**
   - Stage 1: Intrinsic behavior — confirm active material or interface response in a simplified cell.
   - Stage 2: Platform compatibility — test in the target electrolyte and ion environment with matched baselines.
   - Stage 3: Full-cell consistency — evaluate in a representative device with balanced electrodes and relevant interfaces.
   - Define independent variables, matched controls (baseline, negative, positive, interference), primary metrics, secondary trade-off metrics, and mechanism-specific probes.
   - **DG3 — Control Adequacy:** If the design cannot isolate the proposed mechanism from confounders (e.g., conductivity, loading, morphology, electrolyte strength), redesign controls.
   - **Stop Condition:** Abort if the proposed intervention requires unsafe, non-compliant, or poorly justified conditions.

4. **Evidence Collection & Layered Analysis**
   - Gather converging evidence across independent layers: structure, chemistry, morphology, electrochemical signature, kinetics, transport, and post-cycling interfacial state.
   - Separate bulk reaction effects from interface, transport, and mechanical effects.
   - Grade evidence:
     - **Strong:** multiple independent probes agree plus reproducible matched-control improvement.
     - **Moderate:** performance improves and one mechanism-specific probe is consistent.
     - **Weak:** single-metric improvement without adequate controls or mechanism evidence.
   - **DG4 — Evidence Convergence:** If structural, kinetic, and device metrics contradict each other, flag ambiguity and halt claim escalation.

5. **Mechanism Discrimination & Claim Bounding**
   - Compare observations against the causal chain; accept, revise, or reject the hypothesis based on mechanism-sensitive evidence rather than performance alone.
   - Bound claims to the tested chemistry, architecture, and operating window.
   - Label conclusions as paper-supported, literature-supported, or inferred.
   - **DG5 — Claim Boundary:** If claims are generalized beyond the tested system or presented as consensus, add explicit boundary statements.

6. **Iteration or Redesign**
   - **Supported:** Advance to practical-relevance testing (loading, durability, translation risks).
   - **Partially supported:** Identify the limiting factor (bulk, interface, transport, mechanics) and propose one targeted modification.
   - **Contradicted:** Revise the mechanism map before proposing new compositions or architectures.
   - **Ambiguous:** Prioritize reproducibility checks and missing diagnostics.
   - **Stop Condition:** End iteration if the design repeatedly fails under comparable controls, relies on fragile assumptions, or cannot meet the target trade-off without unacceptable coupled penalties.

7. **Translation & Safety Review**
   - Assess cost, safety, manufacturability, environmental burden, and recyclability before scaling claims.
   - Flag non-operational safety boundaries; require institutional safety review before experimental implementation.
   - **DG6 — Translation Readiness:** If practical constraints are undocumented, add a translation-risk note before finalizing outputs.

# Output Format

When using this skill, return results in this structure:

```text
1. Research question
   - Target system:
   - Performance bottleneck:
   - Proposed design axis:

2. Mechanism map & hypotheses
   - Plausible mechanisms:
   - For each hypothesis:
     - Causal chain:
     - Evidence strength:
     - Key assumptions:
     - Likely failure modes:
     - Falsification signal:

3. Staged validation plan
   - Stage 1 (intrinsic behavior):
   - Stage 2 (platform compatibility):
   - Stage 3 (full-cell consistency):
   - Matched controls:
   - Primary metrics:
   - Secondary metrics:
   - Mechanism probes:
   - Stop conditions:

4. Controls and metrics
   - Baseline control:
   - Negative control:
   - Positive control:
   - Interference control:
   - Normalization basis:

5. Analysis and iteration rules
   - Evidence layers to collect:
   - How to connect mechanism to performance:
   - Confounding factors to check:
   - If supported:
   - If partially supported:
   - If contradicted:
   - If ambiguous:

6. Validity and safety checks
   - Reproducibility checks:
   - Boundary conditions:
   - Safety and compliance considerations:
   - Translation risks:
```

# Validation Gates

- **DG1 — Scope Specificity:** The bottleneck must be specific enough to support distinct mechanistic hypotheses.
- **DG2 — Falsifiability:** Every hypothesis must have a defined observation that would weaken or reject it.
- **DG3 — Control Adequacy:** The experimental design must isolate the proposed mechanism from confounders through matched controls.
- **DG4 — Evidence Convergence:** Structural, kinetic, and device metrics must support the same causal chain before claim escalation.
- **DG5 — Claim Boundary:** Claims must be bounded to the tested chemistry, architecture, and conditions with clear evidence-strength labels.
- **DG6 — Translation Readiness:** Practical, safety, and environmental constraints must be documented before any scaling claim.

# Claim Boundaries

- Distinguish paper-supported patterns, literature-supported analogies, and agent-inferred hypotheses with explicit labels.
- Do not generalize from one metal-electrolyte pair or material family to an entire battery class.
- Do not treat proof-of-concept or half-cell data as evidence of commercial readiness, long-term safety, or field-wide consensus.
- Avoid presenting single-study results as universal conclusions.
- Label numerical values and specific material systems as user-provided or system-specific, not universal constants.

# Failure Modes

- The proposed mechanism is masked by a confounder (e.g., a conductivity change misattributed to interfacial stability).
- Improvement in one metric causes unacceptable degradation in a coupled metric (e.g., side-reaction suppression at the cost of transport).
- Controls are insufficient to isolate the intervention effect from baseline variability.
- Post-cycling evidence contradicts the proposed mechanism despite favorable initial electrochemical metrics.
- Results are not reproducible across matched replicates or preparation batches.
- Full-cell behavior is dominated by counter-electrode, separator, crossover, or dissolution effects unrelated to the target interface mechanism.
- The design depends on unreported or non-transferable conditions.

# Validity Checks

- **Confounding:** Are composition, morphology, loading, and interface changes decoupled?
- **Normalization:** Are mass, area, volume, active-material loading, and voltage window handled consistently?
- **Reproducibility:** Are replicates, variability estimates, and exclusion criteria stated?
- **Mechanistic validity:** Is there evidence for the causal chain beyond simple metric improvement?
- **Statistical validity:** Are comparisons made under matched protocols with transparent data processing?
- **Boundary conditions:** Are claims limited to the tested chemistry, architecture, and operating window?
- **Safety and ethics:** Are hazards, environmental impacts, and compliance constraints considered at the research-design level?

# Provenance

- Synthesized from cluster 51.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: hybrid-ion-storage-research-workflow; aqueous-metal-battery-solvation-research; organic-redox-aqueous-battery-research; mof-battery-research-workflow; organic-quinone-energy-storage-research-design; hybrid-ion-capacitor-research-design; mxene-metal-oxide-supercapacitor-exploration; electrochemical-storage-architecture-design.
- Paper-specific systems, parameters, and conclusions have been abstracted into a transferable workflow; source references are preserved for lineage only.
