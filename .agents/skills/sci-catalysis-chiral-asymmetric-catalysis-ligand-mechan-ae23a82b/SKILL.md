---
name: sci-catalysis-chiral-asymmetric-catalysis-ligand-mechan-ae23a82b
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in asymmetric catalysis and chiral ligand/catalyst discovery.
scienceevolve-title: "Asymmetric catalysis · chiral asymmetric catalysis ligand mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Guide research planning for asymmetric catalysis and chiral ligand/catalyst systems by translating stereochemical and mechanistic questions into falsifiable hypotheses, minimal validation designs, and iterative evidence chains. The goal is to separate true catalyst-controlled selectivity from substrate bias or background reactivity without treating any single literature system as field-wide consensus.

# When to use

Use this skill when:
- Proposing or evaluating new asymmetric transformations, enantioselective catalysts, or chiral ligand platforms.
- Linking catalyst/ligand structural features to observed reactivity, selectivity, or scope.
- Designing studies that require mechanism discrimination through orthogonal controls and diagnostics.
- Iterating from initial validation toward bounded platform claims or boundary definitions.

Do not use this skill for operational laboratory recipes, clinical recommendations, scale-up protocols, or hazardous procedural instructions.

# Inputs required

Before generating a plan, identify or request:
- **Target transformation and bottleneck**: reaction class, desired stereochemical outcome, and whether the gap is activity, selectivity, scope, or mechanistic clarity.
- **Candidate catalyst/ligand variables**: scaffold class, donor set, steric/electronic tuning handles, chirality source, and activation mode.
- **Substrate features**: electronic/steric patterns, conformational properties, competing pathways, and known background reactivity.
- **Evidence base**: prior literature, computational predictions, preliminary observations, and their limitations.
- **Constraints**: safety boundaries, reproducibility requirements, analytical access, and institutional oversight.

# Core Workflow

Execute as an ordered, iterative pipeline with explicit decision gates.

1. **Define the stereochemical bottleneck.** Identify whether the core challenge is activation, enantioface discrimination, regiocontrol, cascade progression, product configurational stability, or competing background pathways.
2. **Generate falsifiable hypotheses.** For each candidate direction, produce:
   - Mechanism hypothesis (how selectivity is controlled).
   - Design hypothesis (which structural feature should alter the bottleneck).
   - Scope hypothesis (which substrate classes should respond).
   - Boundary hypothesis (where the model should fail).
   Tag each with evidence strength, key assumptions, predicted observations, and failure modes.
3. **Design minimal viable validation.** Select one representative test that probes the core claim. Define:
   - Independent variables: catalyst/ligand class, substrate feature, activation mode, or medium class.
   - Dependent variables: selectivity, conversion, product identity, mechanistic consistency.
   - Control schema: positive benchmark, negative/ablation, background, stereochemical inversion, and orthogonal characterization controls.
   - Metrics and predefined stop conditions.
4. **Collect orthogonal evidence.** Gather performance data together with mechanistic diagnostics (binding/titration, kinetic trends, isotope effects, intermediate detection, computational consistency, or spectroscopic probes). Treat single positive outcomes as existence proofs only.
5. **Discriminate competing pathways.** Separate observation from interpretation. Determine whether outcomes arise from catalyst control, substrate bias, dynamic resolution, background reaction, or product degradation. Map structure–performance trends without inferring mechanism from yield alone.
6. **Decision Gate 1 — Mechanism Plausibility.**
   - If orthogonal evidence supports the proposed pathway → proceed to refinement.
   - If evidence contradicts the pathway → reject hypothesis and return to Step 2.
   - If evidence is inconclusive → add discriminating tests before advancing.
7. **Refine the model.** Update the transition-state organization, ligand design rule, or substrate recognition model based on diagnostic results. Preserve source-paper observations as inspiration, not universal rules.
8. **Decision Gate 2 — Reproducibility & Robustness.**
   - If key observations repeat across independent preparations/batches and controls behave as expected → proceed.
   - If variability is high or controls fail → investigate confounders (impurities, degradation, analytical artifacts) and return to Step 4.
9. **Expand along challenge gradients or define boundaries.** Test substrate classes that vary sterics, electronics, or conformation to stress the model. Record failures as boundary conditions, not merely negative data.
10. **Decision Gate 3 — Generalization Assessment.**
    - If trends hold across diverse, representative cases with consistent mechanistic rationale → formulate a bounded platform hypothesis.
    - If performance is narrow or overfitted → bound claims to the validated substrate/catalyst class and stop.
11. **Iterate.** Return to Step 2 with the updated model. Stop the loop when:
    - The mechanism is resolved and bounded,
    - Background reaction dominates and cannot be suppressed,
    - Selectivity is irreproducible,
    - Safety or compliance boundaries are reached,
    - Further extrapolation exceeds tested evidence.

# Output Format

Return a structured research plan containing:
1. **Research question** — concise statement of the stereochemical or mechanistic problem.
2. **Evidence map** — classification of what is literature-supported, cross-study-supported, or agent-inferred.
3. **Hypotheses table** — mechanism, design, scope, and boundary hypotheses with evidence strength, assumptions, predicted observations, and failure modes.
4. **Validation plan** — minimal viable experiment, variables, controls, metrics, and stop conditions.
5. **Analysis plan** — mechanistic discrimination logic, structure–performance mapping, uncertainty handling, and evidence grading criteria.
6. **Iteration rules** — how each possible result updates or terminates the hypothesis.
7. **Validity and safety statement** — confounders, reproducibility requirements, extrapolation limits, and non-operational safety boundaries.

# Validation Gates

Before advancing past each decision gate in the Core Workflow, confirm:
- **Gate 1 (Mechanism):** At least one orthogonal probe supports the proposed pathway, and a plausible alternative has been tested or ruled out.
- **Gate 2 (Robustness):** Controls are comparable, replicates are consistent, and analytical assignments are independently supported.
- **Gate 3 (Generalization):** Scope expansion is based on a defined challenge gradient, not cherry-picked examples; failures are documented.

# Claim Boundaries

- Distinguish **paper-supported patterns** (general reasoning validated across literature), **agent-inferred hypotheses** (new applications requiring testing), and **existence proofs** (single observations).
- Do not present a single source study as field-wide consensus.
- State explicit substrate classes, catalyst families, activation modes, and environments where extrapolation is unsafe.
- Separate catalytic success from downstream biological, therapeutic, or industrial utility.

# Failure Modes

- **Background dominance:** Product forms without catalyst control or selectivity tracks with uncatalyzed pathways.
- **Degradation or instability:** Catalyst decomposition, substrate racemization, or product configurational erosion obscures true selectivity.
- **Substrate bias:** Apparent enantioselectivity arises from inherent substrate preference rather than catalyst organization.
- **Analytical artifacts:** Misassigned stereochemistry, calibration errors, or impurity interference.
- **Overfitted scope:** High performance in one narrow class that disappears under structural perturbation.
- **Confounded controls:** Noncomparable baselines, mismatched analysis methods, or unreplicated outliers.

# Validity Checks

Before finalizing any output, verify:
- **Confounding:** Could impurities, moisture, degradation, competing pathways, or medium effects explain the result?
- **Reproducibility:** Are key claims supported by repeated observations and independent characterization?
- **Statistical validity:** Is the evidence sufficient to distinguish systematic trends from noise?
- **Mechanistic specificity:** Does each mechanism claim have a discriminating test, or does it rely solely on successful outcome?
- **Boundary discipline:** Are extrapolation limits explicitly stated for substrate scope, catalyst class, and reaction environment?
- **Attribution:** Are source-paper observations clearly separated from agent-inferred extensions?
- **Safety and ethics:** Does the plan avoid operational hazardous details, clinical claims, and unsupported deployment recommendations?

# Provenance

Synthesized from Cluster 11 / Subcluster 11.0 (observable-driven mechanism discovery and validation). Source skills: `helicene-ion-pair-catalysis-exploration`, `hbd-anion-binding-research-design`, `polyfluoro-selectivity-research-workflow`, `planar-chiral-macrocycle-catalysis-research-design`, `chiral-ligand-catalyst-exploration`, `chiral-benru-catalyst-discovery-workflow`, `enantioselective-pd-allylic-catalysis-research`, `chiral-diene-ligand-research-exploration`.
