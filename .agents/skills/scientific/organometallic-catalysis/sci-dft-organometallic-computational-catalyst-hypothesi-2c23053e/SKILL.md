---
name: sci-dft-organometallic-computational-catalyst-hypothesi-2c23053e
description: End-to-end reusable workflow for generating mechanistic hypotheses, designing non-operational validation plans, and iterating evidence-based catalyst discovery in organometallic and homogeneous catalysis.
scienceevolve-title: "Organometallic catalysis and DFT · organometallic computational catalyst hypothesis workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

## Purpose

Transform literature mechanistic insights into falsifiable hypotheses for organometallic and homogeneous catalysis research. This skill guides the generation of competing mechanism models, the design of minimal validation matrices with strong controls, and the iterative update of catalyst hypotheses using multi-modal experimental and computational evidence. It is strictly for non-operational research planning; no executable laboratory protocols or hazardous parameters are provided.

## When to use

- When proposing new catalytic transformations, selectivity challenges, or mechanistic questions involving metal-mediated bond activation.
- When migrating a methodological insight from one substrate, ligand, or metal class to a new problem within the same domain.
- When designing conceptual validation plans, control experiments, variable matrices, and iteration strategies.
- When evaluating evidence strength, extrapolation boundaries, and failure modes for catalyst or mechanism hypotheses.

Do not use for executing experiments, providing operational synthetic procedures, elevating single-paper conclusions to field consensus, or making clinical, materials, or environmental application claims.

## Inputs required

- Target reaction class and substrate scope boundaries (e.g., bond activation type, functionalization mode).
- Known or candidate mechanistic pathways, including on-cycle intermediates, rate-determining steps, and competing off-cycle or decomposition routes.
- Literature evidence baseline: verified precedents, structural analogies, or computational predictions.
- Available analytical capabilities (e.g., kinetics, isotopic labeling, in situ spectroscopy, electrochemistry, quantum chemical modeling).
- Safety and compliance constraints defining non-operational boundaries.

## Core Workflow

1. **Define the research gap and boundaries**
   - Identify limitations in existing methods: substrate scope, chemo/regio/stereo-selectivity, mechanistic ambiguity, or sustainability constraints.
   - Formulate a falsifiable research question that contrasts a target pathway against plausible competing pathways.
   - *Decision gate*: If the question lacks a clear mechanistic uncertainty or cannot be addressed with available analytical tools, stop and refine the problem statement.

2. **Generate competing mechanistic hypotheses**
   - Enumerate candidate catalytic cycles, key intermediates, and rate-determining steps.
   - Map perturbable variables to mechanism nodes: metal center, ligand electronics and sterics, substrate structure, activation mode, and reaction partner class.
   - Annotate every hypothesis with:
     - Evidence strength (high / medium / low / tentative).
     - Critical premises (e.g., required coordination geometry, oxidation state accessibility).
     - Expected observables (selectivity trends, kinetic orders, labeling outcomes).
     - Falsification criteria and plausible failure modes.
   - *Decision gate*: If no hypothesis is falsifiable with the planned tools, redesign the analytical approach before proceeding.

3. **Design a minimal viable validation matrix**
   - Select a representative model system that can simultaneously expose the target pathway, the dominant competing pathway, and the key mechanistic variable.
   - Construct a structured variable matrix varying one major dimension at a time: catalyst design, substrate electronics/sterics, coordination environment, or reaction partner category.
   - Define non-operational controls:
     - Positive control: known system confirming analytical detection of target signals.
     - Negative control: absence of a critical structural or catalytic component expected to abolish the target pathway.
     - Competition control: substrate or condition favoring the competing pathway to confirm selectivity origin.
     - Background control: absence of catalyst or energy input to identify non-catalytic processes.
     - Mechanistic probe control: isotopic labeling, structural tagging, or computational counterfactual to distinguish elementary steps.
   - Define evaluation metrics (activity, selectivity, mechanistic consistency, reproducibility) and explicit stop conditions.
   - *Decision gate*: If the matrix requires operational hazardous parameters or lacks a falsification path, halt and revise.

4. **Plan multi-modal evidence integration**
   - Assign evidence types to mechanism nodes:
     - Kinetics for rate-limiting or off-cycle steps.
     - Isotopic labeling for bond cleavage/formation sequences.
     - Spectroscopy/electrochemistry for intermediate identification and oxidation states.
     - Computation for relative barrier heights and intermediate stability, used only as explanatory support.
   - Require cross-validation: no single technique can prove a full catalytic cycle.
   - *Decision gate*: If the plan relies on an unvalidated computational model or a single analytical technique, strengthen orthogonal checks before execution.

5. **Interpret results and map to mechanism nodes**
   - Confirm data quality: verify product identity, mass balance, and detection reliability; exclude artifacts from impurities or single-batch anomalies.
   - Map product distributions (target, competitive, decomposition) to specific mechanism nodes.
   - Distinguish reproducible trends from single-point successes; flag outliers and batch variations.
   - Compare observed trends against hypothesized predictions; if negative controls yield target signals, audit for background reactions or misattribution.
   - *Decision gate*: If results are irreproducible or confounders dominate, pause and audit experimental design before iterating.

6. **Iterate, update, or terminate**
   - **Supported**: If multi-modal evidence consistently supports a hypothesis, narrow the mechanism model. Expand scope only after core mechanism and selectivity origin are stable.
   - **Weakened**: If evidence partially conflicts, revise the mechanism model (e.g., add off-cycle equilibria, revise rate-determining step, adjust ligand/metal assumptions) and design a focused follow-up probe targeting the highest-uncertainty node.
   - **Falsified**: If critical predictions fail, formulate alternative hypotheses or terminate the branch if no viable path remains.
   - **Stop conditions**:
     - Target pathway cannot be distinguished from background or competing pathways.
     - Dominant side reactions or catalyst deactivation lack mechanistic explanation.
     - Key negative controls fail or results are irreproducible across independent attempts.
     - Safety or compliance boundaries are exceeded.
   - *Decision gate*: Before each new iteration, confirm the next experiment addresses the current highest-uncertainty mechanism node and has a clear falsification criterion.

7. **Declare extrapolation boundaries and archive**
   - Explicitly separate verified facts, method analogies, and new inferences.
   - Document negative results and failure modes as boundary definitions, not anomalies.
   - Finalize non-operational safety and ethics review.

## Output Format

Produce a structured conceptual research plan containing:

1. **Trigger assessment** — applicability and task boundaries.
2. **Research question** — domain gap, falsifiable problem, and non-extrapolation limits.
3. **Candidate hypothesis table** — for each hypothesis: mechanism summary, evidence strength, critical premises, expected observables, minimal validation, failure modes, and boundary limits.
4. **Minimal viable validation design** — target pathway, competing pathways, control suite, evaluation metrics, and stop conditions.
5. **Variable matrix** — activity variables, selectivity variables, mechanistic variables, and boundary variables.
6. **Analysis plan** — data quality checks, multi-modal evidence integration rules, and mechanism update rules.
7. **Iteration roadmap** — actions if the hypothesis is supported, weakened, or falsified.
8. **Safety and ethics boundaries** — risk categories, compliance requirements, and non-operational limits.

## Validation Gates

- **Trigger match**: Confirm the task is organometallic/homogeneous catalysis hypothesis generation, not experimental execution or literature summarization.
- **Input completeness**: Verify that reaction type, candidate mechanisms, key variables, evidence sources, and safety boundaries are defined.
- **Hypothesis annotation**: Every hypothesis must carry evidence strength, critical premises, expected signals, and falsification criteria.
- **Control adequacy**: The design must include positive, negative, background, competition, and mechanistic probe controls.
- **Non-operational constraint**: No executable hazardous parameters, doses, temperatures, pressures, or procedural steps are included.
- **Cross-validation requirement**: Mechanistic claims require convergence of at least two independent evidence classes.

## Claim Boundaries

- Distinguish verified literature facts from analogical inferences and newly generated hypotheses.
- Do not present single-system or single-batch observations as universal catalytic principles.
- Computational results serve as explanatory aids, not standalone proofs of mechanism.
- Selectivity and activity trends require reproducible patterns across structurally varied substrates; isolated high-performance examples do not establish generality.
- All conclusions are bounded by the evaluated substrate classes, metal/ligand categories, and reaction conditions under study.

## Failure Modes

- **Hypothesis drift**: Unstated assumptions from a specific precedent are unconsciously migrated to an incompatible new system.
- **Confounder neglect**: Selectivity or activity is attributed to catalyst design when it arises from substrate impurities, background reactions, analytical artifacts, or post-reaction transformations.
- **Single-evidence overreach**: A lone kinetic profile, intermediate detection, or computational energy surface is used to assert a full catalytic cycle.
- **Premature scope expansion**: Broadening the substrate or condition range before the core mechanism and selectivity origin are validated.
- **Irreproducible escalation**: Building iterative plans on unreplicated results without independent replication or orthogonal verification.
- **Safety boundary violation**: Operational or hazardous details slip into the research design.

## Validity Checks

- **Confounding factors**: Audit substrate purity, catalyst precursor state, ligand integrity, solvent/electrolyte background, sensitivity to air/moisture, and analytical calibration.
- **Reproducibility**: Key mechanistic and selectivity conclusions require independent repeats or orthogonal methods; single observations must be flagged as preliminary.
- **Statistical validity**: Report replicate counts, uncertainty ranges, and outlier handling; avoid universalizing isolated high-yield or high-selectivity cases.
- **Mechanistic consistency**: Experimental trends, side-product profiles, isotopic/kinetic data, and computational models must converge; conflicts require model revision rather than forced interpretation.
- **Extrapolation limits**: Clearly mark conclusions as model-system-specific versus cautiously testable in analogous systems.
- **Control sufficiency**: Every major claim requires a corresponding control capable of falsifying it.

## Provenance

- Synthesized from cluster 4, subcluster 4.0 of the scientific skills codex.
- Derived from source skills: test1556 (nickel-migratory-cross-coupling-research-design), test1601 (organometallic-c-c-activation-research-design), test1010 (rhodium-porphyrin-cca-research-design), test1002 (directed-csp3-h-catalysis-exploration), test0904 (organofluorine-ch-functionalization-discovery), test1600 (transition-metal-c-c-activation-research-workflow), test0741 (sustainable-ni-asymmetric-hydrogenation-workflow), test0695 (organometallic-metal-carbon-exploration).
- Workflow archetype: end-to-end scientific workflow for organometallic catalysis hypothesis generation and validation.
