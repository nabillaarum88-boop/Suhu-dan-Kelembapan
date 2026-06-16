let labels = [], tData = [], hData = [];
let cTemp, cHum;
let ivTime = 2000;
let ivHandle = null;
let allData = [];
let alertCount = 0;

// ===== FUNGSI GAUGE =====
function drawGauge(canvasId, value, max, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h - 10;
    const r = Math.min(w, h * 2) / 2 - 10;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const fillAngle = startAngle + (value / max) * Math.PI;

    // Background arc (abu-abu)
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill arc (warna)
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, fillAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();
}

// ===== JAM REALTIME =====
function startClock() {
    setInterval(() => {
        const now = new Date().toLocaleTimeString('id-ID');
        const el = document.getElementById('clockBadge');
        if (el) el.textContent = now;
    }, 1000);
}

// ===== SET INTERVAL =====
function setIv(ms, btn) {
    ivTime = ms;
    document.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clearInterval(ivHandle);
    ivHandle = setInterval(updateDashboard, ivTime);
}

// ===== NOTIFIKASI / ALERT =====
function pushAlert(type, msg) {
    const list = document.getElementById('alertList');
    const badge = document.getElementById('alertBadge');
    alertCount++;
    badge.textContent = alertCount;

    const now = new Date().toLocaleTimeString('id-ID');
    const item = document.createElement('div');
    item.className = `alert-item al-${type}`;
    item.innerHTML = `
        <div class="alert-dot"></div>
        <div class="alert-msg"><strong>${type.toUpperCase()}</strong> ${msg}</div>
        <div class="alert-time">${now}</div>
    `;
    list.insertBefore(item, list.firstChild);

    // Batasi 30 notifikasi
    if (list.children.length > 30) list.removeChild(list.lastChild);
}

// ===== CEK ALERT SUHU & KELEMBAPAN =====
function checkAlert(temp, hum) {
    if (temp >= 40) pushAlert('danger', `Suhu sangat tinggi! ${temp}°C`);
    else if (temp >= 35) pushAlert('warning', `Suhu tinggi: ${temp}°C`);

    if (hum >= 90) pushAlert('danger', `Kelembapan sangat tinggi! ${hum}%`);
    else if (hum <= 20) pushAlert('warning', `Kelembapan sangat rendah: ${hum}%`);
}

// ===== DOWNLOAD CSV =====
function downloadCSV() {
    if (allData.length === 0) return alert('Belum ada data!');
    const header = 'Waktu,Suhu (°C),Kelembapan (%),Heat Index (°C),Dew Point (°C),Status\n';
    const rows = allData.map(d =>
        `${d.time},${d.temp},${d.humidity},${d.heatindex},${d.dewpoint},${d.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== INISIALISASI CHART =====
document.addEventListener('DOMContentLoaded', () => {
    const opt = { responsive: true, maintainAspectRatio: false };

    cTemp = new Chart(document.getElementById('cTemp'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Suhu',
                data: [],
                borderColor: '#f0883e',
                backgroundColor: 'rgba(240,136,62,0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: opt
    });

    cHum = new Chart(document.getElementById('cHum'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Hum',
                data: [],
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88,166,255,0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: opt
    });

    startClock();
    updateDashboard();
    ivHandle = setInterval(updateDashboard, ivTime);
});

// ===== FUNGSI UPDATE DASHBOARD =====
async function updateDashboard() {
    try {
        const res = await fetch("http://localhost:5000/api/latest");
        const d = await res.json();
        const now = new Date().toLocaleTimeString('id-ID');

        // ----- 1. UPDATE METRIC CARDS -----
        document.getElementById('mTemp').textContent = d.temp + '°C';
        document.getElementById('mHum').textContent  = d.humidity + '%';
        document.getElementById('mHI').textContent   = d.heatindex + '°C';
        document.getElementById('mDew').textContent  = d.dewpoint + '°C';

        // Sub label suhu
        const tempSub = document.getElementById('mTempSub');
        if (tempSub) {
            if (d.temp >= 40)      tempSub.textContent = '🔴 Sangat Panas!';
            else if (d.temp >= 35) tempSub.textContent = '🟠 Panas';
            else if (d.temp >= 28) tempSub.textContent = '🟡 Hangat';
            else                   tempSub.textContent = '🟢 Normal';
        }

        // Sub label kelembapan
        const humSub = document.getElementById('mHumSub');
        if (humSub) {
            if (d.humidity >= 80)      humSub.textContent = '💦 Sangat Lembap';
            else if (d.humidity >= 60) humSub.textContent = '🟡 Lembap';
            else if (d.humidity >= 30) humSub.textContent = '🟢 Normal';
            else                       humSub.textContent = '🌵 Kering';
        }

        // ----- 2. UPDATE PROGRESS BAR -----
        document.getElementById('barTemp').style.width = (d.temp / 50 * 100) + '%';
        document.getElementById('barHum').style.width  = d.humidity + '%';
        document.getElementById('barHI').style.width   = (d.heatindex / 50 * 100) + '%';
        document.getElementById('barDew').style.width  = (d.dewpoint / 50 * 100) + '%';

        // ----- 3. UPDATE GAUGE -----
        document.getElementById('gTempV').textContent = d.temp;
        document.getElementById('gHumV').textContent  = d.humidity;
        drawGauge('gTemp', d.temp,     50,  '#f0883e');
        drawGauge('gHum',  d.humidity, 100, '#58a6ff');

        // ----- 4. UPDATE GRAFIK -----
        if (labels.length > 20) {
            labels.shift();
            cTemp.data.datasets[0].data.shift();
            cHum.data.datasets[0].data.shift();
        }

        labels.push(now);
        cTemp.data.labels = labels;
        cTemp.data.datasets[0].data.push(d.temp);
        cHum.data.labels  = labels;
        cHum.data.datasets[0].data.push(d.humidity);
        cTemp.update();
        cHum.update();

        // ----- 5. UPDATE LOG DATA SENSOR -----
        const logBody = document.getElementById('logBody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${now}</td>
            <td>${d.temp}</td>
            <td>${d.humidity}</td>
            <td>${d.heatindex}</td>
            <td>${d.dewpoint}</td>
            <td>${d.status}</td>
        `;
        logBody.insertBefore(row, logBody.firstChild);

        // Batasi 50 baris log
        if (logBody.rows.length > 50) logBody.deleteRow(logBody.rows.length - 1);

        // Update badge log
        document.getElementById('logBadge').textContent = logBody.rows.length + ' entri';

        // Update counter titik data
        allData.push({ time: now, ...d });
        document.getElementById('pointsCount').textContent = allData.length + ' titik';

        // ----- 6. CEK ALERT -----
        checkAlert(d.temp, d.humidity);

    } catch (err) {
        console.error("Gagal update:", err);
    }
}