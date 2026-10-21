---
name: sci-aqueous-aqueous-metal-battery-interface-mechanism-w-388b6611
description: A reusable end-to-end workflow for designing, validating, and iterating mechanistic hypotheses about interfacial stability in aqueous metal batteries through converging multi-scale evidence and strong controls.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal battery interface mechanism workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Use this skill to convert an observed interfacial instability in aqueous metal batteries into a structured, reusable mechanism-discovery workflow. It guides an agent to frame coupled failure modes, generate falsifiable mechanistic hypotheses, design minimal validation experiments with hierarchical controls, triangulate multi-scale evidence, and iterate based on mechanism–performance alignment without treating single-study observations as field-wide consensus.

## When to use

Trigger this skill when the user asks to:
- Propose new research questions or hypotheses for aqueous metal battery interfaces, electrolytes, separators, additives, or coatings.
- Design validation plans for deposition control, side-reaction suppression, solvation regulation, or transport homogenization.
- Critique or improve an existing research plan by strengthening controls, mechanistic specificity, or claim boundaries.
- Translate anode-level observations into full-cell or practical-format relevance.

Do not use for operational laboratory protocols, commercial viability assessment, or non-battery research.

## Inputs required

Collect or infer before starting:
- **Target system**: metal anode, electrolyte family, cathode class, and intended operating regime.
- **Failure mode**: primary instability (e.g., non-uniform deposition, side reactions, passivation, impedance growth).
- **Candidate intervention**: additive, coating, separator modification, electrolyte formulation, or structural motif.
- **Baseline**: standard system against which to compare.
- **Evidence inventory**: available literature, preliminary data, or computational predictions.
- **Constraints**: safety, measurement access, reproducibility needs, and whether the scope is conceptual, computational, or experimental.

## Core Workflow

1. **Decompose the coupled failure mode**
   - Map the observable instability to candidate rate-limiting steps (transport, solvation, interfacial kinetics, nucleation, side reactions).
   - Rank bottlenecks by observability and controllability.
   - *Stop*: if the failure mode cannot be reproduced or defined under matched baseline conditions.

2. **Generate competing mechanistic hypotheses**
   - For each bottleneck, formulate causal hypotheses linking the intervention to an intermediate signal and a performance outcome.
   - Annotate each hypothesis with: evidence strength (weak/moderate/strong), key assumptions, predicted signatures across at least two independent observables, and likely failure modes.
   - *Gate*: reject hypotheses that lack a falsifiable intermediate signal or rely solely on single-metric performance gains.

3. **Design minimal viable validation**
   - Define baseline, negative, positive (benchmark), and ablation controls to isolate the proposed mechanism from generic bulk effects.
   - Select primary metrics (reversibility, morphology, interfacial resistance) and secondary metrics (spectroscopic, transport, simulation).
   - Pre-register stop conditions: intervention worsens baseline, controls match full design, or mechanism-specific diagnostic is missing.
   - *Gate*: do not proceed if the control hierarchy cannot distinguish chemistry from morphology, porosity, or thickness effects.

4. **Collect multi-scale evidence**
   - Gather chemical/spectroscopic evidence for the proposed interfacial or solvation change.
   - Gather transport/kinetic evidence (impedance, nucleation behavior, flux distribution).
   - Gather morphological evidence (deposit uniformity, interphase integrity).
   - Gather electrochemical evidence (half-cell stability, efficiency, polarization).
   - *Stop*: if safety or environmental review is incomplete, or if replicates show high unexplained variance.

5. **Integrate evidence and test the causal chain**
   - Compare candidate versus baseline under matched conditions.
   - Check whether intermediate signals changed before performance metrics improved.
   - Require convergence across at least two independent measurement categories to advance a mechanistic claim.
   - *Decision gate*:
     - **Converged**: mechanism and performance align → proceed to boundary testing.
     - **Partial**: performance improves but mechanism evidence is weak → add missing diagnostic before scaling.
     - **Diverged**: evidence streams contradict → pivot hypothesis or redesign intervention.

6. **Iterate or pivot**
   - If morphology improves but side reactions worsen, revise interfacial coverage or chemical compatibility.
   - If half-cell gains do not appear in full cells, examine cathode coupling, mass balance, and crossover.
   - If ablation controls match the full design, narrow the claimed mechanism to bulk or nonspecific effects.
   - Return to step 2 or 3 with updated assumptions.

7. **Scale to full-cell and practical boundaries**
   - Translate anode-level mechanisms to full cells only after half-cell evidence is internally consistent.
   - Test under realistic mass balancing, rate, temperature, and format constraints.
   - *Gate*: if gains disappear under practical conditions, define the valid operating window and stop generalization claims.

8. **Bound and document claims**
   - Label each conclusion as directly observed, inferred from correlated evidence, or speculative.
   - Separate source-paper observations from new-system extrapolations.
   - Archive the evidence map, control hierarchy, and iteration history.

## Output Format

Return a structured research plan containing:
1. **Research question**: concise statement of the target system and failure mode.
2. **Evidence map**: what is demonstrated versus inferred versus unknown.
3. **Hypotheses**: each with evidence strength, key assumptions, predicted signatures, minimal validation, strong controls, failure modes, and boundary conditions.
4. **Experimental design schema**: variables, control hierarchy, metrics, and stop conditions.
5. **Analysis plan**: how to triangulate chemical, transport, morphological, and electrochemical evidence.
6. **Iteration plan**: rules for updating, splitting, or abandoning hypotheses based on convergent or discordant results.
7. **Validity and boundary statement**: confounders, reproducibility needs, extrapolation limits, and safety/ethics constraints.

## Validation Gates

Before advancing past each phase, confirm:
- **Failure reproducibility**: the baseline instability is observed under defined, matched conditions.
- **Hypothesis falsifiability**: each hypothesis predicts a specific intermediate signal and states what result would refute it.
- **Control adequacy**: baseline, negative, ablation, and positive controls are included or justified as unavailable.
- **Mechanistic triangulation**: at least two independent diagnostic categories are planned before claiming causality.
- **Scaling readiness**: anode-side mechanism is internally consistent before full-cell translation.

## Claim Boundaries

- Distinguish **observation** (directly measured), **inference** (correlated evidence), and **speculation** (extrapolation).
- Limit claims to the tested chemistry, interface, and operating conditions unless broader transfer is independently validated.
- Treat half-cell and symmetric-cell results as insufficient for standalone device claims.
- Do not present single-study or source-paper findings as field-wide consensus.

## Failure Modes

- **Confounded mechanism**: improvement arises from uncontrolled variables (roughness, impurities, loading, format) rather than the proposed intervention.
- **Mechanism–performance mismatch**: morphology improves while reversibility or side-reaction metrics degrade.
- **Shifted bottleneck**: the intervention moves failure from deposition to transport, cathode degradation, or compatibility loss.
- **Narrow robustness**: gains appear only under mild or non-representative conditions and vanish under practical stress.
- **Overgeneralization**: anode-level observations are extrapolated to full-cell or commercial relevance without boundary testing.

## Validity Checks

Before finalizing any plan or interpretation, verify:
- **Confounders**: electrode geometry, mass loading, electrolyte volume, separator, contact pressure, and environmental exposure are matched or reported.
- **Reproducibility**: independent replicates, batch variation, and failure distributions are documented.
- **Statistical validity**: metrics are pre-defined, uncertainty is reported, and outlier exclusions are justified.
- **Mechanistic specificity**: the proposed mechanism is supported by direct diagnostics, not inferred solely from performance curves.
- **Boundary conditions**: the hypothesis states where it may fail (temperature, rate, loading, cathode pairing).
- **Evidence separation**: source-paper observations are labeled separately from agent-generated hypotheses.

## Provenance

Synthesized from cluster 35 / subcluster 35.0 ("observable-driven mechanism discovery and validation"). Source skills: `aqueous-zn-interface-additive-research-design`, `zinc-anode-interface-exploration`, `electrogelated-hydrogel-electrolyte-research`, `solvation-interface-metal-deposition-research`, `aqueous-battery-separator-ion-transport`, `zinc-battery-solvation-exploration`, `aqueous-metal-anode-interface-research`, `edl-regulation-research-agent`.
