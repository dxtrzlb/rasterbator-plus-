import { renderHalftone } from '../modules/halftone.js';

let currentImage = null;

const dotSizeInput = document.getElementById('dotSize');
const spacingInput = document.getElementById('spacing');
const colsInput = document.getElementById('cols');
const rowsInput = document.getElementById('rows');
const marginInput = document.getElementById('margin');
const overlapInput = document.getElementById('overlap');
const paperSize = document.getElementById('paperSize');
const paperWidthInput = document.getElementById('paperWidth');
const paperHeightInput = document.getElementById('paperHeight');
const customPaperDiv = document.getElementById('customPaper');

document.getElementById('loadImage').addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile();
  if (!filePath) return;
  const img = new Image();
  img.src = `file://${filePath}`;
  img.onload = () => { currentImage = img; drawPreview(); };
});

function drawPreview() {
  if (!currentImage) return;
  const canvas = document.getElementById('preview');
  const ctx = canvas.getContext('2d');
  canvas.width = currentImage.width;
  canvas.height = currentImage.height;

  ctx.drawImage(currentImage, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const dotSize = parseInt(dotSizeInput.value);
  const spacing = parseInt(spacingInput.value);
  renderHalftone(ctx, imgData, dotSize, spacing, canvas.width, canvas.height);

  const cols = parseInt(colsInput.value);
  const rows = parseInt(rowsInput.value);
  const pageWidth = canvas.width / cols;
  const pageHeight = canvas.height / rows;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  for (let i=1;i<cols;i++){ const x=i*pageWidth; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
  for (let j=1;j<rows;j++){ const y=j*pageHeight; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
}

[dotSizeInput, spacingInput, colsInput, rowsInput].forEach(el => el.addEventListener('input', drawPreview));

paperSize.addEventListener('change', () => {
  const val = paperSize.value;
  if (val === 'custom') {
    customPaperDiv.style.display = 'inline-flex';
  } else {
    customPaperDiv.style.display = 'none';
    const [w, h] = val.split('x').map(Number);
    paperWidthInput.value = w; paperHeightInput.value = h;
  }
});

document.getElementById('exportPDF').addEventListener('click', async () => {
  const canvas = document.getElementById('preview');
  const dataUrl = canvas.toDataURL('image/png');
  const cols = parseInt(colsInput.value);
  const rows = parseInt(rowsInput.value);
  const margin = parseInt(marginInput.value);
  const overlap = parseInt(overlapInput.value);
  const paperWidth = parseInt(paperWidthInput.value);
  const paperHeight = parseInt(paperHeightInput.value);
  console.log('Export parameters:', { cols, rows, margin, overlap, paperWidth, paperHeight });
  const resultPath = await window.electronAPI.exportPDF(dataUrl, { cols, rows, margin, overlap, paperWidth, paperHeight });
  if (resultPath) alert(`PDF saved to: ${resultPath}`);
});
