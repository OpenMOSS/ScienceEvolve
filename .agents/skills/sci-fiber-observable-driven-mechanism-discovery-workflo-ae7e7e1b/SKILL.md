---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-ae7e7e1b
description: A reusable end-to-end workflow for generating falsifiable hypotheses and validation plans to discover structure-property-function mechanisms in materials systems with interfacial or functional performance bottlenecks.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 22"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to design research programs that discover and validate structure–property–function mechanisms in material systems where performance is limited by interfacial, morphological, or chemical bottlenecks. It guides an agent to move from an application tension to falsifiable causal hypotheses, through controlled minimal validation, to evidence-based iteration—without treating any single study as field consensus.

# When to use

- Use when the task is to propose new research questions, hypotheses, or validation plans for material systems such as polymer composites, functional fibers, coatings, catalysts, or blended membranes.
- Use when performance is believed to be limited by a mechanism that can be probed through structure, interface, or composition changes.
- Do not use for clinical recommendations, product certification, operational laboratory recipes, or as a substitute for domain-specific safety review.

# Inputs required

- Target material system and architecture (e.g., matrix, reinforcement, additive, substrate, or support).
- Identified performance bottleneck and the suspected limiting mechanism.
- Candidate design levers (chemical, morphological, or interfacial) and their expected causal pathways.
- Existing evidence map: what is directly verified, what is inferred from related systems, and what is speculative.
- Constraints: safety boundaries, regulatory scope, resource limits, and whether the output must remain non-operational.
- Decision boundary: screening concept, preclinical material study, or mechanistic proof-of-concept.

# Core Workflow

1. **Frame the bottleneck and mechanism gap**
   - Define the application tension as a trade-off between competing properties or constraints.
   - Translate the tension into a falsifiable mechanism hypothesis: identify the structural or interfacial mediator that limits the target function.
   - Map the property chain from composition/process → structure → interface → function, noting where the chain is broken or unverified.
   - *Gate 1 — Stop/Refine*: If the bottleneck cannot be expressed as a testable mediator with a measurable proxy, reformulate or stop.

2. **Generate causal hypotheses**
   - For each candidate design lever, state a causal chain: lever → expected structural/interfacial change → expected observable shift → expected property outcome.
   - Label evidence strength as **strong**, **moderate**, or **weak** based on direct prior evidence, mechanistic plausibility, and system similarity.
   - List key assumptions and likely failure modes for each hypothesis.
   - Define minimal validation: the smallest control set and endpoint set that could falsify the hypothesis.
   - *Gate 2 — Filter*: Discard hypotheses that lack a distinct mechanism proxy or that cannot be falsified with available resources.

3. **Design minimal viable validation**
   - Establish baseline and control groups:
     - **Negative control**: absence of the design lever or a non-functional analogue.
     - **Mechanism-isolation control**: variants that separate the lever from confounding effects (e.g., additive-only without reinforcement, unmodified matrix).
     - **Positive/benchmark control**: a known effective comparator when available.
   - Select independent variables tied to the causal chain (e.g., presence/absence of lever, gradient of modification).
   - Select dependent variables:
     - **Primary**: target property or function.
     - **Secondary**: mechanism proxies (morphology, localization, crystallinity, wetting, kinetic signature).
     - **Trade-off monitors**: properties that may degrade as the target improves.
   - Predefine stop conditions: controls fail, no mechanism evidence, unacceptable trade-off, high irreproducibility, or safety boundary violation.
   - *Gate 3 — Readiness*: Do not proceed if the plan cannot distinguish the proposed mechanism from simpler explanations.

4. **Collect and audit evidence**
   - Verify data integrity: sample identity, processing match, measurement units, replicate status, and baseline consistency.
   - Confirm structural or interfacial changes (e.g., morphology, chemistry, dispersion, localization) before interpreting functional outcomes.
   - Separate raw observation from mechanistic interpretation in all records.
   - *Gate 4 — Quality*: If controls behave implausibly, data are incomplete, or batch variability dominates, halt analysis and redesign.

5. **Triangulate mechanism and map trade-offs**
   - Require convergence from at least two independent evidence streams before attributing causality (e.g., microscopy + mechanical data; spectroscopy + kinetics).
   - Compare the test group against all controls to isolate the lever effect.
   - Evaluate trade-offs explicitly: report gains alongside any losses in stiffness, toughness, stability, processability, or safety.
   - Classify each hypothesis as:
     - **Supported**: consistent across primary and secondary endpoints with plausible controls.
     - **Partially supported**: some endpoints align but key mechanism evidence is missing.
     - **Rejected**: data contradict the predicted causal chain.
     - **Unresolved**: high variability or ambiguous controls prevent classification.
   - *Gate 5 — Claim discipline*: Do not advance a mechanism claim if only one endpoint changes without corroboration.

6. **Iterate, narrow, or stop**
   - **If supported**: Advance to boundary testing (different substrates, environmental exposure, long-term durability) or scale-relevant prototyping.
   - **If partially supported**: Diagnose the weakest link in the causal chain (e.g., localization without morphology, morphology without mechanics) and redesign the next cycle to target that link.
   - **If rejected**: Abandon the lever or reformulate the mechanism hypothesis; consider alternative levers from the initial map.
   - **If unresolved**: Investigate confounders (dispersion, batch variation, measurement artifacts) before repeating.
   - **Stop conditions**: Unacceptable safety risk, irreproducible results across independent batches, dominant confounding that cannot be controlled, or violation of claim boundaries (e.g., extrapolating to clinical or structural certification).

# Output Format

When using this skill, return:

1. **Research question**: One sentence framing the application tension and target mechanism.
2. **Gap and mechanism framing**: Known evidence versus new inference, with the property chain mapped.
3. **Hypotheses table**: Each hypothesis with causal chain, evidence strength, key assumptions, likely failure modes, and minimal validation.
4. **Minimal viable validation plan**: Groups, controls, variables, primary/secondary endpoints, trade-off monitors, and stop conditions.
5. **Analysis plan**: Data-quality checks, triangulation criteria, trade-off mapping, visualization guidance, and decision rules for hypothesis classification.
6. **Iteration plan**: Actions for supported, partial, rejected, and unresolved outcomes.
7. **Validity and safety notes**: Confounders, reproducibility requirements, boundary conditions, and non-operational safety guardrails.

# Validation Gates

- **Gate 1 — Mechanism falsifiability**: The bottleneck must be expressible as a testable mediator; otherwise reformulate.
- **Gate 2 — Hypothesis filter**: Each hypothesis must have a distinct mechanism proxy and a defined stop condition.
- **Gate 3 — Experimental discrimination**: The design must separate the proposed mechanism from simpler explanations via controls.
- **Gate 4 — Data quality**: Controls must behave plausibly and data must be complete before interpretation.
- **Gate 5 — Mechanism triangulation**: Claims require at least two independent converging evidence streams.

# Claim Boundaries

- Lab-scale material results do not establish clinical efficacy, product certification, long-term environmental safety, or field-scale performance.
- Conclusions apply to the tested material family and conditions; do not generalize to all composites, fibers, catalysts, or coatings without additional evidence.
- Distinguish "demonstrated in this system," "supported by related literature," and "speculative inference" in every claim.
- Do not present a single successful formulation as proof of a field-wide principle.

# Failure Modes

- **Control failure**: Baseline or negative controls behave unexpectedly, invalidating causal attribution.
- **Confounding dominance**: Uncontrolled variables (processing history, batch variation, geometry, environment) explain the observed effect.
- **Single-endpoint over-interpretation**: Inferring mechanism from one measurement without corroboration.
- **Trade-off blindness**: Advancing a candidate because one property improved while ignoring unacceptable degradation of another.
- **Evidence misattribution**: Treating adsorption, surface contamination, or instrumental artifact as true mechanism evidence.
- **Scope creep**: Extrapolating from screening data to application certification or universal mechanism.

# Validity Checks

- **Confounding**: Check that composition, processing, measurement sequence, and environmental exposure do not vary unintentionally across groups.
- **Control validity**: Negative, mechanism-isolation, and benchmark controls must be plausible and internally consistent.
- **Replication**: Require independent batches or preparations and report variability; avoid claims from single observations.
- **Statistical validity**: Define thresholds before testing; report effect sizes, uncertainty, and model assumptions.
- **Mechanism validity**: Do not infer interfacial or molecular mechanism from macroscopic properties alone.
- **Representativeness**: Distinguish screening conditions from real-service or real-wastewater environments.
- **Boundary awareness**: Keep claims within the tested material class, loading mode, and environmental window.

# Provenance

- Synthesized from cluster 1.1 (subcluster 1.1), workflow archetype "observable-driven mechanism discovery and validation".
- Derived from source skills: `biodegradable-antibacterial-nanofiber-exploration`, `composite-interface-interlocking-research`, `supported-nanocatalyst-pollutant-reduction-exploration`, `recycled-rubber-composite-research-design`, `hydrophilic-graft-sizing-research`, `pi-fiber-dyeing-research-exploration`, `dynamic-epoxy-network-research-design`, `thermoplastic-composite-interface-exploration`.
- Source-specific material systems, parameters, and conclusions have been abstracted; only the shared workflow route is retained.
