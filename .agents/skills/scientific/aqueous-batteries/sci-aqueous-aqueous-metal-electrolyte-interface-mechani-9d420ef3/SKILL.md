---
name: sci-aqueous-aqueous-metal-electrolyte-interface-mechani-9d420ef3
description: Reusable end-to-end workflow for designing research plans that discover and validate electrolyte-interface mechanisms in aqueous metal batteries, from failure-mode diagnosis through converging-evidence validation and iteration.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal electrolyte interface mechanism workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Transform an observed interfacial failure in aqueous metal batteries into a mechanism-aware, non-operational research plan. This skill guides hypothesis generation, controlled validation design, converging-evidence analysis, and iterative refinement without prescribing specific materials, operational protocols, or fabrication parameters.

# When to use

Use this skill when:

- Proposing new research questions or experimental directions around electrolyte regulation, interphase engineering, deposition control, or side-reaction suppression in aqueous metal batteries.
- A candidate additive, solvent, polymer, or interfacial strategy is expected to change solvation, speciation, transport, or interface stability.
- Converting an interface-failure observation into falsifiable hypotheses and validation plans.
- Evaluating whether an electrolyte-interface mechanism is supported by electrochemical and characterization evidence.
- Planning a minimal but mechanism-aware workflow before interpreting data or running experiments.

Do not use this skill as a substitute for domain-specific safety review, manufacturing validation, commercial feasibility assessment, or executable laboratory procedures.

# Inputs required

Before generating a plan, collect or infer:

- Target battery chemistry, electrode materials, and electrolyte class.
- Dominant interfacial failure mode (e.g., nonuniform deposition, corrosion, gas evolution, unstable interphase, poor reversibility).
- Current performance bottleneck and the metric that matters most.
- Candidate regulation strategy or molecular design idea, if any.
- Available characterization methods (electrochemical, microscopy, spectroscopy, impedance, modeling).
- Practical constraints (cost, scalability, toxicity, environmental impact, full-cell compatibility).
- Task type: exploratory hypothesis generation, experimental design, data interpretation, or literature-gap analysis.

If key inputs are missing, state assumptions explicitly and ask for clarification before finalizing a high-confidence plan.

# Core Workflow

1. **Scope and failure diagnosis**
   - Translate the observed bottleneck into measurable interfacial symptoms and candidate root causes.
   - Distinguish performance symptoms from mechanistic causes.
   - **Decision gate:** Stop if the failure mode is not interfacial or lacks a quantifiable symptom.

2. **Mechanism chain construction**
   - Build a causal chain from molecular regulation → local solvation/speciation → interface structure → ion transport/deposition behavior → cell-level metric.
   - Annotate each link as directly testable or inferred.
   - **Decision gate:** Reject chains that contain no falsifiable link; require at least one observable per hypothesis.

3. **Hypothesis generation and ranking**
   - Propose mechanism-level hypotheses (e.g., solvation-shell reconstruction, selective adsorption, interphase formation, field homogenization, side-reaction suppression).
   - For each hypothesis record: evidence strength, key assumptions, predicted molecular/interface/cell-level signals, likely failure modes, minimal validation test, and stop condition.
   - Rank by mechanistic clarity, falsifiability, and relevance to coupled electrode behavior.
   - **Decision gate:** Deprioritize hypotheses resting on a single untested assumption or lacking a discriminating prediction.

4. **Control-centric experimental design**
   - Define independent variables (regulator class, presence/absence of functional motif), dependent variables (morphology, reversibility, transport, full-cell metrics), and controlled variables (geometry, loading, protocol).
   - Assemble a control hierarchy: baseline electrolyte, matched inactive analogue, negative control (mechanism absent), positive/benchmark control (if available), and ablation control.
   - Structure validation hierarchy: screening → electrode-isolation (half-cell/symmetric) → mechanistic probes → device-relevance (full-cell).
   - Predefine success, rejection, and pause criteria.
   - **Decision gate:** Stop if controls cannot isolate the proposed mechanism from confounding effects.

5. **Standardized data acquisition and preprocessing**
   - Collect raw data with metadata; apply identical smoothing, normalization, endpoint selection, and outlier rules across all arms.
   - **Decision gate:** Pause if batch-to-batch variability exceeds measurement noise or if protocol deviations are discovered.

6. **Converging-evidence analysis**
   - Compare matched groups under identical reporting conventions.
   - Require at least two independent evidence streams (e.g., electrochemical + structural/spectroscopic) to support a mechanism claim.
   - Connect each metric to a specific link in the mechanism chain; label weak links as tentative.
   - Verify cross-level consistency (molecular evidence must not contradict cell-level trends; electrode-level improvement must not contradict full-cell behavior).
   - Assign evidence strength: Low (analogy only), Medium (performance without full mechanistic support), High (matched controls + reproducible improvement + independent mechanistic evidence), Extrapolated (outside tested system).
   - **Decision gate:** Downgrade or reject mechanism claims if converging evidence is missing or contradictory.

7. **Iteration and stop decision**
   - **Continue:** Reproducible improvement, matched controls, mechanistic probe support, and no critical secondary metric worsened → add orthogonal probes or test functional analogs.
   - **Modify:** Performance improves but mechanism is unclear; mechanism appears but performance is insufficient; unintended cross-electrode effects or tradeoffs emerge → redesign candidate or add targeted controls.
   - **Pause/Reject:** No reproducible improvement over baseline; improvement disappears under matched controls; mechanistic evidence contradicts the proposed pathway; severe instability or irreproducibility → record negative result as a boundary condition.
   - Update the hypothesis ledger and boundary statements.
   - **Decision gate:** Terminate the line of inquiry if stop conditions are met; pivot if the mechanism is plausible but the current material class has an unavoidable trade-off.

8. **Boundary setting and generalization control**
   - Explicitly separate: tested-system evidence, plausible but unverified extensions, future hypotheses, and unsupported extrapolations.
   - **Decision gate:** Block any claim that generalizes beyond the tested electrolyte class, electrode pairing, and device format.

# Output Format

Produce a structured research plan containing:

1. **Research question** — Target system, interfacial failure, and scientific significance.
2. **Gap and mechanism map** — Known or assumed failure pathway; regulator-design logic; mechanism chain from molecular interaction to cell-level behavior.
3. **Hypotheses** — For each: evidence strength, key assumptions, expected signals, likely failure modes, minimal validation test, and stop condition.
4. **Experimental design** — Baseline, candidate, negative control, and benchmark control; independent, dependent, and controlled variables; minimal viable validation and stronger validation plan; success, rejection, and pause criteria.
5. **Analysis plan** — Metrics and data-processing rules; mechanistic probes and how they connect to hypotheses; evidence-strength labeling rules.
6. **Iteration decision** — Continue, modify, pause, or reject for each hypothesis; boundary statement for generalization.
7. **Validity and safety notes** — Main confounders; reproducibility requirements; safety, ethics, and compliance boundaries relevant to the proposed system.

# Validation Gates

- **Interfacial scope gate:** The failure mode must be interfacial and measurable before advancing.
- **Falsifiability gate:** Every mechanism chain must contain at least one directly testable link.
- **Hypothesis rigor gate:** Hypotheses must rest on more than one assumption and must include a discriminating prediction.
- **Control isolation gate:** Experimental designs must include controls capable of separating the proposed mechanism from confounding variables.
- **Consistency gate:** Cross-level evidence must agree before mechanism claims are upgraded.
- **Convergence gate:** At least two independent evidence streams are required to claim mechanism support.
- **Stop gate:** Predefined stop conditions must trigger termination or pivot when met.
- **Boundary gate:** Claims must be explicitly bounded to the tested chemistry and device format.

# Claim Boundaries

- Performance improvement alone does not prove a mechanism; mechanistic signals without performance improvement do not prove a useful solution.
- Electrode-level observations do not automatically transfer to full-cell or device relevance.
- Single-study results must not be presented as field-wide consensus.
- Label all claims as Observed, Inferred, Hypothesized, or Extrapolated.
- Limit conclusions to the tested electrolyte class, electrode pairing, and device format unless independent validation is explicitly required.

# Failure Modes

- The proposed mechanism is not detected despite performance improvement.
- A negative or inactive control reproduces the effect, indicating a confound.
- Full-cell behavior contradicts half-cell or symmetric-cell improvement.
- Improvement is attributable to loading, geometry, impurities, or protocol differences rather than the intended mechanism.
- Results are irreproducible across independent batches or replicates.
- Side reactions, cross-electrode effects, or unintended transport limitations override the intended benefit.
- Tradeoffs (e.g., stability versus rate capability) render the strategy non-viable despite partial mechanistic validity.

# Validity Checks

Before finalizing a research plan, verify:

- **Gap clarity:** Is the research question based on a defined interfacial failure rather than vague novelty?
- **Mechanism specificity:** Does each hypothesis identify molecular, interface, and cell-level observables?
- **Control strength:** Are baseline, negative, and benchmark comparisons matched to the claim?
- **Confounding factors:** Could electrode preparation, electrolyte volume, separator, impurities, temperature, cell geometry, or handling explain the result?
- **Cross-electrode effects:** Could the strategy improve full-cell behavior by changing the counter electrode rather than the intended interface?
- **Statistical validity:** Are repeated measurements, uncertainty, and consistent endpoint rules included where needed?
- **Reproducibility:** Are raw data, metadata, and analysis rules sufficient for another researcher to repeat the study?
- **Boundary conditions:** Are conclusions limited to the tested chemistry and format?
- **Failure modes:** Are likely failure mechanisms and stop conditions explicit?
- **Evidence labeling:** Are observed, inferred, hypothesized, and extrapolated claims clearly separated?

# Provenance

- Synthesized from cluster 62.1 (aqueous zinc electrolyte interface mechanism discovery).
- Source skills: interface-additive-zinc-battery-exploration (d48521fa7c54e001), solvation-interface-battery-research (94920de07566295a), chelation-guided-aqueous-metal-anode-exploration (1d0cbbf571857d7a), aqueous-zn-battery-electrolyte-research-design (eb0f11c7562b837a), zinc-ion-electrolyte-research-design (a781853bdda92efd), zinc-ion-hybrid-supercapacitor-material-design (8d8ed1dbc9f3ebd0), alloy-seeded-metal-electrodeposition (03a08624d7dd9477), layered-ion-storage-workflow (4aad84af5cce07d2).
- No paper-specific conclusions, operational protocols, or fabrication parameters are included.
