---
name: sci-aqueous-aqueous-cathode-zinc-zib-mechanism-discover-71b5ea6d
description: Reusable end-to-end workflow for observable-driven mechanism discovery and validation in aqueous electrochemical energy storage, abstracting hypothesis generation, controlled validation, and iterative refinement without source-specific recipes.
scienceevolve-title: "Aqueous battery interfaces · aqueous cathode zinc zib mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Guide an agent to transform an observed performance bottleneck in aqueous electrochemical energy storage into a ranked set of falsifiable mechanism hypotheses, design a minimally controlled validation plan, triangulate evidence across orthogonal diagnostics, and iterate until the mechanism is supported, revised, or rejected. The workflow treats subsystem interactions (host, carrier, electrolyte, interface) as a transferable decision framework rather than reproducing any single material system or paper conclusion.

## When to use

- When exploring new research questions for aqueous multivalent-ion battery cathodes, anodes, electrolytes, or interfaces.
- When generating hypotheses about ion storage, transport, interfacial stability, structural evolution, or degradation pathways.
- When designing concept-level validation plans with explicit controls and stop conditions.
- When analyzing or critiquing mechanism claims from electrochemical, structural, or chemical evidence.
- When iterating after ambiguous, contradictory, or preliminary results.

## Inputs required

- Target subsystem and role (cathode host, anode, electrolyte/medium, interface, full device).
- Observed bottleneck and dominant failure mode (e.g., irreversibility, kinetic limitation, structural transformation, interfacial instability).
- Candidate intervention class, if any, and its intended mechanism chain.
- Available orthogonal diagnostics (electrochemical, structural, chemical, microscopic, modeling).
- Comparator set concept (baseline, negative/positive controls, mechanistic variants).
- Constraints: safety boundaries, environmental considerations, scalability, and non-operational scope.

## Core Workflow

1. **Frame the Bottleneck**
   - Convert the observed limitation into a testable, mechanism-focused problem statement.
   - Decompose the system into storage host, mobile carrier, electrolyte/medium, electrode interface, and degradation pathway.
   - **Gate 1 — Scoping:** If the bottleneck cannot be expressed as a falsifiable mechanism question, stop and reframe.

2. **Generate Competing Hypotheses**
   - Produce 3–6 hypotheses that explain the bottleneck through distinct mechanisms.
   - For each, state the mechanism chain (design variable → local process → diagnostic signature → system outcome), evidence strength, key assumptions, predicted observables, and a result that would falsify it.
   - Include at least one non-obvious alternative (e.g., side reaction, measurement artifact, confounding interface effect).
   - **Gate 2 — Discriminability:** If no hypothesis can be distinguished with available diagnostics, stop and expand the characterization scope or narrow the question.

3. **Design Minimal Viable Validation**
   - Define the smallest experiment that can weaken or support the top hypotheses.
   - Specify independent, dependent, and controlled variables.
   - Assemble a comparison set: candidate, baseline active material, inactive/scaffold-only control, mechanistic variant, and positive/negative controls where feasible.
   - Select metrics across electrochemical, structural, chemical, and interface layers.
   - Predefine stop conditions: control failure, uncontrolled degradation, safety concern, or disappearance of improvement under matched normalization.
   - **Gate 3 — Isolation:** If controls cannot separate the intended mechanism from mass-loading, additive, surface-area, or electrolyte artifacts, redesign before proceeding.

4. **Collect and Normalize Observations**
   - Gather data from all planned orthogonal streams.
   - Enforce consistent normalization (mass, geometry, protocol, voltage window, state-of-charge) and include replicate checks.
   - **Gate 4 — Integrity:** If normalization is inconsistent, replicates are absent, or baselines are unstable, halt interpretation and repair data quality.

5. **Triangulate Mechanism**
   - Align electrochemical trends with structural, chemical, and interface evidence.
   - Separate reversible storage from irreversible transformation, precipitation, corrosion, or parasitic reactions.
   - Attribute performance changes to the candidate mechanism only if matched controls behave differently in the predicted direction.
   - Label each claim as directly measured, inferred, or speculative.
   - **Gate 5 — Convergence:** If independent evidence streams conflict, reject mechanism advancement. Flag ambiguity and move to iteration.

6. **Decide and Iterate**
   - Assign one of four decisions to each hypothesis:
     - **Advance:** Convergent evidence supports the mechanism; proceed to higher-stress or paired-device validation.
     - **Revise:** Evidence is suggestive but controls or diagnostics are insufficient; refine the experiment.
     - **Pivot:** Evidence indicates a different bottleneck or mechanism class; reformulate hypotheses.
     - **Stop:** Safety concerns, uncontrolled degradation, or confounding invalidate interpretation.
   - **Iteration rule:** After two consecutive ambiguous cycles without convergence, simplify the system or strengthen controls before adding variables.
   - **Gate 6 — Escalation:** Do not translate component-level claims to full-device or field-level claims until the mechanism is supported by matched controls and boundary checks.

7. **Map Boundaries and Archive**
   - Record the conditions under which conclusions hold (material class, electrolyte family, loading, temperature, cell format).
   - Distinguish paper-derived patterns from newly inferred proposals.
   - Document the decision trail: hypothesis → evidence → update → next test → falsification criterion.

## Output Format

When this skill is invoked, produce:

1. **Research question:** concise bottleneck-focused statement.
2. **Hypothesis table:** ranked competing hypotheses with mechanism chain, evidence strength, key assumptions, predicted observables, and failure modes.
3. **Validation plan:** minimal viable experiment with variables, controls, metrics, and predefined stop conditions.
4. **Analysis protocol:** normalization rules, triangulation sequence, and decision criteria for supporting, weakening, or falsifying each hypothesis.
5. **Iteration roadmap:** explicit rules for advance, revise, pivot, or stop based on possible outcomes.
6. **Boundary statement:** scope limits, confounders, and reproducibility requirements.
7. **Validity and safety notes:** non-operational constraints and escalation criteria.

## Validation Gates

- **Scoping Gate:** The bottleneck is framed as a falsifiable mechanism problem, not just a performance gap.
- **Plausibility Gate:** At least one hypothesis is testable with the available diagnostic set.
- **Isolation Gate:** Controls are capable of separating the proposed mechanism from mass-loading, additive, surface-area, and electrolyte artifacts.
- **Integrity Gate:** Data collection plans include consistent normalization, replicates, and stable baselines.
- **Convergence Gate:** Mechanism claims rest on at least two independent evidence streams that point in the same direction.
- **Escalation Gate:** Component-level mechanism is supported by matched controls before full-device or field-level claims are made.

## Claim Boundaries

- Do not treat single-paper observations as field consensus.
- Do not generalize from one material, one ion, or one cell configuration to an entire device class.
- Distinguish directly measured trends from inferred mechanisms and speculative extrapolations.
- Limit performance claims to the tested normalization basis and state-of-charge window.
- Acknowledge when a claim depends on a narrow operating range, special electrolyte chemistry, or unverified scalability.

## Failure Modes

- **Confounded attribution:** Apparent gains are explained by scaffold contribution, inactive mass, or measurement artifact rather than the intended mechanism.
- **Irreversible transformation mislabeled as reversible storage:** Structural or chemical evolution is mistaken for stable cycling behavior.
- **Subsystem–device mismatch:** Component-level improvements disappear under matched full-cell normalization.
- **Mechanism ambiguity:** Electrochemical trends are consistent with multiple competing explanations.
- **Control failure:** Baseline or negative controls behave unexpectedly, invalidating comparisons.
- **Safety or reproducibility block:** Unstable interfaces, uncontrolled degradation, or batch variability prevents credible interpretation.

## Validity Checks

Before finalizing any plan or conclusion, verify:

- **Confounding controls:** Loading, geometry, contact area, protocol, and normalization are matched between candidate and baseline.
- **Attribution:** Gains require the proposed architecture or mechanism and are not reproduced by a single component alone.
- **Reproducibility:** Independent batches, repeated measurements, and variability estimates are included.
- **Mechanistic specificity:** At least two orthogonal diagnostics converge on the same explanation.
- **Boundary conditions:** Claims are scoped to tested material classes, electrolyte families, and operating regimes.
- **Statistical proportionality:** Claim strength does not exceed evidence strength.
- **Safety and ethics:** No operational hazardous instructions are embedded; risks are escalated to qualified review.

## Provenance

- Derived from cluster 22 / subcluster 22.1: observable-driven mechanism discovery and validation.
- Synthesized from source skills: hybrid-energy-interfacial-exploration, polymer-cathode-functional-site-exploration, aqueous-zib-mechanism-exploration, aqueous-battery-energy-density-exploration, azib-carbon-oxide-composite-research, pba-zib-structural-reconstruction-exploration, covalent-organic-framework-zinc-battery-research-design, aqueous-zib-cathode-research-design.
