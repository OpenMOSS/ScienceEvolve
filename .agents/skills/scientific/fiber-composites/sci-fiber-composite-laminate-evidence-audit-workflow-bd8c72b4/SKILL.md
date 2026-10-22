---
name: sci-fiber-composite-laminate-evidence-audit-workflow-bd8c72b4
description: A reusable end-to-end workflow for generating mechanism-driven research questions, designing controlled comparative validation plans, and auditing evidence claims in composite, laminate, fiber, and interfacial material systems.
scienceevolve-title: "Fiber composites and battery materials · composite laminate evidence audit workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Guide agents to plan, execute, and audit mechanism-driven research in composite, laminate, fiber, and interfacial systems. The workflow frames falsifiable questions, designs controlled comparative experiments, and bounds claims by evidence strength, separating observation from inference and speculation.

## When to use

Use this skill when:
- Generating research questions for material architectures where performance depends on interfaces, layers, dispersion, porosity, orientation, or multi-scale structure.
- Designing validation plans for structural, thermal, acoustic, transport, or electrochemical behavior in composite or laminated systems.
- Auditing whether a proposed architectural or interfacial lever plausibly changes a target mechanism.
- Comparing candidate systems against baselines and benchmarks with explicit controls and stop conditions.

Do not use this skill for operational manufacturing recipes, hazardous procedural instructions, safety-critical design approval, clinical applications, or domains outside materials research.

## Inputs required

Collect or infer before starting:
1. **Target system family**: substrate, matrix, reinforcement class, and intended architecture (e.g., layered, woven, nonwoven, coated, hybrid).
2. **Performance bottleneck**: the specific gap, trade-off, or failure mode to be addressed.
3. **Candidate levers**: architectural, interfacial, or processing variables proposed to change the mechanism.
4. **Benchmark systems**: established alternatives or mechanism-class references for fair comparison.
5. **Characterization capabilities**: available structural, mechanical, thermal, acoustic, electrochemical, or transport measurements.
6. **Constraints**: scale, geometry, safety boundaries, applicable standards context, and whether the output is exploratory research planning only.
7. **Existing evidence**: literature ranges, prior measurements, or preliminary data to anchor evidence-strength labels.

If inputs are missing, state assumptions explicitly and mark downstream conclusions as provisional.

## Core Workflow

1. **Frame the decision problem**  
   Define the material decision as a specific, falsifiable comparison (e.g., local feasibility, mechanism discrimination, or trade-off optimization). Avoid framing as universal superiority.  
   *Decision gate: Stop and reformulate if the question cannot be expressed as a falsifiable comparison against a baseline or benchmark.*

2. **Map the mechanism space**  
   Link architectural or interfacial features to expected behavior (load transfer, transport pathways, dissipation, reaction kinetics, etc.). Identify assumptions about continuity, bonding, dispersion, orientation, or pore structure. Separate the generic mechanism from any specific material object.  
   *Decision gate: If the mechanism cannot be stated independently of the source material, narrow the scope before proceeding.*

3. **Generate competing hypotheses**  
   For each candidate lever, state a primary hypothesis and at least one competing alternative. Annotate every hypothesis with:  
   - Evidence strength (`high` / `moderate` / `low` / `speculative`)  
   - Key assumptions  
   - Predicted structural signatures  
   - Predicted performance signatures  
   - Possible failure modes  
   - Minimum falsifying observation  
   *Decision gate: Reject any hypothesis that lacks a concrete observation capable of weakening or disproving it.*

4. **Design the comparative validation matrix**  
   Define:  
   - **Independent variables**: the architectural, interfacial, or processing levers being tested.  
   - **Dependent variables**: structural, property, and performance metrics aligned to the mechanism.  
   - **Controls**: baseline, benchmark, single-function, negative, and positive controls as applicable to isolate the mechanism.  
   - **Stop conditions**: e.g., effect size smaller than measurement uncertainty, controls behave implausibly, structural defects dominate, or gains in one metric require unacceptable losses in another.  
   *Decision gate: Do not proceed if the experiment lacks a control that isolates the proposed mechanism from confounding variables.*

5. **Execute minimal viable validation**  
   - Verify reproducibility of the architecture or formulation.  
   - Confirm structural fidelity (interfaces, layers, dispersion, porosity, continuity) before interpreting property data.  
   - Check data integrity, calibration status, units, and replicate variance.  
   *Decision gate: Stop and redesign if structural verification fails or if replicate variance exceeds the expected effect size.*

6. **Analyze mechanism-first**  
   a. **Structure analysis**: inspect morphology, interfaces, defects, and distribution.  
   b. **Control comparison**: compare candidate against all controls under matched conditions.  
   c. **Causal linkage**: require that property trends align with the proposed mechanism and structural evidence.  
   d. **Model comparison**: compare experimental trends with simple predictions; treat disagreement as evidence of missing mechanisms or violated assumptions.  
   e. **Uncertainty quantification**: propagate measurement uncertainty and report variability.  
   *Decision gate: Downgrade claims to speculative if property changes lack structural support or if controls do not behave plausibly.*

7. **Audit claims and bound conclusions**  
   - Label every conclusion as `Observed` (directly measured), `Inferred` (mechanistically consistent with current data), or `Speculative` (extrapolated beyond the tested domain).  
   - State boundary conditions: material class, architecture, geometry, scale, loading direction, and environment.  
   - Report trade-offs explicitly; do not claim overall superiority if one metric improves while another degrades.  
   *Decision gate: Reject any claim that generalizes beyond the tested domain without explicit qualification.*

8. **Iterate or terminate**  
   - **If supported**: refine the design space, test boundary conditions, or move to confirmatory testing with pre-registered criteria.  
   - **If partially supported**: split hypotheses and test orthogonal variables rather than forcing a single winner.  
   - **If contradicted**: revise the causal model before further optimization; do not abandon the research direction without diagnosing the mismatch.  
   - **If confounded or unsafe**: terminate the line of inquiry and redesign controls or architecture.  
   *Decision gate: If the next iteration does not include a new falsification test, pause until one is defined.*

## Output Format

When using this skill, return:
1. **Research question**: one concise, falsifiable question tied to a material decision.
2. **Mechanism map**: the proposed causal chain from architecture/interface to performance, with assumptions.
3. **Hypotheses table**: at least three hypotheses, each with evidence strength, key assumptions, predicted signatures, failure modes, and falsifying observations.
4. **Experimental design**: independent variables, dependent variables, control groups, metrics, and stop conditions.
5. **Analysis plan**: structure-first inspection, control comparison, mechanism linkage, model comparison, and uncertainty handling.
6. **Iteration plan**: rules for supported, partial, contradicted, and ambiguous outcomes.
7. **Validity and boundary notes**: confounders, reproducibility checks, statistical limits, and application boundaries.
8. **Evidence labels**: every claim marked `Observed`, `Inferred`, or `Speculative`.

## Validation Gates

- The decision problem is framed as a falsifiable comparison, not a universal superiority claim.
- Every hypothesis includes a minimum falsifying observation.
- At least one baseline control and one mechanism-isolating control are defined.
- Structural fidelity is verified before property interpretation.
- Replicate variance is quantified and smaller than the claimed effect size.
- All conclusions are labeled `Observed`, `Inferred`, or `Speculative`.
- Trade-offs are reported alongside gains.

## Claim Boundaries

- Claims are valid only within the tested material class, architecture, geometry, scale, loading direction, and environmental conditions.
- `Observed` requires direct measurement in the current study.
- `Inferred` requires mechanistic consistency plus structural or control support.
- `Speculative` covers extrapolation to new materials, scales, architectures, or service environments.
- Research outputs must not be presented as certified design values, code compliance, construction specifications, or product approvals.

## Failure Modes

- **Hypothesis drift**: The research question shifts to match post-hoc observations rather than pre-registered predictions.
- **Confounding architecture**: Processing differences, thickness, density, contact quality, or orientation explain the result rather than the proposed mechanism.
- **Control collapse**: Baseline or benchmark groups behave implausibly, invalidating comparative inference.
- **Defect masking**: Structural flaws (voids, delamination, poor dispersion, incomplete wetting) dominate response and prevent mechanism interpretation.
- **Overfitting**: Small datasets or excessive model complexity produce spurious optima or false interactions.
- **Trade-off concealment**: Improvement in one metric is reported while degradation in another critical metric is omitted.
- **Boundary violation**: Conclusions are generalized beyond the tested domain without qualification.

## Validity Checks

- **Confounding**: Match matrix, substrate, thickness, density, processing history, and environmental conditions across groups; vary only the target lever.
- **Statistical validity**: Define primary endpoints before testing; report spread, confidence intervals, and effect sizes; avoid overinterpreting boundary optima.
- **Reproducibility**: Include independent sample preparation or repeated measurements; document material source, batch, protocol, and exclusions.
- **Benchmark fairness**: Compare against relevant mechanism-class benchmarks under matched conditions.
- **Mechanism validity**: Require structural or interfacial evidence before attributing property changes to a specific mechanism.
- **Scale and directionality**: Do not extrapolate small-specimen or single-direction results to full systems or orthogonal directions without validation.
- **Application validity**: Distinguish flat-specimen or lab-scale screening from product-level, structural, or service-life performance.

## Provenance

Synthesized from cluster 38, subcluster 38.0. Source skills: `recycled-fiber-composite-research-design`, `lightweight-clt-cfrp-research-exploration`, `carbon-composite-thermal-exploration`, `breathable-laminate-research-design`, `wet-laid-hybrid-composite-research-design`, `printed-composite-laminate-research-workflow`, `porous-fiber-acoustic-research-pattern`, `lithium-sulfur-interfacial-binder-design`.
