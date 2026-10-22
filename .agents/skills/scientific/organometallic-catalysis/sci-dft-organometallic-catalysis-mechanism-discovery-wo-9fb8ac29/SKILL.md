---
name: sci-dft-organometallic-catalysis-mechanism-discovery-wo-9fb8ac29
description: A reusable end-to-end workflow for generating, testing, and iterating mechanistic hypotheses in organometallic catalysis through orthogonal evidence and discriminating controls.
scienceevolve-title: "Organometallic catalysis and DFT · organometallic catalysis mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

## Purpose

This skill guides an agent to transform an organometallic catalysis problem into a structured, mechanism-first research program. It abstracts the shared logic across diverse catalytic systems—bond activation, selectivity control, catalyst speciation, and turnover—into a transferable workflow for hypothesis generation, minimal validation, evidence grading, and iterative model refinement. The goal is not to reproduce a specific reaction, but to apply a reproducible scientific pattern: define the gap, enumerate competing pathways, design experiments that distinguish them, and update beliefs only when orthogonal evidence converges.

## When to use

Use this skill when the task involves proposing new research questions, designing validation plans, or interpreting ambiguous results in homogeneous organometallic catalysis. It applies to reaction discovery, catalyst optimization, scope expansion, and mechanistic studies where competing pathways must be discriminated. It is appropriate for any metal class, ligand architecture, or substrate family where the central uncertainty concerns how bonds are made, broken, or controlled. Do not use this skill to provide executable laboratory procedures, hazardous operational parameters, or as a substitute for expert safety review and primary literature assessment.

## Inputs required

- **Target transformation class:** the bond-forming or bond-breaking event of interest, stated conceptually rather than as an executable protocol.
- **Candidate catalyst system features:** metal family, ligand class, additive role, and known or hypothesized active species.
- **Substrate design space:** substrate classes, directing groups, steric and electronic variables, and competing reactive sites.
- **Available analytical and computational capabilities:** spectroscopy, kinetic monitoring, isotopic labeling, trapping, structural characterization, and modeling.
- **Benchmark or reference system:** for comparative validation and positive controls.
- **Prior observations:** failed attempts, known decomposition pathways, or boundary conditions that should constrain hypothesis ranking.
- **Safety and regulatory constraints:** defining permissible experimental directions and institutional boundaries.

## Core Workflow

1. **Frame the mechanistic gap.** Define the unresolved elementary step, selectivity origin, active-species identity, or catalyst limitation. Distinguish practical gaps from mechanistic gaps.  
   *Decision gate:* If the question can be answered by literature precedent alone or is purely empirical optimization without mechanistic uncertainty, stop and redirect to an appropriate screening or optimization workflow.

2. **Build competing mechanistic hypotheses.** Generate a ranked set of hypotheses covering distinct catalytic manifolds. For each, specify the proposed active species, key elementary steps, evidence strength, key assumptions, discriminating predictions, and likely failure modes.  
   *Decision gate:* If the hypotheses are not experimentally discriminable with available tools, refine the question or stop.

3. **Design minimal viable validation.** Select representative substrates that can distinguish the top hypotheses. Define a variable matrix that isolates one mechanistic lever at a time. Specify blank, negative, positive, mechanistic, and orthogonality controls. Predefine success, ambiguity, and failure readouts.  
   *Decision gate:* If no control can falsify the leading hypothesis, redesign before proceeding.

4. **Collect orthogonal evidence.** Gather observables from multiple independent techniques: product distribution, selectivity, kinetic traces, intermediate detection, isotope effects, spectroscopic signatures, and computational trends. Maintain explicit separation between raw observation and mechanistic inference.  
   *Decision gate:* If product identity, mass balance, or reproducibility is uncertain, pause interpretation and resolve analytical issues.

5. **Grade evidence and compare pathways.** Map each observation to the mechanism map. Classify hypotheses as supported, weakened, refuted, or unresolved. Apply evidence grading: strong (three or more converging diagnostics), moderate (two), weak (single readout), contradictory (conflicting diagnostics).  
   *Decision gate:* If evidence is weak or contradictory, do not expand scope; design a targeted discriminating experiment.

6. **Update the mechanism map.** Revise the catalytic cycle by adding confirmed intermediates, pruning refuted branches, and flagging off-cycle resting states. Re-rank remaining hypotheses by evidence strength and feasibility of further tests.  
   *Decision gate:* If the updated model implies a fundamentally different research question, pivot rather than incrementally optimize.

7. **Iterate or stop.**  
   - *Continue* if a hypothesis is supported but boundary conditions remain untested; design boundary-mapping experiments.  
   - *Refine* if results are ambiguous and a clear discriminator exists.  
   - *Pivot* if the leading hypothesis is refuted or an unexpected pathway is indicated.  
   - *Stop* if: (a) orthogonal negative evidence refutes the premise; (b) competing mechanisms remain indistinguishable and no feasible discriminator exists; (c) decomposition or uncontrolled side reactivity dominates; (d) results are irreproducible after analytical correction; (e) safety or compliance barriers cannot be mitigated.

## Output Format

When using this skill, return:

1. **Research question and scope** — target transformation, mechanistic uncertainty, and scientific rationale.
2. **Gap map** — what is known by precedent versus what remains unresolved in the new system.
3. **Ranked hypotheses** — hypothesis statement, mechanistic rationale, evidence strength, key assumptions, predicted observations, and failure modes.
4. **Minimal validation design** — representative substrate logic, variable matrix, control strategy, evaluation metrics, and stop conditions.
5. **Mechanism map** — plausible catalytic cycles with confirmed, proposed, and refuted branches.
6. **Analysis plan** — orthogonal evidence strategy, evidence-grading rules, and decision criteria.
7. **Iteration plan** — how results update hypotheses and what triggers pivot or stop.
8. **Validity and safety notes** — confounding factors, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Mechanistic specificity:** each experiment must distinguish between at least two plausible mechanisms.
- **Control adequacy:** blank, negative, positive, and mechanistic controls are present and address alternative explanations.
- **Orthogonal evidence:** conclusions rely on more than one independent measurement type.
- **Reproducibility:** key observations are replicated across independent samples or datasets.
- **Analytical validity:** product identity, calibration, mass balance, and signal ambiguity are addressed before mechanistic interpretation.
- **Statistical validity:** comparative claims are supported by replicated measurements or explicit uncertainty estimates.
- **Boundary awareness:** claims are limited to tested substrate, metal, ligand, and condition classes.

## Claim Boundaries

- Treat literature precedents as hypotheses for the new system unless reproduced under the new metal, ligand, substrate, and condition class.
- Distinguish source-paper observations, benchmark evidence, computational inference, and new-agent speculation with clear labels.
- Limit catalytic claims to systems where turnover is distinguished from stoichiometric reactivity and catalyst stability is assessed.
- Do not generalize from a single substrate or condition set to broad scope without boundary testing.

## Failure Modes

- No conversion or uncontrolled decomposition dominates the outcome.
- Off-cycle resting state or catalyst deactivation obscures the productive pathway.
- Competing background reactivity, heterogeneous particles, or impurities mimic catalytic behavior.
- Selectivity arises from substrate bias rather than catalyst control.
- Analytical artifacts such as signal overlap, calibration error, or isolation bias generate false mechanistic inferences.
- Computational models lack relevant speciation, solvent effects, or conformational sampling.
- Apparent additive or ligand effects mask decomposition, precipitation, or medium changes.

## Validity Checks

- Does the plan compare at least two plausible mechanisms with discriminating predictions?
- Are primary bond activation and downstream product-forming events clearly separated?
- Does each hypothesis include expected diagnostics and failure modes?
- Are activation parameters, solvent effects, and isotope effects treated as conditional diagnostics rather than standalone proof?
- Is the evidence ladder explicit, ranking observations from weak to strong?
- Are scope trends used to update the mechanistic model rather than treated as isolated optimizations?
- Are safety, ethics, and compliance boundaries stated at the research-design level?

## Provenance

- Derived from cluster 8.0 (organometallic-catalysis-mechanistic-catalyst-mechanism-discovery-workflow) via semantic merge of representative source skills: test1561, test0543, test1721, test0183, test1512, test1620, test0737, test1413.
- Synthesized from shared workflow patterns: observable-driven mechanism discovery, evidence-ladder construction, discriminating control design, and iterative model refinement in homogeneous organometallic catalysis.
