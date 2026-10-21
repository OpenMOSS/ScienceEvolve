---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-fb77e255
description: Guide agents through an end-to-end, observable-driven workflow to discover, discriminate, and validate interfacial and transport mechanisms in coupled electrochemical or membrane systems without relying on single-paper conclusions or operational recipes.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents to translate an observed performance bottleneck in a coupled transport or interfacial system into a reusable, mechanism-coupled research workflow. The skill supports generating falsifiable hypotheses, designing staged validation with matched controls, analyzing multi-modal evidence, iterating on failure modes, and bounding claims—without treating any single source as field consensus.

# When to use

Use this skill when the user asks to:
- Propose research directions for systems where performance is limited by coupled transport, interfacial stability, or intermediate-species regulation.
- Design experiments that link material or process features to mechanistic functions across source, transport/interface, and sink zones.
- Evaluate whether a component-level improvement can transfer to a full system under realistic constraints.
- Generate hypothesis tables, control matrices, analysis plans, or iteration strategies for electrochemical energy storage, separation membranes, or analogous coupled devices.

Do not use this skill for operational laboratory recipes, hazardous procedural instructions, consumer product modification, or clinical applications.

# Inputs required

- Target system class and primary bottleneck (e.g., low utilization, unstable interface, selective transport failure, crossover).
- System decomposition: source zone, transport/interface zone, and sink zone.
- Candidate intervention class and predicted mechanistic function.
- Available evidence: literature, datasets, or preliminary observations.
- Constraints: safety approvals, characterization access, practical metrics, and applicable boundaries.
- Desired depth: concept screening, mechanism validation, or system-level benchmarking.

If inputs are missing, ask concise clarification questions before generating a plan.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Bottleneck Definition & System Decomposition
- State the practical bottleneck as a testable process limitation, not a generic performance gap.
- Decompose the system into coupled zones: source, transport/interface, and sink.
- Map intrinsic failure modes to required design functions (e.g., selective transport, interfacial stabilization, reversible conversion).
- **Decision gate:** Is the bottleneck observable and isolable? If not, refine scope or request more context.

## 2. Mechanism Hypothesis Generation
- Generate 3–6 candidate hypotheses as mechanism–function pairs.
- For each hypothesis record: target bottleneck, design function, key assumption, predicted observable, evidence strength (low/medium/high), and likely failure mode.
- Include at least one negative hypothesis explaining why the intervention may not help.
- **Decision gate:** Are the hypotheses falsifiable and discriminable with available controls? If not, redesign before proceeding.

## 3. Minimal Viable Validation Design
- Define independent variables (intervention class, architecture, stress level) and dependent variables (performance, transport, interfacial, or stability metrics).
- Construct a control matrix: baseline, negative, positive, mechanism-isolation, ablation, and non-functional analog.
- Pre-register stop/revise criteria and primary endpoints before data collection.
- **Decision gate:** Can the proposed test falsify the leading hypothesis? If not, add orthogonal controls or narrow the question.

## 4. Evidence Collection & Triangulation
- Gather structural, transport/interfacial, and system-performance evidence.
- Require at least two independent evidence types to support any mechanism claim.
- Confirm that the intended structure or interface exists before interpreting performance.
- **Decision gate:** Is the intended motif or interface confirmed? If no, stop and revise synthesis or processing; do not interpret performance.

## 5. Mechanism Discrimination & Analysis
- Map structure → mechanism → performance, keeping observed results separate from inferred mechanisms.
- Compare against matched baselines under identical constraints; check for confounders such as loading, normalization, or protocol differences.
- Identify trade-offs: an improvement in one metric may degrade another.
- **Decision gate:** Do controls support causal attribution? If no, lower evidence strength and redesign attribution tests.

## 6. Robustness & Boundary Testing
- Vary practical constraints (e.g., realistic loading, mixed feeds, scaling, stress conditions).
- Test whether local mechanism gains transfer to the full coupled system.
- **Decision gate:** Does the mechanism survive boundary changes? If no, bound claims and return to Step 2 with updated assumptions.

## 7. Claim Bounding & Iteration
- Update evidence strength, key assumptions, and failure modes based on results.
- Apply a decision rule:
  - **Confirm** if matched controls, diagnostics, and reproducibility all support the hypothesis.
  - **Refine** if the mechanism is plausible but a trade-off remains.
  - **Reject** if controls or diagnostics contradict the causal pathway.
  - **Defer** if evidence is ambiguous.
  - **Escalate** only after each prior stage is supported.
- **Stop conditions:** Mechanism is unsupported; safety margin narrows; trade-offs become unacceptable; controls fail to establish assay validity; or the hypothesis is indistinguishable from baseline variation.

# Output Format

When using this skill, produce:

1. **Research question and gap statement** — one concise bottleneck-focused question.
2. **Ranked hypotheses table** — target bottleneck, design function, key assumption, predicted observable, evidence strength, likely failure mode.
3. **Validation plan** — minimal viable validation and strong validation with control matrix.
4. **Control table** — baseline, negative, positive, mechanism-isolation, ablation, and non-functional analog.
5. **Analysis plan** — how to attribute results to mechanism rather than confounders.
6. **Study plan** — staged progression from mechanism proof to system-level validation.
7. **Claim boundary statement** — explicit limits on extrapolation and generalization.
8. **Failure modes and iteration rules** — triggers for revise, stop, defer, or escalate.

# Validation Gates

Before advancing past each stage, verify:

- **Scope clarity:** The research question addresses one bottleneck, not the entire field.
- **Control adequacy:** Baseline, negative, and mechanism-isolation controls are defined.
- **Mechanistic pairing:** Performance metrics are paired with at least one mechanism-specific diagnostic.
- **Comparability:** Independent variables, preparation history, and measurement protocols are matched across comparisons.
- **Pre-registration:** Success criteria, stop conditions, and primary endpoints are defined before testing.
- **Reproducibility:** Repeated samples or cells and variability estimates are planned.

# Claim Boundaries

- Do not extrapolate component or laboratory-scale results to practical system or commercial claims.
- Do not treat single-source observations, agent-generated hypotheses, or limited datasets as field-wide consensus.
- Distinguish observed results from inferred mechanisms and from speculative extensions.
- Bound claims by the tested chemistry, architecture, and stress conditions; state where they may not generalize.

# Failure Modes

Common ways this workflow fails or misleads:

- **Confounded comparison:** Unmatched loading, normalization, preparation, or protocol differences explain the apparent improvement.
- **Mechanism indistinguishability:** The proposed mechanism cannot be separated from baseline variation or an alternative explanation.
- **Trade-off masking:** A gain in one metric obscures a loss in stability, safety, or reversibility.
- **Structural decoupling:** Performance improves but post-test characterization shows the intended structure or interface did not persist.
- **Single-side optimization:** Improving one coupled zone degrades another because system coupling was ignored.
- **Over-extrapolation:** Laboratory results are generalized beyond tested boundary conditions without evidence.

# Validity Checks

Before finalizing any plan or conclusion, check:

- **Confounding:** Are mass, loading, fraction, inventory, inactive components, processing history, and normalization consistent across comparisons?
- **Reproducibility:** Are repeated preparations, repeated tests, variability, and outliers addressed?
- **Statistical validity:** Are endpoints, stopping criteria, and comparative claims defined before testing?
- **Boundary conditions:** Does the claim survive changes in realistic constraints, scaling, or system coupling?
- **Mechanism specificity:** Is each mechanism claim supported by direct evidence rather than inferred only from performance curves?
- **Extrapolation:** Are subsystem results clearly distinguished from full-system or deployment-ready claims?
- **Evidence separation:** Are source-paper observations distinguished from agent-generated hypotheses?

# Provenance

Derived from Cluster 4 / Subcluster 4.2 ("observable-driven mechanism discovery and validation"). Synthesized from the shared workflow route in the following source skills:
- `ass-li-s-research-workflow`
- `lis-battery-research-workflow`
- `lis-battery-electrolyte-research-workflow`
- `lis-battery-host-research-workflow`
- `electrochemical-kinetic-material-design`
- `gel-electrolyte-dual-electrode-research`
- `battery-interface-exploration`
- `hollow-fiber-lnf-research`
