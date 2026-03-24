'use strict';

/* ── 화면 전환 ── */
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ── 편지 글자 수 ── */
const letterBody = document.getElementById('letter-body');
letterBody.addEventListener('input', () => {
  if (letterBody.value.length > 400) {
    letterBody.value = letterBody.value.slice(0, 400);
  }
});

/* ── 카메라 ── */
let stream = null;
let capturedDataUrl1 = null;  // 1번째 사진
let capturedDataUrl2 = null;  // 2번째 사진
let currentShot = 1;           // 현재 몇 번째 사진인지

async function goToCamera() {
  currentShot = 1;
  capturedDataUrl1 = null;
  capturedDataUrl2 = null;
  updateShotIndicator();
  goTo('screen-camera');
  await startCamera();
}

function updateShotIndicator() {
  const el = document.getElementById('shot-indicator');
  if (el) el.textContent = `📷 ${currentShot}번째 사진`;
}

async function startCamera() {
  stopCamera();

  const video       = document.getElementById('camera-video');
  const previewWrap = document.getElementById('camera-preview-wrap');
  const errorDiv    = document.getElementById('camera-error');
  const shutter     = document.getElementById('btn-shutter');
  const retake      = document.getElementById('btn-retake');
  const use         = document.getElementById('btn-use-photo');

  previewWrap.style.display = 'none';
  errorDiv.style.display    = 'none';
  video.style.display       = 'block';
  shutter.style.display     = 'flex';
  retake.style.display      = 'none';
  use.style.display         = 'none';

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    video.srcObject = stream;
  } catch (e) {
    video.style.display   = 'none';
    errorDiv.style.display = 'block';
    shutter.style.display  = 'none';
    console.error('카메라 접근 실패:', e);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

function takePhoto() {
  const video   = document.getElementById('camera-video');
  const canvas  = document.getElementById('camera-canvas');
  const preview = document.getElementById('camera-preview');
  const previewWrap = document.getElementById('camera-preview-wrap');
  const shutter = document.getElementById('btn-shutter');
  const retake  = document.getElementById('btn-retake');
  const use     = document.getElementById('btn-use-photo');

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  // 셀카 거울 반전
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  if (currentShot === 1) capturedDataUrl1 = dataUrl;
  else capturedDataUrl2 = dataUrl;
  preview.src = dataUrl;

  video.style.display       = 'none';
  previewWrap.style.display = 'flex';
  shutter.style.display     = 'none';
  retake.style.display      = 'inline-flex';
  use.style.display         = 'inline-flex';

  stopCamera();
}

function retakePhoto() {
  const video       = document.getElementById('camera-video');
  const previewWrap = document.getElementById('camera-preview-wrap');
  const shutter     = document.getElementById('btn-shutter');
  const retake      = document.getElementById('btn-retake');
  const use         = document.getElementById('btn-use-photo');

  previewWrap.style.display = 'none';
  video.style.display       = 'block';
  shutter.style.display     = 'flex';
  retake.style.display      = 'none';
  use.style.display         = 'none';

  startCamera();
}

function usePhoto() {
  stopCamera();

  if (currentShot === 1) {
    // 1번째 사진 확인 → 2번째 사진 찍기
    currentShot = 2;
    updateShotIndicator();
    const video       = document.getElementById('camera-video');
    const previewWrap = document.getElementById('camera-preview-wrap');
    const shutter     = document.getElementById('btn-shutter');
    const retake      = document.getElementById('btn-retake');
    const use         = document.getElementById('btn-use-photo');

    previewWrap.style.display = 'none';
    video.style.display       = 'block';
    shutter.style.display     = 'flex';
    retake.style.display      = 'none';
    use.style.display         = 'none';

    startCamera();
  } else {
    // 2번째 사진 확인 → 결과로
    fillResult();
    goTo('screen-printing');
    setTimeout(() => goTo('screen-result'), 1800);
  }
}

function goBackToCamera() {
  currentShot = 1;
  capturedDataUrl1 = null;
  capturedDataUrl2 = null;
  updateShotIndicator();
  goTo('screen-camera');
  startCamera();
}

/* ── 결과 화면 채우기 ── */
function fillResult() {
  const to   = document.getElementById('letter-to').value.trim();
  const body = document.getElementById('letter-body').value.trim();
  const from = document.getElementById('letter-from').value.trim();

  // 날짜
  const now  = new Date();
  const ymd  = `${now.getFullYear()}.${pad(now.getMonth()+1)}.${pad(now.getDate())}`;
  const ampm = now.getHours() < 12 ? 'am' : 'pm';
  const hh   = now.getHours() % 12 || 12;
  const mm   = pad(now.getMinutes());
  const dateStr = `${ymd}    ${ampm}. ${hh}:${mm}`;

  document.getElementById('result-to').textContent   = to   || '—';
  document.getElementById('result-body').textContent = body || '';
  document.getElementById('result-from').textContent = from || '—';
  document.getElementById('result-date').textContent = dateStr;

  // 플립 카드 초기화
  const card = document.getElementById('main-flip-card');
  if (card) card.classList.remove('flipped');
  const hint = document.getElementById('flip-hint');
  if (hint) { hint.textContent = '↩ 눌러서 편지 보기'; hint.classList.remove('hidden'); }

  // 사진 (1번째 → 위, 2번째 → 아래)
  document.getElementById('result-photo-top').src    = capturedDataUrl1;
  document.getElementById('result-photo-bottom').src = capturedDataUrl2;

  // 캔버스 합성
  buildCanvas(to, body, from);
}

function pad(n) { return String(n).padStart(2, '0'); }

function toggleFlip() {
  const card = document.getElementById('main-flip-card');
  const hint = document.getElementById('flip-hint');
  card.classList.toggle('flipped');
  if (card.classList.contains('flipped')) {
    hint.textContent = '↩ 눌러서 사진 보기';
  } else {
    hint.textContent = '↩ 눌러서 편지 보기';
  }
}

/* ── 합성 캔버스 ── */
function buildCanvas(to, body, from) {
  const canvas = document.getElementById('result-canvas');
  const ctx    = canvas.getContext('2d');

  const W = 1200, H = 900;
  canvas.width  = W;
  canvas.height = H;

  const img1 = new Image();
  const img2 = new Image();
  let loaded = 0;
  const onLoad = () => { if (++loaded === 2) drawCanvas(ctx, img1, img2, W, H); };
  img1.onload = onLoad;
  img2.onload = onLoad;
  img1.src = capturedDataUrl1;
  img2.src = capturedDataUrl2;
}

function drawCanvas(ctx, img1, img2, W, H) {
  // 배경 (어두운)
    ctx.fillStyle = '#272727';
    ctx.fillRect(0, 0, W, H);

    // 격자
    ctx.strokeStyle = 'rgba(217,217,217,0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 117) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 117) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // 편지 카드
    const lx = 40, ly = 40, lw = 380, lh = H - 80;
    ctx.fillStyle = '#fcfcfc';
    ctx.fillRect(lx, ly, lw, lh);

    // Photo Letter 타이틀
    ctx.font = 'bold 36px "Moul", sans-serif';
    ctx.fillStyle = '#191919';
    ctx.fillText('Photo Letter', lx + 24, ly + 56);

    // 편지 내용
    ctx.font = '18px "Gurajada", serif';
    ctx.fillStyle = '#000';
    ctx.fillText('To.', lx + 24, ly + 100);
    ctx.font = '18px "Hi Melody", cursive';
    ctx.fillText(to || '—', lx + 24, ly + 128);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(lx + 24, ly + 138, lw - 48, 1);

    ctx.font = '18px "Gurajada", serif';
    ctx.fillStyle = '#000';
    ctx.fillText('Message', lx + 24, ly + 162);
    ctx.font = '16px "Hi Melody", cursive';
    ctx.fillStyle = '#000';
    wrapText(ctx, body, lx + 24, ly + 188, lw - 48, 26, ly + lh - 120);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(lx + 24, ly + lh - 110, lw - 48, 1);

    ctx.font = '18px "Gurajada", serif';
    ctx.fillStyle = '#000';
    ctx.fillText('From.', lx + 24, ly + lh - 82);
    ctx.font = '18px "Hi Melody", cursive';
    ctx.fillText(from || '—', lx + 24, ly + lh - 54);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(lx + 24, ly + lh - 44, lw - 48, 1);

    // 포토 카드
    const px = 460, py = 40, pw = W - px - 40, ph = H - 80;
    ctx.fillStyle = '#fcfcfc';
    ctx.fillRect(px, py, pw, ph);

    const photoH = (ph - 80) / 2 - 6;
    const photoW = pw - 48;
    const margin = 24;

    // 위 사진 (1번째)
    ctx.fillStyle = '#000';
    ctx.fillRect(px + margin, py + margin, photoW, photoH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + margin, py + margin, photoW, photoH);
    ctx.clip();
    drawCover(ctx, img1, px + margin, py + margin, photoW, photoH);
    ctx.restore();

    // 아래 사진 (2번째)
    const py2 = py + margin + photoH + 12;
    ctx.fillStyle = '#000';
    ctx.fillRect(px + margin, py2, photoW, photoH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + margin, py2, photoW, photoH);
    ctx.clip();
    drawCover(ctx, img2, px + margin, py2, photoW, photoH);
    ctx.restore();

    // 날짜
    const dateStr = document.getElementById('result-date').textContent;
    ctx.font = '16px "Gurajada", serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, px + pw / 2, py + ph - 14);
    ctx.textAlign = 'left';
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale, sh = h / scale;
  const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(ctx, text, x, y, maxW, lineH, maxY) {
  let currentY = y;
  for (const line of text.split('\n')) {
    let cur = '';
    for (const ch of line) {
      const test = cur + ch;
      if (ctx.measureText(test).width > maxW && cur) {
        if (currentY + lineH > maxY) { ctx.fillText('…', x, currentY); return; }
        ctx.fillText(cur, x, currentY);
        currentY += lineH;
        cur = ch;
      } else { cur = test; }
    }
    if (currentY + lineH > maxY) { ctx.fillText('…', x, currentY); return; }
    ctx.fillText(cur, x, currentY);
    currentY += lineH;
  }
}

/* ── 저장 (폴라로이드 1장 + 편지 1장) ── */
async function saveImage() {
  const to      = document.getElementById('letter-to').value.trim() || '포토레터';
  const body    = document.getElementById('letter-body').value.trim();
  const from    = document.getElementById('letter-from').value.trim();
  const dateStr = document.getElementById('result-date').textContent;

  showToast('저장 준비 중...');
  await document.fonts.ready;

  const [polaroid, letter] = await Promise.all([
    buildPolaroidCanvas(dateStr),
    buildLetterCanvas(to, body, from, dateStr),
  ]);

  // 모바일: Web Share API 시도
  if (navigator.share && navigator.canShare) {
    const [blob1, blob2] = await Promise.all([
      new Promise(r => polaroid.toBlob(r, 'image/png')),
      new Promise(r => letter.toBlob(r, 'image/png')),
    ]);
    const file1 = new File([blob1], `포토레터_사진_${to}.png`, { type: 'image/png' });
    const file2 = new File([blob2], `포토레터_편지_${to}.png`, { type: 'image/png' });
    if (navigator.canShare({ files: [file1, file2] })) {
      try {
        await navigator.share({ files: [file1, file2], title: 'Photo Letter' });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
  }

  // 모바일 폴백: 이미지 오버레이 (꾹 눌러서 저장)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    showSaveOverlay(polaroid, letter);
    return;
  }

  // 데스크톱: 직접 다운로드
  dlBlob(polaroid, `포토레터_사진_${to}.png`);
  setTimeout(() => dlBlob(letter, `포토레터_편지_${to}.png`), 800);
  showToast('사진 + 편지 2장이 저장됩니다 💾');
}

function showSaveOverlay(polaroid, letter) {
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.92)', 'z-index:10000',
    'overflow-y:auto', 'padding:24px 16px',
    'display:flex', 'flex-direction:column', 'align-items:center', 'gap:20px'
  ].join(';');

  const hint = document.createElement('p');
  hint.textContent = '이미지를 꾹 눌러 사진첩에 저장하세요';
  hint.style.cssText = "color:#fff;font-family:'Dongle',sans-serif;font-size:20px;text-align:center;margin-top:8px;";

  const img1 = document.createElement('img');
  img1.src = polaroid.toDataURL('image/png');
  img1.style.cssText = 'max-width:100%;border-radius:4px;';

  const img2 = document.createElement('img');
  img2.src = letter.toDataURL('image/png');
  img2.style.cssText = 'max-width:100%;border-radius:4px;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '닫기';
  closeBtn.style.cssText = "background:#fff;border:none;border-radius:50px;padding:12px 32px;font-family:'Dongle',sans-serif;font-size:20px;cursor:pointer;margin-bottom:16px;";
  closeBtn.onclick = () => document.body.removeChild(overlay);

  overlay.append(hint, img1, img2, closeBtn);
  document.body.appendChild(overlay);
}

function dlBlob(canvas, name) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }, 'image/png');
}

/* ── 공통 캔버스 사이즈 (두 이미지 동일) ── */
const DESIGN_W = 1800;
const DESIGN_H = 2800;

function getSaveDims() {
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return mobile ? { W: 900, H: 1400 } : { W: DESIGN_W, H: DESIGN_H };
}

/* ── 폴라로이드 캔버스 빌더 ── */
function buildPolaroidCanvas(dateStr) {
  return new Promise((resolve, reject) => {
    const DW  = DESIGN_W;
    const DH  = DESIGN_H;
    const { W, H } = getSaveDims();
    const pad   = 80;
    const gap   = 32;
    const dateH = 120;
    const photoW = DW - pad * 2;
    const photoH = Math.round((DH - pad * 2 - gap - dateH) / 2);

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.scale(W / DW, H / DH);

    const img1 = new Image();
    const img2 = new Image();
    let loaded = 0;

    const draw = () => {
      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(0, 0, DW, DH);

      // 사진 1
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, photoW, photoH);
      ctx.clip();
      drawCover(ctx, img1, pad, pad, photoW, photoH);
      ctx.restore();

      // 사진 2
      const y2 = pad + photoH + gap;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, y2, photoW, photoH);
      ctx.clip();
      drawCover(ctx, img2, pad, y2, photoW, photoH);
      ctx.restore();

      // 날짜
      ctx.font = '40px "Gurajada", serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText(dateStr, DW / 2, DH - 80);
      ctx.textAlign = 'left';

      resolve(canvas);
    };

    img1.onerror = img2.onerror = reject;
    img1.onload  = img2.onload  = () => { if (++loaded === 2) draw(); };
    img1.src = capturedDataUrl1;
    img2.src = capturedDataUrl2;
  });
}

/* ── 편지 캔버스 빌더 ── */
function buildLetterCanvas(to, body, from, dateStr) {
  return new Promise(resolve => {
    const DW = DESIGN_W;
    const DH = DESIGN_H;
    const { W, H } = getSaveDims();
    const px = 140;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.scale(W / DW, H / DH);

    // 배경
    ctx.fillStyle = '#fcfcfc';
    ctx.fillRect(0, 0, DW, DH);

    // Photo Letter 타이틀
    ctx.font = '112px "Moul", sans-serif';
    ctx.fillStyle = '#191919';
    ctx.fillText('Photo Letter', px, 192);

    // To.
    ctx.font = '52px "Gurajada", serif'; ctx.fillStyle = '#000';
    ctx.fillText('To.', px, 368);
    ctx.font = '52px "Hi Melody", cursive';
    ctx.fillText(to || '—', px, 472);
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 504); ctx.lineTo(DW - px, 504); ctx.stroke();

    // contents
    ctx.font = '52px "Gurajada", serif'; ctx.fillStyle = '#000';
    ctx.fillText('Message', px, 628);
    ctx.font = '48px "Hi Melody", cursive'; ctx.fillStyle = '#000';
    wrapText(ctx, body, px, 732, DW - px * 2, 100, 1960);
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 2000); ctx.lineTo(DW - px, 2000); ctx.stroke();

    // From.
    ctx.font = '52px "Gurajada", serif'; ctx.fillStyle = '#000';
    ctx.fillText('From.', px, 2124);
    ctx.font = '52px "Hi Melody", cursive';
    ctx.fillText(from || '—', px, 2228);
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 2260); ctx.lineTo(DW - px, 2260); ctx.stroke();

    // 날짜
    ctx.font = '40px "Gurajada", serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, DW / 2, DH - 80);
    ctx.textAlign = 'left';

    resolve(canvas);
  });
}

/* ── 공유 ── */
async function shareImage() {
  showToast('링크 생성 중...');
  try {
    const to   = document.getElementById('letter-to').value.trim();
    const body = document.getElementById('letter-body').value.trim();
    const from = document.getElementById('letter-from').value.trim();
    const date = document.getElementById('result-date').textContent;

    const [p1, p2] = await Promise.all([
      compressPhoto(capturedDataUrl1, 180, 135),
      compressPhoto(capturedDataUrl2, 180, 135),
    ]);

    const payload = JSON.stringify({ to, body, from, date, p1, p2, v: 1 });
    // UTF-8 안전 base64 인코딩
    const encoded = btoa(encodeURIComponent(payload).replace(/%([0-9A-F]{2})/g,
      (_, p) => String.fromCharCode(parseInt(p, 16))));
    const shareUrl = location.origin + location.pathname + '#share=' + encoded;

    copyText(shareUrl);
    showToast('공유 링크가 복사되었습니다 🔗');
  } catch (e) {
    console.error(e);
    showToast('링크 생성에 실패했습니다');
  }
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => copyFallback(text));
  } else {
    copyFallback(text);
  }
}

function copyFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
}

function compressPhoto(dataUrl, w, h) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(w / img.width, h / img.height);
      const sw = w / scale, sh = h / scale;
      const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.35));
    };
    img.src = dataUrl;
  });
}

/* ── 공유 링크로 접속 시 결과 화면 복원 ── */
function loadSharedResult() {
  const hash = location.hash;
  if (!hash.startsWith('#share=')) return;
  try {
    const encoded = hash.slice(7);
    const json    = decodeURIComponent(atob(encoded).split('').map(
      c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    const d       = JSON.parse(json);

    document.getElementById('letter-to').value   = d.to   || '';
    document.getElementById('letter-body').value = d.body || '';
    document.getElementById('letter-from').value = d.from || '';

    capturedDataUrl1 = d.p1;
    capturedDataUrl2 = d.p2;

    document.getElementById('result-date').textContent  = d.date || '';
    document.getElementById('result-to').textContent    = d.to   || '—';
    document.getElementById('result-body').textContent  = d.body || '';
    document.getElementById('result-from').textContent  = d.from || '—';
    document.getElementById('result-photo-top').src     = d.p1;
    document.getElementById('result-photo-bottom').src  = d.p2;

    const card = document.getElementById('main-flip-card');
    if (card) card.classList.remove('flipped');
    const hint = document.getElementById('flip-hint');
    if (hint) { hint.textContent = '↩ 눌러서 편지 보기'; hint.classList.remove('hidden'); }

    goTo('screen-result');
  } catch (e) {
    console.error('공유 링크 파싱 실패:', e);
  }
}

window.addEventListener('DOMContentLoaded', loadSharedResult);

/* ── 토스트 ── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
