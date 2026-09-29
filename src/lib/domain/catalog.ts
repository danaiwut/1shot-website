// Marketing copy for the public site; mirrors the `indicators` seed in the initial migration.
export const CATALOG = [
  { code: "DT", name: "Daytrade X", family: "SMC", description: "CHoCH/BOS พร้อมโซนเข้าแบบ Limit สำหรับเทรดระหว่างวัน" },
  { code: "RP", name: "Reversal Patterns", family: "1SHOT", description: "รูปแบบกลับตัว สร้าง → Retest → TP/SL" },
  { code: "AMD", name: "AMD Pro", family: "ICT", description: "Accumulation · Manipulation · Distribution" },
  { code: "AR", name: "Asian Range", family: "ICT", description: "กรอบราคาช่วงเอเชียและการกวาดสภาพคล่อง" },
  { code: "OB", name: "Orderblock", family: "ICT", description: "Orderblock พร้อมยืนยันเข้าแบบ Market" },
  { code: "SW", name: "Sweep Model", family: "ICT", description: "กวาด Liquidity แล้วเข้าตาม CISD" },
  { code: "TF", name: "Trend Final", family: "SnD", description: "ตามเทรนด์ด้วยโซน Supply/Demand" },
  { code: "SD", name: "Supply and Demand", family: "SnD", description: "โซน Supply/Demand พร้อมเป้า TP หลายระดับ (R)" },
  { code: "RC", name: "RC Confirmation", family: "1SHOT", description: "สัญญาณยืนยันเข้าแบบ Market" },
  { code: "LV", name: "Period Levels", family: "1SHOT", description: "PDH/PDL · PWH/PWL · PMH/PML และราคาเปิดรอบ" },
] as const;
