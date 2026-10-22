---
name: sci-fiber-interface-mechanism-discovery-workflow-524a62c1
description: A reusable end-to-end workflow for translating practical bottlenecks into mechanism-linked hypotheses, designing discriminating validation with strong controls, analyzing converging evidence, and iterating to bound claims in interfacial materials research.
scienceevolve-title: "Fiber composites and battery materials · interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide an agent to move from a practical performance bottleneck to a testable mechanistic hypothesis, validate it through controlled experiments and converging diagnostics, and iterate until claims are appropriately bounded by evidence. This workflow abstracts the shared scientific route across surface, fiber, composite, polymer, and electrochemical interface studies.

# When to use

Use this skill when a user asks to:

- Propose new research questions for a material system where interfacial behavior governs performance.
- Design experiments that link a candidate mechanism to observable outcomes through discriminating controls.
- Evaluate whether a proposed concept is mechanistically justified and practically bounded.
- Translate a literature-inspired idea into a transferable research plan with hypotheses, metrics, and stopping rules.

Do not use this skill to provide clinical recommendations, executable wet-lab protocols, hazardous synthesis instructions, operational safety parameters, or paper-specific numerical results.

# Inputs required

Ask for or infer the following before producing a plan:

1. **Target system and application context:** the material class, device format, and operating environment.
2. **Practical bottleneck:** the failure mode or performance gap that limits deployment.
3. **Candidate mechanism or design lever:** the proposed interfacial, transport, chemical, or structural feature intended to address the bottleneck.
4. **Intended claim level:** proof-of-concept, mechanism test, comparative benchmark, durability study, or translational feasibility.
5. **Constraints:** safety, regulatory, environmental, mechanical, biological, or manufacturing boundaries.
6. **Available evidence:** prior data, literature context, preliminary observations, or known limitations.

If inputs are incomplete, state assumptions explicitly and label downstream claims as inferred.

# Core Workflow

Follow this ordered route. At each decision gate, choose proceed, pivot, redesign, or stop.

## 1. Frame the bottleneck and decompose failure modes
Start from the practical limitation, not from a preferred material. Decompose the system into candidate failure modes (e.g., interfacial instability, transport limitation, weak anchoring, conversion inefficiency, mechanical degradation). Identify which mode is the dominant limiter under target conditions.

## 2. Generate mechanism-linked hypotheses
For each prioritized failure mode, produce at least one hypothesis in the form:  
*If [intervention X] changes [mechanism Y], then [diagnostic Z] should shift, producing [performance change P] without worsening [coupled failure mode C].*

Annotate every hypothesis with:
- **Evidence strength:** high, medium, low, or speculative.
- **Key assumptions:** what must be true for the mechanism to hold.
- **Likely failure modes:** how the hypothesis could fail even if one metric improves.
- **Minimal falsification test:** the smallest observation that would reject the hypothesis.

## 3. Design minimal viable validation
Define:
- **Variables:** independent (intervention, architecture, chemistry), dependent (performance, mechanism probe), and context (normalization basis, format, environment).
- **Control hierarchy:** untreated baseline, partial-treatment control, mechanism-isolating control, negative control, and positive control when a relevant benchmark exists.
- **Primary metrics:** endpoints that directly test the bottleneck.
- **Coupled-failure metrics:** endpoints that reveal whether the intervention shifts the problem elsewhere.
- **Stop conditions:** criteria that trigger redesign or abandonment (e.g., no improvement over baseline, ambiguous controls, unresolved confounders, safety concerns).

## 4. Collect converging evidence
Gather two classes of evidence in parallel:
- **Performance evidence:** system-level metrics under consistent conditions.
- **Mechanism evidence:** diagnostic probes that directly test the proposed intermediate, interface, transport pathway, or structural change.

## 5. Analyze and attribute
Execute layered analysis in this order:
1. **Quality review:** confirm control performance, traceability, and replicate consistency.
2. **Comparison against controls:** determine whether the effect is specific to the proposed mechanism or explainable by generic factors (conductivity, loading, surface area, format differences).
3. **Mechanism attribution:** check whether mechanism diagnostics changed as predicted.
4. **Trade-off mapping:** identify whether gains in one metric coincide with losses in another.
5. **Boundary assessment:** test whether results hold under more demanding conditions or whether they depend on narrow, favorable setups.

## 6. Decision gate
- **Proceed:** mechanism evidence and performance evidence converge; move to stronger validation, broader boundaries, or claim bounding.
- **Pivot:** partial support suggests the bottleneck is elsewhere or coupled; revise the hypothesis, change the design lever, or add a complementary intervention.
- **Redesign:** ambiguous results demand additional discriminating controls or diagnostics before conclusions.
- **Stop:** no reproducible effect, severe safety flags, dominant artifacts, or unsupported extrapolation.

## 7. Iterate
Return to Step 2 or 3 with an updated hypothesis that addresses the weakest causal link. After each iteration, produce:
- revised hypothesis and evidence strength;
- supporting and contradicting observations;
- next minimal test;
- updated claim boundary.

## 8. Bound claims and define transfer limits
Classify every conclusion as:
- **Paper-supported:** directly demonstrated in a comparable system.
- **Inferred:** mechanistically plausible but lacking direct validation in the current system.
- **Speculative:** outside tested boundaries.

State explicitly where the mechanism may fail (different substrates, chemistries, environments, loading levels, or device formats).

# Output Format

When using this skill, return:

1. **Research question** — one concise question framed around the bottleneck and target context.
2. **Gap and rationale** — why existing strategies are insufficient and what remains unproven.
3. **Hypothesis portfolio** — mechanism-linked hypotheses with evidence strength, assumptions, failure modes, and falsification tests.
4. **Validation plan** — variables, control hierarchy, minimal viable validation, coupled-failure metrics, and stop conditions.
5. **Analysis plan** — quality checks, control attribution, mechanism diagnostics, trade-off mapping, and boundary tests.
6. **Iteration plan** — decision rules for proceed, pivot, redesign, and stop; next minimal test.
7. **Claim boundary statement** — classification of evidence and explicit transfer limits.
8. **Validity and safety notes** — confounders, reproducibility risks, extrapolation limits, and non-operational safety boundaries.

# Validation Gates

Before advancing past each stage, confirm:

- **Stage 1 (Framing):** The bottleneck is defined independently of a preferred solution.
- **Stage 2 (Hypothesis):** Each hypothesis is falsifiable and annotated with evidence strength.
- **Stage 3 (Design):** Controls are sufficient to isolate the proposed mechanism from generic physical effects.
- **Stage 4 (Collection):** Both performance and mechanism diagnostics are planned or obtained.
- **Stage 5 (Analysis):** Attribution logic is checked against the control hierarchy.
- **Stage 6 (Decision):** The chosen action is justified by the evidence pattern, not by a single metric.
- **Stage 7 (Iteration):** Only one causal link is revised at a time unless the design includes controls for joint effects.
- **Stage 8 (Claim):** Claims are labeled and bounded to the tested system.

# Claim Boundaries

- Treat single-paper or single-system observations as demonstrations, not field consensus.
- Distinguish paper-supported patterns from agent inferences and user assumptions.
- Do not extrapolate to untested substrates, chemistries, biological environments, clinical settings, or manufacturing scales without labeling the leap as speculative.
- Separate mechanism demonstration from practical readiness; require realistic-loading, durability, or full-system evidence before feasibility claims.

# Failure Modes

- **Mechanism misattribution:** Performance improves for reasons unrelated to the proposed mechanism (e.g., loading, conductivity, surface area, format artifact).
- **Confounded controls:** Missing or mismatched controls allow generic effects to masquerade as specific ones.
- **Coupled bottleneck shift:** An intervention solves one failure mode but exacerbates another (e.g., improved conversion but worse stability).
- **Irreproducibility:** Uncontrolled batch, preparation, or environmental variability produces inconsistent results.
- **Boundary overreach:** Claims are generalized beyond the tested chemistry, architecture, or operating condition.
- **Safety or ethics lapse:** Research expands into hazardous or regulated territory without appropriate oversight.

# Validity Checks

Before finalizing any research plan or conclusion, check:

- **Confounding:** Are substrate variability, processing artifacts, leachates, assay interference, and normalization differences addressed?
- **Control adequacy:** Do controls isolate the mechanism from physical, chemical, and environmental alternatives?
- **Mechanistic specificity:** Is there a diagnostic that distinguishes the proposed mechanism from generic effects?
- **Reproducibility:** Are replicates, uncertainty, independent preparations, and excluded data reported?
- **Statistical validity:** Are endpoints predefined, effect sizes reported, and significance interpreted with uncertainty?
- **Boundary clarity:** Are paper-supported, inferred, and speculative claims clearly separated?
- **Coupled consequences:** Has the plan checked whether improving one metric worsens another?
- **Safety and compliance:** Are hazardous, biological, clinical, or regulatory boundaries identified without providing unsafe operational details?

# Provenance

Synthesized from cluster 27.0 (subcluster 27.0), workflow archetype: end-to-end mechanism discovery and validation. Source skills: `fiber__10.1002_adfm.202401387`, `2502.00696`, `10.1016_j.ensm.2019.08.025`, `fiber__10.1177_1558925020922217`, `fiber__10.1016_j.ijbiomac.2017.06.095`, `10.1002_aenm.202003493`, `10.1002_advs.202300860`, `10.1002_adfm.202213966`.
