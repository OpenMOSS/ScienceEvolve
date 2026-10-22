---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-40d2e0c6
description: A reusable end-to-end workflow for discovering and validating material mechanisms in fiber, composite, binder, and interface systems through observable-driven hypothesis generation, controlled validation, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 10"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to guide an agent through an observable-driven mechanism discovery and validation workflow for material systems such as fibers, composites, binders, and interfaces. The workflow converts a performance bottleneck into falsifiable mechanism-based hypotheses, designs minimal comparative validation with strong controls, builds a causal evidence chain from structure to performance, and iterates while explicitly bounding claims.

## When to use

Use this skill when the task is to:

- Explore new material concepts where structure, interface, or composition is expected to govern performance.
- Translate a materials study into a reusable research plan for a new system.
- Design comparative validation studies that must isolate mechanism from artifact.
- Evaluate whether a proposed material mechanism is supported by a coherent, orthogonal evidence chain.
- Navigate coupled failure modes such as chemical degradation, mechanical loss, transport limitation, or morphological instability.

Do not use this skill as a substitute for operational laboratory protocols, clinical decision-making, field-specific safety review, or institutional approval.

## Inputs required

Ask for or identify:

- Target material class and application context.
- Primary performance bottleneck or failure mode.
- Candidate components and their proposed mechanistic roles.
- Available characterization and modeling capabilities.
- Baseline or benchmark systems for comparison.
- Evaluation priorities and boundary conditions.
- Safety, reproducibility, and resource constraints.

## Core Workflow

Follow this ordered end-to-end route. Advance through decision gates; stop or iterate when conditions are not met.

### Step 1: Decompose the bottleneck
- Separate coupled failure modes (e.g., chemical degradation, mechanical loss, transport limitation, morphological instability).
- Frame the gap around observable performance limits under relevant operating conditions, not around a preferred material name.
- **Decision Gate 1 — Bottleneck Clarity:** Are the failure modes separable and linked to observable variables? If no, refine the problem framing before proceeding.

### Step 2: Generate mechanism-linked hypotheses
- Map material structure or interface features to expected functions.
- For each hypothesis, define: mechanism claim, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observations, likely failure modes, and claim boundary.
- Prioritize hypotheses that are falsifiable, address coupled stresses, and include a clear control strategy.
- **Decision Gate 2 — Testability:** Can the hypothesis be rejected with available resources and orthogonal measurements? If no, redesign or deprioritize.

### Step 3: Design minimal viable validation
- Define a compact design matrix varying one dominant mechanism variable at a time.
- Establish strong controls: baseline, process-relevant, component-only, negative (mechanism-weakened), and positive benchmark where available.
- Select metrics spanning structure, interfacial function, transport or mechanics, and system-level performance.
- Predefine stop conditions: controls fail to isolate the mechanism, safety or reproducibility concerns arise, or the hypothesis is contradicted by orthogonal data.
- **Decision Gate 3 — Control Integrity:** Do controls isolate the proposed mechanism from confounders? If no, redesign comparisons before execution.

### Step 4: Execute the evidence chain
- Collect orthogonal measurements aligned with a causal chain: structure → property → mechanism → performance.
- Do not infer mechanism from a single endpoint.
- Document batch, preparation, and environmental variables that could introduce confounding.

### Step 5: Analyze and discriminate mechanisms
- Normalize comparisons across matched dimensions, composition, and processing history.
- Distinguish correlation from causality; require at least two independent measurements before assigning a mechanism.
- Diagnose tradeoffs (e.g., improved capture versus transport penalty; ordering versus defect formation).
- **Decision Gate 4 — Mechanistic Consistency:** Do structural, interfacial, kinetic, and post-operation results tell the same causal story? If no, list competing mechanisms and return to Step 2.

### Step 6: Iterate or redesign
- Classify the evidence outcome:
  - **Retain:** independent measurements support the mechanism and controls exclude artifacts.
  - **Refine:** one descriptor changes as predicted but another does not.
  - **Split:** multiple effects are entangled.
  - **Reject:** negative controls reproduce the claimed benefit or post-test evidence contradicts the mechanism.
  - **Pivot:** the material works through a different mechanism than proposed.
  - **Escalate:** results depend on fragile assumptions or poor reproducibility.
- **Decision Gate 5 — Iteration Direction:** Is the next minimum viable test clearly defined? If no, return to Step 2 or stop.

### Step 7: Bound claims and plan next steps
- Limit claims to tested operating regimes, material classes, and measurement conditions.
- Label conclusions as observed, supported, inferred, or speculative.
- Identify boundary tests needed before generalization.
- **Stop condition:** Extrapolation risk exceeds evidence strength; claims must not be presented as field-wide consensus.

## Output Format

When using this skill, return:

1. **Research question and gap map:** the bottleneck, what is known, what is missing, and why it matters.
2. **Ranked hypotheses table:** mechanism claim, evidence strength, key assumptions, predicted observations, likely failure modes, and claim boundary.
3. **Validation plan:** compact design matrix, strong controls, response metrics, and stop conditions.
4. **Analysis plan:** causal evidence chain, normalization rules, tradeoff checks, and confounder list.
5. **Iteration rules:** criteria for retain, refine, split, reject, pivot, and escalate.
6. **Claim boundaries and validity notes:** explicit limits on generalization and safety-sensitive constraints.
7. **Provenance and evidence labeling:** source of each claim and its confidence level.

## Validation Gates

Before advancing or presenting conclusions, verify:

- **Confounder check:** Are gains caused by loading, processing variation, or measurement differences rather than the proposed mechanism?
- **Control check:** Do baseline, component-only, and benchmark controls isolate the mechanism?
- **Reproducibility check:** Are trends repeated across independent samples with uncertainty reported?
- **Statistical check:** Are effect sizes, variance, and stopping criteria stated before interpretation?
- **Mechanistic consistency check:** Do orthogonal measurements align in a causal chain?
- **Boundary check:** Are claims limited to the tested operating regime and material class?

## Claim Boundaries

- State explicitly where extrapolation must stop (untested materials, operating regimes, environments, or scales).
- Do not treat a single-system result as field-wide consensus.
- Distinguish observed, supported, inferred, and speculative conclusions.
- Avoid claims of commercial readiness, clinical suitability, or environmental safety without independent validation.

## Failure Modes

- Controls fail to separate mechanism from artifacts.
- Single-metric optimization masks tradeoffs that invalidate practical utility.
- Correlation is mistaken for causation due to missing structural or interfacial evidence.
- A hypothesis is supported only under unrealistic boundary conditions (e.g., low loading, idealized geometry, unreproducible processing).
- Reproducibility breakdown across batches or preparation runs.
- Post-operation evidence contradicts the proposed mechanism but is omitted from analysis.
- Overgeneralization from one material system or one study to an entire class.

## Validity Checks

- Verify that the intended modification or structure exists before interpreting performance.
- Require orthogonal evidence before claiming interfacial bonding, ordering, confinement, or transport control.
- Normalize comparisons using identical accounting rules for composition, dimensions, and processing.
- Report variability, batch identifiers, and excluded data transparently.
- Label conclusions as observed, supported, inferred, or speculative.
- Confirm that analytical signals are not explained by non-specific effects, background sorption, or degradation artifacts.

## Provenance

- Synthesized from cluster 75.1 (observable-driven mechanism discovery and validation).
- Source skills: lithium-sulfur-binder-research-design; low-electrolyte-battery-research-workflow; composite-nanofiber-scaffold-exploration; printable-bioadsorbent-exploration; natural-fiber-coating-exploration; graphene-fiber-toughening-exploration; spiral-flow-fiber-exploration; multifunctional-binder-research-exploration.
