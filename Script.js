/* ============================================================
   STMS DASHBOARD — CLIENT-SIDE LOGIC
   Requires: Leaflet.js, Chart.js (loaded via CDN in dashboard.html)
   Requires DOM ids: clock, cityPill, tickerText, kpiGrid, map,
   signalList, emergencyBanner, emergencyChart, forecastChart,
   vehicleChart, parkingGrid, violationTable, aqiVal, aqiList,
   pollutionChart  (see dashboard.html markup)

   MOCK REAL-TIME DATA LAYER
   Everything below is simulated client-side so the dashboard is
   fully demo-able with zero backend. In production, replace the
   mock arrays / setInterval blocks with fetch() calls to the
   Flask REST API:
     GET  /api/junctions        -> live junction + signal state
     GET  /api/emergency/active -> active emergency vehicle routes
     GET  /api/parking          -> lot occupancy
     GET  /api/violations       -> recent ANPR violation feed
     GET  /api/pollution        -> latest AQI / CO2 / PM2.5 / noise
     GET  /api/forecast         -> ML congestion forecast (next 6h)
   A WebSocket (Flask-SocketIO) channel `/live` is recommended for
   true real-time push instead of polling.
   ============================================================ */

const junctions = [
  {id:"J1", name:"Mayiladuthurai Main Bazaar", lat:11.1041, lng:79.6517, vehicles:42, phase:"green", timer:18},
  {id:"J2", name:"Tharangambadi Road Junction", lat:11.1100, lng:79.6450, vehicles:65, phase:"red", timer:9},
  {id:"J3", name:"Railway Station Crossing", lat:11.1005, lng:79.6580, vehicles:30, phase:"amber", timer:4},
  {id:"J4", name:"Government Hospital Junction", lat:11.0980, lng:79.6490, vehicles:54, phase:"green", timer:22},
];

function clock(){
  const d = new Date();
  document.getElementById('clock').textContent = d.toLocaleTimeString('en-IN', {hour12:false});
}
setInterval(clock, 1000); clock();

/* ---------- KPI cards ---------- */
const kpiData = [
  {label:"Active Junctions", value:"12", delta:"+0 since last hr", color:"var(--blue)"},
  {label:"Vehicles Detected / min", value:"187", delta:"▲ 6.2%", color:"var(--green)"},
  {label:"Avg. Wait Time", value:"38s", delta:"▼ 4s improved", color:"var(--green)"},
  {label:"Active Emergency Routes", value:"1", delta:"Priority granted", color:"var(--red)"},
  {label:"Free Parking Slots", value:"126 / 240", delta:"52% available", color:"var(--amber)"},
  {label:"City AQI", value:"118", delta:"Moderate", color:"var(--amber)"},
];
const kpiGrid = document.getElementById('kpiGrid');
kpiData.forEach(k=>{
  const el = document.createElement('div');
  el.className = 'kpi';
  el.style.setProperty('--kc', k.color);
  el.innerHTML = `<div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div><div class="kpi-delta">${k.delta}</div>`;
  kpiGrid.appendChild(el);
});

/* ---------- Map ---------- */
const map = L.map('map', {zoomControl:false}).setView([11.1030, 79.6510], 14);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(map);
const colorFor = p => p==='green' ? '#2ECC71' : p==='amber' ? '#FFB020' : '#FF4D5E';
junctions.forEach(j=>{
  L.circleMarker([j.lat, j.lng], {radius:10, color:colorFor(j.phase), fillColor:colorFor(j.phase), fillOpacity:0.7, weight:2})
    .addTo(map).bindPopup(`<b>${j.name}</b><br>Vehicles: ${j.vehicles}<br>Phase: ${j.phase.toUpperCase()}`);
});

/* ---------- Signal cards ---------- */
function renderSignals(){
  const list = document.getElementById('signalList');
  list.innerHTML = '';
  junctions.forEach(j=>{
    const card = document.createElement('div');
    card.className = 'signal-card';
    card.innerHTML = `
      <div class="light-housing">
        <div class="bulb ${j.phase==='red'?'on red':''}"></div>
        <div class="bulb ${j.phase==='amber'?'on amber':''}"></div>
        <div class="bulb ${j.phase==='green'?'on green':''}"></div>
      </div>
      <div class="signal-info">
        <div class="signal-name">${j.name} <span class="ai-badge">AI-OPT</span></div>
        <div class="signal-meta">${j.id} · ${j.vehicles} vehicles queued</div>
      </div>
      <div class="signal-timer">${j.timer}s</div>`;
    list.appendChild(card);
  });
}
renderSignals();

setInterval(()=>{
  junctions.forEach(j=>{
    j.timer -= 1;
    j.vehicles = Math.max(5, j.vehicles + Math.round((Math.random()-0.5)*6));
    if(j.timer <= 0){
      j.phase = j.phase==='green' ? 'amber' : j.phase==='amber' ? 'red' : 'green';
      j.timer = j.phase==='green' ? (18 + Math.round(Math.random()*10)) : j.phase==='amber' ? 4 : (10 + Math.round(Math.random()*8));
    }
  });
  renderSignals();
}, 1000);

/* ---------- Ticker ---------- */
const tickerMessages = [
  "🚑 Ambulance AMB-104 granted green corridor on Tharangambadi Road",
  "⚠️ Minor collision reported near Railway Station Crossing — units dispatched",
  "🅿️ Town Hall Parking Lot now 80% occupied",
  "📷 Helmet violation detected — TN-66-AX-2310 — e-challan issued",
  "🌫️ AQI rising near Main Bazaar — 132 (Moderate)",
  "🚦 Signal cycle auto-optimized at Govt. Hospital Junction — wait time reduced 12%",
];
document.getElementById('tickerText').innerHTML = tickerMessages.join(' &nbsp;&nbsp;•&nbsp;&nbsp; ');

/* ---------- Emergency banner ---------- */
document.getElementById('emergencyBanner').innerHTML = `
  <div class="emergency-banner">
    <div class="pin">🚑</div>
    <div style="flex:1">
      <h4>Ambulance AMB-104 en route to Government Hospital</h4>
      <p>Current location: Tharangambadi Rd Junction (J2) &nbsp;|&nbsp; ETA: 4 min 20 sec &nbsp;|&nbsp; Green corridor: J2 → J4 active</p>
      <div class="route-progress"><div></div></div>
    </div>
  </div>`;

new Chart(document.getElementById('emergencyChart'), {
  type:'bar',
  data:{labels:['J1','J2 (current)','J3','J4 (dest.)'],
    datasets:[{label:'Signal override priority level', data:[1,3,1,3], backgroundColor:['#23304D','#FF4D5E','#23304D','#2ECC71'], borderRadius:6}]},
  options:{plugins:{legend:{display:false}}, scales:{y:{ticks:{color:'#8B97B5'}, grid:{color:'#1A2440'}}, x:{ticks:{color:'#8B97B5'}, grid:{display:false}}}}
});

/* ---------- Forecast chart ---------- */
new Chart(document.getElementById('forecastChart'), {
  type:'line',
  data:{labels:['Now','+1h','+2h','+3h','+4h','+5h','+6h'],
    datasets:[
      {label:'Main Bazaar', data:[42,55,78,62,40,35,48], borderColor:'#3DA8F5', backgroundColor:'rgba(61,168,245,0.12)', tension:0.4, fill:true},
      {label:'Tharangambadi Rd', data:[65,70,60,52,46,55,63], borderColor:'#FFB020', backgroundColor:'rgba(255,176,32,0.1)', tension:0.4, fill:true},
    ]},
  options:{plugins:{legend:{labels:{color:'#E7ECF7'}}}, scales:{y:{ticks:{color:'#8B97B5'}, grid:{color:'#1A2440'}}, x:{ticks:{color:'#8B97B5'}, grid:{display:false}}}}
});

/* ---------- Vehicle count chart ---------- */
const vehicleChart = new Chart(document.getElementById('vehicleChart'), {
  type:'bar',
  data:{labels: junctions.map(j=>j.id),
    datasets:[{label:'Vehicles detected (live)', data: junctions.map(j=>j.vehicles), backgroundColor:'#9B7BFF', borderRadius:6}]},
  options:{plugins:{legend:{display:false}}, scales:{y:{ticks:{color:'#8B97B5'}, grid:{color:'#1A2440'}}, x:{ticks:{color:'#8B97B5'}, grid:{display:false}}}}
});
setInterval(()=>{ vehicleChart.data.datasets[0].data = junctions.map(j=>j.vehicles); vehicleChart.update(); }, 2000);

/* ---------- Parking ---------- */
const lots = [
  {name:"Town Hall Parking", total:40, occ:32},
  {name:"Railway Station Lot", total:60, occ:18},
  {name:"Hospital Visitor Parking", total:30, occ:24},
];
const pg = document.getElementById('parkingGrid');
lots.forEach(l=>{
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  const slotsHtml = Array.from({length:l.total}).map((_,i)=>`<div class="slot ${i<l.occ?'occ':''}"></div>`).join('');
  wrap.innerHTML = `
    <div class="lot-card" style="background:transparent;border:none;padding:0;">
      <div class="lot-head"><h5>${l.name}</h5><div class="lot-avail">${l.total-l.occ} free / ${l.total}</div></div>
      <div class="slot-grid">${slotsHtml}</div>
    </div>`;
  pg.appendChild(wrap);
});

/* ---------- Violations table ---------- */
const violations = [
  {time:"14:02:11", junc:"J1", plate:"TN-66-AX-2310", type:"No Helmet", fine:"₹500", status:"amber"},
  {time:"13:55:40", junc:"J2", plate:"TN-45-BZ-7781", type:"Signal Jump", fine:"₹1000", status:"red"},
  {time:"13:48:02", junc:"J4", plate:"TN-30-CD-1190", type:"Overspeeding (68 km/h)", fine:"₹1500", status:"red"},
  {time:"13:30:55", junc:"J3", plate:"TN-66-EF-4456", type:"Triple Riding", fine:"₹1000", status:"violet"},
  {time:"13:12:18", junc:"J1", plate:"TN-21-GH-3321", type:"No Helmet", fine:"₹500", status:"amber"},
];
const vt = document.getElementById('violationTable');
violations.forEach(v=>{
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${v.time}</td><td>${v.junc}</td><td>${v.plate}</td><td>${v.type}</td><td>${v.fine}</td><td><span class="badge ${v.status}">E-Challan Sent</span></td>`;
  vt.appendChild(tr);
});

/* ---------- Pollution / AQI ---------- */
document.getElementById('aqiVal').textContent = "118";
document.getElementById('aqiList').innerHTML = `
  <div class="aqi-item">PM2.5 <b>64 µg/m³</b></div>
  <div class="aqi-item">CO₂ <b>410 ppm</b></div>
  <div class="aqi-item">Noise Level <b>71 dB</b></div>
  <div class="aqi-item">Status <b style="color:var(--amber)">Moderate</b></div>`;

new Chart(document.getElementById('pollutionChart'), {
  type:'line',
  data:{labels:['00','03','06','09','12','15','18','21'],
    datasets:[
      {label:'CO₂ (ppm/10)', data:[35,32,30,40,46,48,44,38], borderColor:'#3DA8F5', tension:0.4},
      {label:'PM2.5', data:[40,38,42,55,64,68,60,50], borderColor:'#FF4D5E', tension:0.4},
      {label:'Noise (dB)', data:[45,40,48,62,71,73,69,55], borderColor:'#FFB020', tension:0.4},
    ]},
  options:{plugins:{legend:{labels:{color:'#E7ECF7'}}}, scales:{y:{ticks:{color:'#8B97B5'}, grid:{color:'#1A2440'}}, x:{ticks:{color:'#8B97B5'}, grid:{display:false}}}}
});
