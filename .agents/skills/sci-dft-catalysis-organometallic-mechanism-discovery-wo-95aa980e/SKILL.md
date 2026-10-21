---
name: sci-dft-catalysis-organometallic-mechanism-discovery-wo-95aa980e
description: A reusable end-to-end workflow for generating mechanistic hypotheses, designing minimal validation studies, and iterating toward defensible catalytic mechanism claims in organometallic and related catalysis research.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis organometallic mechanism discovery workflow 2"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Use this skill to design research programs in catalysis and organometallic chemistry where observed reactivity, selectivity, or intermediate behavior must be explained by a testable mechanistic model. The workflow transfers a general pattern: define the mechanistic gap, generate competing hypotheses, design non-operational validation plans with strong controls, analyze evidence in layers, and iterate until claims are bounded by data.

# When to use

Trigger this skill when a user asks to:
- propose new research questions in transition-metal-catalyzed or main-group catalytic transformations;
- design experiments to discriminate between competing mechanistic pathways;
- reason from observed intermediates, selectivity, inhibition, or side products toward a catalytic mechanism;
- plan iterative campaigns that update hypotheses after substrate-scope, control, or trapping results;
- evaluate whether a proposed catalyst, substrate, or condition set supports a specific elementary-step sequence.

# Inputs required

Before generating a plan, request or inspect:
- Target transformation class and the bond-forming or bond-breaking objective.
- Candidate substrate families and known or suspected activation modes.
- Candidate catalyst or reagent families and available mechanistic precedents.
- Observed anomalies or gaps that motivate the study: unexpected selectivity, missing intermediates, competing pathways, or scope boundaries.
- Available analytical readouts for product identity, intermediate detection, selectivity, and mass balance.
- Constraints: safety boundaries, scale limits, analytical access, and whether the task is hypothesis generation only or includes non-operational experimental design.
- Success criteria: mechanistic discriminant, selectivity target, or scope boundary to be established.

# Core Workflow

1. **Frame the mechanistic gap.** State what is unknown (active species, rate-limiting step, selectivity origin, intermediate identity, or catalyst resting state) and why it matters for the target transformation.
2. **Generate competing hypotheses.** Propose at least two mechanistic models that could explain the observed outcome. For each hypothesis:
   - Define the core catalytic sequence or elementary-step order.
   - Map substrate, catalyst, and environmental features to mechanistic roles.
   - Assign evidence strength (high / medium / low / speculative).
   - State key assumptions and the observation that would most strongly weaken the hypothesis.
3. **Design minimal validation.** Define the smallest conceptual experiment set that can discriminate between the leading hypotheses:
   - Select representative substrate and catalyst/reagent classes.
   - Define primary readouts (conversion, selectivity, intermediate accumulation, product connectivity).
   - Specify stop conditions for ambiguous, unsafe, or uninterpretable results.
4. **Build the control matrix.** Include:
   - **Positive control:** a benchmark expected to perform under the model.
   - **Negative control:** a substrate or catalyst variant lacking the proposed critical feature.
   - **Mechanistic control:** a variable predicted to inhibit, accelerate, or redirect the pathway.
   - **Background control:** absence of catalyst or reagent to detect non-catalytic processes.
   - **Orthogonal control:** an alternative readout or trapping strategy that distinguishes competing intermediates.
5. **Collect and separate evidence.** Gather product identity, selectivity trends, intermediate profiles, side-product distributions, and catalyst integrity data. Record raw observations before assigning mechanistic interpretation.
6. **Analyze with a decision gate.**
   - Construct an evidence table: hypotheses versus observations.
   - Classify evidence as direct (isolation / competence), indirect (kinetic / isotopic / spectroscopic), or analogical.
   - Map side products and failures to competing pathways or boundary conditions.
   - **Gate A:** If evidence supports only one hypothesis with direct or convergent indirect support, proceed to scope expansion (Step 7a).
   - **Gate B:** If evidence is ambiguous or supports multiple hypotheses, proceed to targeted discrimination (Step 7b).
   - **Gate C:** If evidence contradicts all hypotheses, return to Step 2 to reformulate.
7. **Iterate and refine.**
   - **7a. Scope expansion:** Only after Gate A, expand substrate or catalyst scope one variable dimension at a time. Continue only if boundary tests remain consistent with the leading hypothesis.
   - **7b. Targeted discrimination:** After Gate B, design one additional experiment that falsifies the leading hypothesis. Update rankings and return to Step 5.
   - **Stop conditions:** Halt if the leading hypothesis is contradicted by controls; if product formation occurs without the proposed critical feature; if results are dominated by decomposition or background reactivity; or if safety / reproducibility thresholds are breached.
8. **Bound the claim.** Limit conclusions to the tested substrate classes, catalyst families, and conditions. Distinguish demonstrated facts from inferred mechanisms and speculative extensions.

# Output Format

When using this skill, return results in this structure:

```text
1. Research question
   - Target transformation:
   - Mechanistic gap:
   - Boundary of claim:

2. Competing mechanistic hypotheses
   - H1: [claim] | Evidence strength: [high/medium/low] | Key assumptions: [...] | Failure mode: [...]
   - H2: [claim] | Evidence strength: [high/medium/low] | Key assumptions: [...] | Failure mode: [...]

3. Minimal validation plan
   - Representative substrate/catalyst classes:
   - Controls:
   - Diagnostic variables:
   - Primary readouts:
   - Stop conditions:

4. Analysis plan
   - Evidence table:
   - Selectivity interpretation:
   - Intermediate-competence tests:
   - Uncertainty and boundary notes:

5. Iteration path
   - If result supports H1:
   - If result supports H2:
   - If result is ambiguous:
   - If result contradicts both:

6. Validity and safety notes
   - Non-operational risk considerations:
   - Compliance and expert-review requirements:
   - Extrapolation boundaries:
```

# Validation Gates

- **Gap clarity gate:** The research question must name a specific mechanistic uncertainty, not merely request a new reaction.
- **Hypothesis discrimination gate:** At least two competing hypotheses must be testable with the proposed validation plan.
- **Control adequacy gate:** Positive, negative, mechanistic, and background controls must be defined before interpreting results.
- **Evidence classification gate:** Observations must be separated from interpretations; direct evidence must be distinguished from indirect or analogical support.
- **Iteration gate:** Scope expansion is permitted only after the leading hypothesis survives a diagnostic control designed to falsify it.
- **Claim bounding gate:** Conclusions must be limited to the tested chemical space and evidence strength.

# Claim Boundaries

- Do not generalize from a single substrate or catalyst example to an entire reaction class.
- Do not treat an observed intermediate as product-competent without a competence test or direct conversion evidence.
- Do not extrapolate mechanistic conclusions beyond the tested electronic, steric, or structural regimes.
- Do not present analogical or computational support as experimental proof.
- Distinguish paper-supported precedent from agent-inferred extensions for new systems.

# Failure Modes

- **Hypothesis collapse:** Product formation occurs without the proposed critical feature, or the positive control fails while negative controls show comparable activity.
- **Intermediate misassignment:** An observed species is a stable off-cycle resting state rather than a productive intermediate.
- **Background dominance:** Results are driven by non-catalytic, thermal, or uncontrolled background reactivity.
- **Analytical ambiguity:** Product or intermediate identity is unresolved, leading to mechanistic overfitting.
- **Scope bias:** Successful examples cluster in a narrow regime, suggesting hidden confounders.
- **Catalyst decomposition:** Observed activity arises from ill-defined decomposition products rather than the intended active species.
- **Irreproducibility:** Key observations vary across replicates without a testable explanation.

# Validity Checks

Before presenting conclusions, verify:
- **Confounding controls:** Did blank, negative, positive, and mechanistic controls behave as predicted?
- **Intermediate validity:** Is the observed intermediate product-competent, or merely a stable off-cycle species?
- **Substrate-scope bias:** Are successful examples clustered in one narrow electronic or steric regime?
- **Selectivity attribution:** Could isomerization, purification, or secondary transformation explain the reported distribution?
- **Catalyst specificity:** Does changing the catalyst family or ligand environment preserve or erase the effect?
- **Analytical confidence:** Are product identities supported by orthogonal characterization and mass balance where possible?
- **Reproducibility:** Are key observations replicated or supported by independent runs?
- **Extrapolation boundary:** Are claims limited to the tested substrate and catalyst families?
- **Statistical validity:** Are comparisons based on sufficient replicates, uncertainty estimates, or clearly labeled qualitative evidence?
- **Safety and ethics:** Are all proposals at the research-design level, with hazardous execution details excluded?

# Provenance

- Derived from cluster 7 / subcluster 7.0: observable-driven mechanism discovery and validation.
- Synthesized from source skills: test0530, test0044, test1566, test1605, test0170, test1915, test1608, test1389.
- Represents a semantic merge of shared workflow routes across organometallic catalysis, C-H activation, cycloaddition, tandem catalysis, and strained-heterocycle mechanistic studies.
