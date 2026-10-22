---
name: sci-fiber-fiber-battery-composite-interface-mechanism-d-c7a34a3a
description: Reusable end-to-end workflow for designing mechanism-driven research and validation plans in hierarchical material interfaces across composites, fibers, binders, and electrochemical systems.
scienceevolve-title: "Fiber composites and battery materials · fiber battery composite interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill provides a reusable, end-to-end workflow for observable-driven mechanism discovery and validation in hierarchical materials where interfaces, binders, dispersed phases, or aggregate contacts control functional behavior. It guides an agent from bottleneck identification through hypothesis generation, minimal validation design, orthogonal evidence collection, mechanism discrimination, and claim bounding—without providing operational recipes or treating any single study as field consensus.

# When to use

Use this skill when a user asks to design or evaluate research questions for systems where internal interfaces, pore networks, binder phases, or hierarchical architectures may govern transport, mechanical, electrochemical, or stimulus-responsive behavior. Typical contexts include fiber assemblies, natural-fiber composites, battery electrodes and binders, porous conductors, and soft colloidal or supramolecular systems.

Do not use this skill to generate executable laboratory protocols, hazardous handling instructions, fabrication parameter recipes, or as a general-purpose materials-discovery assistant. It is strictly for non-operational research planning, hypothesis generation, control design, analysis logic, and iteration strategy.

# Inputs required

Before proposing a study, ask for or infer:

- **Target system and hierarchy**: primary building blocks, aggregates, pores, contacts, alignment, binder phase, or interfacial region suspected to control behavior.
- **Functional target and bottleneck**: the property to be improved (e.g., transport, mechanical resilience, electrochemical stability, shape retention) and the observed failure mode.
- **Candidate design levers**: changes to binder chemistry, reinforcement treatment, additive loading, architecture, or environmental perturbation expected to alter the interface.
- **Available evidence**: prior structural, spectroscopic, imaging, transport, or electrochemical observations relevant to the system.
- **Baseline and comparators**: standard materials, untreated states, or conventional architectures suitable for control construction.
- **Constraints and risks**: sample availability, measurement access, reproducibility requirements, safety boundaries, and environmental limits.

# Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, stop or redesign before proceeding.

1. **Bottleneck and hierarchy definition**
   - Define the performance bottleneck and identify the structural level most likely to control the target property (primary building block, aggregate contact, pore network, binder phase, or residual interface).
   - Distinguish structural durability from functional response.
   - **Gate 1.1**: If the bottleneck cannot be linked to a specific interface or hierarchical level, restate the research question before proceeding.

2. **Mechanism-grounded hypothesis generation**
   - Produce at least three falsifiable hypotheses. For each, specify:
     - Causal chain: design lever → mechanism → structural signal → functional signal.
     - Evidence strength (weak / moderate / strong / speculative).
     - Key assumptions.
     - Predicted structural and functional signatures.
     - Boundary conditions where the effect should weaken or reverse.
     - Likely failure modes and confounders.
   - **Gate 2.1**: If a hypothesis lacks a falsifiable condition or a predicted structural signal, refine or discard it.

3. **Minimal viable validation design**
   - Design a study (experimental or computational) that can discriminate between hypotheses.
   - Define independent variables, strong controls (baseline, negative, positive, ablation, process-matched, structural-matched), primary endpoints, mechanistic endpoints, and diagnostic measurements.
   - Pre-register stop conditions and decision rules.
   - **Gate 3.1**: If the plan cannot isolate the proposed mechanism from confounders (e.g., loading, conductivity, processing history, geometry), redesign controls before execution.

4. **Orthogonal evidence collection**
   - Gather complementary observations: structurally sensitive probes, functional readouts, kinetic indicators, and post-operation morphology.
   - Use paired baseline and post-treatment comparisons where possible.
   - **Gate 4.1**: If access to the relevant interface or region is unconfirmed, halt interpretation and redesign the access probe.

5. **Mechanism discrimination and artifact screening**
   - Compare structural and functional trends across the perturbation set.
   - Check whether controls explain the effect.
   - Screen for artifacts: contact resistance, residual media, evaporation, swelling, fixture effects, charging, instrument drift, batch variability, and sample-history dependence.
   - Exclude alternative mechanisms (aggregation, precipitation, kinetic trapping, bulk transformation, thermal-only effects).
   - **Gate 5.1**: If structural and functional signals conflict without explanation, stop and generate a failure-mode hypothesis.
   - **Gate 5.2**: If artifact controls match the candidate response, reject the mechanism claim.

6. **Robustness and trade-off assessment**
   - Test the surviving hypothesis under at least one stress condition relevant to the intended application (e.g., elevated demand, prolonged exposure, mechanical load, or environmental variation).
   - Evaluate whether improving one endpoint degrades a complementary function.
   - **Gate 6.1**: If the effect disappears under stress or causes unacceptable trade-offs, narrow the claim boundary or return to Step 2.

7. **Iteration or claim finalization**
   - Based on convergent evidence, label each hypothesis as strengthened, narrowed, weakened, or falsified.
   - Decide: continue (refine one variable), modify (adjust lever density or placement), pivot (change bottleneck assumption), or stop (claim is unsupported or violates safety/reproducibility boundaries).
   - **Gate 7.1**: If batch variability or reproducibility limits exceed the effect size, prioritize process controls over mechanism claims.

8. **Claim bounding and documentation**
   - Document the validated mechanism, boundary conditions where it weakens or fails, residual risks, and a clear separation between evidence-supported observations and agent-inferred extensions.
   - State applicable limits (architecture, loading, environment, measurement context).

# Output Format

When using this skill, produce:

1. **Research question** — One concise, mechanism-driven question framed around an interface bottleneck and target property.
2. **Evidence map** — Paper-supported facts, cross-study plausible assumptions, and agent-inferred hypotheses, clearly labeled.
3. **Ranked hypotheses** — At least three hypotheses with causal chain, evidence strength, key assumptions, predicted signals, failure modes, and boundary conditions.
4. **Validation plan** — Minimal viable validation with variables, strong controls, primary and mechanistic endpoints, and stop conditions.
5. **Analysis plan** — Access validation, structural-level separation, control comparison, artifact screening, uncertainty handling, and trade-off evaluation.
6. **Iteration plan** — Decision rules for supported, partial, rejected, and ambiguous outcomes.
7. **Claim boundary statement** — Explicit limits on generalizability, applicable systems, and stress conditions.
8. **Failure mode and risk summary** — Likely confounders, artifact modes, and residual uncertainties.

# Validation Gates

- **Access gate**: Do not attribute functional change to internal-interface rearrangement unless access is confirmed or a justified proxy is validated.
- **Control gate**: Mechanism claims require separation from baseline, negative, positive, ablation, and process-matched controls.
- **Consistency gate**: Structural, kinetic, and functional evidence must converge before accepting a hypothesis.
- **Stress gate**: Claims must survive at least one relevant stress condition or be explicitly bounded to baseline conditions.
- **Reproducibility gate**: Independent samples or batches must support the trend; batch variability must not exceed the perturbation effect.
- **Trade-off gate**: Improvement in one endpoint must be weighed against complementary function loss; monotonic improvement assumptions are prohibited.

# Claim Boundaries

- Do not present a single-system observation as a field-wide consensus or universal design rule.
- Do not treat functional improvement as proof of a desired structural mechanism without independent structural confirmation.
- Do not extrapolate beyond the tested architecture, material class, loading regime, or environmental conditions.
- Distinguish paper-supported patterns from agent-inferred hypotheses and from unverified extrapolations.
- Avoid claiming clinical, consumer-product, environmental-release, or commercial readiness from early-stage mechanism evidence.

# Failure Modes

- **Artifact dominance**: The observed effect is driven by contact resistance, residual media, evaporation, swelling, fixture effects, or instrument drift rather than the proposed mechanism.
- **Hidden confounder**: Loading, thickness, conductivity, porosity, or processing history explains the result.
- **Mechanism misattribution**: Structural and functional trends are real but caused by an alternative pathway (e.g., bulk transformation instead of surface conversion, aggregation instead of targeted assembly).
- **Trade-off neglect**: A candidate improves the primary endpoint while silently degrading durability, transport, safety, or another critical function.
- **Batch variability**: Inconsistent preparation, conditioning, or measurement masks the true effect or creates false positives.
- **Overgeneralization**: A valid observation in one system is incorrectly extended to untested materials, environments, or operating conditions.
- **Access failure**: The perturbation or design lever never reaches the intended interface, invalidating the causal chain.

# Validity Checks

Before finalizing any research proposal, verify:

- **Confounding**: Have loading, geometry, processing, environmental exposure, and sample history been controlled or accounted for?
- **Reproducibility**: Are baseline state, preparation history, normalization, and repeated independent samples or positions reported?
- **Statistical validity**: Are conclusions based on enough independent observations for the claimed effect size?
- **Boundary conditions**: Does the claim specify where the mechanism should weaken, fail, or become artifact-dominated?
- **Mechanism specificity**: Do controls isolate access, structural rearrangement, primary-building-block change, and functional response?
- **External validity**: Is the new system sufficiently similar to the evidence base, or is the claim only an analogy?
- **Claim discipline**: Are paper-supported facts distinguished from agent-inferred hypotheses and speculative extensions?
- **Safety and ethics**: Does the plan remain at the research-design level, avoiding executable hazardous instructions and inappropriate application claims?

# Provenance

Synthesized from cluster `78.0` (observable-driven mechanism discovery and validation). Derived from source skills: `fiber__10.1021_nn401337m`, `10.1016_j.jcis.2020.07.021`, `10.1021_acs.jpcc.8b10736`, `10.1016_j.apsusc.2011.11.009`, `fiber__10.1016_j.compositesb.2026.113477`, `10.1039_d0se00309c`, `fiber__10.1002_app.70246`, `6c9f3ac1ca22422e9c198ed326bb3105_Jiang_-`.
