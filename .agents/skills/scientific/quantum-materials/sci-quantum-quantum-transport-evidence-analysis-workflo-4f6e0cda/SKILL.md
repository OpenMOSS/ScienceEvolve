---
name: sci-quantum-quantum-transport-evidence-analysis-workflo-4f6e0cda
description: A reusable end-to-end workflow for generating falsifiable hypotheses, designing controlled validation plans, and auditing mechanism claims in quantum transport and correlated electron systems.
scienceevolve-title: "Quantum materials and condensed matter · quantum transport evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help an agent transform an anomalous or unexplained observable in quantum transport, superconductivity, Hall effects, or correlated electron systems into a structured, auditable research program. The goal is to produce falsifiable mechanism hypotheses, design minimal controlled validations, analyze results through competing models, and iterate or abandon claims based on pre-registered evidence criteria—not to reproduce any single paper’s conclusions.

## When to use

- A user observes an unexpected transport, thermal, magnetic, or spectroscopic signature and needs to evaluate whether it reflects a new collective mechanism, an artifact, or a known alternative.
- The task requires moving from phenomenology to mechanism discrimination via controlled comparisons, model consistency checks, and cross-sample reproducibility.
- The user needs a non-operational research design (hypotheses, controls, analysis plan, iteration logic) rather than fabrication recipes, device parameters, or executable experimental procedures.
- The context involves layered, nanoscale, topological, or strongly correlated systems where multiple competing explanations (e.g., coherent coupling, disorder, interface effects, finite-size artifacts) are plausible.

## Inputs required

- **System description**: Dimensionality, relevant degrees of freedom, symmetry constraints, and known energy/length scales.
- **Observed anomaly**: The unexpected response, its measurement conditions, and any existing baseline data.
- **Candidate mechanisms**: Prior theoretical or analogical proposals, including the target mechanism and at least one credible alternative.
- **Tunable variables**: Control parameters that can vary coupling strength, dimensionality, carrier density, symmetry, or disorder.
- **Available observables**: Transport, thermal, magnetic, spectroscopic, or noise quantities accessible to the user.
- **Constraints**: Non-operational experimental or computational boundaries, reproducibility requirements, and institutional safety/compliance limits.

## Core Workflow

### Phase 1: Mechanism-Gap Definition & Hypothesis Generation
1. Frame the anomaly as a falsifiable question: which structural or electronic variable produces the observed response, and how would a target mechanism differ from alternatives?
2. Map each candidate mechanism to at least one discriminating observable and one artifact/null model.
3. Generate 2–3 competing hypotheses. For each, specify:
   - Evidence strength (strong / medium / weak / insufficient)
   - Key assumptions required for the mechanism to hold
   - Falsification criteria and predicted failure modes
4. **Decision Gate 1**: Are all hypotheses linked to distinct, measurable signatures? If not, refine the observable mapping before proceeding.

### Phase 2: Controlled Validation Design
1. Select a **minimal viable verification**: one control variable and one core observable that can confirm or deny the target mechanism’s existence.
2. Construct a control hierarchy:
   - **Positive control**: a reference configuration known to produce the target signature, validating the measurement/analysis pipeline.
   - **Negative control**: a configuration lacking the target mechanism, expected to suppress the signature.
   - **Strong control**: parametric variation designed to modulate the mechanism strength and test predicted scaling or sign changes.
   - **Baseline control**: an unperturbed or reference state for background subtraction.
3. Define evaluation metrics (e.g., trend consistency, parameter physicality, cross-sample agreement) and pre-register stop conditions.
4. **Decision Gate 2**: Does the design isolate the target mechanism from dominant confounders (disorder, contacts, thermal effects, finite-size artifacts)? If not, redesign controls.

### Phase 3: Execution & Metadata Capture (Non-operational)
1. Specify the analytical or measurement boundary conditions: temperature/energy windows, field ranges, sample geometries, or numerical convergence criteria.
2. Record all preprocessing choices, random seeds, sampling strategies, batch identifiers, and data-selection rules to ensure traceability.
3. **Explicit exclusion**: Do not provide fabrication parameters, hazardous operational protocols, material synthesis recipes, or executable device-operation steps.

### Phase 4: Multi-Model Analysis & Evidence Grading
1. Preprocess data with documented choices (background subtraction, normalization, outlier handling). Perform sensitivity tests on critical choices.
2. Fit competing models simultaneously: target mechanism, alternative physical models, and artifact/null models.
3. Run consistency checks:
   - Extracted parameters must lie within the model’s theoretical domain.
   - Relevant length/energy scales must satisfy hierarchical ordering constraints.
   - The same mechanism must reproduce across independent samples or computational realizations.
4. Assign a conclusion grade:
   - **Strong**: Multiple independent controls, model consistency, parametric systematics, and replication all align.
   - **Medium**: Primary trend supports the mechanism, but important alternatives remain unexcluded.
   - **Weak**: Only a single signal or visual consistency is present.
   - **Insufficient**: Required controls are missing or model checks fail.
5. **Decision Gate 3**: Does the evidence grade reach at least “Medium” with no critical control failures? If not, halt claim formation and proceed to iteration.

### Phase 5: Iteration, Abandonment, or Claim Audit
1. **If supported**: Strengthen the claim by adding complementary observables, testing robustness against stronger perturbations, and checking adjacent parameter windows.
2. **If partially supported**: Revise the mechanism (e.g., adjust coupling regime, dimensionality, or dominant scattering channel) or split the hypothesis into independently testable sub-mechanisms.
3. **If contradicted**: Abandon or downgrade the hypothesis. Elevate the best-supported alternative. Preserve negative results as boundary conditions.
4. **Stop conditions** (trigger abandonment or pivot):
   - The negative control replicates the target signal at comparable magnitude.
   - The positive control fails and cannot be attributed to pipeline error.
   - Results depend on a single, non-robust analysis choice or subsample.
   - A competing model explains all key observations with fewer or weaker assumptions.
   - Key parameters violate physical bounds or the model’s own assumptions.
5. **Decision Gate 4**: Is the claim ready for communication? Only advance if the evidence is Strong or Medium, all uncertainties are disclosed, and no single-paper result is presented as field consensus.

## Output Format

Each invocation must produce:

1. **Research question**: One sentence defining the falsifiable mechanism question.
2. **Candidate hypothesis table**: Mechanism chain, evidence strength, key assumptions, falsifiable predictions, and failure modes for each hypothesis.
3. **Minimal viable verification plan**: Core variable, primary observable, control hierarchy, evaluation metrics, and stop conditions.
4. **Analysis plan**: Preprocessing rules, competing models, consistency checks, sensitivity tests, and visualization strategy.
5. **Iteration roadmap**: Conditions for strengthening, revising, splitting, or abandoning hypotheses.
6. **Evidence boundary statement**: Clear separation of “verified by prior literature,” “supported by current analysis,” and “remaining uncertainty.”

## Validation Gates

- **Gate 1 — Hypothesis clarity**: Every hypothesis must be falsifiable and mapped to at least one discriminating observable and one artifact model.
- **Gate 2 — Control sufficiency**: The validation plan must include positive, negative, strong, and baseline controls capable of isolating the target mechanism from confounders.
- **Gate 3 — Analytical rigor**: Competing models must be compared on multiple observables; single-curve or single-metric fitting is insufficient for mechanism attribution.
- **Gate 4 — Iteration discipline**: Pre-registered stop conditions must be enforced; claims cannot advance if negative controls fail or if results require ad hoc data exclusions.

## Claim Boundaries

- Do not present results from a single system, single paper, or single measurement as domain consensus.
- Distinguish “consistent with” or “supports” from “proves”; reserve causal language for Strong evidence with independent replication.
- Do not extrapolate mechanism claims beyond the validated parameter window, symmetry class, or sample geometry.
- Avoid application, performance, or engineering-feasibility claims based solely on transport or spectroscopic evidence.
- All inferences to new systems must be explicitly downgraded to “testable analogy” pending independent validation.

## Failure Modes

| Failure Mode | Indicator | Response |
|---|---|---|
| Negative control positive | Target signature appears when mechanism is absent | Halt mechanism attribution; elevate confounder hypotheses |
| Positive control failure | Known signature is not recovered | Diagnose pipeline before interpreting new data |
| Analysis fragility | Result vanishes under alternative preprocessing or subsampling | Downgrade evidence to Weak/Insufficient; report sensitivity |
| Competing model dominance | Alternative explains data with fewer assumptions | Abandon or revise target hypothesis |
| Parameter unphysicality | Fitted values violate model assumptions or known bounds | Reject model fit; check applicability domain |
| Irreproducibility | Signal absent in independent samples/batches/realizations | Treat as sample-specific artifact or insufficient evidence |
| Mechanism conflation | Multiple distinct mechanisms produce identical predicted signature | Design stronger discriminating controls before claiming discovery |

## Validity Checks

- **Confounders**: Systematically list disorder, interface/contact effects, thermal drift, inhomogeneity, finite-size effects, numerical convergence errors, and background contributions. Assess whether each could mimic the target signature.
- **Reproducibility**: Require cross-sample, cross-batch, or independent computational realizations. Report failure rates and outlier handling.
- **Boundary conditions**: State the model’s theoretical applicability domain, measurement window, symmetry assumptions, and dimensionality limits.
- **Statistical validity**: Report uncertainties, sample sizes, confidence intervals, and the impact of multiple comparisons. Avoid selective reporting of best-case curves.
- **Mechanism uniqueness**: Confirm that the target signature is not equally well explained by multiple artifact or alternative models.
- **Extrapolation limits**: Flag any generalization from single-system results and require independent corroboration before upgrading to broader claims.

## Provenance

- Synthesized from **Cluster 96 / Subcluster 96.0** (observable-driven evidence analysis and claim audit).
- Derived from source skills: `quantum-transport-superlattice-workflow`, `spintronic-transport-research-pattern`, `flat-band-hall-research-workflow`, `rashba-skyrmion-transport-workflow`, `topological-thermal-transport-exploration`, `fractional-quantum-hall-andreev-research-design`, `flat-band-dirac-transport-exploration`, `quantum-hall-workflow-explorer`.
