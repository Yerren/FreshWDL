# ADR-0014: Revert ADR-0011 (Rain Restored)

- **Status:** ✅ Accepted
- **Date:** 2026-11-06 (approximately 40 minutes after ADR-0011)
- **Supersedes:** [ADR-0011](0011-deprecate-rain.md)

## Context

[ADR-0011](0011-deprecate-rain.md) deprecated rain, on the basis that it had not rained during the sprint.

Shortly after ADR-0011 was merged, it rained. 🌧️

Several users reported that the rain gauges, which had been hard-coded to display `0`, were "wrong" and "showing 0 while I'm literally standing in it". One user sent a photo.

A post-incident review identified the following root causes:

1. The decision to deprecate rain was based on a sample size of one sprint.
2. The Architecture Council made the decision while sitting next to a window, on a sunny afternoon, which introduced **selection bias**.
3. Nobody checked the forecast, despite this being a weather application.

## Decision

Rain is restored. ☔

- The `#[deprecated]` attribute is removed from `freshwdl-rain`.
- The rain gauges once again display the values from `clientraw.txt`.
- A regression test, `it_should_not_rain_indoors`, has been added to ensure we model rain correctly. (It checks that rain is not negative. It is the closest we could get.)

## Consequences

### Positive ✅

- Rain gauges are accurate on both sunny and rainy days, as they were before ADR-0011.

### Negative ❌

- We now have two ADRs that cancel each other out, which adds 120 lines of documentation and zero lines of behaviour change. This is consistent with the overall direction of the project.

### Lessons Learned 📚

- Before deprecating a weather phenomenon, wait at least one full season.
- Snow, hail and fog are **not** to be deprecated without an RFC.
