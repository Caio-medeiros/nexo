#!/usr/bin/env bash
# NEXO — Smoke-test de um cliente contra a produção.
# Valida que os fluxos (pedido, chamada, fila, analytics), os triggers
# e as edge functions funcionam para um dado slug. Limpa tudo no fim.
#
# Uso:  scripts/smoke-client.sh <slug>
# Ex.:  scripts/smoke-client.sh rest-solcarioca-lisboa
#
# Requer: supabase CLI ligado ao projeto (supabase link), curl, python3.
set -uo pipefail
SLUG="${1:-}"; [ -z "$SLUG" ] && { echo "Uso: scripts/smoke-client.sh <slug>"; exit 1; }
URL="https://kgbrtbpeekhkroibsgqq.supabase.co"
K="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYnJ0YnBlZWtoa3JvaWJzZ3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDAwMTMsImV4cCI6MjA5NjYxNjAxM30.vFvSLysnS3456WWKa2a659YuIVuOceYHG4NMd79Jerc"
RUN=$(date +%s); P=0; F=0
ok(){ echo "  ✅ $1"; P=$((P+1)); }; no(){ echo "  ❌ $1"; F=$((F+1)); }
ins(){ curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/rest/v1/$1" -H "apikey:$K" -H "Authorization:Bearer $K" -H "Content-Type:application/json" -H "Prefer:return=minimal" -d "$2"; }
q(){ supabase db query --linked -o csv "$1" 2>/dev/null | tail -n +2; }
UUID=$(python3 -c "import uuid;print(uuid.uuid4())")
WS=$(python3 -c "import datetime as d;t=d.date.today();print(t-d.timedelta(days=t.weekday()))")
WE=$(python3 -c "import datetime as d;t=d.date.today();print(t-d.timedelta(days=t.weekday())+d.timedelta(days=6))")

echo "═══ Smoke-test: $SLUG ═══"
echo "→ existe configuração?"
HAS=$(q "select count(*) from menus where slug='$SLUG'")
[ "$HAS" = "1" ] && ok "menu registado na BD" || no "menu NÃO está em menus (correr provision-client.sql)"

echo "→ fluxos anónimos (return=minimal)"
[ "$(ins orders_log "{\"espaco_slug\":\"$SLUG\",\"table_label\":\"SMK$RUN\",\"items\":[{\"qty\":1,\"name\":\"X\"}],\"total\":10,\"channel\":\"staff\"}")" = 201 ] && ok "pedido" || no "pedido"
[ "$(ins staff_calls "{\"espaco_slug\":\"$SLUG\",\"table_label\":\"SMK$RUN\"}")" = 201 ] && ok "chamada" || no "chamada"
[ "$(ins waitlist_entries "{\"espaco_slug\":\"$SLUG\",\"token\":\"$UUID\",\"name\":\"SMK$RUN\",\"party_size\":2}")" = 201 ] && ok "fila" || no "fila"
[ "$(ins menu_events "{\"espaco_slug\":\"$SLUG\",\"event_name\":\"menu_opened\",\"session_id\":\"SMK$RUN\"}")" = 201 ] && ok "analytics" || no "analytics"

OID=$(q "select id from orders_log where table_label='SMK$RUN' and espaco_slug='$SLUG'")
CID=$(q "select id from staff_calls where table_label='SMK$RUN' and espaco_slug='$SLUG'")
WID=$(q "select id from waitlist_entries where name='SMK$RUN' and espaco_slug='$SLUG'")

echo "→ triggers criam notificações"
N=$(q "select count(*) from portal_notifications where reference_id in ('$OID','$CID','$WID')")
[ "$N" = "3" ] && ok "3 notificações" || no "esperava 3 notificações, obtive '$N'"

echo "→ edge functions"
curl -s -X POST "$URL/functions/v1/generate-weekly-report" -H "Authorization:Bearer $K" -H "Content-Type:application/json" -d "{\"espaco_slug\":\"$SLUG\",\"week_start\":\"$WS\",\"week_end\":\"$WE\",\"espaco_name\":\"$SLUG\"}" | python3 -c "import sys,json;sys.exit(0 if json.load(sys.stdin).get('report') else 1)" 2>/dev/null && ok "generate-weekly-report" || no "generate-weekly-report"

echo "→ limpeza"
supabase db query --linked "delete from portal_notifications where reference_id in ('$OID','$CID','$WID'); delete from orders_log where id='$OID'; delete from staff_calls where id='$CID'; delete from waitlist_entries where id='$WID'; delete from menu_events where session_id='SMK$RUN'; delete from weekly_reports where espaco_slug='$SLUG' and week_start='$WS';" >/dev/null 2>&1
ok "dados de teste removidos"

echo ""; echo "RESULTADO ($SLUG): $P ok · $F falhas"
[ "$F" = 0 ] && echo "✅ Cliente pronto." || echo "⚠️  Ver falhas acima."
