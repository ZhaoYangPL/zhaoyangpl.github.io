---
layout: page
icon: fas fa-flask
order: 1
title: Research
---

# Research

## Research Interests

- LLM Post-Training & Reinforcement Learning
- Online Optimization for LLM Inference & Serving
- Agent Systems & Harness Optimization
- Context & Memory Management for Long-Horizon LLM Agents

## Projects

### Adaptive Context Compaction for Long-Horizon LLM Agents

- **Affiliation:** Zhejiang University · Undergraduate Researcher (Advisor: Prof. Zhiyu Zhang)
- **Period:** Aug. 2026 – Present
- **Summary:** Studying adaptive context compaction in agent harnesses for production coding agents. Identified a coupled trade-off: older trajectory information can remain task-critical, yet rewriting the prompt prefix during compaction degrades prompt-cache reuse and increases re-prefill cost. Developing a training-free online decision rule for whether and when to compact, balancing context-budget pressure against summarization overhead, cache-recomputation cost, and the risk of discarding information needed later in the trajectory.

### Fragment-Level Molecular Optimization with LLM Post-Training

- **Affiliation:** Mila – Quebec AI Institute & Université de Montréal · Remote Research Assistant (Advisor: Prof. Bang Liu)
- **Period:** Feb. 2026 – Jun. 2026
- **Summary:** Multi-objective molecular optimization with an LLM-based Analyse–Plan–Edit–Verify workflow under QED, LogP, molecular weight, and HOMO/LUMO constraints. Built a 4,200-example dataset decomposing optimization into property analysis, edit planning, fragment modification, and verification; represented molecules as BRICS fragments with add/remove/replace edits; and set up multi-turn GRPO experiments with composite reward design over validity, property alignment, and structural similarity.
- **Link:** [GitHub](https://github.com/ZhaoYangPL/Fragment-Level-Molecular-Optimization-with-LLM-Post-Training)
