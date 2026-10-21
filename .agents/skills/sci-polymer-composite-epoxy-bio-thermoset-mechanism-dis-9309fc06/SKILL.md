---
name: sci-polymer-composite-epoxy-bio-thermoset-mechanism-dis-9309fc06
description: A reusable end-to-end workflow for designing mechanism-driven materials research in composites, thermosets, bio-based polymers, and dynamic networks, emphasizing hypothesis generation, controlled multi-modal validation, and iterative claim bounding.
scienceevolve-title: "Polymer composites and vitrimers · composite epoxy bio thermoset mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Guide agents in translating a materials performance gap into a rigorous, non-operational research program for composite, thermoset, bio-based, or dynamic polymer systems. The workflow emphasizes observable-driven mechanism discovery, multi-modal evidence triangulation, and iterative hypothesis refinement without reproducing source-specific recipes, parameters, or paper conclusions.

# When to use

Use this skill when the user asks to:
- Formulate new research questions about reinforcement, modification, aging, self-healing, upcycling, or interfacial design in polymer-matrix composites, thermosets, or dynamic networks.
- Generate mechanism-based hypotheses for how a microstructural feature (interface, dispersion, network architecture, surface chemistry, phase morphology) could alter macroscopic properties.
- Design controlled experiments with explicit controls, multi-modal endpoints, and pre-registered stop conditions.
- Interpret conflicting indicators, non-monotonic trends, or trade-offs between mechanical, thermal, barrier, durability, or recyclability properties.
- Iterate a research plan based on evidence without resorting to selective data emphasis or unsupported extrapolation.

Do not use this skill for operational laboratory execution, clinical decisions, safety-critical certification, or generating hazardous procedural instructions.

# Inputs required

Before producing a research plan, collect or infer:
- **Target system**: matrix family, reinforcement or filler class, modifier type, and intended application context.
- **Performance gap or failure mode**: the service-relevant deficiency (e.g., weak adhesion, thermal degradation, barrier loss, crack propagation, poor recyclability) and the function to be restored or improved.
- **Candidate mechanism or modification**: the proposed structural or chemical intervention and its expected causal pathway.
- **Available characterization access**: independent measurement streams such as chemical, mechanical, thermal, morphological, transport, or electrochemical methods.
- **Constraints**: safety, environmental, regulatory, budget, and non-operational boundaries.
- **Evidence basis**: whether the proposal is supported by direct literature, analogous systems, mechanistic plausibility, or speculation.

If key inputs are missing, state assumptions explicitly and propose a minimum information set before experimental commitments.

# Core Workflow

1. **Frame the Performance Contradiction**  
   Identify the service-relevant failure mode or property gap. Define which function must be restored or improved and why current materials are insufficient. Convert the failure mode into a mechanism question: which structural or chemical feature initiates or propagates the deficiency, and what intervention could redirect it?

2. **Map Structure-to-Property Hypotheses**  
   Link candidate microstructural features (interfaces, dispersions, network architectures, surface chemistries, reversible bonds, phase morphologies) to measurable macroscopic outcomes. Generate falsifiable, mechanism-based hypotheses ranked by evidence strength. For each hypothesis, state the claim, expected causal pathway, key assumptions, and likely failure modes.

3. **Design Staged Validation**  
   Establish comparison groups: unmodified baseline, process blank, mechanism-isolation control, and candidate system. Vary one dominant factor at a time. Define primary and secondary endpoints, select at least two independent multi-modal measurement streams, and pre-register stop conditions before any testing commitment.

4. **Gate A: Control & Replication Check**  
   Verify that baseline and mechanism-isolation controls behave as expected and that replicate variability is smaller than the anticipated effect size. If controls fail, noise dominates signal, or safety prerequisites are unmet, stop and redesign before interpreting candidate results.

5. **Execute Multi-Modal Triangulation**  
   Collect evidence across independent domains (e.g., chemical, mechanical, thermal, morphological, transport). Do not rely on a single metric to confirm a mechanism. Pair every performance metric with a mechanism-checking metric.

6. **Discriminate Mechanism vs. Artifact**  
   Compare candidate systems against all controls. Require convergent support across at least two independent evidence streams to support a mechanism claim. If indicators conflict, treat the conflict as a signal to revise the mechanism model rather than selecting favorable data.

7. **Gate B: Trade-off & Robustness Evaluation**  
   Assess whether primary-endpoint gains cause unacceptable secondary-endpoint losses (e.g., stiffness vs. toughness, barrier recovery vs. mechanical retention, recyclability vs. environmental stability). If trade-offs exceed predefined design margins, return to compatibility, loading, or network-design hypotheses.

8. **Iterate or Escalate**  
   - **Support**: If the mechanism is supported and robust, escalate to more demanding environments, larger scales, repeated cycles, or composite integration.  
   - **Conflict**: If evidence is mixed, design a diagnostic experiment targeting the specific discrepancy.  
   - **Null**: If the candidate fails against controls after replication, reject or deprioritize the hypothesis and return to Step 2.  
   - **Stop**: Halt if repeated iterations cannot distinguish mechanism from processing artifacts, if variability remains uncontrolled, or if ethical/safety boundaries are breached.

9. **Bound Claims & Extrapolation Limits**  
   Explicitly state the matrix family, reinforcement class, processing category, environment, damage or aging mode, and scale to which conclusions apply. Separate paper-supported methodological patterns from agent-inferred extensions to new systems.

# Output Format

When using this skill, produce:
1. **Research question and scope**: a concise, testable question tied to the target system and failure mode.
2. **Gap analysis and mechanism map**: the performance contradiction, proposed intervention, and expected causal pathway.
3. **Ranked hypotheses table**: claim, mechanism, evidence strength, key assumptions, likely failure modes, and minimal validation test for each hypothesis.
4. **Experimental design**: controls, variables, primary/secondary endpoints, multi-modal measurement plan, and pre-registered stop conditions.
5. **Analysis plan**: triangulation strategy, normalization approach, decision rules for support/conflict/null, and visualization logic.
6. **Iteration plan**: update rules for each dominant result pattern (support, conflict, null, ambiguous).
7. **Validity and boundary statement**: confounders, reproducibility needs, extrapolation limits, and non-operational safety/ethics constraints.

# Validation Gates

- **Gate A — Control & Replication Validity**: Baseline and mechanism-isolation controls must show expected behavior. Replicate variance must be quantified and smaller than the effect size of interest. Document raw data and exclusion criteria.
- **Gate B — Mechanistic Triangulation**: A mechanism claim is gated by convergent evidence from at least two independent measurement domains. Single-endpoint improvements are insufficient for mechanism confirmation.
- **Gate C — Trade-off Acceptance**: Primary-endpoint gains must not violate predefined secondary-endpoint limits without explicit design-margin justification. If violated, the formulation does not pass escalation.
- **Gate D — Circularity/Recovery** (when applicable): Recovery claims require both property retention and mass-balance evidence across cycles; simple dissolution, swelling, or physical mixing does not satisfy this gate.

# Claim Boundaries

- Limit claims to the tested material family, processing category, reinforcement class, and environmental window.
- Distinguish paper-supported methodological patterns from agent-inferred extensions to new systems.
- Do not present exploratory results as field consensus, regulatory standards, or safety-critical certifications.
- Avoid extrapolating accelerated aging, laboratory healing, or upcycling data to real service life without an explicit validation bridge.
- Maintain non-operational boundaries: do not provide executable synthesis recipes, hazardous processing parameters, or unreviewed safety protocols.

# Failure Modes

- **Mechanism misattribution**: Attributing performance changes to the proposed chemical/structural mechanism when they actually stem from processing artifacts, physical filler effects, or uncontrolled side reactions.
- **Over-modification**: Excessive loading, activation, or modification degrades the matrix, reinforcement, or network integrity.
- **Confounded recovery**: Healing, durability, or upcycling gains are explained by natural aging, moisture, continued curing, or environmental exposure rather than the designed mechanism.
- **Non-monotonic neglect**: Missing optimal windows or onset of degradation because the design space assumes a linear dose-response.
- **Single-metric overreach**: Drawing strong conclusions from one endpoint without corroborating structural, chemical, or morphological evidence.
- **Unsafe extrapolation**: Inferring structural safety, regulatory compliance, or environmental benefit from unvalidated laboratory data.

# Validity Checks

- **Confounding audit**: Review sample geometry, curing history, moisture content, dispersion uniformity, void fraction, orientation, and batch differences.
- **Measurement validity**: Confirm instrument calibration, appropriate fitting models, representative sampling, and blinded scoring where applicable.
- **Statistical rigor**: Pre-register primary endpoints, report uncertainty intervals, use adequate replication, and avoid interpreting noise as meaningful trends.
- **Reproducibility**: Document material provenance, preparation logic at a conceptual level, analysis pipelines, and reasons for data exclusion.
- **Mechanistic sufficiency**: Ensure that performance changes are accompanied by structure-property or chemistry-property evidence consistent with the hypothesis.

# Provenance

- Synthesized from cluster 12.0, subcluster 12.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: 10.3390_ma14071725, 10.30955_gnj.06356, 10.1177_0021998318816784, 10.54097_hset.v62i.10679, 10.33019_jrfi.v6i01.6845, 10.1177_0040517520971361, 10.31635_ccschem.025.202505923, 10.1016_j.radphyschem.2019.108663.
