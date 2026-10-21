---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-e2935ef5
description: A reusable end-to-end workflow for generating mechanism-first hypotheses and validating them through symmetry-aware, multi-stream evidence triangulation in quantum, topological, and transport materials research.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 66"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide an agent to design and execute a reusable research program that discovers and validates physical mechanisms in quantum, topological, and transport materials by leveraging symmetry, structural order, and electronic topology. The workflow converts a boundary in an established theory into a constructive, testable hypothesis, validates it through orthogonal evidence streams, and iterates based on discrepancy classes while strictly bounding claims.

# When to use

Use this skill when:

- a dominant theory or mechanism works in one regime but fails or becomes ambiguous under changed symmetry, dimensionality, disorder, or extreme conditions;
- the target field relies on an emergent object, defect, or carrier whose definition assumes idealized structure or symmetry;
- you need to connect a local, symmetry-breaking event to a collective or macroscopic response;
- you must distinguish an intrinsic mechanism from extrinsic effects, phenomenological fits, or alternative explanations;
- you are planning computational screening, inverse design, or experimental validation where a descriptor or proxy must be mechanistically justified.

Do not use this skill to:

- claim universal validity for any single theory or model;
- provide operational laboratory recipes, synthesis protocols, fabrication parameters, or equipment procedures;
- substitute for safety-critical engineering certification or hazardous-material handling instructions.

# Inputs required

Before starting the workflow, collect or state as assumptions:

- **Target regime and material class:** the symmetry class, dimensionality, and environmental context of interest.
- **Established theory boundary:** the dominant explanation and the regimes where its assumptions break down.
- **Candidate mechanisms:** proposed local events, carriers, topological features, or coupling mediators.
- **Available observables:** structural, spectroscopic, transport, or computational diagnostics accessible for validation.
- **Relevant scales:** length, energy, and time scales that separate single-event, collective, and macroscopic behavior.
- **Constraints:** computational cost, experimental feasibility, reproducibility requirements, and safety boundaries.
- **Benchmarks:** known positive and negative examples, trusted reference methods, or literature baselines.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Bound the problem and identify the symmetry gap
- State the dominant mechanism or law and the symmetry/structural assumptions it requires.
- Identify regimes where those assumptions are absent, ambiguous, or require post-hoc repair.
- Convert each boundary failure into a precise research question.
- **Decision gate:** If no clear boundary or missing link can be defined, stop and refine the problem scope.

## 2. Formulate mechanism-first hypotheses
- For each candidate, build a causal chain: structure/symmetry → electronic or topological state → coupling mediator → measurable response.
- Define the primitive carrier, descriptor, or order parameter independently of the response it explains.
- Label each hypothesis with: evidence strength (weak/moderate/strong), key assumptions, predicted discriminating signature, and likely failure modes.
- **Decision gate:** Reject any hypothesis that is circular (the carrier cannot be defined without the phenomenon) or that relies solely on phenomenological fitting.

## 3. Design a minimal viable validation package
- Select the simplest system where the proposed mechanism should dominate.
- Define independent variables: symmetry class, structural variant, perturbation type, or control parameter.
- Define dependent variables: local marker, collective proxy, transport coefficient, or topological invariant.
- Institute a multi-control strategy:
  - **Positive control:** a regime where the mechanism is expected to hold.
  - **Negative control:** a matched system where the mechanism should be absent.
  - **Mechanism control:** a variant that disrupts the suspected coupling pathway.
  - **Structural/spatial control:** evidence that property and structural probes refer to the same region or model cell.
- **Decision gate:** If no discriminating observable or feasible control exists, downgrade the hypothesis to exploratory and flag the missing link.

## 4. Triangulate orthogonal evidence
- Gather at least three mutually constraining evidence streams (e.g., structural consistency, symmetry analysis, first-principles or minimal-model prediction, transport or spectroscopic response).
- Validate across levels:
  - **Single-event/local:** plausibility of the primitive carrier or local symmetry breaking.
  - **Collective/intermediate:** emergence of the expected higher-order law, defect, or correlated state.
  - **Macroscopic/integrated:** prediction of held-out or independent observables.
- **Decision gate:** If evidence streams contradict one another, or if structural and response probes sample different regions, halt interpretation and audit confounders before proceeding.

## 5. Discriminate mechanisms via contrastive analysis
- Compare intrinsic versus extrinsic contributions using scaling behavior, field or temperature dependence, and limiting-case analysis.
- Test symmetry sensitivity: compare ordered and disordered models, enantiomeric or mirror-related variants, and mediator-suppressed configurations.
- Check whether the response survives when the suspected essential feature is removed.
- **Decision gate:** If negative or mechanism-suppressed controls reproduce the target response, demote the primary hypothesis and activate alternative mechanism search.

## 6. Robustness and stability checks
- Vary boundary conditions, sampling density, structural assumptions, approximations, and analysis baselines.
- Evaluate rank stability, convergence, and sensitivity of descriptors or proxy scores.
- Inspect outliers for systematic patterns tied to missing physics or descriptor artifacts.
- **Decision gate:** If conclusions depend on a single untested assumption, arbitrary threshold, or narrow benchmark, iterate on the model or descriptor before claiming support.

## 7. Iterate based on discrepancy class
- **Supportive convergence:** All controls pass and diagnostics agree. Escalate to higher-fidelity validation or broaden to related candidate families.
- **Ambiguous result:** One evidence stream is weak or spatially mismatched. Refine exactly one design axis (descriptor, candidate space, symmetry treatment, or sampling) and re-run benchmarks.
- **Contradictory result:** Response conflicts with the proposed mechanism. Reject or split the hypothesis; use the failure to define a new boundary condition.
- **Systematic outliers:** Multiple candidates share an unexpected pattern. Generate a family-level hypothesis about a missing physical ingredient.
- **Stop conditions:**
  - Stop if the primitive carrier or descriptor cannot be defined independently of the response.
  - Stop if controls consistently fail or a simpler explanation explains the same data without loss of predictive power.
  - Stop if the mechanism violates conservation, symmetry, thermodynamic, or stability constraints.

## 8. Bound claims and archive failure modes
- State explicitly what is validated, what remains model-dependent, and the regime beyond which extrapolation is unsupported.
- Document negative results, ambiguous fits, and boundary failures as part of the output.
- Separate paper-supported inferences, agent-generated hypotheses, model-derived predictions, and untested extrapolations.

# Output Format

When using this skill, produce:

1. **Bounded research question** — the symmetry gap, target regime, and why it is scientifically useful.
2. **Mechanism hypotheses table** — for each hypothesis: candidate mechanism, evidence strength, key assumptions, predicted signature, minimal validation, and failure modes.
3. **Validation design** — minimal viable package with variables, controls, evaluation metrics, and stop conditions.
4. **Analysis plan** — multi-level checks, mechanism discrimination criteria, robustness tests, and uncertainty handling.
5. **Iteration log** — discrepancy classification, hypothesis updates, and next-cycle revisions.
6. **Validity and boundary statement** — main confounders, reproducibility requirements, extrapolation limits, and safety/ethics constraints.

# Validation Gates

Before concluding that a mechanism is supported, verify:
- The established theory's boundary is identified, not just its terminology.
- The primitive carrier or descriptor is defined independently of the response it explains.
- Derived quantities are distinguished from fitted parameters.
- Single-event, collective, and macroscopic validations are separated and consistent.
- Positive, negative, mechanism, and structural/spatial controls are present and behave as expected.
- At least three orthogonal evidence streams converge.
- Uncertainty, sensitivity, and confounding factors are addressed.
- Extrapolation boundaries are stated explicitly.

# Claim Boundaries

- Do not claim that a mechanism is universally valid beyond the tested symmetry class, material family, or environmental regime.
- Do not present computational candidates or model predictions as experimentally confirmed materials.
- Do not treat a single study's benchmark performance as field-wide consensus.
- Keep recommendations at the research-design level; do not issue operational instructions for synthesis, fabrication, or high-risk measurement.
- Distinguish clearly between validated mechanism, plausible inference, exploratory hypothesis, and untested extrapolation.

# Failure Modes

- **Circular hypothesis:** The proposed carrier or descriptor is defined only through the phenomenon it explains, making it unfalsifiable.
- **Confounding phase or competing mechanism:** An uncontrolled structural variant, extrinsic scattering, or alternative coupling produces the same signature.
- **Spatial or model mismatch:** Property and structural probes sample different regions, or computational and experimental models use inconsistent assumptions.
- **Compensating errors:** Agreement arises from error cancellation rather than correct physics.
- **Overfitting:** The model requires many fitted parameters or only works after post-hoc repairs.
- **Descriptor artifact:** The proxy score reflects numerical choices, sampling sparsity, or visualization thresholds rather than the intended mechanism.
- **False convergence:** Rankings or predictions appear stable only within a narrow benchmark set.

# Validity Checks

Before presenting a research plan or conclusion, check:
- Does the plan identify the established theory's boundary?
- Is the primitive carrier or descriptor independently defined and physically interpretable?
- Are derived quantities distinguished from fitted parameters?
- Are single-event, collective, and macroscopic validations separated?
- Are positive, negative, mechanism, and structural/spatial controls included?
- Are uncertainty, sensitivity, and confounding factors addressed?
- Are material-specific or system-specific discrepancies classified rather than ignored?
- Are extrapolation boundaries stated explicitly?
- Is the proposed plan reusable for a new problem without copying source-specific parameters?
- Are paper-supported findings separated from agent-generated hypotheses?

# Provenance

Synthesized from cluster `104.0` (symmetry-guided mechanism discovery and validation). Derived from source skills: `plasticity-emergence-research-design`, `heusler-topological-hall-exploration`, `phonon-mediated-superconductivity-proxy-screening`, `inorganic-electride-inverse-design-agent`, `fci-sf-variational-exploration`, `chiral-optospintronic-exploration`, `ddh-screening-parameter-research`, `high-pressure-hydride-superconductivity-exploration`. Source-specific systems, numerical results, and paper conclusions have been removed; only the shared workflow route and validation logic are retained.
