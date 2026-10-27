#!/usr/bin/env bash
# Refuses any migration that creates a table and never enables row level
# security on it anywhere in the migration history.
#
# This exists because rule 1 of CLAUDE.md is the one most likely to be
# skipped under time pressure, and an unprotected table is invisible until
# it is someone else's data on someone else's screen.

set -uo pipefail
fail=0

shopt -s nullglob
migrations=(supabase/migrations/*.sql)
(( ${#migrations[@]} )) || exit 0

for file in "${migrations[@]}"; do
  tables=$(grep -oiP 'create table\s+(if not exists\s+)?(public\.)?\K[a-z_]+' "$file" || true)
  for t in $tables; do
    if ! grep -qiE "alter table[[:space:]]+(public\.)?${t}[[:space:]]+enable row level security" "${migrations[@]}"; then
      echo "BLOCKED: table '${t}' is created in ${file} but row level security is never enabled on it."
      fail=1
    fi
  done
done

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "See rule 1 in CLAUDE.md. Add the alter/policy statements, or explain"
  echo "in the migration why this table holds no customer data."
  exit 2
fi

echo "RLS check passed: every table created in supabase/migrations has RLS enabled."
