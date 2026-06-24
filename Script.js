// ============================================================
//  Script.js — Smart Traffic Management System
//  Mayiladuthurai City | Vishnu Prasaadh V
// ============================================================

// ── DATA ────────────────────────────────────────────────────

const JUNCTIONS = [
  { id: 1, name: "NH-45 Main Junction",       phase: "green",  timer: 42, density: 78, vehicles: 312 },
  { id: 2, name: "Gandhi Road Cross",          phase: "red",    timer: 18, density: 55, vehicles: 198 },
  { id: 3, name: "Bazaar Road Signal",         phase: "yellow", timer:  5, density: 91, vehicles: 420 },
  { id: 4, name: "Bus Stand Junction",         phase: "green",  timer: 30, density: 40, vehicles: 145 },
  { id: 5, name: "Collectorate Signal",        phase: "red",    timer: 24, density: 62, vehicles: 236 },
  { id: 6, name: "Old Town Cross",             phase: "green",  timer: 15, density: 33, vehicles:  98 },
  { id: 7, name: "Porayar Road Entry",         phase: "red",    timer: 36, density: 48, vehicles: 176 },
  { id: 8, name: "Hospital Road Junction",     phase: "green",  timer: 20, density: 25, vehicles:  74 },
  { id: 9, name: "College Road Signal",        phase: "yellow", timer:  3, density: 70, vehicles: 267 },
];

const LANES = [
  { name: "NH-45 North Entry",     density: 78, vehicles: 312 },
  { name: "Bazaar Road (East)",    density: 91, vehicles: 420 },
  { name: "Gandhi Road Cross",     density: 55, vehicles: 198 },
  { name: "Bus Stand Approach",    density: 40, vehicles: 145 },
  { name: "College Road South",    density: 70, vehicles: 267 },
  { name: "Old Town Bypass",       density: 33, vehicles:  98 },
];

const REPORT_DATA = [
  { junction: "NH-45 Main Junction",    vehicles: 3842, wait: 38, peak: "08:30 AM", congestion: "Moderate", efficiency: 82 },
  { junction: "Gandhi Road Cross",      vehicles: 2910, wait: 29, peak: "09:00 AM", congestion: "Low",      efficiency: 91 },
  { junction: "Bazaar Road Signal",     vehicles: 4521, wait: 52, peak: "05:30 PM", congestion: "High",     efficiency: 64 },
  { junction: "Bus Stand Junction",     vehicles: 2103, wait: 24, peak: "07:45 AM", congestion: "Low",      efficiency: 88 },
  { junction: "Collectorate Signal",    vehicles: 3100, wait: 35, peak: "10:00 AM", congestion: "Moderate", efficiency: 79 },
  { junction: "Old Town Cross",         vehicles: 1542, wait: 18, peak: "06:00 PM", congestion: "Low",      efficiency: 94 },
  { junction: "Porayar Road Entry",     vehicles: 2701, wait: 31, peak: "08:00 AM", congestion: "Moderate", efficiency: 76 },
  { junction: "Hospital Road Junction", vehicles:  982, wait: 14, peak: "11:00 AM", congestion: "Low",      efficiency: 97 },
  { junction: "College Road Signal",    vehicles: 3210, wait: 41, peak: "04:00 PM", congestion: "Moderate", efficiency: 71 },
];

// Mayiladuthurai junction coords for map
const MAP_POINTS = [
  { lat: 11.1017, lng: 79.6530, name: "NH-45 Main Junction",    status: "yellow" },
  { lat: 11.1030, lng: 79.6505, name: "Gandhi Road Cross",       status: "green"  },
  { lat: 11.1000, lng: 79.6550, name: "Bazaar Road Signal",      status: "red"    },
  { lat: 11.0985, lng: 79.6515, name: "Bus Stand Junction",      status: "green"  },
  { lat: 11.1042, lng: 79.6545, name: "Collectorate Signal",     status: "yellow" },
  { lat: 11.0970, lng: 79.6490, name: "Old Town Cross",          status: "green"  },
  { lat: 11.1060, lng: 79.6570, name: "Porayar Road Entry",      status: "yellow" },
  { lat: 11.0960, lng: 79.6558, name: "Hospital Road Junction",  status: "green"  },
  { lat: 11.1008, lng: 79.6480, name: "College Road Signal",     status: "yellow" },
];

// ── INIT ────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  startClock();
  renderLaneDensity();
  renderSignalMiniGrid();
  renderJunctionGrid();
  renderReportTable();
  initTrafficFlowChart();
  initVehicleTypeChart();
  initAnalyticsCharts();
  startSimulation();
});

// ── CLOCK ───────────────────────────────────────────────────

function startClock() {
  const el = document.getElementById('live-clock');
  setInterval(() => {
    el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
  }, 1000);
}

// ── SECTION NAVIGATION ──────────────────────────────────────

function showSection(name, el) {
  // hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // show target
  document.getElementById('section-' + name).classList.add('active');
  el.classList.add('active');
  document.getElementById('page-title').textContent = el.textContent.trim();
  // lazy init map
  if (name === 'map' && !window._mapInit) initMap();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function toggleAlerts() {
  const p = document.getElementById('alert-panel');
  p.style.display = p.style.display === 'none' ? 'flex' : 'none';
  p.style.flexDirection = 'column';
}

// ── LANE DENSITY ────────────────────────────────────────────

function renderLaneDensity() {
  const list = document.getElementById('lane-list');
  list.innerHTML = LANES.map(lane => {
    const level = lane.density > 75 ? 'high' : lane.density > 50 ? 'medium' : 'low';
    return `
      <div class="lane-item">
        <div class="lane-meta">
          <span class="lane-name">${lane.name}</span>
          <span class="lane-count">${lane.vehicles} veh</span>
        </div>
        <div class="lane-bar-bg">
          <div class="lane-bar-fill ${level}" style="width:${lane.density}%"></div>
        </div>
      </div>`;
  }).join('');
}

// ── SIGNAL MINI GRID ────────────────────────────────────────

function renderSignalMiniGrid() {
  const EMOJIS = { green: '🟢', yellow: '🟡', red: '🔴' };
  const grid = document.getElementById('signal-mini-grid');
  grid.innerHTML = JUNCTIONS.slice(0, 9).map(j => `
    <div class="signal-mini" onclick="showSection('signals', document.querySelector('[data-section=signals]'))">
      <div class="signal-mini-name">${j.name.split(' ').slice(0,2).join(' ')}</div>
      <div class="signal-mini-light">${EMOJIS[j.phase]}</div>
      <div class="signal-mini-timer ${j.phase}">${j.timer}s</div>
    </div>
  `).join('');
}

// ── JUNCTION CONTROL CARDS ──────────────────────────────────

function renderJunctionGrid() {
  const grid = document.getElementById('junction-grid');
  grid.innerHTML = JUNCTIONS.map(j => {
    const pct = (j.timer / 60) * 100;
    const isRed = j.phase === 'red', isYellow = j.phase === 'yellow', isGreen = j.phase === 'green';
    return `
    <div class="junction-card" id="jcard-${j.id}">
      <div class="junction-name">${j.name}</div>
      <div class="junction-signal">
        <div class="sig-light ${isRed ? 'active-red' : 'inactive'}">🔴</div>
        <div class="sig-light ${isYellow ? 'active-yellow' : 'inactive'}">🟡</div>
        <div class="sig-light ${isGreen ? 'active-green' : 'inactive'}">🟢</div>
        <div style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:${isGreen?'var(--green)':isYellow?'var(--yellow)':'var(--red)'}">
          ${j.timer}s
        </div>
      </div>
      <div class="junction-timer-bar">
        <div class="junction-timer-fill" id="jbar-${j.id}" style="width:${pct}%;background:${isGreen?'var(--green)':isYellow?'var(--yellow)':'var(--red)'}"></div>
      </div>
      <div class="junction-meta">
        <div>
          <div class="j-meta-item">Vehicles</div>
          <div class="j-meta-value">${j.vehicles}</div>
        </div>
        <div>
          <div class="j-meta-item">Density</div>
          <div class="j-meta-value">${j.density}%</div>
        </div>
      </div>
      <div class="junction-actions">
        <button class="btn btn-sm btn-xs" onclick="extendGreen(${j.id})">+10s Green</button>
        <button class="btn btn-sm btn-xs" onclick="forceRed(${j.id})">Force Red</button>
        <button class="btn btn-sm btn-xs" onclick="optimizeSignal(${j.id})">⚡ AI</button>
      </div>
    </div>`;
  }).join('');
}

// ── SIGNAL ACTIONS ──────────────────────────────────────────

function extendGreen(id) {
  const j = JUNCTIONS.find(x => x.id === id);
  if (!j) return;
  j.phase = 'green';
  j.timer = Math.min(j.timer + 10, 90);
  renderJunctionGrid();
  showToast(`✅ Green extended +10s at ${j.name}`);
}

function forceRed(id) {
  const j = JUNCTIONS.find(x => x.id === id);
  if (!j) return;
  j.phase = 'red';
  j.timer = 30;
  renderJunctionGrid();
  showToast(`🔴 Forced RED at ${j.name}`);
}

function optimizeSignal(id) {
  const j = JUNCTIONS.find(x => x.id === id);
  if (!j) return;
  // AI logic: high density → longer green
  if (j.density > 70) {
    j.phase = 'green'; j.timer = 60;
    showToast(`⚡ AI optimized ${j.name} — extended green (high density)`);
  } else if (j.density > 45) {
    j.phase = 'green'; j.timer = 35;
    showToast(`⚡ AI optimized ${j.name} — balanced cycle`);
  } else {
    j.phase = 'green'; j.timer = 20;
    showToast(`⚡ AI optimized ${j.name} — reduced cycle (low density)`);
  }
  renderJunctionGrid();
}

function autoOptimizeAll() {
  JUNCTIONS.forEach(j => {
    if (j.density > 70)      { j.phase = 'green'; j.timer = 60; }
    else if (j.density > 45) { j.phase = 'green'; j.timer = 35; }
    else                     { j.phase = 'green'; j.timer = 20; }
  });
  renderJunctionGrid();
  renderSignalMiniGrid();
  showToast('⚡ All signals auto-optimized by AI!');
}

function emergencyOverride() {
  JUNCTIONS.forEach(j => { j.phase = 'red'; j.timer = 60; });
  // NH-45 gets green corridor
  JUNCTIONS[0].phase = 'green';
  renderJunctionGrid();
  renderSignalMiniGrid();
  showToast('🚨 Emergency override — green corridor activated on NH-45!');
  addEmergencyLog('Emergency override activated — full city green corridor on NH-45');
}

// ── EMERGENCY ───────────────────────────────────────────────

function triggerEmergency() {
  const types = ['Ambulance', 'Fire Truck', 'Police Escort'];
  const routes = ['NH-45 → Government Hospital', 'Bazaar Rd → Fire Station', 'Collectorate → Airport'];
  const t = types[Math.floor(Math.random() * types.length)];
  const r = routes[Math.floor(Math.random() * routes.length)];
  const eta = Math.floor(Math.random() * 8) + 2;

  const corridors = document.getElementById('emergency-corridors');
  corridors.innerHTML += `
    <div class="corridor-item active">
      <span class="corridor-badge">ACTIVE</span>
      <span>${t} — ${r}</span>
      <span class="corridor-eta">ETA: ${eta} min</span>
    </div>`;

  addEmergencyLog(`${t} emergency detected — priority corridor: ${r}`);
  showToast(`🚨 Emergency! ${t} priority corridor activated — ${r}`);

  // Update alert count
  const badge = document.getElementById('alert-count');
  badge.textContent = parseInt(badge.textContent) + 1;
}

function addEmergencyLog(msg) {
  const log = document.getElementById('emergency-log');
  const now = new Date().toLocaleTimeString('en-IN', { hour12: false });
  log.innerHTML = `<div class="log-entry"><span class="log-time">${now}</span> ${msg}</div>` + log.innerHTML;
}

// ── REPORT TABLE ────────────────────────────────────────────

function renderReportTable() {
  const tbody = document.getElementById('report-tbody');
  tbody.innerHTML = REPORT_DATA.map(r => {
    const cls = r.congestion === 'High' ? 'badge-red' : r.congestion === 'Moderate' ? 'badge-yellow' : 'badge-green';
    const efCls = r.efficiency >= 85 ? 'badge-green' : r.efficiency >= 70 ? 'badge-yellow' : 'badge-red';
    return `<tr>
      <td>${r.junction}</td>
      <td><span class="badge-green">${r.vehicles.toLocaleString()}</span></td>
      <td>${r.wait}s</td>
      <td>${r.peak}</td>
      <td><span class="${cls}">${r.congestion}</span></td>
      <td><span class="${efCls}">${r.efficiency}%</span></td>
    </tr>`;
  }).join('');
}

function generateReport() {
  // Randomize vehicle counts slightly for demo
  REPORT_DATA.forEach(r => { r.vehicles += Math.floor(Math.random() * 100 - 50); });
  renderReportTable();
  showToast('📊 Report refreshed for selected period');
}

function downloadReport() {
  const headers = ['Junction', 'Vehicles', 'Avg Wait (s)', 'Peak Hour', 'Congestion', 'Signal Efficiency'];
  const rows = REPORT_DATA.map(r =>
    [r.junction, r.vehicles, r.wait, r.peak, r.congestion, r.efficiency + '%'].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `STMS_Report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  showToast('⬇️ CSV downloaded!');
}

// ── CHARTS ──────────────────────────────────────────────────

function chartDefaults() {
  return {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#6a7a94', font: { family: 'Space Grotesk', size: 12 } } },
    },
    scales: {
      x: { ticks: { color: '#6a7a94', font: { size: 11 } }, grid: { color: '#1f2d45' } },
      y: { ticks: { color: '#6a7a94', font: { size: 11 } }, grid: { color: '#1f2d45' } }
    }
  };
}

function initTrafficFlowChart() {
  const hours = ['6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','NOW'];
  const data  = [120, 345, 890, 1250, 980, 820, 760, 810, 920, 1080, 1320, 1650, 1410, 2847];

  new Chart(document.getElementById('trafficFlowChart'), {
    type: 'line',
    data: {
      labels: hours,
      datasets: [{
        label: 'Vehicles/Hour',
        data,
        borderColor: '#00e676',
        backgroundColor: 'rgba(0,230,118,0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#00e676',
        tension: 0.4,
        fill: true,
      }]
    },
    options: { ...chartDefaults(), plugins: { legend: { display: false } } }
  });
}

function initVehicleTypeChart() {
  new Chart(document.getElementById('vehicleTypeChart'), {
    type: 'doughnut',
    data: {
      labels: ['Cars', 'Bikes', 'Buses', 'Trucks', 'Auto'],
      datasets: [{
        data: [38, 30, 12, 10, 10],
        backgroundColor: ['#00e676','#2979ff','#ffd600','#ff6d00','#ff3d57'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#6a7a94', font: { size: 11 }, boxWidth: 10 }
        }
      }
    }
  });
}

function initAnalyticsCharts() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Total Vehicles',
        data: [18200, 21500, 19800, 22100, 24300, 26700, 15400],
        backgroundColor: 'rgba(41,121,255,0.7)',
        borderRadius: 6,
      }]
    },
    options: chartDefaults()
  });

  const hours24 = Array.from({length: 24}, (_, i) => `${i}:00`);
  const hourData = [80,60,40,30,50,180,420,890,1100,980,860,790,810,750,820,960,1200,1650,1400,1100,900,700,500,300];
  new Chart(document.getElementById('hourlyChart'), {
    type: 'line',
    data: {
      labels: hours24,
      datasets: [{
        label: 'Vehicles',
        data: hourData,
        borderColor: '#ffd600',
        backgroundColor: 'rgba(255,214,0,0.07)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 2,
      }]
    },
    options: chartDefaults()
  });

  new Chart(document.getElementById('congestionChart'), {
    type: 'bar',
    data: {
      labels: hours24,
      datasets: [{
        label: 'Congestion %',
        data: [5,3,2,2,4,18,42,78,85,72,60,55,58,52,60,72,88,92,80,70,58,45,30,15],
        backgroundColor: hourData.map(v =>
          v > 1000 ? 'rgba(255,61,87,0.7)' : v > 600 ? 'rgba(255,214,0,0.7)' : 'rgba(0,230,118,0.7)'
        ),
        borderRadius: 4,
      }]
    },
    options: chartDefaults()
  });

  new Chart(document.getElementById('efficiencyChart'), {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Before AI',
          data: [62, 58, 65, 60, 55, 72, 68],
          borderColor: '#ff3d57',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: 'After AI',
          data: [82, 79, 86, 83, 80, 88, 85],
          borderColor: '#00e676',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          fill: false,
        }
      ]
    },
    options: chartDefaults()
  });
}

// ── MAP ─────────────────────────────────────────────────────

function initMap() {
  window._mapInit = true;
  const map = L.map('traffic-map').setView([11.1017, 79.6530], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CartoDB',
    maxZoom: 19
  }).addTo(map);

  const COLORS = { green: '#00e676', yellow: '#ffd600', red: '#ff3d57', blue: '#2979ff' };

  MAP_POINTS.forEach(pt => {
    const color = COLORS[pt.status] || '#00e676';
    const marker = L.circleMarker([pt.lat, pt.lng], {
      radius: 10,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.85
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family:'Space Grotesk',sans-serif;background:#161d2b;color:#e8edf5;padding:8px;border-radius:8px;min-width:180px">
        <b style="color:${color}">${pt.name}</b><br>
        <span style="color:#6a7a94">Status: </span><span style="color:${color}">${pt.status.toUpperCase()}</span>
      </div>
    `, { className: 'stms-popup' });
  });
}

// ── LIVE SIMULATION ──────────────────────────────────────────

function startSimulation() {
  // tick signal timers every second
  setInterval(() => {
    JUNCTIONS.forEach(j => {
      j.timer--;
      if (j.timer <= 0) {
        if (j.phase === 'green')       { j.phase = 'yellow'; j.timer = 5; }
        else if (j.phase === 'yellow') { j.phase = 'red';    j.timer = 30 + Math.floor(j.density / 5); }
        else                           { j.phase = 'green';  j.timer = 20 + Math.floor(j.density / 3); }
      }
    });

    // update junction cards if signal section is active
    if (document.getElementById('section-signals').classList.contains('active')) {
      renderJunctionGrid();
    }
    renderSignalMiniGrid();
  }, 1000);

  // fluctuate vehicle counts every 3s
  setInterval(() => {
    LANES.forEach(l => {
      l.vehicles += Math.floor(Math.random() * 20 - 8);
      l.density = Math.max(10, Math.min(99, l.density + Math.floor(Math.random() * 6 - 3)));
    });
    JUNCTIONS.forEach(j => {
      j.vehicles += Math.floor(Math.random() * 15 - 5);
      j.density = Math.max(10, Math.min(99, j.density + Math.floor(Math.random() * 4 - 2)));
    });

    if (document.getElementById('section-dashboard').classList.contains('active')) {
      renderLaneDensity();
      updateKPIs();
    }
  }, 3000);
}

function updateKPIs() {
  const totalVeh = JUNCTIONS.reduce((s, j) => s + j.vehicles, 0);
  document.getElementById('kpi-vehicles').textContent = totalVeh.toLocaleString();
  const avgDensity = Math.round(JUNCTIONS.reduce((s, j) => s + j.density, 0) / JUNCTIONS.length);
  document.getElementById('kpi-congestion').textContent =
    avgDensity > 70 ? 'High' : avgDensity > 45 ? 'Moderate' : 'Low';
}

// ── TOAST ────────────────────────────────────────────────────

function showToast(msg) {
  let t = document.getElementById('stms-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'stms-toast';
    t.style.cssText = `
      position:fixed;bottom:24px;right:24px;
      background:#161d2b;border:1px solid #1f2d45;color:#e8edf5;
      padding:12px 20px;border-radius:10px;font-family:'Space Grotesk',sans-serif;
      font-size:13px;z-index:9999;max-width:360px;
      box-shadow:0 4px 24px rgba(0,0,0,0.4);
      transition:opacity 0.3s;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3500);
}
