---
name: sci-aqueous-electrochemical-interface-mechanism-discove-94ef5126
description: A reusable end-to-end workflow for observable-driven mechanism discovery and validation in electrochemical energy storage research, from failure-mode framing through convergent evidence analysis to bounded claim generation.
scienceevolve-title: "Aqueous battery interfaces · electrochemical interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Use this skill to transform observed electrochemical interface or device-level failures into structured, testable mechanism hypotheses and staged validation plans. The workflow guides an agent to frame problems from observables, generate competing mechanistic hypotheses, design controlled comparisons across multiple evidence tiers, and iterate based on convergent evidence rather than single-metric performance rankings. It is intended for research planning and reasoning, not for operational laboratory execution.

# When to use

Use this skill when a user asks to:

- Propose new interfacial design concepts, electrolyte or medium modifications, or electrode architectures for electrochemical energy storage.
- Diagnose degradation, reversibility loss, or kinetic bottlenecks using a mechanism-first approach.
- Design comparative validation plans with explicit controls, metrics, and stop conditions.
- Evaluate whether a candidate concept has a plausible causal path from molecular or structural change to device behavior.
- Iterate a research direction after ambiguous, contradictory, or negative results.

Do not use this skill to provide executable laboratory procedures, operational parameters, synthesis recipes, hazardous material handling instructions, or regulatory compliance advice.

# Inputs required

Before generating a plan, collect or infer:

- **Target system:** active charge carrier, electrode materials, electrolyte or medium class, and cell architecture.
- **Observed failure mode:** specific degradation pathway, kinetic limitation, or interfacial instability (e.g., uneven deposition, side reactions, passivation, structural degradation).
- **Candidate design lever:** class of modifier, additive, coating, dopant, structural feature, or electrolyte variable proposed to alter the local environment.
- **Available evidence:** literature benchmarks, preliminary data, computational predictions, or user-provided constraints.
- **Intended output:** hypothesis list, experimental design, analysis plan, critique of a concept, or iteration roadmap.

If critical inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## Step 1: Failure-first framing
Start from a reproducible interface or device-level failure, not from a preferred material.
- Define the coupled bottleneck (e.g., stability versus transport, energy versus power).
- Identify primary observable symptoms and measurable degradation metrics.
- **Gate:** If the failure mode cannot be stated in observable, measurable terms, stop and refine the problem statement before proceeding.

## Step 2: Mechanism mapping and hypothesis generation
Separate solid-state, interfacial, and transport mechanisms.
- Generate at least three competing, falsifiable hypotheses.
- For each hypothesis specify: predicted mechanistic chain, evidence strength (strong / moderate / weak / speculative), key assumptions, most likely failure modes, boundary conditions, and observations that would support or refute it.
- **Gate:** If hypotheses lack distinct mechanistic chains or clear falsification paths, revise before proceeding.

## Step 3: Validation plan design
Define comparison groups:
- **Baseline:** conventional or accepted system exhibiting the failure.
- **Candidate:** proposed design featuring the new lever.
- **Negative control:** system lacking the proposed feature or expected to preserve the failure.
- **Positive benchmark:** known comparator demonstrating the design principle, when available.
- **Analogue control:** structurally related but weaker variant to test architecture-dependent effects, when relevant.

Stage validation across evidence tiers:
1. Local environment / structure
2. Transport / kinetic behavior
3. Interface / morphology
4. Component / half-cell performance
5. Full-system / coupled-cell performance

Define independent, controlled, and monitored variables. Predefine primary and secondary metrics mapped directly to mechanism links. Predefine support, weakening, and rejection criteria for each hypothesis.

**Gate:** If the plan lacks at least one diagnostic per intended mechanism link or omits necessary controls, redesign before execution.

## Step 4: Evidence collection and convergent analysis
Build an evidence matrix linking each hypothesis to results across all tiers.
- Normalize metrics consistently (e.g., active mass, total mass, geometric area).
- Separate mechanism evidence from performance-only evidence.
- Quantify uncertainty, variability, and replicate consistency.
- Classify each causal link as Supported, Ambiguous, Unsupported, or Not Tested.

**Decision gate:**
- **Continue** if local-environment, kinetic, and morphology evidence align with performance gains.
- **Revise** if performance improves but mechanism evidence is incomplete or contradictory.
- **Stop** if controls behave unexpectedly, the candidate worsens degradation versus baseline, or safety/compliance concerns dominate.

## Step 5: Iteration or redesign
- **If continuing:** isolate which mechanism link changed first and plan the next validation layer (e.g., advance from component to full-system).
- **If revising:** update the hypothesis by replacing the weakest assumption, adding a discriminating control, or testing an alternative mechanism.
- **If stopping:** document negative results as boundary conditions and pivot to a new candidate or descriptor.

**Iteration rule:** Change only one primary design variable per cycle unless a broader screen is explicitly requested.

## Step 6: Claim bounding and output finalization
- State the final evidence strength for each claim.
- Bound conclusions to the tested system class and operating regime.
- Distinguish mechanism-supported, performance-supported, and speculative claims.
- Archive the provenance of inferences versus source-supported patterns.

# Output Format

Produce the following structured deliverables:

1. **Research question** — Target system, failure mode, and why it matters.
2. **Hypothesis table** — For each hypothesis: mechanistic chain, evidence strength, key assumptions, expected observations, and possible failure modes.
3. **Mechanistic rationale** — Local-environment change, interfacial kinetics implication, morphology implication, and device-level translation expectation.
4. **Experimental design plan** — Comparison groups, variables, staged diagnostic tiers, primary/secondary metrics, minimum viable validation, and stop conditions.
5. **Analysis plan** — Evidence matrix, normalization rules, confounder checks, reproducibility checks, and decision criteria for supported/ambiguous/unsupported links.
6. **Iteration decision** — Continue, revise, or stop criteria; next hypothesis if successful; alternative explanation if failed.
7. **Confidence and limitations** — Evidence strength summary, boundary conditions, and what remains unverified.

# Validation Gates

Before advancing past each tier in the Core Workflow, confirm:
- **Control adequacy:** Baseline, negative, candidate, and positive or analogue controls are defined and matched.
- **Orthogonality:** At least three independent evidence branches are required before claiming a multifunctional mechanism.
- **Reproducibility:** Replicate consistency, batch variability, and measurement uncertainty are reported.
- **Scale transfer:** Component-level improvements are checked against full-system limitations before extrapolation.
- **Normalization consistency:** All comparison groups use the same mass, area, or volume basis.
- **Mechanistic specificity:** Performance gains are accompanied by diagnostics consistent with the proposed causal chain.

# Claim Boundaries

- **Mechanism-supported:** Local environment, kinetic, and morphology evidence converge with performance improvement.
- **Performance-supported:** Performance improves but the causal mechanism is incomplete or inferred.
- **Speculative:** Only analogy, literature plausibility, or modeling supports the claim.
- Restrict all claims to the tested charge carrier, medium, electrode, and cell architecture.
- Do not present single-study or single-candidate findings as field-wide consensus.
- Treat source-specific numerical results, settings, and exact chemistries as non-transferable unless independently revalidated.

# Failure Modes

- **Hypothesis failure:** The design variable does not produce the intended local or interfacial change.
- **Confounding dominance:** Improvement arises from mass loading, conductivity, surface area, measurement bias, or uncontrolled variables rather than the proposed mechanism.
- **Integration failure:** Component-level gains do not survive coupled-cell constraints (e.g., mass balance, membrane effects, inventory limitations).
- **Descriptor failure:** A ranking descriptor lacks causal connection to the observed effect.
- **Mechanism contradiction:** Orthogonal evidence branches conflict, indicating an alternative or more complex pathway.
- **Premature extrapolation:** Claims are generalized beyond the tested boundary conditions before practical-format validation.

# Validity Checks

Before finalizing a research plan or claim:
- Does the hypothesis target a specific failure mode rather than a vague performance goal?
- Are baseline, benchmark, candidate, and negative control clearly distinguished?
- Is each claimed mechanism supported by an independent diagnostic category?
- Are electrode-side and interface-side effects separated where possible?
- Are transport, interfacial chemistry, nucleation, and compatibility treated as confounders?
- Are primary and secondary metrics predefined and mapped to mechanism links?
- Are reproducibility, variability, and uncertainty addressed?
- Are the limits of extrapolation explicitly stated?
- Are source-specific numbers, settings, or exact chemistries treated as non-transferable?

# Provenance

Synthesized from cluster 30.0 (observable-driven mechanism discovery and validation). Derived from source skills: solvation-mediated-electrolyte-design (d0f382a759dba9d2), low-temp-aqueous-conversion-battery-research (c12c9776204d4aee), aqueous-zinc-battery-coupled-stabilization (60c9a251923c8d2e), interfacial-additive-electrochemistry-research (7ab1b1769bae22d6), transport-structure-zn-battery-electrolyte-research (aca68fe05154db47), organic-electrode-multivalent-battery-research (0e03976725e6aca0), conducting-polymer-hybrid-capacitor-research (649c0755b1331a90), descriptor-guided-aqueous-zinc-electrolyte-research (a751702c8fe4edf1).
