import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { FileManager } from './fileManager';

const fileManager = new FileManager();

// 로깅 함수 추가
function log(message: string) {
  console.log(`[TodoNote] ${new Date().toISOString()}: ${message}`);
}

// 에러 핸들링 추가
process.on('uncaughtException', (error) => {
  console.error('[TodoNote] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[TodoNote] Unhandled Rejection at:', promise, 'reason:', reason);
});

function createWindow(): void {
  try {
    log('Creating main window...');
    
    const mainWindow = new BrowserWindow({
      height: 900,
      width: 1400,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        allowRunningInsecureContent: true
      },
      icon: path.join(__dirname, '../../icon.ico'),
      titleBarStyle: 'hidden',
      frame: false,
      backgroundColor: '#ffffff',
      show: false // 처음에는 숨김
    });

    log('Main window created successfully');

    const htmlPath = path.join(__dirname, '../../src/renderer/index.html');
    log(`Loading HTML file from: ${htmlPath}`);
    
    // 윈도우가 준비되면 보이기
    mainWindow.once('ready-to-show', () => {
      log('Window ready to show');
      mainWindow.show();
    });
    
    mainWindow.loadFile(htmlPath);
    
    log('HTML file loaded successfully');
  
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

    // 이름 변경 IPC 핸들러
    ipcMain.handle('rename-project', (event, oldName: string, newName: string) => {
      return fileManager.renameProject(oldName, newName);
    });

    ipcMain.handle('rename-file', (event, projectName: string, oldFileName: string, newFileName: string) => {
      return fileManager.renameFile(projectName, oldFileName, newFileName);
    });

    // 프로젝트 생성 IPC 핸들러
    ipcMain.handle('create-project', (event, projectName: string) => {
      return fileManager.createProject(projectName);
    });

    // 파일 저장 IPC 핸들러
    ipcMain.handle('save-file', (event, projectName: string, fileName: string, content: string) => {
      return fileManager.saveFile(projectName, fileName, content);
    });

    // 새 메모 파일 생성 IPC 핸들러
    ipcMain.handle('create-memo-file', (event, projectName: string, fileName: string) => {
      return fileManager.createMemoFile(projectName, fileName);
    });
  } catch (error) {
    console.error('[TodoNote] Error in createWindow:', error);
  }
}

// GPU 하드웨어 가속 완전히 비활성화
app.disableHardwareAcceleration();

// 추가 GPU 관련 플래그 설정
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-compositing');
app.commandLine.appendSwitch('--disable-gpu-rasterization');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-features', 'TranslateUI');
app.commandLine.appendSwitch('--disable-ipc-flooding-protection');

app.whenReady().then(() => {
  log('App is ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
