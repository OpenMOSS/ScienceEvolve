---
name: sci-fiber-composite-fiber-mechanism-discovery-workflow-6aacdf30
description: A reusable end-to-end workflow for generating mechanism-driven research questions, designing minimally controlled experiments, and iterating hypotheses in fiber-reinforced polymer composites and functional fibrous material systems.
scienceevolve-title: "Fiber composites and battery materials · composite fiber mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent convert a materials-system performance gap into a testable, mechanism-driven research plan for fiber-reinforced polymer composites and functional fibrous architectures. The workflow connects structure–property hypotheses to controlled validation, multi-layer analysis, and iterative refinement without treating any single source system as universal.

## When to use

Use when the task involves:

- Proposing new research questions for fiber-reinforced composites, functional fibers, or hierarchical/natural-fiber polymer systems.
- Designing experiments around surface modification, interfacial engineering, filler integration, or process–structure–property links.
- Evaluating whether an observed effect is mechanism-driven or confounded.
- Planning iterative optimization from descriptive characterization to mechanistic validation.

Do not use for clinical decision-making, operational hazardous protocols, direct patient treatment, or as a substitute for domain-specific safety review and standards compliance.

## Inputs required

- Target material system: fiber/matrix classes, modifier or filler categories, and known processing constraints.
- Performance gap or failure mode: e.g., weak adhesion, poor load transfer, thermal mismatch, damping deficit, or functional limitation.
- Candidate mechanisms: hypothesized interfacial, architectural, or compositional drivers.
- Available characterization and testing resources.
- Constraints: safety boundaries, regulatory context, reproducibility requirements, and decision stage (discovery, screening, or preclinical concept).

## Core Workflow

1. **Gap Framing & Bottleneck Identification**
   - Define the unresolved performance gap or failure mode in application-relevant terms.
   - Identify whether the limitation originates from the interface, bulk matrix, fiber architecture, dispersion quality, or process history.
   - *Decision gate:* If the gap is already solved in the literature with equivalent materials, stop and redirect to replication or translation. Otherwise proceed.

2. **Mechanism Mapping & Hypothesis Generation**
   - Map the bottleneck to plausible mechanisms (e.g., mechanical interlocking, chemical coupling, crack deflection, load redistribution, barrier effect, or controlled release).
   - State each hypothesis as a causal chain: “If [intervention] creates [structural change], then [indicator] should improve, leading to [property change], provided [assumptions] hold.”
   - Label evidence strength for each hypothesis (strong / moderate / weak / speculative) based on literature support and mechanistic consistency.
   - List key assumptions, likely failure modes (e.g., agglomeration, poor wetting, leaching, assay interference), and minimal falsifying evidence.
   - *Decision gate:* If no hypothesis can be falsified with available resources, narrow scope or request additional inputs.

3. **Minimal Viable Experimental Design**
   - Define independent variables at a conceptual level (e.g., modifier class, integration route, loading level, process regime) without prescribing operational recipes.
   - Select dependent variables spanning structure, chemistry, mechanics, thermal/dynamic behavior, and application-relevant function.
   - Build a control hierarchy:
     - Baseline (unmodified system).
     - Process control (same handling without active intervention).
     - Negative control (condition expected to lack the proposed mechanism).
     - Positive / benchmark control (known comparator when available).
   - Predefine primary and secondary endpoints.
   - Specify stopping / redesign conditions: safety signals, control failure, unacceptable trade-offs, unresolved assay interference, or mechanism-inconsistent microstructure.
   - *Decision gate:* If controls cannot isolate the proposed mechanism, redesign before execution.

4. **Execution & Quality-Control Layer**
   - Confirm comparable processing history across groups.
   - Verify instrument calibration, replicate structure, and predefined exclusion criteria.
   - Document batch/source variability and environmental conditioning.
   - *Decision gate:* If quality-control checks fail (e.g., controls behave unexpectedly, high scatter from processing artifacts), halt interpretation and troubleshoot reproducibility.

5. **Multi-Layer Analysis**
   - **Structure–property layer:** Relate composition, morphology, dispersion, and interface quality to mechanical, thermal, or dynamic metrics.
   - **Mechanism layer:** Test whether the observed effect follows the proposed mechanism rather than alternatives (e.g., bulk matrix change, solvent effect, measurement artifact).
   - **Function layer:** Evaluate target performance against controls, reporting uncertainty and variability.
   - **Safety/boundary layer:** Assess retention, leaching, degradation, cytotoxicity, or environmental handling constraints at a design level.
   - **Trade-off layer:** Explicitly analyze stiffness vs. toughness, function vs. durability, or activity vs. compatibility.
   - *Decision gate:* If only one metric changes while orthogonal evidence is absent, classify the mechanism as weak and flag for additional characterization.

6. **Mechanism Discrimination & Claim Bounding**
   - Triangulate evidence: require alignment among chemical, morphological, and performance data before accepting the mechanism.
   - Classify each hypothesis as supported, partially supported, unsupported, or contradicted.
   - Bound claims to the tested material class, process window, and validation conditions.
   - Distinguish non-clinical results from clinical or field-deployment claims.
   - *Decision gate:* If microstructure supports the mechanism but performance does not, or vice versa, prioritize failure-mode analysis over forced conclusions.

7. **Iteration & Redesign**
   - **If supported:** Narrow the design space, test robustness across batches or environments, and move to durability/application-relevant boundary tests.
   - **If mixed:** Identify the diverging metric and add a targeted control or orthogonal method.
   - **If non-monotonic:** Model competing beneficial/detrimental mechanisms and search for a transition region rather than extrapolating linearly.
   - **If contradicted:** Revisit the mechanism map, check confounders, and redesign the intervention or comparison.
   - **If inconclusive:** Increase replication, randomization, or measurement-system checks before changing the material system.
   - *Stop condition:* Terminate if the primary endpoint fails after two mechanistically distinct interventions, if safety limits are breached, or if the effect remains dominated by uncontrolled variability.

## Output Format

When using this skill, produce:

1. **Research question:** one concise, mechanism-centered question tied to a performance gap.
2. **Mechanism map:** causal chain from intervention to structural change to property change, with evidence strength labels.
3. **Hypotheses:** 2–4 testable statements, each with assumptions, failure modes, and evidence strength.
4. **Experimental design:** conceptual factors, control hierarchy, primary/secondary endpoints, and stopping conditions.
5. **Analysis plan:** multi-layer analysis sequence, triangulation rules, and trade-off visualization.
6. **Iteration rules:** decision logic for supported, mixed, contradicted, or inconclusive results.
7. **Validity checklist:** confounders, reproducibility, statistical validity, boundary conditions, and translation limits.
8. **Safety and ethics notes:** non-clinical boundaries, institutional review requirements, and hazard-awareness constraints.

## Validation Gates

- **Gap validity:** Is the question based on an unresolved need rather than a known solved problem?
- **Mechanism validity:** Do controls separate the proposed mechanism from nonspecific effects?
- **Control validity:** Do negative and positive controls directly test the claim, not just assay function?
- **Material validity:** Are composition, morphology, and batch variability measured rather than assumed?
- **Statistical validity:** Are replicates, randomization, uncertainty estimates, and pre-specified stopping criteria included?
- **Reproducibility:** Are material source, processing category, and analysis decisions documented sufficiently for independent replication without exposing hazardous operational details?
- **Boundary validity:** Are conclusions limited to the tested system, application context, and validation conditions?
- **Translation validity:** Are non-clinical results distinguished from clinical claims, and are regulatory/ethical requirements identified?

## Claim Boundaries

- Treat all conclusions as system-specific until replicated across independent batches or material sources.
- Do not generalize from a single study or lab setup to an entire material class, fiber type, or application domain.
- Label agent-generated extensions to new polymers, fillers, modifiers, or biological models as provisional hypotheses.
- Separate verified methodological patterns from field-wide consensus.
- Avoid clinical, therapeutic, or safety-critical performance claims from early-stage material characterization.

## Failure Modes

- **Mechanism misattribution:** Performance changes arise from processing artifacts, solvent residues, or bulk matrix effects rather than the intended interfacial or architectural mechanism.
- **Confounded comparison:** Independent variables co-vary with fiber orientation, void content, moisture, cure state, or batch history.
- **Over-optimization:** A single endpoint improves while critical trade-offs (toughness, durability, safety) degrade unnoticed.
- **Assay interference:** Modifier leaching, pH shifts, or particulate aggregation distort functional or biological readouts.
- **Narrow generalizability:** Effects observed in one hydration state, loading regime, or fiber source fail under slightly different conditions.
- **Premature translation:** In vitro or bench-scale results are presented as evidence of clinical, structural, or field performance.

## Validity Checks

Before finalizing a plan or interpreting results, verify:

- Confounding variables are tracked (fiber architecture, matrix cure, porosity, thickness, moisture, contamination, handling history).
- Causality is testable via the control hierarchy.
- Surface-specific claims are backed by surface-sensitive evidence, not only bulk measurements.
- Morphology evidence is representative, not cherry-picked.
- Replication covers fiber/bundle, batch, and treatment levels.
- Uncertainty is reported for all primary endpoints.
- Boundary conditions (temperature, humidity, strain rate, environmental exposure) are stated.
- Trade-offs are reported alongside gains.

## Provenance

- Synthesized from cluster 69, subcluster 69.0 (composite-fiber-polymer-natural mechanism discovery and validation).
- Source skill references: `bacterial-cellulose-nanocomposite-research`, `fiber-interface-anchoring-research`, `fiber-surface-modification-research-design`, `composite-drilling-research-planning`, `regenerated-cellulose-scaffold-exploration`, `fiber-composite-research-workflow`, `hierarchical-fiber-composite-exploration`, `fiber-pcm-research-exploration`.
- Derived from reviewed paper-derived skill clusters; no operational protocols or unsupported conclusions were invented.
