---
name: sci-fiber-battery-fiber-composite-mechanism-discovery-w-8c349432
description: Guide an agent through an end-to-end, observable-driven mechanism discovery and validation workflow for materials research problems involving interfaces, composites, or active material systems.
scienceevolve-title: "Fiber composites and battery materials · battery fiber composite mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide an agent through an end-to-end, observable-driven mechanism discovery and validation workflow for materials research problems involving interfaces, composites, or active material systems. The goal is to transform ambiguous performance limitations into ranked, testable mechanistic hypotheses and disciplined iteration plans without reproducing source-specific systems, operational protocols, or paper conclusions.

# When to use

Use this skill when a user needs to:

- Propose new research questions rooted in mechanistic bottlenecks rather than metric gaps.
- Generate discriminable hypotheses for interfacial, transport, structural, or chemical failure modes.
- Design minimal viable validation plans with explicit controls and stop conditions.
- Iterate on mechanism understanding using orthogonal structural, chemical, kinetic, and performance evidence.

Applicable to energy storage materials, functional composites, and reactive interface systems. Do not use for operational synthesis or device-assembly instructions, clinical or biomedical decisions, or as a substitute for field-wide consensus reviews.

# Inputs required

- Target system class and the functional role of each component (e.g., host, active phase, conductive network, protective layer).
- Dominant bottleneck or failure mode expressed as a physical/chemical process.
- Candidate design levers (architecture, chemistry, interface motif).
- Available evidence tier: source-verified calculations/observations, user-supplied literature, or agent-inferred analogies.
- Constraints: safety boundaries, characterization access, computational resources, scalability, and environmental limits.
- Desired output depth: hypothesis set, validation plan, analysis protocol, or full iteration roadmap.

If inputs are missing, state assumptions explicitly and label outputs as preliminary.

# Core Workflow

1. **Mechanistic Problem Framing**
   - Translate the performance limitation into a specific physical or chemical bottleneck (e.g., interfacial instability, transport limitation, structural degradation, intermediate migration).
   - Link the bottleneck to observable descriptors (thermodynamic, kinetic, electronic, structural) rather than final device metrics alone.
   - *Stop condition*: If the bottleneck cannot be expressed as a falsifiable process with candidate descriptors, pause and request clarification.

2. **Evidence Stratification**
   - Categorize available evidence into three layers: source-verified, literature-supported, and agent-inferred.
   - Flag missing data that would upgrade an inference to supported status.
   - *Decision gate*: If agent-inferred assumptions dominate the evidence base without a feasible validation path, narrow the claim scope before proceeding.

3. **Hypothesis Generation**
   - Produce at least three competing hypotheses. Each must include: causal mechanism, key assumptions, predicted descriptor signatures, likely failure modes, and evidence strength (high / medium / low).
   - Ensure hypotheses are mutually discriminable by at least one control comparison.
   - *Decision gate*: If hypotheses cannot be distinguished by the available validation modalities, return to Step 1 to refine the bottleneck or descriptors.

4. **Validation Architecture Design**
   - Define a minimal viable validation plan: independent variables, dependent variables, and boundary variables.
   - Specify controls:
     - Negative control: low-interaction or inert baseline.
     - Positive control: known functional benchmark from user-supplied literature.
     - Mechanism-isolating control: varies only the suspected active feature while holding the platform constant.
     - Transfer control: bridges idealized models to more realistic multi-component interfaces.
   - Pre-register primary metrics (mechanism-linked), secondary metrics (system-level), normalization basis, and stop conditions.
   - *Stop condition*: If no control can isolate the proposed mechanism, redesign the study before execution.

5. **Orthogonal Evidence Collection**
   - Gather structural, chemical, transport, kinetic, and performance observations under matched conditions.
   - Maintain state alignment: ensure measurements correspond to the same mechanistic stage (e.g., pristine, intermediate, post-cycling).
   - *Decision gate*: If evidence streams conflict and cannot be resolved by state alignment or artifact checks, flag the conflict and proceed to targeted re-measurement before mechanism assignment.

6. **Mechanism Discrimination & Analysis**
   - Compare descriptor trends against controls. Prefer relative trends over isolated absolute values.
   - Test mechanism consistency: structural, chemical, kinetic, and system-level observations must converge on the same causal story.
   - Separate observed results, inferred mechanisms, and extrapolated relevance.
   - *Decision gate*:
     - If consistency is high and controls behave as expected → advance to claim bounding.
     - If consistency is partial → mark hypothesis as "revise" and identify the weakest evidence link.
     - If consistency is absent or negative controls match the candidate → reject the hypothesis.

7. **Claim Bounding & Iteration**
   - Assign final evidence strength and update labels (source-verified / literature-supported / agent-inferred).
   - Decide: KEEP (advance to harder boundary), REVISE (refine design lever), REJECT (abandon mechanism), or BRANCH (pivot to secondary bottleneck).
   - Document boundary conditions: material class, architecture, loading regime, and environmental limits.
   - *Iteration rule*: Return to Step 3 with a refined hypothesis, or to Step 1 if the bottleneck itself is invalidated.

8. **Research Planning & Handoff**
   - Prioritize 2–4 next research directions, each tied to a decisive question.
   - Summarize non-operational safety constraints and compliance boundaries for any follow-up work.
   - *Stop condition*: End the workflow when the user’s decision threshold is met or when further iteration requires resources outside stated constraints.

# Output Format

Respond with the following structure:

1. **Research Question and Context** — Target bottleneck, system assumptions, and scope.
2. **Evidence Map** — Source-verified, literature-supported, and agent-inferred points, labeled by strength.
3. **Hypothesis Matrix** — For each hypothesis: causal statement, mechanism, evidence strength, key assumptions, predicted descriptors, failure modes, and minimal validation.
4. **Validation Plan** — Variables, control set, primary/secondary metrics, normalization basis, and stop conditions.
5. **Analysis Plan** — Descriptor comparisons, mechanism-consistency checks, uncertainty reporting, and visualization strategy.
6. **Iteration Decision** — KEEP, REVISE, REJECT, or BRANCH with justification.
7. **Validity and Safety Summary** — Boundary conditions, confounders, reproducibility checks, and non-operational safety constraints.
8. **Next Research Options** — 2–4 prioritized directions with decisive questions.

# Validation Gates

- **Falsifiability Gate (Step 1→3)**: The bottleneck must be expressible as a falsifiable mechanistic claim with observable descriptors.
- **Discriminability Gate (Step 3)**: Hypotheses must differ in at least one predicted descriptor or control outcome.
- **Control Adequacy Gate (Step 4)**: Every claimed mechanism must have a comparator that removes or alters only that feature.
- **Orthogonality Gate (Step 5→6)**: Mechanism assignment requires at least two independent evidence streams; single-metric claims are blocked.
- **Consistency Gate (Step 6)**: Structural, chemical, kinetic, and performance trends must align before advancing.
- **Boundary Gate (Step 7)**: Claims must be scoped to tested material classes, architectures, and operating envelopes.

# Claim Boundaries

- Distinguish demonstrated mechanisms from inferred mechanisms and speculative analogies.
- Do not treat source-paper or single-study results as field-wide consensus.
- Separate local interfacial behavior from long-range transport or device-level performance.
- Limit extrapolation to tested state points; label boundary-crossing claims as provisional.
- Rankings must reflect quantified uncertainty; close or overlapping results must be reported as conditional.

# Failure Modes

- **Hypothesis non-discriminability**: Competing hypotheses predict identical observable signatures.
- **Control mismatch**: The control set fails to isolate the intended mechanism due to confounding variables (loading, geometry, batch history).
- **Confounding dominance**: An unmeasured variable (e.g., morphology, impurity, state misalignment) explains the observed trend.
- **Mechanistic inconsistency**: Structural, chemical, and kinetic evidence point to different causal stories.
- **Over-extrapolation**: Conclusions extend beyond the tested architecture, chemistry, or operating envelope.
- **Single-point failure**: A claim relies on one unreplicated measurement, model, or sample.
- **Evidence misclassification**: Agent-inferred hypotheses are presented as source-verified.

# Validity Checks

Before finalizing outputs, verify:

- **Gap validity**: The research question addresses an unresolved mechanistic problem, not only a known performance gap.
- **Descriptor validity**: Selected descriptors directly test the proposed mechanism.
- **Control validity**: Positive, negative, and mechanism-isolating controls are defined and matched.
- **Boundary validity**: The design does not over-extrapolate from idealized models to complex operating interfaces.
- **Reproducibility validity**: Key claims are supported by repeated, independent, or sensitivity-tested evidence.
- **Statistical validity**: Rankings consider variance, uncertainty, and sensitivity to assumptions.
- **Mechanistic validity**: Multiple independent evidence streams converge on the same mechanism.
- **Safety validity**: No executable hazardous protocol, operational fabrication instruction, or high-risk parameter is included.
- **Scope validity**: Conclusions are limited to the evidence available and labeled by provenance tier.

# Provenance

- Derived from **Cluster 8 / Subcluster 8.1** ("observable-driven mechanism discovery and validation"; n=135).
- Synthesized from representative source skills:
  - `li-s-battery-theory-guided-exploration`
  - `lithium-ion-capacity-balancing-research`
  - `lithium-sulfur-cathode-network-design`
  - `interface-engineered-emi-composite-exploration`
  - `lithium-sulfur-cathode-state-evolution`
  - `reactive-interphase-stability-workflow`
  - `mg-battery-interfacial-coating-research`
  - `li-s-porous-host-research-design`
