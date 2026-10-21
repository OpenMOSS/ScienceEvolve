---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-980d0a29
description: Reusable end-to-end workflow for symmetry-guided hypothesis generation, multi-modal validation, and iterative mechanism discrimination in quantum and correlated materials.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 75"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide an agent to discover and validate candidate mechanisms in quantum, topological, and correlated materials by leveraging symmetry as a primary discriminator. The workflow structures gap-driven question formation, competing-hypothesis generation, falsification-oriented validation design, multi-modal analysis, and iterative refinement while enforcing strict claim boundaries.

## When to use

Use this skill when:

- A material exhibits competing collective mechanisms and symmetry-resolved data could discriminate among them.
- Existing momentum-, energy-, symmetry-, or real-space evidence is incomplete or interpreted differently across studies.
- The task is to propose a research direction, hypothesis set, measurement logic, controls, analysis plan, or iteration strategy rather than to execute an experiment.
- Collective order, lattice distortion, band reconstruction, or topological response must be linked to observable spectral, transport, or thermodynamic signatures.

## Inputs required

Ask for or identify:

- Target material class, crystallographic or topological setting, and relevant phase diagram variables.
- Known or suspected ordered phases and their symmetry properties.
- Available or planned probes and their selection rules or symmetry sensitivities.
- Electronic structure inputs: band topology, orbital character, response kernels, or model assumptions.
- Data status: raw data availability, calibration metadata, background contributions, and sample-quality indicators.
- Scientific target: mechanism discrimination, orbital assignment, phase boundary, coupling identification, or topological validation.
- Constraints: sample availability, computational resources, facility limitations, and reproducibility requirements.

## Core Workflow

1. **Frame the mechanistic gap.** Identify the unresolved assignment, competing explanations, and the specific symmetry or observable regime where evidence is weakest.
   - *Decision gate:* Proceed only if the gap can be addressed by observable discrimination; otherwise reformulate the question.

2. **Generate competing symmetry-based hypotheses.** For each candidate mechanism, derive symmetry selection rules and predict which channels should change, remain inactive, or correlate across observables. Rank by evidence strength and record assumptions, predicted positive/null signatures, and failure modes.
   - *Stop condition:* If no observable can distinguish the hypotheses, redesign the question or required probes before continuing.

3. **Design a falsification matrix.** Define primary variables, symmetry variables, strong controls (same system across regimes), negative controls (inactive channels or reference configurations), and positive controls (benchmark behavior). Predefine evaluation metrics and stop conditions.
   - *Decision gate:* Confirm the design can reject at least one hypothesis; if not, add orthogonal observables or controls.

4. **Acquire and preprocess multi-modal data.** Record metadata, calibration, and background handling uniformly. Flag saturated, unstable, or artifact-dominated data.
   - *Stop condition:* Halt if sample quality, orientation, calibration, or structural symmetry assignment is ambiguous.

5. **Decompose by symmetry and channel.** Map geometries or models to symmetry contents; decompose responses into channel-resolved contributions. Check for leakage, contamination, or accidental cancellation.
   - *Decision gate:* If decomposition is ambiguous, seek orthogonal observables or revise symmetry assumptions.

6. **Compare observations to predictions.** Build differential signatures between regimes. Falsify candidates whose predicted symmetry hierarchies, inactive channels, or complementary-probe implications conflict with data.
   - *Decision gate:* If multiple hypotheses remain viable, classify as ambiguous and plan a discriminating extension rather than forcing a conclusion.

7. **Triangulate with independent constraints.** Require consistency with structural, transport, thermodynamic, magnetic, or theoretical bounds. Quantify uncertainty and separate direct observations from model inferences.
   - *Stop condition:* Do not advance to claim formation if independent constraints contradict the leading hypothesis.

8. **Evaluate evidence and update hypotheses.** Classify the outcome as Supported, Ambiguous, Contradicted, or Artifact-prone. Update evidence strength and boundary conditions.
   - *Iteration:* If Supported, test boundary conditions. If Ambiguous, return to Step 3 with an orthogonal probe. If Contradicted or Artifact-prone, return to Step 2 to revise or reject the hypothesis. Terminate only when the question is resolved or declared intractable.

9. **Document claim boundaries and archive.** State verified observations, inferred mechanisms, and speculative extensions. Record the audit trail linking hypotheses to predictions, observations, and sensitivity checks.

## Output Format

When using this skill, return:

1. **Research question:** a concise, falsifiable mechanism question.
2. **Evidence map:** what is known, disputed, inferred, and missing.
3. **Hypotheses:** a ranked table with evidence strength, key assumptions, predicted positive/null signatures, and likely failure modes.
4. **Validation design:** primary variables, symmetry variables, strong controls, negative controls, positive controls, and stop conditions.
5. **Analysis plan:** preprocessing, symmetry decomposition, differential signatures, model comparison, and uncertainty handling.
6. **Evaluation metrics:** measurable criteria for supporting, weakening, or rejecting each hypothesis.
7. **Iteration plan:** next steps for positive, null, ambiguous, or artifact-like outcomes.
8. **Validity statement:** confounders, reproducibility risks, statistical limits, and boundary conditions.

## Validation Gates

- **Gap falsifiability:** The question must admit observable discrimination among candidates.
- **Mechanism specificity:** The design must distinguish the leading hypothesis from at least one plausible alternative.
- **Control adequacy:** Strong, negative, and positive controls are defined before data collection or simulation.
- **Symmetry validity:** Selection rules map correctly to the assumed structural or topological symmetry.
- **Triangulation:** Independent constraints are identified before claim formation.
- **Uncertainty propagation:** Measurement and model uncertainty are reported for all inferred quantities.
- **Reproducibility:** Metadata and analysis steps are documented enough for conceptual repetition.

## Claim Boundaries

- Distinguish verified observations from model-inferred mechanisms and speculative extensions.
- Do not generalize from one material or device to an entire class without boundary-condition tests.
- Treat source studies as evidence for reasoning patterns, not as proof of universality.
- Avoid presenting symmetry-allowed responses as automatically large or experimentally accessible.
- Separate equilibrium or closed-system predictions from open-driven or nonequilibrium claims.

## Failure Modes

- **Non-identifiable mechanisms:** two or more hypotheses predict identical observables under the tested conditions.
- **Artifact dominance:** substrate, background, instrumental drift, or sample inhomogeneity explains the signal.
- **Symmetry misassignment:** incorrect point group, magnetic space group, or tensor symmetry leads to wrong selection rules.
- **Model bias:** the preferred hypothesis is supported only by post hoc fitting or cherry-picked windows.
- **Confounding order:** hidden phase coexistence, disorder, or glassy freezing mimics the target mechanism.
- **Overextrapolation:** conclusions are transferred beyond the tested tuning range, dimensionality, or material family.

## Validity Checks

- **Confounding factors:** twinning, domain averaging, polarization leakage, strain, inhomogeneity, surface-bulk differences, thermal effects, and non-electronic backgrounds.
- **Reproducibility:** repeated measurements across independent samples, batches, or modeling seeds; raw metadata and analysis code preserved.
- **Statistical validity:** uncertainty propagation, predefined comparison regimes, avoidance of cherry-picked energy or momentum windows, and reporting of both positive and null channels.
- **Boundary conditions:** explicit limits on material class, phase regime, observable class, temperature, and tuning range.
- **Claim discipline:** clear separation of observations, inferences, and speculations; no elevation of single-study findings to field-wide consensus.

## Provenance

- Synthesized from cluster 173 (subcluster 173.0), workflow archetype: symmetry-guided mechanism discovery and validation.
- Source skills: layered-nickelate-raman-research-design (55d852b31b6b3896), thickness-dependent-thz-emission-workflow (d3cbc033b849edf4), quantum-hall-edge-transport-exploration (d9d93a2d7bc87e0b), altermagnetic-coupled-excitation-design (arxiv-cmoat__2606.11584), quantum-dot-spin-memory-workflow (365cb01fa57571e2), cdw-lattice-electronic-exploration (d4e3682109766c4c), symmetry-protected-spin-loop-exploration (1bcf4bfd32f92343), frustrated-spin-liquid-exploration (c208c813da892ef4).
