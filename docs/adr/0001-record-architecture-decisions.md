# ADR-0001: Record Architecture Decisions

- **Status:** ✅ Accepted
- **Date:** 2026-11-06
- **Deciders:** The Architecture Council (1 member)
- **Supersedes:** Nothing (this is the first one, which is very exciting)

## Context

FreshWDL has, historically, been developed without a single Architecture Decision Record. Decisions such as "use JavaScript", "draw gauges on a canvas" and "copy the temperature widget three times" were made **implicitly**, by simply writing the code and having it work.

This is a significant risk. 😟 Without ADRs, future contributors have no way of knowing *why* the weather is displayed, only *that* it is displayed.

Industry best practice (a blog post we read) suggests that any project with more than one file should maintain a log of architecturally significant decisions.

## Decision

We will record all architecturally significant decisions using Architecture Decision Records, as described by Michael Nygard.

Each ADR will:

1. Be numbered sequentially, with four digits of zero padding to support up to 9,999 decisions. 🚀
2. Live in `docs/adr/`.
3. Contain a Status, Context, Decision and Consequences section.
4. Use at least three emojis, for readability.

Decisions will be considered "architecturally significant" if they affect the structure, behaviour, or vibes of the system.

## Consequences

### Positive ✅

- Future maintainers will be able to understand the reasoning behind every decision.
- The repository will look significantly more professional.
- We now have a place to put our feelings.

### Negative ❌

- The number of Markdown files in the repository will increase from 2 to approximately 30.
- Each decision will now take longer to make than to implement.

### Neutral 😐

- This ADR is itself an architecture decision, and is recorded in an ADR, which is consistent and also slightly unsettling.
