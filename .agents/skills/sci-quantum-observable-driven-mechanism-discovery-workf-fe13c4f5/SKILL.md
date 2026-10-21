---
name: sci-quantum-observable-driven-mechanism-discovery-workf-fe13c4f5
description: A reusable research-planning workflow for generating, discriminating, and validating candidate mechanisms behind anomalous transport, thermal, quantum, or diffusion observables through controlled model hierarchies and iterative evidence integration.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 14"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents in turning an unexplained or anomalous observable into a structured, uncertainty-aware research plan that discriminates among competing mechanisms using hierarchical controls, scaling diagnostics, and iterative model refinement. The workflow is designed for transport, thermal, quantum, and condensed-matter domains where microscopic rules, hidden states, or multiscale couplings may drive macroscopic behavior.

# When to use

Use this skill when the user asks to:

- Explain an unexpected signal in transport, diffusion, thermal conduction, quantum correlation, or energy-dissipation observables.
- Compare discrete, stochastic, continuum, or idealized model predictions against each other or against reference data.
- Design validation studies that isolate a candidate mechanism from numerical artifacts, boundary effects, finite-size regularization, or hidden state variables.
- Iterate between hypothesis generation, minimal model testing, and robustness checking.

Do not use this skill for operational experimental protocols, hazardous material handling, or as a substitute for domain-specific safety review.

# Inputs required

Before planning, collect or infer:

- **Target observable and regime**: the quantity to explain and the relevant scale, temperature, frequency, or energy window.
- **Baseline model**: the established description and its known simplifying assumptions.
- **Candidate mechanisms**: suspected hidden couplings, states, damping channels, or feedback loops.
- **Available evidence**: analytical results, simulation outputs, experimental literature, or benchmark datasets.
- **Constraints**: computational budget, safety/ethics limits, measurement resolution, and acceptable uncertainty.
- **Assumption profile**: current idealizations such as locality, equilibrium, linearity, Markovianity, or homogeneous boundaries.

If key inputs are missing, state assumptions explicitly and label the resulting hypotheses accordingly.

# Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Gap Audit & Observable Decomposition**
   - Decompose the target observable into candidate channels or components.
   - Identify the simplifying-assumption gap in the baseline model.
   - **Gate G1 (Reproducibility):** Is the anomaly larger than combined numerical, statistical, and systematic uncertainty? If no, stop and refine the baseline.

2. **Mechanistic Hypothesis Generation**
   - Formulate 3–5 competing hypotheses: mechanism, artifact, regime, boundary, and mimic.
   - Annotate each with evidence strength, key assumptions, predicted signatures, and failure modes.
   - **Gate G2 (Falsifiability):** Can at least one hypothesis be ruled out with available tools? If no, reformulate or acquire new capabilities.

3. **Model Ladder & Control Design**
   - Construct a hierarchy: baseline, mechanism-isolated, combined, and independent reference.
   - Define strong controls: positive, negative, baseline, robustness, geometry/boundary.
   - Specify independent, dependent, and nuisance variables.
   - **Gate G3 (Isolation):** Does the ladder vary only the intended mechanism? If no, redesign to remove confounding differences.

4. **Scaling & Diagnostic Execution**
   - Execute low-complexity or asymptotic scaling tests before full predictions.
   - Quantify sensitivity to regularization, finite size, smoothing, and boundary conditions.
   - Compare model classes under matched assumptions.
   - **Gate G4 (Control Sanity):** Do baseline and controls behave as expected? If no, debug and halt.

5. **Mechanism Discrimination & Evidence Integration**
   - Evaluate outcomes against the hypothesis table and independent benchmarks.
   - Classify each hypothesis as supported, weakened, or inconclusive.
   - **Gate G5 (Robustness):** Does the leading mechanism survive parameter perturbation and alternative implementations? If no, downgrade or exclude.

6. **Claim Bounding & Iteration Decision**
   - Bound conclusions by evidence type and regime of applicability.
   - Decide: advance to stronger validation, redesign to break degeneracy, or stop.
   - **Iteration:** Return to Step 2 or 3 with refined hypotheses.
   - **Stop Conditions:** Mechanism cannot be isolated; uncertainty exceeds effect size; conclusions require unverified assumptions; no candidates survive Gate G5.

# Output Format

When using this skill, produce:

1. **Research question and gap statement** — concise framing of the anomaly and the baseline limitation.
2. **Hypothesis table** — columns: hypothesis, mechanism class, evidence strength, key assumptions, predicted signature, failure modes, minimum viable test.
3. **Model ladder and control plan** — baseline, isolated mechanisms, combined model, reference; controls and stop conditions.
4. **Analysis plan** — scaling tests, channel decomposition, uncertainty quantification, robustness checks.
5. **Iteration roadmap** — update rules, next inquiry, conditions for advancing, redesigning, or stopping.
6. **Validity and claim-boundary statement** — confounders, regime limits, reproducibility checks, and what must not be inferred.

# Validation Gates

- **Reproducibility Gate:** The anomaly exceeds combined numerical, statistical, and systematic uncertainty before mechanistic interpretation.
- **Falsifiability Gate:** The proposed study can rule out at least one competing hypothesis with available resources.
- **Isolation Gate:** The model ladder varies only the intended mechanism; confounding differences are documented and minimized.
- **Control Sanity Gate:** Baseline and positive/negative controls reproduce expected behavior before mechanism variants are interpreted.
- **Robustness Gate:** Conclusions hold under parameter perturbation, alternative implementations, and boundary changes.
- **Convergence Gate:** Numerical or statistical outputs converge within tolerance before mechanistic claims are made.

# Claim Boundaries

- Distinguish model-supported, simulation-supported, empirically supported, and independently replicated claims.
- Limit conclusions to the tested regime, system class, and assumption set.
- Do not extrapolate from finite-size, discrete, or idealized models to macroscopic or operational predictions without explicit validation.
- Separate paper-derived evidence, background literature, and newly inferred hypotheses.

# Failure Modes

- **Artifact Mimicry:** Apparent agreement arises from finite-size cutoffs, smoothing, boundary effects, or numerical regularization rather than the proposed mechanism.
- **Hidden State/Variable:** A latent variable drives the observable but is omitted from the coarse-grained or averaged model.
- **Metric Mismatch:** The chosen figure of merit hides the relevant mechanism or ranks models differently than an operational metric would.
- **Regime Overreach:** Conclusions derived in one scale, temperature, or frequency window are applied outside the validated domain.
- **Degeneracy Persistence:** Multiple mechanisms remain consistent with data after controls, preventing unique discrimination.
- **Unverified Input Transfer:** High-fidelity parameters or sub-models are used in larger-scale simulations without independent justification.

# Validity Checks

- **Confounding:** Could boundaries, initial conditions, sampling bias, or discretization explain the effect?
- **Closure/Consistency:** Is the reduced model mathematically closed and internally consistent under the stated assumptions?
- **Channel Separation:** Are distinct transport or correlation channels distinguishable in the analysis?
- **Statistical/Numerical Validity:** Are uncertainty, convergence, and sampling adequate for the claim?
- **Benchmark Integrity:** Are comparisons made against independent evidence and appropriate controls?
- **External Validity:** Does the mechanism plausibly transfer to the target system, or is it architecture-specific?
- **Assumption Audit:** Are independence, orthogonality, stability, locality, or equilibrium assumptions justified?

# Provenance

- Synthesized from cluster 53.0 (observable-driven mechanism discovery and validation).
- Source skill references: active-random-walk-modeling; robust-materials-discovery-agent; quantum-error-correction-exploration; glass-thermal-transport-research-workflow; radiation-cascade-electronic-effects; hydro-mechanical-failure-exploration; quantum-correlation-structure-discovery; fluctuation-observable-research-design.
- Paper-specific conclusions, numerical results, and operational protocols have been excluded.
