'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  emulate: (webContentsId, params) => ipcRenderer.invoke('emulate', webContentsId, params)
});
