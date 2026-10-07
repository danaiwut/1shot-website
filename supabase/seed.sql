-- 1SHOT seed: indicator content + store products + October 2026 promotion.
--
-- Indicators: name/description/points/image are (re)set from this file — run it again after editing here.
-- Products and the promotion are inserted only when one with the same name/title doesn't exist yet,
-- so prices changed later in /admin/products are never overwritten.
-- "Normal" (struck-through) prices are never stored: the store adds up the single prices automatically.

-- Indicators -------------------------------------------------------------------------------------
insert into public.indicators (code, name, family, description, points, modes, is_reference, sort, image_path) values
  ('DT', 'Daytrade X', 'SMC',
    'สำหรับสาย SMC หาโซน OB / FVG / Demand Supply และดูโครงสร้างราคา',
    array['หาโซน Order Block, FVG และ Demand / Supply ให้บนกราฟ',
          'ดูโครงสร้างราคา BOS / CHoCH ระหว่างวัน',
          'วาง Buy / Sell Limit พร้อม SL, จุดปิดครึ่งไม้ และขนาด Lot ให้'],
    array['Limit'], false, 10, '/media/indicators/dt.jpg'),
  ('RP', 'Reversal Patterns', '1SHOT',
    'สำหรับสายจับจุดกลับตัว QM, Head & Shoulders พร้อม TP / SL',
    array['จับรูปแบบกลับตัว QM, mQM, Head & Shoulders และ mH&S',
          'วาง TP / SL ให้ทุกรูปแบบที่เกิด',
          'ตารางสรุปผลรายสัปดาห์ แยกตามรูปแบบบนกราฟ'],
    array['Limit'], false, 20, '/media/indicators/rp.jpg'),
  ('AMD', 'ICT-AMD Pro', 'ICT',
    'ดูวัฏจักรตลาด Accumulation / Manipulation / Distribution ช่วยให้เข้าใจจังหวะสะสม หลอก และปล่อยของของราคา',
    array['แบ่งรอบราคาเป็น Accumulation · Manipulation · Distribution ให้อัตโนมัติ',
          'ยืนยันด้วย CISD + FVG ก่อนวางจุดเข้า TP และ SL',
          'แดชบอร์ดสถิติรายเดือนบนกราฟ · ควรใช้กับ TradingView แพ็กเกจ Premium ขึ้นไป'],
    array['Market', 'Limit'], false, 30, '/media/indicators/amd.jpg'),
  ('AR', 'Asian Range', 'ICT', 'กรอบราคาช่วงเอเชียและการกวาดสภาพคล่อง',
    array['ตีกรอบราคาช่วงตลาดเอเชียให้อัตโนมัติ',
          'แจ้งเมื่อราคากวาดสภาพคล่องเหนือหรือใต้กรอบ แล้วกลับเข้ามา',
          'เข้าได้ทั้งแบบ Market และ Limit'],
    array['Market', 'Limit'], false, 40, null),
  ('OB', 'Orderblock', 'ICT', 'Orderblock พร้อมยืนยันเข้าแบบ Market',
    array['วาด Orderblock ที่ยังไม่ถูกใช้บนกราฟ',
          'รอสัญญาณยืนยันก่อน แล้วค่อยแจ้งเข้าแบบ Market',
          'ลดการเข้าก่อนเวลาที่เกิดจากการตั้ง Limit ทิ้งไว้'],
    array['Market'], false, 50, null),
  ('SW', 'ICT-Sweep', 'ICT',
    'วางจุดเข้าเทรด TP SL ให้อัตโนมัติ จับจังหวะที่ราคากวาด Stop Loss / Liquidity แล้วใช้ CISD ยืนยันก่อนเข้าเทรด',
    array['จับจังหวะที่ราคากวาด Stop Loss / Liquidity บริเวณ High / Low สำคัญ',
          'ใช้ CISD ยืนยันก่อนเข้า แล้ววาง Entry, TP และ SL ให้อัตโนมัติ',
          'แดชบอร์ดสรุปสถิติรายเดือนแบบเรียลไทม์ · ควรใช้กับ TradingView แพ็กเกจ Premium ขึ้นไป'],
    array['Market'], false, 60, '/media/indicators/sw.jpg'),
  ('TF', 'Trend Final', 'SnD',
    'สำหรับสายตามเทรนด์ คัดโซนตาม Momentum และจังหวะ Retest',
    array['ดู Momentum และ Trend Mode ก่อนเลือกฝั่งเทรด',
          'คัดโซน Supply / Demand ที่ไปทางเดียวกับเทรนด์ แล้วรอจังหวะ Retest',
          'แดชบอร์ดสรุปผลแยกตามช่วง Asia / London / New York'],
    array['Limit'], false, 70, '/media/indicators/tf.jpg'),
  ('SD', 'SnD', 'SnD',
    'เทรดตาม Demand / Supply ได้อย่างเป็นระบบขึ้น',
    array['ตีโซน Demand / Supply พร้อมเลข ID ให้ติดตามง่าย',
          'บอกสถานะโซนที่ถูก Retest และโซนที่ Flip แล้ว',
          'เข้าแบบ Limit ที่ขอบโซน'],
    array['Limit'], false, 80, '/media/indicators/sd.jpg'),
  ('RC', '1SHOT RC - Confirmation', '1SHOT', 'สัญญาณยืนยันเข้าแบบ Market',
    array['ใช้เป็นตัวยืนยันก่อนเข้าออเดอร์',
          'แจ้งเข้าแบบ Market ทันทีเมื่อเงื่อนไขครบ',
          'ใช้คู่กับอินดิเคเตอร์ตัวอื่นเพื่อกรองสัญญาณ'],
    array['Market'], false, 90, null),
  ('LV', 'Period Levels', '1SHOT', 'PDH/PDL · PWH/PWL · PMH/PML และราคาเปิดรอบ',
    array['ระดับ High / Low ของวัน สัปดาห์ และเดือนก่อนหน้า',
          'ราคาเปิดของแต่ละรอบ',
          'เป็นข้อมูลอ้างอิง สมาชิกทุกคนเห็นโดยไม่ต้องซื้อ'],
    array[]::text[], true, 100, null)
on conflict (code) do update set
  name = excluded.name, family = excluded.family, description = excluded.description, points = excluded.points,
  modes = excluded.modes, is_reference = excluded.is_reference, sort = excluded.sort,
  -- keep an image uploaded in the admin; only fill in when there is none or it is a seeded one
  image_path = case when public.indicators.image_path is null or public.indicators.image_path like '/%'
                    then excluded.image_path else public.indicators.image_path end;

-- Products ---------------------------------------------------------------------------------------
do $$
declare
  ind record;
  pid uuid;
  perks constant text[] := array['ใช้งานตลอดชีพ', 'เข้ากลุ่ม OpenChat Community', 'คลิปสอนการใช้งาน'];
begin
  -- Singles: 14,000 THB lifetime each.
  for ind in select code, name, sort from public.indicators where code in ('DT', 'RP', 'AMD', 'SW', 'TF', 'SD') order by sort loop
    if exists (select 1 from public.products where kind = 'single' and codes = array[ind.code]) then continue; end if;
    insert into public.products (name, description, kind, codes, features, sort)
    values (ind.name, 'สิทธิ์ใช้อินดิเคเตอร์ ' || ind.name || ' บน TradingView', 'single', array[ind.code], perks, 100 + ind.sort)
    returning id into pid;
    insert into public.product_prices (product_id, billing, amount_satang, duration_days, sort)
    values (pid, 'one_time', 1400000, null, 10);
  end loop;

  -- Fixed pair: ICT-AMD Pro + ICT-Sweep 16,999 (shown against 28,000 bought separately).
  if not exists (select 1 from public.products where name = 'คู่ ICT: AMD Pro + Sweep') then
    insert into public.products (name, description, kind, codes, features, featured, badge, sort)
    values ('คู่ ICT: AMD Pro + Sweep', 'ดูวัฏจักร AMD แล้วเข้าเทรดตามจังหวะกวาด Liquidity ใช้คู่กันได้ทันที', 'bundle',
            array['AMD', 'SW'], perks, true, 'คู่แนะนำ', 20)
    returning id into pid;
    insert into public.product_prices (product_id, billing, amount_satang, duration_days, sort)
    values (pid, 'one_time', 1699900, null, 10);
  end if;

  -- October promotion: choose any 2 of 5, lifetime, 15,000.
  if not exists (select 1 from public.products where name = 'โปรตุลาคม: เลือก 2 อินดิเคเตอร์') then
    insert into public.products (name, description, kind, codes, pick_count, features, featured, badge, available_until, sort)
    values ('โปรตุลาคม: เลือก 2 อินดิเคเตอร์', 'รับทันที 2 อินดิเคเตอร์ ใช้งานตลอดชีพ จำกัดสิทธิ์เฉพาะช่วงโปรโมชั่นเท่านั้น', 'pick',
            array['DT', 'RP', 'TF', 'AMD', 'SW'], 2, perks, true, 'HOT', '2026-10-31T23:59:59+07:00', 0)
    returning id into pid;
    insert into public.product_prices (product_id, billing, amount_satang, duration_days, sort)
    values (pid, 'one_time', 1500000, null, 10);
  end if;

  -- October, returning customers: any 1 of 6 for 8,495.
  if not exists (select 1 from public.products where name = 'ลูกค้าเก่า: ราคาแยกเดี่ยวพิเศษ') then
    insert into public.products (name, description, kind, codes, pick_count, features, audience, badge, available_until, sort)
    values ('ลูกค้าเก่า: ราคาแยกเดี่ยวพิเศษ', 'สำหรับลูกค้าที่เคยซื้อแล้ว เลือกเพิ่มได้ 1 ตัวในราคาพิเศษ', 'pick',
            array['DT', 'RP', 'TF', 'AMD', 'SW', 'SD'], 1, perks, 'returning', 'HOT', '2026-10-31T23:59:59+07:00', 1)
    returning id into pid;
    insert into public.product_prices (product_id, billing, amount_satang, duration_days, sort)
    values (pid, 'one_time', 849500, null, 10);
  end if;

  -- Homepage promotion card.
  if not exists (select 1 from public.promotions where title = '1SHOT INDICATOR: OCT') then
    insert into public.promotions (title, body, badge, cta_label, cta_href, image_url, starts_on, ends_on)
    values ('1SHOT INDICATOR: OCT',
            'รับทันที 2 อินดิเคเตอร์ ใช้งานตลอดชีพ 15,000 บาท · ลูกค้าเก่ารับราคาแยกเดี่ยวพิเศษ 8,495 บาท พร้อมเข้ากลุ่ม OpenChat และคลิปสอนการใช้งาน จำกัดสิทธิ์เฉพาะช่วงโปรโมชั่นเท่านั้น',
            'HOT · โปรเดือนตุลาคม', 'เลือกอินดิเคเตอร์', '/pricing#deals', '/media/indicators/promo-oct.jpg',
            '2026-10-01', '2026-10-31');
  end if;
end $$;
