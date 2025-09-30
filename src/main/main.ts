import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { FileManager } from './fileManager';

const fileManager = new FileManager();

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../../icon.ico'),
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#ffffff'
  });

  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));
  
  // 개발 중에는 DevTools 열기
  // mainWindow.webContents.openDevTools();

  // 윈도우 컨트롤 IPC 핸들러
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });

  // 파일 관리 IPC 핸들러
  ipcMain.handle('get-projects', () => {
    return fileManager.getProjects();
  });

  ipcMain.handle('get-project-data', (event, projectName: string) => {
    return fileManager.getProjectData(projectName);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
