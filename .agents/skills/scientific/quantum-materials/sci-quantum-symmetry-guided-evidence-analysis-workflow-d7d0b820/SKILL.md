---
name: sci-quantum-symmetry-guided-evidence-analysis-workflow-d7d0b820
description: A reusable end-to-end workflow for generating competing hypotheses, designing symmetry-aware validation plans, and auditing evidence claims in quantum and condensed-matter research contexts.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided evidence analysis workflow 6"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent transform an ambiguous observation, theoretical puzzle, or robustness question into a structured, auditable research program. The skill teaches a reusable pattern: define the gap between expectation and observation; generate competing mechanistic hypotheses; design minimal validation with layered controls; analyze evidence through symmetry constraints and model ablation; bound claims by evidence grade; and iterate based on diagnostic outcomes.

# When to use

Use this skill when the user asks to:

- Propose research questions or hypotheses for systems with hidden states, competing mechanisms, symmetry-dependent transitions, or proxy-dependent observables.
- Design validation plans where a measured signature may not directly track an underlying variable.
- Audit whether a claimed phase, transition, spectral feature, or mechanism is supported by orthogonal evidence or vulnerable to confounders.
- Iterate after conflicting results from different methods, observables, approximations, or system sizes.
- Assess robustness, threshold behavior, or crossover regimes under controlled perturbations.

Do not use this skill for operational laboratory protocols, clinical interpretation, materials synthesis recipes, device fabrication instructions, or any task requiring hazardous procedural details.

# Inputs required

Before producing a research plan, collect or infer:

- **Target system:** degrees of freedom, geometry, dimensionality, and relevant constraints (qualitative description only).
- **Observable puzzle or claim:** the measured feature, anomaly, or theoretical prediction to be tested.
- **Available controls and tuning variables:** external or internal parameters that can be varied independently.
- **Known symmetries and conservation laws:** exact, approximate, spatial, internal, or emergent symmetries that constrain allowed mechanisms.
- **Existing evidence:** which parts are established for the target system and which are extrapolated from analogies.
- **Feasible observables and methods:** direct measurements, proxies, numerical tools, or effective-model diagnostics.
- **Limitations:** finite-size bounds, sampling constraints, approximation regimes, or safety boundaries.

If any input is missing, state the assumption explicitly, mark the affected evidence strength as lower, and design the minimal validation needed to test it.

# Core Workflow

Follow the ordered route below. Treat each gate as a hard decision point; do not proceed past a failed gate without redesign.

## 1. Frame the puzzle and baseline

- State the observable anomaly or claim in the form of a concise research question.
- Identify the simplest model that should explain the observation in the unperturbed or idealized limit.
- Articulate the gap: what expectation is violated, and why the answer is nontrivial.
- **Gate 1 — Baseline validity:** If the unperturbed system does not reproduce known behavior, repair the baseline model or observable definitions before adding complexity.

## 2. Generate competing hypotheses

Produce at least three falsifiable hypotheses:

1. **Baseline / structure-driven hypothesis:** The observed behavior follows from the idealized model or symmetry-protected structure.
2. **Perturbation / mechanism hypothesis:** A specific coupling, transition, or symmetry change produces the anomaly.
3. **Confounder / artifact hypothesis:** The anomaly arises from finite-size effects, disorder, background, proxy ambiguity, sampling bias, or an uncontrolled nuisance variable.

For each hypothesis, record:
- Evidence strength (strong, moderate, weak, speculative, or refuted).
- Key assumptions.
- Predicted signatures across multiple observables.
- Likely failure modes.
- Minimal viable test.
- Extrapolation boundary.

**Gate 2 — Falsifiability:** If the hypotheses predict identical observables under all accessible controls, redesign the measurement plan or tuning variables until they are distinguishable.

## 3. Design minimal validation

Define the smallest experiment or analysis that can reject at least one hypothesis:

- **Independent variables:** tuning axes that are physically interpretable and monotonic where possible.
- **Dependent variables:** primary observable and at least one orthogonal secondary observable.
- **Controls:**
  - *Baseline control:* unperturbed or idealized limit.
  - *Positive control:* known regime where the modeling framework reproduces an established result.
  - *Negative control:* regime where the proposed mechanism is symmetry-forbidden or disabled.
  - *Specificity control:* similar system or parameter set where the coupling is weakened or absent.
  - *Robustness control:* boundary variation, disorder, finite-size check, or alternative method.
- **Success and failure criteria:** quantitative or qualitative thresholds that must be met.
- **Stop conditions:** criteria that trigger redesign or termination (e.g., baseline model fails, controls are inconclusive, or the system enters an unmodeled regime).

**Gate 3 — Control isolation:** If the proposed mechanism cannot be isolated from confounders using the available controls, add an orthogonal probe or narrow the claim scope.

## 4. Apply symmetry and model constraints

- List exact and approximate symmetries; mark any symmetry that is explicitly broken by hypothesis.
- Identify allowed couplings, selection rules, and forbidden transitions.
- Build the minimal model consistent with these constraints.
- Derive protected structures, null-transition conditions, or threshold criteria analytically where possible, rather than relying solely on numerical observation.
- **Gate 4 — Symmetry consistency:** If the mechanism requires an idealized symmetry not protected by the target system, downgrade the evidence strength and redesign the robustness controls.

## 5. Analyze evidence

- Inspect raw observables before assigning physical meaning.
- Reproduce baseline qualitative behavior.
- Track how observables change along the tuning axis.
- Compare competing scaling forms, models, or universality classes before selecting one.
- Cross-validate: require alignment between direct observables, correlation or coherence-length estimates, finite-size trends, and effective-model predictions.
- Perform model ablation: remove one mechanism at a time and record which observables fail.
- Check proxy validity: confirm the observable tracks the hidden variable rather than an artifact.
- **Gate 5 — Cross-validation:** If only one observable or one method supports the hypothesis, label the claim as partial evidence and do not generalize.

## 6. Grade evidence and bound claims

- Assign an evidence grade:
  - *Analytic:* derived from symmetry, algebra, or exact constraints.
  - *Numerical:* supported by simulations with reported convergence and boundary checks.
  - *Mechanistic:* linked to a clear suppression or protection mechanism.
  - *Task-level:* demonstrated for the intended operation, not only a single metric.
  - *Extrapolated:* inferred for a new system, size, or regime without direct validation.
- State the claim boundary: regime of validity, geometry, dimension, symmetry, perturbation class, and interaction strength.
- Separate exact results, controlled approximations, and speculation.
- **Gate 6 — Claim proportionality:** Ensure the conclusion does not exceed the evidence grade (e.g., do not treat a single-model result as field-wide consensus).

## 7. Iterate or terminate

- **Supported:** Multiple orthogonal observables and controls align. Propose a stronger independent test or the next discriminator experiment.
- **Partially supported:** Qualitative behavior fits, but key parameters remain unconstrained. Design the experiment that most directly constrains the weakest parameter.
- **Weakened:** An alternative model explains the data better. Return to Step 2 and generate new hypotheses that incorporate the competing explanation.
- **Rejected:** The prediction fails under a targeted control. Convert the negative result into a constraint on the mechanism and return to Step 2.
- **Boundary-limited:** The system likely requires a more microscopic model, different quasiparticles, or additional physics. State the boundary explicitly and stop.

**Hard stop conditions:**
- The baseline model is invalid.
- Observables conflict and cannot be reconciled by any hypothesis.
- Controls fail to isolate the mechanism.
- The system enters a regime where the reduced model is known to break down.
- The claim would require unsupported extrapolation beyond the validated boundary.

# Output Format

When using this skill, produce the following structure:

1. **Research question and gap**
   - Concise question.
   - Target system.
   - Why the answer is nontrivial.

2. **Hypothesis table**
   - Claim.
   - Type (baseline, perturbation, confounder, etc.).
   - Evidence strength.
   - Key assumptions.
   - Predicted signatures.
   - Likely failure modes.
   - Validity boundary.

3. **Validation plan**
   - Independent and dependent variables.
   - Baseline, positive, negative, specificity, and robustness controls.
   - Evaluation metrics.
   - Stop conditions.

4. **Analysis plan**
   - Baseline reproduction steps.
   - Symmetry and minimal-model constraints.
   - Cross-validation strategy.
   - Ablation and alternative-model comparison.
   - Proxy-validity checks.

5. **Iteration decision**
   - Outcome classification (supported / partially supported / weakened / rejected / boundary-limited).
   - Reason.
   - Next discriminator experiment or redesign action.

6. **Validity and claim-boundary statement**
   - Main confounders.
   - Extrapolation limits.
   - Reproducibility requirements.
   - Safety and ethics constraints.

# Validation Gates

Before accepting any claim, confirm:

- **Baseline gate:** The unperturbed or idealized limit reproduces known behavior.
- **Observable gate:** Each observable measures the claimed mechanism rather than an artifact, background, or unrelated state.
- **Control gate:** Positive, negative, and specificity controls are defined and produce qualitatively distinct outcomes.
- **Cross-validation gate:** At least two independent observables, methods, or symmetry sectors align.
- **Scaling gate:** Competing scaling forms, models, or universality classes have been compared and justified.
- **Regime gate:** Effective models and approximations are used only within their stated validity boundaries.
- **Consensus gate:** Claims are framed as evidence for the target system, not as field-wide consensus from a single precedent.

# Claim Boundaries

- **Supported:** Multiple orthogonal observables and controls align; analytic or strong numerical evidence exists; the mechanism is linked to a clear symmetry or protection argument.
- **Partially supported:** Qualitative behavior is consistent, but key parameters are unconstrained or only one diagnostic is available.
- **Speculative:** The mechanism is plausible by analogy or extrapolation but lacks direct validation in the target system.
- **Out of scope:** Claims about fabrication parameters, operational protocols, clinical relevance, biological impact, or universal behavior beyond the studied regime are not permitted.

# Failure Modes

- **Hypothesis failure:** A mechanism explains one observable while contradicting another, or requires inconsistent parameters across datasets.
- **Proxy failure:** The primary observable tracks an artifact, background, or nuisance variable rather than the hidden state or mechanism.
- **Control failure:** Negative or specificity controls produce the same signature as the proposed mechanism, indicating poor isolation.
- **Model failure:** The minimal model requires terms that violate symmetry, lack physical justification, or rely on unsupported approximations.
- **Finite-sample or finite-size failure:** Thresholds, transitions, or critical behavior drift strongly with system size, sampling density, or disorder realizations.
- **Extrapolation failure:** Conclusions are applied outside the validated regime of geometry, dimension, symmetry, perturbation class, or interaction strength.

# Validity Checks

- **Confounding assignment:** Could the measured feature arise from a different state, defect, disorder, background, or instrumental artifact?
- **Proxy validity:** Does the observable directly track the hidden variable, or does it require unvalidated model calibration?
- **Parameter identifiability:** Are fitted rates, energy shifts, or coupling strengths constrained by independent data, or are they absorbing noise?
- **Symmetry consistency:** Do opposite channels, field signs, or symmetry-equivalent sectors follow the expected behavior?
- **Environmental confounding:** Could nuisance variables such as temperature drift, strain, screening, or density changes explain the same trend?
- **Finite-size and sampling:** Are thresholds, correlation lengths, and convergence checks stable across accessible scales?
- **Methodological separation:** Are exact results, controlled approximations, numerical observations, and speculations clearly labeled?
- **Reproducibility:** Are assumptions, fixed parameters, fitted parameters, ablation results, and failed searches reported?

# Provenance

Synthesized from cluster 219.0 (quantum-transport-nonequilibrium-spectroscopy-evidence-analysis). Derived from source skills: b6ce515b866d0934, 4851c9387ae710f1, ef61f038d0fe11d7, 19bbfa51f695e926, aad47b81b6d673e0, f3a7bf5f47dd099c, 792c457525cd15db, 002ac17ed3b0f4c1. Paper-specific systems, materials, parameters, numerical results, and operational protocols have been abstracted into this reusable workflow structure.
