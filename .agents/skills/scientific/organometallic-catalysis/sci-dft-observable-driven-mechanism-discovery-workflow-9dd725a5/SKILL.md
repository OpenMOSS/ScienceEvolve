---
name: sci-dft-observable-driven-mechanism-discovery-workflow-9dd725a5
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in catalytic method development through observable discrimination and controlled boundary mapping.
scienceevolve-title: "Organometallic catalysis and DFT · observable driven mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Guide agents to design transferable research programs in catalytic method development where the central objective is to discover and validate a mechanistic model through observable discrimination, controlled experimentation, and iterative hypothesis updating. The workflow abstracts the common logic of gap-driven hypothesis generation, minimal validation, structure-reactivity analysis, and boundary mapping without embedding any single paper’s specific chemical system.

# When to use

Trigger this skill when a user asks to:

- Propose new research questions, mechanistic hypotheses, or experimental plans in catalytic method development (e.g., C–H activation, cross-coupling, asymmetric catalysis, carbonylation, annulation, or related bond-forming chemistry).
- Design minimal validation studies, substrate-scope logic, or control strategies to discriminate among competing mechanistic pathways.
- Analyze structure-reactivity trends, update hypotheses based on unexpected outcomes, or define the boundaries of a proposed transformation.
- Evaluate whether a catalyst concept, ligand design, or substrate class should advance to broader scope or robustness testing.

Do not use this skill to reproduce exact reaction conditions as protocols, to provide operational laboratory instructions, or to claim field-wide consensus from a single source.

# Inputs required

Before executing the workflow, request or infer:

- **Target transformation**: desired bond formation, product class, and synthetic bottleneck.
- **Mechanistic gap**: why existing methods are insufficient (scope, selectivity, functional-group tolerance, step economy, or mechanistic ambiguity).
- **Candidate platforms**: generic catalyst families, ligand concepts, or activation modes under consideration.
- **Substrate boundaries**: representative substrate classes, likely competing reactive sites, and suspected limiting features (electronics, sterics, heteroatoms).
- **Analytical readouts**: available non-operational metrics such as conversion, selectivity, product identity, byproduct profile, and reproducibility indicators.
- **Constraints**: safety, regulatory, environmental, scalability, and facility boundaries.
- **Prior evidence**: literature precedent, preliminary data, and whether evidence is demonstrated, inferred, or speculative.

# Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Frame the mechanistic gap**
   - Define the target transformation and the specific underexplored case.
   - Identify the competing pathways or selectivity bottlenecks that existing methods fail to control.
   - State explicitly why the gap is mechanistic rather than merely empirical.

2. **Generate ranked hypotheses**
   - Formulate a central mechanism-linked hypothesis predicting how the catalyst environment controls the desired pathway.
   - List at least two alternative hypotheses covering competing activation, deactivation, or selectivity modes.
   - For each hypothesis, assign:
     - **Evidence strength** (strong / moderate / weak / speculative).
     - **Key assumptions** required for the hypothesis to hold.
     - **Predicted observable** that would support it.
     - **Likely failure mode** and diagnostic observation that would indicate it.
   - *Decision gate*: Proceed only if the central hypothesis is mechanistically coherent and testable with available readouts.

3. **Design minimal discriminating validation**
   - Select one representative substrate and one representative coupling partner that can test the core bond-forming event.
   - Define a small variable matrix tied to mechanistic questions (e.g., catalyst family, ligand class, medium class, additive concept) rather than arbitrary optimization.
   - Establish controls:
     - **Negative**: omission of catalyst or key enabling component; substrate lacking the proposed directing feature.
     - **Positive/benchmark**: known related transformation or established platform for comparison.
     - **Mechanistic probe**: variant designed to distinguish competing pathways (e.g., electronic perturbation, steric block, or pathway trap).
     - **Robustness**: sensitivity to trace components or competing species.
   - Predefine success criteria (detectable desired product, selectivity threshold, reproducibility) and stopping conditions (no product above background, irreproducible results, controls contradict the proposed pathway, safety/compliance barriers).

4. **Observe and record**
   - Collect primary metrics (product formation, selectivity, conversion) and secondary metrics (byproduct distribution, mass balance, catalyst stability).
   - Record all outcomes including failures, unexpected products, and control results.
   - *Decision gate*: If product identity is unconfirmed or mass balance is unacceptably poor, pause interpretation and return to analytical validation before proceeding.

5. **Analyze and classify evidence**
   - Confirm product identity with orthogonal structural evidence before interpreting trends.
   - Compare outcomes across variables using matched controls; separate signal from noise.
   - Build a structure-reactivity map grouping substrates by electronic, steric, and coordination features.
   - Classify each conclusion as:
     - **Observed**: directly supported by current data.
     - **Inferred**: consistent with observations but not directly proven.
     - **Extrapolated**: extended beyond the tested system and requiring validation.
   - *Decision gate*: If the evidence supports the central hypothesis unambiguously, proceed to boundary mapping. If it is ambiguous, design orthogonal probes and return to step 3. If it contradicts the hypothesis, stop the current branch and return to step 2 to reformulate the bottleneck.

6. **Map boundaries and robustness**
   - Systematically vary one structural feature at a time (electronics, sterics, heteroatom content, ring size, substitution pattern) to locate scope limits.
   - Include substrates expected to fail in order to define mechanistic boundaries.
   - If translational claims are intended, test realistic feed composition or competing species only after purified-substrate performance is established.
   - *Decision gate*: Stop scope expansion if results depend on uncontrolled variables, if failures are ignored, or if no mechanistic explanation exists for the boundary.

7. **Consolidate model and define claim boundaries**
   - Update the mechanistic model to account for both successful and failed cases.
   - State clearly which claims are demonstrated, inferred, or speculative.
   - Define the limits of generality: substrate classes, condition classes, and mechanistic assumptions that must hold.
   - *Stop condition*: Terminate iteration when the model explains the observed boundary, when further expansion no longer tests a meaningful hypothesis, or when safety/compliance constraints prevent meaningful validation.

8. **Iterate or archive**
   - If the updated model predicts a new discriminating experiment, return to step 3 with the revised hypothesis.
   - If the model is sufficiently validated and bounded, archive the final research plan with explicit validity checks and provenance.
   - If repeated iterations show no coherent structure-function relationship, abandon the current hypothesis and document the negative result as a boundary finding.

# Output Format

When using this skill, return the following sections in order:

1. **Research question** — concise gap-driven question and its scientific rationale.
2. **Evidence basis** — table or list separating prior support, source-paper analogy, and speculative extrapolation.
3. **Ranked hypotheses** — central and alternative hypotheses with evidence strength, assumptions, predicted observables, and failure modes.
4. **Minimal validation plan** — representative case, variable classes, control set, evaluation metrics, and stopping conditions.
5. **Analysis plan** — data classification rules, structure-reactivity mapping approach, mechanistic interpretation standards, and visualization strategy.
6. **Iteration rules** — decision tree for supported, ambiguous, contradicted, or inconclusive outcomes.
7. **Claim boundaries** — explicit limits on generality, extrapolation, and evidence strength.
8. **Validity and safety checks** — confounders, reproducibility requirements, boundary conditions, and non-operational risk constraints.

# Validation Gates

Before advancing between stages, enforce these gates:

- **Gap validity**: The problem is framed as underexplored or mechanistically unresolved, not as a proven limitation.
- **Hypothesis coherence**: The central hypothesis links catalyst/substrate features to observable outcomes through a plausible mechanistic sequence.
- **Control adequacy**: Negative, positive, mechanistic, and robustness controls are defined before data collection.
- **Data quality**: Product identity is structurally confirmed; major byproducts are tracked; mass balance is sufficient for interpretation.
- **Reproducibility**: Key outcomes are supported by independent repeats or consistent trends, not single observations.
- **Scope validity**: Substrate scope includes boundary cases and likely failures; failures are interpreted as mechanistic evidence.
- **Safety/compliance gate**: Experimental recommendations remain at the non-operational design level; hazardous, regulated, or high-risk parameters are flagged for institutional review rather than prescribed.

# Claim Boundaries

- Distinguish **demonstrated** claims (directly supported by the current validation), **inferred** claims (mechanistically plausible but not directly proven), and **speculative** claims (extrapolated to untested substrate/condition classes).
- Do not treat single-source findings as field-wide consensus.
- Do not extrapolate results from one substrate class to all related systems without mechanistic justification.
- Avoid claiming operational protocols, scale-up readiness, or downstream utility (clinical, environmental, industrial) from method-development data alone.
- Keep all condition recommendations at the class level (e.g., catalyst family, solvent polarity class) rather than as executable recipes.

# Failure Modes

Common ways the workflow or underlying research plan can fail:

- **Catalyst deactivation or speciation**: The active species is not formed or is unstable under the proposed conditions.
- **Competing pathway dominance**: A side reaction (e.g., homocoupling, elimination, decomposition) outcompetes the desired branch.
- **Non-reproducible results**: Yield or selectivity depends on uncontrolled variables such as trace impurities, atmosphere, or substrate quality.
- **Analytical misassignment**: Product identity is inferred without orthogonal confirmation, leading to false mechanistic conclusions.
- **Confounding variables**: Apparent trends are driven by solubility, phase behavior, or analytical bias rather than mechanism.
- **Overgeneralization**: The method appears robust for a narrow model substrate but fails upon boundary mapping; generality is claimed without mechanistic support.
- **Safety or compliance barrier**: The proposed chemistry involves hazardous reagents, uncharacterized reactive intermediates, or regulated materials without defined institutional oversight.

# Validity Checks

Before finalizing any output, verify:

- **Mechanistic specificity**: Does the outcome require the proposed catalyst/substrate interaction, or could background chemistry explain it?
- **Control completeness**: Are negative, positive, benchmark, mechanistic, and robustness controls included and matched?
- **Confounder review**: Have catalyst speciation, substrate purity, reagent stability, impurity effects, solubility, and analytical variability been considered?
- **Statistical rigor**: Are replicate counts, uncertainty ranges, and predefined endpoints appropriate for the claim strength?
- **Boundary clarity**: Are electronic, steric, coordination, and functional-group limits explicitly stated?
- **Extrapolation limits**: Are new substrate classes, catalyst designs, or applications clearly labeled as untested?
- **Evidence labeling**: Is every major claim tagged as observed, inferred, or extrapolated?
- **Non-operational safety**: Are experimental details limited to research-design variables, with hazardous or high-risk operations flagged for expert review?

# Provenance

Synthesized from cluster 2.1 (observable-driven mechanism discovery and validation), drawing on the following source skills: test0198, test1531, test0781, test1529, test1275, test0192, test1584, test1358. Source-specific chemical systems, numerical results, and paper conclusions have been abstracted into a domain-neutral workflow; no operational protocols or material-specific parameters are preserved.
