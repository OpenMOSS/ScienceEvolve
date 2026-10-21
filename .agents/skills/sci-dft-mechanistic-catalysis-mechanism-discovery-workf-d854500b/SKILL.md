---
name: sci-dft-mechanistic-catalysis-mechanism-discovery-workf-d854500b
description: A reusable end-to-end workflow for generating, validating, and iterating mechanistic hypotheses in homogeneous catalysis using orthogonal experimental and computational evidence.
scienceevolve-title: "Organometallic catalysis and DFT · mechanistic catalysis mechanism discovery workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Guide agents in designing research plans that transform catalytic observations into defensible mechanistic models. The workflow supports hypothesis generation, minimal validation design, multi-layer analysis, and iterative refinement without reproducing specific reaction conditions or treating single studies as field consensus.

# When to use

Use when the user asks to:
- Propose new mechanistic hypotheses for transition-metal-catalyzed or organometallic transformations.
- Design discriminating experiments or computational studies to distinguish competing pathways.
- Interpret kinetic, spectroscopic, isotopic, or computational evidence in the context of a catalytic cycle.
- Iterate catalyst, ligand, substrate, or environment design based on mechanistic evidence.
- Map selectivity bottlenecks to elementary steps and test design principles.

Do not use for executable laboratory protocols, safety-critical operational instructions, clinical recommendations, or as a substitute for domain expert review and institutional safety approval.

# Inputs required

Before starting, identify or request:
- **Target transformation**: reaction family, substrate and product classes, and desired selectivity.
- **Catalyst hypothesis**: metal center, ligand class, proposed cooperative or ligand-assisted functionality, and suspected active or resting states.
- **Observed anomaly or trend**: activity, selectivity, kinetic behavior, resting-state detection, or unexpected side products.
- **Available evidence**: spectroscopic, kinetic, isotopic, labeling, computational, or literature precedent.
- **Constraints**: analytical capabilities, safety boundaries, material scope, and whether the task is exploratory or confirmatory.
- **Desired output level**: hypothesis map, validation plan, analysis strategy, or full research proposal.

If inputs are missing, state assumptions explicitly and label them as agent-inferred.

# Core Workflow

Execute the following ordered stages. At each decision gate, evaluate whether to continue, redesign, pivot, or stop.

## Stage 1: Frame the mechanistic puzzle
- Define the activation or selectivity bottleneck (e.g., bond cleavage, oxidative addition, insertion, proton transfer, product release).
- Separate direct observations from inferences.
- Identify the branch point where productive, competing, and off-cycle pathways diverge.

**Decision Gate 1**: If the bottleneck cannot be defined with available evidence, stop and request additional observational inputs.

## Stage 2: Generate competing hypotheses
- Map plausible catalytic manifolds including resting states, intermediates, transition states, and off-cycle traps.
- Formulate at least three hypotheses: a cooperative or ligand-assisted pathway, a conventional metal-centered pathway, and a deactivation or side-reaction pathway.
- For each hypothesis, specify:
  - Mechanistic rationale and predicted rate-limiting or selectivity-determining step.
  - Evidence strength (strong, moderate, weak, speculative).
  - Key assumptions.
  - Predicted discriminating observation.
  - Likely failure mode.
- Label each hypothesis as **source-supported**, **domain-supported**, or **agent-inferred**.

**Decision Gate 2**: If hypotheses are not falsifiable with available or feasible methods, redesign them before proceeding.

## Stage 3: Design minimal viable validation
- Select the smallest diagnostic matrix that can distinguish the top hypotheses.
- Define independent variables (catalyst/ligand class, substrate features, medium properties) and response variables (conversion, selectivity, kinetic signature, intermediate abundance).
- Specify controls:
  - **Baseline**: system without the proposed mechanistic feature.
  - **Negative**: variant expected to suppress the proposed pathway.
  - **Positive**: benchmark validating the analytical readout.
  - **Orthogonal**: independent method testing the same mechanistic claim.
- State stopping conditions before data collection (e.g., product formation without catalyst, predicted intermediate absent, selectivity trends contradict mechanism).

**Decision Gate 3**: If the plan lacks orthogonal controls or requires unsafe or operational execution details, redesign at the conceptual level.

## Stage 4: Execute conceptual experiments and collect evidence
- Gather outcomes, spectroscopic signatures, kinetic trends, isotope effects, and computational profiles.
- Maintain matched comparisons: vary only the targeted mechanistic variable while holding nuisance variables constant.
- Document deviations from the plan and any uncontrolled observations.

**Decision Gate 4**: If data are dominated by decomposition, unassigned side products, or irreproducible artifacts, pause mechanistic interpretation and resolve analytical or material issues.

## Stage 5: Analyze with mechanism-first layering
1. **Outcome check**: Confirm product identity, mass balance, and reproducibility before mechanistic interpretation.
2. **Catalyst attribution**: Compare against precursor, ligand-only, and substrate-only baselines.
3. **Kinetic interpretation**: Infer rate dependence, saturation, or inhibition without overfitting sparse data.
4. **Spectroscopic and isotopic interpretation**: Map resting states and isotope effects to proposed elementary steps only with appropriate controls.
5. **Computational integration**: Compare alternative pathways using consistent model assumptions; treat computed trends as supportive, not definitive.
6. **Pathway discrimination**: Evaluate whether evidence converges on one hypothesis or supports multiple routes.
7. **Uncertainty reporting**: Label each conclusion as observed, inferred, or extrapolated.

**Decision Gate 5**: If evidence is contradictory or supports multiple mechanisms equally, proceed to Stage 6 to redesign the discriminator rather than forcing a conclusion.

## Stage 6: Iterate or terminate
- **If supported**: Strengthen confidence by testing a new perturbation predicted by the hypothesis; expand scope only after targeted falsification survives.
- **If partially supported**: Retain validated sub-steps, redesign weak steps, and add targeted controls.
- **If contradicted**: Abandon or substantially revise the hypothesis; search for alternative activation modes.
- **If ambiguous**: Add the smallest diagnostic experiment that resolves the top two hypotheses; avoid broad optimization screens.
- Update the hypothesis table with evidence for, evidence against, revised confidence, and next test.

**Stop Conditions**:
- The active species cannot be distinguished from decomposition or heterogeneous material.
- Product formation disappears under appropriate negative controls.
- Selectivity trends are inconsistent with all proposed mechanisms.
- Competing pathways are within experimental uncertainty and no discriminating test exists.
- Safety or compliance constraints outweigh scientific value.

## Stage 7: Generalize and bound
- Convert supported mechanisms into design principles.
- Explicitly state boundary conditions where transfer is unsupported.
- Document failures and negative results as boundary evidence.

# Output Format

Produce the following structured outputs:

1. **Research question**: Concise statement of the mechanistic or selectivity bottleneck.
2. **Evidence map**: Source-supported, domain-supported, and agent-inferred evidence, separated.
3. **Hypothesis table**: For each hypothesis—mechanism, key assumptions, evidence strength, predicted discriminator, likely failure mode, and current status.
4. **Validation plan**: Conceptual variables, controls, metrics, and predefined stop conditions.
5. **Analysis plan**: Layered interpretation strategy, evidence integration rules, and uncertainty handling.
6. **Iteration plan**: Decision rules for continuing, revising, pivoting, or stopping.
7. **Boundary statement**: Scope limits, extrapolation risks, and unresolved alternatives.

# Validation Gates

- **Mechanistic specificity**: Does each experiment distinguish the proposed mechanism from plausible alternatives?
- **Control adequacy**: Are baseline, negative, positive, and orthogonal controls defined and linked to specific claims?
- **Orthogonality**: Do at least two independent evidence types support the same conclusion?
- **Matched comparison**: Are systems equivalent except for the tested variable?
- **Reproducibility**: Are replicates, independent preparations, and analytical calibrations addressed?
- **Statistical discipline**: Are variability, uncertainty, and predefined success or stop criteria reported?
- **Model robustness**: Are computational conclusions checked against alternative pathways, conformers, and solvent representations?

# Claim Boundaries

- Mark claims as **validated**, **plausible**, **speculative**, or **unsupported**.
- Treat single-source observations as case evidence, not field consensus.
- Distinguish computational predictions from experimental observations.
- Limit generality claims to the tested catalyst family, substrate class, and model assumptions.
- Do not infer a single mechanism from one linear fit, one isotope effect, or one computational barrier.

# Failure Modes

- **False mechanism attribution**: Product formation arises from an uncontrolled background, decomposition, or heterogeneous pathway rather than the proposed molecular mechanism.
- **Overfitting sparse data**: Kinetic or computational trends are forced into a single mechanistic interpretation without adequate controls.
- **Resting-state fallacy**: An observed intermediate is assumed to be turnover-limiting without evidence of catalytic competence.
- **Scope overreach**: A successful model substrate is treated as proof of generality.
- **Computation-experiment mismatch**: Model limitations such as omitted ion pairs, simplified ligands, or solvent approximations are ignored in favor of discarding experimental data.
- **Irreproducibility**: Uncharacterized impurities, gas-transport effects, or analytical artifacts drive apparent trends.

# Validity Checks

Before finalizing any plan or claim:
- **Confounding**: Could mass transfer, impurities, catalyst decomposition, substrate degradation, or analytical artifacts explain the trend?
- **Resting-state ambiguity**: Is the observed species productive, off-cycle, or a sink?
- **Isotope-effect mapping**: Does the result cleanly map to the proposed bond-breaking step, or is it composite?
- **Computational consistency**: Are reference states, alternative pathways, and model sensitivities adequate?
- **Boundary conditions**: Does the hypothesis apply to the intended substrate, ligand, solvent, and environment class?
- **Evidence grading**: Are claims labeled as direct observation, inference, analogy, or speculation?
- **Safety and compliance**: Are hazardous transformations described only as research-design concepts, with execution deferred to qualified personnel and approved protocols?

# Provenance

- Derived from cluster `0`, subcluster `0.0`: observable-driven mechanism discovery and validation.
- Synthesized from source skills: `organometallic-catalysis-exploration-workflow` (test1644), `catalytic-selectivity-branch-landscape-workflow` (test1555), `organosilicon-selectivity-exploration` (test0991), `base-promoted-methanol-reforming-mechanistic-exploration` (test1902), `nickel-catalysis-mechanism-exploration` (test1773), `nickel-inert-bond-mechanistic-exploration` (test0208), `co2-valorization-cooperative-catalysis-design` (test1906), `cobalt-catalyzed-selective-alkenylation-research` (test1646).
- Preserves no paper-specific systems, materials, parameters, or numerical results.
