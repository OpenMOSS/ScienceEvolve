<a id="top"></a>

# ScienceEvolve Skill library

[← Back to project README](../../README.md#scientific-skills) · **English** | [简体中文](README_zh-CN.md#top)

**899 built-in Skills: 24 general/platform Skills + 875 scientific method Skills.**

Browse by purpose. Runtime references retain the original `builtin:<name>` IDs; category paths are not part of an ID.

| Library | Count | Catalog |
| :--- | :--- | :--- |
| General & platform | 24 | [general/](general/README.md#top) |
| Scientific methods | 875 · 12 areas | [scientific/](scientific/README.md#top) |

Select fixed or automatic Skills per Agent in the Web UI or through SDK `skills` / `autoSkills`. Only selected Skills and support dependencies are staged for that Agent. Skills do not supply credentials, datasets, or experiment resources.

## Agent4Sci

The three builtins `agent4sci-research`, `agent4sci-experiment`, and `agent4sci-checklist` cover research → experiment → review. Select all three fixed Skills for the complete flow; standalone later phases require prior-stage artifacts. Support files, pinned provenance and the Apache-2.0 license are included; no hourly reminders are installed. [Usage and example](https://github.com/OpenMOSS/ScienceEvolve/blob/main/sdk/docs/agent4sci.md).
