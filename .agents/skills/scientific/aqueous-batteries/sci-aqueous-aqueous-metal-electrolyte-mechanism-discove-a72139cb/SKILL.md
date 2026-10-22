---
name: sci-aqueous-aqueous-metal-electrolyte-mechanism-discove-a72139cb
description: A reusable end-to-end workflow for designing mechanism-driven research plans in aqueous metal-electrolyte systems, from failure-mode mapping through multi-scale hypothesis validation and iterative refinement.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal electrolyte mechanism discovery workflow 4"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents to transform observed electrochemical failures in aqueous metal-electrolyte systems into structured, testable mechanism hypotheses and multi-scale validation plans. The workflow connects molecular solvation and interfacial phenomena to device-level behavior through controlled comparison, causal-chain analysis, and iterative refinement, without embedding any single paper's specific chemistry or parameters.

# When to use

Use when the user asks to design new research questions, experiments, or validation strategies for aqueous metal batteries where electrolyte solvation structure, interfacial ion flux, electrodeposition morphology, or side-reaction pathways are central. Applicable to electrolyte and additive screening, separator and interface engineering, gel or polymer composite design, and coupled degradation studies. Do not use for executable laboratory protocols, hazardous procedures, purely statistical data analysis without mechanistic framing, or non-aqueous chemistries.

# Inputs required

- Target metal-electrolyte chemistry and dominant failure mode (e.g., unstable plating, corrosion, dendrite growth, passivation).
- Baseline system class and known performance limitations.
- Candidate intervention classes (additives, cosolvents, salts, polymers, interlayers, architectures).
- Available characterization and simulation capabilities.
- Safety and feasibility constraints relevant to the lab context.
- Claim level needed (exploratory hypothesis, mechanism proposal, or system-level translation).

If inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

1. **Define the failure mode and localize the mechanistic gap.**
   - Start from a concrete electrode or cell failure (unstable plating/stripping, parasitic reactions, uneven deposition, impedance growth, rapid capacity decay).
   - Map the failure to candidate microscopic causes: solvation-shell composition, solvent activity, hydrogen-bond network, ion pairing, interfacial film chemistry, transport limitation, or electrode morphology.
   - **Decision Gate 1:** If the failure cannot be localized to at least one molecular or interfacial candidate mechanism, stop and request additional observational inputs.

2. **Generate ranked mechanism hypotheses.**
   - For each candidate mechanism, formulate a causal chain: molecular lever → solution/interfacial behavior → electrode morphology/reversibility → cell-level consequence.
   - Grade each hypothesis by evidence strength (high/moderate/low/speculative) and label key assumptions, predicted observables at each scale, and likely failure modes.
   - Include at least one transport-tradeoff hypothesis and one boundary-condition hypothesis.
   - **Decision Gate 2:** If no hypothesis can be falsified by the available measurement capabilities, redesign the candidate set or expand diagnostic access before proceeding.

3. **Design controlled comparisons.**
   - Define a baseline representing the conventional system.
   - Select comparative candidates that vary one interpretable structural or formulation feature at a time.
   - Specify controls: negative (mechanism disabled), structural (architecture without chemistry), ablation (remove one functional role), and positive/benchmark (contextual comparison only).
   - Predefine independent, dependent, and context variables; normalize electrode loading class, geometry class, and protocol class across groups.
   - **Decision Gate 3:** If the control matrix cannot isolate the proposed mechanism from confounding variables (viscosity, concentration, pH, surface area, impurities), redesign controls before validation.

4. **Execute minimum viable multi-scale validation.**
   - **Molecular/bulk layer:** One structural or spectroscopic readout of solvation, coordination, or network change; one transport or activity readout.
   - **Interfacial layer:** One morphology, composition, or impedance readout after matched exposure; one reversibility or polarization metric.
   - **System layer:** One full-cell or practical-cell metric, only if smaller-scale evidence is directionally consistent.
   - **Decision Gate 4:** If molecular/bulk evidence is absent or contradicts the hypothesis, stop and revise the mechanism or candidate design. If interfacial evidence is absent, do not proceed to system-level claims.

5. **Analyze as an evidence chain.**
   - Pre-register causal criteria: which results support, weaken, or falsify each hypothesis.
   - Correlate descriptors across scales; do not claim mechanism from cell performance alone.
   - Separate direct structural evidence, functional electrochemical evidence, and interpretive surface evidence.
   - Quantify uncertainty (replicate consistency, baseline drift, parameter sensitivity).
   - **Decision Gate 5:** If evidence is inconsistent across scales (e.g., molecular signal positive but interfacial signal negative), treat the hypothesis as provisional and trigger iteration rather than claiming success.

6. **Iterate, bound, or terminate.**
   - **Supportive and consistent:** Strengthen the hypothesis by testing boundary conditions (rate, temperature, loading, cell format) and update evidence strength to moderate/high only with converging data. Then propose next-complexity validation.
   - **Partial or contradictory:** Locate the weakest causal link. Revise the hypothesis, add ablation or orthogonal controls, and retest at the relevant scale.
   - **Falsified or unsafe:** Stop the direction. Document failure modes as boundary conditions. Redesign within safer or more controllable boundaries.
   - **Stop conditions:** Controls fail, measurements are irreproducible, bulk transport collapses, safety constraints are unmet, improvement cannot be linked to the proposed mechanism, or gains disappear under stronger controls.

# Output Format

When using this skill, return:

1. **Research question and gap:** concise statement of the unresolved mechanism or design problem.
2. **Mechanism model:** causal chain from molecular design to cell-level performance.
3. **Hypothesis table:** each hypothesis with evidence strength, key assumptions, predicted observables (molecular, interfacial, device), and likely failure modes.
4. **Experimental design:** baseline, controls (negative, structural, ablation, positive/benchmark), variables, minimum viable validation layers, and stop conditions.
5. **Analysis plan:** evidence-chain logic, normalization rules, uncertainty handling, and falsification criteria.
6. **Iteration plan:** decision rules for supportive, mixed, contradictory, or unsafe results.
7. **Validity and safety notes:** confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.
8. **Claim boundary:** separation of verified observations, inferred mechanisms, and unverified extrapolations.

# Validation Gates

- **Gate 1 — Mechanistic localization:** The failure mode must be mappable to at least one molecular or interfacial candidate. If not, pause for more observational data.
- **Gate 2 — Falsifiability:** At least one hypothesis must be testable with available diagnostics. If not, redesign candidates or expand capabilities.
- **Gate 3 — Control isolation:** The control matrix must distinguish the proposed mechanism from concentration, viscosity, surface area, pH, and impurity effects. If confounds are inseparable, redesign.
- **Gate 4 — Scale coherence:** Molecular/bulk and interfacial evidence must be directionally consistent before system-level claims. If molecular evidence is missing or contradictory, stop escalation.
- **Gate 5 — Cross-scale consistency:** Structural, functional, and interpretive evidence must align. If scales contradict, downgrade claim strength and iterate.

# Claim Boundaries

- Distinguish verified observations (directly measured), inferred mechanisms (causal interpretation), and extrapolations (untested systems or conditions).
- Do not treat single-system success as field-wide consensus.
- Limit claims to the tested chemistry, architecture, and validation range unless independently replicated.
- Mark agent-inferred extensions separately from source-supported patterns.
- Never claim commercial readiness, deployment suitability, or universal safety from laboratory demonstrations.

# Failure Modes

- **Hypothesis failure:** Molecular signature absent despite design intent; mechanism operates but produces no performance gain due to hidden transport penalty.
- **Control failure:** Baseline or negative control performs unexpectedly well, erasing candidate differentiation; ablation controls show no loss of function, indicating missing mechanism.
- **Measurement failure:** Irreproducible spectra, batch-dependent morphology, or mismatched cycling histories invalidate comparison.
- **Scale-translation failure:** Anode-level improvement disappears in full-cell testing due to cathode incompatibility, crossover, or electrolyte consumption.
- **Overloading/complexity failure:** Multi-component designs improve one metric while degrading another (viscosity, conductivity, mechanical integrity).
- **Boundary failure:** Gains are condition-specific and vanish under stress (rate, temperature, loading).

# Validity Checks

- **Confounding:** Match electrode preparation, geometry, loading, electrolyte amount, protocol, and measurement timing across groups.
- **Mechanism specificity:** Each claimed mechanism requires at least two independent diagnostic streams; do not infer from performance curves alone.
- **Reproducibility:** Plan repeated preparations, repeated cells, and independent batches for key claims; report adverse outcomes.
- **Statistical validity:** Define replicates, normalization, outlier rules, and uncertainty estimates before analysis.
- **Model validity:** When using simulation, check force fields, charge models, finite-size effects, and omitted physics (viscosity, aggregation, interfacial reactions).
- **Boundary conditions:** State temperature, rate, loading, cell format, and duration limits; do not generalize beyond tested ranges.

# Provenance

- Synthesized from cluster 26 (subcluster 26.0): observable-driven mechanism discovery and validation.
- Source skills: aqueous-zinc-solvation-research-design (192ffff369c31346), entropy-electrolyte-research (08666f3d1674f399), aqueous-zinc-anode-electrolyte-research (f83b901a6818028c), interface-space-zinc-anode-research (620e055fcf258cb2), aqueous-zinc-electrolyte-exploration (cf2e2fad5f799259), aqueous-zinc-iodine-interface-exploration (b49738d65a1e2c70), gel-electrolyte-research-workflow (a593af9212761f51), interfacial-solvation-zinc-battery-research (d31d8b8c63d9031b).
- Paper-specific chemistries, parameters, and conclusions have been abstracted; only the transferable workflow pattern is retained.
