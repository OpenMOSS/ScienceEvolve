---
name: sci-immune-modular-biomolecular-assembly-mechanism-work-96d97c29
description: End-to-end research planning workflow for architecture-to-function validation in engineered modular biomolecular systems such as proteins, antibodies, and ligand-effector assemblies.
scienceevolve-title: "Antibody and immune recognition · modular biomolecular assembly mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent design rigorous, reusable research plans for modular biomolecular assembly systems where function depends on the correct integration of recognition, delivery or localization, and effector modules. The workflow separates architecture-level hypotheses from module-specific claims, enforces layered validation, and prevents overgeneralization from single-system success.

# When to use

Use this skill when:

- Designing studies for engineered protein, antibody, multichain biologic, or ligand-effector systems.
- Generalizing a modular assembly platform across new module combinations.
- Testing whether recognition, delivery, and effector functions are correctly coupled in a new architecture.
- Diagnosing discordance between binding, assembly, and functional output.
- Planning iterative redesign when one module fails while others succeed.

Do not use this skill for clinical recommendations, operational wet-lab protocols, therapeutic decision-making, or claims that one study establishes field-wide consensus.

# Inputs required

Before producing a plan, request or identify:

- **Research question** and intended biological function.
- **Module inventory**: recognition, delivery or localization, effector, and scaffold elements.
- **Assembly logic** or architectural constraints.
- **Available readouts** for distinguishing product, precursor, and side products or artifacts.
- **Target contexts**: target-positive and target-negative systems for specificity testing.
- **Prior evidence** supporting the assembly mechanism and its limits.
- **Practical constraints**: analytical resolution, reproducibility requirements, and module availability.
- **Safety, ethics, and compliance** boundaries for the research domain.

If any input is missing, state assumptions clearly and label downstream conclusions as provisional.

# Core Workflow

1. **System decomposition and scoping**
   - Decompose the target system into modules: recognition, delivery or localization, effector, and scaffold.
   - Define conserved versus variable elements across candidate designs.
   - State the assembly logic and architectural assumptions inherited from prior work.
   - Identify the most important ambiguity threatening interpretability.

2. **Generate mechanism-linked hypotheses**
   - **Platform hypothesis**: the conserved assembly logic generalizes across variable module combinations.
   - **Position or integrity hypothesis**: module order, orientation, or motif preservation is required for downstream function.
   - **Decoupling hypothesis**: recognition strength and functional output can diverge because post-recognition steps are limiting.
   - **Compatibility hypothesis**: robustness and function remain coupled after module recombination or selection.
   - For each hypothesis, state evidence strength, key assumptions, likely failure modes, and applicable boundaries.

3. **Design minimal viable validation**
   - Define independent variables: module identity, architecture, presence or absence of required elements.
   - Define dependent variables: recognition, assembly integrity, delivery, effector output, specificity.
   - Define blocking variables: preparation quality, batch, detection limits, expression context.
   - Select control classes: positive, negative, module-only, analytical, orthogonal, disruption or integrity, and platform controls.
   - Predefine primary and secondary metrics and the criteria for success, failure, and ambiguity.

4. **Execute layered validation**
   - **Layer A — Material and assembly**: confirm product identity, correct module pairing, and precursor depletion or equivalent assembly evidence.
   - **Layer B — Recognition**: confirm specific target engagement in target-positive versus target-negative contexts.
   - **Layer C — Delivery or localization**: confirm that recognition leads to the required downstream spatial or processing step.
   - **Layer D — Effector function**: confirm the intended functional output and its dependence on an intact effector module.
   - **Layer E — Specificity and robustness**: confirm target-dependent effects exceed nonspecific background and are reproducible across independent preparations.

5. **Decision gates**
   - **Gate 1 — Controls**: Are positive and negative controls interpretable? If no, stop and redesign controls before interpreting candidates.
   - **Gate 2 — Assembly**: Is the intended assembly confirmed and distinguishable from artifacts? If no, revisit architecture or module compatibility.
   - **Gate 3 — Recognition**: Is target engagement specific and reproducible? If no, redesign the recognition module or check target context.
   - **Gate 4 — Delivery**: Is delivery or localization observed when recognition is present? If no, redesign the delivery module or check processing requirements.
   - **Gate 5 — Effector**: Is functional output observed when delivery is intact? If no, redesign the effector module or check context dependence.
   - **Gate 6 — Specificity**: Does the effect depend on the intended target pathway rather than nonspecific toxicity or assay artifacts? If no, treat as uninterpretable or nonspecific; stop or redesign.

6. **Analyze and triangulate**
   - Map observed performance back to proposed architectural elements.
   - Compare intended versus observed mechanism using convergent evidence: function, specificity, perturbation, and structural reasoning.
   - Separate platform effects from module-specific effects via cross-module comparison.
   - Label each conclusion as measured, inferred from model, inferred by analogy, or speculative.

7. **Iterate or terminate**
   - **If supported**: test additional module combinations, add orthogonal confirmation, evaluate functional activity, and map boundary conditions before broadening claims.
   - **If negative**: classify failure as platform failure, module failure, or measurement failure; update the hypothesis and redesign the weakest module.
   - **If mixed**: group successful and unsuccessful modules by shared features; test whether proposed compatibility features predict outcomes in the next round.
   - **Stop conditions**: controls fail; product cannot be distinguished from precursor or artifact; recognition is absent; delivery fails despite recognition; effector fails despite delivery; nonspecific effects dominate; results are irreproducible; or extrapolation would exceed tested module classes, architectures, or target contexts.

# Output Format

Return a structured research plan containing:

1. **Research question** and module decomposition.
2. **Evidence map** distinguishing paper-supported elements, agent-inferred elements, and speculative elements.
3. **Hypothesis table** with statement, mechanistic rationale, evidence strength, key assumptions, likely failure modes, and discriminating test for each hypothesis.
4. **Experimental design** listing variables, control classes, primary and secondary metrics, minimum viable validation set, and predefined stop criteria.
5. **Analysis plan** describing layered interpretation, cross-module comparison, mechanism inference, confounder checks, and uncertainty reporting.
6. **Iteration plan** with update rules for positive, negative, mixed, or ambiguous results, plus the next discriminating experiment and explicit stop conditions.
7. **Validity and safety review** covering confounders, reproducibility requirements, boundary conditions, non-clinical scope, and oversight needs.

# Validation Gates

- **Control interpretability gate**: positive and negative controls must separate before any candidate interpretation.
- **Assembly identity gate**: intended product must be distinguishable from precursor and side products via orthogonal readouts.
- **Recognition specificity gate**: engagement must be demonstrable in target-positive context and reduced in target-negative context.
- **Delivery linkage gate**: functional output must not be attributed to recognition alone; delivery or localization must be plausible and supported.
- **Mechanism dependence gate**: effector function must require intact effector module and the intended target pathway.
- **Reproducibility gate**: primary findings must be consistent across independent preparations, batches, or replicates.
- **Boundary gate**: claims must not exceed the tested module class, architecture, target context, and assay system.

# Claim Boundaries

- Paper-derived evidence supports the workflow pattern, not universal behavior of all modular biomolecular systems.
- Assembly success in one architecture does not prove generality across all molecular formats, targets, or expression contexts.
- Binding or recognition alone does not validate downstream delivery or effector function.
- Functional improvement in one model context does not imply therapeutic benefit, clinical applicability, or human-use safety.
- Computational predictions, structural models, and sequence enrichments are candidate-ranking or hypothesis-generating tools, not empirical proof of mechanism.

# Failure Modes

- Controls fail to separate, rendering results uninterpretable.
- Product signal cannot be distinguished from precursor, aggregate, or analytical artifact.
- Recognition is present but decoupled from functional output due to delivery or effector failure.
- Effector output occurs without target dependence, indicating nonspecificity or assay artifact.
- Robustness and function trade off unpredictably after module recombination or selection.
- Sequence-function mapping is ambiguous due to enrichment bias, founder effects, or sampling artifacts.
- Results depend on unexplained batch effects or irreproducible preparations.
- Structural model conflicts with empirical observation, indicating incorrect modeling assumptions.

# Validity Checks

Before presenting a plan, verify:

- The research question is modular and platform-level, not merely a one-off construct.
- Paper-supported evidence is distinguished from new-system inference and speculation.
- Assembly evidence and functional readouts are considered together, not in isolation.
- Positive, negative, module-only, analytical, orthogonal, and robustness controls are included or justified as unavailable.
- Module diversity is sufficient for the claimed level of generality.
- Analytical readouts can distinguish product, precursor, and side products.
- Batch, stability, preparation quality, and detection limits are addressed.
- Statistical uncertainty and replicate consistency are considered.
- Boundary conditions are stated for module classes, assembly logic, readouts, and target contexts.
- The plan avoids clinical, therapeutic, or human-use claims.
- Safety, ethics, and institutional oversight constraints are acknowledged for the relevant research domain.

# Provenance

- Synthesized from cluster 33, subcluster 33.2.split0.
- Source skills: modular-antibody-assembly-research (309b5df7f9f2fff5), multichain-biologic-assembly-workflow (c0e12cefb965ca48), refolded-antibody-fragment-exploration (841e42c756a1b5b4), antibody-affinity-maturation-research-workflow (9d6f7253c57c5622), structural-epitope-scaffold-design-workflow (9ff2e7ef87b0514e), affinity-ligand-research-design (62efb7cacee4edaf), robust-combinatorial-protein-engineering (a77bc9a751d222f0), targeted-modular-toxin-research-design (2c4bda2f8562d41f).
- Excluded skill IDs: 2f9d4afdf4de26fa, b9ae97fa153d6a98.
