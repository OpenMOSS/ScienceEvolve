---
name: sci-quantum-symmetry-materials-quantum-transport-mechan-5bb3521b
description: A reusable end-to-end workflow for symmetry-guided discovery and validation of quantum transport and electronic mechanisms in materials, spanning hypothesis generation, tiered validation, and iterative mechanism discrimination.
scienceevolve-title: "Quantum materials and condensed matter · symmetry materials quantum transport mechanism discovery"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides agents to design reusable research plans for discovering and validating material mechanisms where symmetry, electronic structure, and collective response govern transport or functional behavior. It converts a structural or symmetry hypothesis into a tiered, control-heavy validation workflow without prescribing specific materials, numerical parameters, or operational protocols.

# When to use

Use this skill when the user asks to:

- propose new research questions linking symmetry, phase, localization, or order parameters to quantum transport, electronic response, or magnetic functionality;
- design computational or conceptual studies that test whether a symmetry-allowed mechanism explains an observed or predicted property;
- generate candidate hypotheses for anisotropic transport, symmetry-protected phases, defect-mediated kinetics, or control-induced order;
- build screening or validation workflows from structural, electronic, and response descriptors;
- compare competing mechanisms using controls, benchmarks, and decomposition metrics.

Do not use this skill as a universal materials-selection oracle, a source of field-wide consensus from single studies, or a provider of operational laboratory protocols.

# Inputs required

Before generating a plan, request or infer:

- target material family, model class, or platform;
- conventional expectation or null baseline and why the target mechanism is non-obvious;
- structural motif, symmetry class, or order parameter believed to enable the target response;
- target observable (transport coefficient, tensor response, phase transition, instability signature);
- available evidence type (calculations, measurements, literature benchmarks, theoretical constraints);
- operating regime or boundary conditions (temperature, dimensionality, pressure, strain, disorder);
- constraints: computational budget, experimental feasibility, safety/compliance limits, validation depth.

If inputs are incomplete, state assumptions explicitly and design a minimal validation path that can be refined.

# Core Workflow

1. **Define the functional gap and baseline expectation**
   - State the target property and why it is difficult or counterintuitive under conventional intuition.
   - Identify the baseline mechanism that normally suppresses or competes with the target behavior.
   - *Decision gate:* If no clear baseline or target observable is identified, pause and request inputs before proceeding.

2. **Map symmetry, order parameters, and competing states**
   - Identify protected symmetry operations, allowed coupling pathways, and selection rules for the target response.
   - Enumerate competing structural, electronic, magnetic, or defect-mediated states that could mimic or suppress the target behavior.
   - *Decision gate:* If the target response is symmetry-forbidden in the intended frame, stop and reformulate the question or choose a different symmetry class.

3. **Decompose the mechanism into testable components**
   - Break the target property into mechanistic contributors (e.g., coupling strength, phase space, mode count, carrier velocity, mean free path, tensor components, localization metrics).
   - Link each component to a structural, symmetry, or electronic driver.
   - *Stop condition:* If the mechanism cannot be decomposed into independently testable components, downgrade the study to exploratory screening and flag limited falsifiability.

4. **Generate ranked hypotheses with evidence labels**
   - Produce at least three hypotheses: a direct mechanism hypothesis; an architecture/coupling-enabled hypothesis; and a confounder or competing-state alternative.
   - For each hypothesis specify: predicted effect, evidence strength (strong / moderate / weak / speculative), key assumptions, likely failure modes, and the falsification signal.
   - *Decision gate:* If no hypothesis is falsifiable with available resources, redesign the validation plan before continuing.

5. **Design tiered validation with strong controls**
   - **Minimal viable validation:** baseline characterization; one candidate expected to express the mechanism; one positive or benchmark control; one negative or boundary control; and convergence checks for primary diagnostics.
   - **Detailed validation:** add symmetry-preserving versus symmetry-breaking controls; mechanism-specific diagnostics; robustness variables; and competing-state comparisons.
   - Define independent variables (structure, symmetry, control parameter), dependent variables (response components, order indicators), and robustness variables (approximation, disorder proxy, initialization).
   - *Stop condition:* If controls cannot discriminate the proposed mechanism from confounders or alternative phases, halt before large-scale exploration.

6. **Execute analysis and classify evidence**
   - Validate the workflow on controls first; confirm that positive and negative controls behave as expected.
   - Compare candidates against baselines using primary and secondary diagnostics mapped to the mechanistic decomposition.
   - Classify evidence as: directly supported, mechanism-supported, method-dependent, boundary-specific, or speculative.
   - *Decision gate:* If controls fail to discriminate, repair the workflow or diagnostics before interpreting candidate results.

7. **Discriminate mechanisms and attribute bottlenecks**
   - Determine which component limits or enables the target response.
   - Verify that the signal appears where the mechanism predicts and disappears when the proposed coupling is removed in a control.
   - Test sensitivity to approximations, initialization, disorder, domain averaging, or boundary conditions.
   - *Iteration gate:* If the mechanism is supported but the property is absent, search for missing stabilizing factors or latent instability. If the property appears without mechanism support, search for alternative explanations before claiming confirmation.

8. **Iterate, generalize, or terminate**
   - **Advance:** If the hypothesis is confirmed and controls pass, test nearby candidates sharing the same symmetry logic or escalate to stronger validation.
   - **Revise:** If results are ambiguous, narrow the design to minimal structural/symmetry conditions or add discriminating diagnostics.
   - **Stop:** If the signal is method-dependent, non-competitive against alternatives, or requires unsupported assumptions.
   - *Stop condition:* Terminate when additional iterations no longer discriminate among hypotheses or when the signal falls below robustness thresholds.

# Output Format

When using this skill, produce:

1. **Research question** — one sentence focused on mechanism and outcome.
2. **Gap and baseline** — conventional expectation and why it is challenged.
3. **Symmetry/mechanism map** — protected operations, allowed pathways, and competing states.
4. **Ranked hypotheses** — at least three, with evidence strength, key assumptions, likely failure modes, and falsification signals.
5. **Validation plan** — variables, controls (positive, negative, benchmark, symmetry, architecture), minimal viable validation, detailed validation, metrics, and stop conditions.
6. **Analysis plan** — primary and secondary diagnostics, decomposition metrics, benchmark comparison, robustness checks, and evidence classification scheme.
7. **Iteration plan** — advance/revise/stop rules for each result pattern (confirmed, ambiguous, method-dependent, competing-state dominance).
8. **Validity and boundary statement** — confounders, reproducibility requirements, extrapolation limits, and safety/compliance boundaries.

# Validation Gates

- **Symmetry gate:** Is the target response symmetry-allowed? Are preserved and removed operations explicitly identified?
- **Control gate:** Do positive, negative, benchmark, and symmetry controls discriminate the proposed mechanism from alternatives?
- **Descriptor gate:** Do cheap screening metrics or proxies reproduce detailed results for validation candidates?
- **Convergence gate:** Does the signal survive stricter numerical, experimental, or statistical thresholds?
- **Robustness gate:** Do conclusions survive reasonable changes in approximation, initialization, disorder proxy, or boundary condition?
- **Competing-state gate:** Is the target mechanism meaningfully distinct from alternative phases, defect effects, or extrinsic explanations?

# Claim Boundaries

- Distinguish directly demonstrated results from model-supported predictions, analogy-based inferences, and speculative extensions.
- Limit claims to the tested material class, symmetry class, operating regime, and approximation level.
- Do not present single-study or single-model predictions as field-wide consensus.
- Separate source-paper methodology from agent-inferred hypotheses.
- Use conditional language for extrapolations beyond the validated boundary.

# Failure Modes

- **Symmetry mismatch:** The target response is forbidden or the assumed symmetry class is incorrect.
- **Competing dominance:** An alternative phase, defect state, or extrinsic effect explains the observation better than the proposed mechanism.
- **Method dependence:** The result changes qualitatively under reasonable approximation, initialization, or convention changes.
- **False decomposition:** A cheap descriptor or single diagnostic is overinterpreted as mechanistic proof.
- **Boundary overreach:** Conclusions are generalized to systems lacking the same symmetry or coupling logic.
- **Control failure:** Positive or negative controls fail to behave as expected, invalidating the workflow.

# Validity Checks

- **Mechanistic consistency:** Does the structural or symmetry motif plausibly affect the predicted response component?
- **Control adequacy:** Are positive, negative, benchmark, symmetry-preserving, and symmetry-breaking comparisons included?
- **Descriptor validity:** Does the screening metric reproduce detailed results for validation candidates?
- **Confounder audit:** Could defects, surfaces, strain, disorder, nonstoichiometry, finite-size effects, or alternative scattering dominate?
- **Boundary conditions:** Is the hypothesis limited to the same material class, symmetry class, and operating regime as the evidence?
- **Reproducibility:** Are methods, controls, convergence criteria, and decision rules specific enough to repeat?
- **Evidence labeling:** Are all hypotheses and conclusions marked with evidence strength, key assumptions, and failure modes?
- **Extrapolation check:** Are source-specific observations separated from general methodological lessons?

# Provenance

- Synthesized from cluster 30.0 (symmetry-guided mechanism discovery and validation).
- Source skill references: layered-electride-transport-exploration, symmetry-protected-magnetic-phase-exploration, calibrated-defect-kinetics-research, antiferromagnetic-spintronics-exploration, hepth-sm-eft-positivity-exploration, pressure-induced-localization-magnetism-discovery, hadron-structure-gpd-observability-planning, symmetry-guided-functional-material-design.
- Paper-specific conclusions, numerical parameters, and operational protocols have been excluded per the merge definition.
