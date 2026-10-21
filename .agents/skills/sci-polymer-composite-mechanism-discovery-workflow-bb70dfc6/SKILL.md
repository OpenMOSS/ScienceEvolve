---
name: sci-polymer-composite-mechanism-discovery-workflow-bb70dfc6
description: End-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in multifunctional polymer and composite material systems.
scienceevolve-title: "Polymer composites and vitrimers · composite mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Help an agent transform a materials performance bottleneck into a reproducible, mechanism-centered research program. This skill abstracts the shared scientific route across polymer composites, thermosets, coatings, and structured dynamic materials where interface, architecture, or modifier-driven mechanisms must be discriminated from artifacts. It is not a source of fixed materials, operational recipes, or domain-wide conclusions.

# When to use

Trigger this skill when the user asks to:
- Design new studies around multifunctional fillers, additives, modifiers, interface engineering, spatial organization of active phases, or process-defect relationships.
- Generate hypotheses about how microstructure, surface chemistry, or network architecture controls macroscopic performance.
- Plan experiments with staged evidence chains, matched controls, and converging-mechanism readouts.
- Iterate based on supportive, conflicting, or inconclusive evidence.

Do not use this skill for operational laboratory recipes, safety-critical qualification, clinical recommendations, or as a substitute for expert safety or regulatory review.

# Inputs required

Before proposing a research plan, ask for or infer the following:

- **Target material class** and the performance bottleneck or property conflict.
- **Candidate mechanism or design lever** (e.g., interface engineering, active-phase localization, modifier descriptor, process parameter).
- **Primary endpoint** and non-negotiable secondary constraints.
- **Available characterization classes** (chemical, morphological, mechanical, thermal, functional, lifecycle).
- **Safety, environmental, and regulatory boundaries** plus the intended application context.
- **Stage of inquiry**: hypothesis generation, minimal validation design, or iteration after initial results.

If critical inputs are missing, state assumptions explicitly and label resulting hypotheses as provisional.

# Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

## 1. Bottleneck and evidence-gap definition
Define the property conflict and bound the evidence gap in the target system. State what is unknown and why it matters.
- **Decision gate**: Is the bottleneck observable, measurable, and tied to a specific material limitation? If not, stop and refine the research question.

## 2. Mechanism-centered hypothesis generation
Generate 3–5 competing hypotheses that link a controllable design lever to the bottleneck through a physical or chemical mechanism.
- For each hypothesis, annotate:
  - Evidence strength (high / medium / low / speculative).
  - Key assumptions and causal chain.
  - Predicted signatures in chemical, morphological, and performance readouts.
  - Likely failure modes (e.g., agglomeration, weak bonding, phase separation, plasticization, processing artifacts).
  - Falsification criteria: the smallest result that would weaken or refute the hypothesis.
- **Decision gate**: Can the hypotheses be discriminated by the available measurements? If not, redesign the measurement plan before proceeding.

## 3. Study design with matched controls
Design a minimal viable validation (MVV) before expanding to full parametric studies.
- **Comparator set**:
  - Baseline: unmodified matrix or standard process.
  - Unmodified control: filler/additive/process without the engineered feature.
  - Engineered candidate: the modified system.
  - Mechanism-isolation controls: non-reactive analogs, residue-only, or pretreatment-only groups where needed.
  - Positive control: known benchmark in the same material class, if available.
- **Variables**:
  - Independent: treat the design lever as a gradient (e.g., loading level, modification intensity, architecture type), not a fixed value.
  - Controlled: matrix batch, processing route category, geometry, conditioning, and environment.
  - Dependent: chemical identity, dispersion/architecture quality, interface state, primary performance, secondary constraints, and post-test morphology.
- **Stop conditions** (predefined): control failure, confounded processing, safety boundary breach, or effect size comparable to measurement noise.
- **Decision gate**: Do controls isolate the intended mechanism from batch effects, geometry, and processing artifacts? If not, add controls or narrow scope.

## 4. Staged evidence collection
Execute the MVV in four layers. Do not interpret performance until earlier layers pass.
- **Layer A – Chemical/structural identity**: Confirm the design lever was realized as intended.
- **Layer B – Microstructural state**: Assess dispersion, interface quality, architecture retention, voids, or defects.
- **Layer C – Performance endpoints**: Measure primary and secondary properties with replication and uncertainty.
- **Layer D – Post-test mechanism readouts**: Capture residue, fracture surface, or degradation morphology to link to the proposed mechanism.
- **Decision gate**: If Layer A or B fails, stop. Do not attribute performance changes to the mechanism until the lever and microstructure are verified.

## 5. Mechanism discrimination and analysis
Analyze results through a converging evidence chain.
- Compare the candidate against all controls at matched conditions.
- Rank factor influences relative to measurement noise and variability.
- Distinguish monotonic, optimum, threshold, and non-monotonic behavior.
- Map trade-offs (e.g., stiffness versus toughness, flame retardancy versus mechanics, conductivity versus healability) to competing mechanisms.
- Label each mechanism as observed, inferred, or speculative based on the evidence chain.
- **Decision gate**: Do chemistry, morphology, and performance data converge on one mechanism? If data conflict, flag ambiguity and require an orthogonal discriminating test before claiming success.

## 6. Claim bounding and robustness check
Bound all claims to the tested material class, processing history, loading window, and measurement context.
- Distinguish:
  - **Paper-supported pattern**: demonstrated in prior literature for related systems.
  - **Agent-inferred extension**: plausible for the new system but requiring independent validation.
  - **Unsupported**: not demonstrated and not assumed.
- Verify reproducibility across independent batches or preparations.
- Confirm that statistical checks (replication, effect size, outliers) were predefined.
- **Decision gate**: Are claims limited to the tested region with explicit boundary conditions? If not, trim claims before reporting.

## 7. Iteration or redesign
Use the outcome to update the hypothesis space.
- **Continue**: Converging evidence supports the mechanism, secondary constraints are acceptable, and controls are clean. Broaden to stronger validation (loading gradients, lifecycle stress, environmental aging).
- **Modify**: Performance improves but mechanism evidence is weak, trade-offs violate constraints, or an unexpected competing mechanism dominates. Change one major design lever (interface chemistry, architecture, loading, compatibility strategy) and rerun matched controls.
- **Stop**: Baseline and candidate are indistinguishable, controls are confounded, confirmation fails, variability dominates, or a critical secondary endpoint fails. Archive negative results as constraints on the design space.
- **Loop**: Return to Step 2 with revised hypotheses and a new MVV.

# Output Format

Produce the following structured sections:

1. **Research question and bounded gap** – Bottleneck, scope, and non-scope.
2. **Candidate hypotheses** – Table with hypothesis, evidence strength, key assumptions, predicted signatures, likely failure modes, and falsification criteria.
3. **Study design** – Comparator set, variables, minimal viable validation, controls, and stop conditions.
4. **Analysis plan** – Evidence chain, mechanism discrimination rules, trade-off mapping, and statistical checks.
5. **Iteration decision** – Continue/modify/stop rules and the next minimal validation.
6. **Claim boundary statement** – What is supported, inferred, or untested; applicable material and process boundaries.
7. **Validity and safety notes** – Confounders, reproducibility requirements, and ethics/safety constraints.

# Validation Gates

Check these before executing the plan and before claiming results:
- Bottleneck is observable and measurable.
- Hypotheses are discriminable with available methods.
- Controls include baseline, unmodified, engineered candidate, and mechanism-isolation comparators.
- Confounders are isolated (batch, geometry, processing history, environment).
- Replication and uncertainty reporting are planned.
- Mechanism-linked measurements are present; endpoint-only ratings are insufficient.
- Success, failure, and stop criteria are predefined.
- Safety and ethics review is documented for hazardous materials, combustion testing, or nanomaterial handling.

# Claim Boundaries

- Limit claims to the tested matrix, filler/modifier class, architecture type, loading range, and processing route.
- Do not generalize from a single system to all polymers, composites, or applications.
- Do not equate lab-scale performance with regulatory certification, field safety, or structural qualification.
- Separate paper-supported strategies from agent-inferred extensions for new systems.
- Treat numerical optima as system-specific unless externally validated.
- Avoid environmental, toxicological, or sustainability claims without independent lifecycle or exposure assessment.

# Failure Modes

- **Hypothesis failure**: The proposed mechanism is not supported by converging evidence; a competing explanation (e.g., plasticization, altered curing, agglomeration, void formation) better fits the data.
- **Control failure**: Baseline or negative control behaves unexpectedly; processing artifacts dominate over chemistry effects.
- **Trade-off failure**: The primary endpoint improves, but a critical secondary endpoint degrades beyond an acceptable threshold.
- **Reproducibility failure**: High scatter across replicates or batches indicates that process quality, not design, is the dominant variable.
- **Confounding failure**: An uncontrolled variable (thickness, orientation, moisture, residual solvent, void content) explains the observed effect.
- **Boundary failure**: The apparent optimum lies outside a safe, valid, or practical processing window.
- **Mechanism exclusion**: Post-test morphology, residue, or structural evidence directly contradicts the proposed mechanism.

# Validity Checks

- Are all hypotheses labeled with evidence strength?
- Are paper-supported findings separated from new inferences and speculation?
- Are controls matched and sufficient to isolate the intended mechanism?
- Are chemical, morphological, and performance readouts mutually consistent?
- Are trade-offs reported alongside improvements?
- Are negative, ambiguous, and failed results preserved and reported?
- Are statistical checks (replication, effect size, outlier handling) predefined and reported?
- Are safety, environmental, and regulatory constraints respected and documented?

# Provenance

- Synthesized from cluster 35.0 (composite-flame-epoxy-retardant-mechanism-discovery-workflow).
- Derived from source skills: polymer-nanofiller-research-pattern, interface-engineering-composite-research, segregated-dynamic-composite-research-workflow, composite-drilling-delamination-exploration, hyperbranched-epoxy-modifier-design, polymer-nanocomposite-coating-research-workflow, polymer-flame-retardant-research-pattern, interface-engineered-nanocomposite-exploration.
- Preserves no paper-specific materials, parameters, numerical results, or conclusions.
