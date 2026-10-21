---
name: sci-catalysis-catalytic-mechanism-discovery-validation-d55c26c3
description: Observable-driven end-to-end workflow for generating mechanism-informed hypotheses, designing minimal validation studies with strong controls, and iterating to discriminate catalytic pathways while bounding claims.
scienceevolve-title: "Asymmetric catalysis · catalytic mechanism discovery validation workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Convert a catalytic transformation problem into a mechanism-guided, evidence-graded research plan. This workflow helps agents localize cycle bottlenecks, propose competing pathway hypotheses, adjudicate them with orthogonal experimental and computational controls, and iterate explicitly while preventing overgeneralization.

## When to use

Use this workflow when the user asks to:
- Design studies in directed catalysis, asymmetric synthesis, C–H functionalization, cascade/multicomponent reactions, or stereodivergent organocatalysis.
- Explain how a ligand, additive, promoter, or auxiliary species alters a catalytic cycle or selectivity profile.
- Evaluate a new precatalyst, chiral scaffold, or underexplored ligand class against a benchmark platform.
- Investigate metallaphotoredox, main-group activation, or bond-activation mechanisms where reactive intermediates are proposed.
- Convert an unexpected observation into a testable mechanistic hypothesis.

Do not use this workflow as an executable laboratory recipe, as a substitute for qualified safety review, or to assert field-wide consensus from a single-system study.

## Inputs required

Before starting, collect or infer:
- **Target transformation:** substrate and product classes, desired selectivity, and known limitations.
- **Baseline observation:** the no-catalyst, no-additive, or standard-condition outcome that defines the gap.
- **Candidate bottleneck:** activation, insertion, elimination, catalyst regeneration, stereocontrol, or stability limitation.
- **Candidate variable class:** ligand family, additive type, chiral environment, or activation mode described by mechanistic feature, not copied identity.
- **Evidence sources:** available spectroscopy, isotope probes, competition experiments, computational methods, and literature benchmarks.
- **Constraints:** safety, compliance, analytical access, and reproducibility requirements.

If inputs are missing, state assumptions and propose the smallest study that can still yield interpretable evidence.

## Core Workflow

1. **Frame the mechanistic gap**
   - Define the catalytic bottleneck and the observable anomaly that motivates the study.
   - State the minimum contrast needed to claim a mechanism change (e.g., selectivity shift, rate enhancement, altered product distribution).
   - *Decision gate:* If the bottleneck cannot be articulated or the baseline is uninterpretable, stop and refine the research question.

2. **Generate competing, falsifiable hypotheses**
   - Map shared early intermediates and plausible branch points.
   - For each candidate mechanism, produce a hypothesis card containing:
     - Core claim and mechanistic model.
     - Predicted observations and discriminating tests.
     - Alternative explanations and non-specific effects.
     - Failure modes and boundary conditions.
     - Evidence strength (low / moderate / high).
   - Prioritize hypotheses that compare at least two plausible pathways and can be rejected with a focused control set.
   - *Decision gate:* If no hypothesis can be falsified by an achievable experiment, return to Step 1.

3. **Design minimal viable validation**
   - Choose a model system that retains the target stereochemical or mechanistic challenge.
   - Vary one dominant mechanism axis at a time (e.g., catalyst family, substrate organization element, activation mode).
   - Build a control lattice:
     - Negative / background control.
     - Positive or benchmark control.
     - Component-only and inactive-analog controls.
     - Substrate-off or mismatched-stereochemistry controls.
     - Boundary substrate designed to challenge the hypothesis.
   - Predefine primary metrics (conversion, selectivity, product identity) and secondary metrics (speciation, stability, reproducibility).
   - Set explicit stop conditions: controls fail, impurities dominate, background explains the effect, or safety thresholds are exceeded.
   - *Decision gate:* If the plan lacks a control that can reject the central claim, redesign before execution.

4. **Collect and analyze evidence**
   - Confirm product/intermediate identity with orthogonal methods before mechanistic interpretation.
   - Evaluate the control hierarchy first; reject claims if background, components, or generic effects reproduce the outcome.
   - Discriminate pathways using converging evidence (spectroscopic trends, isotope effects, competition experiments, computational rationalization).
   - Grade each conclusion:
     - **Direct:** supported by structural/analytical observation plus coherent mechanism.
     - **Strong functional:** reproducible performance with clean controls.
     - **Mechanism-consistent:** fits the model but lacks independent pathway proof.
     - **Exploratory:** single observation or analogy-based.
     - **Unsupported:** contradicted by controls or absent evidence.
   - *Decision gate:* If experimental and computational evidence conflict and cannot be reconciled with added controls, pause expansion and revise the mechanism model.

5. **Iterate or pivot**
   - **Strengthen:** If results support one hypothesis and controls pass, refine the model and test boundary scope.
   - **Diagnose:** If results are ambiguous, add mechanism probes (radical traps, labeling, alternative substrates) before broadening scope.
   - **Revise:** If results falsify the hypothesis, return to Step 2 with an updated intermediate or bottleneck model.
   - **Stop:** Halt if reproducibility fails, active-species diagnostics conflict with the precatalyst model, a component-only control explains the effect, or product identity is uncertain.
   - *Iteration rule:* Change the fewest variables needed to test the limiting locus; re-run minimal validation before expanding.

6. **Bound claims and report**
   - Restrict conclusions to the tested substrate class, catalyst/ligand family, and evidence regime.
   - Separate observations from inferences and label evidence grades explicitly.
   - Document residual untested assumptions and conditions where the hypothesis is expected to weaken or fail.

## Output Format

Return a structured research package containing:
1. **Research question:** the bottleneck and why it matters.
2. **Ranked hypotheses:** at least three candidates with evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
3. **Study plan:** model system, variable matrix, control lattice, metrics, and stop conditions.
4. **Analysis plan:** identity confirmation hierarchy, mechanism-discrimination logic, evidence-grading rules, and visualization approach.
5. **Iteration plan:** update rules for positive, negative, ambiguous, and confounded outcomes.
6. **Validity statement:** scope limits, confounders, reproducibility requirements, safety boundaries, and evidence grades.

## Validation Gates

Before advancing past each decision gate, confirm:
- **Scope discipline:** Claims are limited to tested classes and conditions.
- **Confound separation:** Impurities, counterions, fragments, solvent effects, and decomposition are ruled out.
- **Control adequacy:** Negative, benchmark, component, and boundary controls are included and interpreted first.
- **Reproducibility:** Key observations are repeatable with verified materials and methods.
- **Mechanistic convergence:** Multiple evidence types point to the same pathway, or disagreements are explained.
- **Boundary clarity:** Conditions where the hypothesis should weaken or fail are stated.
- **Evidence grading:** Every conclusion is labeled by strength and separated from speculation.

## Claim Boundaries

- Treat single-system or single-paper observations as hypotheses, not field consensus.
- Do not transfer exact chemical identities, quantities, temperatures, or operational parameters to new systems.
- Distinguish scaffold-level conclusions from reaction-specific conclusions.
- Do not infer therapeutic, environmental, or commercial utility from catalytic feasibility or computational descriptors alone.
- Label agent-inferred extensions to new metals, ligands, or substrates as provisional.

## Failure Modes

- **Misattributed specificity:** The intact catalyst or ligand is claimed essential, but a component-only control reproduces the effect.
- **Confounding:** Impurities, additives, or background reactivity mimic the proposed mechanism.
- **Analytical misassignment:** Product, intermediate, or stereochemical identity is incorrect, corrupting mechanistic interpretation.
- **Overgeneralization:** A successful model system is expanded before boundary cases or reproducibility are established.
- **Mechanism-experiment mismatch:** The experimental design cannot distinguish between competing pathways.
- **Speciation error:** The isolated precatalyst or resting state is mistaken for the active species.
- **Selectivity-reactivity tradeoff ignored:** Optimization of one metric obscures loss of another.

## Validity Checks

Before presenting final conclusions, verify:
- The benchmark reaction is sensitive to the structural or mechanistic feature being tested.
- Stereochemical assignments are supported by independent analytical evidence.
- Comparative claims include appropriate baselines and uncertainty estimates.
- Computational or modeling rationalizations are considered only after experimental controls.
- At least one likely out-of-scope case has been examined or acknowledged.
- All operational wet-lab steps remain at the research-design level; no hazardous procedural details are included.

## Provenance

Synthesized from cluster 24.0 (observable-driven mechanism discovery and validation). Source skills: cycle-bottleneck-additive-discovery (10.1002_anie.202505454), green-cascade-scaffold-discovery (10.32628_ijsrch251035), asymmetric-ch-functionalization-stereocontrol (10.1021_acs.orglett.4c02692), organophosphorus-electrophilic-activation-research (10.1007_s12633-020-00598-9), metallaphotoredox-ch-functionalization-exploration (10.1021_jacs.6b08397), chiral-ligand-platform-research (10.1002_ange.201713304), nhc-stereodivergent-catalysis-research (10.1021_ol802739d), spo-gold-catalyst-research-workflow (10.1021_om500568q).
