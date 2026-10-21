---
name: sci-dft-computational-catalyst-dft-mechanism-discovery-f4f7a77d
description: A reusable end-to-end workflow for discovering, discriminating, and validating homogeneous catalytic mechanisms by integrating computational modeling with orthogonal experimental evidence.
scienceevolve-title: "Organometallic catalysis and DFT · computational catalyst dft mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Use this skill to guide end-to-end mechanistic discovery and validation for homogeneous, organometallic, and molecular catalysis. It helps frame mechanistic gaps, enumerate competing pathways, design minimal validation plans that integrate computation and orthogonal experiment, and iterate until claims are bounded by evidence. It treats no single study as field consensus and excludes operational wet-lab execution details.

# When to use

Use this skill when:

- Proposing new mechanistic questions for catalytic cycles with ambiguous rate-limiting steps, competing pathways, or unclear selectivity origins.
- Designing non-operational validation studies that combine computational modeling with kinetic, spectroscopic, isotopic, or product-distribution evidence.
- Comparing activation modes (inner-sphere, outer-sphere, ligand-centered, proton-coupled, etc.) or catalyst states (resting, activated, off-cycle, deactivated).
- Evaluating how ligand architecture, substrate structure, reaction medium, or spin/redox state influences mechanism.
- Iterating hypotheses when simple property trends fail or when computational and experimental observables conflict.

Do not use this skill to provide executable laboratory protocols, clinical or treatment recommendations, process-scale design, or broad literature-review claims beyond the supplied evidence.

# Inputs required

Before using the workflow, collect or identify:

- Target reaction class and desired/undesired product manifolds.
- Candidate catalyst families, ligand classes, and known or hypothesized active species (oxidation states, coordination numbers, spin states).
- Available evidence: kinetic trends, spectroscopic signatures, isotope data, product distributions, resting-state observations, or literature benchmarks.
- Computational scope and constraints: method classes, model truncation limits, solvation treatments, and uncertainty tolerance.
- Safety and compliance boundaries restricting operational recommendations.
- An explicit distinction between literature-supported facts and new-system inferences.

# Core Workflow

1. **Frame the mechanistic decision problem**
   - Define the bottleneck: activation, turnover, selectivity, resting-state trapping, or deactivation.
   - Identify the observable anomaly or gap that motivates mechanism-level inquiry.
   - **Gate:** If the problem is purely empirical optimization without mechanistic ambiguity, stop; use a screening workflow instead.

2. **Enumerate competing mechanism families**
   - Propose at least three distinct pathway classes (e.g., direct vs. mediated activation, inner-sphere vs. outer-sphere, mononuclear vs. bimetallic, medium-coupled vs. catalyst-only).
   - Map ligand, substrate, medium, and electronic variables to each family.
   - **Gate:** If only one mechanism family is plausible given current evidence, document assumptions and downgrade evidence strength to moderate or lower.

3. **Design the minimal validation matrix**
   - Select a reference scaffold and a small matched set of perturbations that isolate one mechanistic variable.
   - Define orthogonal controls:
     - **Positive/benchmark control:** known behavior to verify model or method fidelity.
     - **Negative control:** system expected to suppress the proposed key step.
     - **Alternative-pathway control:** a plausible competing route evaluated with the same metric set.
     - **Method control:** sensitivity to computational model, spin state, solvation, or experimental measurement bias.
   - **Gate:** If the reference scaffold cannot reproduce known benchmark behavior, stop and revise the model or method before expanding the series.

4. **Construct the evidence map**
   - Build candidate catalytic-state maps: precatalyst, activated, substrate-bound, transition structures, intermediates, product-release, resting, and off-cycle states.
   - Separate thermodynamic propensity from kinetic accessibility; do not interchange redox descriptors with activation barriers.
   - **Gate:** If a proposed intermediate is a thermodynamic sink that prevents turnover, flag it as a resting-state trap and revisit the cycle.

5. **Synthesize orthogonal observables**
   - Integrate computational profiles (relative energetics, transition-state connectivity, spin-state ordering) with experimental diagnostics (kinetic orders, isotope effects, spectroscopic signatures, product/selectivity trends).
   - Require that each mechanism family makes distinct predictions for at least two independent observables.
   - **Gate:** If competing mechanisms predict identical observables for the planned validation, redesign the comparison before proceeding.

6. **Discriminate and rank mechanisms**
   - Rank pathways by consistency across the full evidence matrix, not by a single metric.
   - Identify the selectivity-determining or rate-limiting event and check whether it explains all major and minor products.
   - Exclude mechanisms that fail controls or require unsupported assumptions (concentration, aggregation, unsampled conformations).
   - **Gate:** If method uncertainty exceeds the energy or observable differences between pathways, stop ranking and report ambiguity.

7. **Stress-test via sensitivity and robustness checks**
   - Test dependence on model choices: functional, dispersion, solvation, entropy treatment, standard states, spin states, and geometry sampling.
   - Test experimental robustness: reproducibility, calibration, impurity effects, mass-transfer artifacts, and catalyst stability.
   - **Gate:** If conclusions reverse under reasonable alternative assumptions, demote the hypothesis and flag model-dependent risk.

8. **Update or redirect hypotheses**
   - If the favored pathway matches orthogonal evidence, strengthen evidence strength and move to design hypotheses.
   - If pathways remain near-degenerate, propose the next discriminating observable or calculation rather than forcing a conclusion.
   - If evidence contradicts the leading hypothesis, revisit active-species identity, spin state, ligand dissociation, medium effects, or off-cycle traps before discarding the entire framework.
   - **Stop conditions:**
     - Stop if the validation requires unsafe or prohibited operational chemistry.
     - Stop if the model cannot reproduce a known benchmark.
     - Stop if a descriptor fails to distinguish mechanisms in benchmark cases.
     - Stop if the proposed pathway depends on unsupported structural or environmental assumptions.

9. **Bound claims and translate to next research questions**
   - Convert mechanism insights into non-operational design hypotheses (tunable ligand features, substrate scope boundaries, medium effects).
   - Explicitly label evidence provenance: paper-supported, agent-inferred, computationally supported, or speculative.
   - State boundary conditions where transfer is unsupported (different metal, ligand class, substrate activation mode, or medium).

# Output Format

When using this skill, return:

1. **Research question and scope** – concise mechanistic gap and excluded scope.
2. **Mechanistic map** – competing pathway families, active versus spectator roles, and uncertain nodes.
3. **Hypothesis table** – hypothesis, mechanistic lever, predicted observable, evidence strength, key assumptions, likely failure mode, and discriminating test.
4. **Validation design** – minimal viable validation, control list, variables, metrics, and stop conditions.
5. **Analysis plan** – state map, thermodynamic-kinetic separation, orthogonal observable integration, sensitivity checks, and decision rules.
6. **Iteration plan** – rules for strengthening, weakening, rejecting, or redirecting each hypothesis based on possible outcomes.
7. **Validity and safety notes** – confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.
8. **Evidence classification** – label each claim by provenance level.

# Validation Gates

- **Benchmark fidelity gate:** Reference systems must reproduce known behavior before predictions are trusted.
- **Mechanistic discrimination gate:** Competing pathways must be separated beyond combined method and experimental uncertainty.
- **Control adequacy gate:** Positive, negative, and alternative-pathway controls must be defined and interpreted before claims are finalized.
- **Kinetic consistency gate:** Predicted rate-limiting steps, resting states, and isotope signatures must be mutually consistent.
- **Sensitivity gate:** Conclusions must survive reasonable changes in computational method, model truncation, and environmental assumptions.

# Claim Boundaries

- Do not generalize a mechanism beyond the tested catalyst family, substrate class, reaction type, and medium conditions.
- Do not treat computational feasibility as experimental proof or clinical/industrial viability.
- Distinguish paper-supported observations from agent-generated inferences and speculative extensions.
- Avoid presenting a single mechanistic case as field-wide consensus.

# Failure Modes

- **Model artifact:** Conclusions depend on an unsupported spin state, unsampled conformer, or specific solvation model.
- **Overstated descriptor:** A single redox, steric, or electronic metric is used as a proxy for full mechanism discrimination.
- **Resting-state misassignment:** A stable off-cycle species is mistaken for the turnover-limiting intermediate or active catalyst.
- **False mechanism exclusion:** A plausible pathway is dismissed without orthogonal evidence because it complicates the preferred story.
- **Extrapolation risk:** Mechanistic insights from a model substrate are applied to unrelated substrate classes or catalyst metals without validation.
- **Safety boundary violation:** Operational chemistry is inferred from computational or design-level recommendations.

# Validity Checks

- Have competing mechanisms been compared on the same scaffold and metric set?
- Are thermodynamic and kinetic metrics interpreted separately?
- Could confounding variables (charge, geometry, solvation, proton transfer, leaving-group behavior, aggregation, impurities) explain the result?
- Are observed differences larger than method uncertainty?
- Are structures, descriptors, model choices, and decision rules documented for independent repetition?
- Are conclusions limited to the chemical family, reductant or medium class, and environmental assumptions actually tested?
- Are paper-supported observations distinguished from agent-generated inferences?

# Provenance

- Synthesized from cluster 9.1 (end-to-end mechanism discovery and validation).
- Derived from source skills: computational-pt-prodrug-activation-design, computational-catalysis-mechanism-exploration, iron-catalysis-mechanism-exploration, acid-media-catalysis-mechanism-explorer, ketone-hydroacylation-mechanistic-exploration, dft-guided-catalyst-mechanism-design, mn-catalyzed-alcohol-amine-cn-exploration, organometallic-catalyst-mechanism-exploration.
- Preserves no paper-specific numerical results, operational protocols, or material parameters.
