(function () {
  const A = window.ASSETS;
  const { usd, CATS } = window.CORE;
  const LH = 1.366;

  const cls = (k) => k.replace(/[.@]/g, "-");
  const style = document.createElement("style");
  let css = `@font-face{font-family:Manrope;src:url(${A.font}) format("truetype");font-weight:200 800;font-display:block}`;
  for (const [k, v] of Object.entries(A.sym)) css += `.s-${cls(k)}{-webkit-mask-image:url(${v.u});mask-image:url(${v.u})}`;
  style.textContent = css;
  document.head.appendChild(style);

  const k = (key) => (key ? ` data-k="${key}"` : "");

  function sym(key, size, color, extra = "", ref = "") {
    const s = A.sym[key];
    if (!s) throw new Error("missing symbol " + key);
    return `<i class="sym s-${cls(key)}"${k(ref)} style="width:${(s.w * size).toFixed(2)}px;height:${(s.h * size).toFixed(2)}px;background:${color};${extra}"></i>`;
  }

  function txt(text, size, weight, color, extra = "", ref = "") {
    return `<span class="t"${k(ref)} style="font-size:${size}px;font-weight:${weight};color:${color};${extra}">${text}</span>`;
  }

  function inkOn(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lin = (c) => { const v = (c & 0xff) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(n >> 16) + 0.7152 * lin(n >> 8) + 0.0722 * lin(n) > 0.45 ? "#141A15" : "#FFFFFF";
  }

  function avatar(icon, color, size, radius, extra = "", ref = "") {
    return `<div class="center"${k(ref)} style="width:${size}px;height:${size}px;border-radius:${radius}px;background:${color};flex:none;${extra}">${sym(icon + "@semibold", size * 0.42, inkOn(color))}</div>`;
  }

  function logo(name, size, radius, extra = "", ref = "") {
    return `<div${k(ref)} style="width:${size}px;height:${size}px;border-radius:${radius}px;overflow:hidden;flex:none;${extra}"><img src="${A.logo[name]}" style="width:100%;height:100%;display:block"></div>`;
  }

  const at = (x, y, extra = "") => `position:absolute;left:${x}px;top:${y}px;${extra}`;

  const HOME_ROWS_BEFORE = [
    { logo: "uber-eats", title: "Uber Eats", amount: -2680 },
    { logo: "nike", title: "Nike", amount: -12999 },
    { logo: "lidl", title: "Lidl", amount: -7410 },
    { logo: "starbucks", title: "Starbucks", amount: -540 },
  ];
  const VOICE_ROW = { logo: "h-m", title: "H&M", amount: -1499 };
  const SCAN_ROW = { logo: "lidl", title: "Lidl", amount: -6430 };

  function statusBar() {
    return `<div class="abs" style="left:0;top:0;width:402px;height:54px">
      <div class="abs" style="left:52px;top:17px;width:60px;text-align:center">${txt("9:41", 17, 600, "var(--sb, var(--t1))")}</div>
      <div class="abs row" style="right:27px;top:22px;gap:6px">
        ${sym("cellularbars@semibold", 11.5, "var(--sb, var(--t1))")}${sym("wifi@semibold", 11.5, "var(--sb, var(--t1))")}${sym("battery.100percent@regular", 17, "var(--sb, var(--t1))")}
      </div></div>`;
  }

  function activityRow(row, i, y) {
    const av = row.logo ? logo(row.logo, 44, 10) : avatar(row.icon, row.color, 44, 10);
    return `<div class="abs" data-k="row${i}" style="${at(20, y, "width:362px;height:68px")}">
      <div class="abs sep" data-k="row${i}sep" style="left:74px;width:288px;top:-1px;height:1px"></div>
      <div class="abs" data-k="row${i}av" style="left:16px;top:12px">${av}</div>
      <div class="abs mask" data-k="row${i}tm" style="left:74px;top:14px;width:200px;height:40px">
        <div data-k="row${i}t">${txt(row.title, 16.5, 600, "var(--t1)", "display:block")}${txt("Main card", 13.5, 400, "var(--t3)", "display:block;margin-top:2px")}</div></div>
      <div class="abs mask" data-k="row${i}am" style="right:16px;top:22px;height:24px;width:120px;text-align:right">
        <div data-k="row${i}a">${txt(usd(row.amount), 16.5, 600, "var(--t1)")}</div></div>
    </div>`;
  }

  function phoneOverlay() {
    return `${statusBar()}
      <div class="abs" style="left:138.5px;top:11px;width:125px;height:37px;border-radius:999px;background:#050605"></div>
      <div class="abs" data-k="homeInd" style="left:134px;top:861px;width:134px;height:5px;border-radius:3px;background:var(--sb, var(--t1))"></div>`;
  }

  function homeScreen() {
    let h = "";
    h += `<div data-k="hdr">
      <div class="abs row capsule pill" data-k="hdrWs" style="${at(20, 62, "height:46px;padding:0 16px;gap:8px")}">${txt("Personal", 15, 600, "var(--t1)")}${sym("chevron.down@bold", 10, "var(--t2)")}</div>
      <div class="abs row capsule pill" data-k="hdrSc" style="${at(166, 62, "height:46px;padding:0 4px")}">
        ${["sparkles", "chart.pie.fill", "target", "repeat"].map((s) => `<div class="center" style="width:38px;height:44px">${sym(s + "@medium", 18, "var(--t1)")}</div>`).join("")}
      </div>
      <div class="abs center pill" data-k="hdrGear" style="${at(336, 62, "width:46px;height:46px;border-radius:50%")}">${sym("gearshape@medium", 16, "var(--t1)")}</div>
    </div>`;
    h += `<div class="abs mask" data-k="balLabelM" style="${at(0, 144.3, "width:402px;height:21px")}"><div data-k="balLabel" class="row" style="justify-content:center;gap:6px;height:21px">${sym("square.and.pencil@medium", 12, "var(--t3)")}${txt("Your balance", 15, 500, "var(--t2)")}</div></div>`;
    h += `<div class="abs mask" data-k="balFigM" style="${at(0, 172.9, "width:402px;height:80px")}"><div data-k="balFig" class="abs" style="left:0;top:0;width:402px;height:80px"></div></div>`;
    h += `<svg class="abs" data-k="spark" style="${at(0, 291.5, "overflow:visible")}" width="402" height="130" viewBox="0 0 402 130">
      <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3A9737" stop-opacity=".26"/><stop offset=".78" stop-color="#3A9737" stop-opacity=".12"/><stop offset="1" stop-color="#3A9737" stop-opacity="0"/></linearGradient>
        <clipPath id="sparkAreaClip"><rect data-k="sparkAreaClip" x="0" y="0" width="402" height="130"/></clipPath></defs>
      <path data-k="sparkArea" fill="url(#sparkFill)" clip-path="url(#sparkAreaClip)"/>
      <path data-k="sparkLine" fill="none" stroke="#3A9737" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    h += `<div class="abs" data-k="axis" style="${at(0, 426, "width:402px;height:16px")}">${["Aug 30", "Sep 6", "Sep 13", "Sep 20"].map((l, i) => {
      const day = [1, 8, 15, 22][i];
      const x = (day + 0.5) * (402 / 30);
      return `<div class="abs mask" style="left:${x - 30}px;width:60px;top:0;height:16px;text-align:center"><div data-k="axis${i}">${txt(l, 11, 400, "var(--t3)")}</div></div>`;
    }).join("")}</div>`;
    h += `<div class="abs" data-k="pills" style="${at(0, 459.7, "width:402px;height:48px")}">
      <div class="abs mask" style="left:0;top:-12px;width:324px;height:72px"><div class="abs" data-k="pillRow" style="left:0;top:0;width:640px;height:72px">
        <div class="abs capsule" data-k="thumb" style="left:20px;top:12px;height:48px;background:var(--pill);box-shadow:var(--shadowRest)"></div>
        <div class="abs row" data-k="pill0" style="left:20px;top:12px;height:48px;padding:0 17px 0 9px;gap:8px">
          <div class="center" style="width:26px;height:26px;border-radius:7px;background:var(--forest)">${sym("square.grid.2x2.fill@semibold", 11.5, "#FFFFFF")}</div>${txt("All", 15.5, 600, "var(--t1)", "", "pill0t")}</div>
        <div class="abs row" data-k="pill1" style="left:0;top:12px;height:48px;padding:0 17px 0 9px;gap:8px">
          ${avatar("creditcard.fill", "#1D6FE8", 26, 7)}${txt("Main card", 15.5, 600, "var(--t2)", "", "pill1t")}</div>
        <div class="abs row" data-k="pill2" style="left:0;top:12px;height:48px;padding:0 17px 0 9px;gap:8px">
          ${avatar("building.columns.fill", "#2FA84C", 26, 7)}${txt("Savings", 15.5, 600, "var(--t2)", "", "pill2t")}</div>
      </div></div>
      <div class="abs center pill" data-k="pillAdd" style="left:334px;top:0;width:48px;height:48px;border-radius:50%">${sym("plus@semibold", 18, "var(--t2)")}</div>
    </div>`;
    h += `<div class="abs mask" data-k="recentM" style="${at(20, 531.7, "width:300px;height:21px")}"><div data-k="recent">${txt("Recent operations", 15, 600, "var(--t2)")}</div></div>`;
    h += `<div class="abs card" data-k="list" style="${at(20, 564.2, "width:362px;height:340px;border-radius:32px")}">
      <div class="abs" data-k="listInner" style="left:-20px;top:-564.2px;width:402px;height:1000px">
        ${[SCAN_ROW, VOICE_ROW, ...HOME_ROWS_BEFORE].map((r, i) => activityRow(r, i, 0)).join("")}
        <div class="abs sep" data-k="sepAll" style="left:36px;width:346px;top:0;height:1px"></div>
        <div class="abs row" data-k="viewAll" style="left:36px;width:330px;top:0;height:52px;justify-content:space-between">${txt("View all", 16, 600, "var(--t1)")}${sym("chevron.right@semibold", 13, "var(--t3)")}</div>
      </div></div>`;
    h += `<div class="abs center fab" data-k="fabScan" style="${at(166, 764, "width:64px;height:64px;border-radius:22px;background:var(--cardElevated)")}">${sym("doc.text.viewfinder@semibold", 25, "var(--accent)")}</div>`;
    h += `<div class="abs center fab" data-k="fabMic" style="${at(242, 764, "width:64px;height:64px;border-radius:22px;background:var(--cardElevated)")}">${sym("mic.fill@semibold", 25, "var(--accent)")}</div>`;
    h += `<div class="abs center fab" data-k="fabAdd" style="${at(318, 764, "width:64px;height:64px;border-radius:22px;background:var(--forest)")}">${sym("plus@semibold", 25, "#FFFFFF", "", "fabAddGlyph")}</div>`;
    return `<div class="screen" data-k="homeScreen">${h}</div>`;
  }

  const FOOD = "#FFC432";
  const WHEEL_ROOT = [
    { name: "Uncategorized", icon: "slash.circle", color: "#8E8E93" },
    { name: "Food", icon: "fork.knife", color: FOOD },
    { name: "Shopping", icon: "bag.fill", color: "#E0559B" },
    { name: "Transport", icon: "tram.fill", color: "#1D6FE8" },
    { name: "Entertainment", icon: "gamecontroller.fill", color: "#A463D8" },
  ];
  const WHEEL_FOOD = [
    { name: "Groceries", icon: "cart.fill", color: FOOD },
    { name: "Restaurants", icon: "fork.knife", color: FOOD },
    { name: "Coffee", icon: "cup.and.saucer.fill", color: FOOD },
    { name: "Delivery", icon: "takeoutbag.and.cup.and.straw.fill", color: FOOD },
  ];
  const SHOP = "#E0559B";
  const WHEEL_SHOP = [
    { name: "Clothing", icon: "tshirt.fill", color: SHOP },
    { name: "Electronics", icon: "desktopcomputer", color: SHOP },
    { name: "Home", icon: "sofa.fill", color: SHOP },
  ];

  function addScreen() {
    let h = "";
    h += `<div class="abs center pill" data-k="addClose" style="${at(20, 70, "width:40px;height:40px;border-radius:50%")}">${sym("xmark@semibold", 16, "var(--t1)")}</div>`;
    h += `<div class="abs" data-k="addToggle" style="left:0;right:0;top:70px;height:40px;display:flex;justify-content:center">
      <div class="row capsule" style="height:40px;padding:4px;background:var(--card);border:1px solid var(--hair);box-shadow:0 8px 36px rgba(148,215,136,.18)">
        <div class="row" style="height:32px;padding:0 9px">${sym("arrow.down.left@bold", 13, "var(--t2)")}</div>
        <div class="row capsule" style="height:32px;padding:0 12px;gap:6px;background:var(--leafSoft)">${sym("arrow.up.right@bold", 13, "var(--t1)")}${txt("Expense", 13.5, 600, "var(--t1)")}</div>
        <div class="row" style="height:32px;padding:0 9px">${sym("arrow.left.arrow.right@bold", 13, "var(--t2)")}</div>
      </div></div>`;
    h += `<div class="abs center pill" data-k="addSerial" style="${at(342, 70, "width:40px;height:40px;border-radius:50%")}">${sym("plus.square.on.square@semibold", 16, "var(--t2)")}</div>`;
    h += `<div class="abs" data-k="amount" style="${at(0, 231 - (78 * LH) / 2, "width:402px;height:" + 78 * LH + "px")}"></div>`;
    h += `<div class="abs row" data-k="addChips" style="left:20px;top:352px;gap:8px">
      <div class="row capsule" style="height:40px;padding:0 14px;gap:8px;background:var(--card);border:1px solid var(--hair)">${sym("calendar@semibold", 15, "var(--t1)")}${txt("Sep 27", 16, 600, "var(--t1)")}</div>
      <div class="center" style="width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--hair)">${sym("arrow.2.squarepath@semibold", 15, "var(--t2)")}</div>
      <div class="center" style="width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--hair)">${txt("$", 16, 600, "var(--t1)")}</div></div>`;
    h += `<div class="abs row capsule" data-k="addAcct" style="right:20px;top:352px;height:40px;padding:0 14px 0 6px;gap:8px;background:var(--card);border:1px solid var(--hair)">${avatar("creditcard.fill", "#1D6FE8", 28, 8)}${txt("Main card", 16, 600, "var(--t1)")}</div>`;
    h += `<div class="abs" data-k="addComment" style="left:20px;right:20px;top:404px;height:40px;border-radius:13px;background:var(--card);border:1px solid var(--hair)">
      <div class="abs" data-k="addCommentPh" style="left:13px;top:7.75px">${txt("Add a comment or tag #", 16.5, 400, "var(--t2)")}</div>
      <div class="abs" data-k="addLogoV" style="left:13px;top:5px">${logo("h-m", 28, 8)}</div>
      <div class="abs" data-k="addLogoS" style="left:13px;top:5px">${logo("lidl", 28, 8)}</div>
      <div class="abs mask" style="left:51px;top:7.75px;width:200px;height:${16.5 * LH}px"><div data-k="addMerchV">${txt("H&amp;M", 16.5, 400, "var(--t1)")}</div></div>
      <div class="abs mask" style="left:51px;top:7.75px;width:200px;height:${16.5 * LH}px"><div data-k="addMerchS">${txt("Lidl", 16.5, 400, "var(--t1)")}</div></div></div>`;

    h += `<div class="abs center" data-k="ctlLeft" style="${at(21, 464.5, "width:42px;height:42px;border-radius:13px;background:var(--card)")}">
      <div class="abs center" data-k="ctlPlus" style="inset:0">${sym("plus@semibold", 16, "var(--t1)")}</div>
      <div class="abs center" data-k="ctlBack" style="inset:0">${sym("chevron.left@semibold", 16, "var(--t1)")}</div></div>`;
    h += `<div class="abs" data-k="wheel" style="left:67px;top:0;width:268px;height:874px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 8%,#000 92%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 8%,#000 92%,transparent 100%)">
      ${[...WHEEL_ROOT, ...WHEEL_FOOD, ...WHEEL_SHOP].map((c, i) => `<div class="abs" data-k="cell${i}" style="left:0;top:460px;width:50px;height:72px;transform-origin:50% 0">
        ${avatar(c.icon, c.color, 52, 14, "position:absolute;left:-1px;top:0")}
        <div class="abs mask" style="left:-24px;right:-24px;top:55px;height:16px"><div data-k="cell${i}l" style="text-align:center">${txt(c.name, 11.5, 500, "var(--t2)")}</div></div></div>`).join("")}
    </div>`;
    h += `<div class="abs center" data-k="ctlSearch" style="${at(339, 464.5, "width:42px;height:42px;border-radius:13px;background:var(--card)")}">${sym("magnifyingglass@semibold", 16, "var(--t1)")}</div>`;
    h += `<div class="abs center" data-k="ctlAddCat" style="${at(339, 464.5, "width:42px;height:42px;border-radius:13px;background:var(--card)")}">${sym("plus@semibold", 16, "var(--t1)")}</div>`;

    const colW = (402 - 40 - 24) / 4;
    const rows = [["1", "2", "3", "divide"], ["4", "5", "6", "multiply"], ["7", "8", "9", "minus"], [",", "0", "delete.left", "plus"]];
    rows.forEach((r, ri) => r.forEach((key, ci) => {
      const isOp = ci === 3;
      const x = 20 + ci * (colW + 8), y = 550 + ri * 58;
      let label;
      if (key === "delete.left") label = sym("delete.left@medium", 19, "var(--t1)");
      else if (isOp) label = sym(key + "@semibold", 19, "var(--t1)");
      else label = txt(key, 23, 600, "var(--t1)");
      h += `<div class="key center${isOp ? " op" : ""}" data-k="key_${key}" style="left:${x}px;top:${y}px;width:${colW}px">${label}</div>`;
    }));
    h += `<div class="abs center capsule" data-k="save" style="${at(20, 786, "width:362px;height:46px;background:var(--forest)")}">${txt("Save", 18.5, 600, "var(--onForest)")}</div>`;
    return `<div class="screen" data-k="addScreen">${h}</div>`;
  }

  function statsNav() {
    return `<div data-k="stNav">
      <div class="abs center pill" style="${at(20, 70, "width:40px;height:40px;border-radius:50%")}">${sym("chevron.left@semibold", 16, "var(--t1)")}</div>
      <div class="abs" style="left:0;right:0;top:70px;height:40px;display:flex;justify-content:center">
        <div class="row capsule" style="height:40px;padding:4px;background:var(--tray)">
          <div class="row" style="height:32px;padding:0 10px">${sym("arrow.down.left@bold", 13, "var(--green)")}</div>
          <div class="row capsule" style="height:32px;padding:0 14px;gap:6px;background:var(--card);box-shadow:var(--shadowRest)">${sym("arrow.up.right@bold", 13, "var(--spent)")}${txt("Expense", 14, 600, "var(--t1)")}</div>
        </div></div>
      <div class="abs center pill" style="${at(342, 70, "width:40px;height:40px;border-radius:50%")}">${sym("line.3.horizontal.decrease@semibold", 16, "var(--t1)")}</div></div>`;
  }

  const CF = { top: 126, left: 20, w: 362 };
  CF.t1 = 20 + 16.5 * LH + 6;
  CF.t2 = CF.t1 + 36 * LH + 8;
  CF.t3 = CF.t2 + 13 * LH + 10 + 16;
  CF.chartW = 322 - 8 - 27;
  CF.plotH = 134;
  CF.t4 = CF.t3 + 156 + 18;
  CF.t5 = CF.t4 + 16.5 * LH + 12 * LH + 1 + 14;
  CF.h = CF.t5 + 16.5 * LH + 12 * LH + 1 + 20;
  CF.tiles = CF.top + CF.h + 16;
  CF.cats = CF.tiles + 152 + 22;

  function statsScreen() {
    let h = statsNav();
    let c = "";
    c += `<div class="abs" style="left:20px;top:20px">${txt("Cashflow", 16.5, 400, "var(--t2)")}</div>`;
    c += `<div class="abs mask" style="left:20px;top:${CF.t1}px;width:300px;height:${36 * LH}px"><div class="abs" data-k="cfNet" style="left:0;top:0;width:300px;height:${36 * LH}px"></div></div>`;
    c += `<div class="abs capsule mask" data-k="cfBadge" style="left:20px;top:${CF.t2}px;height:${13 * LH + 10}px;background:var(--leafSoft)">
      <div class="abs row" style="left:10px;top:5px;gap:5px">${sym("arrow.up.right@bold", 11, "var(--green)")}<div class="abs" data-k="cfBadgeV" style="left:16px;top:0;width:120px;height:${13 * LH}px"></div></div>
      <div class="abs" data-k="cfBadgeT" style="top:5px">${txt("vs last period", 13, 400, "var(--t2)")}</div></div>`;
    c += `<svg class="abs" data-k="cfChart" style="left:20px;top:${CF.t3}px;overflow:visible" width="${CF.chartW}" height="${CF.plotH}" viewBox="0 0 ${CF.chartW} ${CF.plotH}">
      <defs>
        <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BF3B33" stop-opacity=".52"/><stop offset="1" stop-color="#BF3B33"/></linearGradient>
        <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A9737" stop-opacity=".52"/><stop offset="1" stop-color="#3A9737"/></linearGradient>
        <clipPath id="ghostClip"><rect data-k="ghostClip" x="0" y="-20" width="0" height="${CF.plotH + 40}"/></clipPath>
      </defs>
      <g clip-path="url(#ghostClip)"><path data-k="ghostExp" fill="none" stroke="#BF3B33" stroke-opacity=".32" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"/>
      <path data-k="ghostInc" fill="none" stroke="#3A9737" stroke-opacity=".32" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"/></g>
      <g data-k="barsDay"></g><g data-k="barsWeek"></g></svg>`;
    c += `<div class="abs" data-k="cfAxis" style="left:20px;top:${CF.t3 + CF.plotH + 5}px;width:${CF.chartW}px;height:20px"></div>`;
    c += `<div class="abs" style="right:20px;top:${CF.t3}px;height:130px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end">
      ${txt("5.2k", 13, 400, "var(--t3)")}${txt("2.6k", 13, 400, "var(--t3)")}${txt("0", 13, 400, "var(--t3)")}</div>`;
    const legend = (top, dot, title, key) => `<div class="abs row" style="left:20px;right:20px;top:${top}px;gap:10px">
        <div style="width:9px;height:9px;border-radius:50%;background:${dot}"></div>${txt(title, 16.5, 400, "var(--t1)")}</div>
      <div class="abs mask" style="right:20px;top:${top}px;width:200px;height:${16.5 * LH}px"><div class="abs" data-k="${key}V" style="right:0;top:0;width:200px;height:${16.5 * LH}px"></div></div>
      <div class="abs mask" style="right:20px;top:${top + 16.5 * LH + 1}px;width:200px;height:${12 * LH}px"><div class="abs" data-k="${key}D" style="right:0;top:0;width:200px;height:${12 * LH}px"></div></div>`;
    c += legend(CF.t4, "var(--spent)", "Expenses", "lgExp");
    c += legend(CF.t5, "var(--leaf)", "Income", "lgInc");
    const seed = `<div class="abs" data-k="cfSeed" style="left:0;top:0;width:362px;height:68px;transform-origin:0 0">
      <div class="abs" style="left:16px;top:12px">${logo("lidl", 44, 10)}</div>
      <div class="abs" style="left:74px;top:14px">${txt("Lidl", 16.5, 600, "var(--t1)", "display:block")}${txt("Main card", 13.5, 400, "var(--t3)", "display:block;margin-top:2px")}</div>
      <div class="abs" style="right:16px;top:22px">${txt(usd(-6430), 16.5, 600, "var(--t1)")}</div></div>`;
    h += `<div class="abs card" data-k="cfCard" style="left:20px;top:${CF.top}px;width:362px;height:${CF.h}px;overflow:hidden">${seed}<div data-k="cfInner" class="abs" style="left:0;top:0;width:362px;height:${CF.h}px">${c}</div></div>`;

    const tile = (x, key, dot, title) => `<div class="abs card" data-k="${key}" style="left:${x}px;top:${CF.tiles}px;width:175px;height:152px;border-radius:20px">
      <div class="abs row" style="left:14px;right:14px;top:14px;height:26px;gap:6px">
        <div style="width:8px;height:8px;border-radius:50%;background:${dot}"></div>${txt(title, 14, 500, "var(--t2)")}<div style="flex:1"></div>
        <div class="center" style="width:26px;height:26px">${sym("arrow.up.left.and.arrow.down.right@semibold", 12, "var(--t3)")}</div></div>
      <div class="abs mask" style="left:14px;top:46px;width:150px;height:${21 * LH}px"><div class="abs" data-k="${key}V" style="left:0;top:0;width:150px;height:${21 * LH}px"></div></div>
      <div class="abs mask" style="left:14px;top:${46 + 21 * LH + 3}px;width:120px;height:${12 * LH}px"><div class="abs" data-k="${key}D" style="left:0;top:0;width:120px;height:${12 * LH}px"></div></div>
      <svg class="abs" style="left:14px;top:104px;overflow:visible" width="147" height="34"><defs><linearGradient id="${key}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dot === "var(--leaf)" ? "#3A9737" : "#141A15"}" stop-opacity=".22"/><stop offset="1" stop-color="${dot === "var(--leaf)" ? "#3A9737" : "#141A15"}" stop-opacity="0"/></linearGradient></defs>
        <path data-k="${key}A" fill="url(#${key}g)"/><path data-k="${key}L" fill="none" stroke="${dot === "var(--leaf)" ? "#3A9737" : "#141A15"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    h += tile(20, "tileExp", "var(--t1)", "Expenses");
    h += tile(207, "tileInc", "var(--leaf)", "Income");

    h += `<div class="abs card" data-k="catCard" style="left:20px;top:${CF.cats}px;width:362px;height:${48 + 6 * 62 + 8 + 5}px">
      <div class="abs row" style="left:20px;right:20px;top:4px;height:48px;justify-content:space-between">${txt("Categories", 16.5, 400, "var(--t2)")}
        <div class="row" style="gap:7px">${txt("Expenses", 16.5, 600, "var(--t1)")}<div style="display:flex;flex-direction:column;gap:3px"><div style="width:3.5px;height:3.5px;border-radius:50%;background:var(--t3)"></div><div style="width:3.5px;height:3.5px;border-radius:50%;background:var(--t3)"></div></div></div></div>
      <div class="abs mask" data-k="catRowsM" style="left:0;top:52px;width:362px;height:${6 * 62 + 8}px">${[0, 1, 2, 3, 4, 5].map((i) => `<div class="abs" data-k="cat${i}" style="left:0;top:${i * 62}px;width:362px;height:62px"></div>`).join("")}</div>
    </div>`;
    return `<div class="screen" data-k="statsScreen">${h}</div>`;
  }

  function catRowInner(cat, deltaText, deltaUp, good, sepOn) {
    const c = CATS[cat.name];
    return `${sepOn ? `<div class="abs sep" style="left:74px;right:0;top:-0.5px;height:1px"></div>` : ""}
      <div class="abs" style="left:20px;top:9px">${avatar(c.icon, c.color, 44, 12)}</div>
      <div class="abs" style="left:78px;top:12px">${txt(cat.name, 16.5, 600, "var(--t1)", "display:block")}${txt((cat.share * 100).toFixed(1) + "%", 13.5, 400, "var(--t3)", "display:block;margin-top:2px")}</div>
      <div class="abs" style="right:20px;top:12px;text-align:right">${txt(usd(cat.amount), 16.5, 600, "var(--t1)", "display:block")}
        <div class="row" data-k="dl_${cat.name}" style="justify-content:flex-end;gap:2px;margin-top:2px;color:${good ? "var(--green)" : "var(--spent)"}">${sym((deltaUp ? "arrow.up" : "arrow.down") + "@bold", 9, good ? "var(--green)" : "var(--spent)")}${txt(deltaText, 12, 500, good ? "var(--green)" : "var(--spent)")}</div></div>`;
  }

  const SHEET_ROWS = ["Last 7 days", "Last 30 days", "This month", "Previous month", "3 months", "6 months", "12 months", "This year"];

  function periodSheet() {
    let rows = "";
    SHEET_ROWS.forEach((r, i) => {
      if (i) rows += `<div class="abs sep" style="left:20px;right:20px;top:${i * 69 - 1}px;height:1px"></div>`;
      rows += `<div class="abs row" style="left:20px;right:20px;top:${i * 69}px;height:68px;justify-content:space-between">${txt(r, 17, 400, "var(--t1)")}
        <div class="pill" style="width:34px;height:34px;border-radius:50%"></div></div>`;
    });
    return `<div class="screen" data-k="sheetScreen">
      <div class="abs center pill" style="${at(20, 18, "width:44px;height:44px;border-radius:50%")}">${sym("xmark@semibold", 15, "var(--t1)")}</div>
      <div class="abs" style="left:0;width:402px;top:28px;text-align:center">${txt("Period", 17, 600, "var(--t1)")}</div>
      <div class="abs card" style="left:20px;top:86px;width:362px;height:${SHEET_ROWS.length * 69 - 1}px">${rows}
        <div class="abs center" data-k="sheetCheck" style="right:20px;top:17px;width:34px;height:34px;border-radius:50%;background:var(--leafSoft)">${sym("checkmark@bold", 15, "var(--t1)")}</div></div>
    </div>`;
  }

  const BUDGETS = [
    { name: "Food", cat: "Food", spent: 57380, limit: 75000, left: "$176.20 left", day: "$44.05 / day" },
    { name: "Transport", cat: "Transport", spent: 10850, limit: 15000, left: "$41.50 left", day: "$10.37 / day" },
    { name: "Entertainment", cat: "Entertainment", spent: 2400, limit: 10000, left: "$76.00 left", day: "$19.00 / day" },
  ];
  const BUD_Y = { title: 100, summary: 146, cards: [320, 468, 614] };

  function budgetCard(b, i) {
    const c = CATS[b.cat];
    return `<div class="abs card" data-k="bud${i}" style="left:20px;top:${BUD_Y.cards[i]}px;width:362px;height:132px">
      <div class="abs" data-k="bud${i}av" style="left:20px;top:22px">${avatar(c.icon, c.color, 38, 8.74)}</div>
      <div class="abs" data-k="bud${i}name" style="left:70px;top:20px;transform-origin:0 0">${txt(b.name, 16.5, 500, "var(--t1)", "display:block")}
        <div class="mask" style="height:${13 * LH}px;margin-top:2px"><div data-k="bud${i}s">${txt(`${usd(b.spent)} of ${usd(b.limit)}`, 13, 400, "var(--t2)")}</div></div></div>
      <div class="abs capsule" data-k="bud${i}track" style="left:20px;top:74.3px;width:322px;height:8px;background:var(--tray);overflow:hidden">
        <div class="abs capsule" data-k="bud${i}fill" style="left:0;top:0;height:8px;width:${(322 * b.spent) / b.limit}px;background:var(--leaf)"></div></div>
      <div class="abs mask" style="left:20px;top:94.3px;width:160px;height:${13 * LH}px"><div data-k="bud${i}left">${txt(b.left, 13, 400, "var(--t2)")}</div></div>
      <div class="abs mask" style="right:20px;top:94.3px;width:140px;height:${13 * LH}px;text-align:right"><div data-k="bud${i}day">${txt(b.day, 13, 400, "var(--t3)")}</div></div>
    </div>`;
  }

  function budgetsScreen() {
    let h = `<div data-k="budNav"><div class="abs" style="left:0;width:402px;top:${BUD_Y.title - 12}px;text-align:center">${txt("Budgets", 17, 600, "var(--t1)")}</div>
      <div class="abs center" style="${at(341, BUD_Y.title - 22, "width:44px;height:44px;border-radius:50%;background:var(--leafSoft);border:1px solid rgba(58,151,55,.25)")}">${sym("plus@semibold", 18, "var(--t1)")}</div></div>`;
    h += `<div class="abs card" data-k="budSum" style="left:20px;top:${BUD_Y.summary}px;width:362px;height:157px">
      <div class="abs" style="left:20px;top:20px">${txt("September 2026", 13, 500, "var(--t2)")}</div>
      <div class="abs row" style="left:20px;top:44px;align-items:baseline;gap:6px">${txt("$706.30", 30, 600, "var(--t1)")}${txt("of $1,000.00", 15, 400, "var(--t2)")}</div>
      <div class="abs capsule" style="left:20px;top:97px;width:322px;height:8px;background:var(--tray);overflow:hidden"><div class="abs capsule" data-k="budSumFill" style="left:0;top:0;height:8px;width:${322 * 0.7063}px;background:var(--accent)"></div></div>
      <div class="abs" style="left:20px;top:117px">${txt("$293.70 left", 14, 400, "var(--t2)")}</div></div>`;
    h += BUDGETS.map(budgetCard).join("");
    return `<div class="screen" data-k="budScreen">${h}</div>`;
  }

  const DET = { top: 142, chartTop: 245, chartH: 170, plotL: 20, plotR: 382 };

  function detailScreen() {
    let h = `<div class="abs center pill" style="${at(20, 78, "width:44px;height:44px;border-radius:50%")}">${sym("chevron.left@semibold", 16, "var(--t1)")}</div>
      <div class="abs" style="left:0;width:402px;top:88px;text-align:center">${txt("Food", 17, 600, "var(--t1)")}</div>
      <div class="abs center pill" style="${at(338, 78, "width:44px;height:44px;border-radius:50%")}">${sym("slider.horizontal.3@semibold", 15, "var(--t1)")}</div>`;
    h += `<div class="abs mask" style="left:20px;top:${DET.top}px;width:300px;height:${40 * LH}px"><div data-k="detFig">${txt("$573.80", 40, 600, "var(--t1)")}</div></div>`;
    h += `<div class="abs row" data-k="detBadgeRow" style="left:20px;top:${DET.top + 40 * LH + 8}px;gap:8px">
      <div class="row capsule" data-k="detBadge" style="height:26px;padding:0 10px;gap:4px;background:rgba(38,118,47,.14)">${sym("arrow.down@bold", 11, "var(--green)")}${txt("-$51.95 vs last period", 13, 500, "var(--green)")}</div>
      ${txt("of $750.00", 14, 400, "var(--t2)")}</div>`;
    h += `<svg class="abs" data-k="detChart" style="left:0;top:${DET.chartTop}px;overflow:visible" width="402" height="${DET.chartH}" viewBox="0 0 402 ${DET.chartH}">
      <defs><linearGradient id="detFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A9737" stop-opacity=".28"/><stop offset="1" stop-color="#3A9737" stop-opacity=".02"/></linearGradient>
        <clipPath id="detClip"><rect data-k="detClip" x="0" y="-10" width="0" height="${DET.chartH + 20}"/></clipPath></defs>
      <line data-k="detLimit" x1="${DET.plotL}" x2="${DET.plotR}" stroke="#A5ADA5" stroke-width="1" stroke-dasharray="4 4"/>
      <g clip-path="url(#detClip)"><path data-k="detArea" fill="url(#detFill)"/><path data-k="detLine" fill="none" stroke="#3A9737" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path data-k="detFc" fill="none" stroke="#3A9737" stroke-opacity=".7" stroke-width="2" stroke-dasharray="4 4"/></g>
      <circle data-k="detRing" r="0" fill="none" stroke="#3A9737" stroke-width="0"/>
      <circle data-k="detDot" r="4.4" fill="#3A9737"/></svg>`;
    h += `<div class="abs row capsule pill" data-k="detLimitLabel" style="height:19px;padding:0 6px">${txt("$750.00", 11, 500, "var(--t2)")}</div>`;
    h += `<div class="abs" data-k="detAxis" style="left:0;top:${DET.chartTop + DET.chartH + 4}px;width:402px;height:16px"></div>`;
    h += `<div class="abs row" style="left:20px;right:20px;top:453px;gap:10px">
      <div class="center pill" style="width:44px;height:44px;border-radius:50%">${sym("chevron.left@semibold", 14, "var(--t1)")}</div>
      <div class="center pill capsule" style="flex:1;height:44px">${txt("September 2026", 15, 500, "var(--t1)")}</div>
      <div class="center pill" style="width:44px;height:44px;border-radius:50%">${sym("chevron.right@semibold", 14, "#A5ADA5")}</div></div>`;
    const card = (x, key, title, value, ratio, fill, foot) => `<div class="abs card" data-k="${key}" style="left:${x}px;top:515px;width:175px;height:163px">
      <div class="abs" style="left:16px;top:16px">${txt(title, 13, 400, "var(--t2)")}</div>
      <div class="abs" style="left:16px;top:42px">${txt(value, 24, 600, "var(--t1)")}</div>
      <div class="abs capsule" style="left:16px;top:${foot.length > 1 ? 104 : 118}px;width:143px;height:8px;background:var(--tray);overflow:hidden"><div class="abs capsule" data-k="${key}Fill" style="left:0;top:0;height:8px;width:${143 * ratio}px;background:${fill}"></div></div>
      <div class="abs" style="left:16px;top:${foot.length > 1 ? 120 : 134}px">${foot.map((f, i) => txt(f, 12, 400, i ? "var(--t2)" : "var(--t3)", "display:block")).join("")}</div></div>`;
    h += card(20, "detAvail", "Available", "$176.20", 573.8 / 750, "var(--leaf)", ["Budget $750.00"]);
    h += card(207, "detFore", "Forecast", "$637.55", 637.55 / 750, "var(--accent)", ["Current pace", "$21.25 / day"]);
    return `<div class="screen" data-k="detScreen">${h}</div>`;
  }

  function spinner(size, color, key) {
    const c = size / 2, len = size * 0.26, w = size * 0.1;
    return `<div class="abs" data-k="${key}" style="left:0;top:0;width:${size}px;height:${size}px">${Array.from({ length: 8 }, (_, i) =>
      `<div class="abs" data-k="${key}${i}" style="left:${c - w / 2}px;top:${c - size / 2 + size * 0.02}px;width:${w}px;height:${len}px;border-radius:${w / 2}px;background:${color};transform-origin:50% ${size / 2 - size * 0.02}px;transform:rotate(${i * 45}deg)"></div>`).join("")}</div>`;
  }

  function voiceScreen() {
    const ww = 1.2 * 22, wh = 1.23 * 22;
    const wave = (extra) => `<i class="sym s-waveform-semibold" style="position:absolute;left:0;top:0;width:${ww}px;height:${wh}px;background:var(--accent);${extra}"></i>`;
    return `<div class="screen" data-k="vDim" style="background:#000"></div>
      <div class="abs card" data-k="vCard" style="left:20px;width:362px;box-shadow:var(--shadowRaised)">
        <div class="abs" data-k="vWave" style="left:${181 - ww / 2}px;top:22px;width:${ww}px;height:${wh}px">
          ${wave("opacity:.32")}<div class="abs" data-k="vWaveHi" style="left:0;top:0;width:${ww}px;height:${wh}px">${wave("")}</div></div>
        <div class="abs mask" data-k="vTextM" style="left:0;width:362px;height:${18 * LH}px;text-align:center">
          <div data-k="vListen">${txt("I'm listening…", 18, 500, "var(--t2)", "font-style:oblique 11deg;font-synthesis:style")}</div>
          <div class="abs" data-k="vRecog" style="left:0;top:0;width:100%">${txt("Recognizing…", 18, 500, "var(--t1)")}</div></div>
      </div>
      <div class="abs center" data-k="vStop" style="left:123px;top:744px;width:76px;height:76px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 1px var(--hair),0 6px 12px rgba(0,0,0,.28)">${sym("stop.fill@semibold", 27.36, "#FFFFFF")}</div>
      <div class="abs center" data-k="vCancel" style="left:219px;top:752px;width:60px;height:60px;border-radius:50%;background:var(--card);box-shadow:0 0 0 1px var(--hair),0 6px 12px rgba(0,0,0,.28)">${sym("xmark@semibold", 21.6, "var(--t1)")}</div>
      <div class="abs" data-k="vSpinHost" style="left:182.5px;top:763.5px;width:37px;height:37px">${spinner(37, "var(--accent)", "vSpin")}</div>`;
  }

  const RECEIPT = {
    items: [
      { name: "Chicken breast", amt: 1287 },
      { name: "Coffee beans", amt: 1199 },
      { name: "Olive oil", amt: 899 },
      { name: "Milk", qty: 2, amt: 698 },
      { name: "Avocados", qty: 3, amt: 597 },
      { name: "Greek yogurt", amt: 549 },
      { name: "Sourdough bread", amt: 429 },
      { name: "Bananas", amt: 288 },
    ],
    subtotal: 5946,
    tax: 484,
    total: 6430,
    paper: { x: 92, y: 243, w: 218, h: 330, rot: -4 },
  };

  function receiptPaper() {
    const { w, h } = RECEIPT.paper;
    const money = (m) => (m / 100).toFixed(2);
    const line = (l, r, size = 9.6, weight = 500) => `<div class="row" style="justify-content:space-between;height:${size * 1.62}px">${txt(l, size, weight, "#2A2E2B")}${txt(r, size, weight, "#2A2E2B")}</div>`;
    const rule = `<div style="height:0;border-top:1.2px dashed #9AA09B;margin:6px 0"></div>`;
    let zig = "";
    for (let i = 18; i >= 0; i--) zig += `${((i / 18) * 100).toFixed(2)}% ${i % 2 ? "100%" : "calc(100% - 7px)"},`;
    return `<div class="abs" style="left:0;top:0;width:${w}px;height:${h}px;background:#FDFCF8;padding:18px 16px 0;clip-path:polygon(0 0,100% 0,${zig.slice(0, -1)})">
      <div style="text-align:center">${txt("LIDL", 24, 800, "#1F2320", "letter-spacing:.06em")}</div>
      <div style="text-align:center;margin-top:1px">${txt("Store #0417", 8.6, 500, "#555B56")}</div>
      <div style="text-align:center">${txt("09/27/2026  14:32", 8.6, 500, "#555B56")}</div>
      ${rule}
      ${RECEIPT.items.map((it) => line(it.qty ? `${it.name} ${it.qty} x ${money(it.amt / it.qty)}` : it.name, money(it.amt))).join("")}
      ${rule}
      ${line("SUBTOTAL", money(RECEIPT.subtotal))}${line("TAX", money(RECEIPT.tax))}
      ${line("TOTAL", money(RECEIPT.total), 13, 800)}
      <div style="text-align:center;margin-top:8px">${txt("Thank you for shopping!", 8.6, 500, "#555B56")}</div>
    </div>`;
  }

  function scanCamera() {
    const { x, y, w, h, rot } = RECEIPT.paper;
    return `<div class="screen" style="background:radial-gradient(ellipse 120% 80% at 50% 42%,#E8E3D8 0%,#D6CEC0 52%,#A89F91 100%)"></div>
      <div class="abs" data-k="scanPaper" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${rot}deg);filter:drop-shadow(0 12px 18px rgba(40,32,20,.28))">${receiptPaper()}</div>
      <div class="abs" data-k="scanQuad" style="border:1.5px solid rgba(10,132,255,.95);background:rgba(10,132,255,.24);border-radius:3px"></div>
      <div class="abs" style="left:0;top:0;width:402px;height:112px;background:rgba(0,0,0,.42)"></div>
      <div class="abs" style="left:18px;top:70px">${txt("Cancel", 17, 500, "#FFFFFF")}</div>
      <div class="abs" style="right:18px;top:70px">${txt("Auto", 17, 500, "#FFFFFF")}</div>
      <div class="abs" style="left:0;top:704px;width:402px;height:170px;background:rgba(0,0,0,.5)"></div>
      <div class="abs" data-k="scanSave" style="right:22px;top:${788 - 17 * LH / 2}px">${txt("Save", 17, 600, "#FFFFFF")}</div>
      <div class="abs" data-k="scanShutter" style="left:165px;top:752px;width:72px;height:72px;border-radius:50%;border:3.5px solid #FFFFFF">
        <div class="abs" style="left:5px;top:5px;width:55px;height:55px;border-radius:50%;background:#FFFFFF"></div></div>
      <div class="abs" data-k="scanShot" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform-origin:0 0">${receiptPaper()}</div>`;
  }

  function scanReading() {
    const top = 447 - (37 + 18 + 1.13 * 34 + 18 + 16 * LH) / 2;
    return `<div class="screen" style="background:var(--bg)"></div>
      <div class="abs" data-k="readInner" style="left:0;top:0;width:402px;height:874px">
        <div class="abs" style="left:182.5px;top:${top}px;width:37px;height:37px">${spinner(37, "#8C928D", "readSpin")}</div>
        <div class="abs" style="left:${201 - (1.21 * 34) / 2}px;top:${top + 55}px">${sym("doc.text.viewfinder@regular", 34, "var(--t3)")}</div>
        <div class="abs" style="left:0;width:402px;top:${top + 55 + 1.13 * 34 + 18}px;text-align:center">${txt("Reading the receipt…", 16, 500, "var(--t2)")}</div>
      </div>`;
  }

  const REVIEW = { top: 120, items: 302, clipBottom: 776, bar: { x: 20, y: 776, w: 362, h: 52, r: 14 } };
  function scanReview() {
    const money = (m) => usd(m);
    const field = (i, label, value) => `<div class="abs" style="left:0;top:${4 + i * 53}px;width:362px;height:52px">
        ${i ? `<div class="abs sep" style="left:16px;right:0;top:-1px;height:1px"></div>` : ""}
        <div class="abs" style="left:16px;top:${26 - 14 * LH / 2}px">${txt(label, 14, 500, "var(--t2)")}</div>
        <div class="abs mask" style="right:16px;top:${26 - 20 * LH / 2}px;height:${20 * LH}px;width:200px;text-align:right"><div data-k="revF${i}" style="position:absolute;right:0;bottom:0">${value}</div></div></div>`;
    const item = (it, i) => `<div class="abs" data-k="revI${i}" style="left:0;top:${37.8 + i * 47}px;width:362px;height:46px">
        ${i ? `<div class="abs sep" style="left:16px;right:0;top:-1px;height:1px"></div>` : ""}
        <div class="abs row" style="left:16px;top:0;height:46px;gap:10px">${txt(it.name, 15.5, 500, "var(--t1)")}${it.qty ? txt("×" + it.qty, 13, 500, "var(--t3)") : ""}</div>
        <div class="abs" style="right:16px;top:${23 - 15.5 * LH / 2}px">${txt(money(it.amt), 15.5, 600, "var(--t1)")}</div></div>`;
    const total = (label, m, y, key) => `<div class="abs row" data-k="${key}" style="left:16px;right:16px;top:${y}px;height:38px;justify-content:space-between">${txt(label, 14, 500, "var(--t2)")}${txt(money(m), 14, 600, "var(--t2)")}</div>`;
    const n = RECEIPT.items.length, afterItems = 37.8 + n * 47 - 1;
    return `<div class="abs mask" style="left:0;top:66px;width:402px;height:40px"><div class="abs" data-k="revHead" style="left:0;top:0;width:402px;height:40px">
        <div class="abs" style="left:20px;top:${20 - 20 * LH / 2}px">${txt("Check the receipt", 20, 700, "var(--t1)")}</div>
        <div class="abs center pill" style="left:342px;top:0;width:40px;height:40px;border-radius:50%">${sym("xmark@semibold", 16, "var(--t1)")}</div></div></div>
      <div class="abs mask" style="left:0;top:116px;width:402px;height:${REVIEW.clipBottom - 116}px"><div class="abs" data-k="revBody" style="left:0;top:-116px;width:402px;height:874px">
        <div class="abs card" data-k="revCard" style="left:20px;top:${REVIEW.top}px;width:362px;height:166px">
          ${field(0, "Merchant", txt("Lidl", 16, 600, "var(--t1)"))}
          ${field(1, "Amount", `<span class="row" style="gap:6px;align-items:baseline">${txt("64.30", 18, 700, "var(--t1)")}${txt("$", 15, 600, "var(--t2)")}</span>`)}
          ${field(2, "Date", txt("Sep 27", 16, 600, "var(--t1)"))}</div>
        <div class="abs card" data-k="revItems" style="left:20px;top:${REVIEW.items}px;width:362px;height:${afterItems + 8 + 76 + 60}px">
          <div class="abs row" style="left:16px;right:16px;top:14px;justify-content:space-between">${txt("Items", 13, 600, "var(--t2)")}${txt(String(n), 13, 600, "var(--t3)")}</div>
          ${RECEIPT.items.map(item).join("")}
          ${total("Subtotal", RECEIPT.subtotal, afterItems, "revI8")}${total("Tax", RECEIPT.tax, afterItems + 38, "revI9")}</div>
      </div></div>
      <div class="abs center" data-k="revBar" style="left:20px;top:776px;width:362px;height:52px;border-radius:14px;background:var(--leafSoft)">${txt("Add expense", 18.5, 600, "var(--t1)")}</div>`;
  }

  const SPRING = { wide: { x: 27, y: 90, w: 348, h: 163 }, small: { x: 27, y: 290, w: 163, h: 163 }, icon: { x: 215.7, y: 290, s: 64 } };
  function springboard() {
    const C = window.CORE;
    const series = C.balanceSeries("All", 2).map((p) => p.v);
    const bal = C.usd(series[series.length - 1]);
    const dot = bal.lastIndexOf(".");
    const start = C.iso(C.addDays(C.dayOf(C.TODAY), -29));
    const income = C.usd(C.sumTx("income", start, C.TODAY)), spent = C.usd(C.sumTx("expense", start, C.TODAY));
    const lo = Math.min(...series), hi = Math.max(...series);
    const pts = series.map((v, i) => `${((i / (series.length - 1)) * 92).toFixed(2)},${(56 - ((v - lo) / Math.max(1, hi - lo)) * 56).toFixed(2)}`).join(" ");
    const fig = (t, size, color) => txt(t, size, 700, color, `letter-spacing:${(-size * 0.02).toFixed(2)}px;font-variant-numeric:tabular-nums`);
    const label = (x, y, w) => `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;text-align:center">${txt("Rolyn", 12, 500, "#FFFFFF", "text-shadow:0 1px 2px rgba(0,0,0,.25)")}</div>`;
    const { wide, small, icon } = SPRING;
    const ratio = 0.7063, r = 31.5, len = 2 * Math.PI * r;
    return `<div class="screen" style="background:
        radial-gradient(circle 300px at 12% 18%, rgba(148,215,136,.5) 0, rgba(148,215,136,0) 300px),
        radial-gradient(circle 340px at 92% 74%, rgba(58,151,55,.55) 0, rgba(58,151,55,0) 340px),
        linear-gradient(165deg, #2F6B34 0%, #1D3D23 48%, #122218 100%)"></div>
      <div class="abs" data-k="wBal" style="left:${wide.x}px;top:${wide.y}px;width:${wide.w}px;height:${wide.h}px;border-radius:24px;background:#F4F5F1;overflow:hidden">
        <div class="abs" style="left:16px;top:27px">
          ${txt("Total balance", 13, 500, "#4D564E", "display:block")}
          <div class="row" style="align-items:baseline;gap:1px;margin-top:6px">${fig(bal.slice(0, dot), 32, "#141A15")}${fig(bal.slice(dot), 18, "#4D564E")}</div>
          <div class="row" style="gap:14px;margin-top:6px;align-items:flex-start">
            <div>${txt("Income", 12, 500, "#4D564E", "display:block")}${fig(income, 13, "#26762F")}</div>
            <div>${txt("Spent", 12, 500, "#4D564E", "display:block")}${fig(spent, 13, "#141A15")}</div></div></div>
        <svg class="abs" style="left:${wide.w - 16 - 92}px;top:${(wide.h - 56) / 2}px;overflow:visible" width="92" height="56"><polyline points="${pts}" fill="none" stroke="#3A9737" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      ${label(wide.x, wide.y + wide.h + 7, wide.w)}
      <div class="abs" data-k="wBud" style="left:${small.x}px;top:${small.y}px;width:${small.w}px;height:${small.h}px;border-radius:24px;background:#F4F5F1;overflow:hidden">
        <div class="abs" style="left:16px;top:14px">${txt("Budget", 13, 500, "#4D564E")}</div>
        <svg class="abs" style="left:${small.w / 2 - 36}px;top:34px" width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="${r}" fill="none" stroke="#FFFFFF" stroke-width="9"/>
          <circle cx="36" cy="36" r="${r}" fill="none" stroke="#3A9737" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(len * ratio).toFixed(2)} ${len.toFixed(2)}" transform="rotate(-90 36 36)"/></svg>
        <div class="abs" style="left:0;width:${small.w}px;top:${34 + 36 - 18 * LH / 2}px;text-align:center">${fig("71%", 18, "#141A15")}</div>
        <div class="abs" style="left:16px;top:112px">${fig("$293.70 left", 14, "#141A15")}</div>
        <div class="abs" style="left:16px;top:131px">${txt("4 days left", 12, 400, "#636C64")}</div>
      </div>
      ${label(small.x, small.y + small.h + 7, small.w)}
      <div class="abs" data-k="wIcon" style="left:${icon.x}px;top:${icon.y}px;width:${icon.s}px;height:${icon.s}px;border-radius:${(icon.s * 0.2237).toFixed(2)}px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.18)"><img src="${A.icon}" style="width:100%;height:100%;display:block"></div>
      ${label(icon.x - 18, icon.y + icon.s + 7, icon.s + 36)}`;
  }

  window.UI = {
    LH, sym, txt, avatar, logo, usd, inkOn, phoneOverlay, homeScreen, addScreen, statsScreen, catRowInner, periodSheet,
    budgetsScreen, detailScreen, voiceScreen, scanCamera, scanReading, scanReview, springboard, RECEIPT, REVIEW, SPRING,
    HOME_ROWS_BEFORE, WHEEL_ROOT, WHEEL_FOOD, WHEEL_SHOP, CF, BUDGETS, BUD_Y, DET, SHEET_ROWS,
  };
})();
