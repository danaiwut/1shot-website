# 1SHOT Signals — Next.js + Supabase

ระบบใหม่ของ 1SHOT ย้ายจาก Python + SQLite/JSON (`tvaccess`, `AI-Trading-Lab/server`) มาเป็น Next.js 16 (App Router) + Supabase พร้อมหน้าตาใหม่ทั้งหมด

## สิ่งที่ย้ายมาแล้ว

| ส่วน | ของเดิม | ของใหม่ |
|---|---|---|
| ตัวอ่าน Alert WF1 | `tvaccess/wf_contract.py` | `src/lib/domain/wf1.ts` — ผลตรงกับ Python ทุกเคส (`tests/parity.test.ts`) |
| รูปวาด `#S` บนกราฟ | `tvaccess/tv_shapes.py` | `src/lib/domain/shapes.ts` |
| กันสัญญาณซ้ำ | `wf_receipts` + `chart_events` (SQLite) | ตาราง `signal_events` + ฟังก์ชัน `ingest_signal_events` (atomic) |
| Webhook TradingView | `tv_webhook.py` `/hook/<secret>` | `POST /api/webhook/tradingview/<secret>` |
| สมาชิก / สมัคร / ยืนยันอีเมล | `server/app.py` + SQLite | Supabase Auth + ตาราง `profiles` |
| สิทธิ์อินดิเคเตอร์ | `tv_rights.json` | ตาราง `indicator_rights` (มีวันหมดอายุ / ตลอดชีพ) |
| เชื่อม Telegram | `tvaccess/tv_webbridge.py` | `src/lib/telegram.ts` + `POST /api/telegram/webhook` |
| ลิงก์เข้าห้องแบบใช้ครั้งเดียว | `request_room` / `approve` | `requestRoomInvite` / `handleJoinRequest` |
| ข่าวโลก / สรุปเช้า | `tv_world.json`, `tv_morning_brief.json` | ตาราง `news_items`, `daily_briefs` + `scripts/import-legacy.ts` |

## ยังไม่ได้ย้าย (ไม่มีซอร์สในชุดที่ได้รับ)

- ตรวจสิทธิ์ TradingView อัตโนมัติ (`tv_verify.py`) — ตอนนี้แอดมินให้สิทธิ์เองในหน้า Admin
- ตรวจ IB ผ่าน Exness API (`exness_link.py`) — ตอนนี้แอดมินกดยืนยัน IB เอง
- ร้านค้า / Stripe / ต่ออายุ (`products.py`, `renewal.py`)
- MT5 Gateway + Worker (`mt5-automation/`) — ต้องรันบน Windows/Wine แยกจากเว็บอยู่แล้ว
- AI Agent Machine (สถิติ + Claude) และบอทส่งสัญญาณเข้าห้อง (`tv_alert.py`)
- กราฟแท่งเทียน (ยังไม่มีแหล่งราคา) — หน้า Setup แสดงเฉพาะโซนที่อินดิเคเตอร์วาด

## เริ่มใช้งาน

```sh
npm install
cp .env.example .env.local   # ใส่ค่า Supabase และ secret
npm run dev                  # http://localhost:3000
```

### ตั้งค่า Supabase

1. รัน `supabase/migrations/20260928000000_init.sql` (SQL Editor หรือ `supabase db push`)
2. Auth → URL Configuration: ตั้ง Site URL เป็นโดเมนเว็บ และเพิ่ม `{SITE_URL}/auth/confirm` ใน Redirect URLs
3. Auth → Email Templates → Confirm signup: ใช้ลิงก์
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
4. ตั้งเจ้าของระบบคนแรก (หลังสมัครแล้ว):
   ```sql
   update public.profiles set role = 'owner' where email = 'you@example.com';
   ```
5. นำเข้าข่าวและสรุปเช้าเดิม: `npm run import:legacy -- /path/to/tvaccess`

### TradingView

Alert → Notifications → Webhook URL: `{SITE_URL}/api/webhook/tradingview/{TRADINGVIEW_WEBHOOK_SECRET}`
ข้อความ Alert ต้องเป็นรูปแบบ WF1 (`[WF1] … [/WF1]`) และแนบบรรทัด `#S` ได้ตามเดิม

### Telegram bot

```sh
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d url="$SITE_URL/api/telegram/webhook" \
  -d secret_token="$TELEGRAM_WEBHOOK_SECRET" \
  -d 'allowed_updates=["message","chat_join_request"]'
```

บอทต้องเป็นแอดมินในห้องสัญญาณ (สิทธิ์เชิญสมาชิก) แล้วผูก Chat ID ของห้องในหน้า Admin → อินดิเคเตอร์และห้อง

## คำสั่ง

```sh
npm run typecheck
npm test          # parity tests กับโค้ด Python เดิม
npm run build
```

สร้าง fixture ใหม่จาก Python ต้นฉบับ: `python3 tests/parity/gen_cases.py /path/to/tvaccess` (รันใน `tests/parity/`)

## ความปลอดภัย

- ทุกตารางเปิด RLS สมาชิกเห็นเฉพาะสัญญาณของอินดิเคเตอร์ที่มีสิทธิ์ แก้ได้เฉพาะข้อมูลติดต่อของตัวเอง ส่วน `role` และ `ib_verified` แก้ได้เฉพาะแอดมิน (trigger `guard_profile_update`)
- `SUPABASE_SECRET_KEY` ใช้เฉพาะฝั่ง server (webhook, บอท) ห้ามใส่ใน frontend
- ห้าม commit `.env.local` หรือ `tv_config.json` ของระบบเดิม
