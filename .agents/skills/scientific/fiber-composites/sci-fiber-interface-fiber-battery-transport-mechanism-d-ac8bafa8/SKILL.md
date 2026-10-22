---
name: sci-fiber-interface-fiber-battery-transport-mechanism-d-ac8bafa8
description: A reusable end-to-end workflow for designing observable-driven mechanism discovery and validation studies in interface- and transport-governed material systems.
scienceevolve-title: "Fiber composites and battery materials · interface fiber battery transport mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents to generate rigorous, iterative research plans that move from an observed performance gap to a causally bounded mechanistic claim in systems where interfaces, transport pathways, fibrous or porous architectures, and conversion reactions interact. The workflow emphasizes hypothesis discrimination through multiscale controls, pre/post characterization, and explicit claim bounding rather than single-point optimization.

# When to use

Use this skill when:

- A user asks to explain an anomalous or underperforming behavior in a material system involving interfaces, transport, fibers, scaffolds, batteries, catalysts, or composites.
- The task requires designing a study to distinguish competing mechanistic explanations rather than optimizing a single metric.
- The user needs a structured path from gap identification to validation plan with iteration rules and stop conditions.
- Existing theory or prior data suggest a mechanism, but realistic perturbations, confounders, and measurement limits remain unaddressed.

Do not use this skill as a domain tutorial, operational synthesis or fabrication recipe, substitute for laboratory safety review, or source of hazardous procedural details.

# Inputs required

Before executing the workflow, collect or infer:

- **System context**: material classes, architecture type (fiber, porous, layered, particulate), and operating environment.
- **Performance gap**: the specific bottleneck, failure mode, or anomalous observable to explain.
- **Candidate mechanisms**: proposed explanations linking structure to function, including transport, interfacial, electronic, or morphological hypotheses.
- **Evidence inventory**: available characterization, modeling, simulation, and benchmarking tools.
- **Constraints**: safety, regulatory, reproducibility, equipment access, and ethical boundaries.
- **Baseline data**: prior measurements, literature benchmarks, or known failure modes.

# Core Workflow

1. **Frame the mechanistic gap**
   - State the observable bottleneck as a decision question, not a desired outcome.
   - Identify the dominant length scales and time scales involved.
   - List known confounders that could mimic or mask the target mechanism.

2. **Generate mechanism-ranked hypotheses**
   - Formulate at least two competing hypotheses as conditional statements: "If [mechanism X] dominates, then [perturbation P] should produce [observable signature S] under [conditions C]."
   - Tag each with evidence strength (low/moderate/high), key assumptions, and predicted failure modes.
   - Include a null hypothesis where the effect is explained by a known confounder.

3. **Gate 1 — Candidate adequacy**
   - Check: Can the hypotheses be distinguished with the available evidence inventory?
   - If no: refine observables, add tools, or narrow the question. Stop if intractable.

4. **Design minimal viable validation (MVV)**
   - Define a comparison matrix:
     - Baseline (untreated or reference state).
     - Target (proposed mechanism enabled).
     - Mechanism-absent control (key feature removed while preserving other variables).
     - Over-modification control (excessive implementation to test non-monotonicity).
     - Benchmark control (established comparator under matched assumptions).
   - Specify independent variables, dependent variables, and normalization requirements.
   - Declare stop conditions: controls fail, signal below detection, uncontrolled variability, or safety concern.

5. **Gate 2 — Control isolation**
   - Check: Does the matrix isolate the proposed mechanism from morphology, loading, conductivity, surface area, transport artifacts, and processing variability?
   - If no: redesign controls or add covariate measurements.

6. **Collect multiscale/multimodal evidence**
   - Gather pre-test structural/chemical baseline where applicable.
   - Measure performance or transport observables under matched conditions.
   - Gather post-test characterization to assess transformation or retention.
   - Record environmental and operational metadata.

7. **Gate 3 — Robustness and reproducibility**
   - Check: Is the primary signal reproducible across replicates, independent of edge effects, normalization artifacts, and measurement noise?
   - If no: iterate on sample preparation, measurement protocol, or statistical power. Stop if irreproducible.

8. **Discriminate mechanisms**
   - Map each hypothesis against the evidence matrix.
   - Exclude hypotheses inconsistent with control behavior or non-monotonic trends.
   - Require convergence of at least two independent evidence streams before favoring a mechanism.
   - If multiple mechanisms remain plausible: design an orthogonal perturbation or selective probe and return to Step 4.

9. **Gate 4 — Causality and claim bounding**
   - Check: Is the favored mechanism supported by independent variation of the descriptor, not only correlation?
   - Bound the claim: specify material classes, operating windows, and morphological limits where the conclusion holds.
   - Label the conclusion as paper-supported, new-system inference, or speculative extension.

10. **Iterate or finalize**
    - If the mechanism is validated and bounded: document boundary conditions and propose the next mechanistic question.
    - If the mechanism is refuted: return to Step 2 with updated failure modes.
    - If results are ambiguous: add intermediate variants or orthogonal characterization and return to Step 4.
    - **Hard stop**: safety/ethics boundary reached, controls remain uninterpretable, or the effect is fully attributed to a confounder.

# Output Format

Return a structured research package containing:

1. **Research question**: one concise decision question.
2. **Evidence map**: prior support, inferred assumptions, and gaps.
3. **Ranked hypotheses**: mechanism, predicted signature, evidence strength, assumptions, failure modes.
4. **Study design**: comparison matrix, variables, controls, metrics, and stop conditions.
5. **Analysis plan**: multiscale mapping, normalization, uncertainty treatment, and artifact screening.
6. **Iteration rules**: explicit update logic for positive, negative, mixed, or inconclusive results.
7. **Validity report**: confounders, reproducibility risks, boundary conditions, and safety/ethics constraints.

# Validation Gates

- **Candidate gate**: Hypotheses must be mutually distinguishable with available tools.
- **Control gate**: The comparison matrix must isolate the target mechanism from known confounders.
- **Robustness gate**: Signals must survive replicate testing and sensitivity analysis.
- **Mechanism-exclusion gate**: At least one hypothesis must be falsifiable by the observed control behavior.
- **Claim-bounding gate**: Conclusions must include explicit limits of validity and evidence classification.

# Claim Boundaries

- Distinguish **paper-supported patterns**, **new-system inferences**, and **speculative extensions**.
- Limit causal claims to the tested range of materials, architectures, and operating conditions.
- Do not generalize from model systems to practical devices without translation validation.
- State whether the mechanism is verified, partially supported, or inferred from analogy.

# Failure Modes

- **Confounding dominance**: An unmeasured variable (e.g., loading, porosity, residual processing agent) explains the observed trend.
- **Over-modification collapse**: Excessive implementation of the target feature degrades performance via aggregation, blockage, or damage.
- **Transport masking**: Apparent activity or conversion changes are artifacts of mass-transport, ohmic, or thermal limitations.
- **Scale decoupling**: Micro-scale interface evidence does not translate to macro-scale performance due to specimen artifacts.
- **Mechanism shift**: The system transforms during testing, making pre-test descriptors irrelevant to post-test behavior.
- **False correlation**: A descriptor covaries with the true causal variable but is not itself mechanistically responsible.

# Validity Checks

Before finalizing any plan or claim, verify:

- [ ] Confounders are explicitly listed and controlled.
- [ ] Replicates and variability are reported.
- [ ] Pre/post or baseline comparisons are included where applicable.
- [ ] Normalization assumptions are declared and justified.
- [ ] Mechanism specificity is tested, not just existence of an effect.
- [ ] Boundary conditions (temperature, composition, architecture, environment) are stated.
- [ ] Safety and ethics constraints are respected and documented.
- [ ] Source evidence is distinguished from agent-generated inference.

# Provenance

- Synthesized from cluster 72.0 (observable-driven mechanism discovery and validation).
- Source skill references: `dipolar-bec-soliton-research-design`, `li-s-confined-interphase-research`, `fiber-emw-architecture-research`, `interface-layer-composite-research-design`, `multiscale-polymer-nanocomposite-thermal-design`, `model-catalyst-structure-stability-activity`, `coupled-site-orr-catalyst-exploration`, `fabric-solar-steam-research-workflow`.
- Paper-derived patterns are used as workflow inspiration; no specific system parameters or conclusions are endorsed as universal.
