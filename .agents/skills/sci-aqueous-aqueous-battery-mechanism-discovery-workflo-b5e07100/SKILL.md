---
name: sci-aqueous-aqueous-battery-mechanism-discovery-workflo-b5e07100
description: A reusable end-to-end workflow for observable-driven mechanism discovery and validation in aqueous electrochemical energy storage research.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents through an end-to-end, observable-driven workflow to discover, discriminate, and validate charge-storage mechanisms in aqueous battery materials and interfaces. The workflow couples bottleneck identification, hypothesis generation, controlled study design, multimodal analysis, and iterative claim bounding to prevent overgeneralization from single-system observations.

# When to use

Use this skill when designing or critiquing research plans for aqueous battery electrodes, electrolytes, or interphases where the central question is mechanistic: what stores charge, how it is stored, and why performance is limited. It applies to cathode and anode materials, soft or solid quasi-solid conductors, and interfacial stabilization strategies. Do not use this skill as a general manufacturing guide, a source of field-wide consensus, or a recipe for unsafe laboratory operations.

# Inputs required

Before producing a plan, collect or clarify:

- Target system class and intended electrochemical function.
- Known or suspected bottleneck (e.g., ion transport, interfacial stability, structural reversibility, side-reaction suppression).
- Candidate design motif or intervention concept.
- Available characterization and electrochemical methods, especially structural, chemical-state, transport, and impedance probes.
- Intended validation level: screening, mechanism discovery, or application-relevant benchmarking.
- Safety, reproducibility, and equipment constraints relevant to aqueous energy-storage research.

If the user provides only a broad topic, first propose a shortlist of candidate research questions with explicit assumptions and evidence-strength labels.

# Core Workflow

1. **Bottleneck Mapping & Hypothesis Generation**
   - Frame the problem as a coupled bottleneck involving capacity, transport, stability, or interfacial processes.
   - Map the proposed mechanism: active sites, transport pathways, interfacial reactions, and likely side processes.
   - Generate ranked hypotheses. For each, state evidence strength (speculative to strong), key assumptions, predicted orthogonal diagnostics, and falsifying observations.
   - **Decision Gate — Candidate Gate:** Proceed only if at least one hypothesis is falsifiable with available controls and diagnostics. Otherwise, refine the bottleneck map or acquire new methods.

2. **Controlled Study Design**
   - Define independent variables (design motif, composition, architecture, environment).
   - Establish a control hierarchy: baseline unmodified system, negative control lacking the proposed feature, positive or reference control, and process/artifact controls.
   - Select a balanced metric set: primary performance, secondary performance, mechanism-specific diagnostics, and artifact checks.
   - Pre-register stop conditions before data collection.
   - **Decision Gate — Design Gate:** Proceed only if the control set can isolate the target mechanism from additive, impurity, contact, and environmental confounders.

3. **Minimum Viable Validation**
   - Confirm identity, phase, and structural definition of the target and controls.
   - Collect primary performance metrics under matched testing assumptions.
   - Gather at least two independent mechanism-specific diagnostics (e.g., state-resolved structural, chemical-state, or transport evidence).
   - Run artifact checks: additive-only, matrix-only, impurity, moisture, and contact controls.
   - **Decision Gate — Mechanism Exclusion Gate:** If artifact controls explain the observed response, halt the primary hypothesis, document the confounder, and pivot to the variable actually driving the effect.

4. **Layered Evidence Analysis**
   - **Performance layer:** Compare metrics across candidates with consistent normalization.
   - **Attribution layer:** Determine whether the response arises from the target mechanism or from secondary processes (side reactions, dissolution, precipitation).
   - **Mechanism layer:** Align electrochemical fingerprints with structural, compositional, or chemical-state changes.
   - **Transport layer:** Connect conductivity, impedance, or diffusion estimates to observed rate behavior.
   - **Boundary layer:** Vary electrolyte, temperature, rate, or cycling stress to define the valid operating range.
   - **Decision Gate — Stability Gate:** If structural or chemical reversibility is absent, or if degradation dominates before meaningful cycling, stop mechanism claims and redesign for stability.

5. **Claim Bounding & Robustness Check**
   - State what is supported, what remains ambiguous, and what requires the next decisive experiment.
   - Define boundary conditions (material family, electrolyte class, temperature/rate window) where the mechanism should not be extrapolated.
   - Position results against literature benchmarks contextually, not as consensus.
   - **Decision Gate — Claim Bounding Gate:** Downgrade or reject claims that lack convergent evidence across at least two independent diagnostic classes.

6. **Iteration or Redesign**
   - Classify the outcome: supported, weakened, ambiguous, or contradicted.
   - **If supported:** Narrow the hypothesis scope, tighten boundary conditions, and design the next experiment to discriminate against the strongest alternative explanation.
   - **If weakened/ambiguous:** Add stronger artifact checks, refine controls, or test a modified design lever.
   - **If contradicted:** Pivot to a new mechanism or design axis, or abandon the candidate path.
   - **Stop Conditions:** Terminate the workflow when (a) attribution is clear and convergent, (b) the path remains ambiguous after decisive controls, (c) redox or structural irreversibility prevents meaningful cycling, (d) performance depends on undocumented variables, or (e) safety or reproducibility barriers cannot be resolved.

# Output Format

Return results in a structured plan containing:

1. **Research question** — concise bottleneck-focused problem statement.
2. **Mechanism map** — active sites, transport pathways, interfacial processes, and likely side reactions.
3. **Ranked hypotheses** — each with evidence strength, key assumptions, predicted observations, and failure modes.
4. **Study design** — independent variables, control hierarchy, metrics, and pre-registered stop conditions.
5. **Analysis plan** — performance, attribution, mechanism, transport, and boundary-layer analysis steps.
6. **Iteration plan** — next decisive experiment, hypothesis update rules, and stop/continue criteria.
7. **Validity and safety notes** — confounders, reproducibility checks, external validity limits, and non-operational safety constraints.

# Validation Gates

- **Candidate Gate:** At least one hypothesis must be falsifiable with available diagnostics and controls.
- **Design Gate:** The control hierarchy must isolate the target mechanism from confounders.
- **Mechanism Exclusion Gate:** Artifact and additive controls must be evaluated before accepting a mechanism claim.
- **Stability Gate:** Structural and chemical reversibility must be confirmed before advancing durability claims.
- **Claim Bounding Gate:** Claims require convergent evidence from at least two independent diagnostic classes.
- **Functional Validation Gate:** Device-level or stress-test relevance is required only if application claims are made.
- **Robustness Check Gate:** Trends must be distinguishable from single-run artifacts, with variability reported across replicates or batches when feasible.

# Claim Boundaries

- Claims apply only to the tested material system, preparation route, and measurement conditions.
- Single-system results are evidence for that system, not field-wide consensus.
- Performance metrics must be linked to mechanism evidence before causal interpretation.
- Literature comparisons are contextual positioning, not confirmatory benchmarks.
- Screening or coin-cell results are separated from application-relevant durability or safety claims.

# Failure Modes

- **Confounded response:** Performance is explained by additives, impurities, surface deposits, or electrolyte side reactions rather than the target mechanism.
- **Irreversible operation:** Redox activity or structural integrity is lost before meaningful cycling.
- **Transport without storage:** Conductivity or rate improves without reversible charge-storage evidence.
- **Single-signal mechanism:** Mechanism inference relies on only one diagnostic or inconsistent orthogonal probes.
- **Undocumented sensitivity:** Performance depends on uncontrolled processing, environment, or contact variables.
- **Control equivalence:** Controls show the same effect as the target, weakening the proposed mechanism.
- **Reproducibility failure:** Independent replicates or batches show inconsistent trends.

# Validity Checks

- **Confounding:** Have loading, binder, porosity, conductive additive, electrolyte, and normalization effects been considered?
- **Reproducibility:** Are independent replicates, batch provenance, variability reporting, and failed controls included?
- **Mechanistic specificity:** Does each mechanism claim have a matching structural, chemical-state, or transport measurement?
- **Boundary conditions:** Are electrolyte, temperature, rate, and cycling conditions tested enough to define the valid range?
- **External validity:** Are screening results separated from application-relevant or device-level claims?
- **Statistical validity:** Are trends distinguished from single-run artifacts, and is best-case selection avoided?
- **Safety and ethics:** Is the plan kept at a research-design level with hazard assessment for materials, electrolytes, and cells, and with institutional compliance required before any experimental work?

# Provenance

- Synthesized from cluster 13.0 (observable-driven mechanism discovery and validation).
- Source skill references: aqueous-zinc-cathode-exploration; hydrogel-zinc-battery-research-design; mild-synthesis-battery-cathode-research-design; solid-polymer-zinc-electrolyte-research-design; organic-radical-zinc-cathode-research; aqueous-zib-manganese-cathode-research-pattern; descriptor-guided-intercalation-research; coordinated-redox-supramolecular-battery-exploration.
- Paper-specific conclusions, numerical results, and operational protocols were excluded per synthesis rules.
