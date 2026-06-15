#!/usr/bin/env bash
# NEXO — Provisionar um novo cliente (ficheiros).
# Cria /menu/<slug>/ a partir do template, com o slug já preenchido.
# Depois é só personalizar o config.js e provisionar a BD.
#
# Uso:  scripts/new-client.sh <slug> "<Nome do Espaço>" [tipo]
# Ex.:  scripts/new-client.sh rest-solcarioca-lisboa "Sol Carioca" rest
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="${1:-}"; NAME="${2:-}"; TIPO="${3:-rest}"

if [ -z "$SLUG" ] || [ -z "$NAME" ]; then
  echo "Uso: scripts/new-client.sh <slug> \"<Nome do Espaço>\" [tipo]"
  echo "Ex.: scripts/new-client.sh rest-solcarioca-lisboa \"Sol Carioca\" rest"
  exit 1
fi
if ! echo "$SLUG" | grep -qE '^[a-z0-9-]+$'; then
  echo "❌ Slug inválido: '$SLUG' (só minúsculas, números e hífens)"; exit 1
fi
if [ -d "$ROOT/menu/$SLUG" ]; then echo "❌ menu/$SLUG já existe."; exit 1; fi

echo "→ A criar menu/$SLUG/ ..."
cp -R "$ROOT/menu/_template" "$ROOT/menu/$SLUG"

# Substituições determinísticas (python, cross-platform)
SLUG="$SLUG" NAME="$NAME" TIPO="$TIPO" ROOT="$ROOT" python3 - <<'PY'
import os, re, io
slug=os.environ['SLUG']; name=os.environ['NAME']; tipo=os.environ['TIPO']; root=os.environ['ROOT']

cfg=f"{root}/menu/{slug}/config.js"
s=open(cfg, encoding='utf-8').read()
s=s.replace('slug:  "nexo-restaurant"', f'slug:  "{slug}"')
s=s.replace('name:  "NEXO Restaurant"', f'name:  "{name}"')
s=s.replace("callStaffTopic: '{{CALL_STAFF_TOPIC}}'", f"callStaffTopic: '{slug}-staff'")
open(cfg,'w',encoding='utf-8').write(s)

idx=f"{root}/menu/{slug}/index.html"
s=open(idx, encoding='utf-8').read()
s=s.replace("var ESPACO_SLUG = 'nexo-restaurant'", f"var ESPACO_SLUG = '{slug}'")
s=s.replace("var ESPACO_TIPO = 'rest'", f"var ESPACO_TIPO = '{tipo}'")
open(idx,'w',encoding='utf-8').write(s)
print("   slug + nome + topic + ESPACO_SLUG/TIPO preenchidos")
PY

echo ""
echo "✅ Ficheiros criados:"
echo "   menu/$SLUG/        (menu — personalizar config.js)"
echo ""
echo "Próximos passos (ver docs/NEW-CLIENT-RUNBOOK.md):"
echo "  1. Personalizar menu/$SLUG/config.js:"
echo "       brandColor, whatsappNumber, orderWhatsapp, googleReview, idiomas, menu (pratos)"
echo "  2. Provisionar a BD: editar e correr supabase/provision-client.sql"
echo "       (define slug='$SLUG', nome='$NAME')"
echo "  3. Criar utilizador no Supabase Auth e ligar clients.auth_user_id"
echo "  4. git add menu/$SLUG && git commit && git push (deploy Netlify)"
echo "  5. Validar: scripts/smoke-client.sh $SLUG"
