---
name: sci-polymer-composite-thermoset-mechanism-discovery-wor-1597faba
description: End-to-end reusable workflow for designing, discriminating, and validating structure-property-mechanism hypotheses in sustainable thermoset and composite material systems.
scienceevolve-title: "Polymer composites and vitrimers · composite thermoset mechanism discovery workflow 3"
scienceevolve-area: polymer-composites-and-vitrimers
---

## Purpose

Guide agents through an end-to-end mechanism discovery and validation workflow for thermoset, composite, and hybrid material systems—especially those involving bio-derived feedstocks, dynamic networks, flame-safety functionality, or sustainability-driven substitutions. The skill frames research as a sequence of falsifiable hypotheses, controlled comparisons, and iterative claim bounding rather than as recipe replication.

## When to use

Use when:
- Proposing new research questions that couple service performance with end-of-life behavior (recyclability, degradability, repair) in thermosets or composites.
- Designing experiments to isolate whether a molecular or architectural modification causes an observed change in thermal, mechanical, fire-safety, or recovery properties.
- Comparing a candidate system against a conventional benchmark or negative control.
- Interpreting multi-scale evidence (neat resin → composite → interface → recovered component) to bound mechanism claims.
- Iterating after ambiguous, conflicting, or negative results.

Do not use for operational laboratory protocols, hazardous synthesis instructions, regulatory certification, or as a substitute for domain-specific safety review.

## Inputs required

Before executing the workflow, request or infer:
- Target application and performance envelope.
- Incumbent benchmark or reference system.
- Candidate design variables (e.g., network architecture, linkage type, reinforcement, interface strategy).
- Sustainability or end-of-life goal (recyclability, degradability, flame retardancy, bio-content).
- Available characterization constraints and scale (neat resin vs. composite).
- Safety, regulatory, and environmental boundaries.
- Prior evidence strength: what is verified vs. inferred vs. speculative.

## Core Workflow

An ordered end-to-end route with decision gates. At each gate, classify evidence and decide: advance, modify, pivot, or stop.

### Stage 1: Frame the contradiction and research gap
- Define the coupled problem: e.g., durability vs. recyclability, strength vs. toughness, flame safety vs. recovery, fossil dependence vs. renewable sourcing.
- Identify the incumbent benchmark and the specific performance or sustainability gap.
- **Decision gate 1:** Is the gap falsifiable with measurable evidence? If not, reframe the question before proceeding.

### Stage 2: Generate ranked mechanism hypotheses
- Formulate 3–5 hypotheses that link molecular or architectural design to a mechanism, not just to a property target.
- For each hypothesis specify:
  - Evidence strength (high / moderate / low / speculative).
  - Key assumptions.
  - Expected observations if true.
  - Likely failure modes.
  - Boundary of claim (where inference should not extrapolate).
- **Decision gate 2:** Are the hypotheses mechanism-facing and distinguishable by controls? If not, refine or merge hypotheses.

### Stage 3: Design the study and control architecture
- Define independent variables at a conceptual level (e.g., linkage density, functionality placement, reinforcement type).
- Define controls:
  - Baseline incumbent.
  - Negative control lacking the proposed mechanism.
  - Structural/compositional control isolating the motif.
  - Process control matching history to isolate chemistry effects.
- Define primary metrics (target property), trade-off metrics (mechanical, thermal, durability), and mechanism-check metrics (morphology, fragment analysis, interface quality).
- Define stop conditions before results are known (e.g., unacceptable loss in critical property, failure to isolate mechanism, nonselective degradation).
- **Decision gate 3:** Does the design isolate one mechanistic dimension at a time? If not, simplify the candidate set.

### Stage 4: Execute mechanism discrimination experiments
- Collect evidence in order:
  1. Structure confirmation (intended motif, network formation, conversion).
  2. Service property baseline (thermal, mechanical, adhesive, or barrier behavior vs. benchmark).
  3. Trigger or functional response (degradation, exchange, flame behavior, recovery).
  4. Mechanistic closure (products, fragments, residue, interface morphology, non-labile analogues).
- **Decision gate 4 (Candidate gate):** Does the candidate show the target response without immediate disqualifying trade-offs? If no, reject or redesign. If yes, proceed to scale-up validation.

### Stage 5: Scale and translate validation
- If neat-resin evidence is positive, test composite-level or application-mockup behavior.
- Separate matrix contribution from interface, reinforcement, processing, and geometry effects.
- For recovery/recycling claims: assess recovered component integrity and feedstock usefulness, not only mass loss.
- For flame-safety claims: require multiple evidence streams (ignition, heat release, residue, mechanism consistency).
- **Decision gate 5 (Functional validation):** Do resin-level gains survive at the composite or application scale? If no, diagnose interface/architecture bottlenecks. If yes, proceed to claim bounding.

### Stage 6: Simulation and mechanistic support (optional)
- Use computational or kinetic reasoning only as supporting evidence, never as a substitute for measurements.
- Label computational claims as mechanistic support, not proof.
- **Decision gate 6 (Robustness check):** Do simulations corroborate the experimental mechanism without contradicting controls? If conflicting, require additional experimental isolation.

### Stage 7: Analysis and claim bounding
- Rank candidates by combined evidence, not by a single metric.
- Label each conclusion:
  - Verified for the tested system.
  - Inferred for the new system.
  - Speculative.
- Bound claims: do not extrapolate from neat resin to composite, from one cycle to recyclability, or from one formulation to field consensus.
- **Decision gate 7 (Claim bounding):** Are all claims limited to the tested system and evidence strength? If not, trim or downgrade claims.

### Stage 8: Iterate or redesign
- Map the dominant failure mode to a design lever:
  - If service properties fail: revisit network topology, rigidity, or compatibility.
  - If trigger/recovery fails: revisit linkage accessibility, trigger match, or degradation pathway.
  - If composite translation fails: investigate interface wetting, voids, reinforcement damage, or architecture.
  - If mechanism is ambiguous: add orthogonal characterization or analogue subtraction.
  - If variability dominates: improve batch control, preprocessing, or measurement consistency.
- **Decision gate 8 (Iteration gate):** Is the revised hypothesis falsifiable with a minimal next experiment? If yes, return to Stage 3. If no, stop and document boundaries.

## Output Format

Return the following structure:
1. **Research question** — one sentence linking the application pain point to the design challenge.
2. **Gap and benchmark** — field gap, incumbent comparator, and comparison rationale.
3. **Ranked hypotheses** — mechanism, evidence strength, assumptions, failure modes, boundaries.
4. **Study design** — variables, controls, metrics, and stop conditions.
5. **Analysis plan** — structure, service property, mechanism, and reproducibility checks.
6. **Validation plan** — resin-level, composite-level, and recovery/flame-safety evidence requirements.
7. **Iteration plan** — redesign paths for each major failure mode.
8. **Claim boundary table** — what is verified, inferred, speculative, and excluded.
9. **Validity and safety notes** — confounders, reproducibility needs, ethical/environmental boundaries.

## Validation Gates

- **Gate 1 (Framing):** Question is application-led and falsifiable.
- **Gate 2 (Hypothesis):** Hypotheses are mechanism-facing, ranked, and distinguishable.
- **Gate 3 (Design):** Controls isolate the proposed motif from composition and processing effects.
- **Gate 4 (Evidence):** Target response is observed without disqualifying trade-offs.
- **Gate 5 (Scale):** Resin-level gains are confirmed at the relevant composite or application scale.
- **Gate 6 (Robustness):** Computational support aligns with experimental controls.
- **Gate 7 (Claim):** Conclusions are bounded by evidence strength and system scope.
- **Gate 8 (Iteration):** Next step is the smallest test that can falsify the revised hypothesis.

## Claim Boundaries

- Do not treat renewable feedstock origin as proof of safety, lower toxicity, or lifecycle benefit without comparative evidence.
- Do not infer mechanism from a single property trend; require orthogonal evidence.
- Do not generalize from one biofiber/thermoset system to all bio-based or composite systems.
- Do not claim recyclability, reprocessability, or flame safety from a single cycle or one evidence stream.
- Separate resin-level network mechanisms from composite-level interface or architecture effects.
- Distinguish paper-supported patterns from agent-generated inferences.

## Failure Modes

- **Premature termination:** Stopping after a single positive property trend without trade-off or mechanism checks.
- **Confounded comparison:** Missing negative/structural controls, causing ambiguous mechanism attribution.
- **Scale mismatch:** Presenting neat-resin results as composite or application conclusions.
- **Overgeneralization:** Extending a formulation-specific result to field consensus.
- **Mechanism inversion:** Interpreting correlation (e.g., mass loss) as proof of intended cleavage without fragment/residue evidence.
- **Sustainability greenwash:** Claiming environmental benefit without evaluating degradation products, recovery yield, or process burden.

## Validity Checks

Before finalizing any plan or interpretation:
- Is there a relevant benchmark and a non-labile or trigger-free control?
- Are structural, service, degradation/recovery, and mechanism claims supported by orthogonal evidence?
- Are sample geometry, cure history, diffusion, swelling, and batch variability considered?
- Are statistical uncertainty and independent repetitions sufficient for the claimed decision?
- Are degradation products and recovery streams evaluated rather than assumed benign?
- Are conclusions limited to the tested system and not presented as universal rules?
- Are paper-verified findings clearly separated from agent-generated hypotheses?
- Are safety, toxicity, emissions, and waste concerns addressed at the design-review level?

## Provenance

- Derived from cluster 16 / subcluster 16.1: end-to-end mechanism discovery and validation.
- Synthesized from source skills: biobased-degradable-epoxy-research (10.1039_c5ra18658g), dynamic-linkage-recyclable-thermoset-exploration (10.1002_anie.202525322), biofiber-composite-flame-mechanics-exploration (10.1002_pc.27786), bio-based-epoxy-network-design (10.1039_d3cs00713h), biobased-epoxy-thermoset-exploration (10.1002_cssc.202102624), bio-derived-thermoset-composite-exploration (10.1177_20412479251313791), recyclable-flame-retardant-thermoset-exploration (10.1021_acs.macromol.4c00996), and bio-renewable-composite-research-workflow (10.1016_j.matlet.2019.126818).
- Source-specific material systems, parameters, and numerical results have been abstracted into a domain-agnostic workflow.
