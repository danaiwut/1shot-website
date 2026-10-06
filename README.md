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

## เริ่มใช้งาน

```sh
npm install
cp .env.example .env.local   # ใส่ค่า Supabase และ secret
npm run dev                  # http://localhost:3000
```

### ตั้งค่า Supabase

โปรเจ็กต์ Supabase ที่ใช้: `1shot-signals` (`igpftrpnfxwvqxbigkum`, ap-southeast-1) รัน migration ครบทุกไฟล์แล้ว

1. Migration อยู่ใน `supabase/migrations/` (ชื่อไฟล์ตรงกับ version บนโปรเจ็กต์) โปรเจ็กต์ใหม่ใช้ `supabase db push`
2. ใส่ `SUPABASE_SECRET_KEY` (Project Settings → API Keys → Secret keys) ใน `.env.local` ต้องมีสำหรับ webhook, Telegram, ร้านค้า และการตั้งเจ้าของระบบ
3. Auth → URL Configuration: ตั้ง Site URL เป็นโดเมนเว็บ และเพิ่ม `http://localhost:3000/auth/confirm` กับ `{SITE_URL}/auth/confirm` ใน Redirect URLs
4. Auth → Providers → Email: เปิด Confirm email (เปิดอยู่แล้ว) และแนะนำให้เปิด Leaked password protection
5. Auth → SMTP: ใส่ SMTP ของโดเมนเอง (เช่น Resend) อีเมลในตัวของ Supabase ส่งได้แค่ไม่กี่ฉบับต่อชั่วโมง
6. เจ้าของระบบคนแรก: ใส่อีเมลใน `OWNER_EMAILS` แล้วสมัครด้วยอีเมลนั้น พอยืนยันอีเมลและเข้าระบบ บัญชีจะเป็น owner อัตโนมัติ
7. ข่าวและสรุปเช้า: แอดมินเขียนได้ที่ Admin → ข่าวและสรุปเช้า หรือนำเข้าข้อมูลเดิมด้วย `npm run import:legacy -- /path/to/tvaccess`

ระบบเข้าสู่ระบบ (Supabase Auth, cookie session ผ่าน `@supabase/ssr`):
- สมัคร → ยืนยันอีเมล → `/auth/confirm` → หน้าบัญชี
- เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน ถ้ายังไม่ยืนยันอีเมล จะมีปุ่มส่งลิงก์ยืนยันอีกครั้ง
- ลืมรหัสผ่าน (`/forgot-password`) → ลิงก์ในอีเมล → `/reset-password` (ลิงก์ใช้ได้ 15 นาทีหลังเปิด)
- เปลี่ยนรหัสผ่านในหน้าบัญชี (ต้องกรอกรหัสผ่านปัจจุบัน)
- ข้อความตอบกลับเหมือนกันไม่ว่าจะมีบัญชีอยู่หรือไม่ (กันการเดาอีเมล)
- เปลี่ยนอีเมลใน Supabase Auth แล้ว `profiles.email` จะตามเอง (trigger `sync_user_email`)

### Stripe (ร้านค้า)

ลูกค้าซื้อได้ 2 แบบ: **รายงวด** (ตัดบัตรอัตโนมัติรายเดือน/รายปี) และ **จ่ายครั้งเดียว** (ใช้ได้ตามจำนวนวัน หรือตลอดชีพ)
ชำระสำเร็จแล้วระบบเพิ่ม `indicator_rights` ให้เอง ซื้อซ้ำจะบวกเวลาต่อจากของเดิม และไม่ลดสิทธิ์ที่มีอยู่ เส้นทางฟรีผ่าน Exness IB (แอดมินให้สิทธิ์เอง) ยังใช้ได้เหมือนเดิม

1. Stripe Dashboard → Developers → API keys → ใส่ `STRIPE_SECRET_KEY`
2. Developers → Webhooks → Add endpoint `{SITE_URL}/api/stripe/webhook` เลือก event:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `checkout.session.expired`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `charge.refunded` แล้วใส่ Signing secret เป็น `STRIPE_WEBHOOK_SECRET`
3. Settings → Payment methods: เปิด **Cards** และ **PromptPay** (PromptPay ใช้ได้เฉพาะแบบจ่ายครั้งเดียว)
4. Settings → Billing → Customer portal: กด Save ครั้งหนึ่ง เพื่อให้ปุ่ม "จัดการบัตรและใบแจ้งหนี้" ใช้งานได้
5. เข้า Admin → สินค้าและราคา เพื่อสร้างสินค้า (รายตัว/แพ็กเกจรวม) และเพิ่มราคา

ทดสอบในเครื่อง: `stripe listen --forward-to localhost:3000/api/stripe/webhook` แล้วใช้บัตรทดสอบ `4242 4242 4242 4242`
**คืนเงิน:** กดปุ่ม "คืนเงิน" ในหน้า Admin → คำสั่งซื้อ (หรือหน้าสมาชิก) หรือคืนจากหน้า Stripe ก็ได้ เมื่อคืนเต็มจำนวน ระบบจะถอนสิทธิ์อัตโนมัติ
เฉพาะส่วนที่คำสั่งซื้อนั้นให้ไป (เวลาที่ได้จากการซื้ออื่นหรือที่แอดมินให้เองยังอยู่) การคืนเงินบางส่วนไม่ถอนสิทธิ์
ถ้าคำสั่งซื้อที่คืนเงินเป็นของการสมัครรายงวด (งวดแรกหรืองวดต่ออายุ) ระบบจะยกเลิกการสมัครนั้นทันทีด้วย จะไม่มีการตัดบัตรงวดถัดไป

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
npm test          # parity tests กับโค้ด Python เดิม + ตรรกะร้านค้า/คืนเงิน (ฐานข้อมูลในหน่วยความจำ tests/support/)
npm run build
```

`tests/parity/fixtures.json` คือผลลัพธ์ที่บันทึกไว้จากโค้ด Python เดิม (ตัว generator ถูกลบออกแล้ว ทั้งโปรเจ็กต์เป็น TypeScript) ห้ามสร้างใหม่จากโค้ด TypeScript เพราะจะทำให้ parity test ไม่มีความหมาย

## ความปลอดภัย

- ทุกตารางเปิด RLS สมาชิกเห็นเฉพาะสัญญาณของอินดิเคเตอร์ที่มีสิทธิ์ แก้ได้เฉพาะข้อมูลติดต่อของตัวเอง ส่วน `role` และ `ib_verified` แก้ได้เฉพาะแอดมิน (trigger `guard_profile_update`)
- `SUPABASE_SECRET_KEY` ใช้เฉพาะฝั่ง server (webhook, บอท) ห้ามใส่ใน frontend
- ห้าม commit `.env.local` หรือ `tv_config.json` ของระบบเดิม
