---
name: sci-aqueous-anode-zinc-aqueous-interface-mechanism-disc-4eb84b4f
description: An end-to-end workflow for generating mechanism-grounded hypotheses, designing discriminating validation plans, and iterating on evidence for metal-anode/electrolyte interface problems in aqueous systems.
scienceevolve-title: "Aqueous battery interfaces · anode zinc aqueous interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Use this skill to transform an observed interface failure in aqueous metal-anode systems into a structured mechanism-discovery and validation workflow. It guides an agent to frame coupled degradation modes, generate falsifiable hypotheses, design minimal but discriminating experiments, analyze evidence hierarchically, and iterate based on contradictions rather than optimizing a single material.

# When to use

Use when the user asks to:
- Propose new research questions or hypotheses for aqueous metal-anode interfaces.
- Design non-operational validation plans for interfacial regulation, deposition control, side-reaction suppression, or transport-reversibility trade-offs.
- Critique a proposed interface strategy by mapping its causal chain, controls, and failure modes.
- Iterate a hypothesis after receiving experimental or simulated observations.

Do not use for:
- Directly executable lab recipes, synthesis procedures, or hazardous operating parameters.
- Substituting for institutional safety review or device qualification.
- Treating any single paper’s results as field-wide consensus.

# Inputs required

Before executing the workflow, request or infer:
- **Target system:** metal chemistry, electrolyte family, and cell format.
- **Dominant failure mode(s):** nonuniform deposition, side reactions, corrosion, gas evolution, transport limitation, or full-cell mismatch.
- **Candidate intervention class:** additive, coating, host, separator modification, electrolyte formulation, or coupled architecture.
- **Available diagnostics and constraints:** characterization access, safety boundaries, and practical limits.
- **Baseline context:** unmodified system behavior and relevant literature analogies.

If inputs are missing, state assumptions explicitly and label outputs as provisional.

# Core Workflow

1. **Frame the coupled failure mode**
   - Reframe the observed symptom as a system-level interaction of at least two processes (e.g., deposition morphology, interfacial chemistry, transport, mechanical stability).
   - *Decision gate:* If the failure is described by a single metric, decompose it into interacting mechanisms before proceeding.

2. **Map the mechanism space**
   - Identify candidate causal levers: nucleation barriers, local ion flux, electric-field distribution, solvation/coordination environment, interfacial reaction thermodynamics/kinetics, and mechanical contact stability.
   - Mark each lever as observable, inferable, or speculative.

3. **Generate falsifiable hypotheses**
   - For each candidate lever, formulate a testable mechanism statement: “If [intervention] changes [mechanistic variable], then [diagnostic signature] and [performance metric] should improve relative to [baseline], because [mechanism].”
   - Annotate each with evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observables, likely failure modes, and boundary conditions.
   - *Decision gate:* If hypotheses cannot be discriminated by available controls, return to step 2 and refine the mechanism map.

4. **Design minimal viable validation (MVV)**
   - Define the smallest set of non-operational experiments that can falsify the central mechanism.
   - Specify controls: baseline, sham, negative, single-function, ablation, and interface-variation controls.
   - Predefine primary metrics (mechanism-linked), secondary metrics (performance), and stop conditions.
   - *Stop condition:* If the plan cannot isolate the mechanism from artifacts (contact, loading, surface area, impurities), halt and redesign controls.

5. **Execute hierarchical evidence collection**
   - Layer 1 – Structure/formation: confirm the intended interface or architecture exists.
   - Layer 2 – Transport/interface: measure ion movement, field uniformity, impedance, or coordination changes.
   - Layer 3 – Morphology: assess deposition uniformity and byproduct indicators.
   - Layer 4 – Reversibility: evaluate efficiency, polarization stability, and failure signatures.
   - Layer 5 – Device relevance: test whether local gains survive in a matched full-cell or practical format.
   - *Stop condition:* Do not escalate to the next layer until the current layer supports the hypothesis. If a layer contradicts the hypothesis, proceed to step 7.

6. **Analyze with causal consistency**
   - Link each evidence layer to the hypothesis chain.
   - Separate observation from inference; label conclusions as observed, inferred, or speculative.
   - Quantify uncertainty across replicates, batches, and analysis windows.
   - *Decision gate:* If performance improves without mechanism evidence, treat as provisional and require orthogonal diagnostics before generalizing.

7. **Iterate or terminate**
   - **Align:** Mechanism and performance both improve → strengthen hypothesis, add ablation test, define boundary conditions, and escalate stress or cell complexity.
   - **Partial:** Mechanism improves but performance does not → search for secondary bottlenecks (transport loss, contact failure, full-cell mismatch).
   - **Ambiguous:** Performance improves but mechanism is unclear → add targeted controls; do not claim causality.
   - **Contradicted:** Evidence falsifies the mechanism → reject or revise hypothesis and return to step 3.
   - **Control failure:** Baselines or controls are unstable → pause interpretation, resolve comparability, then restart at step 5.
   - *Stop condition:* Terminate if the intervention creates safety-relevant instability, depends on unmatched baselines, or fails reproducibility checks.

8. **Bound the final claim**
   - State the valid operating envelope (chemistry, temperature, geometry, cell format).
   - Distinguish verified observations from extrapolated implications.
   - Do not infer long-term durability from short-cycle data or full-cell readiness from isolated tests.

# Output Format

Produce:

1. **Research question** – One focused question tied to a coupled failure mode.
2. **Mechanism map** – Causal links among structure, transport, interfacial chemistry, and cell-level performance.
3. **Hypothesis table** – For each hypothesis: claim, mechanistic rationale, evidence strength, key assumptions, predicted observables, likely failure modes, and boundary conditions.
4. **Minimal viable validation plan** – Non-operational experimental logic, controls, diagnostics, stop conditions, and escalation criteria.
5. **Evaluation metrics** – Mechanism, reversibility, system-level, and practicality metrics.
6. **Analysis plan** – How to connect evidence layers and distinguish mechanism from artifact.
7. **Iteration rules** – Decision logic for success, partial support, contradiction, and control failure.
8. **Validity and safety notes** – Confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Mechanism isolation gate:** At least one diagnostic must directly test the proposed mechanism, and one system-level metric must test whether it matters.
- **Control gate:** Improvement must survive comparison against negative, sham, and ablation controls.
- **Reproducibility gate:** Trends must be consistent across independent samples or cells; variability must be reported.
- **Escalation gate:** Local/interface gains must be re-tested in a realistic cell context before claiming device relevance.
- **Safety gate:** Any plan introducing unacceptable gas generation, short-circuit risk, or uncontrolled byproduct growth must trigger redesign or stop.

# Claim Boundaries

- Distinguish paper-reported observations from agent-generated hypotheses and unverified extensions.
- State that conclusions apply only within the tested design space (chemistry, interface, scale, operating context).
- Do not infer long-term durability from short-cycle stability, full-cell readiness from half-cell data, or universal electrolyte rules from one composition.
- Label conclusions as observed, inferred, or speculative.

# Failure Modes

- The intervention improves one metric while worsening a safety-relevant or system-level metric.
- Morphology improves but reversibility, impedance, or full-cell performance does not.
- Evidence depends on unmatched baselines or non-comparable cell contexts.
- Controls behave inconsistently or mimic the active effect.
- Isolated-test gains disappear in full-system tests.
- Results are explainable by confounding variables (contact, loading, surface area, impurities).
- Batch variability or irreproducible processing dominates observed trends.

# Validity Checks

- **Confounding:** Check for cathode/electrolyte/separator changes, loading differences, contact pressure, surface-area artifacts, coating-mass effects, and post-mortem handling.
- **Reproducibility:** Require matched baselines, independent repeats, transparent exclusion criteria, and consistent analysis rules.
- **Statistical validity:** Predefine success/failure criteria; avoid selecting best-performing cells; report uncertainty.
- **Mechanistic specificity:** Ensure controls distinguish selectivity, transport, morphology, and side-reaction effects.
- **Boundary conditions:** Define where the hypothesis fails under changed electrolyte, temperature, pressure, geometry, or cathode constraints.
- **External validity:** Do not extrapolate to practical viability without durability, safety, and practicality evidence.

# Provenance

- Synthesized from cluster 8.2 (observable-driven mechanism discovery and validation).
- Source skills: aqueous-zinc-anode-research-workflow, rechargeable-metal-gel-electrolyte-exploration, zinc-ion-anode-interface-exploration, aqueous-zn-interface-exploration, rechargeable-metal-ion-sieve-research-design, zinc-ion-battery-anode-exploration, afzb-research-pattern, sustainable-zinc-battery-interface-exploration.
- Paper-specific materials, numerical results, and operational protocols have been removed; only the shared workflow route is retained.
