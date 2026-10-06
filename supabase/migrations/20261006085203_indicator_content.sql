-- Indicator marketing content lives in the DB (was hardcoded in src/lib/domain/catalog.ts),
-- plus an admin-uploaded preview image per indicator.

alter table public.indicators
  add column points text[] not null default '{}',
  add column image_path text;

comment on column public.indicators.points is 'Feature bullets shown on the public indicator page.';
comment on column public.indicators.image_path is 'Object path in the public indicator-images bucket (uploaded by staff through the server).';

-- Carry over the copy that used to live in code.
update public.indicators set description = 'CHoCH/BOS พร้อมโซนเข้าแบบ Limit สำหรับเทรดระหว่างวัน', points = array['จับการเปลี่ยนโครงสร้าง CHoCH / BOS บนกรอบเวลาระหว่างวัน', 'วางโซนเข้าแบบ Limit พร้อม SL และ TP ทันทีที่เกิด Setup', 'เหมาะกับคนที่เทรดในช่วงเวลาตลาดเปิด ไม่ถือข้ามวัน'] where code = 'DT';
update public.indicators set description = 'รูปแบบกลับตัว สร้าง → Retest → TP/SL', points = array['หารูปแบบกลับตัวตั้งแต่ตอนก่อตัว แล้วรอราคากลับมา Retest', 'แจ้งทุกสถานะ: สร้าง → รอเข้า → เข้าแล้ว → TP / SL', 'ระดับราคามาจากอินดิเคเตอร์โดยตรง ไม่มีการแก้ภายหลัง'] where code = 'RP';
update public.indicators set description = 'Accumulation · Manipulation · Distribution', points = array['แบ่งรอบราคาเป็น Accumulation · Manipulation · Distribution', 'เข้าได้ทั้งแบบ Market และ Limit ตามจังหวะ', 'เหมาะกับสาย ICT ที่เทรดตามรอบเวลา'] where code = 'AMD';
update public.indicators set description = 'กรอบราคาช่วงเอเชียและการกวาดสภาพคล่อง', points = array['ตีกรอบราคาช่วงตลาดเอเชียให้อัตโนมัติ', 'แจ้งเมื่อราคากวาดสภาพคล่องเหนือหรือใต้กรอบ แล้วกลับเข้ามา', 'เข้าได้ทั้งแบบ Market และ Limit'] where code = 'AR';
update public.indicators set description = 'Orderblock พร้อมยืนยันเข้าแบบ Market', points = array['วาด Orderblock ที่ยังไม่ถูกใช้บนกราฟ', 'รอสัญญาณยืนยันก่อน แล้วค่อยแจ้งเข้าแบบ Market', 'ลดการเข้าก่อนเวลาที่เกิดจากการตั้ง Limit ทิ้งไว้'] where code = 'OB';
update public.indicators set description = 'กวาด Liquidity แล้วเข้าตาม CISD', points = array['ดูการกวาด Liquidity บริเวณ High / Low สำคัญ', 'เข้าตามการเปลี่ยนทิศ (CISD) หลังการกวาด', 'แจ้งเข้าแบบ Market พร้อม SL ใต้หรือเหนือจุดที่กวาด'] where code = 'SW';
update public.indicators set description = 'ตามเทรนด์ด้วยโซน Supply/Demand', points = array['กรองเฉพาะ Setup ที่ไปทางเดียวกับเทรนด์หลัก', 'ใช้โซน Supply / Demand เป็นจุดเข้าแบบ Limit', 'เหมาะกับคนที่อยากเทรดน้อยครั้งแต่ตามน้ำ'] where code = 'TF';
update public.indicators set description = 'โซน Supply/Demand พร้อมเป้า TP หลายระดับ (R)', points = array['วาดโซน Supply / Demand ที่ยังสดอยู่', 'เป้าทำกำไรหลายระดับคิดเป็น R', 'เข้าแบบ Limit ที่ขอบโซน'] where code = 'SD';
update public.indicators set description = 'สัญญาณยืนยันเข้าแบบ Market', points = array['ใช้เป็นตัวยืนยันก่อนเข้าออเดอร์', 'แจ้งเข้าแบบ Market ทันทีเมื่อเงื่อนไขครบ', 'ใช้คู่กับอินดิเคเตอร์ตัวอื่นเพื่อกรองสัญญาณ'] where code = 'RC';
update public.indicators set description = 'PDH/PDL · PWH/PWL · PMH/PML และราคาเปิดรอบ', points = array['ระดับ High / Low ของวัน สัปดาห์ และเดือนก่อนหน้า', 'ราคาเปิดของแต่ละรอบ', 'เป็นข้อมูลอ้างอิง สมาชิกทุกคนเห็นโดยไม่ต้องซื้อ'] where code = 'LV';

-- Public bucket: images are read through public URLs (no listing policy on storage.objects).
-- Writes happen only server-side with the service role after a staff check, so no client write policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('indicator-images', 'indicator-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
