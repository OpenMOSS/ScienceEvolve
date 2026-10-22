---
name: sci-catalysis-asymmetric-chiral-catalyst-mechanism-hypo-fdb6e374
description: A reusable end-to-end workflow for generating, testing, and iterating mechanism-driven hypotheses in asymmetric chiral catalysis and ligand design, keeping all plans non-operational and claims bounded by evidence.
scienceevolve-title: "Asymmetric catalysis · asymmetric chiral catalyst mechanism hypothesis testing"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Use this skill to guide an agent through the full research-design cycle for asymmetric, chiral, or enantioselective catalysis problems. The workflow translates a synthetic bottleneck or selectivity gap into falsifiable mechanistic hypotheses, designs minimal conceptual validation studies with rigorous controls, analyzes results in staged gates, and iterates or stops based on observable evidence rather than extrapolation.

## When to use

Use this skill when a user asks to:
- Propose new chiral catalyst, ligand, or organocatalytic systems for stereoselective transformations.
- Design validation plans for dynamic kinetic resolution, kinetic resolution, regiodivergent synthesis, or directed functionalization.
- Translate a selectivity or reactivity gap into a mechanism-guided research question.
- Plan non-operational experiments to test structure-performance relationships, cooperative activation, or pathway routing.
- Evaluate whether a reported catalytic concept can extend to new substrate classes or catalyst architectures.

Do not use this skill for executable laboratory protocols, hazardous operational parameters, clinical recommendations, or scale-up engineering.

## Inputs required

Collect or infer before starting:
- **Target transformation**: reaction class, bond-forming event, and stereochemical challenge (e.g., enantioselectivity, diastereoselectivity, regioselectivity).
- **Performance gap**: current limitation in activity, selectivity, scope, or mechanistic clarity.
- **Candidate catalyst/ligand concept**: scaffold class, donor arrangement, chiral element, and proposed activation mode (mononuclear, dinuclear, organocatalytic, etc.).
- **Substrate scope hypothesis**: representative substrate classes, electronic/steric/conformational variables, and intended downstream utility.
- **Analytical capabilities**: methods available for conversion, product identity, stereochemical assignment, and mechanistic probes.
- **Prior evidence**: literature precedents, preliminary data, computational models, and known failure modes.
- **Constraints**: safety, regulatory, environmental, and institutional boundaries relevant to the chemistry class.

## Core Workflow

Execute the following stages in order. At each gate, decide whether to proceed, iterate, or stop.

### Stage 1: Gap definition and problem framing
1. State the target transformation and the specific selectivity or reactivity gap.
2. Classify the gap as activation-limited, stereocontrol-limited, scope-limited, or mechanism-unclear.
3. **Gate 1**: If the gap cannot be framed as a testable mechanistic hypothesis, stop and reformulate the research question.

### Stage 2: Mechanism-led hypothesis generation
1. Generate 2–4 falsifiable hypotheses that explain how the proposed catalyst environment controls the stereochemical outcome.
2. For each hypothesis specify:
   - Proposed activation/stereocontrol model.
   - Evidence strength (direct / analogous / inferred / speculative).
   - Key assumptions about binding, geometry, or intermediate stability.
   - Likely failure mode.
   - Minimal discriminating test.
3. **Gate 2**: If a hypothesis lacks a conceivable falsifying observation, refine or discard it before proceeding.

### Stage 3: Minimal validation design
1. Define a model substrate/catalyst pair that isolates the core stereochemical or mechanistic claim.
2. Specify conceptual variable families (catalyst architecture, substrate class, reaction environment) without operational parameters.
3. Design controls:
   - **Positive control**: known benchmark or authenticated standard.
   - **Negative/component controls**: catalyst-free, ligand-only, metal-only, blocked-directing, or mismatched stereochemistry variants to isolate the catalyst contribution.
   - **Substrate controls**: simplified or biased substrates to distinguish catalyst control from substrate control.
4. Define evaluation metrics (conversion class, selectivity class, stereochemical retention, reproducibility).
5. Define stop conditions (no product above background, ambiguous assignment, loss of stereochemical integrity, irreproducibility).
6. **Gate 3**: If the plan lacks adequate controls to distinguish mechanism from artifact, redesign before advancing.

### Stage 4: Feasibility and selectivity screening
1. Assess whether the model system produces the desired product class with observable selectivity.
2. Compare against background and component controls.
3. **Gate 4**:
   - If background reaction dominates or selectivity is not catalyst-dependent: stop or pivot to a new activation hypothesis (return to Stage 2).
   - If product identity or stereochemical assignment is ambiguous: stop and fix analytical validation.
   - If feasible and selective: proceed to mechanistic discrimination.

### Stage 5: Mechanistic discrimination and attribution
1. Interpret control results to attribute selectivity to the proposed catalyst-substrate interaction rather than substrate bias or background.
2. Use mechanistic probes (competition, solvent sensitivity, catalyst modification, stereochemical inversion tests) to challenge the model.
3. Integrate structural or computational evidence only as support for experimentally observed trends.
4. **Gate 5**:
   - If controls contradict the proposed mechanism: generate alternative hypotheses (return to Stage 2) or bound the claim to an empirical correlation.
   - If mechanism is consistent but not proven: proceed with bounded claims.
   - If mechanism is strongly supported by multiple orthogonal probes: proceed to generality testing.

### Stage 6: Scope and boundary mapping
1. Expand to structurally distinct substrate or transformation classes to test generality.
2. Map electronic, steric, and functional-group trends against the mechanistic model.
3. Identify outlier substrates that expose limits.
4. **Gate 6**:
   - If scope is narrow, bound the claim to the validated substrate class and stop expansion.
   - If trends are coherent and reproducible across multiple classes: proceed to claim bounding.

### Stage 7: Claim bounding and documentation
1. Label every conclusion by evidence strength (observed / inferred / predicted / speculative).
2. Define explicit boundary conditions where the hypothesis should not be extrapolated (metal, ligand, substrate, scale).
3. Document failure modes and residual risks.
4. **Gate 7**: If claims cannot be separated from the specific model system, narrow the scope before final output.

### Stage 8: Iteration or termination
1. If results support the hypothesis, define the next minimal test for the subsequent catalyst generation or substrate class.
2. If results are mixed, redesign the stereocontrol element or activation strategy (return to Stage 2).
3. If results refute the hypothesis, archive the negative result and stop the current line.

## Output Format

Return the research plan in the following sections:
1. **Research question**: One-sentence gap-driven question.
2. **Gap analysis**: Current limitation and why it matters.
3. **Hypotheses**: Table with mechanism, evidence strength, key assumptions, failure modes, and minimal validation.
4. **Conceptual validation plan**: Model system, variable families, controls, metrics, and stop conditions.
5. **Analysis plan**: Feasibility, selectivity, mechanistic attribution, and generality evaluation logic.
6. **Iteration plan**: Decision rules for advancing, redesigning, or abandoning the hypothesis after each result pattern.
7. **Validity and safety notes**: Confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Feasibility gate**: Product formation must exceed background controls and be confirmed by orthogonal structural evidence.
- **Control gate**: Component and negative controls must be sufficient to assign selectivity to the proposed catalyst feature.
- **Stereochemical gate**: Enantiomeric or diastereomeric outcomes must be analytically validated and reproducible before interpreting trends.
- **Mechanistic gate**: Mechanistic claims require consistency across substrate trends, control experiments, and any structural or computational models.
- **Reproducibility gate**: Key claims require independent preparation, replicate measurements, or cross-batch verification.
- **Scope gate**: Generality claims require successful testing across multiple substrate or transformation classes; single-example success must be labeled as tentative.

## Claim Boundaries

- Distinguish **observed** experimental results from **inferred** mechanistic models and **speculative** extensions.
- Do not treat one successful catalyst-substrate combination as a universal rule for all asymmetric catalysis.
- Limit claims to the tested reaction family, catalyst architecture, and substrate class unless independent evidence supports broader validity.
- Separate catalyst-design success from downstream application success; validate each independently.
- Clearly state when a result is an empirical correlation rather than proof of a complete catalytic cycle.

## Failure Modes

| Failure pattern | Diagnostic sign | Recommended action |
|---|---|---|
| Background dominance | Selectivity disappears in catalyst-free controls | Stop; redesign activation strategy or catalyst architecture |
| Substrate bias | Achiral or mismatched catalyst gives similar selectivity | Stop; the stereochemical outcome is substrate-controlled, not catalyst-controlled |
| Stereochemical erosion | Product racemizes or epimerizes under reaction/isolation conditions | Pivot; treat configurational stability as a design constraint |
| Catalyst decomposition | Irreproducible results or speciation evidence | Stop; stabilize catalyst or revise metal/ligand compatibility |
| Narrow scope | Only one substrate class succeeds despite varied electronic/steric probes | Bound claims; do not generalize without further validation |
| Mechanistic contradiction | Controls or probes contradict the proposed binding/transition-state model | Return to hypothesis generation; propose alternative models |
| Analytical ambiguity | Inability to distinguish regioisomers, enantiomers, or decomposition products | Stop; resolve analytical validation before proceeding |

## Validity Checks

Before finalizing any research plan or interpreting results, verify:
- **Confounding factors**: substrate impurity, catalyst decomposition, background reactivity, analytical misassignment, selective crystallization, and moisture/oxygen sensitivity.
- **Reproducibility**: independent catalyst/substrate preparations, replicate runs, and orthogonal analytical confirmation.
- **Statistical validity**: appropriate replicates, uncertainty reporting, and avoidance of overclaiming from single examples or small differences.
- **Analytical sufficiency**: ability to distinguish regioisomers, stereoisomers, retained versus displaced functional groups, and product versus side-product.
- **Boundary conditions**: precursor stability, product configurational stability, catalyst binding dependence, and downstream transformation compatibility.
- **Transferability**: distinguish what source literature demonstrated from what is inferred for the new system.
- **Evidence labeling**: every hypothesis and conclusion tagged by strength (direct / analogous / inferred / speculative).

## Provenance

- Derived from cluster `19.1` (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `organocatalytic-dkr-helicene-research-design`, `organophosphorus-c-h-functionalization-research-skill`, `chiral-epoxy-alcohol-synthesis-exploration`, `p-stereogenic-intermediate-route-design`, `asymmetric-allylic-ligand-research-pattern`, `chiral-epoxide-kinetic-resolution-research`, `photoinduced-regiodivergent-asymmetric-synthesis-workflow`, `cooperative-dinuclear-catalysis-exploration`.
- Preserves no paper-specific operational protocols, numerical results, or material parameters.
