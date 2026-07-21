# Maintainers — hygiene pendiente en `mallanet/mvpMedico`

Cuenta con solo `pull` en el org no puede crear labels ni branch protection. Tras mergear el contrato de agentes, un admin debe:

```bash
# Labels
gh label create feature --repo mallanet/mvpMedico --color "1D76DB" --description "Product feature with specs/NNN"
gh label create chore --repo mallanet/mvpMedico --color "FEF2C0" --description "Docs, CI, tooling"
gh label create product --repo mallanet/mvpMedico --color "5319E7" --description "Change to base.md product decisions"
gh label create blocked --repo mallanet/mvpMedico --color "B60205" --description "Blocked on dependency or decision"

# Branch protection (1 review, no force-push)
gh api repos/mallanet/mvpMedico/branches/main/protection -X PUT \
  -H "Accept: application/vnd.github+json" \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -F enforce_admins=false \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F required_status_checks=null \
  -F restrictions=null
```

Otorgar write al trio para evitar PRs solo-desde-fork.
