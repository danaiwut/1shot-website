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
- MT5 Gateway + Worker (`mt5-automation/`) — ต้องรันบน Windows/Wine แยกจากเว็บอยู่แล้ว
- AI Agent Machine (สถิติ + Claude) และบอทส่งสัญญาณเข้าห้อง (`tv_alert.py`)
- กราฟแท่งเทียน (ยังไม่มีแหล่งราคา) — หน้า Setup แสดงเฉพาะโซนที่อินดิเคเตอร์วาด

## โหมดตัวอย่าง (Mockup)

ถ้ายังไม่ได้ตั้งค่า Supabase เว็บจะเปิดเป็นโหมดตัวอย่างเอง ทุกหน้าใช้งานได้ด้วยข้อมูลจำลองในหน่วยความจำ (`src/lib/mock/`)
มีแถบสีแดงบอกด้านบนทุกหน้า

```sh
npm install
npm run dev        # เปิด /login แล้วกด "เข้าเป็นแอดมิน" หรือ "เข้าเป็นสมาชิก"
```

- บัญชีตัวอย่าง: `admin@1shot.demo` (owner) และ `member@1shot.demo` (สมาชิก) รหัสผ่านอะไรก็ได้ อีเมลอื่นจะเข้าเป็น owner
- สมัครสมาชิกได้จริงในโหมดนี้ (เข้าระบบทันที ไม่ต้องยืนยันอีเมล) และเชื่อม Telegram แบบจำลองได้
- แก้ข้อมูล ให้สิทธิ์ ตรวจ IB ได้ทุกอย่าง แต่ข้อมูลจะกลับเป็นค่าเริ่มต้นเมื่อรีสตาร์ตเซิร์ฟเวอร์
- ซื้อสินค้าได้จริงในโหมดนี้ (ไม่ผ่าน Stripe ชำระสำเร็จทันที) เพื่อดู flow ร้านค้า → การชำระเงิน → สิทธิ์
- ทดสอบ Webhook ได้ที่ `POST /api/webhook/tradingview/demo-secret` (ใช้ secret นี้เฉพาะโหมดตัวอย่าง)
- บังคับเปิด/ปิดด้วย `NEXT_PUBLIC_MOCK_MODE=1` / `NEXT_PUBLIC_MOCK_MODE=0` เมื่อใส่ค่า Supabase แล้วจะใช้ข้อมูลจริงอัตโนมัติ

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

### Stripe (ร้านค้า)

ลูกค้าซื้อได้ 2 แบบ: **รายงวด** (ตัดบัตรอัตโนมัติรายเดือน/รายปี) และ **จ่ายครั้งเดียว** (ใช้ได้ตามจำนวนวัน หรือตลอดชีพ)
ชำระสำเร็จแล้วระบบเพิ่ม `indicator_rights` ให้เอง ซื้อซ้ำจะบวกเวลาต่อจากของเดิม และไม่ลดสิทธิ์ที่มีอยู่ เส้นทางฟรีผ่าน Exness IB (แอดมินให้สิทธิ์เอง) ยังใช้ได้เหมือนเดิม

1. รัน `supabase/migrations/20261002000000_store.sql`
2. Stripe Dashboard → Developers → API keys → ใส่ `STRIPE_SECRET_KEY`
3. Developers → Webhooks → Add endpoint `{SITE_URL}/api/stripe/webhook` เลือก event:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `checkout.session.expired`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `charge.refunded` แล้วใส่ Signing secret เป็น `STRIPE_WEBHOOK_SECRET`
4. Settings → Payment methods: เปิด **Cards** และ **PromptPay** (PromptPay ใช้ได้เฉพาะแบบจ่ายครั้งเดียว)
5. Settings → Billing → Customer portal: กด Save ครั้งหนึ่ง เพื่อให้ปุ่ม "จัดการบัตรและใบแจ้งหนี้" ใช้งานได้
6. เข้า Admin → สินค้าและราคา เพื่อสร้างสินค้า (รายตัว/แพ็กเกจรวม) และเพิ่มราคา

ทดสอบในเครื่อง: `stripe listen --forward-to localhost:3000/api/stripe/webhook` แล้วใช้บัตรทดสอบ `4242 4242 4242 4242`
**คืนเงิน:** กดปุ่ม "คืนเงิน" ในหน้า Admin → คำสั่งซื้อ (หรือหน้าสมาชิก) หรือคืนจากหน้า Stripe ก็ได้ เมื่อคืนเต็มจำนวน ระบบจะถอนสิทธิ์อัตโนมัติ
เฉพาะส่วนที่คำสั่งซื้อนั้นให้ไป (เวลาที่ได้จากการซื้ออื่นหรือที่แอดมินให้เองยังอยู่) การคืนเงินบางส่วนไม่ถอนสิทธิ์
ถ้าคำสั่งซื้อที่คืนเงินเป็นของการสมัครรายงวด (งวดแรกหรืองวดต่ออายุ) ระบบจะยกเลิกการสมัครนั้นทันทีด้วย จะไม่มีการตัดบัตรงวดถัดไป

1. รัน `supabase/migrations/20261003000000_refunds.sql` ต่อจาก store migration

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

`tests/parity/fixtures.json` คือผลลัพธ์ที่บันทึกไว้จากโค้ด Python เดิม (ตัว generator ถูกลบออกแล้ว ทั้งโปรเจ็กต์เป็น TypeScript) ห้ามสร้างใหม่จากโค้ด TypeScript เพราะจะทำให้ parity test ไม่มีความหมาย

## ความปลอดภัย

- ทุกตารางเปิด RLS สมาชิกเห็นเฉพาะสัญญาณของอินดิเคเตอร์ที่มีสิทธิ์ แก้ได้เฉพาะข้อมูลติดต่อของตัวเอง ส่วน `role` และ `ib_verified` แก้ได้เฉพาะแอดมิน (trigger `guard_profile_update`)
- `SUPABASE_SECRET_KEY` ใช้เฉพาะฝั่ง server (webhook, บอท) ห้ามใส่ใน frontend
- ห้าม commit `.env.local` หรือ `tv_config.json` ของระบบเดิม
