---
name: sci-quantum-mechanism-discovery-validation-workflow-2d556c6e
description: A reusable end-to-end workflow for generating, discriminating, and validating candidate mechanisms in complex quantum, stochastic, or nonlinear systems through hypothesis-driven minimal validation and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · mechanism discovery validation workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to transform observations, platform capabilities, or theoretical gaps into structured research programs that identify, test, and bound mechanistic explanations. The workflow emphasizes discriminating among candidate mechanisms through controlled minimal validation rather than treating single-study findings, correlations, or proof-of-principle demonstrations as established causal consensus.

# When to use

Use this skill when:

- A user asks how to explain a transition, emergent behavior, or performance limit in a complex system.
- The task involves comparing candidate mechanisms, architectures, encodings, or resource strategies.
- The user needs a conceptual or non-operational plan for hypothesis generation, validation design, analysis, and iteration.
- The target system exhibits stochastic, multiscale, nonlinear, or quantum behavior where hidden variables or initialization artifacts may confound interpretation.
- The goal is to bound claims, assess robustness, or redesign a study after an initial mismatch.

Do not use this skill to request or provide executable laboratory protocols, device-specific operating instructions, or clinical interventions.

# Inputs required

Before producing a research plan, collect or infer:

- **Target phenomenon:** the behavior, transition, or estimation task to be explained.
- **Candidate mechanisms or observables:** proposed explanatory variables, reaction coordinates, interaction structures, or resource properties.
- **System context:** available degrees of freedom, native interactions, constraints, noise channels, and boundary conditions at an abstract level.
- **Evidence base:** prior theoretical bounds, simulation tools, literature benchmarks, or empirical constraints.
- **Baselines:** standard, memoryless, non-adaptive, or stripped-down references for fair comparison.
- **Claim scope:** intended strength of inference (exploratory, model-supported, or mechanistic).
- **Safety and compliance boundaries:** non-operational scope, institutional review requirements, or dual-use considerations.

If inputs are missing, state assumptions explicitly and downgrade confidence labels.

# Core Workflow

Execute the following stages in order. Do not proceed to the next stage until the preceding gate is satisfied.

## Stage 1: Gap framing and mechanism abstraction
1. Define the domain gap or performance bottleneck in platform-neutral terms.
2. Identify the minimal set of variables, interactions, or resources that could plausibly explain the phenomenon.
3. **Gate 1 — Feasibility:** Stop if the phenomenon cannot be operationalized into observable outcomes or if no falsifiable mechanism can be stated.

## Stage 2: Hypothesis generation
1. For each candidate mechanism, formulate:
   - A concise mechanistic claim.
   - Expected signature: the observable pattern that would support the claim.
   - Key assumptions and their failure modes.
   - Evidence strength label (`established`, `plausible`, `speculative`, or `unsupported`).
2. Generate at least one alternative explanation (e.g., hidden variable, measurement artifact, baseline inadequacy, or initialization bias).
3. **Gate 2 — Falsifiability:** Stop if hypotheses lack a defined minimal test or if no negative/positive control can be conceived.

## Stage 3: Minimal validation design
1. Define the smallest system or dataset that can exercise the proposed mechanism.
2. Specify independent variables, dependent variables, and nuisance variables at an abstract level.
3. Design layered controls:
   - **Baseline control:** conventional or standard reference under matched conditions.
   - **Negative control:** configuration with the proposed mechanism disabled or removed.
   - **Positive control:** simplified setting where the mechanism is known to operate.
   - **Robustness control:** perturbation ensemble, alternate topology, or noise realization.
4. Define primary and secondary metrics aligned with the mechanism, not only with overall performance.
5. Define stopping conditions for the validation:
   - The candidate fails to exceed the baseline under realistic uncertainty.
   - Resource overhead, noise, or measurement cost dominates the signal.
   - Results depend on arbitrary tuning or hidden preprocessing choices.
6. **Gate 3 — Design integrity:** Stop if controls are insufficient to isolate the mechanism or if metrics do not track the claimed signature.

## Stage 4: Evidence collection and analysis
1. Execute the minimal validation (simulation, theoretical derivation, or non-operational experiment).
2. Estimate metrics with uncertainty, separating statistical from systematic sources.
3. Compare candidate against baselines using pre-specified comparison rules.
4. Check mechanism consistency: verify that independent diagnostics align with the primary metric.
5. Test robustness across perturbations, initial conditions, model choices, or preprocessing variations.
6. **Gate 4 — Discrimination:** If the candidate and baseline are statistically indistinguishable, proceed to Stage 6 (iteration). If the candidate passes, proceed to Stage 5.

## Stage 5: Mechanism discrimination and exclusion
1. Attempt to exclude alternative explanations by examining residuals, hidden-variable proxies, or module-isolation tests.
2. Determine whether the observed signature is necessary and/or sufficient for the mechanism.
3. Map the valid operating regime: identify where the mechanism holds, degrades, or reverses.
4. **Gate 5 — Exclusion power:** If alternatives cannot be ruled out, downgrade the claim to correlational or platform-specific and proceed to iteration.

## Stage 6: Iteration or redesign
1. **If the mechanism is rejected:** Reformulate the representation, search for hidden variables, or abandon the candidate.
2. **If the mechanism is provisionally supported:** Broaden the test to larger systems, additional conditions, or stronger baselines.
3. **If results are ambiguous:** Improve decomposition (e.g., separate fast and slow scales, internal and external loss, or logical and physical layers) and redesign controls.
4. **If a new regime is proposed:** Treat it as a fresh hypothesis requiring independent validation.
5. **Stop condition:** Halt iteration when further complexity does not improve explanatory power, when uncertainty dominates, or when the claim scope must narrow to a boundary condition.

## Stage 7: Claim bounding and documentation
1. Label every conclusion by evidence class: `proven`, `constructed`, `model-supported`, `inferred`, or `speculative`.
2. State boundary conditions: platform family, noise regime, system size, topology, or access model.
3. Document reproducibility artifacts: assumptions, random seeds, analysis code, preprocessing steps, and deviation logs.
4. **Final gate — Consensus discipline:** Do not present single-study or single-platform findings as field-wide consensus.

# Output Format

Each invocation must produce:

1. **Research question framing:** concise question, motivation, and scope boundaries.
2. **Hypothesis matrix:** for each candidate, include mechanism, expected signature, evidence strength, key assumptions, minimal test, and likely failure modes.
3. **Validation design:** minimal system, variables, layered controls, metrics, and stopping conditions.
4. **Analysis summary:** metric estimates with uncertainty, baseline comparisons, robustness checks, and mechanism-consistency diagnostics.
5. **Iteration log:** decisions taken at each gate, redesign rationale, and stopping justification.
6. **Boundary statement:** evidence labels, valid regimes, confounders, and extrapolation limits.

# Validation Gates

Before advancing past each stage, confirm:

- **Construct validity:** The chosen observables and metrics actually represent the target mechanism.
- **Control adequacy:** Baseline, negative, positive, and robustness controls are present and matched.
- **Baseline fairness:** Comparisons use equivalent resources, noise models, and measurement assumptions.
- **Reproducibility:** Methods, seeds, preprocessing, and model choices are specified sufficiently for independent repetition.
- **Statistical validity:** Uncertainty accounts for temporal correlation, finite sampling, and model variance where applicable.
- **Objective alignment:** The cost function or metric tracks the scientific question, not an indirect proxy.

# Claim Boundaries

- Distinguish `paper-supported method` from `agent-inferred extension` and `speculative hypothesis`.
- Limit causal claims to the tested regime; distinguish correlation from mechanism.
- Separate theoretical universality or scaling law from demonstrated performance under realistic constraints.
- Do not extrapolate beyond the validated platform class, process structure, or access model.
- Flag any conclusion that relies on unequal resource accounting, hidden variables, or post-selection.

# Failure Modes

Common failure modes to anticipate and report:

- **Confounding:** Hidden variables, initialization artifacts, calibration drift, or measurement bias masquerade as mechanism.
- **Baseline inequity:** The candidate appears superior only because the baseline uses weaker resources or stronger noise.
- **Objective mismatch:** Optimization improves a proxy metric without advancing the target scientific question.
- **Robustness collapse:** The mechanism survives only in a narrow, untuned region or under idealized noise.
- **Overgeneralization:** A constructive example or minimal model is treated as a universal result.
- **Resource misaccounting:** Auxiliary variables, memory, communication, or compilation overhead are omitted from comparisons.
- **Circular reasoning:** The same data or preprocessing is used to both generate and validate the hypothesis.

# Validity Checks

Before finalizing any deliverable, verify:

- **Mechanistic validity:** Does the proposed explanation rest on a clear causal pathway rather than on vague terminology?
- **Internal validity:** Are controls sufficient to separate the mechanism from tuning artifacts or noise?
- **External validity:** Are stated boundaries consistent with the tested conditions?
- **Boundary validity:** Do claims avoid extrapolation beyond validated architectures, force fields, process classes, or noise regimes?
- **Evidence discipline:** Are single-source findings clearly separated from literature-supported or field-accepted conclusions?
- **Safety and ethics:** Does the plan remain non-operational, avoid hazardous procedural detail, and respect institutional constraints?

# Provenance

This skill was synthesized from cluster `119`, subcluster `119.0` via semantic merge of the following source skills:

- `caf0d7b824a17691` — cavity-quantum-optimization-workflow
- `2aabaf78c4ed3e5b` — quantum-metrology-interferometer-exploration
- `8fbb70b4bb9a72c1` — coupled-multiscale-synchrony-research
- `6a78d5de69d24b64` — quantum-sensor-variational-metrology-workflow
- `26834f6a0089c1aa` — quantum-comb-metrology-research-design
- `arxiv-cmoat__2606.21719` — polymer-md-initialization-workflow
- `f011b3974caf0c11` — single-molecule-reaction-coordinate-validation
- `1e57a81a77979e03` — quantum-architecture-layered-research-planning
