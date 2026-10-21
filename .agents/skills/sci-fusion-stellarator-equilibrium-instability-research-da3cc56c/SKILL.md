---
name: sci-fusion-stellarator-equilibrium-instability-research-da3cc56c
description: End-to-end research design workflow for magnetic confinement concepts, covering hypothesis generation, mechanism-driven study design, multi-evidence validation, and iterative redesign with explicit stopping conditions.
scienceevolve-title: "Magnetic confinement fusion · stellarator equilibrium instability research design workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Synthesize a reusable agent instruction for designing and validating research programs in magnetic confinement, equilibrium, and instability studies. The workflow abstracts the common route from research-gap identification through hypothesis generation, minimal viable validation design, multi-evidence analysis, and iterative redesign, while enforcing strict separation between established mechanisms and new-system inferences.

# When to use

- Designing research questions for magnetic confinement systems where equilibrium, stability, or transport anomalies require explanation.
- Migrating validated theoretical or computational methods across magnetic topologies or confinement concepts.
- Structuring computational validation campaigns involving field reconstruction, coil-configuration space, or boundary-equilibrium analysis.
- Evaluating candidate configurations against physical and engineering feasibility constraints through non-operational study.
- Investigating performance degradation via controlled perturbation and mechanism attribution when direct state measurement is incomplete.

# Inputs required

- Target system class and magnetic topology category.
- Performance gap or anomalous behavior to be explained.
- Candidate mechanisms and a prior evidence map.
- Available models, diagnostics, or computational tools and their uncertainty characteristics.
- Baseline or benchmark configurations for controlled comparison.
- Safety, compliance, and scope boundaries restricting the study to non-operational design.

# Core Workflow

1. **Frame the gap**  
   Define the performance limitation and the boundary between the target system and validated reference regimes. Record invariants and non-negotiable constraints.

2. **Generate falsifiable hypotheses**  
   Formulate candidate hypotheses as causal chains: driver → transport/stability channel → observable signature. Tag each with evidence strength (strong / moderate / weak / inferential). Explicitly list key assumptions and failure modes.  
   - *Gate 1 — Falsifiability*: Reject any hypothesis that lacks an observable refutation criterion before evaluation begins.

3. **Design minimal viable validation (MVV)**  
   Select the smallest discriminating perturbation or model variation that can separate the leading hypothesis from its nearest competitor. Define independent variables, control variables, and evaluation metrics. Establish baseline, positive-control, negative-control, and sensitivity-control cases.  
   - *Gate 2 — Feasibility*: If no reversible, observable perturbation exists, stop and reformulate the research question.

4. **Execute and capture multi-evidence**  
   Run the MVV using compatible models or diagnostics. Capture primary performance metrics, auxiliary physical metrics, and robustness indicators. Record all inputs, boundary conditions, discretization settings, and tool versions for traceability.

5. **Assess mechanism consistency**  
   Check data quality and cross-diagnostic or cross-model consistency. Compare relevant scale hierarchies to ensure the assumed mechanism can operate in the target regime. Test whether the mechanism variable and the performance metric move in the predicted direction.  
   - *Gate 3 — Candidate gate*: If the mechanism variable changes but the performance metric does not respond accordingly, downgrade the hypothesis and return to Step 2.

6. **Benchmark against controls and uncertainty**  
   Compare results against baseline, positive, and negative controls. Quantify numerical, model, and parametric uncertainties. Scan for confounding by uncontrolled variables such as boundary conditions, resolution, or model approximations.  
   - *Gate 4 — Stability gate*: If negative controls show comparable improvement, or if uncertainty envelopes nullify the effect, halt the current inference line and document the failure mode.

7. **Iterate or terminate**  
   - *Supported*: Tighten constraints, expand to adjacent parameter space, or increase model fidelity in targeted ways.  
   - *Partially supported*: Refine the mechanism chain, add intermediate variables, or redesign the perturbation.  
   - *Rejected*: Return to Step 2 to generate alternatives, or terminate the research line if the gap is unbridgeable under current constraints.  
   - *Stop conditions*: Terminate when safety/compliance boundaries are reached, when successive iterations fail to discriminate competing mechanisms, or when evidence plateaus without actionable insight.

8. **Archive and synthesize**  
   Compile the evidence map, updated hypothesis rankings, residual risks, and records of failed paths or negative results.

# Output Format

Produce a structured research-design report containing:

1. `Research question` — One-sentence definition with system boundary and non-extrapolable limits.  
2. `Evidence map` — Established mechanisms, transferable methods, evidence gaps, and inferred links with strength ratings.  
3. `Ranked hypotheses` — Causal chain, key assumptions, observable signatures, failure modes, and current evidence strength for each candidate.  
4. `Study plan` — MVV description, variable definitions, control cases, evaluation metrics, and stopping conditions.  
5. `Validation plan` — Analysis steps, uncertainty quantification, robustness checks, and cross-diagnostic or cross-model consistency requirements.  
6. `Iteration log` — Decision-gate outcomes, updated assumptions, and the next-cycle minimal verification.

# Validation Gates

- **Candidate gate**: The mechanism variable must correlate with the performance metric in the predicted direction; otherwise reject or revise the candidate hypothesis.  
- **Stability gate**: Results must survive negative-control scrutiny and uncertainty propagation; otherwise halt inference.  
- **Falsifiability gate**: Every hypothesis must possess a defined observable that would refute it before any evaluation begins.  
- **Extrapolation gate**: Conclusions about new topologies or regimes must be labeled as inferences and re-validated; never treat single-study results as domain consensus.

# Claim Boundaries

- Distinguish conclusions that are "established in reference systems" from those that are "inferred for the target system."  
- Distinguish findings that are "supported by current evidence" from those that "require independent replication."  
- Do not claim operational feasibility, engineering certification, or safety approval.  
- Do not generalize idealized or fixed-boundary results to free-boundary, finite-pressure, or kinetic regimes without explicit re-validation.

# Failure Modes

- **Local optimum trap**: Optimization or hypothesis refinement converges to a narrow region that fails under broader perturbation.  
- **Spurious correlation**: Performance change attributed to the wrong mechanism due to uncontrolled coupling (e.g., geometric changes simultaneously altering stability and implementation error).  
- **Model artifact**: Conclusions driven by discretization, resolution, coordinate choice, or unphysical regularization rather than target physics.  
- **Extrapolation collapse**: Applying a mechanism validated in one magnetic topology to another without checking symmetry, closure, or drift-scale assumptions.  
- **Iteration deadlock**: Competing hypotheses produce indistinguishable signatures given current diagnostic or model resolution.

# Validity Checks

- **Confounders**: Boundary conditions, numerical resolution, coordinate systems, initial conditions, regularization, model approximations, and diagnostic calibration drift.  
- **Reproducibility**: Fixed seeds, versioned inputs, documented parameter ranges, and independent replication paths.  
- **Statistical / model validity**: Sensitivity to perturbations, sampling adequacy, uncertainty propagation, and avoidance of single-case generalization.  
- **Boundary conditions**: Explicit limits of applicability for ideal vs. resistive, vacuum vs. finite-pressure, and fixed vs. free-boundary assumptions.  
- **Mechanism consistency**: Final metrics must trace back to interpretable mechanism variables; reject black-box optimizations that lack physical links.

# Provenance

- Synthesized from cluster 4.0 (`plasma-stellarator-equilibrium-instability-research-design-workflow`).  
- Derived from source skills: `nonneutral-plasma-equilibrium-exploration` (10.1103_physrevlett.97.095003), `mirror-hybrid-coil-concept-exploration` (10.1007_s10894-011-9479-z), `gyrotron-alignment-research-workflow` (10.1109_ted.2019.2899163), `stellarator-integrability-optimization` (10.1063_1.864692), `stellarator-free-boundary-equilibrium-research` (10.1088_1741-4326_aa6c13), `mirror-hybrid-field-coil-design` (10.1007_s10894-010-9353-4), `plasma-rf-coupling-research` (10.3390_plasma7030030), `compact-stellarator-coil-research-design` (10.13182_fst02-a206).
