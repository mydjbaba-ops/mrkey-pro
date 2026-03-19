import { useState, useMemo } from "react";

// ── CSS injecté globalement ───────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{
  --bg:#0a0c10;--bg2:#111318;--bg3:#181b23;--bg4:#1f232e;
  --b:#252a38;--b2:#2e3548;--b3:#3d4560;
  --t:#f0f2f8;--t2:#8b95b8;--t3:#4e5878;
  --bl:#3b82f6;--blg:rgba(59,130,246,.09);--blb:rgba(59,130,246,.22);
  --gr:#10b981;--gbg:rgba(16,185,129,.1);--gbdr:rgba(16,185,129,.28);
  --am:#f59e0b;--abg:rgba(245,158,11,.1);--abdr:rgba(245,158,11,.28);
  --rd:#ef4444;--rbg:rgba(239,68,68,.1);--rbdr:rgba(239,68,68,.28);
  --r:13px;
}
html,body,#root{height:100%;background:var(--bg);}
.km{display:flex;flex-direction:column;height:100vh;max-width:430px;margin:0 auto;background:var(--bg);color:var(--t);font-family:'Inter',sans-serif;overflow:hidden;}
.scr{flex:1;overflow-y:auto;scrollbar-width:none;}
.scr::-webkit-scrollbar{display:none;}
.hdr{height:54px;display:flex;align-items:center;padding:0 14px;border-bottom:1px solid var(--b);background:var(--bg2);flex-shrink:0;gap:10px;}
.ht{font-size:16px;font-weight:700;color:var(--t);flex:1;letter-spacing:-.02em;}
.hs{font-size:10px;color:var(--t3);letter-spacing:.07em;text-transform:uppercase;margin-top:1px;font-family:'JetBrains Mono',monospace;}
.hbk{height:32px;padding:0 11px;border-radius:8px;border:1px solid var(--b2);background:var(--bg3);color:var(--t2);font-size:12px;font-weight:600;cursor:pointer;}
.tb{height:60px;display:flex;border-top:1px solid var(--b);background:var(--bg);flex-shrink:0;}
.ti{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;border:none;background:none;color:var(--t3);position:relative;}
.ti.on{color:var(--bl);}
.ti.on::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:22px;height:2px;background:var(--bl);border-radius:1px 1px 0 0;}
.tii{font-size:19px;line-height:1;}
.til{font-size:10px;font-weight:600;letter-spacing:.02em;}
.tbdg{position:absolute;top:7px;right:calc(50% - 19px);background:var(--am);color:#000;border-radius:99px;font-size:8px;font-weight:700;padding:1px 4px;min-width:14px;text-align:center;}
.sr{position:relative;margin:10px 14px 0;}
.sri{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none;}
.sr input{width:100%;height:42px;background:var(--bg2);border:1px solid var(--b2);border-radius:11px;padding:0 32px 0 36px;color:var(--t);font-size:13px;outline:none;font-family:'Inter',sans-serif;}
.sr input:focus{border-color:var(--bl);}
.sr input::placeholder{color:var(--t3);}
.src{position:absolute;right:9px;top:50%;transform:translateY(-50%);background:var(--bg3);border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;color:var(--t3);font-size:10px;display:flex;align-items:center;justify-content:center;}
.cps{display:flex;gap:6px;padding:8px 14px 2px;overflow-x:auto;scrollbar-width:none;}
.cps::-webkit-scrollbar{display:none;}
.cp{height:27px;padding:0 11px;border-radius:99px;border:1px solid var(--b2);background:var(--bg3);color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.cp.on{background:var(--bl);border-color:var(--bl);color:#fff;}
.bdg{display:inline-flex;align-items:center;gap:3px;height:20px;padding:0 7px;border-radius:5px;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace;white-space:nowrap;flex-shrink:0;}
.bdg.in{background:var(--gbg);color:var(--gr);border:1px solid var(--gbdr);}
.bdg.low{background:var(--abg);color:var(--am);border:1px solid var(--abdr);}
.bdg.out{background:var(--rbg);color:var(--rd);border:1px solid var(--rbdr);}
.bdg.neu{background:var(--bg4);color:var(--t2);border:1px solid var(--b2);}
.genbdg{display:inline-flex;align-items:center;height:17px;padding:0 6px;border-radius:4px;font-size:9px;font-weight:700;font-family:'JetBrains Mono',monospace;letter-spacing:.03em;}
.g1a{background:rgba(168,85,247,.12);color:#c084fc;border:1px solid rgba(168,85,247,.25);}
.g1b{background:rgba(236,72,153,.12);color:#f472b6;border:1px solid rgba(236,72,153,.25);}
.g2{background:rgba(59,130,246,.1);color:#60a5fa;border:1px solid rgba(59,130,246,.22);}
.g3{background:rgba(16,185,129,.1);color:#34d399;border:1px solid rgba(16,185,129,.22);}
.g4{background:rgba(245,158,11,.12);color:#fbbf24;border:1px solid rgba(245,158,11,.25);}
.mq-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px;}
.mq-btn{background:var(--bg2);border:1px solid var(--b);border-radius:var(--r);padding:13px 12px;cursor:pointer;text-align:left;transition:border-color .15s;}
.mq-btn:hover{border-color:var(--bl);}
.mq-logo{width:28px;height:28px;border-radius:6px;overflow:hidden;margin-bottom:8px;background:var(--bg3);}
.mq-logo img{width:100%;height:100%;object-fit:cover;}
.mq-name{font-size:14px;font-weight:700;color:var(--t);}
.mq-sub{font-size:11px;color:var(--t3);margin-top:2px;}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 8px;border-bottom:1px solid var(--b);margin-top:6px;}
.sec-left{display:flex;align-items:center;gap:9px;}
.sec-logo{width:28px;height:28px;border-radius:6px;overflow:hidden;background:var(--bg3);}
.sec-logo img{width:100%;height:100%;object-fit:cover;}
.sec-name{font-size:14px;font-weight:700;color:var(--t);}
.sec-cnt{font-size:11px;color:var(--t3);font-family:'JetBrains Mono',monospace;}
.cc{background:var(--bg2);border:1px solid var(--b);border-radius:var(--r);overflow:hidden;margin:0 14px 10px;cursor:pointer;transition:border-color .12s;}
.cc:hover{border-color:var(--b3);}
.cc-top{display:flex;min-height:88px;}
.cc-img{width:80px;min-width:80px;background:var(--bg3);overflow:hidden;flex-shrink:0;}
.cc-img img{width:100%;height:100%;object-fit:cover;display:block;}
.cc-body{flex:1;padding:10px 11px;display:flex;flex-direction:column;gap:4px;min-width:0;}
.cc-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;}
.cc-title{font-size:12.5px;font-weight:700;color:var(--t);line-height:1.25;flex:1;}
.cc-tech{font-size:10.5px;color:var(--t2);font-family:'JetBrains Mono',monospace;line-height:1.5;}
.cc-lames{font-size:10px;color:var(--t3);}
.cc-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;align-items:center;}
.cc-div{height:1px;background:var(--b);}
.cc-compat{padding:8px 11px;}
.cc-cl{font-size:9px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px;}
.cc-cm{font-size:11px;color:var(--t);line-height:1.7;}
.cc-other{font-size:11px;color:var(--bl);margin-top:4px;display:flex;align-items:center;gap:4px;}
.cc-dot{width:5px;height:5px;border-radius:50%;background:var(--bl);flex-shrink:0;}
.cc-note{padding:6px 11px;border-top:1px solid var(--b);}
.cc-ntxt{font-size:10px;color:var(--t3);line-height:1.55;font-style:italic;}
.cc-warn{color:var(--am);}
.dh{position:relative;height:170px;background:var(--bg3);overflow:hidden;flex-shrink:0;}
.dh-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,12,16,.97) 0%,rgba(10,12,16,.3) 55%,transparent 100%);}
.dh-info{position:absolute;bottom:0;left:0;right:0;padding:13px 14px;}
.dh-title{font-size:19px;font-weight:700;color:#fff;letter-spacing:-.02em;line-height:1.2;}
.dh-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;}
.dh-tag{font-size:10px;color:rgba(255,255,255,.55);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:5px;padding:2px 7px;font-family:'JetBrains Mono',monospace;}
.sl{font-size:9px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.12em;padding:12px 14px 5px;display:flex;align-items:center;justify-content:space-between;}
.slc{color:var(--bl);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;}
.db{background:var(--bg2);border:1px solid var(--b);border-radius:var(--r);margin:0 14px 9px;overflow:hidden;}
.dr{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--b);}
.dr:last-child{border-bottom:none;}
.dl{font-size:11px;color:var(--t3);font-weight:500;flex-shrink:0;}
.dv{font-size:12px;color:var(--t);font-weight:600;text-align:right;font-family:'JetBrains Mono',monospace;}
.dv.pl{font-family:'Inter',sans-serif;font-weight:500;}
.cbloc{background:var(--bg2);border:1px solid var(--b);border-radius:var(--r);margin:0 14px 9px;overflow:hidden;}
.ci{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--b);}
.ci:last-child{border-bottom:none;}
.cveh{font-size:13px;font-weight:600;color:var(--t);}
.cyr{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--bl);background:var(--blg);border:1px solid var(--blb);padding:2px 6px;border-radius:4px;flex-shrink:0;margin-left:8px;}
.sts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 14px;}
.stc{background:var(--bg2);border:1px solid var(--b);border-radius:11px;padding:12px 10px;}
.stvv{font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace;line-height:1;}
.stll{font-size:9px;color:var(--t3);margin-top:3px;text-transform:uppercase;letter-spacing:.06em;font-weight:500;}
.sc2{background:var(--bg2);border:1px solid var(--b);border-radius:var(--r);margin:0 14px 9px;overflow:hidden;cursor:pointer;}
.sc2h{display:flex;gap:10px;padding:11px 12px;align-items:flex-start;}
.sc2i{width:48px;height:48px;border-radius:8px;background:var(--bg3);overflow:hidden;flex-shrink:0;}
.sc2i img{width:100%;height:100%;object-fit:cover;}
.sc2n{font-size:13px;font-weight:700;color:var(--t);}
.sc2s{font-size:10px;color:var(--t3);margin-top:2px;font-family:'JetBrains Mono',monospace;}
.sc2t{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;}
.sc2note{border-top:1px solid var(--b);padding:6px 12px;font-size:10px;color:var(--t3);font-style:italic;}
.emp{display:flex;flex-direction:column;align-items:center;padding:44px 22px;gap:9px;text-align:center;}
.empi{font-size:36px;opacity:.2;}
.empt{font-size:13px;color:var(--t3);line-height:1.65;}
.notes-bloc{margin:0 14px 10px;background:var(--bg2);border:1px solid var(--b);border-radius:var(--r);padding:10px 12px;font-size:11px;color:var(--t2);line-height:1.65;}
.coming{border:1px dashed var(--b2);border-radius:var(--r);padding:13px 12px;display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:11px;text-align:center;}
.fi{width:100%;height:38px;background:var(--bg2);border:1px solid var(--b2);border-radius:9px;padding:0 10px;color:var(--t);font-size:13px;outline:none;font-family:'Inter',sans-serif;}
.fi:focus{border-color:var(--bl);}
.fi::placeholder{color:var(--t3);}
.fta{width:100%;min-height:76px;background:var(--bg2);border:1px solid var(--b2);border-radius:9px;padding:8px 10px;color:var(--t);font-size:12px;outline:none;resize:vertical;font-family:'Inter',sans-serif;line-height:1.6;}
.fta:focus{border-color:var(--bl);}
.fsl{width:100%;height:38px;background:var(--bg2);border:1px solid var(--b2);border-radius:9px;padding:0 10px;color:var(--t);font-size:13px;outline:none;appearance:none;font-family:'Inter',sans-serif;}
.fab{position:fixed;bottom:74px;right:14px;width:50px;height:50px;border-radius:50%;background:var(--bl);border:none;color:#fff;font-size:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(59,130,246,.5);z-index:50;}
`;

// ── Helpers SVG placeholder ───────────────────────────────────────────────────
function mkSvg(bg, ac, lb) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="10" fill="${bg}"/><circle cx="40" cy="62" r="20" fill="none" stroke="${ac}" stroke-width="5"/><circle cx="40" cy="62" r="8" fill="${ac}"/><rect x="58" y="58" width="42" height="8" rx="4" fill="${ac}"/><rect x="82" y="50" width="8" height="20" rx="3" fill="${ac}"/><rect x="94" y="54" width="8" height="14" rx="3" fill="${ac}"/><text x="60" y="98" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="${ac}" opacity="0.65">${lb}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
const BI = {
  Peugeot: mkSvg("#1a1f35","#60a5fa","PSA"),
  Citroën: mkSvg("#1a1f35","#93c5fd","PSA"),
  DS:      mkSvg("#1a1a30","#a78bfa","DS"),
  Opel:    mkSvg("#181818","#e2e8f0","OPEL"),
  Fiat:    mkSvg("#1a1010","#f87171","FIAT"),
  Toyota:  mkSvg("#1a1010","#fb923c","TOYOTA"),
};
const gi = (m) => BI[m] || mkSvg("#1c2030","#2a2f45","KEY");

// ── Données ───────────────────────────────────────────────────────────────────
const GL = { G1a:"G1a · ID33", G1b:"G1b · ID45", G2:"G2 · ID46", G3:"G3 · ID46", G4:"G4 · ID49" };
const TL = { nonMainLibre:"Télécommande", mainLibre:"Main libre", lameSeule:"Lame seule" };
const GENS = ["Tous","G1a","G1b","G2","G3","G4"];

const INIT_CAT = [
  {id:"g1-01",gen:"G1a",marque:"Peugeot",type:"nonMainLibre",btn:1,tr:"ID33",pcf:"7930",freq:"433.92 MHz",pile:"CR2032",lames:["NE72","SX9"],refs:["6490.A0","6490.A1","9926GV"],img:"",notes:"ID33 fixe — duplication directe sans cryptage. Lame NE72 sur 106/Saxo, SX9 sur 306/Partner. Système IMMO1 PSA.",compat:[{m:"Peugeot",v:"106",a:"1995–2003"},{m:"Peugeot",v:"306",a:"1995–2002"},{m:"Peugeot",v:"Partner Ph1",a:"1996–2008"},{m:"Citroën",v:"Saxo",a:"1996–2004"},{m:"Citroën",v:"Xsara Ph1",a:"1997–2000"},{m:"Citroën",v:"Berlingo Ph1",a:"1996–2008"}]},
  {id:"g1-02",gen:"G1a",marque:"Peugeot",type:"nonMainLibre",btn:2,tr:"ID33",pcf:"7930",freq:"433.92 MHz",pile:"CR2032",lames:["NE78"],refs:["6490.B0","6490.B1"],img:"",notes:"⚠️ 406 1ère période ID33. Après 1999 : ID45 BSI Siemens — référence différente.",compat:[{m:"Peugeot",v:"406 Pré-BSI",a:"1996–1998"},{m:"Citroën",v:"Xantia Ph2",a:"1993–1999"}]},
  {id:"g1-03",gen:"G1a",marque:"Peugeot",type:"nonMainLibre",btn:2,tr:"ID33",pcf:"7931",freq:"433.92 MHz",pile:"CR2032",lames:["SX9","VA2"],refs:["6490.C0","6490.C1"],img:"",notes:"Plateforme Eurovan PSA/Fiat — même antivol. Lame SX9 ou VA2 selon modèle.",compat:[{m:"Peugeot",v:"806",a:"1997–2002"},{m:"Peugeot",v:"Expert Ph1",a:"1997–2007"},{m:"Peugeot",v:"Ranch",a:"1997–2004"},{m:"Citroën",v:"Evasion",a:"1997–2002"},{m:"Citroën",v:"Jumpy Ph1",a:"1997–2007"},{m:"Fiat",v:"Scudo Ph1",a:"1996–2007"},{m:"Fiat",v:"Ulysse",a:"1997–2002"}]},
  {id:"g1-lame",gen:"G1a",marque:"Peugeot",type:"lameSeule",btn:0,tr:"",pcf:"",freq:"",pile:"",lames:["SX9","NE72","NE66"],refs:["6930.A1","6930.A2"],img:"",notes:"Sans transpondeur — duplication mécanique pure. Machine manuelle ou pantographe.",compat:[{m:"Peugeot",v:"205",a:"1988–1998"},{m:"Peugeot",v:"306 pré-immo",a:"1993–1997"},{m:"Peugeot",v:"405",a:"1988–1996"},{m:"Peugeot",v:"605",a:"1989–1999"},{m:"Citroën",v:"ZX",a:"1991–1997"},{m:"Citroën",v:"Xantia Ph1",a:"1993–1997"}]},
  {id:"g1b-01",gen:"G1b",marque:"Peugeot",type:"nonMainLibre",btn:2,tr:"ID45",pcf:"7935",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","NE78"],refs:["6490.AH","6490.AJ","6490.AF"],img:"",notes:"⚠️ PCF7935 précrypté — précodage T15/Silca requis. BSI Siemens VDO. 206 : coexistence ID33/ID45 selon millésime.",compat:[{m:"Peugeot",v:"206",a:"1998–2012"},{m:"Peugeot",v:"406 BSI Siemens",a:"1999–2004"},{m:"Citroën",v:"Xsara Ph2/Ph3",a:"1999–2006"},{m:"Citroën",v:"Xsara Picasso",a:"1999–2010"},{m:"Citroën",v:"Berlingo Ph2",a:"1999–2008"}]},
  {id:"g1b-02",gen:"G1b",marque:"Peugeot",type:"nonMainLibre",btn:2,tr:"ID45",pcf:"7935",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","HU83"],refs:["6490.Z4","6490.Z5","6490.Z6"],img:"",notes:"BSI 1/2/3 selon manuel PSA. T15 Silca ou JMA TP14 requis. HU83 sur 607/807 haut de gamme.",compat:[{m:"Peugeot",v:"307 Ph1",a:"2001–2007"},{m:"Peugeot",v:"607",a:"2001–2004"},{m:"Peugeot",v:"807",a:"2002–2007"},{m:"Citroën",v:"C5 Ph1",a:"2001–2004"},{m:"Citroën",v:"C8",a:"2002–2014"}]},
  {id:"g2-01",gen:"G2",marque:"Peugeot",type:"nonMainLibre",btn:2,tr:"ID46",pcf:"7941",freq:"433.92 MHz",pile:"CR2032",lames:["VA2"],refs:["6490.CB","6490.CC","6490.H7"],img:"",notes:"BSI 2e génération. Programmation OBD requis. VA2 standard PSA.",compat:[{m:"Peugeot",v:"207",a:"2006–2012"},{m:"Peugeot",v:"307 Ph2",a:"2004–2008"},{m:"Peugeot",v:"1007",a:"2005–2009"},{m:"Citroën",v:"C3 Ph2",a:"2005–2010"},{m:"Citroën",v:"C2",a:"2004–2009"}]},
  {id:"g2-02",gen:"G2",marque:"Peugeot",type:"nonMainLibre",btn:3,tr:"ID46",pcf:"7941",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","HU83"],refs:["6490.G3","6490.G4","6490.H2"],img:"",notes:"BSI gen 2 — 3 boutons. VA2 ou HU83 selon version. Vérifier type BSI.",compat:[{m:"Peugeot",v:"308 Ph1",a:"2007–2013"},{m:"Peugeot",v:"407",a:"2004–2011"},{m:"Peugeot",v:"607",a:"2004–2010"},{m:"Peugeot",v:"807",a:"2004–2014"},{m:"Citroën",v:"C5 Ph2",a:"2005–2012"},{m:"Citroën",v:"C8",a:"2004–2014"},{m:"DS",v:"DS5",a:"2011–2015"}]},
  {id:"g2-03",gen:"G2",marque:"Peugeot",type:"nonMainLibre",btn:3,tr:"ID46",pcf:"7941",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","VA6"],refs:["6490.LE","6490.LF","98 059 109 80"],img:"",notes:"Plateforme PSA large. VA2 ou VA6 selon millésime. Badge logo = 2 réfs distinctes.",compat:[{m:"Peugeot",v:"3008 Ph1",a:"2009–2016"},{m:"Peugeot",v:"5008 Ph1",a:"2009–2016"},{m:"Peugeot",v:"RCZ",a:"2010–2015"},{m:"Citroën",v:"C4 Ph2",a:"2010–2018"},{m:"Citroën",v:"C4 Picasso Ph1",a:"2006–2013"},{m:"Citroën",v:"C5 Ph3",a:"2012–2017"},{m:"DS",v:"DS4",a:"2011–2018"}]},
  {id:"g2-lame",gen:"G2",marque:"Peugeot",type:"lameSeule",btn:0,tr:"ID46",pcf:"7941",freq:"",pile:"",lames:["SX9","NE72"],refs:["6930.L1","6930.V2"],img:"",notes:"Lame seule ID46. Programmation OBD ou clonage selon outil.",compat:[{m:"Peugeot",v:"106",a:"1996–2003"},{m:"Peugeot",v:"206",a:"1998–2012"},{m:"Peugeot",v:"306",a:"1996–2002"},{m:"Citroën",v:"Saxo",a:"1996–2004"},{m:"Citroën",v:"Xsara",a:"1997–2006"},{m:"Citroën",v:"Berlingo",a:"1996–2008"}]},
  {id:"g3-01",gen:"G3",marque:"Peugeot",type:"nonMainLibre",btn:3,tr:"ID46",pcf:"7941",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","VA6"],refs:["6490.LE","6490.LF","98 097 328 80"],img:"",notes:"BSI 3e génération. OBD. VA2 ou VA6 selon millésime.",compat:[{m:"Peugeot",v:"308 Ph2",a:"2013–2021"},{m:"Peugeot",v:"2008 Ph1",a:"2013–2019"},{m:"Peugeot",v:"Partner Ph3",a:"2015–2019"},{m:"Citroën",v:"C4 Picasso Ph2",a:"2013–2018"},{m:"Citroën",v:"C4 Cactus",a:"2014–2018"},{m:"DS",v:"DS3",a:"2013–2019"},{m:"Opel",v:"Crossland X",a:"2017–2020"}]},
  {id:"g3-02",gen:"G3",marque:"Peugeot",type:"nonMainLibre",btn:3,tr:"ID46",pcf:"7941",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","HU83"],refs:["6490.LM","6490.LN","98 097 326 80"],img:"",notes:"Plateforme EMP2. OBD ou PIN. VA2 ou HU83 selon équipement.",compat:[{m:"Peugeot",v:"3008 Ph2",a:"2016–2021"},{m:"Peugeot",v:"5008 Ph2",a:"2017–2021"},{m:"Peugeot",v:"508 Ph1",a:"2014–2018"},{m:"Peugeot",v:"Expert Ph3",a:"2016–2022"},{m:"Citroën",v:"C5 Aircross",a:"2018–2022"},{m:"DS",v:"DS7 Crossback",a:"2017–2022"},{m:"Opel",v:"Grandland X",a:"2017–2021"}]},
  {id:"g3-03",gen:"G3",marque:"Peugeot",type:"nonMainLibre",btn:3,tr:"ID46",pcf:"7941",freq:"433.92 MHz",pile:"CR2025",lames:["VA2"],refs:["6490.LA","6490.LB","98 064 880 80"],img:"",notes:"⚠️ Pile CR2025 — différent de 308 en CR2032. Lame VA2 uniquement. Plateforme PF1.",compat:[{m:"Peugeot",v:"208 Ph1",a:"2012–2019"},{m:"Peugeot",v:"301",a:"2012–2018"},{m:"Citroën",v:"C3 Ph3",a:"2016–2022"},{m:"Citroën",v:"C-Elysée",a:"2012–2020"},{m:"DS",v:"DS3 Ph1",a:"2013–2016"}]},
  {id:"g3-lame",gen:"G3",marque:"Peugeot",type:"lameSeule",btn:0,tr:"ID46",pcf:"7941",freq:"",pile:"",lames:["VA2"],refs:["6930.GQ","6930.GR"],img:"",notes:"Lame de secours télécommande pliante. ID46 sur lame. Couper lame vierge VA2.",compat:[{m:"Peugeot",v:"208 Ph1",a:"2012–2019"},{m:"Peugeot",v:"2008 Ph1",a:"2013–2019"},{m:"Citroën",v:"C3 Ph3",a:"2016–2022"},{m:"DS",v:"DS3",a:"2013–2019"}]},
  {id:"g4-01",gen:"G4",marque:"Peugeot",type:"nonMainLibre",btn:3,tr:"ID49",pcf:"7953",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","VA6"],refs:["9840417180","9811618280"],img:"",notes:"Plateforme CMP. HITAG Pro ID49 — outil compatible obligatoire (Autel IM608 Pro, VVDI2). Non compatible ID46.",compat:[{m:"Peugeot",v:"208 Ph2",a:"2019+"},{m:"Peugeot",v:"2008 Ph2",a:"2019+"},{m:"Citroën",v:"C4 Ph3",a:"2020+"},{m:"Citroën",v:"ë-C4",a:"2021+"},{m:"DS",v:"DS3 Crossback",a:"2019+"},{m:"Opel",v:"Corsa F",a:"2019+"},{m:"Opel",v:"Mokka B",a:"2020+"}]},
  {id:"g4-02",gen:"G4",marque:"Peugeot",type:"mainLibre",btn:3,tr:"ID49",pcf:"7953",freq:"433.92 MHz",pile:"CR2032",lames:["VA2","VA6"],refs:["9840418780","9840419780"],img:"",notes:"Main libre — démarrage sans clé. HITAG Pro ID49 obligatoire. PIN requis sur certains véhicules.",compat:[{m:"Peugeot",v:"308 Ph3",a:"2021+"},{m:"Peugeot",v:"3008 Ph3",a:"2021+"},{m:"Peugeot",v:"408",a:"2022+"},{m:"Peugeot",v:"508 Ph2",a:"2018+"},{m:"Citroën",v:"C5 X",a:"2021+"},{m:"DS",v:"DS4 Ph2",a:"2021+"},{m:"Opel",v:"Astra L",a:"2021+"}]},
  {id:"g4-03",gen:"G4",marque:"Peugeot",type:"mainLibre",btn:4,tr:"ID49",pcf:"7953",freq:"433.92 MHz",pile:"CR2032",lames:["VA2"],refs:["9840417880","1609531680"],img:"",notes:"4 boutons main libre haut de gamme. ProAce = rebadge Expert PSA/Toyota. HITAG Pro ID49.",compat:[{m:"Peugeot",v:"5008 Ph3",a:"2020+"},{m:"Peugeot",v:"Traveller Ph2",a:"2019+"},{m:"Peugeot",v:"Expert Ph4",a:"2020+"},{m:"Citroën",v:"Jumpy Ph3",a:"2020+"},{m:"DS",v:"DS9",a:"2020+"},{m:"Opel",v:"Vivaro C",a:"2019+"},{m:"Toyota",v:"ProAce City",a:"2019+"}]},
];

const INIT_STK = {
  "g3-01": {qty:3,seuil:2,four:"MK3",emp:"Tiroir A1",prix:18.5},
  "g1b-01":{qty:1,seuil:2,four:"Silca",emp:"Tiroir A2",prix:14.9,note:"Dernier — relancer commande"},
  "g2-02": {qty:5,seuil:2,four:"KeyDIY",emp:"Tiroir B1",prix:22},
  "g4-01": {qty:0,seuil:1,four:"MK3",emp:"Tiroir A3",prix:11.2,note:"Rupture — à commander"},
};

// ── Composants utilitaires ────────────────────────────────────────────────────
function Bdg({ t, l }) {
  return <span className={`bdg ${t}`}>{l}</span>;
}
function GenBdg({ g }) {
  const cls = g.toLowerCase().replace(".", "");
  return <span className={`genbdg ${cls}`}>{GL[g] || g}</span>;
}
function KeyImg({ marque, img }) {
  const src = img || gi(marque);
  return <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e => e.target.style.display="none"} />;
}
function gsi(id, stk) {
  const s = stk[id];
  if (!s) return { t:"out", l:"Hors stock" };
  if (s.qty === 0) return { t:"out", l:"Rupture" };
  if (s.qty <= s.seuil) return { t:"low", l:`Faible · ${s.qty}` };
  return { t:"in", l:`En stock · ${s.qty}` };
}

// ── Carte clé ────────────────────────────────────────────────────────────────
function CleCard({ c, mq, stk, onClick }) {
  const si = gsi(c.id, stk);
  const ls = c.lames.join(" / ");
  const tech = [c.tr, c.pcf ? `PCF ${c.pcf}` : "", c.freq].filter(Boolean).join("  ·  ");
  const mods = c.compat.filter(v => v.m === mq);
  const autres = [...new Set(c.compat.filter(v => v.m !== mq).map(v => v.m))];
  const isWarn = c.notes?.startsWith("⚠️");
  return (
    <div className="cc" onClick={onClick}>
      <div className="cc-top">
        <div className="cc-img"><KeyImg marque={c.marque} img={c.img} /></div>
        <div className="cc-body">
          <div className="cc-hdr">
            <div className="cc-title">{TL[c.type] || c.type}{c.btn ? ` · ${c.btn} btn` : ""}</div>
            <Bdg t={si.t} l={(si.t==="in"?"● ":si.t==="low"?"◐ ":"○ ")+si.l} />
          </div>
          {tech && <div className="cc-tech">{tech}</div>}
          {ls && <div className="cc-lames">Lames : {ls}</div>}
          <div className="cc-tags">
            <GenBdg g={c.gen} />
            {c.pile && <Bdg t="neu" l={c.pile} />}
          </div>
        </div>
      </div>
      <div className="cc-div" />
      <div className="cc-compat">
        <div className="cc-cl">Modèles {mq || c.marque} compatibles</div>
        <div className="cc-cm">
          {mods.slice(0,4).map((v,i) => (
            <span key={i}>{i>0?" · ":""}<b>{v.v}</b>{" "}<span style={{color:"var(--t3)",fontSize:10}}>{v.a}</span></span>
          ))}
          {mods.length > 4 && <span style={{color:"var(--t3)",fontSize:10}}> +{mods.length-4} autres</span>}
        </div>
        {autres.length > 0 && (
          <div className="cc-other"><span className="cc-dot" />Aussi compatible : {autres.join(", ")}</div>
        )}
      </div>
      {c.notes && (
        <div className="cc-note">
          <div className={`cc-ntxt${isWarn?" cc-warn":""}`}>{c.notes}</div>
        </div>
      )}
    </div>
  );
}

// ── Écran Marques ─────────────────────────────────────────────────────────────
function MarquesScr({ cat, stk, onFiche }) {
  const [marque, setMarque] = useState(null);
  const [q, setQ] = useState("");
  const [gen, setGen] = useState("Tous");

  const marques = useMemo(() => [...new Set(cat.flatMap(c => c.compat.map(v => v.m)))].sort(), [cat]);

  const filtered = useMemo(() => {
    if (!marque) return [];
    return cat.filter(c => {
      if (!c.compat.some(v => v.m === marque)) return false;
      if (gen !== "Tous" && c.gen !== gen) return false;
      if (!q) return true;
      const qn = q.toLowerCase();
      return [c.tr, c.pcf, ...c.lames, ...c.compat.map(v=>v.m), ...c.compat.map(v=>v.v)]
        .some(x => x && x.toLowerCase().includes(qn));
    });
  }, [cat, marque, gen, q]);

  if (!marque) return (
    <>
      <div className="hdr">
        <div><div className="ht">Marques</div><div className="hs">{marques.length} marque{marques.length>1?"s":""} · {cat.length} références</div></div>
      </div>
      <div className="scr">
        <div className="mq-grid">
          {marques.map(m => {
            const nk = new Set(cat.filter(c=>c.compat.some(v=>v.m===m)).map(c=>c.id)).size;
            const nm = new Set(cat.flatMap(c=>c.compat.filter(v=>v.m===m).map(v=>v.modele))).size;
            return (
              <div key={m} className="mq-btn" onClick={()=>setMarque(m)}>
                <div className="mq-logo"><img src={gi(m)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>
                <div className="mq-name">{m}</div>
                <div className="mq-sub">{nk} clé{nk>1?"s":""}</div>
              </div>
            );
          })}
          <div className="coming">+ Renault, VW,<br/>BMW… à venir</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="hdr">
        <div><div className="ht">{marque}</div><div className="hs">{filtered.length} clé{filtered.length!==1?"s":""}</div></div>
        <button className="hbk" onClick={()=>{setMarque(null);setQ("");setGen("Tous");}}>← Marques</button>
      </div>
      <div className="scr">
        <div className="sr">
          <span className="sri">🔍</span>
          <input placeholder="Modèle, transpondeur, lame…" value={q} onChange={e=>setQ(e.target.value)} />
          {q && <button className="src" onClick={()=>setQ("")}>✕</button>}
        </div>
        <div className="cps">
          {GENS.map(g => (
            <button key={g} className={`cp${gen===g?" on":""}`} onClick={()=>setGen(g)}>
              {g==="Tous" ? "Toutes générations" : GL[g]||g}
            </button>
          ))}
        </div>
        <div style={{paddingTop:8}}>
          {filtered.length === 0
            ? <div className="emp"><div className="empi">🔑</div><div className="empt">Aucune clé trouvée.</div></div>
            : filtered.map(c => <CleCard key={c.id} c={c} mq={marque} stk={stk} onClick={()=>onFiche(c)} />)
          }
        </div>
      </div>
    </>
  );
}

// ── Écran Catalogue ───────────────────────────────────────────────────────────
function CatalogueScr({ cat, stk, onFiche, onAdd }) {
  const [q, setQ] = useState("");
  const [gen, setGen] = useState("Tous");

  const filtered = useMemo(() => cat.filter(c => {
    if (gen !== "Tous" && c.gen !== gen) return false;
    if (!q) return true;
    const qn = q.toLowerCase();
    return [c.marque, c.tr, c.pcf, ...c.lames, ...c.compat.map(v=>v.m), ...c.compat.map(v=>v.v)]
      .some(x => x && x.toLowerCase().includes(qn));
  }), [cat, gen, q]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach(c => { if (!map[c.marque]) map[c.marque]=[]; map[c.marque].push(c); });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <>
      <div className="hdr">
        <div><div className="ht">Catalogue</div><div className="hs">{filtered.length} référence{filtered.length!==1?"s":""}</div></div>
      </div>
      <div className="scr">
        <div className="sr">
          <span className="sri">🔍</span>
          <input placeholder="Marque, modèle, transpondeur, lame…" value={q} onChange={e=>setQ(e.target.value)} />
          {q && <button className="src" onClick={()=>setQ("")}>✕</button>}
        </div>
        <div className="cps">
          {GENS.map(g => (
            <button key={g} className={`cp${gen===g?" on":""}`} onClick={()=>setGen(g)}>
              {g==="Tous" ? "Génération" : GL[g]||g}
            </button>
          ))}
        </div>
        <div style={{paddingTop:6}}>
          {groups.length === 0
            ? <div className="emp"><div className="empi">🔑</div><div className="empt">Aucun résultat.</div></div>
            : groups.map(([m, cles]) => (
              <div key={m}>
                <div className="sec-hdr">
                  <div className="sec-left">
                    <div className="sec-logo"><img src={gi(m)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>
                    <span className="sec-name">{m}</span>
                  </div>
                  <span className="sec-cnt">{cles.length} clé{cles.length>1?"s":""}</span>
                </div>
                <div style={{paddingTop:8}}>
                  {cles.map(c => <CleCard key={c.id} c={c} mq={m} stk={stk} onClick={()=>onFiche(c)} />)}
                </div>
              </div>
            ))
          }
        </div>
        <div style={{height:80}} />
      </div>
      <button className="fab" onClick={onAdd}>+</button>
    </>
  );
}

// ── Écran Stock ───────────────────────────────────────────────────────────────
function StockScr({ cat, stk, onFiche }) {
  const items = cat.filter(c => stk[c.id]);
  const alt = items.filter(c => { const s=stk[c.id]; return s.qty>0&&s.qty<=s.seuil; }).length;
  const rup = items.filter(c => stk[c.id].qty===0).length;
  return (
    <>
      <div className="hdr">
        <div><div className="ht">Stock</div><div className="hs">{items.length} article{items.length!==1?"s":""}</div></div>
      </div>
      <div className="scr">
        <div className="sts">
          <div className="stc"><div className="stvv">{items.length}</div><div className="stll">Références</div></div>
          <div className="stc"><div className="stvv" style={{color:alt>0?"var(--am)":"var(--t)"}}>{alt}</div><div className="stll">Alertes</div></div>
          <div className="stc"><div className="stvv" style={{color:rup>0?"var(--rd)":"var(--t)"}}>{rup}</div><div className="stll">Ruptures</div></div>
        </div>
        {items.map(c => {
          const s = stk[c.id]; const si = gsi(c.id, stk);
          const tech = [c.tr, c.freq].filter(Boolean).join(" · ");
          const col = si.t==="in"?"var(--gr)":si.t==="low"?"var(--am)":"var(--rd)";
          return (
            <div key={c.id} className="sc2" onClick={()=>onFiche(c)}>
              <div className="sc2h">
                <div className="sc2i"><KeyImg marque={c.marque} img={c.img} /></div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="sc2n">{TL[c.type]}{c.btn?` · ${c.btn} btn`:""}</div>
                  <div className="sc2s">{tech}{s.emp?` · ${s.emp}`:""}</div>
                  <div className="sc2t">
                    <GenBdg g={c.gen} />
                    <Bdg t={si.t} l={(si.t==="in"?"● ":si.t==="low"?"◐ ":"○ ")+si.l} />
                    {s.four && <Bdg t="neu" l={s.four} />}
                    {s.prix && <Bdg t="neu" l={`${s.prix}€`} />}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:col}}>{s.qty}</div>
                  <div style={{fontSize:9,color:"var(--t3)"}}>seuil {s.seuil}</div>
                </div>
              </div>
              {s.note && <div className="sc2note">{s.note}</div>}
            </div>
          );
        })}
        <div style={{height:8}} />
      </div>
    </>
  );
}

// ── Écran Fiche détail ────────────────────────────────────────────────────────
function FicheScr({ c, stk, onBack }) {
  const si = gsi(c.id, stk);
  const tech = [c.tr, c.pcf?`PCF ${c.pcf}`:"", c.freq].filter(Boolean).join("  ·  ");
  const ls = c.lames.join(" / ");
  const R = (l, v, pl) => v!=null&&v!==""&&v!==0 ? (
    <div className="dr" key={l}>
      <span className="dl">{l}</span>
      <span className={`dv${pl?" pl":""}`}>{v}</span>
    </div>
  ) : null;
  return (
    <>
      <div className="hdr">
        <button className="hbk" onClick={onBack}>← Retour</button>
        <div style={{flex:1,minWidth:0}}>
          <div className="ht" style={{fontSize:13}}>{TL[c.type]}{c.btn?` · ${c.btn} boutons`:""}</div>
          <div className="hs">{tech}</div>
        </div>
        <Bdg t={si.t} l={(si.t==="in"?"● ":si.t==="low"?"◐ ":"○ ")+si.l} />
      </div>
      <div className="scr">
        <div className="dh">
          {c.img
            ? <img src={c.img} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} alt="" onError={e=>e.target.style.display="none"} />
            : <div style={{width:"100%",height:"100%",background:"var(--bg3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--t3)",fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}>{c.marque}<br/><span style={{fontSize:8,opacity:.4}}>{c.id}</span></div>
          }
          <div className="dh-ov" />
          <div className="dh-info">
            <div className="dh-title">{TL[c.type]}{c.btn?` · ${c.btn} boutons`:""}</div>
            <div className="dh-tags">
              <GenBdg g={c.gen} />
              {c.tr && <span className="dh-tag">{c.tr}</span>}
              {c.freq && <span className="dh-tag">{c.freq}</span>}
              {c.pile && <span className="dh-tag">Pile {c.pile}</span>}
              {ls && <span className="dh-tag">Lames : {ls}</span>}
            </div>
          </div>
        </div>
        <div className="sl">Caractéristiques</div>
        <div className="db">
          {R("Transpondeur",c.tr)} {R("PCF",c.pcf)} {R("Fréquence",c.freq)}
          {R("Pile",c.pile)} {R("Boutons",c.btn||null)} {R("Type",TL[c.type]||c.type,true)}
          {ls && R("Lames",ls)}
        </div>
        {c.refs?.length > 0 && <>
          <div className="sl">Numéros OEM</div>
          <div className="db">{c.refs.map((n,i) => R(`Réf ${i+1}`,n))}</div>
        </>}
        <div className="sl">Véhicules compatibles <span className="slc">{c.compat.length} véhicule{c.compat.length!==1?"s":""}</span></div>
        <div className="cbloc">
          {c.compat.map((v,i) => (
            <div key={i} className="ci">
              <div><div className="cveh">{v.m} {v.v}</div></div>
              {v.a && <span className="cyr">({v.a})</span>}
            </div>
          ))}
        </div>
        {c.notes && <>
          <div className="sl">Notes terrain</div>
          <div className="notes-bloc">{c.notes}</div>
        </>}
        <div style={{height:8}} />
      </div>
    </>
  );
}

// ── Écran Ajout ───────────────────────────────────────────────────────────────
function AddScr({ onSave, onBack }) {
  const [url, setUrl] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    marque:"Peugeot",gen:"G3",type:"nonMainLibre",btn:"3",
    tr:"ID46",pcf:"7941",freq:"433.92 MHz",pile:"CR2032",
    lames:"VA2, VA6",refs:"",compat:"",notes:""
  });
  const sf = (k,v) => setForm(p => ({...p,[k]:v}));

  const analyseUrl = async () => {
    if (!url.trim()) { setStatus("Colle une URL d'abord."); return; }
    setLoading(true); setStatus("Recherche de la photo…");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:300,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`Visite cette page produit : ${url.trim()}\nTrouve l'URL directe de la photo principale du produit (télécommande ou clé auto).\nRéponds UNIQUEMENT avec un JSON : {"img":"URL_DIRECTE"}\nSi pas de photo, {"img":""}.`}]
        })
      });
      const data = await resp.json();
      let text = "";
      (data.content||[]).forEach(b => { if(b.type==="text") text+=b.text; });
      const m = text.match(/\{[\s\S]*?\}/);
      if (!m) { setStatus("Photo introuvable."); setLoading(false); return; }
      const info = JSON.parse(m[0]);
      if (info.img) { setImgUrl(info.img); setStatus("Photo trouvée ✓"); }
      else setStatus("Aucune photo sur cette page.");
    } catch(e) { setStatus("Erreur : " + e.message); }
    setLoading(false);
  };

  const save = () => {
    const compatLines = form.compat.split("\n").filter(l=>l.trim());
    const compat = compatLines.map(line => {
      const p = line.trim().split(" ");
      return { m:p[0]||"", v:p.slice(1,p.length-1).join(" "), a:p[p.length-1]||"" };
    });
    onSave({
      id: "u-" + Date.now(),
      gen: form.gen, marque: form.marque,
      type: form.type, btn: parseInt(form.btn)||0,
      tr: form.tr, pcf: form.pcf, freq: form.freq, pile: form.pile,
      lames: form.lames.split(",").map(x=>x.trim()).filter(Boolean),
      refs: form.refs.split(",").map(x=>x.trim()).filter(Boolean),
      img: imgUrl, notes: form.notes, compat,
    });
  };

  const FL = ({label,k,ph,type}) => (
    <div style={{marginBottom:9}}>
      <div style={{fontSize:9,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>{label}</div>
      <input className="fi" placeholder={ph} type={type||"text"} value={form[k]} onChange={e=>sf(k,e.target.value)} />
    </div>
  );

  return (
    <>
      <div className="hdr">
        <button className="hbk" onClick={onBack}>← Retour</button>
        <div style={{flex:1}}><div className="ht">Nouveau produit</div></div>
        <button className="hbk" style={{background:"var(--bl)",color:"#fff",borderColor:"var(--bl)"}} onClick={save}>Créer</button>
      </div>
      <div className="scr" style={{padding:"0 14px 80px"}}>
        {/* URL → photo */}
        <div style={{margin:"14px 0 10px"}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Photo via URL de page</div>
          <div style={{display:"flex",gap:8}}>
            <input className="fi" style={{flex:1}} placeholder="Colle l'URL de la page produit…" value={url} onChange={e=>setUrl(e.target.value)} />
            <button className="hbk" style={{background:"var(--bl)",color:"#fff",borderColor:"var(--bl)",whiteSpace:"nowrap"}} onClick={analyseUrl} disabled={loading}>
              {loading?"…":"Analyser"}
            </button>
          </div>
          {status && <div style={{fontSize:10,color:status.includes("✓")?"var(--gr)":status.includes("Erreur")||status.includes("trouvable")?"var(--rd)":"var(--t3)",marginTop:5}}>{status}</div>}
        </div>
        {/* Prévisualisation photo */}
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
          <div style={{width:70,height:70,borderRadius:10,background:"var(--bg3)",border:"1px solid var(--b2)",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"var(--t3)",textAlign:"center",lineHeight:1.4}}>
            {imgUrl
              ? <img src={imgUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={()=>setImgUrl("")} />
              : "Aucune\nphoto"
            }
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>URL image directe</div>
            <input className="fi" style={{fontSize:11}} placeholder="https://…image.jpg" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} />
          </div>
        </div>
        <div style={{height:1,background:"var(--b)",margin:"4px 0 12px"}} />
        <FL label="Marque" k="marque" ph="Peugeot" />
        <FL label="Génération" k="gen" ph="G3" />
        <div style={{marginBottom:9}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Type</div>
          <select className="fsl" value={form.type} onChange={e=>sf("type",e.target.value)}>
            <option value="nonMainLibre">Télécommande</option>
            <option value="mainLibre">Main libre</option>
            <option value="lameSeule">Lame seule</option>
          </select>
        </div>
        <FL label="Boutons" k="btn" ph="3" type="number" />
        <FL label="Transpondeur" k="tr" ph="ID46" />
        <FL label="PCF" k="pcf" ph="7941" />
        <FL label="Fréquence" k="freq" ph="433.92 MHz" />
        <FL label="Pile" k="pile" ph="CR2032" />
        <FL label="Lames" k="lames" ph="VA2, VA6" />
        <FL label="Réf. OEM" k="refs" ph="6490.LE, 6490.LF" />
        <div style={{marginBottom:9}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Compatibilités (une par ligne : Marque Modèle Années)</div>
          <textarea className="fta" placeholder={"Peugeot 308 2013-2021\nCitroën C4 Picasso 2013-2018"} value={form.compat} onChange={e=>sf("compat",e.target.value)} />
        </div>
        <FL label="Notes terrain" k="notes" ph="BSI 3e gen. OBD…" />
      </div>
    </>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  const [cat, setCat] = useState(INIT_CAT);
  const [stk] = useState(INIT_STK);
  const [tab, setTab] = useState("marques");
  const [fiche, setFiche] = useState(null);
  const [prevTab, setPrevTab] = useState("catalogue");
  const [adding, setAdding] = useState(false);

  const alerts = Object.keys(stk).filter(id => { const s=stk[id]; return s.qty>0&&s.qty<=s.seuil; }).length;

  const openFiche = (c) => { setPrevTab(tab); setFiche(c); };
  const closeFiche = () => setFiche(null);
  const goTab = (t) => { setFiche(null); setAdding(false); setTab(t); };

  const saveNew = (c) => { setCat(p => [c,...p]); setAdding(false); };

  return (
    <>
      <style>{CSS}</style>
      <div className="km">
        {/* Contenu principal */}
        {adding
          ? <AddScr onSave={saveNew} onBack={()=>setAdding(false)} />
          : fiche
            ? <FicheScr c={fiche} stk={stk} onBack={closeFiche} />
            : tab==="marques"
              ? <MarquesScr cat={cat} stk={stk} onFiche={openFiche} />
              : tab==="stock"
                ? <StockScr cat={cat} stk={stk} onFiche={openFiche} />
                : <CatalogueScr cat={cat} stk={stk} onFiche={openFiche} onAdd={()=>setAdding(true)} />
        }
        {/* Tabbar — toujours visible */}
        {!adding && !fiche && (
          <nav className="tb">
            <button className={`ti${tab==="marques"?" on":""}`} onClick={()=>goTab("marques")}>
              <span className="tii">🚗</span><span className="til">Marques</span>
            </button>
            <button className={`ti${tab==="catalogue"?" on":""}`} onClick={()=>goTab("catalogue")}>
              <span className="tii">🔑</span><span className="til">Catalogue</span>
            </button>
            <button className={`ti${tab==="stock"?" on":""}`} onClick={()=>goTab("stock")}>
              <span className="tii">📦</span><span className="til">Stock</span>
              {alerts > 0 && <span className="tbdg">{alerts}</span>}
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
