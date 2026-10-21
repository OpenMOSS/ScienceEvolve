---
name: sci-fusion-symmetry-guided-plasma-mechanism-discovery-w-49e8cc39
description: Use this skill when designing end-to-end research workflows to discover, discriminate, and validate physical mechanisms in magnetized plasma systems via symmetry analysis, reduced-model hierarchies, and controlled triangulation across analytical, simulation, and benchmark evidence.
scienceevolve-title: "Magnetic confinement fusion · symmetry guided plasma mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Guide agents to design reusable, end-to-end research workflows for discovering and validating physical mechanisms in magnetized plasma systems. The workflow transfers a symmetry-guided pattern: expose hidden assumptions and invariants, generate discriminating mechanism-first hypotheses, validate through a tiered model ladder with controlled comparisons, and iterate based on evidence triangulation rather than single-model agreement.

# When to use

Use this skill when the user asks to:

- Propose new research questions about reduced models, transport channels, stability properties, or equilibrium mechanisms in magnetized plasmas.
- Design theoretical or computational studies that test whether a symmetry, invariant manifold, or scale separation protects or enables a target mechanism.
- Compare reduced, intermediate, and higher-fidelity descriptions of the same phenomenon.
- Validate a model assumption or mechanism claim against analytical limits, benchmarks, or independent diagnostics.
- Iterate a research plan based on falsification, control failure, or boundary discovery.

Do not use this skill for operational device instructions, hazardous experimental procedures, or as a substitute for facility safety review.

# Inputs required

Ask for or infer the following before producing a plan:

- **Target system class** and magnetic geometry family (described conceptually, not as device presets).
- **Mechanism or modeling gap** to be investigated.
- **Candidate reduced models** or approximation families under consideration.
- **Known invariants, conservation laws, or symmetry properties** relevant to the target observable.
- **Available evidence:** analytical limits, simulation capabilities, benchmark datasets, or prior validated models.
- **Intended output:** research questions, hypothesis matrix, validation design, analysis plan, or iteration strategy.
- **Safety and compliance constraints** relevant to the research environment.

If inputs are missing, state assumptions explicitly and label the resulting plan as provisional.

# Core Workflow

Follow this ordered route. At each gate, decide whether to continue, pause, redesign, or stop.

## 1. Frame the gap and target observable
Define the unresolved mechanism and the specific observable that would discriminate among candidate explanations. Decompose broad goals into a narrow, testable question.

- **Decision Gate 1:** Is the question narrow enough to be addressed by a reduced model or controlled comparison?  
  - *No:* Decompose into sub-questions and return to step 1.  
  - *Yes:* Proceed.

## 2. Expose hidden assumptions and symmetries
Identify the scale separations, coordinate consistencies, topological constraints, and symmetry or invariant properties that candidate models require. Replace vague descriptions with structural or mathematical test conditions.

- **Decision Gate 2:** Are the core assumptions structurally testable?  
  - *No:* Reformulate assumptions or stop.  
  - *Yes:* Proceed.

## 3. Generate mechanism-first hypotheses
Produce 3–6 ranked hypotheses that link field structure, reduced dynamics, or invariant behavior to the target observable. For each, specify:
- Concise claim.
- Evidence strength (e.g., speculative, model-supported, benchmark-supported).
- Key assumptions.
- Predicted signature.
- Likely failure mode.
- Minimal non-operational test.

- **Decision Gate 3:** Are the hypotheses mutually discriminating and falsifiable?  
  - *No:* Refine discriminators or add controls.  
  - *Yes:* Proceed.

## 4. Build a model ladder
Establish an analytical baseline, a reduced model, an intermediate closure, and a higher-fidelity reference. Ensure each rung preserves relevant constraints (conservation laws, divergence properties, or exact invariants) before discarding terms.

- **Decision Gate 4:** Does the reduced rung recover known limiting cases and preserve constraints to the required tolerance?  
  - *No:* Revise the ordering, variable choice, or averaging procedure.  
  - *Yes:* Proceed.

## 5. Design controlled validation
Define independent variables, dependent variables, and confounders. Specify:
- **Positive control:** known case where the mechanism should operate.
- **Negative control:** case where the mechanism should be absent.
- **Strong control:** comparison with an independent formulation or benchmark.
- **Robustness controls:** variation of geometry, boundary treatment, closure, or resolution one factor at a time.

Pre-register primary and secondary metrics, and define stop conditions before running tests.

- **Decision Gate 5:** Can the controls isolate the proposed mechanism from numerical artifacts, boundary effects, and model-form bias?  
  - *No:* Redesign controls or narrow the claim.  
  - *Yes:* Proceed.

## 6. Execute analysis with constraint audits
Run the planned comparisons in this order:
1. State the model hierarchy and hidden assumptions.
2. Verify order consistency: retained terms must dominate discarded terms under the stated assumptions.
3. Check local versus global validity: test whether quantities valid along a trajectory or surface extend over neighborhoods or global domains.
4. Quantify conservation, symmetry, or invariant residuals.
5. Compare against analytical baselines and benchmarks.
6. Estimate uncertainty from numerical, diagnostic, reconstruction, and model-form sources.

- **Decision Gate 6:** Do results survive model-form variation and numerical sensitivity checks within pre-specified tolerance?  
  - *No:* Diagnose whether the failure is numerical, assumption-related, or physical; redesign or stop.  
  - *Yes:* Proceed.

## 7. Triangulate and grade evidence
Compare signatures across the model ladder and independent diagnostics. Grade each hypothesis:
- **Descriptive:** pattern observed but not mechanistically isolated.
- **Model-consistent:** matches reduced model expectations.
- **Mechanism-supported:** survives multiple independent checks.
- **Independently validated:** reproduced by distinct formulations or benchmarks.

- **Decision Gate 7:** Is the evidence strong enough to support the claim given the pre-registered failure modes?  
  - *No:* Downgrade evidence strength and return to step 3 or 5.  
  - *Yes:* Proceed.

## 8. Iterate or bound the claim
- **Continue** when the mechanism is supported across the ladder, controls separate cleanly, and validity criteria give reproducible signatures. Narrow the validity boundary rather than claiming broad generality.
- **Pause** when field representation, coordinate construction, or diagnostic interpretation remains uncertain.
- **Redesign** when the test cannot distinguish hidden-assumption failure from the target mechanism.
- **Stop** when the model violates its own ordering, controls fail, uncertainty dominates the signature, or safety/compliance criteria are triggered.
- **Escalate** to independent review before broad extrapolation or high-resource follow-up.

Archive failure modes and the exact assumptions that failed for future reference.

# Output Format

When using this skill, return:

1. **Research objective and gap statement.**
2. **Hidden assumptions and symmetry/scale-separation audit.**
3. **Ranked hypothesis matrix:** claim, evidence strength, key assumptions, predicted signature, failure mode, and minimal test.
4. **Model ladder definition:** analytical baseline, reduced model, intermediate closure, and higher-fidelity reference.
5. **Controlled validation design:** variables, controls, metrics, diagnostics, and stop conditions.
6. **Analysis plan:** constraint audits, local/global checks, benchmark comparisons, and uncertainty treatment.
7. **Evidence triangulation summary:** grades, model-form agreement, and diagnostic cross-checks.
8. **Iteration roadmap:** continue/pause/redesign/stop rules and extrapolation boundaries.
9. **Provenance and safety notes.**

# Validation Gates

Enforce these gates before advancing:

- **Gate 1 — Question testability:** The research question must be narrow enough for a reduced model or controlled comparison to address.
- **Gate 2 — Assumption testability:** Core assumptions must be expressible as structural or mathematical conditions.
- **Gate 3 — Hypothesis discriminability:** Hypotheses must be mutually discriminating and falsifiable.
- **Gate 4 — Limiting-case recovery:** The reduced model must recover known limits and preserve relevant constraints.
- **Gate 5 — Control isolation:** Controls must be able to separate the mechanism from artifacts, boundaries, and model-form bias.
- **Gate 6 — Robustness:** Results must survive model-form variation and numerical sensitivity within tolerance.
- **Gate 7 — Evidence grade:** Claims must not exceed the pre-registered evidence grade and failure modes.

# Claim Boundaries

- Distinguish source-paper-supported methodological patterns from agent-inferred extensions to new systems.
- Do not treat single-configuration, single-model, or single-paper results as field-wide consensus.
- Separate local validity from global validity; separate first-order plausibility from higher-order formal consistency.
- Do not extrapolate beyond tested symmetries, topologies, equilibrium families, or regimes.
- Avoid presenting simulation or theoretical agreement as evidence of device operational readiness or safety.

# Failure Modes

Stop or downgrade the claim when:

- The target observable depends on dynamics that the reduction intentionally removes.
- The reduced model violates its own ordering or fails to recover known limiting cases.
- Positive and negative controls do not separate cleanly.
- Results are sensitive to coordinate choice, boundary condition, smoothing, or numerical resolution without invariant meaning.
- Conservation, symmetry, or invariant residuals exceed the tolerance required for the target observable.
- A single diagnostic or model level disagrees with all others without an explainable assumption chain.
- The hypothesis is unfalsifiable given available resources, data, or computational constraints.
- The plan requires operational, hardware, or safety assumptions outside theoretical or simulation scope.

# Validity Checks

Before finalizing any plan, verify:

- **Trigger fit:** The task concerns mechanism discovery or model validation in magnetized plasma research.
- **Scope:** The skill supports research planning and design, not execution of hazardous plasma operations.
- **Mechanism preservation:** The plan exposes hidden assumptions and tests them explicitly.
- **Evidence labeling:** New hypotheses distinguish source-supported facts from agent inference.
- **Model hierarchy:** First-order plausibility, higher-order consistency, and full dynamics are not conflated.
- **Controls:** Minimal validation includes positive, negative, strong, and robustness controls where feasible.
- **Statistics and numerics:** Uncertainty, resolution sensitivity, boundary sensitivity, convergence, and reproducibility are addressed.
- **Boundary conditions:** The plan states where conclusions may not extrapolate.
- **No overclaiming:** A single result is not treated as universal consensus.
- **Safety:** The plan avoids executable high-risk operational settings or procedural instructions.

# Provenance

Synthesized from cluster 10, subcluster 10.2 ("symmetry-guided mechanism discovery and validation"). Derived from source skills: magnetic-field-model-validity-research (10.1063_1.3206671), isodrastic-guiding-centre-exploration (10.1088_1361-6544_acf26a), reduced-mhd-research-pattern (10.1063_1.873152), mhd-instability-saturation-research-pattern (10.1017_s0022377823000934), gyrokinetic-transport-research-workflow (10.1017_s002237781900031x), magnetic-confinement-equilibrium-exploration (10.1515_zna-1982-0810), stellarator-reduced-model-research (10.1088_0032-1028_22_7_010), high-field-mirror-gyrokinetic-research-design (10.1063_5.0152440).
