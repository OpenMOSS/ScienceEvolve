---
name: sci-dft-catalysis-metal-transfer-research-design-workfl-b5b1bf3a
description: End-to-end research design workflow for transition-metal-catalyzed transformations, covering hypothesis generation, controlled validation, mechanistic analysis, and iterative refinement.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis metal transfer research design workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Migrate mechanistic insights from known catalytic platforms into testable research programs for new transition-metal-catalyzed reactions. This skill guides the agent through defining gaps, generating falsifiable hypotheses, designing minimum viable validations with strong controls, analyzing performance-selectivity-mechanism consistency, and iterating based on evidence—without reproducing operational lab recipes or treating single-paper results as domain consensus.

# When to use

- When proposing new substrates, ligands, metal centers, or coupling strategies within a known catalytic platform.
- When investigating selectivity origins (chemo-, regio-, diastereo-, or enantioselectivity) in metal-mediated bond activation or transfer reactions.
- When designing cascade, domino, or intermediate-interception sequences that require closing a catalytic cycle.
- When translating literature mechanistic logic to new reaction classes, not when replicating exact experimental conditions.
- When evaluating whether an observed phenomenon is robust enough to support mechanistic claims or methodological expansion.

# Inputs required

- **Target transformation**: bond activation/forming logic, desired product class, and selectivity goals.
- **Known platform or precedent**: conserved catalytic core, previously validated elementary steps, and identified performance bottlenecks.
- **Variable space**: candidate metal centers, ligand/local environment classes, substrate categories, transfer reagents or coupling partners, and medium constraints.
- **Analytical capabilities**: available metrics (conversion, selectivity, mass balance, structural confirmation, kinetic/mechanistic probes, computational support).
- **Boundaries**: safety and compliance limits, material accessibility, environmental constraints, and failure tolerances.

# Core Workflow

1. **Define the gap and research question**
   - Identify a specific bottleneck (selectivity, scope, stability, step economy, or mechanistic ambiguity) rather than a generic “new substrate” goal.
   - Frame a falsifiable question that links the bottleneck to a controllable mechanistic variable.

2. **Abstract the mechanistic model**
   - Map the catalytic cycle into elementary steps: substrate coordination/activation, bond formation/cleavage, intermediate evolution, product release, and catalyst regeneration or deactivation.
   - Identify competing on-cycle and off-cycle paths that could determine selectivity or turnover.
   - Label steps as “established in precedent” versus “inferred for the new system.”

3. **Generate ranked hypotheses**
   - For each proposed control point, state:
     - The hypothesis (e.g., local environment controls selectivity at the insertion step).
     - Evidence strength (high / medium / low).
     - Key assumptions required for the hypothesis to hold.
     - Observable predictions if true.
     - Failure modes and expected signals if false.
   - Prioritize hypotheses that differentiate between competing mechanistic paths.

4. **Design minimum viable validation (MVV)**
   - Select a representative model substrate that can distinguish the target path from the most plausible competing paths.
   - Define success, failure, and inconclusive criteria before data collection.
   - **Decision Gate DG1**: If the model system cannot yield interpretable data with reliable detection, stop and revise the analytical or substrate strategy.

5. **Structure perturbation experiments**
   - Group variables into independent axes:
     - Catalyst core and local environment (metal, ligand class, coordination sphere).
     - Substrate structure (electronic, steric, directing features, protecting-group variants).
     - Reagent/coupling partner or transfer agent class.
     - Reaction medium and additive effects.
   - Vary one axis at a time while holding others constant to preserve causal interpretability.

6. **Embed strong controls**
   - **Negative controls**: omit essential catalytic components; use substrates lacking key recognition features.
   - **Positive/benchmark controls**: validated analogous systems that confirm detection chain integrity.
   - **Mechanism controls**: single-factor perturbations designed to isolate electronic, steric, or directing effects.
   - **Condition controls**: distinguish local-environment effects from medium or additive artifacts.
   - **Decision Gate DG2**: If negative controls produce signals comparable to the test case, halt expansion and diagnose background reactions or analytical artifacts.

7. **Collect multi-dimensional data**
   - Record conversion, product distribution, selectivity metrics, mass balance, and reproducibility across independent runs.
   - Capture mechanistic evidence (isotope patterns, intermediate signatures, kinetic profiles, computational trends) alongside performance data.
   - Document failures and boundary cases explicitly.

8. **Analyze for mechanism-performance consistency**
   - Map observed trends onto the catalytic cycle; attribute selectivity changes to specific elementary steps when possible.
   - Distinguish addition selectivity from downstream trapping/isomerization selectivity.
   - Check that mechanistic probes, computational models, and product distributions point in the same direction.
   - **Decision Gate DG3**: If mechanistic evidence conflicts with product trends and cannot be resolved by model refinement, pause scope expansion and redesign probes.

9. **Evaluate and classify results**
   - **Support**: Trends align with predictions, controls are clean, and key assumptions hold.
   - **Partial support**: Target outcome appears but selectivity or mechanism evidence is insufficient.
   - **Negation**: Trends oppose predictions or controls invalidate the proposed link.
   - **Inconclusive**: Variable coupling prevents causal attribution.

10. **Iterate or pivot**
    - If supported: expand to boundary-testing substrates and add discriminating controls for alternative mechanisms.
    - If partially supported: refine the mechanistic map, narrow the claim, and design orthogonal perturbations.
    - If negated: record disconfirming evidence, update hypothesis strength, and consider alternative catalytic cycles or platform modifications.
    - **Stop conditions**: Target signal is non-reproducible; mass balance is persistently poor; safety/compliance boundaries are reached; the hypothesis is falsified and no viable alternative is ready.

11. **Bound final claims**
    - State conclusions as conditional: “In the tested systems, data support X mechanism; inference strength for new system Y is Z.”
    - Separate established precedent, new experimental evidence, and analogical inference.

# Output Format

Each invocation should produce:

1. **Research question** — One-sentence, falsifiable problem statement linked to a mechanistic bottleneck.
2. **Mechanistic map** — Annotated catalytic cycle distinguishing established steps from inferred steps.
3. **Hypothesis table** — Ranked hypotheses with evidence strength, key assumptions, predictions, failure modes, and minimum validation.
4. **Experimental design schema** — MVV plan, grouped variables, control hierarchy, evaluation metrics, and stop conditions.
5. **Analysis plan** — Data matrix structure, mechanism-mapping logic, visualization approach, and evidence-grading rules.
6. **Iteration plan** — Branching rules for support, partial support, negation, and inconclusive outcomes.
7. **Validity and safety notes** — Confounder checklist, reproducibility requirements, extrapolation boundaries, and non-operational safety guardrails.

# Validation Gates

- **Analytical validity**: Target products and side products can be reliably distinguished; mass balance is tractable.
- **Control validity**: Negative and benchmark controls behave as expected before interpreting test results.
- **Reproducibility**: Key trends are confirmed across independent preparations or runs.
- **Mechanistic consistency**: Performance trends, probe data, and computational models do not contradict one another.
- **Scope discipline**: Boundary substrates or conditions are tested before generalizing claims.

# Claim Boundaries

- Distinguish “established in precedent literature” from “inferred for the current system” and “analogical speculation.”
- Do not present single-platform observations as domain consensus.
- Limit mechanistic claims to the tested variable range; label extrapolations to new metals, ligand families, or substrate classes as unverified.
- Avoid inferring clinical, materials, or industrial application value from model-reaction data.

# Failure Modes

- **Background dominance**: Target signal is indistinguishable from non-catalytic or analytical artifacts.
- **Over-reduction / over-reaction**: Desired selectivity is lost to competing pathways that were not constrained by the chosen variables.
- **Catalyst deactivation**: Turnover collapses due to off-cycle accumulation, speciation changes, or irreversible sequestration.
- **Misattributed selectivity**: Final product distribution reflects post-catalytic isomerization or workup artifacts rather than the selectivity of the catalytic step.
- **False extrapolation**: A trend valid for the model substrate fails upon boundary testing, indicating over-fitting to a narrow chemical space.

# Validity Checks

- **Confounders**: Substrate purity, isomeric composition, reagent stability, medium effects, and analytical calibration can obscure causal links.
- **Reproducibility**: Report independent repeats, batch-to-batch variation, and outlier handling.
- **Statistical validity**: Pre-define success/failure thresholds; avoid selecting only high-performing examples to support hypotheses.
- **Mechanism consistency**: Ensure isotope, kinetic, spectroscopic, and computational evidence converge before endorsing a specific elementary path.
- **Boundary conditions**: Explicitly note untested substrate classes, ligand scopes, and environmental variables.
- **Evidence grading**: Tag conclusions as directly observed, control-supported, analogically inferred, or speculative.

# Provenance

- Synthesized from cluster `5.0` (catalysis-nitrene-metal-transfer-research-design-workflow).
- Derived from source skills: `test0161`, `test1189`, `test1684`, `test1664`, `test0261`, `test0752`, `test1414`, `test0945`.
- Represents a semantic merge of shared workflow routes across transition-metal-catalyzed reaction design, ligand tuning, selective transfer, and cascade coupling domains.
