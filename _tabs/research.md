---
layout: page
icon: fas fa-flask
order: 1
title: Research
---

# Research

## Research Interests

- Machine Learning & Deep Learning
- Reinforcement Learning (GRPO)
- Causal Inference
- AI for Science — Molecular Generation

## Projects

### CausalMolGen: Causal Deconfounding for Multi-Hop Molecular Generation

- **Summary:** Molecular generation under precise multi-property constraints. I identified that SMILES-based reward signals in multi-hop reinforcement learning (e.g., M4olGen) are systematically biased by the unmeasured 3D conformation — a latent confounder. Formalizing this through Pearl's causal hierarchy, I proposed a deconfounded reward that integrates Boltzmann-weighted 3D conformational features (ETKDG + geometric encoder) via backdoor adjustment, and reinterpreted GRPO's group-relative update as counterfactual contrast.
- **Results:** Reduces HOMO–LUMO total error from 0.178 → 0.142 (a 20.2% relative improvement) over the 2D-reward baseline, and improves QED/LogP/MW alignment.
- **Methods:** Qwen3-8B backbone, SFT + GRPO, BRICS fragment edits, RDKit conformer generation, DimeNet++ geometric encoder.
