/* =========================
   ELEMENTS
   ========================= */
const upload            = document.getElementById('upload');
const canvas            = document.getElementById('canvas');
const ctx               = canvas.getContext('2d');

const zoomSlider        = document.getElementById('zoomSlider');
const topFadeCheck      = document.getElementById('topFadeCheck');
const topFadeSlider     = document.getElementById('topFadeSlider');
const bottomFadeCheck   = document.getElementById('bottomFadeCheck');
const bottomFadeSlider  = document.getElementById('bottomFadeSlider');

const matchStatus       = document.getElementById('matchStatus');
const statusXSlider     = document.getElementById('statusXSlider');
const statusYSlider     = document.getElementById('statusYSlider');

const scoreInput        = document.getElementById('scoreInput');
const team1Input        = document.getElementById('team1Input');
const team2Input        = document.getElementById('team2Input');
const titleInput        = document.getElementById('titleInput');
const subtitleInput     = document.getElementById('subtitleInput');

const teamGapSlider     = document.getElementById('teamGapSlider');
const teamGapValue      = document.getElementById('teamGapValue');

const teamOffsetXSlider = document.getElementById('teamOffsetXSlider');
const teamOffsetXValue  = document.getElementById('teamOffsetXValue');

const textGroupXSlider  = document.getElementById('textGroupXSlider');
const textGroupYSlider  = document.getElementById('textGroupYSlider');

const invertJawaposTop    = document.getElementById('invertJawaposTop');
const invertJawaposBottom = document.getElementById('invertJawaposBottom');
const invertMedsos        = document.getElementById('invertMedsos');

const kreditInput       = document.getElementById('kreditInput');

const scoreFontSizeSlider   = document.getElementById('scoreFontSizeSlider');
const scoreFontSizeValue    = document.getElementById('scoreFontSizeValue');
const scoreToTitleGapSlider = document.getElementById('scoreToTitleGapSlider');
const scoreToTitleGapValue  = document.getElementById('scoreToTitleGapValue');
const shadowOpacitySlider   = document.getElementById('shadowOpacitySlider');
const shadowOpacityValue    = document.getElementById('shadowOpacityValue');
const scoreToTeamGapSlider  = document.getElementById('scoreToTeamGapSlider');
const scoreToTeamGapValue   = document.getElementById('scoreToTeamGapValue');
const titleGroupXSlider     = document.getElementById('titleGroupXSlider');
const titleGroupXValue      = document.getElementById('titleGroupXValue');

const downloadBtn       = document.getElementById('download');
const statusEl          = document.getElementById('status');

/* =========================
   STATE
   ========================= */
let img = null;
let zoom = 1;
let offsetX = 0, offsetY = 0;
let dragging = false, lastX = 0, lastY = 0;

let statusOffsetX = 0, statusOffsetY = 0;
let groupOffsetX  = 0, groupOffsetY  = 0;
let titleGroupOffsetX = 0;

let SCORE_TEAM_GAP     = 0;
const MINIMUM_TEAM_GAP = 40;
let TITLE_TO_SUB_GAP   = 0;
let BASE_Y             = 520;

let scoreToTitleGap    = 180;
let scoreFontSize      = 180;
let textShadowOpacity  = 0.85;
let scoreToTeamGap     = 50;

let TEAM_PAIR_OFFSET_X = -20;

const TEXT_COLOR = '#FFFFFF';

/* =========================
   ASSETS (LOGO)
   ========================= */
const logoJawaposPutih = new Image();
logoJawaposPutih.src = "assets/logo-jawapos-putih.svg";
logoJawaposPutih.onload = () => drawCanvas();

const logoJawaposBiru  = new Image();
logoJawaposBiru.src = "assets/logo-jawapos-biru.svg";
logoJawaposBiru.onload = () => drawCanvas();

const medsosLogo = new Image();
medsosLogo.src = "assets/logo-medsos.svg";
medsosLogo.onload = () => drawCanvas();

const statusLogo = new Image();
statusLogo.src = matchStatus ? matchStatus.value : "assets/half-time.svg";
statusLogo.onload = () => drawCanvas();

/* =========================
   HELPERS
   ========================= */
function setStatus(t) { if (statusEl) statusEl.textContent = 'Status: ' + t; }

function wrapText(text, x, y, maxWidth, lineHeight, font, color, align = 'left') {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;

  ctx.shadowColor = `rgba(0,0,0,${textShadowOpacity})`;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const paragraphs = String(text || '').split('\n');
  let currY = y;

  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(/\s+/);
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, currY);
        line = words[i] + ' ';
        currY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line.trim() !== '') {
      ctx.fillText(line.trim(), x, currY);
      currY += lineHeight;
    }
  }
  ctx.restore();
  return currY;
}

function drawLines(text, x, y, lineHeight) {
  const lines = String(text || '').split('\n');
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${textShadowOpacity})`;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
  ctx.restore();
}

function applyTeamGapFromSlider() {
  if (!teamGapSlider) return;
  SCORE_TEAM_GAP = parseInt(teamGapSlider.value || String(SCORE_TEAM_GAP), 10);
  if (teamGapValue) teamGapValue.textContent = SCORE_TEAM_GAP + ' px';
}

function applyTeamOffsetFromSlider() {
  if (!teamOffsetXSlider) return;
  TEAM_PAIR_OFFSET_X = parseInt(teamOffsetXSlider.value || String(TEAM_PAIR_OFFSET_X), 10);
  if (teamOffsetXValue) teamOffsetXValue.textContent = TEAM_PAIR_OFFSET_X + ' px';
}

/* =========================
   DRAW (VERSI PERBAIKAN BUG LOMPAT)
   ========================= */
function drawCanvas() {
  if (!canvas || !ctx) return;
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#FAF9F6';
  ctx.fillRect(0, 0, W, H);

  if (img) {
    const dw = img.width * zoom;
    const dh = img.height * zoom;
    const dx = (W - dw) / 2 + offsetX;
    const dy = (H - dh) / 2 + offsetY;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.save();
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '22px "Proxima Nova", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CANVAS TERLOAD — Upload foto untuk memulai', W/2, H/2);
    ctx.restore();
  }

  if (topFadeCheck && topFadeCheck.checked) {
    const topFadeVal = parseInt(topFadeSlider?.value || '0', 10);
    if (topFadeVal > 0) {
      const gradTop = ctx.createLinearGradient(0, 0, 0, topFadeVal);
      gradTop.addColorStop(0, 'rgba(0,0,0,0.85)');
      gradTop.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradTop;
      ctx.fillRect(0, 0, W, topFadeVal);
    }
  }

  if (bottomFadeCheck && bottomFadeCheck.checked) {
    const bottomFadeVal = parseInt(bottomFadeSlider?.value || '0', 10);
    if (bottomFadeVal > 0) {
      const gradBot = ctx.createLinearGradient(0, H - bottomFadeVal, 0, H);
      gradBot.addColorStop(0, 'rgba(0,0,0,0)');
      gradBot.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = gradBot;
      ctx.fillRect(0, H - bottomFadeVal, W, bottomFadeVal);
    }
  }

  if (statusLogo.complete && statusLogo.naturalWidth) {
    const lw = 200 * 0.63;
    const lh = statusLogo.naturalHeight * (lw / statusLogo.naturalWidth);
    ctx.drawImage(statusLogo, W/2 - lw/2 + statusOffsetX, 100 + statusOffsetY, lw, lh);
  }

  /* ===== BLOK TEKS UTAMA ===== */
  
  // === BAGIAN INI DIUBAH UNTUK MELEPAS TEKS DARI FOTO ===
  const baseY_static      = BASE_Y; // Hapus '+ offsetY'
  const blockLeft_static  = 120;    // Hapus '+ offsetX'
  const leftX_static      = blockLeft_static + 60;
  
  const scoreBlockX = leftX_static + groupOffsetX;
  const scoreBlockY = baseY_static + groupOffsetY;

  const contentWidth = W - 240 - 120;

  const scoreRaw  = (scoreInput && scoreInput.value) ? scoreInput.value : '0-0';
  const scoreText = scoreRaw.replace(/\s*-\s*/g, '-');
  
  ctx.save();
  ctx.font = `${scoreFontSize}pt "DM Serif Display", serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'left';
  ctx.shadowColor = `rgba(0,0,0,${textShadowOpacity})`;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  ctx.fillText(scoreText, scoreBlockX, scoreBlockY);
  ctx.restore();

  let scoreWidth = 0;
  ctx.save();
  ctx.font = `${scoreFontSize}pt "DM Serif Display", serif`;
  scoreWidth = ctx.measureText(scoreText).width;
  ctx.restore();

  ctx.save();
  const cx = scoreBlockX + scoreWidth / 2;
  const pairGap = MINIMUM_TEAM_GAP + SCORE_TEAM_GAP;
  ctx.font = 'bold 24pt "Proxima Nova", sans-serif';
  ctx.fillStyle = TEXT_COLOR;

  ctx.textAlign = 'right';
  const xTeam1 = cx - pairGap + TEAM_PAIR_OFFSET_X;
  drawLines((team1Input && team1Input.value) ? team1Input.value : 'TIM 1', xTeam1, scoreBlockY + scoreToTeamGap, 34);

  ctx.textAlign = 'left';
  const xTeam2 = cx + pairGap + TEAM_PAIR_OFFSET_X;
  drawLines((team2Input && team2Input.value) ? team2Input.value : 'TIM 2', xTeam2, scoreBlockY + scoreToTeamGap, 34);
  ctx.restore();

  ctx.save();
  let startY = baseY_static + scoreToTitleGap;
  const titleX = leftX_static + titleGroupOffsetX;
  const titleVal = (titleInput && titleInput.value) ? String(titleInput.value).trim() : '';

  if (titleVal) {
    const afterTitleY = wrapText(
      titleVal, titleX, startY, contentWidth, 72,
      '68pt "DM Serif Display", serif', TEXT_COLOR, 'left'
    );
    startY = afterTitleY + TITLE_TO_SUB_GAP;
  }
  wrapText(
    (subtitleInput && subtitleInput.value) ? subtitleInput.value : '',
    titleX, startY, contentWidth, 38,
    '25pt "Proxima Nova", sans-serif', TEXT_COLOR, 'left'
  );
  ctx.restore();

  if (logoJawaposPutih.complete && logoJawaposPutih.naturalWidth) {
    ctx.save();
    const drawW1 = 200;
    const drawH1 = logoJawaposPutih.naturalHeight * (drawW1 / logoJawaposPutih.naturalWidth);
    if (invertJawaposTop && invertJawaposTop.checked) ctx.filter = 'invert(1)';
    ctx.drawImage(logoJawaposPutih, W - drawW1 - 50, 50, drawW1, drawH1);
    ctx.restore();
  }
  if (logoJawaposBiru.complete && logoJawaposBiru.naturalWidth) {
    ctx.save();
    const drawW2 = 100;
    const drawH2 = logoJawaposBiru.naturalHeight * (drawW2 / logoJawaposBiru.naturalWidth);
    if (invertJawaposBottom && invertJawaposBottom.checked) ctx.filter = 'invert(1)';
    ctx.drawImage(logoJawaposBiru, 0, H - drawH2, drawW2, drawH2);
    ctx.restore();
  }
  if (medsosLogo.complete && medsosLogo.naturalWidth) {
    ctx.save();
    const maxW = W * 0.71;
    const drawW3 = medsosLogo.naturalWidth * (maxW / medsosLogo.naturalWidth);
    const drawH3 = medsosLogo.naturalHeight * (maxW / medsosLogo.naturalWidth);
    const posX = (W - drawW3) / 2;
    const posY = H - drawH3 - 165;
    if (invertMedsos && invertMedsos.checked) ctx.filter = 'invert(1)';
    ctx.drawImage(medsosLogo, posX, posY, drawW3, drawH3);
    ctx.restore();
  }
  if (kreditInput && kreditInput.value) {
    ctx.save();
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = 'bold 18px "Proxima Nova", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(kreditInput.value, W - 50, H - 49);
    ctx.restore();
  }

  setStatus('Preview siap.');
}

/* =========================
   EVENTS
   ========================= */
if (upload) {
  upload.addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) { setStatus('Tidak ada file'); return; }

    const reader = new FileReader();
    reader.onload = function (ev) {
      const newImg = new Image();
      newImg.onload  = function () { img = newImg; setStatus('Gambar dimuat'); drawCanvas(); };
      newImg.onerror = function () { setStatus('Gagal memuat gambar'); };
      newImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    setStatus('Memuat gambar…');
  });
}

if (canvas) {
  canvas.addEventListener('mousedown', function (e) {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.classList.add('grabbing');
  });
}
window.addEventListener('mousemove', function (e) {
  if (!dragging) return;
  offsetX += e.clientX - lastX;
  offsetY += e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  drawCanvas();
});
window.addEventListener('mouseup', function () {
  dragging = false;
  if (canvas) canvas.classList.remove('grabbing');
});

if (zoomSlider) {
  zoomSlider.addEventListener('input', function() {
    zoom = parseFloat(zoomSlider.value);
    drawCanvas();
  });
}

if (topFadeCheck)    topFadeCheck.addEventListener('change', drawCanvas);
if (topFadeSlider)   topFadeSlider.addEventListener('input', drawCanvas);
if (bottomFadeCheck) bottomFadeCheck.addEventListener('change', drawCanvas);
if (bottomFadeSlider)bottomFadeSlider.addEventListener('input', drawCanvas);

if (matchStatus)   matchStatus.addEventListener('change', function(){ statusLogo.src = matchStatus.value; drawCanvas(); });
if (statusXSlider) statusXSlider.addEventListener('input', function(){ statusOffsetX = parseInt(statusXSlider.value || '0', 10); drawCanvas(); });
if (statusYSlider) statusYSlider.addEventListener('input', function(){ statusOffsetY = parseInt(statusYSlider.value || '0', 10); drawCanvas(); });

if (scoreInput)    scoreInput.addEventListener('input', drawCanvas);
if (team1Input)    team1Input.addEventListener('input', drawCanvas);
if (team2Input)    team2Input.addEventListener('input', drawCanvas);
if (titleInput)    titleInput.addEventListener('input', drawCanvas);
if (subtitleInput) subtitleInput.addEventListener('input', drawCanvas);

if (textGroupXSlider) textGroupXSlider.addEventListener('input', function(){ groupOffsetX = parseInt(textGroupXSlider.value || '0', 10); drawCanvas(); });
if (textGroupYSlider) textGroupYSlider.addEventListener('input', function(){ groupOffsetY = parseInt(textGroupYSlider.value || '0', 10); drawCanvas(); });

if (teamGapSlider) {
  teamGapSlider.addEventListener('input', function () {
    applyTeamGapFromSlider();
    drawCanvas();
  });
  applyTeamGapFromSlider();
}

if (teamOffsetXSlider) {
  teamOffsetXSlider.addEventListener('input', function () {
    applyTeamOffsetFromSlider();
    drawCanvas();
  });
  applyTeamOffsetFromSlider();
}

if (scoreFontSizeSlider) {
  scoreFontSizeSlider.addEventListener('input', function() {
    scoreFontSize = parseInt(this.value, 10);
    if (scoreFontSizeValue) scoreFontSizeValue.textContent = scoreFontSize + ' pt';
    drawCanvas();
  });
}

if (scoreToTitleGapSlider) {
  scoreToTitleGapSlider.addEventListener('input', function() {
    scoreToTitleGap = parseInt(this.value, 10);
    if (scoreToTitleGapValue) scoreToTitleGapValue.textContent = scoreToTitleGap + ' px';
    drawCanvas();
  });
}

if (shadowOpacitySlider) {
  shadowOpacitySlider.addEventListener('input', function() {
    textShadowOpacity = parseFloat(this.value);
    if (shadowOpacityValue) shadowOpacityValue.textContent = Math.round(textShadowOpacity * 100) + '%';
    drawCanvas();
  });
}

if (scoreToTeamGapSlider) {
  scoreToTeamGapSlider.addEventListener('input', function() {
    scoreToTeamGap = parseInt(this.value, 10);
    if (scoreToTeamGapValue) scoreToTeamGapValue.textContent = scoreToTeamGap + ' px';
    drawCanvas();
  });
}

if (titleGroupXSlider) {
  titleGroupXSlider.addEventListener('input', function() {
    titleGroupOffsetX = parseInt(this.value, 10);
    if (titleGroupXValue) titleGroupXValue.textContent = titleGroupOffsetX + ' px';
    drawCanvas();
  });
}


if (invertJawaposTop) invertJawaposTop.addEventListener('change', drawCanvas);
if (invertJawaposBottom) invertJawaposBottom.addEventListener('change', drawCanvas);
if (invertMedsos)  invertMedsos.addEventListener('change', drawCanvas);
if (kreditInput)   kreditInput.addEventListener('input', drawCanvas);

if (downloadBtn) {
  downloadBtn.addEventListener('click', function(){
    canvas.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hasil-instagram.jpg';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.92);
  });
}

if (document.fonts && document.fonts.ready) {
  Promise.all([
    document.fonts.load('220pt "DM Serif Display"'), 
    document.fonts.load('68pt "DM Serif Display"'),
    document.fonts.load('28pt "Proxima Nova"'),
    document.fonts.ready
  ]).then(drawCanvas);
} else {
  drawCanvas();
}