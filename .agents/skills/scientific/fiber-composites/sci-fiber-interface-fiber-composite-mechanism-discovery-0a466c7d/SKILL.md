---
name: sci-fiber-interface-fiber-composite-mechanism-discovery-0a466c7d
description: A reusable end-to-end workflow for designing research questions, controlled validations, and iterative mechanism discrimination in coupled interfacial and architectural material systems such as fiber-reinforced composites, energy-storage interfaces, and reactive scaffolds.
scienceevolve-title: "Fiber composites and battery materials · interface fiber composite mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Generate mechanism-linked research questions and non-operational experimental plans for material systems where interfacial architecture, coupled transport-reaction processes, or hierarchical phase distribution limit performance. This workflow transfers a cross-cutting scientific pattern: start from an observable anomaly or bottleneck, decompose coupled failure modes into competing hypotheses, validate structure before function through isolated controls, discriminate mechanisms using multi-modal evidence, and iterate with explicit stop conditions and claim boundaries.

# When to use

Use this skill when a user asks to:

- Design new research questions for hierarchical hosts, composite electrodes, fiber-reinforced architectures, reactive scaffolds, conversion-material interfaces, or multifunctional coatings.
- Generate hypotheses around how architecture, interfacial chemistry, or phase distribution affects transport, kinetics, retention, reversibility, or mechanical integrity.
- Plan controlled experiments that separate architecture-mediated, composition-mediated, and artifact-mediated explanations.
- Analyze multi-modal data (imaging, spectroscopy, transport diagnostics, electrochemical or mechanical response) to rank mechanisms.
- Iterate after mixed, negative, or ambiguous structure-function results.

Do not use this skill as a general-purpose synthesis protocol generator, operational manual, or source of hazardous-material parameters.

# Inputs required

Before executing the workflow, ask for or infer:

1. Target material system and the observable anomaly or bottleneck (e.g., interfacial transformation, transport limitation, mechanical degradation).
2. Candidate architectural or interfacial concept and its hypothesized function.
3. Baseline system and relevant literature benchmarks.
4. Available characterization classes (structural, chemical, kinetic, transport, mechanical) without assuming specific instruments.
5. Practical constraints: loading, format, environmental limits, safety boundaries.
6. Whether the task is hypothesis generation, study design, data interpretation, or iteration planning.

If key inputs are missing, state assumptions explicitly and keep outputs at a non-operational research-design level.

# Core Workflow

An ordered, end-to-end route from observation to bounded conclusion. At each phase, apply the decision gate before proceeding.

**Phase 1: Localize the anomaly**
- Start from a reproducible observation (morphological change, performance drift, transport gap) rather than a target performance number.
- Localize the phenomenon to a specific interface, architectural feature, or coupled process zone.
- *Decision gate:* Is the observation reproducible and spatially localized? If no, stop and improve observational resolution.

**Phase 2: Decompose coupled failure modes**
- Separate the bottleneck into interacting chemical, mechanical, transport, and interfacial contributions.
- Identify primary versus secondary failure modes and incompatible requirements (e.g., retention vs. transport, adhesion vs. processability).
- *Decision gate:* Are the proposed mechanisms separable in principle with available diagnostics? If no, treat the system as a single coupled problem and design for simultaneous testing.

**Phase 3: Generate competing hypotheses**
- Produce at least three competing hypotheses plus a null/artifact hypothesis.
- For each hypothesis define: concise causal claim, evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observations across multiple modalities, likely failure modes, and boundary conditions.
- *Decision gate:* Do the hypotheses yield mutually distinct predictions? If no, refine or decompose until they are discriminable.

**Phase 4: Design a control-centric material matrix**
- Build a minimal matrix that isolates the architectural or interfacial variable.
- Mandatory controls: baseline (conventional), negative (absence of key feature), component-isolation (single-function variants), inert-architecture (structure without key chemistry), and practical-stress (relevant loading/format).
- Define mechanism-linked metrics: structural verification, distribution evidence, kinetic/transport diagnostic, and functional endpoint.
- *Decision gate:* Does the matrix independently control the intended variable while holding composition and processing comparable? If no, redesign.

**Phase 5: Minimum viable validation (MVV)**
- Verify architecture, morphology, or interfacial structure before interpreting any performance data.
- Compare the integrated concept against baseline and component-isolation controls under matched conditions.
- Collect one direct mechanism proxy (e.g., continuity, accessibility, adsorption, impedance component) in addition to aggregate performance.
- *Decision gate:* Does structural/distribution evidence align with the functional trend? If contradictory or ambiguous, halt mechanism claims and add diagnostics.

**Phase 6: Multi-modal evidence integration**
- Analyze evidence in ordered layers: morphology → composition → chemical state → transport/kinetics → performance.
- Map each layer to the mechanism chain (design feature → local interaction → intermediate property → device behavior).
- Separate direct observation from model-supported inference and from analogy-based extrapolation.
- *Decision gate:* Is the full mechanism chain supported across layers? If a link is missing, flag it as provisional.

**Phase 7: Mechanism discrimination and claim bounding**
- Rank hypotheses by consistency with the integrated evidence.
- Exclude hypotheses falsified by controls; downgrade hypotheses with missing links.
- Bound all conclusions to the tested material class, architecture, loading regime, and measurement conditions.
- *Decision gate:* Is the leading hypothesis uniquely supported over alternatives? If no, return to Phase 3 with a refined discriminator.

**Phase 8: Escalation or iteration**
- *If supported:* Escalate to strong validation by varying architecture, practical constraints, or boundary conditions; test transferability to related systems only as extrapolation.
- *If weak/ambiguous:* Modify one design variable tied to the weakest assumption and rerun MVV (Phase 5).
- *If contradicted:* Reject the hypothesis, record the boundary condition, and return to Phase 3.
- *Stop conditions:*
  - Integrated design fails to outperform single-function controls.
  - Mechanism readouts contradict the proposed model.
  - Gains disappear under practical-stress testing.
  - Safety, compliance, or reproducibility constraints prevent meaningful interpretation.
  - Additional changes no longer test the original mechanism.

# Output Format

When using this skill, return:

1. **Research question** — one mechanism-linked question naming the system, coupled failure modes, and practical constraint.
2. **Hypothesis table** — competing hypotheses with evidence strength, assumptions, predicted observations, failure modes, and boundaries.
3. **Study design** — material/architecture matrix, controls, metrics, MVV criteria, and stop conditions at a non-operational level.
4. **Analysis plan** — layered evidence integration, mechanism-chain mapping, and criteria for supporting or rejecting each hypothesis.
5. **Iteration roadmap** — decision rules for continue, redesign, narrow, or stop based on possible result patterns.
6. **Validity and safety notes** — confounders, reproducibility requirements, claim boundaries, and domain-specific safety boundaries.

# Validation Gates

- **Structural precedence:** Architecture or interfacial morphology must be verified before functional interpretation.
- **Control necessity:** No mechanism claim is permitted without matched baseline and at least one component-isolation control.
- **Discrimination requirement:** A mechanism is only accepted when competing explanations are actively excluded by evidence, not just when one hypothesis fits.
- **Practical-stress filter:** Claims of practical relevance must include at least one test beyond idealized conditions.
- **Trade-off transparency:** Report gains and losses together (e.g., retention vs. transport, mechanical integrity vs. functional output).

# Claim Boundaries

- Limit mechanism claims to the tested material class, architecture, loading regime, and environmental conditions.
- Label paper-derived evidence, new-system evidence, and agent-inferred extrapolation separately.
- Do not present single-study results as field-wide consensus or universal optima.
- Distinguish direct observation, control-supported inference, model-supported inference, and speculative extension.
- Avoid generalizing from simplified model systems to realistic reinforcement or device architectures without intermediate validation.

# Failure Modes

- **Observation failure:** The anomaly cannot be localized or reproduced; likely due to measurement artifact, batch variability, or uncontrolled environmental exposure.
- **Confounding failure:** The intended architectural variable covaries with composition, processing, or loading; the effect cannot be isolated.
- **Mechanism ambiguity:** Multiple hypotheses remain consistent with evidence because controls are insufficient or diagnostics are missing.
- **Trade-off collapse:** The integrated solution improves one function while degrading another beyond acceptable limits.
- **Scale mismatch:** Mechanism-supported gains at small scale or idealized conditions disappear under practical stress or realistic architecture.
- **Inference overreach:** Conclusions about mechanism or generality exceed what the evidence layer supports.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** Does the intended variable change independently of composition, processing, and geometry?
- **Controls:** Are baseline, negative, component-isolation, inert-architecture, and practical-stress controls included?
- **Reproducibility:** Are independent preparations, repeated measurements, and variability reporting planned?
- **Measurement validity:** Do structural, distribution, kinetic, and functional measurements directly test the claimed mechanism?
- **Statistical validity:** Are uncertainty estimates, effect-size comparisons, and matched comparisons used instead of best-case curves?
- **Failure reporting:** Are negative, null, and ambiguous results included in the interpretation?
- **Boundary discipline:** Are conclusions explicitly scoped to tested conditions, and are extrapolations labeled as such?

# Provenance

- Derived from cluster 67, subcluster 67.0: observable-driven mechanism discovery and validation.
- Synthesized from source skills: hierarchical-host-material-research (10.1039_c3nr04532c), 3d-interfacial-thermal-network-research (fiber__10.1016_j.compscitech.2022.109800), polysulfide-barrier-separator-research (10.1016_j.cej.2018.07.063), multifunctional-binder-battery-research (10.1016_j.cej.2020.124981), li-s-battery-dual-network-research-design (10.1021_acsenergylett.3c01038), coupled-structural-supercapacitor-research (fiber__10.1002_adfm.202511334), ceramic-melt-infiltration-research-design (fiber__10.3390_jcs5070186), zinc-air-battery-interface-mechanism-exploration (1706.05929).
- Paper-specific conclusions, numerical results, and operational protocols have been excluded per merge requirements.
