// main.js (Electron Main Process)
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  console.log('Creating application window...');
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('renderer/index.html');
}

app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('Reactivating app, creating window...');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
ipcMain.handle('dialog:openFile', async () => {
  console.log('Opening file dialog...');
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp'] }]
  });
  if (result.canceled) {
    console.log('File selection cancelled.');
    return null;
  }
  console.log('File selected:', result.filePaths[0]);
  return result.filePaths[0];
});

ipcMain.handle('export:pdf', async (event, dataUrl, { cols, rows, margin, overlap, paperWidth, paperHeight }) => {
  console.log('Exporting PDF with settings:', { cols, rows, margin, overlap, paperWidth, paperHeight });
  const { PDFDocument, rgb } = require('pdf-lib');
  const pdf = await PDFDocument.create();

  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const imgBytes = Buffer.from(base64Data, 'base64');
  const image = await pdf.embedPng(imgBytes);

  const imgW = image.width;
  const imgH = image.height;
  const sliceW = imgW / cols;
  const sliceH = imgH / rows;
  console.log(`Image dimensions: ${imgW}x${imgH}, Slice size: ${sliceW}x${sliceH}`);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      console.log(`Creating page for tile [${col + 1}, ${row + 1}]`);
      const page = pdf.addPage([paperWidth, paperHeight]);
      const offsetX = col * sliceW - overlap;
      const offsetY = (rows - row - 1) * sliceH - overlap;

      page.drawImage(image, {
        x: margin - offsetX,
        y: margin - offsetY,
        width: imgW,
        height: imgH
      });

      const drawLine = (x1, y1, x2, y2) => {
        page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: rgb(0, 0, 0) });
      };
      const markLen = 10;
      const pw = paperWidth, ph = paperHeight;
      drawLine(0, 0, markLen, 0); drawLine(0, 0, 0, markLen);
      drawLine(pw - markLen, 0, pw, 0); drawLine(pw, 0, pw, markLen);
      drawLine(0, ph - markLen, 0, ph); drawLine(0, ph, markLen, ph);
      drawLine(pw - markLen, ph, pw, ph); drawLine(pw, ph - markLen, pw, ph);

      page.drawText(`Tile ${col + 1},${row + 1}`, { x: margin, y: ph - 20, size: 8, color: rgb(0.2, 0.2, 0.2) });
    }
  }

  const pdfBytes = await pdf.save();
  const filePath = path.join(app.getPath('desktop'), 'rasterbated.pdf');
  fs.writeFileSync(filePath, pdfBytes);
  console.log('PDF saved to:', filePath);
  return filePath;
});
