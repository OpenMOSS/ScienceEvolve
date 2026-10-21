---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-461866f7
description: Design and execute an end-to-end mechanism discovery and validation workflow for complex material systems by linking performance gaps to falsifiable interface, phase, or defect hypotheses, triangulating orthogonal evidence, and iterating through explicit decision gates.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 17"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent convert a performance gap in a complex material system into a transferable, observable-driven mechanism discovery and validation workflow. The goal is to generate falsifiable hypotheses about how interfaces, phases, defects, or environmental coupling govern behavior, validate them through orthogonal evidence and strong controls, and iterate with explicit decision gates.

# When to use

Use when proposing or critiquing research directions for material systems—such as fiber-reinforced, composite, carbon-based, solid-state, multiphase, or interface-engineered architectures—where the limiting mechanism is ambiguous. Applicable when the task is to design hypotheses, controls, measurement plans, analysis protocols, or iteration rules rather than to reproduce a specific material recipe.

# Inputs required

- Target system class and intended function or performance window.
- Known bottleneck, failure mode, or gap that motivates the study.
- Candidate mechanism variables (e.g., interfacial coupling, phase distribution, defect state, environmental exposure, transport pathway).
- Available evidence streams and measurement access (structural, spectroscopic, transport, imaging, electrochemical, mechanical, etc.).
- Relevant benchmark or comparator systems and applicable control types.
- Constraints: safety boundaries, sample availability, reproducibility needs, and regulatory context.

# Core Workflow

1. **Frame the bottleneck.** Define the research question by the performance gap or failure mode, not by material novelty alone. Identify the target function and the dominant mechanistic uncertainty.
2. **Generate mechanism-linked hypotheses.** Produce 2–4 falsifiable hypotheses that connect a structural or environmental variable to an observable response. For each hypothesis record: proposed mechanism, predicted orthogonal observables, evidence strength (strong / moderate / weak / speculative), key assumptions, likely failure modes, and boundary conditions. Rank by decisiveness and feasibility of falsification.
3. **Design minimal viable validation.** Specify the smallest set of comparisons that can reject the leading hypothesis. Include: baseline, negative, positive/process, and weak-coupling controls; independent variables tied to one dominant mechanism; dependent variables spanning multiple length scales; and nuisance variables to hold constant. Predefine primary metrics, failure criteria, and stop conditions before data collection.
4. **Collect orthogonal evidence.** Gather at least two independent evidence streams (e.g., structural phase, surface chemistry, transport property, functional response) that must converge before a mechanism is assigned. Avoid inferring mechanism from a single fitted parameter or isolated metric.
5. **Gate 1 — Control and confound check.** Verify that controls behave as expected and that nuisance variables (geometry, moisture, temperature, processing history, instrument drift, batch variation) do not explain the target signal. If negative controls replicate the target trend, or if baseline/positive controls fail, stop and redesign.
6. **Gate 2 — Mechanism consistency check.** Require that independent evidence streams support the same causal story. If streams conflict, revise the hypothesis or improve measurement separation. If only one probe changes, classify the result as ambiguous and add targeted controls rather than advancing.
7. **Gate 3 — Functional translation check.** (When applicable) Confirm that mechanism-level improvements translate to the target function under relevant operating conditions. If material-level gains vanish in device-level or application-level tests, stop and redesign the architecture or boundary conditions.
8. **Iterate or terminate.**
   - **Supported:** If all gates pass, conduct robustness checks (batch variation, environmental boundaries, stability windows) before broadening scope.
   - **Partial support:** If one module improves while another fails, revise the causal chain and target the breaking module.
   - **Falsified:** If controls or orthogonal evidence contradict the hypothesis, record the boundary and generate an alternative hypothesis.
   - **Ambiguous:** If evidence is insufficient, add orthogonal measurements or stronger controls rather than expanding the design matrix.
   - **Stop:** Terminate if safety limits are exceeded, controls are irreproducible, the effect size is below uncertainty, or simpler architectures outperform the proposed mechanism.
9. **Bound the claim.** Label each conclusion as directly verified, model-inferred, or extrapolated. State boundary conditions (material class, architecture, environment, measurement regime). Treat literature comparisons as contextual, not field consensus.

# Output Format

1. **Research question:** One concise bottleneck-focused question.
2. **Ranked hypotheses table:** Mechanism, predicted observables, evidence strength, key assumptions, failure modes, and boundary conditions.
3. **Minimal validation plan:** Variables, control hierarchy, metrics, failure criteria, and stop conditions.
4. **Orthogonal evidence map:** What each evidence stream tests and how convergence is evaluated.
5. **Decision gate log:** Outcomes of Gate 1 (control/confound), Gate 2 (mechanism consistency), and Gate 3 (functional translation).
6. **Iteration plan:** Rules for support, partial support, falsification, and ambiguity.
7. **Claim boundary statement:** Verified versus inferred scope and applicable limits.

# Validation Gates

- **Control integrity:** Benchmarks, blanks, process controls, and weak-coupling variants behave consistently and as expected.
- **Confound isolation:** Geometry, moisture, temperature, processing, instrument drift, and batch variation are explicitly ruled out.
- **Mechanistic convergence:** At least two independent measurements agree before a mechanism is assigned.
- **Reproducibility:** Trends hold across independent samples or batches, not only across repeated scans of one specimen.
- **Statistical adequacy:** Reported effect sizes exceed measurement noise and model uncertainty; simpler models are considered before complex ones.

# Claim Boundaries

- Distinguish material-level performance from device-level or application-level readiness.
- Distinguish directly verified observations from model-inferred and extrapolated projections.
- Limit claims to tested boundary conditions (composition, architecture, environment, operating window).
- Treat single-study or literature comparisons as contextual evidence, not field consensus.

# Failure Modes

- **Confounding dominates:** The observed signal is driven by nuisance variables rather than the proposed mechanism.
- **Control failure:** Baseline or benchmark systems behave unexpectedly, invalidating the comparison frame.
- **Mechanism masking:** A single component, background process, or dominant artifact hides the target mechanism.
- **Model non-identifiability:** Multiple physical mechanisms fit the same observable equally well.
- **Overfitting:** A calibration or model explains the training condition but fails on held-out samples, geometries, or batches.
- **Translation gap:** Mechanism-level improvements do not survive at the functional or device level.
- **Instability:** The mechanism or performance degrades under repeated measurement, environmental exposure, or batch variation.

# Validity Checks

- Is the research question falsifiable and tied to a specific mechanism rather than a general performance wish?
- Is evidence labeled by provenance: directly verified, model-inferred, or analogical?
- Are controls sufficient across baseline, process, material, negative, positive, and environmental dimensions?
- Are confounders explicitly listed and checked against the data?
- Are replicates, uncertainty, and outlier handling reported transparently?
- Are model parameters presented as conditional on the chosen model, with simpler alternatives considered first?
- Are boundary conditions stated before any generalization?
- Do safety and compliance constraints exclude operational hazardous procedures?

# Provenance

- Synthesized from cluster 75.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: hybrid-nonlinear-optics-research-design (2204.04751), solid-state-li-s-anion-interface-exploration (10.1002/aenm.201900763), dielectric-composite-research-design (fiber__10.3390_polym15010193), mxene-surface-oxidation-research-workflow (10.1002_smsc.202500209), multiphase-defect-em-exploration (fiber__10.1002_adfm.202519905), fiber-epoxy-interface-research (fiber__10.1007_s12221-017-6752-4), fiber-supercapacitor-anode-exploration (fiber__10.1021_acsnano.2c05905), dielectric-sensing-research-design (fiber__10.1007_s12221-017-5358-1).
