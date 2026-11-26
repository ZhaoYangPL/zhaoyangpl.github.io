---
layout: page
title: "Sparse and Linear Attention: Selection, Memory, and Online Learning"
date: 2026-11-26 00:00:00 +0800
tags: [Attention, Linear Attention, Memory]
description: "Brief seminar notes on sparse retrieval, recurrent memory, and the online learning view of attention."
math: true
---

{% include note-meta.html %}

*Reflections on a senior colleague's seminar on November 25, 2026, and follow-up discussions.*

The most useful idea I took away was a distinction between two ways of making attention efficient: **sparse attention selects which history to access; linear attention changes how history is represented and updated.** Understanding their trade-offs makes the progression from softmax to recurrent memory much easier to follow.

## 1. Why softmax?

Attention separates relevance scoring from weight allocation. Given scores $s_j=q^\top k_j$, softmax solves an entropy-regularized optimization problem:

$$
p^*=\arg\max_{p\in\Delta}\{\langle p,s\rangle+\tau H(p)\}
=\operatorname{softmax}(s/\tau),
$$

where $\Delta$ is the probability simplex and $H(p)=-\sum_jp_j\log p_j$. Temperature balances concentration against entropy. The optimal value is LogSumExp, whose gradient is softmax: a useful connection between attention and convex duality.

Nonnegative weights summing to one make the output a convex combination of values. However, full causal attention still compares every query with all preceding keys. FlashAttention improves memory traffic without removing this quadratic arithmetic cost.

## 2. Sparse attention: select the history

Sparse attention keeps softmax but restricts each query to a subset of tokens. A sliding window selects by distance; dynamic methods select by estimated relevance, often combining local access with compressed global information.

The challenge becomes deciding what to retrieve without spending the original attention cost on selection. Scoring every historical token to find the top candidates can retain quadratic work. Also, **reading fewer KV entries does not necessarily mean storing fewer**: arbitrary future retrieval may still require the full history.

For one head, with sequence length $T$, key/value width $d$, and $w$ selected tokens per query:

| Mechanism | Sequence compute | Decode per token | History storage |
| --- | --- | --- | --- |
| Full | $O(T^2d)$ | $O(Td)$ | $O(Td)$ |
| Sparse | $O(Twd)$* | $O(wd)$* | Depends on retention |
| Linear | $O(Td^2)$ | $O(d^2)$ | $O(d^2)$ |

*Sparse costs exclude selection overhead; linear costs assume a recurrent state of fixed width. Projection and feed-forward costs are omitted.*

## 3. Linear attention: maintain a memory

Removing softmax exposes an associative rearrangement:

$$
o_t=\sum_{j\le t}(q_t^\top k_j)v_j=S_t^\top q_t,
\qquad S_t=S_{t-1}+k_tv_t^\top.
$$

The matrix $S_t\in\mathbb R^{d\times d}$ summarizes history independently of the current query. “Linear” refers to complexity in sequence length. Softmax cannot simply be moved through the matrix product; removing it changes the model.

Kernelized variants instead use a separable similarity $\phi(q)^\top\phi(k)$, maintaining both a matrix state and a normalization sum. Positive features can preserve nonnegative normalized weights, but a fixed finite feature map generally replaces or approximates the exponential kernel.

Compression introduces interference: nonorthogonal keys share memory directions. Repeatedly adding outer products also keeps writing an association even when it is already stored correctly.

## 4. DeltaNet: learn from the prediction error

Treat the state as an online regression model. One gradient step on

$$
\ell_t(S)=\tfrac12\|S^\top k_t-v_t\|^2
$$

gives the delta rule:

$$
S_t=S_{t-1}+\beta_tk_t(v_t-S_{t-1}^\top k_t)^\top.
$$

The update reads the existing association and writes its residual. With a unit-norm key and $\beta_t=1$, it exactly replaces the association along that key, although other nonorthogonal associations can still change.

**Gated DeltaNet** first decays the old state by a scalar; **Kimi Delta Attention** uses channel-wise decay. Both add control over forgetting to error-driven writing. This online learning view was the talk's most illuminating shift for me: designing attention becomes designing how a limited memory learns.

## 5. State transitions connect memory and position

For $S_t=A_tS_{t-1}+\beta_tk_tv_t^\top$, with $S_0=0$, expanding the recurrence yields

$$
o_t=\sum_{j\le t}\beta_j
\bigl(q_t^\top A_t\cdots A_{j+1}k_j\bigr)v_j.
$$

RoPE has a related score structure, with repeated fixed rotations between query and key. Here the transitions can depend on intervening tokens and include decay or directional erasure. This is an algebraic connection; general gated transitions need not be rotations or preserve norms.

For my work on agent context management, this suggests three connected questions: **what should the harness retain, what should attention retrieve, and how should internal memory evolve?** Hybrid architectures combine explicit retrieval with recurrent compression. Lower computational cost still leaves information quality and memory interference as central problems.

### Further reading

[Transformers are RNNs](https://arxiv.org/abs/2006.16236) · [Fast Weight Programmers](https://arxiv.org/abs/2102.11174) · [Gated Delta Networks](https://arxiv.org/abs/2412.06464) · [Kimi Linear](https://arxiv.org/abs/2510.26692)

[Back to Notes]({{ "/notes/" | relative_url }})
