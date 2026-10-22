---
name: sci-dft-catalysis-mechanism-discovery-validation-workfl-aa067e5b
description: Observable-driven mechanism discovery and validation workflow for catalysis research. Use to transform mechanistic ambiguities into competing-pathway hypotheses, controlled validation plans, and iterative research designs across homogeneous, heterogeneous, and main-group catalytic systems.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis mechanism discovery validation workflow 2"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Use this skill to convert a catalytic performance gap, selectivity anomaly, or mechanistic ambiguity into a structured, testable research plan. The goal is to discriminate among competing mechanistic pathways, link elementary-step descriptors to observable outcomes, and iterate between hypothesis generation and validation without relying on overall conversion metrics alone.

# When to use

Use this skill when:

- The target problem involves plausible but unresolved mechanistic pathways.
- Activity, selectivity, or catalyst stability cannot be explained by a single performance metric.
- Experimental or computational evidence suggests competing activation modes, oxidation states, or off-cycle routes.
- You need to design minimal, controlled comparisons to test a mechanistic claim.
- You are planning computational screening, conceptual experimental design, or integrated mechanism-guided catalyst redesign.

Do not use this skill for operational laboratory protocols, safety-critical execution, or as a substitute for domain-specific expert review.

# Inputs required

Before using the skill, collect:

- Target transformation and desired product classes.
- Candidate catalyst, material, or active-site families.
- Known activity, selectivity, inactivity, or stability trends.
- Plausible intermediates, elementary steps, and competing pathway families.
- Available evidence (computational, spectroscopic, kinetic, or structural) and its uncertainty.
- Constraints on validation resources and feasible readouts.
- Safety, ethics, and compliance boundaries relevant to the chemical system.

If any input is missing, state the assumption explicitly and mark resulting hypotheses as lower confidence.

# Core Workflow

1. **Frame the mechanistic gap**
   - State the specific ambiguity: bottleneck, selectivity branch, unexpected anomaly, or missing regeneration step.
   - Identify why the accepted mechanism is insufficient.

2. **Map competing pathways**
   - Construct at least two plausible catalytic cycles or mechanism families.
   - Include key intermediates, transition states, resting states, and product-forming or deactivation branches.
   - Mark uncertain or unsupported branches.

3. **Generate discriminating hypotheses**
   - Propose one perturbation at a time (catalyst feature, substrate class, environment, or representation).
   - For each hypothesis, define:
     - mechanistic claim;
     - predicted descriptor shift;
     - expected activity or selectivity consequence;
     - key assumptions;
     - possible failure modes;
     - evidence strength (low / medium / high).
   - Separate prior observations from new-system inferences.

4. **Design minimal validation**
   - Define independent variables (catalyst class, ligand or surface motif, substrate feature, pathway representation).
   - Define controlled factors (reference states, comparison rules, model consistency).
   - Include:
     - **Positive control:** known behavior matching the target mechanism.
     - **Negative control:** system lacking the proposed key feature.
     - **Strong control:** matched comparison isolating one mechanistic variable.
     - **Ambiguity control:** comparison distinguishing competing pathway families.
     - **Robustness control:** sensitivity check for model, descriptor, or representation choices.
   - Specify evaluation metrics at descriptor, mechanism, and prediction levels.
   - Define stop conditions before execution.

5. **Execute analysis**
   - Compare pathways under matched assumptions (reference frame, charge, spin, stoichiometry).
   - Quantify uncertainty: model sensitivity, conformer coverage, omitted species.
   - Triangulate evidence across energy profiles, structural descriptors, and experimental trends.
   - Label every claim as directly computed, literature-supported, inferred by analogy, or unresolved.

6. **Decision gate: Evaluate against validation criteria**
   - **Pass:** Hypothesis survives matched controls, robustness checks, and external anchors; proceed to boundary testing or scope expansion.
   - **Partial:** Mechanism is plausible but context-dependent; redesign to isolate the unresolved variable.
   - **Fail:** Descriptor rankings reverse, validation anchors conflict, or assumptions are unsupported; reject or pivot.

7. **Iterate or terminate**
   - If supported: expand to the next uncertainty (selectivity, robustness, boundary condition).
   - If ambiguous: add the smallest discriminator that resolves the tie.
   - If contradicted: diagnose failure mode (wrong bottleneck, wrong descriptor, off-cycle pathway, representation error) and revise the mechanism map.
   - **Stop conditions** (terminate current branch):
     - Repeated contradictory evidence from independent tests.
     - Conclusions depend entirely on a single non-robust model choice.
     - Required validation exceeds safety or compliance boundaries.
     - Mechanism ambiguity cannot be resolved with available evidence.

# Output Format

Produce the following structure:

1. **Research question** — one-sentence mechanistic question and why it matters.
2. **Mechanism map** — target pathway, competing pathways, key intermediates, uncertainty flags.
3. **Hypotheses** — table with claim, predicted descriptor shift, key assumption, failure mode, and evidence strength.
4. **Validation plan** — minimal viable validation, controls, metrics, and stop conditions.
5. **Analysis plan** — descriptors, controlled comparisons, external anchors, uncertainty treatment.
6. **Iteration plan** — next uncertainty, update rules, and boundary conditions for extrapolation.
7. **Validity and safety notes** — confounders, reproducibility risks, and non-operational safety constraints.

# Validation Gates

Before advancing past each phase, confirm:

- **Mechanistic completeness:** Every pathway starts from a defensible active species and closes the cycle or explains deactivation.
- **Pathway comparability:** Competing routes use consistent stoichiometry, charge, spin, and thermodynamic reference.
- **Control strength:** At least one strong control and one robustness check are included.
- **Descriptor validity:** The descriptor is mechanistically linked to the proposed bottleneck or selectivity branch, not merely correlative.
- **External agreement:** Known active, inactive, selective, or unselective cases fit the same mechanism map.
- **Reproducibility:** Assumptions, inputs, and comparison rules are explicit enough for independent repetition.

# Claim Boundaries

- Limit conclusions to the tested catalyst family, substrate class, and pathway set.
- Label evidence strength for every claim (low / medium / high).
- Distinguish computed results from experimental observations from analogical inferences.
- Do not present single-study or single-system findings as field-wide consensus.
- Avoid extrapolating beyond the validated mechanism map.

# Failure Modes

- Descriptor rankings reverse under plausible model or representation changes.
- The mechanism cannot distinguish competing pathway families.
- Validation anchors conflict with the proposed trend.
- The descriptor explains activity but not selectivity (or vice versa) without justification.
- Unsupported assumptions about active species, resting state, or coverage/speciation.
- Method sensitivity: conclusions depend on one functional, basis set, solvation model, or untested spin state.
- Confounding: catalyst identity, site type, environment, and representation effects are entangled.

# Validity Checks

Before finalizing output, verify:

- **Confounding:** Are catalyst identity, site type, environment, and representation effects separated?
- **Reference consistency:** Are reference states and comparison rules consistent across variants?
- **Descriptor relevance:** Does the descriptor connect to a mechanistically meaningful step?
- **Robustness:** Do qualitative conclusions survive plausible descriptor or model changes?
- **Selectivity separation:** Are target-product and byproduct pathways evaluated separately?
- **External agreement:** Do known benchmarks fit the proposed mechanism?
- **Uncertainty:** Are uncertainties large enough to reverse the proposed ranking?
- **Boundary:** Are conclusions limited to supported systems and states?
- **Reproducibility:** Are inputs, assumptions, and decision rules documented?
- **Evidence labeling:** Are claims separated into directly supported, indirectly supported, and speculative?

# Provenance

Synthesized from cluster 18 / subcluster 18.0 ("observable-driven mechanism discovery and validation"). Derived from source skills: surface-reaction-mechanism-explorer, rh-catalyzed-ch-functionalization-mechanism-exploration, organometallic-metathesis-catalyst-exploration, computational-organometallic-catalysis-mechanism-design, mechanism-first-main-group-catalyst-research, computational-amide-activation-research, asymmetric-catalysis-mechanism-guided-exploration, wgs-catalysis-mechanism-exploration.
