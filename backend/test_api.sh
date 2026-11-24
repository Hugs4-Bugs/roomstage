#!/bin/bash
set -e
cd /home/claude/roomstage/backend

node server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 2

echo "=== HEALTH ==="
curl -s http://localhost:4000/health
echo ""

echo "=== REGISTER ==="
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"James Kanyago","email":"james@roomstage.test","password":"testpass123"}')
echo "$REGISTER_RESPONSE"
TOKEN=$(node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token" <<< "$REGISTER_RESPONSE")
echo "Got token: ${TOKEN:0:20}..."

echo "=== DUPLICATE REGISTER (expect 409) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"James Kanyago","email":"james@roomstage.test","password":"testpass123"}'

echo "=== LOGIN WRONG PASSWORD (expect 401) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"james@roomstage.test","password":"wrongpass"}'

echo "=== UNAUTHENTICATED /api/clients (expect 401) ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/clients

echo "=== CREATE CLIENT ==="
CLIENT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Wanjiru Kariuki","phone":"0722123456","location":"Kilimani, Nairobi"}')
echo "$CLIENT_RESPONSE"
CLIENT_ID=$(node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id" <<< "$CLIENT_RESPONSE")
echo "CLIENT_ID: $CLIENT_ID"

echo "=== CREATE CLIENT MISSING NAME (expect 400) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"phone":"0722000000"}'

echo "=== LIST CLIENTS ==="
curl -s http://localhost:4000/api/clients -H "Authorization: Bearer $TOKEN"
echo ""

echo "=== CREATE JOB ==="
JOB_RESPONSE=$(curl -s -X POST http://localhost:4000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"client_id\":$CLIENT_ID,\"title\":\"Bedsitter room reset\",\"price\":2000,\"notes\":\"Small space, needs better flow\"}")
echo "$JOB_RESPONSE"
JOB_ID=$(node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id" <<< "$JOB_RESPONSE")
echo "JOB_ID: $JOB_ID"

echo "=== UPDATE JOB STATUS ==="
curl -s -X PUT http://localhost:4000/api/jobs/$JOB_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"completed","payment_status":"paid"}'
echo ""

echo "=== ADD PHOTO ==="
curl -s -X POST http://localhost:4000/api/jobs/$JOB_ID/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url":"https://example.com/before.jpg","type":"before"}'
echo ""

echo "=== ADD PHOTO BAD TYPE (expect 400) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/jobs/$JOB_ID/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url":"https://example.com/x.jpg","type":"sideways"}'

echo "=== GET CLIENT WITH JOBS ==="
curl -s http://localhost:4000/api/clients/$CLIENT_ID -H "Authorization: Bearer $TOKEN"
echo ""

echo "=== GET JOB WITH PHOTOS ==="
curl -s http://localhost:4000/api/jobs/$JOB_ID -H "Authorization: Bearer $TOKEN"
echo ""

echo "=== GET NONEXISTENT CLIENT (expect 404) ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/clients/99999 -H "Authorization: Bearer $TOKEN"

echo "=== CREATE ROOM ==="
ROOM_RESPONSE=$(curl -s -X POST http://localhost:4000/api/jobs/$JOB_ID/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Main bedsitter","width_cm":320,"length_cm":410}')
echo "$ROOM_RESPONSE"
ROOM_ID=$(node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id" <<< "$ROOM_RESPONSE")
echo "ROOM_ID: $ROOM_ID"

echo "=== CREATE ROOM MISSING DIMENSIONS (expect 400) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/jobs/$JOB_ID/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Bad room"}'

echo "=== UPDATE ROOM WIDTH ==="
curl -s -X PUT http://localhost:4000/api/rooms/$ROOM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"width_cm":350}'
echo ""

echo "=== PLACE FURNITURE IN ROOM (3 pieces) ==="
SOFA_ID=$(curl -s http://localhost:4000/api/furniture-items -H "Authorization: Bearer $TOKEN" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).find(i=>i.name==='Sofa').id")
BED_ID=$(curl -s http://localhost:4000/api/furniture-items -H "Authorization: Bearer $TOKEN" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).find(i=>i.name==='Bed').id")
RUG_ID=$(curl -s http://localhost:4000/api/furniture-items -H "Authorization: Bearer $TOKEN" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).find(i=>i.name==='Rug').id")

PLACED_SOFA=$(curl -s -X POST http://localhost:4000/api/rooms/$ROOM_ID/furniture \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"furniture_item_id\":$SOFA_ID,\"x_position\":20,\"y_position\":30,\"rotation\":0}")
echo "$PLACED_SOFA"
PLACED_SOFA_ID=$(node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id" <<< "$PLACED_SOFA")

curl -s -X POST http://localhost:4000/api/rooms/$ROOM_ID/furniture \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"furniture_item_id\":$BED_ID,\"x_position\":100,\"y_position\":50,\"rotation\":90}"
echo ""

curl -s -X POST http://localhost:4000/api/rooms/$ROOM_ID/furniture \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"furniture_item_id\":$RUG_ID,\"x_position\":150,\"y_position\":200,\"rotation\":0}"
echo ""

echo "=== PLACE FURNITURE MISSING POSITION (expect 400) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/rooms/$ROOM_ID/furniture \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"furniture_item_id\":$SOFA_ID}"

echo "=== MOVE THE SOFA ==="
curl -s -X PUT http://localhost:4000/api/room-furniture/$PLACED_SOFA_ID \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"x_position":60,"rotation":90}'
echo ""

echo "=== \"REFRESH\" -- LIST FURNITURE FOR ROOM (expect 3 pieces) ==="
curl -s http://localhost:4000/api/rooms/$ROOM_ID/furniture -H "Authorization: Bearer $TOKEN" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).length + ' pieces'"

echo "=== GET JOB -- ROOM SHOULD NEST ITS 3 PLACED PIECES ==="
curl -s http://localhost:4000/api/jobs/$JOB_ID -H "Authorization: Bearer $TOKEN" | node -pe "'room furniture count: ' + JSON.parse(require('fs').readFileSync(0,'utf8')).rooms[0].furniture.length"

echo "=== REMOVE ONE PLACED PIECE ==="
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:4000/api/room-furniture/$PLACED_SOFA_ID -H "Authorization: Bearer $TOKEN"

echo "=== LIST FURNITURE CATALOG (expect 12 seeded items) ==="
curl -s http://localhost:4000/api/furniture-items -H "Authorization: Bearer $TOKEN" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).length + ' items'"

echo "=== CREATE CUSTOM FURNITURE ITEM ==="
curl -s -X POST http://localhost:4000/api/furniture-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Shoe rack","width_cm":60,"depth_cm":30,"category":"storage"}'
echo ""

echo "=== CREATE FURNITURE ITEM MISSING DIMENSIONS (expect 400) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/furniture-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Bad item"}'

echo "=== DELETE CLIENT (should cascade to job + photo + room) ==="
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:4000/api/clients/$CLIENT_ID -H "Authorization: Bearer $TOKEN"

echo "=== VERIFY JOB GONE (expect 404 -- cascade worked) ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/jobs/$JOB_ID -H "Authorization: Bearer $TOKEN"

echo "=== VERIFY ROOM GONE (expect 404 -- cascade worked) ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/rooms/$ROOM_ID -H "Authorization: Bearer $TOKEN"

kill $SERVER_PID 2>/dev/null
echo "=== ALL TESTS DONE, server stopped ==="
