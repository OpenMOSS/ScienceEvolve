---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-de150075
description: An end-to-end workflow for discovering, discriminating, and validating mechanisms in complex coupled systems through falsifiable hypotheses, hierarchical controls, and orthogonal evidence.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 15"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents through an end-to-end workflow to discover, discriminate, and validate mechanisms in complex coupled systems. The workflow transforms observable performance bottlenecks into falsifiable hypotheses, designs minimal validation studies with hierarchical controls, and iterates based on orthogonal evidence rather than single-metric optimization.

# When to use

Use this skill when the user asks to:
- Propose new research questions for systems where physical, chemical, transport, and mechanical processes are coupled.
- Generate mechanism-linked hypotheses and rank them by evidence strength.
- Design non-operational validation plans with explicit controls, stop conditions, and iteration logic.
- Analyze whether a proposed design change addresses a real bottleneck or creates hidden trade-offs.
- Convert component-level observations into system-level mechanism claims.

Do not use this skill for operational laboratory protocols, clinical advice, biomedical recommendations, or high-risk experimental execution instructions.

# Inputs required

Before generating a research plan, identify:
- Target system and dominant failure mode or bottleneck.
- Candidate design lever or component modification concept.
- Baseline architecture for comparison.
- Available evidence: literature summaries, preliminary data, known properties, or analogies.
- Intended validation scope: conceptual design, mechanism proxy, subsystem comparison, or system-level translation.
- Constraints affecting transferability: operating regime, format, environmental context, safety boundaries, and available characterization capabilities.

If critical inputs are missing, state assumptions explicitly and label downstream hypotheses as provisional.

# Core Workflow

Follow this ordered route from bottleneck framing to mechanism validation. Pass each decision gate before advancing; return to the indicated step if a gate fails.

1. **Frame the bottleneck.**  
   Define the system-level failure mode in causal terms: what migrates, degrades, detaches, blocks transport, or limits utilization? Decompose the bottleneck into coupled sub-functions (e.g., retention, transport, conversion, mechanical stability, interfacial integrity).

2. **Map design levers to candidate mechanisms.**  
   Identify a required system component that can be redesigned without adding unnecessary auxiliary mass. For each candidate lever, specify the proposed causal path from design change to observable signature. Predict how excess modification could harm performance through aggregation, byproduct formation, pore blockage, corrosion, or loss of contact.

3. **Generate and rank hypotheses.**  
   Build a conceptual design series (baseline, low, intermediate, and high modification) without assuming more modification is always better. Attach to each variant: mechanistic rationale, key assumption, predicted positive and negative signals, most likely failure mode, required control, minimum viable validation, and stop condition. Assign evidence strength: speculative, weak, moderate, strong, or robust.  
   - *Decision gate:* If no hypothesis is falsifiable with available resources, stop and reformulate the bottleneck (return to Step 1).

4. **Design minimal validation with hierarchical controls.**  
   Define: baseline; negative control; ablation control (remove one proposed function); architecture or chemistry control (isolate structure from chemistry); benchmark control; and, where relevant, system-level control. Specify variables at the concept level only. Plan a measurement package spanning at least two independent evidence categories (e.g., structure/identity, mechanism proxy, performance, post-use durability).  
   - *Decision gate:* If controls cannot isolate the intended mechanism from processing artifacts or morphology effects, redesign controls before proceeding (repeat Step 4).

5. **Collect orthogonal evidence.**  
   Execute the validation ladder:  
   a. Confirm intended architecture or identity formed.  
   b. Measure one mechanism-specific proxy.  
   c. Compare matched system-level performance against baseline.  
   d. Perform post-use diagnostics on a representative subset.  
   - *Decision gate:* If the architecture/identity check fails, halt mechanism interpretation and return to Step 2.

6. **Analyze the causal chain.**  
   Connect design change → structural signature → property change → performance outcome → durability evidence. Separate mechanism from artifacts (loading differences, morphology changes, measurement bias, non-independent repeats). Require convergence across at least two independent evidence streams before attributing performance to a mechanism. Classify the result as: mechanism-supported, performance-only, mechanism-supported-but-performance-limited, confounded, or negative.

7. **Evaluate trade-offs and boundaries.**  
   Explicitly interpret trade-offs (e.g., improved retention but worsened transport). Check whether the mechanism persists under more demanding but safe operating contexts. Ensure the intervention does not create a larger penalty than the bottleneck it solves.  
   - *Decision gate:* If trade-offs are unacceptable or translation to the target context fails, stop or pivot.

8. **Iterate or terminate.**  
   - *If supported:* Narrow the design axis, add stronger controls, and test robustness under safe stress conditions.  
   - *If performance improves but mechanism is unclear:* Add mass-matched or morphology-matched controls and spatial diagnostics; label as performance-supported but mechanism-ambiguous.  
   - *If mechanism improves but performance does not:* Identify the new limiting bottleneck and introduce a second design axis without removing the original function.  
   - *If negative or confounded:* Update the hypothesis card, target the weakest link, or terminate.  
   - *Stop conditions:* Candidate fails against matched controls; improvement lacks mechanism support; evidence contradicts the hypothesis; results depend on uncontrolled fabrication differences; safety or reproducibility concerns dominate.

# Output Format

When using this skill, return:

1. **Research question** — One clear question tied to a specific failure mode and design lever.
2. **Mechanism map** — Design change → expected structural/property/system signals → likely trade-offs.
3. **Hypothesis table** — For each variant: evidence strength, key assumption, predicted positive/negative signals, most likely failure mode, required controls, minimum viable validation, and stop condition.
4. **Experimental design plan** — Baseline, negative controls, ablation/architecture/benchmark controls, concept-level variables, measurement package, and stop conditions.
5. **Analysis plan** — How to construct the causal chain, separate mechanism from artifacts, require orthogonal evidence, interpret trade-offs, and classify evidence strength.
6. **Iteration plan** — Update rules for supported, partial, confounded, and negative outcomes.
7. **Validity and boundary statement** — Confounders, reproducibility checks, extrapolation limits, and what remains inferred versus verified.

# Validation Gates

Before promoting a claim to the next evidence level, confirm:
- The intended architecture or identity has been verified.
- The mechanism proxy changed in the predicted direction.
- System-level performance improved against matched controls, not only weak baselines.
- Trade-offs remain acceptable for the target application context.
- Results are consistent across independent samples or batches.
- System-level or practical-context validation has been attempted before claiming deployment relevance.
- Every claim is labeled with its evidence strength.

# Claim Boundaries

- Distinguish direct evidence from inference, analogy, and extrapolation.
- Do not treat single-study observations as field-wide consensus.
- Label conclusions as demonstrated, plausible, or speculative based on evidence strength.
- State operating-context boundaries (regime, format, environment) where the claim may not hold.
- Avoid unsupported application, commercialization, or deployment claims.

# Failure Modes

- Intended architecture or identity fails to form.
- Mechanism proxy improves but system performance does not (hidden bottleneck).
- System performance improves but mechanism proxy does not (confound or artifact).
- Combined design matches only the best single-factor control (additive, not synergistic).
- Improvement disappears under stronger controls or matched comparisons.
- Excess modification causes penalties such as aggregation, blockage, or resistance increase.
- Results are irreproducible across independent preparations.
- Subsystem-level advantages fail to translate to full-system or practical conditions.

# Validity Checks

Before finalizing conclusions, verify:
- **Confounding:** Mass, surface area, loading, thickness, porosity, protocol differences, and processing artifacts are controlled or reported.
- **Reproducibility:** Independent samples, batch effects, and measurement variability are addressed.
- **Statistical validity:** Primary and secondary metrics are predefined; best-case-only reporting is avoided; uncertainty is quantified.
- **Mechanistic consistency:** Structural, chemical, kinetic, and durability evidence converge on the same explanation.
- **Alternative explanations:** Side reactions, blocked pathways, poor contact, and measurement bias are considered.
- **External validity:** Laboratory demonstrations are distinguished from practical deployment contexts.

# Provenance

- Synthesized from cluster 4.1 (observable-driven mechanism discovery and validation).
- Source skills: 10.3390_batteries9110525; 10.1002_ente.202000736; 10.1016_j.jelechem.2024.118502; 10.1021_acsami.5b08887; fiber__10.1016_j.compositesb.2026.113447; 10.1002_advs.202201823; 10.1016_j.jechem.2020.03.014; 10.1007_s10008-017-3629-9.
