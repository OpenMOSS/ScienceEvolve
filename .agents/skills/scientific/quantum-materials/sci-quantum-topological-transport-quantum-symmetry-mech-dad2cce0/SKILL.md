---
name: sci-quantum-topological-transport-quantum-symmetry-mech-dad2cce0
description: A reusable end-to-end workflow for generating, validating, and iterating symmetry-guided mechanism hypotheses in quantum, topological, transport, and wave systems.
scienceevolve-title: "Quantum materials and condensed matter · topological transport quantum symmetry mechanism discovery"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill guides an agent through a disciplined, end-to-end research workflow for discovering and validating mechanisms protected or enabled by symmetry, topology, or non-Hermitian structure. It abstracts the common logic across quantum, condensed-matter, and classical-wave domains: start from an observable gap, build a minimal effective model, generate falsifiable hypotheses, design controlled validation, and iterate based on converging evidence. The workflow treats no single source as field-wide consensus and keeps claims bounded by the evidence chain.

## When to use

Use this skill when the user asks to:
- Propose or evaluate research questions involving symmetry-protected phases, topological transitions, non-Hermitian spectral features, or correlation structures in quantum, transport, or wave systems.
- Move from a theoretical effective model to a minimal viable validation plan (computational or conceptual).
- Design studies that combine reduced Hamiltonian reasoning, numerical simulation, spectroscopic or transport response, and boundary-state or probe-based validation.
- Update a mechanism hypothesis after mismatch between model predictions, simulated signatures, or control comparisons.

Do not use this skill as a substitute for domain-specific safety review, fabrication approval, or operational laboratory protocol authorization.

## Inputs required

Request or infer as many of the following as available; proceed with explicitly labeled minimal-model assumptions if inputs are missing:

- **Target platform class**: quantum device, condensed-matter heterostructure, photonic/acoustic/phononic lattice, or other structured medium.
- **Candidate mechanism**: symmetry breaking, topological invariant change, non-Hermitian coupling, proximity effect, or correlation channel under investigation.
- **Effective-model ingredients**: degrees of freedom, relevant symmetries, boundary conditions, and dominant energy scales.
- **Tunable controls**: coupling asymmetry, detuning, phase bias, disorder, loss/gain balance, boundary termination, or symmetry-breaking perturbations.
- **Candidate observables**: spectral functions, response coefficients, correlation functions, transport signatures, boundary localization, or phase-resolved amplitudes.
- **Constraints**: finite-size effects, temperature, interactions, disorder, measurement resolution, numerical broadening, and calibration limits.
- **Objective**: hypothesis generation, minimal validation design, control critique, model revision, or gap analysis.

## Core Workflow

Follow this ordered route. Treat each numbered step as a gate; do not advance until the gate condition is satisfied or explicitly waived with a documented risk.

### 1. Frame the gap and mechanism class
State the observable or conceptual gap: what established explanation is incomplete, and what symmetry or topology mechanism could fill it.  
**Gate**: Confirm the question is about a mechanism that can be linked to explicit symmetry operations, topological invariants, or non-Hermitian structure. If not, stop and reformulate.

### 2. Build a minimal effective model and symmetry map
Define the smallest model that retains the proposed mechanism. List preserved and broken symmetries. Map model ingredients to platform variables (e.g., coupling pathways, sublattice structure, boundary orientation, loss channels).  
**Gate**: Verify the model is solvable or simulable and that the mechanism-defining symmetry is explicitly represented. If the model requires unsupported microscopic details, label it speculative.

### 3. Generate ranked mechanism hypotheses
For each candidate mechanism, produce:
- **Claim**: the predicted feature or response.
- **Rationale**: how the symmetry/topology/coupling structure creates it.
- **Evidence strength**: high, moderate, low, or speculative.
- **Key assumptions**: minimal conditions for the mechanism to hold.
- **Failure modes**: how the claim could fail without invalidating the broader direction.
- **Discriminating test**: the smallest control or observable that can falsify the claim.  
**Gate**: Every hypothesis must predict different outcomes under at least two distinct controls. If not, refine the model or stop.

### 4. Design minimal viable validation (MVV)
Specify:
- **Primary observable**: directly tied to the mechanism.
- **Secondary contrast observable**: orthogonal or complementary channel.
- **Independent variables**: coupling, detuning, symmetry-breaking field, loss/gain balance, boundary condition, or disorder level.
- **Control matrix**:
  - *Negative control*: mechanism absent, generic background preserved.
  - *Positive control*: known regime where a comparable signature appears.
  - *Symmetry-breaking control*: protecting symmetry removed to test robustness.
  - *Null-model control*: closest system without the target coupling or symmetry term.
- **Stop conditions**: predefined criteria for downgrading or rejecting the hypothesis.  
**Gate**: Confirm that the planned controls can distinguish the target mechanism from generic dissipation, finite-size effects, numerical artifacts, or trivial alternatives. If not, redesign before execution.

### 5. Execute analysis, simulation, or measurement concept
Compute or conceptually evaluate the primary and secondary observables across the control matrix. Document numerical convergence, discretization, finite-size scaling, calibration, and normalization choices.  
**Gate**: Check that the analysis reproduces known limits (e.g., clean, weak-coupling, or decoupled limits). If convergence or calibration checks fail, stop and fix methodology.

### 6. Compare against controls and cross-validate
Interpret results by comparing target and control systems first. Require agreement between at least two independent signatures (e.g., spectral + spatial, bulk + boundary, eigenmode + phase, local probe + host diagnostic) before accepting a mechanism.  
**Gate**: If the signature appears in negative controls, or if independent signatures disagree, downgrade the claim and proceed to iteration.

### 7. Assess robustness and map validity boundaries
Test sensitivity to perturbations: disorder, finite temperature, interaction strength, loss imbalance, finite-size variation, or basis ambiguity. Determine the regime where the claim survives and where it fails.  
**Gate**: If the signature disappears under small, physically plausible perturbations that should preserve the mechanism, restrict the claim to the surviving regime or reject the hypothesis.

### 8. Iterate or terminate
- **Confirm**: If the signature survives controls and robustness checks, strengthen evidence strength and propose generalization tests.
- **Refine**: If the signature is present but narrow or model-dependent, restate the hypothesis as symmetry-protected or regime-specific and add targeted perturbation tests.
- **Split**: If multiple mechanisms contribute, separate their predicted signatures with additional controls.
- **Downgrade**: If evidence is single-channel or control-limited, label as tentative and require independent corroboration.
- **Reject**: If a necessary control contradicts the mechanism, document the failure mode and return to Step 3 or Step 1.  
**Stop conditions** (terminate and do not advance):
- The signature appears in negative controls without the mechanism.
- The null model reproduces the signature.
- The observable definition is ill-posed for the open or effective system.
- Convergence, normalization, or positivity checks fail.
- The claim requires extrapolation beyond the validated model regime.

## Output Format

Produce a structured research plan containing:

1. **Research question and gap** — concise statement of the target feature and why current understanding is insufficient.
2. **Candidate mechanisms** — list with reduced-model ingredients, platform mapping, predicted primary/secondary signatures, and evidence strength.
3. **Hypotheses table** — columns: hypothesis, mechanism, evidence strength, key assumptions, likely failure mode, discriminating test.
4. **Minimal viable validation plan** — independent variables, control matrix, primary/secondary observables, evaluation metrics, and stop conditions.
5. **Analysis plan** — model checks, convergence criteria, signature-detection rules, control-comparison protocol, and uncertainty handling.
6. **Iteration plan** — rules for confirming, refining, splitting, downgrading, or rejecting the hypothesis under each likely result.
7. **Validity and boundary statement** — confounders, reproducibility requirements, regime limits, and safety/expert-review flags.

## Validation Gates

Before advancing past each major stage, verify:

- **Symmetry validity**: The protecting or broken symmetries are stated explicitly and checked in the effective description.
- **Observable validity**: The chosen response is well-defined for the model or platform (e.g., valid for open systems, non-Hermitian descriptions, or reduced density matrices).
- **Control validity**: The signature can be distinguished from generic dissipation, broadening, asymmetry, finite-size effects, or basis artifacts.
- **Convergence validity**: Numerical broadening, discretization, fitting windows, and sampling choices are reported and stable.
- **Evidence-separation validity**: Paper-supported patterns, literature-backed analogies, and new-agent inferences are explicitly labeled and not conflated.

## Claim Boundaries

- Distinguish **“the model predicts”** from **“the platform realizes”**; never present a minimal-model result as proof of universal behavior.
- Distinguish **paper-supported mechanisms** from **agent-inferred extensions** and **speculative applications**.
- Do not treat a single source paper or simulation as field-wide consensus; require independent corroboration for broader claims.
- Limit conclusions to the tested regime of parameter space, boundary conditions, disorder level, and temperature or energy scale.

## Failure Modes

Common ways this workflow fails or produces false positives:

- **Control failure**: The signature appears in systems lacking the proposed mechanism.
- **Basis ambiguity**: The observable depends on a mathematically convenient but physically unmeasurable basis.
- **Hybridization masking**: Opposite tendencies in different channels cancel or hide the true mechanism before decomposition.
- **Numerical artifact**: Broadening, discretization, truncation, or retrieval choices create apparent features.
- **Overextrapolation**: Claims extend beyond the validated model regime or assume ideal materials/interfaces without evidence.
- **Probe-induced reconstruction**: Local probes or impurities alter the host state, confounding host-mechanism inference.
- **Single-channel overreach**: A spectral dip, phase jump, or fitted parameter is interpreted without cross-validation from independent observables.

## Validity Checks

Before finalizing any research plan or claim, check:

- **Confounding**: Could omitted couplings, interactions, disorder, finite size, boundary artifacts, excitation bias, or preprocessing explain the result?
- **Reproducibility**: Are model assumptions, symmetry assignments, subsystem definitions, normalization rules, feature-detection criteria, and analysis scripts documented for independent replication?
- **Statistical and numerical validity**: Are uncertainties, repeated runs, sampling convergence, and sensitivity to inferred parameters reported?
- **Boundary conditions**: Are extrapolation limits stated (e.g., strong interactions, high temperature, reduced dimensionality, nonlocal measurements)?
- **Measurement specificity**: Does the proposed observable distinguish the target mechanism from conventional alternatives?
- **Basis and metric validity**: Are correlation, entanglement, or topological measures applied only to valid reduced states and interpreted within their assumptions?
- **Claim discipline**: Are source-paper mechanisms separated from new-agent extrapolations?

## Provenance

- **Cluster**: 1 / 1.0 — symmetry-guided mechanism discovery and validation
- **Source skills**: nonhermitian-open-quantum-signature-design (19e547c82fe98714); topological-wave-research-workflow (0b0d1cc4b62fe100); rashba-quantum-correlation-exploration (a8ae12509a3b884a); pseudo-ising-proximity-superconductivity-exploration (ce7017fd4225a832); probe-effective-landscape-topological-chains (arxiv-cmoat__2606.21499); anti-pt-hybrid-wave-workflow (495502c0ac7ad663); passive-nonhermitian-acoustic-skin-effect-exploration (6b1d418153900f99); ultrafast-coherence-research-workflow (64188b12253d47bb).
