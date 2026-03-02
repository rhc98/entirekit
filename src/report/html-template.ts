import type { ReportData } from './aggregators.js';

const STATIC_HTML_PART1 = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EntireKit Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg-primary: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --accent: #58a6ff;
      --accent-green: #3fb950;
      --accent-orange: #d29922;
      --accent-red: #f85149;
      --accent-purple: #bc8cff;
      --accent-pink: #f778ba;
      --border: #30363d;
      --text-primary: #c9d1d9;
      --text-secondary: #8b949e;
      --text-muted: #6e7681;
      --font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-stack);
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }

    /* Header */
    .header {
      text-align: center;
      padding: 40px 0 32px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 32px;
    }
    .header h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; }
    .header .subtitle { color: var(--text-secondary); font-size: 14px; }

    /* Nav tabs */
    .nav-tabs {
      display: flex; gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 32px;
      overflow-x: auto;
    }
    .nav-tab {
      padding: 10px 20px;
      color: var(--text-secondary);
      cursor: pointer;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 14px;
      white-space: nowrap;
      transition: color 0.2s, border-color 0.2s;
      background: none;
      font-family: var(--font-stack);
    }
    .nav-tab:hover { color: var(--text-primary); }
    .nav-tab.active { color: var(--text-primary); border-bottom-color: var(--accent); }

    .section { display: none; }
    .section.active { display: block; }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }
    .kpi-card .label {
      font-size: 12px; font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .kpi-card .value { font-size: 32px; font-weight: 600; line-height: 1.2; }
    .kpi-card .sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
    .accent-blue { color: var(--accent); }
    .accent-green { color: var(--accent-green); }
    .accent-orange { color: var(--accent-orange); }

    /* Card */
    .card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .card h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }

    /* Charts */
    .chart-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .chart-container { position: relative; width: 100%; min-height: 300px; }

    /* Tables */
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th {
      text-align: left; padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary); font-weight: 500;
      font-size: 12px; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    .data-table tr:hover td { background: var(--bg-tertiary); }
    .num { text-align: right; font-family: var(--font-mono); font-size: 12px; }
    .file-path {
      font-family: var(--font-mono); font-size: 12px;
      max-width: 500px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }

    /* Heatmap */
    .heatmap-wrapper { overflow-x: auto; padding: 8px 0; }
    .heatmap {
      display: inline-grid;
      grid-template-rows: repeat(7, 14px);
      grid-auto-flow: column;
      gap: 3px;
    }
    .heatmap-cell {
      width: 14px; height: 14px;
      border-radius: 2px;
      background: var(--bg-tertiary);
    }
    .heatmap-cell[data-level="1"] { background: #0e4429; }
    .heatmap-cell[data-level="2"] { background: #006d32; }
    .heatmap-cell[data-level="3"] { background: #26a641; }
    .heatmap-cell[data-level="4"] { background: #39d353; }
    .heatmap-legend {
      display: flex; align-items: center; gap: 4px;
      margin-top: 8px; font-size: 12px; color: var(--text-secondary);
    }
    .heatmap-legend .cell { width: 12px; height: 12px; border-radius: 2px; }

    /* Session cards */
    .session-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px; margin-top: 24px;
    }
    .session-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    .session-card .meta {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 10px;
    }
    .session-card .meta .date {
      font-size: 13px; color: var(--accent);
      font-family: var(--font-mono);
    }
    .session-card .meta .branch-tag {
      font-size: 11px; padding: 2px 8px;
      border-radius: 12px; background: var(--bg-tertiary);
      color: var(--text-secondary); border: 1px solid var(--border);
    }
    .session-card .stats {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 8px; font-size: 12px;
    }
    .session-card .stat-item { display: flex; justify-content: space-between; }
    .session-card .stat-item .stat-label { color: var(--text-secondary); }
    .session-card .stat-item .stat-value {
      font-family: var(--font-mono); color: var(--text-primary);
    }

    /* Search */
    .search-input {
      width: 100%; max-width: 400px;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 13px;
      font-family: var(--font-stack);
      margin-bottom: 16px; outline: none;
    }
    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
    .search-input::placeholder { color: var(--text-muted); }

    /* Empty state */
    .empty-state {
      text-align: center; padding: 60px 20px;
      color: var(--text-secondary);
    }
    .empty-state h3 { font-size: 18px; margin-bottom: 8px; }

    /* Responsive */
    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .container { padding: 16px; }
      .nav-tab { padding: 8px 12px; font-size: 13px; }
      .session-cards { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EntireKit Report</h1>
      <div class="subtitle" id="report-subtitle">Loading...</div>
    </div>

    <div class="nav-tabs" id="nav-tabs">
      <button class="nav-tab active" data-section="dashboard">Dashboard</button>
      <button class="nav-tab" data-section="tokens">Token Usage</button>
      <button class="nav-tab" data-section="attribution">AI Contribution</button>
      <button class="nav-tab" data-section="files">File Hotspots</button>
      <button class="nav-tab" data-section="timeline">Timeline</button>
      <button class="nav-tab" data-section="branches">Branches</button>
    </div>

    <!-- Dashboard -->
    <div class="section active" id="sec-dashboard">
      <div class="kpi-grid" id="kpi-grid"></div>
      <div class="chart-row">
        <div class="card">
          <h3>Token Usage Overview</h3>
          <div class="chart-container"><canvas id="dashboard-token-chart"></canvas></div>
        </div>
        <div class="card">
          <h3>AI vs Human Contribution</h3>
          <div class="chart-container"><canvas id="dashboard-attr-chart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- Token Usage -->
    <div class="section" id="sec-tokens">
      <div class="card">
        <h3>Token Usage by Session (Stacked)</h3>
        <div class="chart-container" style="min-height:400px"><canvas id="token-stacked-chart"></canvas></div>
      </div>
      <div class="chart-row">
        <div class="card">
          <h3>Output Token Trend</h3>
          <div class="chart-container"><canvas id="token-trend-chart"></canvas></div>
        </div>
        <div class="card">
          <h3>API Calls per Session</h3>
          <div class="chart-container"><canvas id="api-calls-chart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <h3>Token Statistics Summary</h3>
        <div id="token-summary-table"></div>
      </div>
    </div>

    <!-- AI Contribution -->
    <div class="section" id="sec-attribution">
      <div class="chart-row">
        <div class="card">
          <h3>Overall AI vs Human</h3>
          <div class="chart-container"><canvas id="attr-doughnut-chart"></canvas></div>
        </div>
        <div class="card">
          <h3>AI Contribution by Branch</h3>
          <div class="chart-container"><canvas id="attr-branch-chart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <h3>AI Contribution Trend</h3>
        <div class="chart-container" style="min-height:300px"><canvas id="attr-trend-chart"></canvas></div>
      </div>
    </div>

    <!-- File Hotspots -->
    <div class="section" id="sec-files">
      <div class="card">
        <h3>Most Modified Files (Top 20)</h3>
        <div class="chart-container" style="min-height:500px"><canvas id="file-top-chart"></canvas></div>
      </div>
      <div class="chart-row">
        <div class="card">
          <h3>Changes by Directory</h3>
          <div class="chart-container"><canvas id="dir-chart"></canvas></div>
        </div>
        <div class="card">
          <h3>File List</h3>
          <input type="text" class="search-input" id="file-search" placeholder="Search files..." />
          <div id="file-table-container" style="max-height:400px;overflow-y:auto"></div>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="section" id="sec-timeline">
      <div class="card">
        <h3>Activity Heatmap</h3>
        <div class="heatmap-wrapper" id="heatmap-container"></div>
        <div class="heatmap-legend">
          <span>Less</span>
          <div class="cell" style="background:var(--bg-tertiary)"></div>
          <div class="cell" style="background:#0e4429"></div>
          <div class="cell" style="background:#006d32"></div>
          <div class="cell" style="background:#26a641"></div>
          <div class="cell" style="background:#39d353"></div>
          <span>More</span>
        </div>
      </div>
      <div class="card">
        <h3>Session Details</h3>
        <div class="session-cards" id="session-cards-container"></div>
      </div>
    </div>

    <!-- Branch Analysis -->
    <div class="section" id="sec-branches">
      <div class="card">
        <h3>Branch Summary</h3>
        <div id="branch-table-container"></div>
      </div>
      <div class="card">
        <h3>Work Distribution by Branch</h3>
        <div class="chart-container" style="min-height:400px"><canvas id="branch-dist-chart"></canvas></div>
      </div>
    </div>
  </div>

  <script id="report-data" type="application/json">
`;

const STATIC_HTML_PART2 = `  </script>
  <script>

    // ====================================================================
    // Utilities
    // ====================================================================
    const D = JSON.parse(document.getElementById('report-data').textContent || '{}');
    const fmt = (n) => n != null ? n.toLocaleString() : '0';
    const fmtPct = (n) => (n != null ? n.toFixed(1) : '0.0') + '%';
    const fmtCost = (n) => '$' + (n != null ? n.toFixed(2) : '0.00');
    const shortDate = (s) => (!s || s === 'unknown') ? '-' : s.substring(0, 10);
    const shortId = (s) => (!s || s === 'unknown') ? '-' : s.substring(0, 8);
    const escapeHtml = (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const truncPath = (s, max) => {
      if (!s) return '';
      return s.length > max ? '...' + s.slice(-(max - 3)) : s;
    };

    function calcCost(tokens) {
      const r = D.cost_rates;
      return (tokens.total_input / 1000) * r.input_per_1k
        + (tokens.total_output / 1000) * r.output_per_1k
        + (tokens.total_cache_read / 1000) * r.cache_read_per_1k
        + (tokens.total_cache_creation / 1000) * r.cache_create_per_1k;
    }

    // Chart.js globals
    Chart.defaults.color = '#8b949e';
    Chart.defaults.borderColor = '#30363d';
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.font.size = 12;

    const COLORS = {
      blue: '#58a6ff', green: '#3fb950', orange: '#d29922',
      red: '#f85149', purple: '#bc8cff', pink: '#f778ba',
      cyan: '#56d4dd', yellow: '#e3b341'
    };
    const CHART_COLORS = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.pink, COLORS.cyan, COLORS.red, COLORS.yellow];

    // ====================================================================
    // Navigation
    // ====================================================================
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('sec-' + tab.dataset.section).classList.add('active');
      });
    });

    // ====================================================================
    // Subtitle
    // ====================================================================
    document.getElementById('report-subtitle').textContent =
      \`Generated \${shortDate(D.generated_at)} | \${D.session_count} sessions analyzed\`;

    // ====================================================================
    // Dashboard KPIs
    // ====================================================================
    (function renderKPIs() {
      const t = D.tokens;
      const a = D.attribution;
      const totalIn = t.total_input + t.total_cache_read + t.total_cache_creation;
      const cacheEff = totalIn > 0 ? (t.total_cache_read / totalIn) * 100 : 0;
      const cost = calcCost(t);

      const kpis = [
        { label: 'Total Sessions', value: fmt(D.session_count), sub: D.branches.length + ' branches' },
        { label: 'API Calls', value: fmt(t.total_api_calls), sub: 'avg ' + fmt(Math.round(t.total_api_calls / Math.max(D.session_count, 1))) + ' per session' },
        { label: 'Output Tokens', value: fmt(t.total_output), sub: 'est. cost ' + fmtCost(cost), cls: 'accent-blue' },
        { label: 'Cache Efficiency', value: fmtPct(cacheEff), sub: fmt(t.total_cache_read) + ' cache read tokens', cls: 'accent-green' },
        { label: 'Avg AI Contribution', value: fmtPct(a.avg_agent_pct), sub: a.sessions_count + ' sessions with attribution', cls: 'accent-orange' },
        { label: 'Files Modified', value: fmt(D.files.total_unique_files), sub: D.files.by_directory.length + ' directories' },
      ];

      document.getElementById('kpi-grid').innerHTML = kpis.map(k =>
        '<div class="kpi-card">' +
          '<div class="label">' + k.label + '</div>' +
          '<div class="value">' + (k.cls ? '<span class="' + k.cls + '">' + k.value + '</span>' : k.value) + '</div>' +
          '<div class="sub">' + k.sub + '</div>' +
        '</div>'
      ).join('');
    })();

    // ====================================================================
    // Dashboard Charts
    // ====================================================================
    (function renderDashboardCharts() {
      const t = D.tokens;
      new Chart(document.getElementById('dashboard-token-chart'), {
        type: 'doughnut',
        data: {
          labels: ['Input', 'Output', 'Cache Read', 'Cache Creation'],
          datasets: [{ data: [t.total_input, t.total_output, t.total_cache_read, t.total_cache_creation],
            backgroundColor: [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple], borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } } },
          cutout: '60%'
        }
      });

      const a = D.attribution;
      new Chart(document.getElementById('dashboard-attr-chart'), {
        type: 'doughnut',
        data: {
          labels: ['AI Generated', 'Human Added', 'Human Modified'],
          datasets: [{ data: [a.total_agent_lines, a.total_human_added, a.total_human_modified],
            backgroundColor: [COLORS.blue, COLORS.green, COLORS.orange], borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } } },
          cutout: '60%'
        }
      });
    })();

    // ====================================================================
    // Token Usage Section
    // ====================================================================
    (function renderTokenCharts() {
      const sessions = D.tokens.per_session;
      const labels = sessions.map(function(s) { return shortId(s.session_id); });

      new Chart(document.getElementById('token-stacked-chart'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'Input', data: sessions.map(function(s){ return s.input; }), backgroundColor: COLORS.blue },
            { label: 'Output', data: sessions.map(function(s){ return s.output; }), backgroundColor: COLORS.green },
            { label: 'Cache Read', data: sessions.map(function(s){ return s.cache_read; }), backgroundColor: COLORS.orange },
            { label: 'Cache Creation', data: sessions.map(function(s){ return s.cache_creation; }), backgroundColor: COLORS.purple }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: function(v){ return fmt(v); } } } },
          plugins: {
            legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' } },
            tooltip: { callbacks: { label: function(ctx){ return ctx.dataset.label + ': ' + fmt(ctx.raw); } } }
          }
        }
      });

      new Chart(document.getElementById('token-trend-chart'), {
        type: 'line',
        data: {
          labels: sessions.map(function(s){ return shortDate(s.created_at); }),
          datasets: [{
            label: 'Output Tokens', data: sessions.map(function(s){ return s.output; }),
            borderColor: COLORS.green, backgroundColor: 'rgba(63, 185, 80, 0.1)',
            fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { ticks: { callback: function(v){ return fmt(v); } } }, x: { grid: { display: false } } },
          plugins: { legend: { display: false } }
        }
      });

      new Chart(document.getElementById('api-calls-chart'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ label: 'API Calls', data: sessions.map(function(s){ return s.api_calls; }),
            backgroundColor: COLORS.cyan, borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
          plugins: { legend: { display: false } }
        }
      });

      // Summary table
      var t = D.tokens;
      document.getElementById('token-summary-table').innerHTML =
        '<table class="data-table"><thead><tr>' +
          '<th>Metric</th><th class="num">Total</th><th class="num">Average</th><th class="num">Min</th><th class="num">Max</th>' +
        '</tr></thead><tbody>' +
          '<tr><td>Input Tokens</td><td class="num">' + fmt(t.total_input) + '</td><td class="num">' + fmt(Math.round(t.avg_input)) + '</td><td class="num">-</td><td class="num">-</td></tr>' +
          '<tr><td>Output Tokens</td><td class="num">' + fmt(t.total_output) + '</td><td class="num">' + fmt(Math.round(t.avg_output)) + '</td><td class="num">' + fmt(t.min_output) + '</td><td class="num">' + fmt(t.max_output) + '</td></tr>' +
          '<tr><td>Cache Read</td><td class="num">' + fmt(t.total_cache_read) + '</td><td class="num">-</td><td class="num">-</td><td class="num">-</td></tr>' +
          '<tr><td>Cache Creation</td><td class="num">' + fmt(t.total_cache_creation) + '</td><td class="num">-</td><td class="num">-</td><td class="num">-</td></tr>' +
          '<tr><td>API Calls</td><td class="num">' + fmt(t.total_api_calls) + '</td><td class="num">' + fmt(Math.round(t.total_api_calls / Math.max(D.session_count, 1))) + '</td><td class="num">-</td><td class="num">-</td></tr>' +
        '</tbody></table>';
    })();

    // ====================================================================
    // AI Contribution Section
    // ====================================================================
    (function renderAttributionCharts() {
      var a = D.attribution;

      new Chart(document.getElementById('attr-doughnut-chart'), {
        type: 'doughnut',
        data: {
          labels: ['AI Generated', 'Human Added', 'Human Modified'],
          datasets: [{ data: [a.total_agent_lines, a.total_human_added, a.total_human_modified],
            backgroundColor: [COLORS.blue, COLORS.green, COLORS.orange], borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } },
            tooltip: { callbacks: { label: function(ctx) {
              var total = ctx.dataset.data.reduce(function(s, v) { return s + v; }, 0);
              var pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ctx.label + ': ' + fmt(ctx.raw) + ' lines (' + pct + '%)';
            }}}
          },
          cutout: '55%'
        }
      });

      var branches = a.per_branch || [];
      new Chart(document.getElementById('attr-branch-chart'), {
        type: 'bar',
        data: {
          labels: branches.map(function(b){ return truncPath(b.branch, 30); }),
          datasets: [{ label: 'AI %', data: branches.map(function(b){ return b.avg_pct; }),
            backgroundColor: branches.map(function(_, i){ return CHART_COLORS[i % CHART_COLORS.length]; }), borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          scales: { x: { max: 100, ticks: { callback: function(v){ return v + '%'; } } }, y: { grid: { display: false } } },
          plugins: { legend: { display: false },
            tooltip: { callbacks: { label: function(ctx){ return 'AI: ' + ctx.raw.toFixed(1) + '% (' + branches[ctx.dataIndex].count + ' sessions)'; } } }
          }
        }
      });

      var trend = a.per_session || [];
      new Chart(document.getElementById('attr-trend-chart'), {
        type: 'line',
        data: {
          labels: trend.map(function(s){ return shortDate(s.created_at); }),
          datasets: [{
            label: 'AI Contribution %', data: trend.map(function(s){ return s.agent_percentage; }),
            borderColor: COLORS.blue, backgroundColor: 'rgba(88, 166, 255, 0.1)',
            fill: true, tension: 0.3, pointRadius: 5, pointHoverRadius: 7, pointBackgroundColor: COLORS.blue
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { min: 0, max: 100, ticks: { callback: function(v){ return v + '%'; } } }, x: { grid: { display: false } } },
          plugins: { legend: { display: false },
            tooltip: { callbacks: {
              title: function(items){ return 'Branch: ' + (trend[items[0].dataIndex] ? trend[items[0].dataIndex].branch : '-'); },
              label: function(ctx){ return 'AI: ' + ctx.raw.toFixed(1) + '%'; }
            }}
          }
        }
      });
    })();

    // ====================================================================
    // File Hotspots Section
    // ====================================================================
    (function renderFileCharts() {
      var f = D.files;
      var top = f.top_20 || [];

      new Chart(document.getElementById('file-top-chart'), {
        type: 'bar',
        data: {
          labels: top.map(function(t){ return truncPath(t.file, 50); }),
          datasets: [{ label: 'Modifications', data: top.map(function(t){ return t.count; }),
            backgroundColor: COLORS.blue, borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } },
            y: { grid: { display: false }, ticks: { font: { family: 'SFMono-Regular, Consolas, monospace', size: 11 } } }
          },
          plugins: { legend: { display: false } }
        }
      });

      var dirs = f.by_directory || [];
      new Chart(document.getElementById('dir-chart'), {
        type: 'bar',
        data: {
          labels: dirs.map(function(d){ return truncPath(d.directory, 35); }),
          datasets: [{ label: 'Total Touches', data: dirs.map(function(d){ return d.total_touches; }),
            backgroundColor: COLORS.purple, borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          scales: {
            x: { beginAtZero: true },
            y: { grid: { display: false }, ticks: { font: { family: 'SFMono-Regular, Consolas, monospace', size: 11 } } }
          },
          plugins: { legend: { display: false } }
        }
      });

      var allFiles = f.all_files || [];
      function renderFileTable(filter) {
        var filtered = filter
          ? allFiles.filter(function(f){ return f.file.toLowerCase().indexOf(filter.toLowerCase()) >= 0; })
          : allFiles;
        var container = document.getElementById('file-table-container');
        var rows = filtered.slice(0, 100).map(function(f) {
          var fileRaw = f.file || '';
          var dirRaw = f.directory || '';
          return '<tr><td class="file-path" title="' + escapeHtml(fileRaw) + '">' + escapeHtml(truncPath(fileRaw, 60)) +
            '</td><td class="num">' + f.count + '</td><td class="file-path" title="' + escapeHtml(dirRaw) + '">' +
            escapeHtml(truncPath(dirRaw, 30)) + '</td></tr>';
        }).join('');
        container.innerHTML = '<table class="data-table"><thead><tr><th>File</th><th class="num">Changes</th><th>Directory</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          (filtered.length > 100 ? '<div style="padding:8px;color:var(--text-secondary);font-size:12px">Showing 100 of ' + filtered.length + ' files</div>' : '');
      }
      renderFileTable('');
      document.getElementById('file-search').addEventListener('input', function(e) { renderFileTable(e.target.value); });
    })();

    // ====================================================================
    // Timeline Section
    // ====================================================================
    (function renderTimeline() {
      var tl = D.timeline;
      var dateMap = {};
      (tl.by_date || []).forEach(function(d) { dateMap[d.date] = d.count; });

      var today = new Date();
      var container = document.getElementById('heatmap-container');
      var html = '<div class="heatmap">';

      // 16 weeks back
      var startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 16 * 7 + (7 - startDate.getDay()));

      var maxCount = Math.max.apply(null, Object.values(dateMap).concat([1]));

      for (var d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        var dateStr = d.toISOString().substring(0, 10);
        var count = dateMap[dateStr] || 0;
        var level = 0;
        if (count > 0) {
          var ratio = count / maxCount;
          if (ratio <= 0.25) level = 1;
          else if (ratio <= 0.5) level = 2;
          else if (ratio <= 0.75) level = 3;
          else level = 4;
        }
        html += '<div class="heatmap-cell" data-level="' + level + '" title="' + dateStr + ': ' + count + ' session' + (count !== 1 ? 's' : '') + '"></div>';
      }
      html += '</div>';
      container.innerHTML = html;

      // Session cards
      var sessions = (tl.sessions || []).slice().reverse();
      var cardsContainer = document.getElementById('session-cards-container');
      cardsContainer.innerHTML = sessions.slice(0, 50).map(function(s) {
        return '<div class="session-card">' +
          '<div class="meta">' +
            '<span class="date">' + shortDate(s.created_at) + '</span>' +
            '<span class="branch-tag">' + escapeHtml(truncPath(s.branch, 25)) + '</span>' +
          '</div>' +
          '<div class="stats">' +
            '<div class="stat-item"><span class="stat-label">Output Tokens</span><span class="stat-value">' + fmt(s.output_tokens) + '</span></div>' +
            '<div class="stat-item"><span class="stat-label">API Calls</span><span class="stat-value">' + fmt(s.api_calls) + '</span></div>' +
            '<div class="stat-item"><span class="stat-label">AI %</span><span class="stat-value">' + fmtPct(s.agent_pct) + '</span></div>' +
            '<div class="stat-item"><span class="stat-label">Files</span><span class="stat-value">' + fmt(s.files_count) + '</span></div>' +
          '</div>' +
        '</div>';
      }).join('');

      if (sessions.length > 50) {
        cardsContainer.innerHTML += '<div style="padding:12px;text-align:center;color:var(--text-secondary);font-size:13px">Showing 50 of ' + sessions.length + ' sessions</div>';
      }
    })();

    // ====================================================================
    // Branch Analysis Section
    // ====================================================================
    (function renderBranches() {
      var branches = D.branches || [];

      document.getElementById('branch-table-container').innerHTML =
        '<table class="data-table"><thead><tr>' +
          '<th>Branch</th><th class="num">Sessions</th><th class="num">Output Tokens</th>' +
          '<th class="num">API Calls</th><th class="num">AI %</th><th class="num">Files</th><th>Period</th>' +
        '</tr></thead><tbody>' +
        branches.map(function(b) {
          return '<tr>' +
            '<td class="file-path" title="' + escapeHtml(b.branch || '') + '">' + escapeHtml(truncPath(b.branch, 35)) + '</td>' +
            '<td class="num">' + b.sessions + '</td>' +
            '<td class="num">' + fmt(b.total_output) + '</td>' +
            '<td class="num">' + fmt(b.total_api_calls) + '</td>' +
            '<td class="num">' + fmtPct(b.avg_agent_pct) + '</td>' +
            '<td class="num">' + b.files_count + '</td>' +
            '<td style="font-size:12px;color:var(--text-secondary)">' + shortDate(b.first_date) + ' ~ ' + shortDate(b.last_date) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';

      new Chart(document.getElementById('branch-dist-chart'), {
        type: 'bar',
        data: {
          labels: branches.map(function(b){ return truncPath(b.branch, 25); }),
          datasets: [
            { label: 'Input', data: branches.map(function(b){ return b.total_input; }), backgroundColor: COLORS.blue },
            { label: 'Output', data: branches.map(function(b){ return b.total_output; }), backgroundColor: COLORS.green },
            { label: 'Cache Read', data: branches.map(function(b){ return b.total_cache_read; }), backgroundColor: COLORS.orange }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: function(v){ return fmt(v); } } } },
          plugins: {
            legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' } },
            tooltip: { callbacks: { label: function(ctx){ return ctx.dataset.label + ': ' + fmt(ctx.raw); } } }
          }
        }
      });
    })();

    // ====================================================================
    // Empty State Handler
    // ====================================================================
    if (D.session_count === 0) {
      document.querySelectorAll('.section').forEach(function(s) {
        s.innerHTML = '<div class="empty-state"><h3>No checkpoint data found</h3><p>Run "entire" to create checkpoints, then generate a report.</p></div>';
      });
    }
  </script>
</body>
</html>
`;

export function generateHtml(reportData: ReportData): string {
  // Escape '<' in JSON to prevent </script> injection (same as bash: sed 's/</\\u003c/g')
  const safeJson = JSON.stringify(reportData).replace(/</g, '\\u003c');

  return STATIC_HTML_PART1 + safeJson + STATIC_HTML_PART2;
}
