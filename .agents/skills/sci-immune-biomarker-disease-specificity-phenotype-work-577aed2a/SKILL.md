---
name: sci-immune-biomarker-disease-specificity-phenotype-work-577aed2a
description: A reusable end-to-end workflow to link molecular abnormalities to disease phenotypes using contrastive case-control designs that separate disease-specific signals from nonspecific injury or demographic confounding.
scienceevolve-title: "Antibody and immune recognition · biomarker disease specificity phenotype workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Guide agents in designing research that connects molecular observations to disease-specific phenotypes through layered, contrastive evidence. The workflow teaches a transferable method: frame the problem as a specificity challenge, generate competing mechanism hypotheses, stratify cases and controls to isolate disease-relevant signals from nonspecific injury or confounding, and iterate based on discordance and orthogonal validation.

## When to use

Use this skill when the task is to:

- Generate research questions about molecular signatures that may distinguish a disease phenotype from healthy states, unrelated injury, or demographic variation.
- Design contrastive studies comparing disease cases against relevant controls (healthy, alternative disease, nonspecific injury, or stratified demographic groups).
- Plan staged validation to test whether a molecular signal is disease-specific, merely associated with tissue damage, or confounded by population structure.
- Iterate hypotheses when molecular and phenotypic evidence disagree.

Do not use this skill for clinical diagnosis, patient-specific recommendations, treatment selection, or operational wet-lab execution.

## Inputs required

Before producing a research plan, identify:

- **Disease phenotype definition**: the specific phenotype, subtype, or stage under study.
- **Molecular layer**: the type of molecular observation (e.g., marker state, receptor conformation, secreted mediator, lineage marker, recognition determinant).
- **Candidate features**: known or hypothesized molecular abnormalities linked to the phenotype.
- **Comparator groups**: healthy matched controls, alternative disease controls, nonspecific injury contexts, and relevant demographic strata.
- **Evidence types**: available readout categories such as binding, functional, structural, imaging, or lineage evidence.
- **Claim level**: whether the goal is exploratory association, mechanistic hypothesis, biomarker feasibility, or preclinical validation.
- **Constraints**: ethical, biosafety, data-governance, and sample-access limitations.

If inputs are missing, state assumptions explicitly and mark downstream claims as agent-inferred.

## Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, stop or redesign before proceeding.

### Step 1: Frame the specificity problem
- Define the disease phenotype and the molecular observation independently.
- Specify what would count as **disease-specific** versus **nonspecific injury** or **demographic confounding**.
- **Gate 1 — Definition check**: If the phenotype or molecular readout cannot be defined without circularity, stop and refine inputs.

### Step 2: Generate competing mechanism hypotheses
- **Disease-specific model**: the molecular feature directly reflects or drives the disease process.
- **Nonspecific injury model**: the feature appears in any tissue damage, inflammation, or stress response.
- **Confounding model**: the feature correlates with age, sex, ancestry, comorbidity, or technical batch.
- **Mixed/artifact model**: the signal arises from sample handling, detection cross-reactivity, or context-dependent accessibility.
- For each hypothesis, record: evidence strength, key assumptions, predicted contrast pattern across comparators, and likely failure mode.
- **Gate 2 — Testability check**: If no hypothesis can be discriminated with the available comparator groups, stop and redesign the control panel.

### Step 3: Design contrastive case-control stratification
- Select **case groups**: representative disease phenotypes, subtypes, and stages.
- Select **control groups**: healthy matched, alternative disease, nonspecific injury, and demographic strata.
- Define matching or blocking variables to reduce confounding.
- Define biological state or context axes (e.g., active versus resting, injured versus intact) that could modulate the signal.
- **Gate 3 — Discrimination check**: If the control panel cannot separate disease-specificity from nonspecific injury or confounding, redesign before validation.

### Step 4: Plan staged validation funnel
- **Stage A — Minimal viable validation**: Reproduce the molecular signal in disease versus healthy contexts with sample-integrity and detectability checks.
- **Stage B — Specificity testing**: Test against alternative diseases, nonspecific injury contexts, and demographic strata. Include negative, positive, specificity, and internal controls.
- **Stage C — Mechanism discrimination**: Separate detection (observation/binding) from regulation (functional effect) from mechanism (causal pathway). Use orthogonal readouts, competition logic, or state-specific contrasts.
- **Stage D — Orthogonal replication**: Confirm in independent samples, batches, or assay modalities; use blinded scoring for subjective readouts.
- **Gate 4 — Assay validity check**: If Stage A fails reproducibility or controls are invalid, stop and troubleshoot assay validity before advancing to mechanistic claims.

### Step 5: Analyze concordance and discordance
- Pre-register scoring rules, categories, and analysis units before examining results.
- Quantify signal enrichment in disease versus each control stratum.
- Assess state or context dependence of the signal.
- Identify discordance (molecular signal without phenotype, or phenotype without signal) and treat it as a hypothesis-update signal, not automatic error.
- **Gate 5 — Coherence check**: If discordance exceeds the expected rate without a plausible model, return to Step 2 to reformulate hypotheses.

### Step 6: Update hypotheses and decide next action
- **Supported**: signal is disease-specific, reproducible, and mechanistically coherent.
- **Partially supported**: signal is real but context-dependent, subtype-restricted, or partially confounded.
- **Revised**: signal reflects nonspecific injury, an unexpected biological state, or a different molecular target.
- **Rejected**: controls or orthogonal evidence explain the observation better than disease-specificity.
- **Gate 6 — Decision check**:
  - If **rejected**, stop the line of inquiry.
  - If **partially supported**, define boundary conditions and plan the smallest targeted follow-up to reduce uncertainty.
  - If **supported**, plan broader validation or generalization tests before translational claims.

### Step 7: Bound claims and document provenance
- Label each output claim as observed, inferred, or speculative.
- State generalization boundaries (species, tissue, disease subtype, assay context).
- Verify that no clinical recommendation or operational protocol is included.

## Output Format

When using this skill, produce:

1. **Research question** — Disease phenotype, molecular layer, and specificity framing.
2. **Competing hypotheses table** — For each hypothesis: mechanism, evidence strength, key assumptions, predicted contrast pattern, likely failure mode, and minimal validation needed.
3. **Contrastive study design** — Case/control strata, matching variables, state/context axes, and controls.
4. **Staged validation plan** — Stages A–D with gate criteria, variables, readouts, and stop/pivot conditions.
5. **Analysis plan** — Scoring logic, concordance/discordance rules, specificity metrics, uncertainty handling, and evidence grading.
6. **Iteration decision log** — Hypothesis status updates, conditions for revise/pivot/stop, and the next minimal discriminator.
7. **Validity and ethics statement** — Confounders, reproducibility checks, boundary conditions, and safety/ethics constraints.

## Validation Gates

| Gate | Check | Failure Action |
|------|-------|----------------|
| Gate 1 | Phenotype and molecular readout are independently defined and non-circular. | Stop; refine inputs. |
| Gate 2 | At least one hypothesis is discriminable with the planned comparator groups. | Stop; redesign control panel. |
| Gate 3 | Control panel can separate disease-specificity from nonspecific injury and confounding. | Stop; redesign stratification. |
| Gate 4 | Stage A reproducibility and control validity are satisfied. | Stop; troubleshoot assay. |
| Gate 5 | Discordance rate is consistent with a plausible model. | Return to hypothesis generation. |
| Gate 6 | Evidence supports a clear decision: supported, partially supported, revised, or rejected. | Stop if rejected; bound and follow up if partial. |

## Claim Boundaries

- Distinguish **disease detection** from **disease mechanism**; do not infer causation from association or binding alone.
- Distinguish **in vitro/model evidence** from **organism-level or clinical relevance**.
- Limit claims to the validated sample classes, disease subtypes, species, tissues, and assay contexts.
- Do not generalize from rare subgroups, single cohorts, or small discovery sets to the entire disease domain.
- Do not present exploratory associations as validated biomarkers or clinical recommendations.

## Failure Modes

- **Nonspecific signal**: mistaken for disease-specificity because injury or demographic controls are missing or mismatched.
- **Confounding**: batch effects, sample quality gradients, or demographic structure create spurious associations.
- **Detection artifact**: cross-reactivity, context-dependent accessibility, or preparation-induced signals misinterpreted as biology.
- **Overfitting**: molecular patterns fit a small, heterogeneous cohort but fail in broader validation.
- **Mechanism overreach**: binding or observational evidence is treated as proof of functional necessity or causal mechanism.
- **Clinical extrapolation**: exploratory associations are converted into diagnostic, prognostic, or therapeutic claims without appropriate validation.

## Validity Checks

- **Confounding**: Evaluate batch, tissue source, sample quality, comorbidity, treatment history, and demographic variables before biological interpretation.
- **Specificity**: Require negative, alternative-disease, nonspecific-injury, and demographic-stratum controls.
- **Reproducibility**: Demand independent samples, orthogonal readouts, and blinded scoring where applicable.
- **Statistical validity**: Predefine endpoints and subgroup rules; avoid pseudoreplication; report uncertainty and effect sizes.
- **Boundary clarity**: State where the model should not be applied (other species, tissues, disease stages, or untested molecular states).

## Provenance

- Synthesized from cluster `3`, subcluster `3.0.split0`.
- Derived from source skills: `transformation-lineage-clonality-research`, `mediator-target-functional-necessity-immunology`, `glycan-sensitive-opsonin-exploration`, `melanosome-marker-localization-research`, `activated-receptor-state-specific-research`, `shared-epitope-research-exploration`, `context-dependent-epitope-discovery`, `plant-allergen-crossreactivity-workflow`.
- Excluded skill IDs: `1e5b9a9bfe0dfdcd`, `35bbbf64ab17387b`, `4096b10f68c1208c`, `4b4a73fa2a97bb18`, `77d1628911555724`.
