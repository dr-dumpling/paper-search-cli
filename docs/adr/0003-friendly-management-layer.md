# Friendly Management Layer

Paper Search CLI keeps literature search and PDF retrieval as its domain, while smartsearch-inspired management behavior lives in a separate Friendly Management Layer. This layer adds human-friendly health, smoke, and Skill update preview commands without changing provider routing or making management commands default to human text; JSON remains the default output for agent and script callers.

**Consequences**: `doctor` and `skills diff` may offer explicit text renderings, `smoke --live` uses scoped network checks with severities instead of exhaustive provider validation, includes lightweight Sci-Hub availability without default PDF downloads, and Extra Skill Files are reported but not displayed or managed.
