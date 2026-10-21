---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-f5d04846
description: A reusable end-to-end workflow for generating falsifiable mechanistic hypotheses, designing minimum viable validation plans with orthogonal controls, and iterating through multi-scale evidence to discover and bound interfacial or materials mechanisms.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow 7"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Enable an agent to transform an observed performance gap or failure mode in a materials or interfacial system into a structured research program. The workflow generates ranked, falsifiable hypotheses; designs minimum viable validation experiments with rigorous controls; analyzes results through convergent multi-scale evidence; and iterates until mechanisms are either supported, revised, or rejected. It is designed to prevent over-claiming by enforcing mechanism–performance triangulation and explicit boundary conditions.

# When to use

Use this skill when the user asks to:

- Propose new research questions rooted in an observed failure mode, performance bottleneck, or interfacial instability.
- Design hypothesis-driven validation plans for candidate interventions such as additives, coatings, architectures, or environmental modifications.
- Convert a single study’s logic into a reusable mechanism-discovery workflow for a new system.
- Evaluate whether a proposed strategy has credible mechanistic support before full-scale testing.
- Iterate experimental plans based on orthogonal evidence from structural, spectroscopic, transport, kinetic, or modeling measurements.

Do not use this skill to provide executable laboratory protocols, safety-critical operational parameters, or domain-specific regulatory compliance instructions.

# Inputs required

Ask the user or environment for:

- **Target system:** materials, interfaces, and operating environment described at a conceptual level.
- **Observed failure modes or performance gaps:** degradation, instability, transport limitation, nonuniform growth, or coupled phenomena.
- **Candidate intervention or design motif:** if available, with its intended functional roles.
- **Available characterization and modeling capabilities:** structural, chemical, transport, kinetic, or computational tools.
- **Success criteria:** the system-level or material-level metric that must improve.
- **Constraints:** safety scope, reproducibility requirements, environmental boundaries, and institutional review status.

# Core Workflow

1. **Failure-mode mapping.** Decompose the observed problem into candidate root causes. Classify each as interfacial, bulk, transport-related, structural, or coupled. Identify dependencies between mechanisms.
   - *Decision gate:* If the failure mode cannot be defined without ambiguity, stop and request clarification.

2. **Hypothesis generation.** For each root cause, generate falsifiable mechanism hypotheses. Each must include: a mechanism claim, key assumptions, expected observables, likely failure modes, and boundary conditions.
   - *Decision gate:* If a hypothesis lacks a conceivable falsifying observation, reformulate it before proceeding.

3. **Evidence-strength ranking.** Label each hypothesis as strong, moderate, weak, or speculative based on prior evidence or first-principles reasoning. Flag assumptions that depend on untested literature transfer.

4. **Minimum viable validation design.** Design the smallest experiment set that can test the mechanism independently of overall performance alone. Define:
   - Baseline control (unmodified system).
   - Negative control (lacks the proposed functional feature).
   - Component-separated controls (isolate each proposed function).
   - Positive control (known benchmark, if available).
   - Primary mechanism metrics and secondary performance metrics.
   - Stop/go criteria for each test.
   - *Iteration gate:* If the validation plan requires full-system optimization before mechanism isolation, redesign to prioritize component-level or single-variable tests.

5. **Multi-scale evidence collection.** Gather at least two independent evidence streams per hypothesis (e.g., structural, spectroscopic, transport, kinetic, or modeling). Do not proceed to mechanism claims based on a single data type.

6. **Mechanism–performance triangulation.** Map each observation to a causal chain: structure → interfacial behavior → transport/kinetic change → system-level signature. Mark each link as supported, partial, contradicted, or untested.
   - *Decision gate:* If mechanism metrics and performance metrics diverge (e.g., performance improves without the expected structural or interfacial change), flag a secondary mechanism or confounder and return to Step 4.

7. **Hypothesis update.** Based on triangulated evidence, update each hypothesis:
   - **Supported:** advance to robustness testing.
   - **Weakened:** revise assumptions or boundary conditions and return to Step 2.
   - **Rejected:** archive the negative result, eliminate the mechanism, and return to Step 2.
   - *Stop condition:* If all hypotheses are rejected and no viable alternatives remain, stop and report the null result.

8. **Robustness and boundary testing.** Vary one stressor at a time (e.g., utilization level, throughput, environmental exposure) to define the operating window where the mechanism holds. Test system-integration compatibility before making integrated claims.
   - *Stop condition:* If the mechanism fails under modest condition changes without explanation, bound the claim and stop extrapolation.

9. **Claim formulation and bounding.** State conclusions as mechanism-supported within defined boundaries. Separate demonstrated evidence, mechanistic inference, and speculative extension.

# Output Format

When using this skill, return:

1. **Research question** tied to a specific failure mode.
2. **Failure-mode map** with coupled root causes.
3. **Ranked hypotheses** table: mechanism, evidence strength, key assumptions, expected observables, likely failure modes, discriminating tests, and boundary conditions.
4. **Minimum viable validation plan**: controls, variables, metrics, and stop/go criteria.
5. **Analysis plan**: causal evidence map, triangulation logic, required visualizations, and uncertainty treatment.
6. **Iteration plan**: decision rules for supported, weakened, or rejected outcomes.
7. **Validity and safety statement**: confounder checks, reproducibility requirements, boundary limits, and non-operational safety constraints.
8. **Provenance note**: source cluster and skill references.

# Validation Gates

- Controls must isolate each proposed function from nonspecific effects before mechanistic claims.
- At least two independent evidence streams must converge before a mechanism is accepted.
- Replicate consistency must be confirmed across independent samples or preparations.
- Integrated-system claims require component-level validation first; component-level claims must not be generalized without compatibility checks.

# Claim Boundaries

- Distinguish source-supported patterns, literature-informed analogies, and new-system inferences.
- Do not generalize from one material, formulation, or system configuration to an entire field without comparative evidence.
- Do not present single-study performance as consensus, commercial readiness, or universal transferability.
- Mechanism claims are bounded by the tested operating window and known failure modes.

# Failure Modes

- **Hypothesis failure:** The proposed mechanism does not produce the expected intermediate observables.
- **Confounding:** Uncontrolled variables (e.g., preparation history, impurities, contact quality) explain the result.
- **Overfitting:** Performance gains are real but arise from an unmeasured secondary effect rather than the proposed mechanism.
- **Transfer failure:** A mechanism valid in one component fails in the integrated system due to incompatibility.
- **Condition-specificity:** The effect disappears outside a narrow, undocumented parameter window.
- **Iteration stall:** Repeated redesigns fail to improve the causal evidence chain, suggesting a flawed root-cause map.

# Validity Checks

- **Confounding check:** Are relevant variables held constant or varied with justification? Is preparation history documented?
- **Control adequacy:** Do baseline, negative, positive, and component-separated controls test the mechanism rather than only confirming improved performance?
- **Statistical validity:** Are independent replicates, predefined success criteria, consistent failure definitions, and transparent uncertainty estimates used?
- **Mechanistic consistency:** Do structural, chemical, transport, and kinetic interpretations agree? Is there an unsupported leap from correlation to causation?
- **Reproducibility:** Do key observations recur across repeated samples and, when possible, independent batches?
- **Boundary clarity:** Are conclusions limited to the tested chemistry, geometry, and operating regime?
- **External validity:** Is generalization to new systems explicitly labeled as inferred or speculative?

# Provenance

- Derived from cluster 0, subcluster 0.0 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: 555418613cdb4075, 8ec338b590c39c64, 68b410fec94397e4, bab50c53bb74a5e4, 6e50646e83dd44a8, d25b8928cfc80d38, b1b1d0116f152c9d, c3add98475eff0e2.
- Paper-specific conclusions, numerical results, and operational parameters have been excluded per the merge definition.
