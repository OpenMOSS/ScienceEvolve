---
name: sci-quantum-observable-driven-mechanism-discovery-workf-c5bbc068
description: A reusable end-to-end workflow for designing studies that distinguish competing mechanisms behind weak, anomalous, or structured observables in physical systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 7"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides an agent to transform ambiguous, weak, or structured observable signatures into a structured program of mechanism discovery and validation. It is designed for physical systems where multiple explanations compete—such as genuine transitions, finite-size effects, measurement artifacts, or competing order parameters—and the goal is to design discriminating tests rather than reproduce a single prior result.

# When to use

Use this skill when the user asks to:

- Propose research questions or hypotheses about anomalous, intermittent, weak, or regime-dependent signatures.
- Design experiments, simulations, or analyses that distinguish a candidate mechanism from confounding effects.
- Build validation plans involving multiple independent observables, statistics, or channels.
- Iterate on hypotheses when initial results are ambiguous or controls disagree.

Do not use this skill for one-off reproduction of a specific paper's parameters, operational laboratory recipes, hardware implementation plans, or high-risk procedural instructions.

# Inputs required

Before beginning the workflow, collect or request:

- **System context:** target model, material, or platform class and relevant control parameters.
- **Observable signature:** the anomalous or structured feature to be explained (e.g., transport anomaly, localization transition, intermittent burst, weak periodic signal).
- **Candidate mechanisms:** competing physical explanations and known artifact sources.
- **Available probes:** measurement modalities, simulation methods, or theoretical tools accessible to the study.
- **Control dimensions:** parameters that can be varied to move the system across regimes.
- **Constraints:** feasibility limits, safety boundaries, reproducibility requirements, and resource budgets.
- **Evidence baseline:** prior measurements, literature claims, and their known limitations or contradictions.

If critical inputs are missing, produce an input-gathering plan and avoid strong mechanism claims.

# Core Workflow

Execute the following phases in order. Treat each **Decision Gate** as a hard stop or redesign trigger if the criterion is not met.

## Phase 1: Signature Framing & Hypothesis Generation

1. Reframe the claim as an observable signature rather than a mechanism.
2. Identify the baseline model prediction and the gap driving the research question.
3. Generate a structured hypothesis set:
   - **Phenomenological hypothesis:** what pattern should appear if the candidate mechanism is real.
   - **Artifact hypothesis:** how measurement, finite sampling, boundary effects, or analysis choices could mimic the signature.
   - **Discriminating hypothesis:** what minimal observation would separate the target mechanism from artifacts and competing explanations.
4. For each hypothesis, record: evidence strength (weak/moderate/strong), key assumptions, predicted observables, and likely failure modes.

**Decision Gate 1:** Are all hypotheses falsifiable and linked to at least one distinct observable or control outcome? If not, refine definitions before proceeding.

## Phase 2: Study Design & Control Architecture

1. Define independent variables (regime, scale, measurement resolution, tuning parameter), dependent variables (primary and secondary observables), and nuisance variables (noise, drift, finite sampling, boundary conditions).
2. Assemble a control suite:
   - **Baseline control:** known behavior without the candidate mechanism active.
   - **Positive control:** condition where an established signature is expected.
   - **Negative control:** condition where the hypothesized artifact should appear but the target mechanism should not.
   - **Robustness control:** variation of analysis thresholds, system size, coarse-graining, or boundary definition.
3. Pre-register the analysis plan: observable definitions, segmentation rules, statistical tests, model comparison criteria, and visualization strategy.
4. Define stopping conditions:
   - Controls fail or behave unexpectedly.
   - Signature depends on arbitrary analysis choices without physical justification.
   - Finite-size, boundary, or sampling effects dominate the signal.

**Decision Gate 2:** Does the design include at least one independent confirmation channel and a negative control capable of mimicking the artifact? If not, redesign.

## Phase 3: Execution & Control Monitoring

1. Collect, simulate, or observe data across the designed conditions.
2. Monitor control behavior in parallel with target observations.
3. Document deviations from protocol, data quality issues, and boundary effects.

**Decision Gate 3:** Do baseline and positive controls behave as expected? If controls fail, halt target interpretation and diagnose the pipeline.

## Phase 4: Multi-Diagnostic Analysis

1. Apply the pre-registered analysis to all conditions.
2. Use multiple diagnostics that probe different parts of the distribution or mechanism:
   - Typical-value statistics vs. raw moments vs. tail-sensitive measures.
   - Time-resolved, ensemble-averaged, and scale-dependent analyses.
   - Independent observables or channels sensitive to different aspects of the mechanism.
3. Test robustness: vary thresholds, fitting windows, system sizes, coarse-graining, and boundary treatments.
4. Validate the pipeline on synthetic or benchmark data with known ground truth.

**Decision Gate 4:** Do at least two independent diagnostics converge on the same qualitative conclusion? If they conflict, classify the discrepancy as confounder, scale effect, or model failure before claiming a mechanism.

## Phase 5: Mechanism Discrimination & Evidence Synthesis

1. Compare observations against predictions of each competing hypothesis.
2. Classify the outcome:
   - **Sampling/scale artifact:** signature vanishes under controls or varies with ensemble size/observation scale.
   - **Boundary or finite-size effect:** signature is tied to system edges, small sizes, or transient regimes.
   - **Supported mechanism:** signature is robust across controls, scales, and independent channels.
   - **Ambiguous:** multiple hypotheses remain viable.
3. Assign evidence strength per hypothesis:
   - **Weak:** single indirect signal or unresolved artifact risk.
   - **Moderate:** reproducible marker with at least one independent supporting channel.
   - **Strong:** multiple independent channels agree, controls pass, and boundary behavior is consistent.
4. Update the hypothesis table with new evidence, revised assumptions, and preserved failure modes.

**Decision Gate 5:** Does the leading hypothesis explain the full set of independent observables better than all concrete alternatives? If not, downgrade the claim to tentative or ambiguous.

## Phase 6: Iteration or Termination

1. **If evidence is strong and controls pass:** Refine quantitative bounds, define the scope of validity, and propose the next discriminating test for mechanism refinement.
2. **If evidence is ambiguous:** Identify the weakest assumption in the leading hypothesis and design a targeted follow-up that directly tests it.
3. **If evidence is negative:** Preserve the null result as a constraint on future models and stop.
4. **Terminate and redesign if:**
   - The signature is selection-dependent or appears only under negative controls.
   - Finite sampling, boundary effects, or basis artifacts fully explain the observation.
   - Safety, ethical, or feasibility boundaries are reached.

# Output Format

Each invocation must produce:

1. **Research question** — concise statement linking system, observable, and mechanism class.
2. **Hypothesis table** — for each hypothesis: evidence strength, key assumptions, predicted observables, discriminating controls, and likely failure modes.
3. **Validation plan** — variables, control suite, minimal viable conditions, evaluation metrics, and stop criteria.
4. **Analysis plan** — pre-registered diagnostics, robustness checks, synthetic validation steps, and uncertainty estimation.
5. **Evidence synthesis** — classified outcome, updated evidence strengths, and preserved ambiguities.
6. **Iteration roadmap** — next test if ambiguous, termination rationale if stopped, and scope boundaries.
7. **Validity and safety notes** — confounders, reproducibility requirements, non-operational safety constraints, and claim boundaries.

# Validation Gates

- **Hypothesis falsifiability:** Every mechanism and artifact claim must predict a distinct observable or control outcome.
- **Control adequacy:** Baseline, positive, and negative controls must be defined before inspecting the signal region.
- **Diagnostic convergence:** At least two independent observables or statistics must agree before upgrading evidence strength.
- **Robustness:** Conclusions must survive reasonable variation of thresholds, scales, and boundary conditions.
- **Scope containment:** Claims must be bounded to the tested parameter regime, model class, and platform.

# Claim Boundaries

- **Observed facts** (timing, morphology, control outcomes) may be reported directly.
- **Mechanistic inferences** require passing all validation gates and must be labeled with evidence strength.
- **Speculative extensions** beyond the tested regime or model class must be explicitly flagged as such.
- Do not present single-study or single-source findings as field-wide consensus.
- Do not extrapolate quantitative parameters to untested regimes without independent validation.

# Failure Modes

- **Control failure:** Positive or negative controls behave opposite to prediction, indicating pipeline or model error.
- **Threshold dependence:** Signature appears only under a narrow analysis choice, suggesting artifact.
- **Finite sampling / scale dominance:** Tail undersampling, boundary transients, or system-size effects masquerade as physical mechanisms.
- **Basis or measurement artifact:** Choice of basis, measurement partition, or instrument response creates apparent structure.
- **Confounding by unmodeled variables:** Hidden slow variables, drift, heterogeneity, or environmental coupling explains the signature.
- **Overfitting to one observable:** A single diagnostic supports the mechanism while independent diagnostics do not.

# Validity Checks

Before finalizing any proposal or conclusion, verify:

- **Confounding:** Can backgrounds, drifts, selection effects, or environmental variables reproduce the signature?
- **Reproducibility:** Are independent runs, samples, or analysis pipelines consistent?
- **Statistical validity:** Are uncertainty estimates, convergence checks, and multiple-testing concerns addressed?
- **Boundary conditions:** Are results tied to specific system sizes, geometries, or measurement regions?
- **Model validity:** Does the theoretical framework include the relevant order parameters and limiting cases?
- **Evidence separation:** Are directly observed facts cleanly separated from inferred mechanisms and speculation?
- **External validity:** Can conclusions generalize to another tuning route or platform, or are they regime-specific?

# Provenance

Synthesized from cluster `190.0` (observable-driven mechanism discovery and validation). Source skills: `a7fd43b41e9d276e` (localized transient instability research), `0687465e49187d50` (anomalous diffusion subordination workflow), `9072e25dd5132a20` (astroparticle weak signal exploration), `022c3024c08ecf08` (quantum many-body chaos exploration), `7978bf63f6b811b5` (iron ladder nematicity research design), `arxiv-cmoat__2606.20664` (finite sampling stochastic transport research), `f41eaee67743932f` (quantum measurement dynamical localization exploration), `82a83ae1fcfa9455` (extreme phase transition exploration).
