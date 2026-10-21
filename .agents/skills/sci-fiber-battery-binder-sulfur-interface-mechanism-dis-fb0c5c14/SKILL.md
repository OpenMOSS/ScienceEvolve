---
name: sci-fiber-battery-binder-sulfur-interface-mechanism-dis-fb0c5c14
description: A reusable end-to-end workflow for designing mechanism-first research plans in electrochemical energy storage systems where binder, sulfur, interface, and transport failures couple, emphasizing observable-driven hypothesis generation, staged validation, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · battery binder sulfur interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to design reusable, mechanism-first research workflows for electrochemical energy-storage systems where performance is limited by coupled interfacial, mechanical, and transport failures. It guides agents to translate observable bottlenecks into falsifiable hypotheses, staged validation plans, and iterative claim bounding without reproducing paper-specific recipes or operational protocols.

# When to use

Use this skill when a user asks to:

- Propose research questions for battery electrodes, binders, interfaces, or conversion-type active materials.
- Design experiments that connect molecular or architectural interventions to mechanistic proxies and cell-level outcomes.
- Evaluate whether a multifunctional component claim is supported by cross-scale evidence.
- Iterate a hypothesis after ambiguous, contradictory, or partially confirming results.

Do not use this skill for operational synthesis instructions, general battery textbooks, non-energy domains, or as a substitute for qualified laboratory safety review.

# Inputs required

Before generating a plan, identify or request:

- Target chemistry and cell architecture (at a non-operational design level).
- Dominant observable bottleneck: interfacial instability, active-material loss, mechanical degradation, transport limitation, or intermediate migration.
- Candidate intervention class: binder motif, host architecture, interface modifier, electrolyte additive, or coating concept.
- Available characterization families: electrochemical, microscopy, spectroscopy, impedance, or post-cycling analysis.
- Baseline and benchmark systems for control design.
- Constraints: safety scope, resource limits, and whether the task is exploratory screening or confirmatory validation.

# Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

1. **Scope and bottleneck definition**
   - Define the practical failure in observable terms (e.g., capacity fade, impedance rise, morphology change, efficiency loss).
   - Map the failure chain across subsystems: bulk structure → interface → transport → electrode mechanics → cell performance.
   - **Gate:** Is the bottleneck expressed as a measurable metric and linked to a specific subsystem? If no, stop and refine the problem scope.

2. **Mechanism hypothesis generation**
   - For each candidate intervention, formulate a falsifiable claim that links the intervention to a specific observable change in the failure chain.
   - Label evidence strength (`strong`, `moderate`, `weak`, `speculative`), key assumptions, predicted observations, possible failure modes, and boundary conditions.
   - **Gate:** Does every retained hypothesis predict a mechanistic proxy that can be measured before cell-level performance? If no, reject and reformulate.

3. **Staged validation design**
   - Define minimal viable validation: at minimum one bulk/interior probe, one interface-specific probe, one morphology or transport probe, and one performance probe.
   - Specify controls: baseline, negative, positive/benchmark, single-function, and inactive analog.
   - Define explicit stop conditions before data collection.
   - **Gate:** Does the plan include a negative control and a predefined stop condition for each hypothesis? If no, redesign.

4. **Sequential evidence collection**
   - **Stage A:** Confirm intended structure, architecture, and chemical state.
   - **Stage B:** Measure mechanistic proxies (interfacial stability, intermediate regulation, mechanical integrity, or deposition uniformity).
   - **Stage C:** Assess half-cell or symmetric-cell compatibility.
   - **Stage D:** Evaluate full-cell behavior only after Stages A–C provide directional support.
   - **Gate:** If Stage A or B contradicts the hypothesis, stop and iterate before proceeding to Stage C or D.

5. **Cross-scale analysis and claim classification**
   - Triangulate structural, chemical, and electrochemical data.
   - Classify each conclusion as `direct observation`, `control-supported inference`, `inferred mechanism`, or `speculative extension`.
   - Check for confounders: loading, inactive mass, wetting, conductivity, batch variation, and measurement normalization.
   - **Gate:** If independent evidence streams disagree, do not force a unified explanation. Return to Step 3 and design a discriminating test.

6. **Claim bounding and iteration**
   - State what is validated, what remains inferred, and where the mechanism should not be extrapolated.
   - Decide: **Continue** (escalate stress or realism), **Refine** (modify one variable), **Pivot** (adopt an alternative mechanism), or **Stop** (abandon if negative controls match or safety boundaries are breached).
   - **Iteration:** Return to Step 2 with an updated failure map if evidence is partial or contradictory.

# Output Format

When using this skill, return:

1. **Research question and scoped bottleneck:** one sentence stating the mechanism-focused question.
2. **Hypotheses table:** each with claim, evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
3. **Validation plan:** variables, controls, staged probes, metrics, and stop conditions.
4. **Analysis plan:** evidence matrix, causal-chain checks, normalization rules, and claim classification guidance.
5. **Iteration rules:** decision tree for confirmatory, partial, weak, or contradictory outcomes.
6. **Validity and safety notes:** confounders, reproducibility needs, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Problem measurability:** The bottleneck must be defined by observable metrics, not by material names alone.
- **Mechanistic specificity:** Each hypothesis must predict a specific interphase, transport, or morphology signature.
- **Control adequacy:** Plans must include baseline, negative, positive/benchmark, and source-specific controls.
- **Evidence orthogonality:** At least two independent measurement families must support each major mechanism claim.
- **Half-cell/full-cell alignment:** Full-cell claims require consistent interface-level or half-cell evidence.
- **Reproducibility:** Key metrics require repeated measurements or independent samples with reported variability.

# Claim Boundaries

- Distinguish paper-supported workflow logic from new-system inferences.
- Do not treat single-system success as a universal design rule.
- Explicitly state chemistry, loading, rate, temperature, and cell-format boundaries.
- Avoid extrapolating lab-scale evidence to practical readiness without realistic validation.
- Label all analogies to literature or prior systems as speculative until matched controls are available.

# Failure Modes

- Intervention improves a headline performance metric but worsens impedance or interfacial stability.
- Mechanistic proxies fail while cell-level metrics improve, indicating spurious correlation.
- Negative controls perform similarly to the proposed intervention.
- Full-cell gains disappear under matched practical constraints.
- Results depend on uncontrolled contamination, unmatched processing, or non-reproducible preparation.
- Hypothesis relies on bulk evidence alone without interface confirmation.
- Mechanical or adhesion improvements are offset by transport losses or side reactions.

# Validity Checks

- **Confounding factors:** Consider binder, conductive additive, moisture, impurity, loading, contact, wetting, and active-material balance.
- **Statistical validity:** Report variability, replicate count, predefined success/failure criteria, and batch-to-batch differences.
- **Normalization:** Separate active-material, electrode-area, mass, and composite effects before comparing performance.
- **Post-cycling consistency:** Require that surface, morphology, and electrochemical evidence point to the same degradation pathway.
- **Safety and ethics:** Keep all recommendations at the research-design level; defer operational execution, hazardous handling, and scale-up to qualified institutional protocols and safety review.

# Provenance

- Synthesized from cluster 15.1 (observable-driven mechanism discovery and validation).
- Source skills: `electrolyte-interface-battery-research-design`; `adaptive-binder-research-workflow`; `aqueous-zinc-interface-research`; `li-s-multifunctional-skeleton-research`; `conversion-cathode-exploration`; `lithium-sulfur-coupled-interface-exploration`; `lithium-sulfur-shuttle-kinetics-research`; `porous-conversion-electrode-research`.
- Retains transferable workflow patterns only; excludes paper-specific parameters, material recipes, numerical results, and operational protocols.
