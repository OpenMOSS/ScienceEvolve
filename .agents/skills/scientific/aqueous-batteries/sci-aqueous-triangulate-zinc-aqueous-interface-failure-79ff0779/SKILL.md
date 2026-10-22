---
name: sci-aqueous-triangulate-zinc-aqueous-interface-failure-79ff0779
description: A reusable end-to-end workflow for discovering and validating interfacial mechanisms in aqueous metal battery systems, from failure-mode framing through hypothesis generation, staged experimentation, orthogonal evidence triangulation, and iterative refinement.
scienceevolve-title: "Aqueous battery interfaces · triangulate zinc aqueous interface failure mechanisms"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Use this skill to transform an observed aqueous metal-battery degradation phenotype into a disciplined, mechanism-driven research program. It guides the agent to frame interfacial problems, generate falsifiable hypotheses, design staged validation experiments with strong controls, triangulate evidence across molecular to cell-level scales, and iterate until the mechanism is either supported, bounded, or rejected.

# When to use

Use this skill when:

- Proposing new research questions about aqueous metal anodes, electrolyte additives, or interphase modifiers.
- Evaluating candidate strategies that couple solvation restructuring with interfacial regulation.
- Designing studies that must link molecular/interfacial structure to deposition morphology and electrochemical performance.
- Critiquing existing studies for mechanistic rigor, control adequacy, or boundary conditions.
- Building non-operational research plans that avoid treating a single paper’s result as field consensus.

Do not use this skill for operational laboratory recipes, hazardous synthesis instructions, cell-assembly protocols, abuse testing, or commercialization assessments.

# Inputs required

Before generating a plan, identify or request:

- **Target system:** metal anode chemistry, aqueous electrolyte class, separator type, cathode or half-cell configuration, and intended operating window.
- **Degradation phenotype:** the primary failure mode to explain (e.g., nonuniform deposition, corrosion, passivation, gas evolution, poor reversibility, impedance growth).
- **Candidate mechanistic levers:** proposed solvation, interfacial, transport, or reaction modifications.
- **Evidence channels:** available spectroscopy, microscopy, electrochemistry, modeling, or literature benchmarks.
- **Constraints:** safety boundaries, material exclusions, equipment limits, and minimum success criteria.
- **Baseline context:** unmodified electrolyte performance and known limitations.

If key inputs are missing, state assumptions and label the plan provisional.

# Core Workflow

Follow this ordered end-to-end route. Do not skip stages or treat performance improvement as mechanism proof without passing the relevant decision gate.

## 1. Frame the coupled failure problem

- Define the degradation phenotype independently of any proposed solution.
- Map symptoms to a causal chain: bulk solvation / electrolyte structure → interfacial composition or adsorption → local ion transport and nucleation → deposition morphology → stripping reversibility → long-term cell degradation.
- Identify which links in the chain are observationally accessible.
- **Decision gate:** Is the phenotype reproducible and observable with available tools? If no, stop and refine the observation protocol before hypothesizing.

## 2. Generate competing mechanism hypotheses

- Produce at least three competing hypotheses that explain the phenotype through distinct mechanisms (e.g., interfacial-water exclusion, solvation-shell reorganization, adsorption-buffering, interphase formation, mass-transport modification).
- Include an explicit confounder/artifact hypothesis.
- For each hypothesis, specify:
  - Mechanistic rationale linking a molecular or interfacial change to the phenotype.
  - Predicted evidence signatures across solvation, interface, morphology, and electrochemical domains.
  - Evidence strength (`low`, `medium`, `high`).
  - Key assumptions required for the hypothesis to hold.
  - Likely failure modes and transferability boundaries.
- **Decision gate:** Are the hypotheses falsifiable with the available evidence channels? If no, redesign the hypotheses or acquire capability before proceeding.

## 3. Design a staged validation ladder

Structure experiments as a decision pathway rather than a fixed recipe:

- **Stage A — Descriptor / Solvation:** Test whether the candidate changes metal-ion coordination, ion pairing, or interfacial water activity.
- **Stage B — Interface:** Test whether the candidate adsorbs, enriches, or reacts at the electrode/electrolyte boundary.
- **Stage C — Morphology / Transport:** Test deposition uniformity, nucleation density, crystal orientation, and ion-flux distribution.
- **Stage D — Electrochemical Performance:** Test reversibility, overpotential stability, rate response, and cycling retention in half-cell or symmetric formats.
- **Stage E — Full-cell Translation:** Test whether anode-side gains survive realistic cathode coupling, loading, and electrolyte inventory.

For every stage, define:
- **Independent variables:** candidate identity/class, concentration regime, electrolyte background, substrate, and stress condition.
- **Controls:** baseline (unmodified), negative (mechanistically inactive analog), positive (established benchmark if available), and ablation (remove one proposed lever).
- **Metrics:** mechanism-specific readouts, performance endpoints, and trade-off indicators (e.g., transport penalty).
- **Stop conditions:** safety flags; failure to distinguish candidate from negative control; mechanism evidence contradicts performance trend; improvement disappears under broader controls.

## 4. Execute minimal viable validation

- Run Stage A and B before committing to long-duration cell tests.
- Collect orthogonal data at each stage; do not rely on a single measurement type.
- **Decision gate:** Do descriptor and interface data support the hypothesized mechanism? If no, iterate the hypothesis or stop the candidate branch.

## 5. Triangulate and analyze evidence

- Build an evidence matrix: rows = candidate conditions; columns = solvation, interface, morphology, kinetics, and cell performance. Mark each cell as supporting, neutral, or contradicting.
- Require at least two independent evidence streams to promote a mechanism from speculative to plausible.
- Check causal consistency: all layers of the mechanism chain should change coherently. If one layer changes but others do not, weaken the claim and propose a targeted follow-up.
- Quantify uncertainty: report replicate variability, batch effects, and sensitivity to baseline choices.
- **Decision gate:** Does evidence converge across orthogonal techniques? If no, split the hypothesis into submechanisms and return to Step 2.

## 6. Iterate or redesign

Apply the weakest-link rule: the least reliable evidence stream limits mechanism strength.

- **If solvation changes but interface/deposition do not:** redesign the candidate for stronger interfacial regulation or better transport compatibility.
- **If interface improves but reversibility does not:** inspect interphase resistance, ion transport, stripping kinetics, or cathode compatibility.
- **If half-cell improves but full-cell fails:** reassess cathode-side effects, crossover, electrolyte consumption, and cell-level imbalance.
- **If controls match candidate performance:** reject the mechanism-specific claim and redesign the control set before proceeding.
- **If safety-critical endpoints worsen:** stop the candidate branch immediately.
- **Decision gate:** Is the mechanism the weakest link? If yes, design a perturbation experiment that selectively weakens the proposed mechanism while holding other variables constant.

## 7. Define boundaries and finalize

- State explicit operating boundaries: electrolyte class, concentration regime, substrate type, cell format, and stress window.
- Distinguish what is directly supported by source evidence versus what is inferred for the new system.
- Document residual uncertainties and the next decisive test.
- Archive the provenance of source-skill logic versus new-system extrapolation.

# Output Format

When using this skill, produce:

1. **Research question:** one concise question tied to a degradation phenotype.
2. **Causal mechanism map:** solvation → interface → deposition → performance chain with observable links.
3. **Ranked hypothesis table:** hypothesis, mechanism, evidence strength, key assumptions, predicted signatures, and likely failure modes.
4. **Staged experimental design:** variables, controls, evaluation metrics, and stop conditions for each stage.
5. **Evidence matrix template:** rows and columns for triangulation.
6. **Iteration decision tree:** rules for updating, narrowing, or rejecting hypotheses based on stage outcomes.
7. **Validity, boundary, and safety notes:** confounders, reproducibility requirements, operating limits, and non-operational safety constraints.

# Validation Gates

Before advancing a candidate or claiming a mechanism, confirm passage through these gates:

- **Phenotype gate:** The degradation mode is defined independently of the proposed solution and is reproducible.
- **Mechanism gate:** At least two orthogonal evidence streams converge on the same mechanistic explanation.
- **Control gate:** Baseline, negative, and ablation controls are included and behave as expected.
- **Reproducibility gate:** Trends are consistent across independent replicates or batches, not single best cases.
- **Safety gate:** No uncontrolled hazard (gas evolution, short-circuit risk, thermal concern, incompatible materials) exceeds the approved safety envelope.

# Claim Boundaries

- Distinguish source-paper-derived evidence from new-system inference; label all extrapolations explicitly.
- Limit mechanistic claims to the tested electrolyte class, metal chemistry, substrate, cell format, and operating window.
- Do not treat single-candidate or single-cell success as consensus for the entire field.
- Separate half-cell mechanistic insights from full-cell practicality claims; require full-cell evidence before asserting practical relevance.
- Avoid attributing improvement to a specific molecular mechanism when controls show equivalent gains from nonspecific effects.

# Failure Modes

- **Confounded improvement:** Bulk conductivity, pH, viscosity, impurity, or assembly variation mimics the proposed mechanism.
- **Single-stream fallacy:** A mechanism is claimed from one measurement type (e.g., only microscopy or only electrochemistry) without orthogonal support.
- **Control failure:** Negative or ablation controls perform equally to the candidate, indicating a nonspecific or artifactual effect.
- **Partial validation:** Solvation or interface evidence exists, but deposition morphology or cell-level evidence is missing or contradictory.
- **Stress collapse:** The mechanism functions only under narrow conditions and fails outside the tested boundary.
- **Safety override:** Uncontrolled gas evolution, short-circuit tendency, or thermal hazard invalidates the candidate regardless of performance.

# Validity Checks

- **Confounding:** Scrutinize electrode roughness, mass loading, separator effects, temperature, impurities, dissolved gases, and cell assembly variation.
- **Reproducibility:** Require independent preparation batches, repeated cells, consistent analysis criteria, and transparent reporting of excluded data.
- **Statistical validity:** Use predefined success criteria, report variability and effect sizes, and avoid conclusions based on selected curves or images.
- **Mechanistic specificity:** Ensure each claim has a matching measurement and that alternative explanations are considered and ruled out by controls.
- **Boundary conditions:** State limits imposed by chemistry, cell format, rate, loading, and time scale; do not extrapolate beyond tested regimes.
- **Model validity:** Verify that computational assumptions (force fields, boundary conditions, simplified chemistries) are adequate for the claim being made.

# Provenance

- Synthesized from cluster 36.0 (observable-driven mechanism discovery and validation).
- Source skills: `li-metal-interface-exploration`, `aqueous-battery-corrosion-benchmarking`, `aqueous-zinc-ion-electrolyte-research`, `aqueous-metal-battery-interface-engineering`, `aqueous-zinc-interface-exploration`, `sodium-ion-anode-material-exploration`, `electrolyte-interface-deposition-exploration`, `aqueous-zinc-electrolyte-research`.
- Paper-specific systems, materials, parameters, numerical results, and operational protocols have been removed; only the shared workflow route and validation logic are retained.
