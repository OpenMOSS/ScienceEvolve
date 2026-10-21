---
name: sci-quantum-quantum-phase-spin-electron-research-design-6ad1fe0a
description: An end-to-end reusable workflow for generating falsifiable research questions, designing minimal validation with strong controls, and iterating mechanism hypotheses in quantum, spin, electronic, and materials systems.
scienceevolve-title: "Quantum materials and condensed matter · quantum phase spin electron research design workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Transform observations, anomalies, or theoretical gaps in quantum, spin, electronic, and condensed-matter systems into structured, falsifiable research programs. The workflow emphasizes mechanism-level hypothesis generation, minimal viable validation with rigorous controls, multi-channel analysis, and iterative refinement—without reproducing paper-specific conclusions or operational protocols.

# When to use

Trigger this skill when:

- The user wants to propose new research questions or mechanisms in quantum materials, spin systems, low-dimensional electronics, or related platforms.
- The user has anomalous data, simulation residuals, or unexplained trends and needs a structured path to candidate mechanisms.
- The user needs a study design (experimental or numerical) with explicit variables, controls, stop conditions, and iteration logic.
- The user wants to map abstract theoretical quantities to observable proxies and assess feasibility boundaries.

Do not use when:

- The task is a simple literature summary, term definition, or database query.
- The user requests directly executable hazardous procedures, device parameters, fabrication recipes, or operational safety protocols.
- The research question is purely clinical, biological, or unrelated to physical mechanisms.

# Inputs required

Gather before execution; if information is missing, output a minimum-information gap list rather than fabricating values:

- Target system class and relevant degrees of freedom (e.g., spin, charge, lattice, photonic).
- Known observations, data, or simulation outputs that motivate the question.
- Competing mechanisms or baseline models already considered in the field.
- Available probes, diagnostics, or modeling tools and their resolution limits.
- Constraints: safety, ethics, compliance, reproducibility, and resource boundaries.
- Prior evidence strength and known confounders from literature or prior runs.

# Core Workflow

1. **Gap & Question Formulation**
   - Define the observable anomaly or theoretical gap.
   - Formulate a falsifiable research question at the mechanism level (not just "does X occur?" but "which mechanism causes X?").
   - *Decision gate*: If the question cannot be cast into a mechanism-competition form, pause and refine scope.

2. **Evidence Mapping & Benchmarking**
   - Catalog existing evidence: direct data, analogies from similar systems, theoretical bounds, and literature benchmarks.
   - Label each item with evidence strength (strong / moderate / weak) and note whether it derives from verified sources or inference.
   - Identify missing evidence that would be required to distinguish mechanisms.
   - *Stop condition*: If no empirical or theoretical anchor exists to constrain any mechanism, stop and collect baseline data before proceeding.

3. **Hypothesis Generation (Mechanism Competition)**
   - Generate two or more competing mechanism hypotheses plus a null/artifact hypothesis.
   - For each hypothesis produce:
     - Core mechanism statement.
     - Evidence strength and provenance.
     - Key assumptions (system, model, measurement).
     - Predicted observable signatures (unique and shared).
     - Critical discriminator(s) that can separate it from alternatives.
     - Likely failure modes and what results would falsify it.
   - *Candidate gate*: Rank hypotheses by falsifiability, diagnostic accessibility, and safety; discard hypotheses that are untestable under current constraints.

4. **Minimal Viable Validation Design**
   - Define the smallest set of measurements or simulations that can discriminate the top two hypotheses.
   - Specify:
     - Independent (manipulated) variables.
     - Dependent (response) variables linked to mechanism signatures.
     - Control variables to hold constant.
     - Confounding variables to record and stratify.
   - Design controls:
     - Strong control: target mechanism modulated on/off or parametrically varied.
     - Negative control: condition where target mechanism should be absent or inert.
     - Positive control: condition where a known analogous mechanism produces a detectable signal.
     - Baseline / model control: simplest model without the target mechanism.
   - Define evaluation metrics and pre-registered stop/failure conditions (e.g., negative control matches target signal, data quality insufficient, model non-identifiability).
   - *Safety gate*: If the proposed validation requires operational hazardous parameters, stop and reformulate as non-operational design logic only.

5. **Execution & Data Acquisition (Abstract)**
   - Describe the abstract execution protocol: calibration, systematic scanning, replication, and metadata logging.
   - Emphasize traceability (random seeds, versions, calibration logs, raw data retention).
   - *Stop condition*: If preliminary data violates quality thresholds (calibration failure, irreproducibility, confounder dominance), halt and audit before full acquisition.

6. **Analysis & Mechanism Adjudication**
   - Preprocess with quality audits (background, drift, saturation, outliers).
   - Extract features and propagate uncertainties; avoid selective reporting.
   - Compare competing models against data using:
     - Baseline vs. mechanism-model comparison.
     - Cross-channel consistency checks.
     - Residual diagnostics and sensitivity analysis.
   - Grade conclusions:
     - Verified: multi-channel, replicated, controls passed, residuals acceptable.
     - Supported but non-unique: consistent with hypothesis, alternatives not fully excluded.
     - Weak / insufficient: single channel or low signal-to-noise.
     - Contradicted: key prediction failed or controls failed.
   - *Decision gate*: If results are inconclusive due to model degeneracy, return to Step 4 and design stronger discriminators rather than expanding parameter space arbitrarily.

7. **Iteration & Scope Update**
   - Map outcomes to actions:
     - **Supported**: Elevate to working model; design stricter tests or extend to boundary conditions.
     - **Partially supported / ambiguous**: Refine hypothesis, add covariates, or introduce alternative mechanism.
     - **Contradicted**: Reject or downgrade hypothesis; generate new candidate from residual patterns.
     - **Confounder-dominated**: Pause mechanism claims; redesign controls and audit diagnostics.
   - *Iteration gate*: After each cycle, update the evidence map, revise claim boundaries, and check whether the research question itself needs reformulation.
   - *Termination condition*: Terminate when a mechanism is uniquely verified within stated boundaries, when all candidates are falsified, or when further discrimination requires unsafe or infeasible operational steps.

8. **Claim Bounding & Documentation**
   - State final claims with explicit boundaries: applicable system classes, parameter ranges, dimensionality, temperature/field regimes, and model approximations.
   - Separate verified findings from inferred extensions and unverified analogies.
   - Document failure modes, negative results, and discarded hypotheses.

# Output Format

The agent must produce a structured report containing:

1. **Research Question** — Falsifiable mechanism-level question and applicability boundary.
2. **Evidence Map** — Known evidence, analogy evidence, missing evidence, and strength ratings.
3. **Ranked Hypotheses** — Mechanism, evidence strength, key assumptions, predicted signatures, critical discriminators, failure modes.
4. **Study Plan / Validation Plan** — Minimal viable validation, variable definitions, control table (strong, negative, positive, baseline), evaluation metrics, and stop conditions.
5. **Analysis Plan** — Quality checks, feature extraction, model comparison, uncertainty propagation, residual diagnostics, and decision rules.
6. **Iteration Plan** — Branches for supported, partial, contradicted, and confounder-dominated outcomes with next-step actions.
7. **Claim Boundaries** — Explicit scope of validity and extrapolation limits.
8. **Validity & Safety Notes** — Confounders, reproducibility requirements, statistical checks, and non-operational safety boundaries.

# Validation Gates

- **Question quality gate**: Is the question mechanism-competitive and falsifiable?
- **Evidence sufficiency gate**: Is there at least one empirical or theoretical anchor per competing mechanism?
- **Discrimination gate**: Does the minimal validation contain a control that can falsify each top hypothesis?
- **Quality gate**: Are calibration, replication, and metadata requirements defined before execution?
- **Safety gate**: Does the plan remain at the non-operational design level, avoiding hazardous procedural detail?
- **Conclusion gate**: Are claims graded and bounded, with verified findings separated from inference?

# Claim Boundaries

- Claims must be restricted to the system class, symmetry, dimensionality, and regime studied.
- Do not generalize single-system or single-protocol results to domain consensus.
- Distinguish "verified by current data," "supported by model inference," and "analogical speculation."
- State model approximations (e.g., mean-field, low-energy, linear response) that limit claim validity.

# Failure Modes

- **Hypothesis failure**: Predicted signature absent under valid test conditions; hypothesis falsified.
- **Control failure**: Negative control shows target signal or positive control fails; diagnostic or model pipeline is flawed.
- **Degeneracy failure**: Two or more mechanisms produce indistinguishable signatures within uncertainty; need stronger discriminator.
- **Confounder dominance**: Background, drift, disorder, calibration error, or sample heterogeneity explains the signal.
- **Extrapolation failure**: Conclusions applied outside validated parameter range or system class.
- **Operational overreach**: User requests unsafe executable parameters; workflow must refuse and revert to design logic.

# Validity Checks

- **Confounders**: List material defects, environmental drift, calibration bias, finite-size effects, and model approximations.
- **Reproducibility**: Require independent replication, version-controlled scripts, documented random seeds, and raw data retention.
- **Statistical validity**: Pre-register primary metrics; report uncertainties, confidence intervals, and model comparison metrics; avoid p-hacking or selective reporting.
- **Cross-channel consistency**: Demand that independent diagnostics or model layers agree on the same structural/dynamical trend.
- **Model robustness**: Check sensitivity to initial conditions, grid size, disorder realizations, truncation, or functional choices.
- **Baseline deviation**: Compare every local or response metric against a simple interpolation or null baseline.
- **Extrapolation audit**: Verify that generalizations to other materials, dimensions, or operating regimes are explicitly labeled as unverified.

# Provenance

- Synthesized from cluster 131, subcluster 131.0.
- Source skills referenced for pattern extraction: solid-solution-local-structure-exploration, inertial-fusion-implosion-uniformity-exploration, quantum-dot-charge-sensing-research-workflow, layered-oxide-ferromagnetic-metal-exploration, electron-beam-quantum-interference-research-workflow, noncommutative-weak-measurement-research, semiconductor-nuclear-spin-exploration, quantum-geometric-optical-probe-workflow.
- No paper-specific conclusions, numerical results, or operational protocols are carried into the reusable workflow body.
