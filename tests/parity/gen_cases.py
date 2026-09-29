"""Generate WF1/shapes parity fixtures by running the ORIGINAL Python parsers."""
import json, sys
sys.path.insert(0, sys.argv[1])
import wf_contract, tv_shapes

NOW = 1790000000.0
def block(**f):
    return "[WF1]\n" + "\n".join(f"{k}:{v}" for k, v in f.items()) + "\n[/WF1]"

def setup(code="DT", event="SETUP", mode="Limit", side="BUY", entry="4380.5", sl="4370", tp="4400", terminal="false", eid_suffix=None, **extra):
    sid = f"{code}|v3|x|OANDA:XAUUSD|5|z1|{side}|a|b|c"
    f = {"Indicator": code, "Event": event, "Mode": mode, "Side": side, "Symbol": "OANDA:XAUUSD", "Timeframe": "5",
         "Version": "v3", "Setup ID": sid, "Event ID": sid + ":" + (eid_suffix or event), "Entry": entry, "SL": sl, "TP": tp,
         "Terminal": terminal, "Identity Status": "LINKED", "Time Unit": "unix_ms",
         "Observed At Ms": "1789990000000", "Bar Time Ms": "1789989900000"}
    f.update(extra)
    return {k: v for k, v in f.items() if v is not None}

lv_sid = "LV|v1|OANDA:XAUUSD|1789948800000"
lv = {"Indicator": "LV", "Event": "INFO", "Mode": "None", "Side": "NONE", "Symbol": "OANDA:XAUUSD", "Timeframe": "1D", "Version": "v1",
      "Setup ID": lv_sid, "Event ID": lv_sid + ":INFO", "Terminal": "false", "Identity Status": "REFERENCE", "Time Unit": "unix_ms",
      "Observed At Ms": "1789990000000", "Bar Time Ms": "1789948800000", "Day Close Ms": "1790035200000", "Feed Timezone": "UTC",
      "PDH": "4400", "PDL": "4350", "PWH": "4450", "PWL": "4300", "PMH": "4500", "PML": "4200", "Daily Open": "4380", "Weekly Open": "4360", "Monthly Open": "4320"}

cases = {
  "setup_buy": block(**setup()),
  "setup_sell": block(**setup(side="SELL", entry="4380", sl="4390", tp="4350")),
  "entry_market_amd": block(**setup(code="AMD", event="ENTRY", mode="Market")),
  "tp_terminal": block(**setup(event="TP", terminal="true", eid_suffix="TP:1")),
  "tp_explicit_exit": block(**setup(event="TP", terminal="true", Exit="4399.5")),
  "sl_terminal": block(**setup(event="SL", terminal="true")),
  "sd_tp_level": block(**setup(code="SD", event="TP", terminal="false", eid_suffix="TP:2R")),
  "close_no_price": block(**setup(event="CLOSE", terminal="true")),
  "info_unlinked": block(**setup(event="INFO", **{"Identity Status": "UNLINKED", "Entry": "", "SL": "", "TP": ""})),
  "summary": block(**setup(event="SUMMARY", entry="", sl="", tp="")),
  "setup_name": block(**setup(**{"Setup Name": "Demand Zone 07"})),
  "two_blocks": block(**setup()) + "\ntext\n" + block(**setup(event="TP", terminal="true")),
  "period_levels": block(**lv),
  "err_empty": "hello",
  "err_unbalanced": block(**setup()) + "\n[WF1]",
  "err_dup_field": "[WF1]\nIndicator:DT\nIndicator:DT\n[/WF1]",
  "err_blank_line": "[WF1]\nIndicator:DT\n\nEvent:SETUP\n[/WF1]",
  "err_bad_code": block(**setup(Indicator="ZZ")),
  "err_bad_order": block(**setup(sl="4390")),
  "err_mode_mismatch": block(**setup(mode="Market")),
  "err_entry_limit": block(**setup(code="AMD", event="ENTRY", mode="Limit")),
  "err_not_terminal": block(**setup(event="SL", terminal="false")),
  "err_future": block(**setup(**{"Observed At Ms": "1790100000000"})),
  "err_time_unit": block(**setup(**{"Time Unit": "s"})),
  "err_sid_mismatch": block(**setup(Symbol="OANDA:EURUSD")),
  "err_eid_mismatch": block(**setup(eid_suffix="ENTRY")),
  "err_price_zero": block(**setup(entry="0")),
  "err_price_text": block(**setup(entry="abc")),
  "err_terminal_bad": block(**setup(terminal="yes")),
  "err_lv_bad": block(**{**lv, "Timeframe": "5"}),
  "err_lv_high_low": block(**{**lv, "PDH": "4000"}),
  "err_bad_tf": block(**setup(Timeframe="5m")),
}
wf = {}
for name, text in cases.items():
    try: wf[name] = {"text": text, "ok": wf_contract.parse(text, now=NOW)}
    except ValueError as e: wf[name] = {"text": text, "error": str(e)}

shape_cases = [
  "#S B,acc,1789700000,1789712600,4386.5,4379.4,Accumulation 07;L,cisd,1789712900,1789719000,4384.2,CISD",
  "#S B,zone_d,1789700000,0,4386.5,4379.4,Demand, strong;L,unknown,1789712900,0,4,384.2",
  "#S P,structure,100,200,1.5,2.5,trend;P,structure,200,100,1,2,bad;X,foo",
  "#S B,acc,abc,1,2,3;L,sl,0,5,4380",
  "#S ",
]
shapes = []
for s in shape_cases:
    text = "Alert body\n" + s + "\ntrailer"
    clean, sh = tv_shapes.split(text)
    shapes.append({"text": text, "clean": clean, "shapes": sh})
tfs = {tf: tv_shapes.tf_seconds(tf) for tf in ["5m", "1H", "15", "D", "1d", "W", "2w", "30s", "", "abc", None, "4h"]}
json.dump({"now": NOW, "wf1": wf, "shapes": shapes, "tf": {str(k): v for k, v in tfs.items()}}, open("fixtures.json", "w"), ensure_ascii=False, indent=1)
print(len(wf), "wf1 cases,", sum("ok" in v for v in wf.values()), "ok")
