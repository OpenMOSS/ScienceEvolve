---
name: sci-fiber-symmetry-guided-mechanism-discovery-workflow-2113f068
description: A reusable end-to-end workflow for generating, discriminating, and validating mechanism hypotheses in complex physical systems using symmetry arguments, minimal models, and multi-modal controls.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery workflow 7"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents in turning observations of anomalous or unexplained behavior into a structured research program that discovers, tests, and bounds physical mechanisms. The workflow abstracts a reusable pattern: frame a gap using symmetry or conservation principles, reduce the system to a minimal model, generate competing hypotheses, validate through controlled multi-signature studies, and iterate from mechanism-level mismatches.

# When to use

Use this skill when a user asks to:

- Propose new research directions where competing interactions, transport couplings, or emergent phases may explain anomalous behavior.
- Convert a theoretical mechanism into testable computational or analytical plans.
- Design minimal validation studies with appropriate controls and stopping criteria.
- Compare competing explanations for behavior in transport, energy, polymer, quantum, or electrochemical systems.
- Identify whether a proposed mechanism is supported by evidence rather than terminology alone.

Do not use this skill for operational experimental protocols, hazardous procedures, fabrication recipes, or as a substitute for domain-specific safety and ethics review.

# Inputs required

- Target system class and the observable anomaly or gap.
- Known baseline model or standard explanation.
- Candidate mechanisms and their required symmetry, conservation, or interaction assumptions.
- Available validation modalities (simulation, analytical, literature benchmark) and their limitations.
- Baseline states or comparison systems for controls.
- Success criteria, failure modes, and acceptable uncertainty.

# Core Workflow

1. **Frame the gap as a symmetry or conservation anomaly**
   - State the observed feature in non-interpretive terms.
   - Identify which standard model or baseline fails to explain it.
   - Ask whether the gap arises from missing degrees of freedom, broken symmetry, competing interactions, or multiscale coupling.
   - *Decision gate:* If the anomaly cannot be separated from measurement artifacts or known behavior, stop and refine the observation.

2. **Build a minimal mechanism map**
   - List dominant components, conserved quantities, driving forces, and candidate order parameters.
   - Identify the minimal physical ingredient that must be present for each candidate mechanism.
   - Choose the simplest abstraction (stochastic, continuum, symmetry-reduced, or graph-based) that preserves the dominant physics.
   - *Stop condition:* If no testable mechanism can be abstracted without unsupported material-specific assumptions, stop and request more domain input.

3. **Generate competing mechanism hypotheses**
   - For each candidate, state a concise mechanistic claim.
   - Assign evidence strength (`strong`, `moderate`, `weak`, `speculative`).
   - List key assumptions, predicted distinguishing signatures, and failure modes.
   - Require at least two hypotheses that predict different outcomes under mechanism-specific controls.
   - *Candidate gate:* If hypotheses are not mutually distinguishable with available modalities, redesign the abstraction or controls before proceeding.

4. **Design minimal viable validation**
   - Define the smallest comparison that can falsify a hypothesis.
   - Specify independent variables (mechanism ingredient, coupling term, boundary condition, abstraction choice).
   - Specify dependent variables (observable proxy, consistency diagnostic, robustness metric).
   - Include strong controls (remove or alter one mechanism ingredient), negative controls (regime where mechanism should be absent), and positive controls (known case where signature is expected).
   - Predefine success, failure, and inconclusive outcomes.
   - *Stop condition:* If the design requires unsafe, noncompliant, or directly executable high-risk procedures, stop and replace with non-operational benchmarks.

5. **Execute reduced-model or multi-modal validation**
   - Run simulations, analyze data, or perform analytical checks.
   - Verify internal consistency (conservation laws, entropy balance, convergence, grid independence).
   - Collect at least two independent signatures from different modalities or analysis layers.
   - *Stability gate:* If consistency checks fail or numerical artifacts dominate, pause interpretation and repair the model setup.

6. **Discriminate mechanisms**
   - Compare target and control systems using the same analysis pipeline.
   - Test whether the proposed mechanism explains multiple independent signatures.
   - Check whether simpler alternatives (disorder, finite-size effects, boundary artifacts, nuisance variables) explain the same observations.
   - *Mechanism exclusion gate:* If a simpler explanation fits all signatures, reject the complex hypothesis and update the mechanism map.

7. **Iterate or redesign**
   - If the primary signature appears and controls pass, strengthen the hypothesis but require an additional cross-modal test before broad claims.
   - If the signature is absent, check whether the mechanism predicts absence under the tested conditions; if so, map boundary conditions rather than treating as failure.
   - If controls fail or results are ambiguous, redesign the measurement, abstraction, or analysis before interpreting.
   - If the mechanism is unsupported by diagnostics, revise descriptors or mechanism before proposing new candidates.
   - *Iteration gate:* Decide whether to continue (add complexity), pivot (change abstraction), or terminate (claim is falsified or unsupported).

8. **Bound claims and document provenance**
   - Label each claim as source-supported, cross-study-supported, or agent-inferred.
   - State extrapolation boundaries (system class, symmetry regime, length scale, timescale).
   - Archive the mechanism map, control table, and decision log for reproducibility.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question framed around model behavior or testable mechanism.
2. **Mechanism map** — Dominant components, conserved quantities, implicit assumptions, and excluded processes.
3. **Hypothesis portfolio** — Competing hypotheses with evidence strength, key assumptions, predicted signatures, failure modes, and boundary conditions.
4. **Validation plan** — Minimal viable validation, strong/negative/positive controls, variables, metrics, and stop conditions.
5. **Analysis plan** — Multi-signature diagnostics, sensitivity checks, uncertainty handling, and consistency checks.
6. **Iteration decision** — Conditions for continuing, pivoting, or terminating the research cycle.
7. **Validity and boundary statement** — Confounders, reproducibility risks, extrapolation limits, and evidence labels.

# Validation Gates

- **Anomaly clarity:** Is the observed feature separable from artifacts and known behavior?
- **Abstraction validity:** Does the minimal model preserve the dominant physics without unsupported assumptions?
- **Distinguishability:** Can competing hypotheses be discriminated with the proposed controls?
- **Consistency:** Do conservation laws, symmetry constraints, and numerical diagnostics agree within tolerance?
- **Control adequacy:** Have strong, negative, and positive controls been defined and executed?
- **Cross-modal convergence:** Does the mechanism explain at least two independent signatures?
- **Safety and compliance:** Are all proposed validations non-operational and free of hazardous procedural detail?

# Claim Boundaries

- Distinguish verified model behavior from extrapolation or analogy.
- Do not present a single source’s interpretation as field-wide consensus.
- Limit claims to systems with analogous symmetry classes, transport couplings, and validated assumptions.
- Separate mechanism evidence from predictive model performance.
- Mark agent-inferred extensions as speculative until independently validated.

# Failure Modes

- **Artifact-driven anomaly:** The observed gap is caused by measurement error, numerical instability, or preprocessing bias.
- **Under-constrained abstraction:** The minimal model lacks the resolution to distinguish competing mechanisms.
- **Confounded controls:** A nuisance variable (boundary condition, disorder, finite-size effect) explains the signature.
- **Overfitting to one signature:** The mechanism explains only one observable and fails independent tests.
- **Inconsistent foundations:** Violation of conservation laws, symmetry, or convergence invalidates interpretation.
- **Extrapolation beyond evidence:** Claims are generalized to regimes where assumptions break down.
- **Unsafe operational drift:** The research design inadvertently implies hazardous experimental procedures.

# Validity Checks

- **Confounding:** Could performance be explained by uncontrolled variables, preprocessing, or benchmark-specific artifacts?
- **Reproducibility:** Are data roles, splits, model definitions, analysis pipelines, and stopping criteria documented?
- **Statistical or numerical validity:** Are uncertainty estimates, convergence tolerances, repeated runs, or sensitivity analyses sufficient?
- **Boundary conditions:** Which system classes, length scales, timescales, and symmetry regimes remain untested?
- **Leakage or bias:** Could training, validation, and evaluation share unintended information or physical bias?
- **Mechanism specificity:** Does an ablation or diagnostic isolate the proposed mechanism from simpler alternatives?
- **Evidence labeling:** Are source-supported findings clearly separated from new hypotheses and analogies?

# Provenance

- Derived from cluster 25.0 (symmetry-guided mechanism discovery and validation).
- Synthesized from source skills: synthetic-to-real-pad-research, nuclear-matter-instability-exploration, ion-transport-mesoscale-simulation-design, chiral-magnet-skyrmion-research-design, catalysis-ai-research-workflow, unfitted-density-topology-optimization-research, associative-polymer-condensate-research-design, nonisothermal-electrochemical-modeling.
- Paper-specific conclusions, material systems, and numerical parameters have been removed to produce a domain-agnostic workflow.
