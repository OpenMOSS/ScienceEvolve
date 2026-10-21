---
name: sci-quantum-mechanism-driven-research-design-workflow-5a772fb0
description: Reusable end-to-end workflow for generating falsifiable hypotheses, designing minimal viable validations with strong controls, and iterating on mechanism-driven research questions across multiscale physical and computational systems.
scienceevolve-title: "Quantum materials and condensed matter · mechanism driven research design workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide an agent through a transferable, end-to-end research design cycle: frame gaps as mechanism-discrimination problems, generate ranked hypotheses with explicit failure modes, design minimal viable validations using layered controls, analyze results with mechanism decomposition and uncertainty quantification, and iterate or halt based on evidence gates. The workflow abstracts shared scientific method from multiscale physical and computational research design skills without binding to any specific platform, material, or paper conclusion.

## When to use

Trigger this skill when the task requires:
- Proposing a new research question or hypothesis in a multiscale or complex system where multiple mechanisms could explain an observed anomaly.
- Designing a validation plan (numerical, theoretical, or experimental design-level) that must distinguish a target mechanism from null models and confounding alternatives.
- Auditing consistency across model hierarchies, boundary conditions, or data sources before making comparative claims.
- Iterating on a research plan based on partial support, contradictory controls, or boundary violations.
- Translating platform capabilities or theoretical structures into falsifiable, observable predictions.

Do not use this skill for:
- Summarizing single-paper conclusions or reproducing specific experimental parameters.
- Generating executable hardware protocols, fabrication recipes, or hazardous operational procedures.
- Domain-action matrix tasks unrelated to end-to-end research design.

## Inputs required

Before starting, gather or confirm:
- **Target system abstraction**: relevant degrees of freedom, scales, symmetries, conservation laws, and boundary conditions.
- **Observable anomaly or gap**: the phenomenon or inconsistency that existing models fail to explain.
- **Candidate mechanisms**: active processes and suppressive/dissipative processes that could produce or mask the anomaly.
- **Model hierarchy**: available theoretical approximations, numerical resolutions, and their assumed validity ranges.
- **Control capabilities**: accessible independent variables, measurable observables, and controllable boundary conditions.
- **Constraints**: non-operational safety boundaries, computational limits, reproducibility requirements, and ethical/compliance limits.
- **Evidence baseline**: which prior results are verified, which are inferred by analogy, and which are unknown risks.

## Core Workflow

Execute the following ordered route. Do not skip gates; if a gate fails, return to the indicated step.

### 1. Gap Framing & Mechanism Scoping
Express the research gap as a **mechanism-discrimination question**, not as a performance target.
- Identify the observable anomaly and the scale, geometry, or symmetry regime where it appears.
- List candidate **active mechanisms** (processes that could create the anomaly) and **suppressive mechanisms** (processes that could mask or destroy it).
- **Gate G1**: Is the gap reducible to a falsifiable comparison between at least one active mechanism and one suppressive/null alternative?  
  - *If no*: Stop. Refine the anomaly description or acquire additional observables before proceeding.

### 2. Hypothesis Generation & Evidence Grading
For each candidate mechanism pair, produce a falsifiable hypothesis card containing:
- Predicted direction of change for an observable under a specified manipulation.
- Evidence strength: **High** (multiple independent models/data sources), **Medium** (single model or analogy), or **Low** (heuristic inference).
- Key assumptions (e.g., scale separation, boundary type, noise regime, model validity).
- Explicit failure modes (observations that would falsify the hypothesis).
- **Gate G2**: Does every hypothesis include a falsifiable prediction, a defined failure mode, and a graded evidence level?  
  - *If no*: Return to Step 1 and decompose the gap further.

### 3. Consistency Audit
Before designing validation, audit all models, data sources, and prior results for:
- Parameter conventions, normalizations, units, and boundary definitions.
- Model hierarchy alignment (coarse-grained vs. high-resolution assumptions).
- Confounding variables that co-vary with the proposed mechanism.
- **Gate G3**: Are comparisons locked to a single, consistent parameter set and boundary framework?  
  - *If no*: Fix inconsistencies and document versioned assumptions before proceeding.

### 4. Minimal Viable Validation (MVV) Design
Design the smallest system or dataset that can discriminate the target hypothesis from the null and closest alternative.
- **Independent variables**: manipulate one mechanism-relevant factor at a time.
- **Dependent variables**: choose observables sensitive to the predicted direction.
- **Control variables**: fix scale, boundary, normalization, and convergence standards.
- **Controls**:
  - *Positive control*: configuration known to produce the target signal, confirming detection sensitivity.
  - *Negative control*: configuration with the target mechanism removed or nullified.
  - *Strong control*: configuration differing from the target by only one mechanism-relevant factor.
  - *Baseline control*: simplest null model (e.g., equilibrium, homogeneous, or uncoupled limit).
- **Stop conditions for MVV**: halt if the required discrimination demands unverified parameter extrapolations, unresolved confounders, or inaccessible observables.
- **Gate G4**: Can the MVV distinguish target, null, and alternative mechanisms with the available controls?  
  - *If no*: Simplify the system, add orthogonal controls, or downgrade to a narrower hypothesis and return to Step 2.

### 5. Execution & Metadata Recording
Run the simulation, analysis pipeline, or experimental design protocol.
- Record all seeds, solver versions, calibration records, randomization procedures, and exclusion rules.
- For physical-platform designs, remain at the research-design level; do not output executable operational parameters or hazardous procedures.
- **Gate G5**: Did the execution complete within the pre-defined consistency framework and safety boundaries?  
  - *If no*: Document the deviation, assess whether it constitutes a confounder, and return to Step 3 or halt.

### 6. Mechanism Decomposition & Analysis
Process outputs to separate mechanism contributions from artifacts:
- **Preprocessing**: verify calibration, convergence, normalization, and baseline stability.
- **Mechanism decomposition**: attribute observed changes to the manipulated factor, not to correlated but uncontrolled variables.
- **Model hierarchy comparison**: compare coarse-grained predictions against high-resolution or alternative-formulation results; flag inconsistencies.
- **Uncertainty quantification**: propagate measurement noise, numerical truncation, finite-size effects, and parameter uncertainty into confidence intervals or equivalent bounds.
- **Visualization**: map observables against manipulated variables and control outcomes; highlight regions where predictions diverge most strongly.
- **Gate G6**: Does the signal exceed the negative/baseline control bounds with adequate confidence, and is it robust across model hierarchies?  
  - *If no*: Treat as null or ambiguous; check for confounders before iterating.

### 7. Attribution & Evidence Update
Grade the result against the hypothesis card:
- **Replicated/Strong support**: Positive control succeeds, negative control fails, strong control isolates the mechanism, and results are reproducible across independent runs or model representations.
- **Partial support**: Direction is correct but magnitude, robustness, or boundary conditions are narrower than predicted; split into sub-hypotheses.
- **Refuted/No support**: Effect disappears under consistency audit, is explained by confounders, or negative control shows equivalent signal.
- Update the evidence map and explicitly state which conclusions are verified, extended, or inferred.
- **Gate G7**: Has the mechanism been isolated from confounders via the full control suite?  
  - *If no*: Do not upgrade evidence strength; return to Step 2 to refine assumptions or design orthogonal controls.

### 8. Iteration, Extrapolation, or Termination
- **If strong support**: Expand validation along **one** dimension at a time (e.g., larger scale, additional noise, different boundary). Return to Step 4.
- **If partial support**: Refine boundary conditions, split hypothesis into narrower sub-mechanisms, and return to Step 2.
- **If no support**: Reject the mechanism, redefine the gap using the failure mode as a new clue, and return to Step 1.
- **Termination rules**:
  - Stop extrapolation if the next regime violates the original model assumptions or lacks verified controls.
  - Stop if results depend on unverified parameter boundaries, unresolved numerical sensitivities, or uncharacterized noise.
  - Stop if the validation plan would require operational details or safety protocols beyond the research-design scope.

## Output Format

For each invocation, produce:

1. **Research Question** — One sentence defining the gap as a mechanism-discrimination problem.
2. **Evidence Map** — Verified facts, agent inferences, key uncertainties, and unknown risks.
3. **Hypothesis Cards** — For each candidate: proposed mechanism, evidence strength, key assumptions, falsifiable prediction, primary metrics, failure modes, and stop conditions.
4. **Validation Design** — MVV description, independent/dependent/control variables, positive/negative/strong/baseline controls, and evaluation metrics.
5. **Analysis Plan** — Preprocessing checks, mechanism decomposition strategy, model-hierarchy comparison, uncertainty propagation, and visualization approach.
6. **Iteration Plan** — Rules for strong support, partial support, and refutation, including the next MVV or boundary analysis.
7. **Validity & Boundary Statement** — Confounders checked, reproducibility requirements, extrapolation limits, and non-operational safety boundaries.

## Validation Gates

The workflow contains seven mandatory gates (G1–G7). A failure at any gate must trigger a return to the specified earlier step or a workflow halt. No evidence strength may be upgraded unless G7 is satisfied.

## Claim Boundaries

- Distinguish **verified results** (reproduced across independent models or datasets), **inferred extensions** (analogous mechanisms applied to new systems), and **speculative hypotheses** (heuristic or untested analogies).
- State that conclusions are conditional on the audited parameter set, boundary conditions, and model hierarchy used.
- Do not present single-model or single-run outcomes as domain consensus.
- Avoid causal language unless the mechanism variable was independently manipulated and isolated by controls.

## Failure Modes

- **Gap misframing**: The research question is cast as performance optimization rather than mechanism discrimination, making it unfalsifiable.
- **Control deficiency**: Positive or negative controls fail, making attribution impossible.
- **Parameter inconsistency**: Comparisons rely on mismatched normalizations, boundary conditions, or model versions, producing spurious differences.
- **Confounder dominance**: An uncontrolled variable (e.g., finite-size effect, numerical dissipation, measurement point-spread, cross-talk) explains the observed signal.
- **Over-extrapolation**: Conclusions are pushed beyond the verified parameter range, model hierarchy, or platform capability.
- **Irreproducibility**: Results are sensitive to random seeds, solver tolerances, or calibration drift without documented bounds.
- **Operational overreach**: The workflow output drifts into executable hardware protocols, fabrication parameters, or hazardous procedural details.

## Validity Checks

Before finalizing any research design, confirm:
- **Confounders**: Are there variables that co-vary with the mechanism of interest? Design orthogonal controls if yes.
- **Consistency**: Do all models, datasets, and comparisons use identical parameter conventions, units, normalizations, and boundary definitions?
- **Reproducibility**: Are seeds, versions, sampling strategies, convergence thresholds, and calibration records sufficient to replicate the analysis?
- **Boundary conditions**: Are results tied to specific geometries, scales, symmetries, or noise regimes? Are these explicitly stated?
- **Numerical/Methodological validity**: Is the observable sensitive to grid resolution, truncation, solver choice, or statistical sample size? Report sensitivity bounds.
- **Alternative mechanisms**: Have negative controls and strong controls excluded the most plausible alternative explanations?
- **Extrapolation limits**: Does the new question alter a core assumption of the original mechanism? If so, require re-validation.
- **Evidence grading**: Are all new hypotheses labeled with evidence strength, key assumptions, and failure modes?

## Provenance

This skill was synthesized from cluster `205` / subcluster `205.0` via semantic merge of the following source skills:
- `non-hermitian-laser-array-research-design` (`5e79f1bd36eb712c`)
- `quantum-localization-phase-research-skill` (`b7ddbadf165f235c`)
- `network-flow-multiscale-research` (`d2d1fe44d07a3417`)
- `integrable-atomtronic-interferometry-workflow` (`6b11489902bdd6fe`)
- `mhd-turbulent-dynamo-exploration` (`e5763ae884c4a212`)
- `programmable-fermionic-array-design` (`61e5684c2530459b`)
- `quantum-entanglement-witness-design` (`72604c21bb6b7472`)
- `phonon-hydrodynamics-research-design` (`9552ce3d0acab2aa`)

The workflow preserves the shared end-to-end route (gap framing → hypothesis generation → consistency audit → minimal viable validation → execution → mechanism decomposition → attribution → iteration) without retaining source-specific physical systems, materials, numerical parameters, or paper conclusions.
