---
name: sci-fiber-structure-mechanism-performance-hypothesis-wo-d91c4eda
description: An end-to-end hypothesis-driven workflow for structure-mediated materials research, spanning gap definition, mechanism mapping, controlled validation, multi-scale analysis, and iterative redesign with explicit claim boundaries.
scienceevolve-title: "Fiber composites and battery materials · structure mechanism performance hypothesis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Translate an observed performance gap or unexplained phenomenon in materials science into a testable, iterated research program. This skill orchestrates hypothesis generation, minimally controlled validation, multi-scale mechanism analysis, and iterative redesign while enforcing strict claim boundaries and non-operational safety constraints.

## When to use

Use this workflow when the task involves:
- Proposing new research questions for functional materials, interfaces, composites, fibers, or soft-matter systems.
- Designing experiments to distinguish structure-mediated mechanisms from processing or measurement artifacts.
- Iterating on material designs based on multi-evidence feedback loops.
- Bounding claims before extrapolation to untested scales, loads, or environments.

Do not use for executing hazardous protocols, reproducing exact paper conditions, or making unsupported domain-generalizations.

## Inputs required

- **Target system**: Material class, architecture, and application context.
- **Bottleneck**: The specific performance limit or unexplained behavior to address.
- **Candidate mechanisms**: Hypothesized structure-to-function links (e.g., interfacial anchoring, transport pathways, mechanical buffering, topological constraints).
- **Capabilities**: Available structural, interfacial, kinetic, mechanical, or performance characterization methods.
- **Baselines**: Negative, positive, and structural reference systems for causal isolation.
- **Constraints**: Safety, reproducibility, statistical power, and resource limits.

## Core Workflow

1. **Gap Definition & Mechanism Mapping**
   - Frame the bottleneck as a structure-mediated mechanism question.
   - Map candidate structural variables to candidate functional mechanisms and observable performance metrics.
   - *Decision gate*: Is the gap plausibly addressable by a structure-mediated mechanism with available tools? If no, stop and reformulate.

2. **Hypothesis Generation**
   - Produce 3–5 falsifiable hypotheses of the form: *If structural variable X changes, mechanism Y is modulated, producing observable performance shift Z*.
   - Tag each hypothesis with evidence strength (high / medium / low), key assumptions, and explicit failure modes.
   - *Decision gate*: Are the hypotheses mutually distinguishable given the planned controls? If no, prune or clarify before proceeding.

3. **Minimal Validation Design**
   - Define the smallest experiment or simulation capable of falsifying the leading hypothesis.
   - Specify independent, dependent, and controlled variables.
   - Design negative, positive, structural, and baseline controls to isolate the target mechanism from confounders.
   - Preset stop conditions: safety breach, non-reproducibility, null effect vs. strong controls, or unresolved data quality issues.
   - *Decision gate*: Do the controls isolate the target mechanism from loading, connectivity, environmental, or processing artifacts? If no, redesign.

4. **Execution & Data Quality Audit**
   - Carry out the minimal validation.
   - Audit sample identity, environmental state, calibration, and completeness against pre-registered criteria.
   - *Decision gate*: Does data quality meet pre-set thresholds? If no, halt and fix the protocol; do not proceed to mechanism interpretation.

5. **Multi-Scale Mechanism Analysis**
   - Analyze structural, interfacial, kinetic/transport, and performance metrics together.
   - Evaluate cross-metric consistency; classify support as: supported, partially supported, unsupported, or artifact.
   - *Decision gate*: Do at least two independent evidence classes align with the hypothesized mechanism? If no, downgrade the claim to phenomenological or stop.

6. **Iteration or Redesign**
   - **If supported**: Expand to boundary conditions (scale, load, environment, long-term stability).
   - **If partially supported**: Refine the hypothesis and run a targeted follow-up that distinguishes competing mechanisms.
   - **If unsupported**: Reject the hypothesis and return to Step 2, or terminate the route if no viable hypotheses remain.
   - **If stop conditions triggered**: Document the failure mode and exit.
   - *Decision gate*: Has the hypothesis survived strong controls and boundary tests without safety or quality breaches? If yes, proceed to synthesis.

7. **Synthesis & Claim Bounding**
   - Assemble ranked hypotheses, control tables, analysis plans, and iteration logs.
   - Label every conclusion as observed phenomenon, mechanism-consistent inference, or extrapolated claim.
   - State explicit boundaries for scale, material class, and environmental conditions.

## Output Format

1. **Research Question**: One-sentence definition of the bottleneck and target mechanism.
2. **Gap & Mechanism Map**: Table linking structural variables → candidate mechanisms → performance metrics, with provenance labels.
3. **Ranked Hypotheses**: List of 3–5 hypotheses with evidence strength, key assumptions, predicted outcomes, and failure modes.
4. **Minimal Validation Plan**: Variables, controls, metrics, sample requirements, and stop conditions.
5. **Analysis Plan**: Multi-scale evidence matrix, visualization strategy, statistical rules, and outlier handling.
6. **Iteration Log**: Decision record for each cycle, including evidence updates, pivot rationale, and termination reasons.
7. **Validity & Safety Notes**: Confounder inventory, extrapolation boundaries, reproducibility requirements, and non-operational safety limits.

## Validation Gates

- **Mechanism Isolation Gate**: Controls must separate the target mechanism from conductivity, loading, morphology, processing history, or environmental artifacts.
- **Cross-Evidence Consistency Gate**: A performance change must be accompanied by at least two independent structure or mechanism metrics pointing in the same direction.
- **Reproducibility Gate**: Key claims require independent samples or batches; outliers are handled by pre-defined rules, not post-hoc exclusion.
- **Extrapolation Gate**: Results from simplified, low-load, or short-term tests cannot be claimed for complex, high-load, or long-term systems without explicit boundary validation.
- **Safety & Ethics Gate**: No operational hazardous details are output; all designs must remain within institutional safety, ethics, and compliance boundaries.

## Claim Boundaries

- Distinguish four tiers: **observed phenomenon**, **consistent with proposed mechanism**, **supports the hypothesis**, and **established field consensus**.
- Single-source or single-system results are heuristic evidence only; they do not constitute consensus.
- Mechanism claims require causal controls, not solely performance correlations.
- Any extrapolation beyond the validated material class, scale, or environment must be labeled as unverified inference.

## Failure Modes

- **Confounded attribution**: The apparent effect arises from an uncontrolled variable (e.g., batch variation, loading difference, connectivity change) rather than the target mechanism.
- **Selective evidence**: Multi-scale metrics conflict, but only supporting metrics are reported.
- **Over-extrapolation**: Low-load or short-term results are presented as general performance without boundary testing.
- **Hypothesis drift**: The research question shifts post-hoc to match unexpected results without pre-registration.
- **Safety bypass**: Iteration continues despite triggered stop conditions or unassessed hazardous implications.

## Validity Checks

- **Confounder inventory**: List all variables that could mimic the target effect before analysis.
- **Control sufficiency**: Verify negative, positive, structural, and baseline controls are present and appropriate.
- **Statistical transparency**: Pre-register repeats, dispersion metrics, normalization methods, and outlier handling rules.
- **Mechanistic coherence**: Structural, interfacial, kinetic, and performance indicators must be internally consistent; conflicts must be resolved before claim formation.
- **Provenance labeling**: Tag every substantive claim as derived from source methodology, agent inference, or external data.

## Provenance

- Synthesized from cluster **40.0** (`fiber-lithium-sulfur-composite-topological-hypothesis-workflow`).
- Source skills: `lithium-sulfur-binder-research-workflow` (10.1039_c6ee03033e), `li-s-oxide-cathode-research` (10.1002_celc.202200374), `lithium-sulfur-battery-binder-exploration` (4948b3b9-1d20-4a85-81af-15bd3a968d01), `hollow-aerogel-fiber-thermal-exploration` (fiber__10.1021_acsnano.6c02753), `blended-yarn-rheology-exploration` (fiber__10.1177_00405175221119531), `asymmetric-ch-functionalization-research-design` (10.1021_acs.orglett.3c02013), `natural-fiber-composite-machining-exploration` (fiber__10.1177_0021998319826373), `viscoelastic-shear-polymer-exploration` (10.1103_physreve.102.012605).
- This skill encodes the shared workflow route; it does not reproduce paper-specific conclusions, parameters, material recipes, or operational protocols.
