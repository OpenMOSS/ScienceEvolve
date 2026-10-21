---
name: sci-aqueous-aqueous-metal-battery-research-design-workf-47c0ac87
description: Reusable end-to-end research design workflow for proposing falsifiable hypotheses, designing controlled experiments, and iterating mechanism validation in aqueous metal battery electrolyte and interphase systems.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery research design workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

This skill guides the agent in transforming electrochemical energy-storage research questions—particularly around aqueous metal-battery electrolytes, solvation structures, and electrode–electrolyte interphases—into structured, mechanism-driven investigation plans. It emphasizes falsifiable hypotheses, strong control hierarchies, cross-scale evidence chains, and non-operational safety boundaries. The goal is methodological transferability, not replication of any single paper’s conclusions or recipes.

## When to use

- When the user needs to formulate new research questions for aqueous or multivalent metal batteries focused on electrolyte design, interphase stability, or deposition reversibility.
- When the goal is to connect molecular-level mechanisms (solvation, adsorption, interphase formation) to device-level performance through a causal evidence chain.
- When the user requests experimental design, control strategies, iteration logic, or mechanism validation—not paper summaries, material recipes, or executable laboratory procedures.
- When the user wants to evaluate whether a candidate additive, solvent, or interfacial strategy merits further study without mechanically transferring conditions from prior literature.

Do not use this skill to provide operational fabrication recipes, hazardous handling steps, specific dosages, device run parameters, or direct experimental protocols.

## Inputs required

- **Target system**: Metal anode type, counter electrode class, electrolyte category, and intended device geometry.
- **Performance bottleneck**: Known or suspected failure modes (e.g., side reactions, non-uniform deposition, interphase instability, cathode degradation, transport limitations).
- **Candidate levers**: Proposed electrolyte, additive, solvent, interphase, or structural modifications.
- **Existing evidence**: Literature findings, preliminary data, simulation results, or prior failure cases.
- **Constraints**: Non-operational safety boundaries, available characterization tiers, computational resources, and compliance limits.
- **Evaluation priorities**: Mechanism verification, performance improvement, cycle-life extension, temperature-window expansion, or scalability assessment.

If inputs are incomplete, the agent must list information gaps and proceed with a conditional draft annotated by assumption strength.

## Core Workflow

### 1. Bottleneck decomposition and scope gate
Decompose the stated performance problem into bulk-electrolyte, interphase, electrode-process, and device-coupling contributions.
- **Decision gate**: If the bottleneck cannot be mapped to at least one observable intermediate variable (e.g., solvation environment, interphase composition, deposition morphology), pause and request clarification before proceeding.

### 2. Mechanism-chain construction
For each candidate lever, draft a causal chain:
`Design variable → Solvation/Interphase change → Kinetic/Transport change → Deposition/Embedding reversibility → Device metric`
- Explicitly label which links are supported by literature, which are analogical inferences, and which are untested.
- **Decision gate**: If any link lacks a conceivable observation or proxy, refine or drop the lever.

### 3. Hypothesis generation and ranking
Generate 2–4 falsifiable hypotheses. Each must include:
- **Evidence strength** (Strong / Moderate / Weak / Speculative) with provenance rationale.
- **Key assumptions**: Conditions that must hold for the mechanism to be valid.
- **Falsifiable predictions**: Expected changes in spectroscopic, interfacial, morphological, or electrochemical indicators.
- **Failure modes**: Specific observations that would invalidate the hypothesis (e.g., no interphase change despite performance gain).
- **Decision gate**: Rank hypotheses by clarity, controllability, and diagnostic accessibility. Reject hypotheses that rely on mechanical transfer of single-paper conclusions to the new system.

### 4. Minimal viable validation design
Design the smallest experiment set that can strengthen or weaken the top hypothesis:
- **Baseline control**: Standard system without the candidate lever.
- **Negative control**: A variant that preserves physical presence but disables the target mechanism.
- **Positive control**: A known benchmark strategy, treated as local evidence rather than consensus.
- **Decoupling control**: A design that isolates bulk-property effects from interfacial effects.
- **Decision gate**: If the plan cannot distinguish interfacial from bulk contributions, redesign controls before advancing.

### 5. Metric pre-registration and stopping rules
Define tiered metrics before data collection:
- **Mechanism indicators**: Solvation signatures, interphase composition/gradient, ion coordination.
- **Kinetic indicators**: Polarization, impedance evolution, nucleation/growth behavior.
- **Stability indicators**: Side-reaction signatures, morphological retention, efficiency trends.
- **Device indicators**: Capacity retention, rate response, full-cell compatibility.
- **Stop/Go rules**: Halt if safety boundaries are breached, controls fail, results are irreproducible, or bulk effects fully explain the observation.

### 6. Multi-scale evidence collection and analysis
Analyze data in a chained order:
1. Check bulk properties first to rule out non-interfacial explanations.
2. Evaluate interphase evidence for selectivity and uniformity.
3. Pair electrochemical signatures with morphological/structural evidence.
4. Compare half-cell and full-cell trends separately to avoid device-coupling illusions.
- **Decision gate**: If mechanism, kinetic, and device indicators are convergent, proceed to claim bounding. If divergent, flag confounders and return to Step 3 or 4.

### 7. Iteration and pivot logic
Based on evidence convergence:
- **Support**: Expand to harsher boundary conditions (e.g., lean electrolyte, extended cycling, temperature stress).
- **Partial support**: Add orthogonal diagnostics or refine the mechanism chain.
- **Failure / contradiction**: Return to bottleneck decomposition (Step 1) or abandon the lever if negative controls match the candidate.
- **Safety / irreproducibility trigger**: Immediate stop; archive failure mode and reassess risk before any redesign.

### 8. Archival and provenance tagging
Document the final mechanism model, evidence matrix, and all excluded alternatives. Tag claims with their evidence tier and note which source skills informed the methodological framework.

## Output Format

Each invocation must produce:

1. **Research question**: One-sentence definition of the new problem and its bottleneck origin.
2. **Evidence map**: Literature evidence, user data, inferred gaps, and uncertainty levels.
3. **Hypothesis matrix**: Table of candidate hypotheses with mechanism chains, evidence strength, key assumptions, predictions, and failure modes.
4. **Experimental design**: Minimal viable validation, variable hierarchy, control hierarchy (baseline, negative, positive, decoupling), tiered metrics, and stopping rules.
5. **Analysis plan**: Procedure for bulk-first exclusion, interphase verification, cross-scale pairing, and causal scoring.
6. **Iteration plan**: Update rules for support, partial support, failure, and safety-triggered stops.
7. **Validity and safety review**: Confounder checklist, reproducibility requirements, extrapolation boundaries, and non-operational safety guardrails.

## Validation Gates

- **Hypothesis falsifiability gate**: Every hypothesis must state an observation that would invalidate it.
- **Control sufficiency gate**: The design must include at least one decoupling control capable of separating bulk from interfacial effects.
- **Data comparability gate**: Geometry, loading, protocol, and environmental conditions must be documented before comparing candidate and control datasets.
- **Cross-scale consistency gate**: Mechanism indicators must directionally agree with device indicators before a causal claim is advanced.
- **Literature boundary gate**: Single-paper conclusions must not be treated as domain consensus when framing assumptions.

## Claim Boundaries

- **Verified**: Directly supported by multi-scale, independent evidence in the target system with adequate controls.
- **Supported**: Mechanism and performance trends are consistent, but at least one critical link relies on a single diagnostic or analogous system.
- **Inferred**: Derived from structural or computational proxies without direct electrochemical confirmation in the target system.
- **Speculative**: Exploratory direction with limited evidence; must be labeled as such and accompanied by a targeted validation plan.
- **Prohibited claims**: Never claim commercial readiness, universal safety, or direct scalability from half-cell data. Never present analogical reasoning as established mechanism.

## Failure Modes

- **Bulk confounding**: Performance change is driven by viscosity, conductivity, or pH shifts rather than the intended interfacial mechanism.
- **Half-cell illusion**: Half-cell or symmetric-cell improvements fail to translate to full-cell configurations due to counter-electrode incompatibility or coupling effects.
- **Irreproducibility**: Uncontrolled impurities, batch variation, surface pretreatment, or environmental drift mask the true effect.
- **Misattributed interphase**: Surface residues or post-mortem artifacts are interpreted as functional interphase layers without in-situ or operando support.
- **Variable coupling**: A single lever changes multiple mechanism links simultaneously, preventing clean causal attribution.
- **Safety boundary breach**: Unanticipated gas evolution, corrosion, or thermal excursion invalidates the experimental path.

## Validity Checks

- **Confounders**: Audit impurities, dissolved oxygen, moisture, electrode loading, contact impedance, temperature history, and measurement calibration.
- **Reproducibility**: Require independent repeats, batch documentation, predefined outlier rules, and retention of raw data.
- **Statistical rigor**: Report variance, sample size, and effect size for key metrics; avoid selecting best curves.
- **Mechanism sufficiency**: Ensure the causal chain has no missing intermediate links between structural change and performance outcome.
- **Extrapolation limits**: State the applicable metal, electrolyte class, temperature window, and device scale; do not generalize beyond tested boundaries.
- **Data completeness**: Archive negative results, control outcomes, and excluded datasets alongside supportive findings.

## Provenance

- **Cluster**: 5 / **Subcluster**: 5.0
- **Source skills**: `aqueous-zinc-electrolyte-exploration`, `nonaqueous-cation-electrolyte-interphase-workflow`, `aqueous-zinc-ion-cathode-exploration`, `gel-electrolyte-research-workflow`, `aqueous-zinc-edl-electrolyte-research`, `gradient-sei-aqueous-metal-battery-research`, `aqueous-zinc-battery-interface-exploration`, `aqueous-multivalent-battery-solvation-exploration`.
- This workflow synthesizes shared methodological patterns from the above skills. No specific material system, numerical result, or paper conclusion is endorsed as universal.
