'use strict';

const { app, BrowserWindow, Menu, ipcMain, webContents } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1680,
    height: 940,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#17181c',
    title: 'Yan Ekran',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true
    }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_event, contents) => {
  // Pencerelerin içindeki siteler Node'a erişemesin
  contents.on('will-attach-webview', (_e, webPreferences) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
  });

  // Sitelerin yeni pencere / yeni sekme açma isteği aynı panelde açılsın
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) contents.loadURL(url);
      return { action: 'deny' };
    });
  }
});

// Telefon/tablet panellerini gerçek mobil cihaz gibi davrandır (dokunmatik, mobil viewport)
ipcMain.handle('emulate', (_event, id, params) => {
  const wc = webContents.fromId(Number(id));
  if (!wc || wc.getType() !== 'webview') return false;

  const w = Math.max(1, Math.min(4000, Number(params && params.w) || 0));
  const h = Math.max(1, Math.min(4000, Number(params && params.h) || 0));
  const dpr = Math.max(1, Math.min(4, Number(params && params.dpr) || 1));

  wc.enableDeviceEmulation({
    screenPosition: 'mobile',
    screenSize: { width: w, height: h },
    viewPosition: { x: 0, y: 0 },
    deviceScaleFactor: dpr,
    viewSize: { width: 0, height: 0 },
    scale: 1
  });
  return true;
});
