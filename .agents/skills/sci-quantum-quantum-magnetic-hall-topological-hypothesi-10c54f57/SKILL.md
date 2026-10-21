---
name: sci-quantum-quantum-magnetic-hall-topological-hypothesi-10c54f57
description: A reusable end-to-end workflow for generating falsifiable hypotheses and designing minimal validation plans in quantum, magnetic, topological, and interfacial matter research.
scienceevolve-title: "Quantum materials and condensed matter · quantum magnetic hall topological hypothesis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide the agent to transform scientific insights from literature into a transferable, mechanism-driven research workflow for quantum, magnetic, topological, and interfacial matter systems. The goal is to produce new, falsifiable hypotheses and minimal validation plans—spanning theory, simulation, and non-operational experiment design—while strictly separating verified findings from inferred claims.

# When to use

- When migrating methodological patterns from a specific paper to a new research problem in condensed matter or quantum systems.
- When generating hypotheses about hidden variables, coupling interfaces, symmetry-breaking, or emergent transport/topological responses.
- When designing validation chains that require positive, negative, and strong controls rather than single-point observations.
- When bounding claims by evidence strength and defining stop/iteration conditions before committing to next-stage investigations.
- Do not use to recite paper conclusions, prescribe operational fabrication steps, or present exploratory hypotheses as domain consensus.

# Inputs required

- **System description**: Constituents, scales, dominant interactions, and known static/equilibrium models.
- **Candidate internal variables**: Order parameters, phases, topological invariants, spin/orbit textures, or symmetry-breaking variables that may become relative under coupling.
- **Coupling geometry**: How subsystems interact (interfaces, junctions, field coupling, heterostructures, disorder).
- **Target observables**: Transport coefficients, spectral features, magnetic/topological responses, stability thresholds, or state-switching signatures.
- **Evidence baseline**: Available data types (public datasets, ab initio frameworks, effective models, experimental trends) and their limitations.
- **Safety and compliance boundaries**: Non-negotiable limits on operational detail, hazardous conditions, data privacy, or dual-use risk.

# Core Workflow

Execute the following steps in order. Do not proceed past a gate until its criteria are met.

## Step 1: Frame the mechanism gap

Define the new research question by identifying what existing models leave unexplained. Convert a phenomenological observation into a mechanism question (e.g., “which internal variable, when made relative across a coupling region, drives the observed macroscopic change?”).

**Gate 1 – Problem clarity**: The question must distinguish verified literature findings from inferred gaps. If the gap cannot be phrased as a missing causal link, stop and refine the scope.

## Step 2: Identify hidden-to-relative variables

List internal variables normally averaged, gauged away, or frozen in isolated subsystems. Determine which become physically meaningful relative variables once coupling is introduced.

**Gate 2 – Variable traceability**: At least one candidate variable must be definable before coupling and measurable/derivable in the coupled regime. If no such variable exists, stop and reformulate the system decomposition.

## Step 3: Generate ranked hypotheses

For each candidate mechanism:
- State the causal chain: internal variable → interface/coupling structure → macroscopic consequence.
- Derive a falsifiable prediction for at least one mechanism-level indicator and one macroscopic output as the control variable changes.
- Assign evidence strength: **High** (direct data or mature theory), **Medium** (cross-system analogy with partial support), **Low** (speculative, requires minimal verification).
- List key assumptions and explicit failure modes (e.g., effect averages out, geometric/thermal masking, extreme-parameter-only appearance).

**Gate 3 – Discriminability**: Each hypothesis must differ in its predicted response under at least one shared control condition. If hypotheses are observationally equivalent, stop and redesign the variable space.

## Step 4: Design minimal validation plan

Construct the smallest model, dataset, or observation set that can discriminate the target mechanism from null and alternative mechanisms.
- **Variables**: Define independent (coupling strength, symmetry, geometry), mechanism (intermediate field/order/textures), and macroscopic (transport, spectral, stability) variables.
- **Controls**: Include at least two of strong, negative, positive, or approximation controls.
  - *Strong control*: vary only the target mechanism while holding the system fixed.
  - *Negative control*: remove or suppress the candidate variable/coupling; expect signal disappearance or reversal.
  - *Positive control*: use a benchmark where the mechanism is known to operate.
  - *Approximation control*: compare models with and without the candidate dynamic variable.
- **Metrics**: Primary (answers the research question), mechanism (proves intermediate step exists), robustness (repeatability, parameter sensitivity, boundary stability).
- **Stop conditions**: Define when to halt the current branch—e.g., mechanism indicator absent, macroscopic output insensitive, negative control replicates the signal, or safety/compliance boundaries reached.

**Gate 4 – Control sufficiency**: The plan must include explicit stop conditions and at least two distinct control types. If not, stop and revise the experimental logic.

## Step 5: Execute analysis and mechanism decomposition

Analyze data or simulation outcomes in this order:
1. Check completeness and consistency of initial/boundary conditions.
2. Extract mechanism indicators before interpreting macroscopic outputs.
3. Decompose total response into interpretable contributions (electronic, magnetic, topological, thermal, geometric, approximation artifacts).
4. Quantify uncertainty: convergence, sensitivity, sample variance, model error.
5. Grade conclusions separately:
   - Mechanism exists.
   - Mechanism influences macroscopic output.
   - Mechanism is generalizable beyond the tested boundary.

**Gate 5 – Internal consistency**: Mechanism indicators and macroscopic outputs must show a coherent directional relationship before claiming support. If they conflict, flag alternative explanations and stop claim escalation.

## Step 6: Iterate or terminate

Based on Gate 5 results:
- **Support**: Upgrade evidence strength; design independent replication or stricter controls; proceed to Step 7.
- **Partial support (mechanism present, macroscopic effect weak)**: Retain mechanism claim, narrow macroscopic scope, and define new boundary tests.
- **Partial support (macroscopic effect present, mechanism absent)**: Suspend current hypothesis; pivot to alternative mechanisms (return to Step 3).
- **No support under all control conditions**: Deprioritize hypothesis; document failure mode; stop the branch unless new gap analysis (Step 1) justifies reformulation.
- **Boundary-only effect**: Label as narrow regime phenomenon; restrict extrapolation; stop generalization claims.

**Gate 6 – Decision logging**: Record hypothesis update, evidence revision, and rationale before any next step.

## Step 7: Output and boundary statement

Compile the research package with explicit claim boundaries and safety notes. Do not proceed to new domains or applications without repeating Gate 1.

# Output Format

Produce exactly the following sections:
1. **Research question**: One-sentence mechanism-focused question.
2. **Evidence status**: Verified literature findings vs. new inferences, with evidence strength.
3. **Core hypothesis**: Internal variable, coupling/interface mechanism, expected macroscopic effect, key assumptions, failure modes.
4. **Minimal validation plan**: Smallest feasible verification, variable definitions, control designs, metrics, stop conditions.
5. **Analysis plan**: Mechanism extraction, decomposition, sensitivity/uncertainty quantification, conclusion grading.
6. **Iteration path**: Next-step actions for support, partial support, or falsification.
7. **Validity and safety notes**: Compliance boundaries, non-operational scope, extrapolation limits.

# Validation Gates

Re-verify before finalizing output:
- Verified findings and new inferences are explicitly separated.
- Every hypothesis carries evidence strength (High/Medium/Low).
- At least two control types are present in the validation plan.
- Mechanism variables are defined operationally, not just named.
- Stop conditions are specified for every validation branch.
- No operational recipes, fabrication parameters, or hazardous procedural details are included.

# Claim Boundaries

- **High evidence**: Claim only what is directly supported by converged, cross-checked results in the target system.
- **Medium evidence**: Claim mechanism plausibility or directional trend; label as requiring independent verification.
- **Low evidence**: Claim hypothesis candidacy only; present as a testable conjecture with explicit falsification criteria.
- Never equate “mechanism exists” with “mechanism dominates” or “mechanism generalizes.”
- Never present single-paper conclusions as field consensus.

# Failure Modes

Anticipate and pre-register the following:
- **Averaging/screening**: The internal variable is washed out by disorder, thermal fluctuations, or ensemble averaging.
- **Geometric/thermal mimicry**: The signal reproduces in negative controls lacking the target mechanism but sharing geometry or temperature dependence.
- **Extreme-parameter artifact**: The effect appears only at unphysical or unsafe parameter extremes.
- **Approximation masking**: Model simplifications (e.g., harmonic, mean-field, single-particle, ideal boundary) generate spurious signals.
- **Cross-coupling ambiguity**: Multiple internal variables produce indistinguishable observables.
- **Measurement-chain contamination**: Instrument, contact, or environmental effects dominate the target signal.

# Validity Checks

Before delivering any plan, confirm:
- [ ] The research question is framed as a causal mechanism, not an existence query.
- [ ] Hidden variables are translated into relative/coupled variables with traceable indicators.
- [ ] Predictions include directional or scaling signatures, not just presence/absence.
- [ ] Controls can falsify at least one alternative explanation.
- [ ] Metrics include primary, mechanism, and robustness indicators.
- [ ] Confounders (geometry, thermal, random, finite-size, reference errors) are explicitly addressed.
- [ ] Extrapolation boundaries are stated for every claim.
- [ ] The output contains no operational lab instructions, hazardous parameters, or unsafe procedures.
- [ ] Source-specific materials, numerical results, and paper conclusions are excluded from the reusable body.

# Provenance

- Synthesized from cluster `27`, subcluster `27.0`.
- Source skills: `superfluid-interface-research-workflow` (a4d43d923ab8ffa3), `semiconductor-defect-multiphonon-research` (79d412118336866f), `2d-topological-spintronics-workflow` (aed39967b79fb104), `vortex-beam-dynamics-research-design` (14bd423712d59c9c), `landau-polariton-research-workflow` (b84140b95c3d0f63), `active-nematic-rheology-exploration` (b85cb6b8f33400c2), `mott-memristor-exploration-workflow` (e1e0d757b62a205d), `interfacial-frustrated-skyrmion-exploration` (7eaf7734cc54e5db).
