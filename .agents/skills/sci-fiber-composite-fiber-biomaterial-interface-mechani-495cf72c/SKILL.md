---
name: sci-fiber-composite-fiber-biomaterial-interface-mechani-495cf72c
description: End-to-end workflow for discovering and validating interface-mediated mechanisms in composite, fiber-reinforced, and biomaterial systems through hypothesis-driven experiments, strong controls, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · composite fiber biomaterial interface mechanism discovery"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform a material-performance observation into a structured, mechanism-first research plan that discriminates interface-mediated or interphase-mediated effects from bulk, architectural, or confounding effects. It guides hypothesis generation, minimal validation design, multi-scale analysis, and iterative refinement without prescribing system-specific recipes, operational parameters, or fabrication protocols.

# When to use

Trigger when the user needs to plan or interpret research on composite, fiber-reinforced, scaffold, layered, or asymmetric biomaterial systems where performance is suspected to depend on interfaces, interphases, local transition zones, coupled microenvironment modulation, or architecture-specific weak paths. Use for generating new questions, designing strong controls, mapping mechanisms, discriminating bulk from local effects, or bounding claims after experiments.

# Inputs required

- Target material system and primary and secondary phases or modules.
- Performance gap or observation to explain (e.g., strength, toughness, durability, biological response).
- Suspected bottleneck (interface, interphase, microenvironment, architectural weak path).
- Available evidence types and measurement access.
- Constraints such as scale, model class, safety review boundaries, and resource limits.

If key inputs are missing, return a structured clarification list before proposing a detailed design.

# Core Workflow

1. **Frame the performance gap.** Define the macroscopic observation and identify the local bottleneck most likely to mediate it.
2. **Generate competing hypotheses.** Produce at least three falsifiable hypotheses spanning distinct mechanisms (e.g., local interface modification, bulk matrix modification, dominant failure-mode shift, interaction or boundary effect). For each, record evidence strength, key assumptions, the discriminating measurement, and the most likely failure mode.
3. **Design minimal discriminating validation.** Build the smallest plan that can separate the leading hypotheses. Specify comparison groups (baseline, single-phase, hybrid, mechanism-positive or mechanism-negative, process-matched sham), independent variables, mediator readouts, outcome metrics, and predefined stop conditions.
   - **Decision Gate A — Discriminability:** If the design cannot isolate interface or interphase effects from bulk or confounding effects, redesign controls or metrics before proceeding.
4. **Collect multi-scale evidence.** Gather full response curves, failure mode classifications, interfacial or microstructural markers, and intermediate mechanism readouts. Avoid relying on single scalar metrics before inspecting staged behavior.
5. **Analyze by mechanistic stages.** Segment responses into regimes. Map each stage to candidate mechanisms. Compare all control groups. Separate peak, residual, and energy-like conclusions. Identify confounders.
   - **Decision Gate B — Mechanistic coherence:** If mechanism readouts and performance metrics do not align, revisit hypothesis ranking and consider alternative mechanisms.
6. **Update or exclude hypotheses.** Label each hypothesis as supported, weakened, split, or replaced. If the failure mode changed, reinterpret all scalar metrics before continuing.
   - **Iteration/Stop:** If a mechanism is isolated with acceptable uncertainty, proceed to validation. If uncertainty remains high, return to step 3 with revised hypotheses. Stop if additional tests would repeat the same mechanism without reducing uncertainty.
7. **Validate independently.** Test the surviving mechanism on conditions not used for calibration (different geometry, scale, orientation, or environment). Perform robustness checks.
   - **Decision Gate C — Generalizability:** If the mechanism fails under independent or boundary conditions, tightly bound the claim or return to iteration.
8. **Bound claims and archive failure modes.** State what is directly supported, what is inferred, and where extrapolation is unsafe. Document residual failure modes and boundary limits.

# Output Format

Return:

1. **Research question(s)** — concise, mechanism-focused question(s).
2. **Ranked hypothesis table** — hypothesis, evidence strength, key assumptions, discriminating measurement, likely failure mode, and boundary.
3. **Study design summary** — comparison groups, factors, controls, response metrics, minimal viable validation, and stop conditions.
4. **Analysis plan** — curve or response segmentation, metric interpretation rules, mechanism mapping, and confounder checks.
5. **Iteration plan** — rules for updating hypotheses and models under positive, negative, ambiguous, or safety-limited results.
6. **Validity and boundary statement** — what is directly supported, what is inferred, extrapolation limits, and residual risks.

# Validation Gates

- **Mechanism specificity:** The design must separate interface or interphase effects from bulk matrix or architectural effects.
- **Control adequacy:** Baseline, single-component, hybrid, and sham or negative controls are included and justified.
- **Metric separation:** Peak, residual, energy-like, and failure-mode metrics are interpreted distinctly, not collapsed into a single score.
- **Independence:** Validation conditions are independent from the calibration or hypothesis-generation set.
- **Reproducibility:** Variability is estimated, outliers are predefined, and batch or sample history is tracked.

# Claim Boundaries

- Limit claims to the tested material family, geometry, scale, loading or exposure context, and model class.
- Distinguish demonstrated findings (directly supported by controls), inferred findings (mechanism-linked but not directly proven), speculative extensions (plausible beyond tested context), and unsupported claims.
- Do not present single-study findings or agent-generated inferences as field-wide consensus.

# Failure Modes

- **Confounding:** Matrix strength, processing variation, alignment, orientation, environmental history, or geometry effects mistaken for interface mechanisms.
- **Mechanism misattribution:** Bulk or architectural effects attributed to interface modification because single-component controls were omitted.
- **Metric misinterpretation:** Failure-mode shifts ignored while scalar metrics are averaged or normalized, masking regime changes.
- **Overgeneralization:** Conclusions extrapolated beyond tested boundary conditions, material systems, or scales.
- **False synergy:** Combined effects claimed without factorial single-component evidence.

# Validity Checks

- **Confounding check:** Could preparation, geometry, environment, or measurement artifacts explain the result?
- **Failure-mode check:** Did the test remain in the intended mechanism regime, or did a shift invalidate the metric?
- **Mechanism-alignment check:** Do intermediate mechanism markers and final performance outcomes point in the same direction?
- **Statistical check:** Are endpoints predefined, replication adequate, and uncertainty reported?
- **Evidence-labeling check:** Are source-supported observations separated from agent-inferred hypotheses and new conclusions?

# Provenance

Synthesized from cluster 73.0 (composite-fiber-interface-biomaterial-mechanism-discovery-workflow). Source skills: interface-reinforcement-research, interface-composite-research-design, hypoxia-enabled-nanoplatform-research, asymmetric-biomaterial-cardiac-adhesion-research, am-composite-fracture-exploration, biomaterial-protein-cell-workflow, osteoporotic-bone-scaffold-exploration, biomimetic-fiber-scaffold-research-design.
