---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-57dcde6e
description: A reusable end-to-end workflow for proposing, validating, and iterating symmetry-guided mechanistic hypotheses in quantum and condensed-matter materials under perturbations such as pressure, strain, doping, or field.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 5"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to design and execute reusable, symmetry-aware research workflows for discovering and validating microscopic mechanisms in quantum and condensed-matter materials. The workflow transfers a methodological pattern: define an anomaly or target feature, generate competing symmetry-guided hypotheses, design controlled validation with explicit decision gates, discriminate mechanisms through multi-observable analysis, and iterate until claims are bounded by evidence. Treat every source system as a case study, not as field-wide consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions around unresolved transitions, anomalous spectral features, or unexpected electronic, optical, transport, or magnetic responses.
- Design non-operational validation plans for materials under perturbations such as pressure, strain, composition, dimensionality, field, or photoexcitation.
- Discriminate among competing microscopic mechanisms (e.g., topological, defect-mediated, symmetry-breaking, correlated-order, or structure-property coupling) in quantum materials, layered systems, semiconductors, or correlated-electron systems.
- Interpret ambiguous data by linking local structure, symmetry, and electronic structure to observable signatures.
- Critique a proposed study for confounders, weak controls, endpoint overgeneralization, or unclear extrapolation boundaries.

Do not use this skill to provide operational laboratory protocols, hazardous synthesis or high-pressure execution instructions, fabrication recipes, or device-level implementation guides.

# Inputs required

Before generating hypotheses or designs, request or infer:

- **Target domain:** material class, dimensionality, known phases, and relevant degrees of freedom (electronic, structural, magnetic, orbital).
- **Observed anomaly or target feature:** the measurement channel, qualitative behavior, and what existing models fail to explain.
- **Perturbation space:** pressure, strain, doping, defect concentration, layer stacking, field, or other tuning knobs.
- **Available evidence:** prior data, computational benchmarks, literature priors, and known discrepancies between theory and experiment.
- **Tools and constraints:** accessible computational methods, experimental probes, sample limitations, safety boundaries, and target uncertainty.
- **Desired output:** hypothesis set, validation plan, analysis roadmap, mechanism critique, or iteration strategy.

If inputs are missing, state assumptions explicitly and label conclusions as conditional.

# Core Workflow

Follow this ordered route with explicit decision gates and stop conditions.

## 1. Gap definition and feature quantification
- Define the research gap by identifying what the standard model misses.
- Quantify the target feature (e.g., gap, dispersion, order parameter, spectral signature, topological invariant, or response magnitude).
- **Decision Gate 1 — Anomaly clarity:** Is the feature reproducible and distinguishable from background? If no, stop and refine the baseline or measurement pipeline.

## 2. Symmetry-guided hypothesis generation
- Generate at least three competing hypotheses:
  - A primary symmetry-protected or local-structure-mediated mechanism.
  - A competing mechanism (e.g., accidental degeneracy, disorder, alternative order parameter).
  - A null or artifact hypothesis (e.g., numerical artifact, calibration drift, confounding background).
- Map each hypothesis to broken or preserved symmetries, local motifs, topological invariants, or coupling hierarchies.
- Assign evidence strength (strong / moderate / weak / speculative) and list key assumptions and likely failure modes.
- **Decision Gate 2 — Discrimination potential:** Do the hypotheses make distinct, falsifiable predictions? If no, reformulate using sharper mechanism variables or additional constraints.

## 3. Study design and control matrix
- Define independent variables (perturbation axis, composition, symmetry constraint, configuration).
- Define dependent variables (electronic, spectral, structural, transport, or optical observables).
- Establish controls:
  - **Baseline control:** unperturbed or reference state using the identical analysis pipeline.
  - **Positive control:** a regime or system where the expected signature is established.
  - **Negative control:** a comparator lacking the proposed mechanism but retaining similar background behavior.
  - **Strong control:** simultaneous multi-observable comparison or blind-analysis pre-registration.
  - **Method control:** sensitivity check against model approximations, functional choices, or numerical settings.
- Set minimal viable validation criteria and stop conditions (e.g., safety limits, convergence thresholds, reproducibility requirements).
- **Decision Gate 3 — Feasibility:** Can the leading hypothesis be discriminated from alternatives with available tools and constraints? If no, narrow scope or request additional inputs.

## 4. Execution and multi-layer analysis
- Execute computations or non-operational measurements.
- Analyze in ordered layers:
  1. **Structural/thermodynamic:** lattice response, coordination, symmetry changes, phase stability, dynamic stability.
  2. **Electronic:** band structure, density of states, orbital character, gap trends, localization.
  3. **Response/optical:** absorption, reflectivity, transport proxy, Berry curvature, excitonic signatures.
  4. **Mechanism:** mode coupling, order-parameter evolution, topological invariant tracking, defect-host hybridization.
- Check artifacts: convergence, finite-size effects, basis/gauge dependence, functional sensitivity, disorder, and boundary effects.
- **Decision Gate 4 — Sanity check:** Do results pass convergence and artifact checks? If no, iterate on numerical setup or experimental design before interpreting.

## 5. Mechanism discrimination
- Compare each hypothesis against observations using the same metric definitions.
- Require at least two independent observables to support a mechanism.
- Verify that negative controls behave as expected and that the signature is not fully explained by background or alternative mechanisms.
- Quantify uncertainty and model dependence.
- **Decision Gate 5 — Mechanism survival:** Does one hypothesis survive robustness checks while alternatives fail? If no, return to Step 2 or Step 3 to refine hypotheses or add discriminating controls.

## 6. Evidence update and iteration
- Update the hypothesis table:
  - **Promote** if multiple independent observables agree and controls behave as predicted.
  - **Narrow** if the mechanism is valid only in a restricted regime or symmetry subset.
  - **Replace** if a different symmetry, local motif, or coupling better explains the data.
  - **Discard** if the feature disappears under minor perturbations or depends on artifacts.
- If inconclusive, add the smallest test that most directly discriminates between remaining mechanisms.
- **Decision Gate 6 — Evidence sufficiency:** Is the evidence strength sufficient for the intended claim level? If no, loop to Step 3 with revised controls.

## 7. Claim bounding and output
- Separate observed facts, model-supported inferences, and speculative extensions.
- State extrapolation boundaries: material class, perturbation regime, symmetry constraints, and method validity.
- Document reproducibility artifacts: inputs, scripts, analysis notebooks, and decision criteria.
- Deliver the structured output defined in **Output Format**.

# Output Format

Return results in the following structure:

1. **Research question** — One concise, mechanism-centered question.
2. **Candidate hypotheses table** — Columns: hypothesis, mechanism class, evidence strength, key assumptions, predicted signatures, negative-control expectation, likely failure mode.
3. **Validation design** — Independent/dependent variables, control matrix, metrics, minimal viable validation, and stop conditions.
4. **Analysis plan** — Layered analysis steps, artifact checks, and uncertainty quantification.
5. **Iteration plan** — Rules for promoting, narrowing, replacing, or discarding hypotheses based on possible outcomes.
6. **Validity and boundary statement** — Confounders, reproducibility checks, extrapolation limits, and non-operational safety constraints.
7. **Evidence classification** — Label each claim as source-supported, literature-supported, user-provided, or agent-inferred.

# Validation Gates

- **Anomaly clarity gate:** The target feature is reproducible, quantified, and not an artifact of background subtraction or presentation.
- **Hypothesis discrimination gate:** Competing hypotheses predict measurably different outcomes across at least one control variable.
- **Feasibility gate:** The proposed validation is achievable within stated computational, experimental, and safety constraints.
- **Convergence and artifact gate:** Numerical or measurement results are stable under stricter settings and alternative analysis choices.
- **Mechanism survival gate:** The favored mechanism is consistent with multiple independent observables and survives negative controls.
- **Evidence sufficiency gate:** The cumulative evidence justifies the claim level without overreaching into unsupported extrapolation.

# Claim Boundaries

- Distinguish four evidence classes in every output:
  - **Source-supported:** directly supported by the originating case study at the model level.
  - **Literature-supported:** consistent with broader literature but not established by the source alone.
  - **User-provided:** supplied by the user or external dataset.
  - **Agent-inferred:** a new hypothesis or extrapolation requiring independent validation.
- Do not extrapolate a single model path or compound to an entire material class without supporting evidence.
- Do not treat single-particle or mean-field results as evidence for strongly correlated or interaction-driven phases without additional modeling.
- Do not claim material realizability, device performance, or experimental safety without checking structural stability, synthesis constraints, and institutional review.
- Computational predictions must be labeled as distinct from experimentally validated behavior.

# Failure Modes

- **Endpoint overgeneralization:** Assuming a feature known at two limits persists along an untested intermediate path.
- **Symmetry or accidental artifact:** Mistaking numerical near-degeneracy, near-flatness, or basis-dependent symmetry for physical protection.
- **Methodological artifact:** Conclusions that depend on unconverged settings, finite-size effects, gauge choices, or unvalidated functionals.
- **Confounding by competing contributions:** Attributing a response peak or anomaly to one mechanism when multiple bands, defects, or background carriers contribute.
- **Misattribution of spectral/optical features:** Assigning transitions or peaks based on energy alone without oscillator strength, orbital character, or spatial overlap.
- **Sample and disorder mimicry:** Structural domains, strain gradients, impurities, or stoichiometry variations masquerading as an intrinsic mechanism.
- **Overfitting to one path:** Building a mechanism that explains only one interpolation route or one perturbation direction and fails under alternative routes.

# Validity Checks

- **Convergence and sensitivity:** Verify that structural, electronic, and response quantities are stable under stricter numerical tolerances and that phase rankings are not dominated by one functional or dispersion treatment.
- **Control adequacy:** Confirm inclusion of baseline, positive, negative, strong, and method controls before drawing causal inferences.
- **Multi-probe consistency:** Require at least two independent observables to support a proposed mechanism; treat single-channel agreement as suggestive only.
- **Structural validity:** Ensure local structural evidence is independent of the electronic observable being interpreted.
- **Reproducibility:** Document model definitions, interpolation coordinates, metric definitions, software versions, analysis scripts, and exclusion criteria.
- **Statistical and numerical validity:** Quantify feature metrics rather than relying on visual inspection; report uncertainties and parameter correlations.
- **Extrapolation boundaries:** Explicitly state the material class, perturbation regime, symmetry, and method limits beyond which claims should not be generalized.

# Provenance

- Synthesized from cluster **204.0** (symmetry-guided mechanism discovery and validation).
- Derived from source skills:
  - `fa90b055f6870782`: 3d-flat-band-interpolation-workflow
  - `a051b44d58abe965`: high-pressure-electronic-structure-exploration
  - `e7b0c8ba6a3f0e32`: defect-doped-semiconductor-optical-spin-exploration
  - `d6913a1525e451f5`: condensed-matter-topological-quantum-oscillation-workflow
  - `arxiv-cmoat__2606.29527`: coupled-order-research-exploration
  - `c2784791160839f9`: pressure-driven-material-phase-exploration
  - `c22ebfe41267aaff`: dielectric-dependent-materials-discovery
  - `231ad04efbf64d8f`: photocontrolled-hybrid-improper-ferroelectrics-research
