---
authors:
  - Raphael Amorim
tags:
  - reproducibility
  - benchmarking
  - sparkarena
---

# Introducing Spark Arena: A Community-Driven LLM Performance Leaderboard

![Spark Arena logo](/posts/1-intro/img/spark-arena-logo.svg)

## The Problem: Reproducibility in the Wild

Over the past weeks, I've been collaborating with @eugr on a challenge we keep seeing across DGX Spark threads. It's not that people aren't experimenting—they absolutely are. The real issue? **Lack of reproducibility and indexing of shared experiments.**

Every time a new model drops, we all run through the same chaotic loop:

1. Read the model card + docs
2. Try different runtimes (vLLM / TensorRT-LLM / SGLang)
3. Tune quantization (NVFP4, MXFP4, AWQ, etc.)
4. Adjust `--kv-cache-dtype`, attention backend, memory utilization
5. Experiment with multi-node configs
6. Post partial flags in a thread

Then weeks later, someone asks: *"How did you get that throughput number again?"*

And you realize you can't quite remember:
- The exact CLI invocation
- The runtime backend versions
- The node topology
- The memory constraints
- The batching and concurrency parameters

## The Solution: Spark Arena

We're formalizing this. **Meet [Spark Arena](https://spark-arena.com/): A community-driven LLM Performance Leaderboard for the Spark.**

### What Spark Arena Provides

- **Structured benchmark submissions** with full reproducibility
- **Complete CLI + runtime flag capture**—no more guessing games
- **Quantization + backend metadata** baked into every result
- **Automated submission pipelines** to reduce friction
- **Comparable results across Spark owners**—apples-to-apples benchmarking
- **End-to-end executable "recipes"** that others can actually run
- **Deep integration with our community tools** (Docker runtime, Llama-Benchy export formats)

### Why This Matters

The goal is to turn benchmark results into **executable and searchable knowledge**—not just screenshots or throughput numbers floating in Discord.

And critically: this data comes from *real NVIDIA Developer Forum Spark owners* running on their own nodes, under real hardware constraints. This isn't lab-only data. It reflects actual tuning tradeoffs and real-world performance profiles from the community.

## How You Can Help

The value of this platform scales directly with **community participation**:

- **If you're benchmarking models**, consider submitting your results to Spark Arena
- **If you care about reproducibility**, help us define what metadata is mandatory
- **If you've struggled reproducing someone else's setup**, tell us what context was missing
- **If you've built internal benchmarking scripts**, let's discuss integration pathways

Multi-node setups, high-concurrency workloads, aggressive quantization experiments—we want to see it all.

## The Bigger Picture

If we standardize how we share configs and results, we reduce duplicated work across the entire Spark ecosystem. Every hour spent re-tuning the same model with the same runtime is an hour not spent on novel optimizations or new patterns.

Let's make benchmarking on Spark **composable, reproducible, and—most importantly—accessible to everyone.**

**Feedback welcome.** Especially from those pushing the boundaries.

---

*Raphael Amorim*
