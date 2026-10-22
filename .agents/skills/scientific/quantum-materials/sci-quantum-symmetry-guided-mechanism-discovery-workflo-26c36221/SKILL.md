---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-26c36221
description: A reusable end-to-end workflow for discovering and validating physical mechanisms in systems amenable to symmetry or scale-reduction, using minimal effective models, staged controls, and iterative evidence bounding.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 29"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to turn an observed gap in a reduced or symmetry-based model into a disciplined, reusable research program. The workflow guides an agent to hypothesize missing mechanisms, construct minimal effective descriptions, validate them through staged discriminative tests, and bound claims strictly to the evidence.

# When to use

Trigger this skill when:

- A baseline reduced model succeeds in one regime but fails, becomes ambiguous, or produces anomalies in another.
- The research question concerns emergent asymmetries, effective forces, anomalous correlations, or broken-symmetry patterns that are not explained by the current description.
- You need to generate falsifiable hypotheses about omitted couplings, geometric constraints, nonlocal correlations, or scale-mismatched processes.
- You must design a non-operational validation plan—analytical, numerical, or computational—with explicit controls, metrics, and stopping conditions.
- You need to separate a proposed physical mechanism from numerical artifacts, coordinate redundancies, model-form errors, or sampling limitations.

Do not use this skill to produce operational laboratory protocols, hazardous procedures, fabrication parameters, or executable device settings.

# Inputs required

Before executing the workflow, identify or request:

1. **Target system class** and the symmetry, conservation law, or scale separation that justifies a reduced description.
2. **Baseline reduced model** and the regime where it is established.
3. **Observed gap or anomaly**: the failure mode, asymmetry, or unresolved behavior that motivates new mechanism discovery.
4. **Candidate collective variables or observables** that could represent the transition or correlation of interest.
5. **Available validation mode**: analytical derivation, numerical simulation, cross-platform comparison, or independent benchmark data.
6. **Constraints**: acceptable uncertainty, computational or theoretical resource limits, and criteria for stopping or redesign.

# Core Workflow

Follow this ordered route. Treat each **Decision Gate** as a hard checkpoint; do not proceed past a failed gate without revision.

1. **Frame the reduction and the gap**
   - State the symmetry, invariant, or scale separation that enables reduction.
   - Define the baseline model and its validated limits.
   - Pinpoint the specific regime, observable, or transformation where the baseline breaks down or becomes underdetermined.

2. **Generate mechanism hypotheses**
   - Propose one or more omitted mechanisms (e.g., correlation, coupling, geometric constraint, or broken symmetry) that could explain the gap.
   - For each hypothesis, specify: mechanism statement, evidence strength (speculative / plausible / supported / robust), key assumptions, predicted discriminating signature, and likely failure modes.
   - Ensure every hypothesis is operationally defined in the reduced space.

   - **Decision Gate A — Falsifiability:** If a hypothesis cannot be falsified by a feasible experiment or simulation, reformulate or discard it before proceeding.

3. **Design staged validation**
   - Define independent variables that activate or suppress the proposed mechanism.
   - Define dependent variables (diagnostics) sensitive to the mechanism at local and global scales.
   - Establish a control hierarchy:
     - *Baseline control:* reduced model without the new mechanism.
     - *Positive control:* a known limit where the refined model must reproduce established behavior.
     - *Negative / suppression control:* a variant where the proposed mechanism is absent or neutralized.
     - *Robustness control:* perturbation of resolution, coarse-graining, sampling, or parameter choices.
   - Pre-register stop conditions: violations of conservation or symmetry bounds, qualitative dependence on arbitrary numerical choices, or disappearance of the signature under matched controls.

4. **Execute minimal viable validation**
   - Recover all known limits with the refined model.
   - Perform the smallest test that can distinguish the refined hypothesis from the baseline.
   - Verify that symmetry reduction or coarse-graining does not alter the intended ensemble or introduce discontinuities.

   - **Decision Gate B — Limit consistency:** If the refined model fails to recover the baseline in its established regime, halt and revise the effective description before adding complexity.

5. **Discriminative testing and analysis**
   - Compare baseline, refined, and independent benchmark descriptions on identical diagnostics.
   - Segment analysis by scale or regime (e.g., short-range / intermediate / long-range, or fast / slow) rather than averaging across regimes.
   - Audit approximations: link any artifact to a specific simplification, closure, or coordinate choice.
   - Quantify uncertainty and test numerical sensitivity (resolution, sample size, seeds, update frequency, coarse-graining scale).
   - Check that local diagnostics change before global diagnostics if the mechanism is local.

   - **Decision Gate C — Robustness and specificity:** If the target signature vanishes under suppression controls, reverses under robustness checks, or is indistinguishable from artifacts, classify the hypothesis as unsupported and return to Step 2.

6. **Evidence synthesis and claim bounding**
   - Label each claim by evidence type: directly observed, model-inferred, extrapolated, or speculative.
   - Separate mechanism support from mere consistency or fit quality.
   - Bound the claim to the validated regime, system class, and model assumptions; mark unsupported extrapolations as open questions.

7. **Iterate or terminate**
   - **If the hypothesis is supported:** Propose one controlled extension (new regime, observable, or system class) and return to Step 3.
   - **If the hypothesis is unsupported:** Reformulate the reduction, redefine the gap, or discard the hypothesis.
   - **If evidence is inconclusive:** Design the next discriminating test with an independent observable or higher-resolution validation.

   **Stop conditions — terminate the workflow if any of the following occur:**
   - The hypothesis is falsified by negative or suppression controls.
   - Results depend qualitatively on arbitrary modeling or numerical choices.
   - Required conservation, symmetry, or positivity bounds are violated without a documented approximation explaining the violation.
   - Uncertainty dominates the predicted signature.
   - The claim would require extrapolation beyond the validated boundaries.

# Output Format

When this skill is invoked, produce a structured research plan containing:

1. **Research question** — Concise statement of the gap and the mechanism to be tested.
2. **Hypothesis table** — For each hypothesis: mechanism, evidence strength, key assumptions, predicted signature, likely failure mode, and minimal validation test.
3. **Validation design** — Independent and dependent variables; baseline, positive, negative, and robustness controls; evaluation metrics; and pre-registered stop conditions.
4. **Analysis plan** — Regime segmentation, approximation audit, uncertainty quantification, and model-comparison strategy.
5. **Iteration rules** — How to update the hypothesis under supportive, null, confounded, or inconclusive results.
6. **Validity and boundary statement** — Confounders, reproducibility requirements, external-validity limits, and non-operational safety boundaries.

# Validation Gates

- **Gate A — Falsifiability:** Every hypothesis must have a defined observable and a clear condition under which it is rejected. Vague or untestable mechanisms are not permitted to proceed.
- **Gate B — Limit consistency:** The refined effective model must reproduce the baseline model in the regime where the baseline is known to be valid. Failure here indicates a structural flaw in the refinement.
- **Gate C — Robustness and specificity:** The mechanism signature must survive suppression controls, remain stable under reasonable numerical perturbations, and be distinguishable from artifacts. If not, the mechanism is downgraded to speculative or discarded.

# Claim Boundaries

- Claims must remain within the validated symmetry class, scale regime, and model assumptions.
- Mechanism discovery in one reduced representation does not imply universality across all representations or system sizes.
- Agreement with a single benchmark or simulation is supportive, not conclusive.
- Extrapolations to asymptotic limits require explicit finite-scale or preasymptotic justification.
- Distinguish "observed in this model" from "expected in the broader field."

# Failure Modes

- **Coordinate redundancy:** Apparent transitions or asymmetries are artifacts of redundant collective coordinates, relabeling, or diffusion rather than physical mechanisms.
- **Model-form error:** Artifacts arise from a specific closure, truncation, or coarse-graining choice and disappear under alternative formulations.
- **Numerical artifact:** The signature depends on resolution, sampling, update frequency, or discretization and reverses under robustness checks.
- **Overfitting to limits:** The refined model is tuned to fit endpoints or benchmarks while producing unphysical intermediate behavior.
- **Suppression failure:** The target signature persists when the proposed mechanism is disabled, indicating an alternative or confounding process.
- **Asymmetry artifact:** Observed asymmetries are caused by unmatched controls, boundary effects, or preparation bias rather than an intrinsic mechanism.

# Validity Checks

Before presenting final conclusions, verify:

- **Task / gap definition:** Is the anomaly stated as a specific operational failure of the baseline, not as a vague inconsistency?
- **Inverse / matched testing:** Are forward and reverse transformations, or matched conditions, evaluated under comparable resources and constraints?
- **Finite-scale boundary:** Does the conclusion depend on small-scale artifacts or an unjustified asymptotic limit?
- **Resource / correlation accounting:** Are omitted correlations, conservation laws, or environmental couplings tracked consistently?
- **Noise and calibration:** Could numerical error, sampling bias, or model-form uncertainty explain the signature?
- **Model specificity:** Which conclusions rely on the toy model rather than general principles?
- **Statistical validity:** Are uncertainties, confidence intervals, sensitivity analyses, and ensemble variation reported?
- **Reproducibility:** Are assumptions, code, transformations, and exclusion criteria documented enough for independent checking?
- **Extrapolation boundary:** Is the claim restricted to the validated regime, or is it being extended to broader classes without support?

# Provenance

Derived from cluster **210.0** (symmetry-guided mechanism discovery and validation), synthesizing patterns from source skills: `constructor-irreversibility-quantum-exploration`, `cloud-quantum-nuclear-structure-exploration`, `spinor-superfluid-soliton-dynamics-workflow`, `nonlocal-interfacial-modeling-research`, `reduced-phase-space-interaction-research-planning`, `membrane-remodeling-free-energy-exploration`, `nonlinear-wave-soliton-exploration`, `glass-dynamics-scale-aware-modeling`. No specific paper conclusions, parameters, or operational protocols are carried forward.
