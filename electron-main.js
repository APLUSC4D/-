import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;
let mainWindow = null;

function startBackend() {
  console.log('Starting Express backend...');
  const isPackaged = app.isPackaged;
  
  if (isPackaged) {
    // In production (packaged), run the bundled server.cjs
    const serverPath = path.join(__dirname, 'dist', 'server.cjs');
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, NODE_ENV: 'production', PORT: '3000' }
    });
  } else {
    // In development, run the typescript server via tsx
    const serverPath = path.join(__dirname, 'server.ts');
    serverProcess = fork(path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs'), [serverPath], {
      env: { ...process.env, NODE_ENV: 'development', PORT: '3000' }
    });
  }

  serverProcess.on('error', (err) => {
    console.error('Backend process error:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function waitAndLoadUrl(win, url) {
  const tryLoad = () => {
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        win.loadURL(url);
      } else {
        setTimeout(tryLoad, 300);
      }
    }).on('error', () => {
      setTimeout(tryLoad, 300);
    });
  };
  tryLoad();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '本地素材管理器',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  waitAndLoadUrl(mainWindow, 'http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
