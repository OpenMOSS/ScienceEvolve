---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-2fd78ec9
description: Use when designing end-to-end research plans to discover, discriminate, and validate causal mechanisms in composite, interfacial, or electrochemical material systems through controlled observation, hypothesis testing, and iterative refinement.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 13"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent generate reusable, mechanism-first research plans for material systems where observed performance is limited by coupled transport, interface, or conversion bottlenecks. The workflow transforms a performance gap into falsifiable causal hypotheses, designs controlled comparative studies that isolate mechanism from artifact, integrates multi-modal evidence, and iterates based on converging or conflicting observations. It remains at the non-operational research-design level and excludes laboratory recipes, fabrication parameters, and hazardous procedures.

## When to use

Use this skill when the user asks to propose new research questions, hypotheses, or non-operational experiment designs for material systems—such as composites, fiber-reinforced architectures, electrochemical electrodes, functionalized scaffolds, or porous adsorbents—where performance depends on coupled interface, transport, or reaction mechanisms. It is appropriate when the goal is to link a structural or chemical intervention to a specific causal pathway rather than to optimize a single metric. Do not use this skill to generate executable synthesis protocols, cell-assembly recipes, clinical recommendations, engineering certifications, or hazardous operational procedures.

## Inputs required

- Target material system and its functional context.
- Primary bottleneck or failure mode (e.g., poor interfacial transfer, sluggish conversion, intermediate loss, mechanical degradation).
- Candidate design levers (e.g., interface modification, architecture change, additive function, host/shell concept).
- Baseline comparator and available control categories.
- Available characterization and modeling resources.
- Constraints: safety, regulatory, reproducibility, and boundary conditions.

## Core Workflow

1. **Frame the mechanism gap.** Convert the observed performance limitation into a causal bottleneck defined by coupled processes (e.g., transport, reaction, interfacial transfer, structural stability). State explicitly what intermediate behavior must change for the bottleneck to be relieved.

2. **Decompose into functions.** Map the system onto distinct, experimentally separable functions: confinement, adsorption, catalysis, conduction, ion transport, mechanical buffering, or compatibility. Assign candidate design levers to one or more functions.

3. **Generate ranked causal hypotheses.** For each design lever, produce at least three hypotheses in the form: design change → expected structural/chemical change → measurable signature → performance outcome. Tag each with evidence strength (strong/moderate/weak/speculative), key assumptions, and likely failure modes.
   - **Decision Gate 1 — Falsifiability:** If a hypothesis cannot be tested with available or attainable measurements, reformulate or discard it before proceeding.

4. **Design a controlled comparative matrix.** Include a baseline, single-function controls (each lever in isolation), combined-function groups, a negative control lacking the key function, and a positive control or benchmark when available. Hold processing, loading, and testing severity constant across groups unless intentionally varied.
   - **Decision Gate 2 — Isolation:** If the control set cannot distinguish the proposed mechanism from generic effects (e.g., surface area, mass loading, conductivity), redesign the matrix.

5. **Define mechanism diagnostics and performance metrics separately.** Mechanism diagnostics must include at least two orthogonal evidence types (e.g., spectroscopic, microscopic, impedance, transport) that can change independently of the primary performance metric. Performance metrics capture the target outcome.
   - **Decision Gate 3 — Decoupling:** If the chosen metrics cannot theoretically diverge (i.e., mechanism evidence is perfectly collinear with performance), revise the measurement plan.

6. **Execute minimal viable validation.** Collect material-formation evidence first, then mechanism diagnostics, then performance data. Compare modified and control groups under identical normalization bases.
   - **Decision Gate 4 — Convergence:** If material, chemical, and physical/electrochemical evidence conflict, halt mechanism claims and investigate confounders or batch artifacts.

7. **Analyze via causal chain.** Link structure to chemistry, chemistry to interface/transport behavior, and interface/transport to performance. Evaluate trade-offs explicitly. Classify each hypothesis as supported, partially supported, rejected, or unresolved.
   - **Decision Gate 5 — Mechanism Discrimination:** If performance improves but mechanism diagnostics do not support the targeted pathway, stop claiming the mechanism and treat the result as an artifact or unidentified variable.

8. **Iterate or pivot.**
   - **If supported:** Plan stronger validation (broader boundary conditions, higher loading, longer cycling, alternative models).
   - **If partially supported:** Refine the hypothesis to the observed mechanism and design a focused follow-up.
   - **If rejected:** Return to Step 2 to select alternative levers or stop if the bottleneck is intractable under current constraints.
   - **If ambiguous:** Diagnose confounders (variability, uncontrolled morphology, assay interference) and repeat Step 6.

9. **Bound claims and document residual risks.** State boundary conditions, unresolved assumptions, and safety/compliance limits. Distinguish observed evidence from inferred mechanism and speculative extension.

## Output Format

When using this skill, return:

1. `Research question`: Target system, bottleneck, and intended mechanism focus.
2. `Hypothesis table`: At least three ranked hypotheses with mechanism chain, evidence strength, key assumptions, and likely failure modes.
3. `Study design`: Baseline, single-function controls, combined groups, negative/positive controls, independent variables, held-constant factors, mechanism diagnostics, performance metrics, and stop conditions.
4. `Analysis plan`: Data integrity checks, causal-chain linkage, trade-off assessment, visualization strategy, and decision rules for hypothesis classification.
5. `Iteration plan`: Actions for supported, partial, rejected, ambiguous, and control-failure outcomes.
6. `Validity and safety notes`: Confounding checks, reproducibility requirements, boundary conditions, and non-operational safety framing.

## Validation Gates

- **Hypothesis Falsifiability Gate:** Every hypothesis must have a defined minimal test that could reject or weaken it. Speculative hypotheses without a feasible test are excluded from the experimental plan.
- **Control Isolation Gate:** The experimental matrix must include comparators that remove or weaken one proposed function at a time. If isolation is impossible, the mechanism claim is deferred.
- **Mechanism-Performance Decoupling Gate:** Mechanism diagnostics must be capable of changing independently of the primary performance metric. If they cannot, the experimental design is revised.
- **Evidence Convergence Gate:** Claims require consistent support from at least two orthogonal characterization categories. Conflicting evidence triggers a confounder investigation, not a mechanism claim.
- **Boundary Gate:** Practical relevance, scalability, or cross-system transfer claims are gated by explicit boundary-condition tests (e.g., loading, rate, environment). They are omitted if only idealized conditions have been evaluated.

## Claim Boundaries

- Label all claims as `observed`, `inferred`, or `hypothesized` based on the current evidence.
- A single demonstration in one material system is evidence for a mechanism under specific assumptions, not field-wide consensus.
- Performance improvement alone does not prove the proposed mechanism; it requires converging mechanism diagnostics.
- Do not claim practical relevance, clinical efficacy, commercial readiness, or engineering certification without independent validation under relevant boundary conditions.
- Distinguish exploratory screening from validated application recommendations.

## Failure Modes

- **Confounding by uncontrolled variables:** Loading, mass, thickness, porosity, or processing differences masquerade as mechanism effects.
- **Normalization artifacts:** Gravimetric or areal normalization obscures true active-material utilization or interfacial efficiency.
- **Single-endpoint overinterpretation:** A gain in one property is claimed as success while degradation in another is ignored.
- **False synergy:** A combined design is assumed synergistic when it is merely additive or confounded.
- **Extrapolation beyond domain:** Results from low-loading, short-duration, or idealized conditions are generalized to untested regimes.
- **Assay or measurement interference:** Instrument response is distorted by material properties (e.g., color, conductivity, scattering) rather than the target endpoint.
- **Control failure:** Baseline or negative controls behave implausibly, invalidating group comparisons.

## Validity Checks

Before presenting a result, verify:

- **Research question specificity:** Is the bottleneck causal and tied to a design variable?
- **Control strength:** Are baseline, single-function, negative, and positive controls adequate to isolate the mechanism?
- **Mechanism validity:** Does evidence show the targeted pathway changed, not only that a performance curve improved?
- **Statistical validity:** Are replicates, variability, normalization, and exclusion criteria explicit?
- **Confounding:** Are composition, morphology, loading, processing, and measurement conditions comparable across groups?
- **Reproducibility:** Are materials provenance, measurement definitions, and analysis methods specific enough for independent verification?
- **Boundary conditions:** Which material families, operating regimes, and environmental conditions were tested?
- **External validity:** Is the claim limited to the tested system rather than generalized to all related chemistries?
- **Trade-off validity:** Are competing endpoints evaluated so that one improvement does not hide another degradation?

## Provenance

Synthesized from cluster 28.1 ("observable-driven mechanism discovery and validation") of the Codex scientific skills corpus. Source skills contributing to this merged workflow include:

- `conductive-doped-carbon-battery-research` (10.1002_aenm.201602876)
- `composite-interface-architecture-exploration` (fiber__10.3390_jcs7010037)
- `dual-function-lis-battery-research-design` (10.1039_d2cp04282g)
- `wound-dressing-polymer-fiber-research` (fiber__10.3390_polym15061355)
- `bioactive-hybrid-nanofiber-research` (fiber__10.1016_j.msec.2021.112019)
- `co2-adsorbent-research-pattern` (10.1039_c4ra11271g)
- `composite-doe-research-workflow` (fiber__10.1177_15280837251314046)
- `li-s-core-shell-electrode-design` (10.1016_j.jallcom.2019.05.366)
