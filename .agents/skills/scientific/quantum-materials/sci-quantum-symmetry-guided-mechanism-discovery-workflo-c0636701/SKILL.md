---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-c0636701
description: A reusable end-to-end workflow for discovering and validating physical mechanisms in quantum and correlated matter by exploiting symmetry constraints, discriminating observables, and controlled decomposition.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 36"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to design research plans that discover and validate mechanisms in quantum, topological, and correlated systems. The workflow extracts transferable methodology from symmetry-guided studies: frame a theory tension, choose observables that distinguish competing mechanisms under hard symmetry constraints, validate through controlled decomposition, and bound claims within tested regimes.

## When to use

Use this skill when:

- The user asks for new research questions or hypotheses where an effective description and a microscopic or hidden-structure description make different predictions.
- A target system has competing explanations for an observed phase, transport anomaly, spectral transition, or emergent response.
- The task is to design a non-operational theoretical, numerical, or conceptual experimental workflow rather than execute a laboratory protocol.
- The agent must separate mechanism from artifact, geometry, boundary condition, or approximation effect.
- The user needs controls, metrics, validity checks, and iteration rules for deciding whether a proposed mechanism is supported.

Do not use this skill as a substitute for domain-specific experimental execution instructions, device operation, production-level simulation code, or unsafe procedural guidance.

## Inputs required

Before producing a plan, request or identify:

- **Target system class:** particle statistics, dimensionality, symmetry, interaction class, and known phase behavior.
- **Competing descriptions:** effective theory, microscopic ansatz, phenomenological model, or alternative quasiparticle picture.
- **Candidate observables:** response functions, spectral features, transport proxies, correlation measures, or topological invariants.
- **Available methods:** analytic derivation, high-fidelity computation, approximate model, data reanalysis, or conceptual experiment.
- **Prior evidence:** what is established, inferred, or speculative.
- **Hard constraints:** symmetries, conservation laws, sum rules, projection constraints, and known limiting behavior.
- **Confounders:** geometry, boundary conditions, disorder, finite size, resolution, observable definition, and numerical uncertainty.
- **Validation needs:** controls, convergence criteria, uncertainty thresholds, and stop conditions.

## Core Workflow

Follow this ordered route. Treat each gate as a hard stop or redesign trigger.

1. **Frame the mechanism gap.**  
   Define the observable anomaly or capability gap and why existing explanations are insufficient. State the default classification and the specific prediction mismatch that motivates a new mechanism search.  
   **Gate:** If the gap cannot be expressed as a testable conflict between two or more mechanistic predictions, stop and reformulate the question.

2. **Identify competing mechanisms.**  
   List at least two explanations: a default or effective-theory picture and one or more alternatives (e.g., hidden symmetry breaking, emergent quasiparticle, boundary-driven, or geometric contribution). Map each to distinct symmetry constraints, conservation laws, or spectral signatures.  
   **Gate:** If the mechanisms do not make different predictions for any accessible observable, stop.

3. **Select discriminating observables.**  
   Choose the observable that couples most directly to the disputed mechanism and has well-defined limiting behavior under the relevant symmetries. Prefer observables that are insensitive to known confounders.  
   **Decision:** If no single observable separates the mechanisms, design a paired-observable strategy where complementary measurements respond differently to the competing channels.

4. **Design minimal viable validation.**  
   Define a reference case, a stress-test case, a negative control (mechanism absent), and a positive control (mechanism present). Include a simplified constrained model that preserves required symmetries and a direct high-fidelity method.  
   **Stop condition:** If controls cannot isolate the mechanism from artifacts, numerical choices, or background, redesign before proceeding.

5. **Target the asymptotic or limiting regime.**  
   Determine the parameter regime where competing predictions maximally diverge while remaining within the validity range of the method. Ensure finite-size, resolution, boundary, or sampling limitations do not hide the signature.  
   **Gate:** If the asymptotic regime is unreachable or the method leaves its validity range, stop and select a different observable or system.

6. **Decompose response channels.**  
   Separate the total response into control-dependent and control-independent channels, or into symmetry-allowed and symmetry-forbidden contributions. Identify which channel dominates under baseline conditions and which carries the mechanism-specific signature.  
   **Iteration trigger:** If decomposition is impossible because perturbations change multiple channels simultaneously, add geometry, symmetry, or approximation controls to isolate them.

7. **Predict signatures before measurement.**  
   Derive the expected functional form, sign, scaling, or topological feature from each competing mechanism before comparing with data. State the boundary condition under which each prediction holds.  
   **Gate:** If predictions are generated only by fitting after data collection, stop and derive falsifiable criteria first.

8. **Execute, compare, and classify evidence.**  
   Compute or measure the target observable with uncertainty estimates. Compare against the default prediction and the simplest constrained alternative. Inspect residuals for systematic structure. Test robustness across contrast systems, gauge or symmetry choices, and numerical convergence.  
   **Decision:** If the result matches the default mechanism, abandon the alternative. If it matches the alternative, proceed to broaden. If ambiguous, flag for iteration.

9. **Iterate by mechanism, not by endpoint.**  
   - **Strengthen:** If the signature matches the alternative and controls survive, test related observables or broader model families cautiously.  
   - **Revise:** If scaling agrees but coefficients fail, treat the mechanism as incomplete and search for missing constraints.  
   - **Abandon:** If the default mechanism explains all observations or the transition disappears under convergence checks, reject the new mechanism.  
   - **Redesign:** If uncertainty dominates, improve convergence, resolution, or control isolation before claiming support.  
   **Stop condition:** Stop when the claim is bounded to tested observables, regimes, and assumptions, or when further iteration requires uncontrolled tuning.

10. **Bound claims and document provenance.**  
    State which observables and regimes are directly supported, which are inferred, and which remain speculative. Separate methodology supported by source skills from agent-inferred extensions. Record all assumptions, controls, and failure modes.

## Output Format

When using this skill, produce:

```text
1. Trigger assessment
   - Why this skill applies or does not apply.

2. Research question
   - Main question.
   - Competing explanations.
   - Boundary of the question.

3. Hypothesis set
   For each hypothesis:
   - Evidence strength (Directly supported / Mechanistically plausible / Trend-level / Boundary-conditioned / Speculative).
   - Key assumptions.
   - Mechanistic rationale.
   - Target observable.
   - Expected signature.
   - Primary failure mode.
   - Falsification test.
   - Next iteration trigger.

4. Minimal viable validation
   - Reference case.
   - Stress-test case.
   - Negative control.
   - Positive control.
   - Direct high-fidelity method.
   - Simplified constrained model.

5. Design plan
   - Independent variables.
   - Dependent variables.
   - Controlled variables.
   - Contrast systems.
   - Metrics.
   - Stop conditions.

6. Analysis plan
   - Convergence checks.
   - Comparison against default mechanism.
   - Comparison against constrained alternative.
   - Residual interpretation.
   - Evidence classification.

7. Iteration plan
   - Conditions for strengthening the mechanism.
   - Conditions for revising the mechanism.
   - Conditions for abandoning or reframing the hypothesis.

8. Validity and boundary statement
   - Confounders.
   - Reproducibility requirements.
   - Boundary conditions.
   - Claims not to overgeneralize.
   - Provenance of methodology versus new inference.
```

## Validation Gates

Before finalizing a plan or claim, confirm:

- The target observable directly tests the disputed mechanism.
- The study reaches the limit where competing predictions separate.
- Geometry, boundary conditions, projection choices, and observable definitions cannot explain the result alone.
- The direct calculation or measurement is converged and uncertainty-aware.
- The simplified model preserves required symmetries, conservation laws, and limiting behavior.
- The claim survives changes in data processing and contrast-system selection.
- The conclusion is bounded to tested observables, regimes, and assumptions.
- The plan clearly separates source-supported methodology from new-agent inference.

## Claim Boundaries

- Claim only what is directly supported by converged calculations or measurements within the tested regime.
- Do not extrapolate to untested observables, parameter ranges, or material classes.
- Do not treat a single model or system as proof of a universal mechanism class.
- Distinguish verified results, agent-inferred extensions, and speculative proposals.
- Avoid presenting non-operational research plans as executable laboratory protocols or device-operation instructions.

## Failure Modes

Stop or downgrade the claim if:

- The relevant asymptotic or limiting regime is not reached.
- Data from different system sizes or resolutions do not collapse or converge.
- The conclusion depends on a single geometry, gauge, or observable convention.
- The simplified model fits only after uncontrolled tuning.
- The predicted effect is smaller than uncertainty or background variation.
- Independent observables contradict the proposed mechanism.
- The perturbation changes multiple mechanisms at once and no control can isolate them.
- Edge, boundary, or surface effects dominate the claimed bulk mechanism.
- The direct calculation or measurement lacks convergence evidence.

## Validity Checks

Before presenting a research plan or result, check:

- **Confounding:** Can symmetry, disorder, topology, boundary condition, and finite size be separated?
- **Reproducibility:** Are model assumptions, boundary conditions, normalization, and seed handling explicit?
- **Numerical validity:** Are convergence, precision, and sampling checks included?
- **Mechanistic validity:** Does the analytic prediction precede the data comparison?
- **Boundary validity:** Are edge modes distinguished from bulk behavior?
- **Transfer validity:** Is the claim limited to the tested model family unless broader evidence exists?
- **Evidence labeling:** Does every hypothesis include evidence strength, key assumptions, predicted observable, controls, failure modes, and stop conditions?

## Provenance

- Synthesized from cluster 168.0 (symmetry-guided mechanism discovery and validation).
- Derived from source skills: composite-fermion-response-research-planning, flat-band-superconductivity-exploration, tunable-van-der-waals-exploration, non-hermitian-quasiperiodic-transition-discovery, layered-material-paired-observable-research, kondo-lattice-fermi-surface-exploration, dla-attosecond-research-exploration, surface-phonon-tpms-thermal-design.
- Methodology is abstracted from peer-reviewed research patterns; no specific paper conclusions, parameters, or operational protocols are preserved in the reusable workflow body.
