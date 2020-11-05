const { app, BrowserWindow, ipcMain, Menu, globalShortcut, shell, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { create } = require('domain');
const { dir } = require('console');
let destination = path.join(os.homedir(), 'audios');

const isDev = process.env.NODE_ENV !== undefined && process.env.NODE_ENV === "development" ?true : false;

function createPreferenceWindow(){
    const preferenceWindow = new BrowserWindow({
        width: isDev? 950 : 500,
        resizable: isDev?true:false,
        height: 150,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets", "icons", "icon.png"),
        webPreferences: {
            nodeIntegration: true,
        },
    });

    preferenceWindow.loadFile("./src/preferences/index.html");

    preferenceWindow.once("ready-to-show", ()=>{
        preferenceWindow.show();
        preferenceWindow.webContents.send("dest-path-update", destination);
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: isDev? 950 : 500,
        resizable: isDev?true:false,
        height: 300,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets", "icons", "icon.png"),
        webPreferences: {
            nodeIntegration: true,
        },
    });

    win.loadFile("./src/mainWindow/index.html");
    if(isDev) { win.webContents.openDevTools();}

    win.once("ready-to-show", ()=>{
        win.show();
        setTimeout(()=>{
            win.webContents.send("cpu_name", os.cpus()[0].model);
        }, 3000);
    });

    const menuTemplate = [
        {label: app.name,
        submenu: [
            {label: 'Preferences', click:()=>{ createPreferenceWindow() }},
            {label: 'Open destination folder', click:()=>{ shell.openPath(destination) } }
        ]},
        {label: 'File',
            submenu: [
                {role: 'quit'}
            ]}
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(()=>{
    createWindow();
});

app.on('will-quit', ()=>{
    globalShortcut.unregisterAll();
});

app.on("activate", ()=>{
    if(BrowserWindow.getAllWindows().length === 0){
        createWindow();
    }
});

ipcMain.on("open_new_window", ()=>{
    createWindow();
});

ipcMain.on("save_buffer", (e, buffer)=>{
    const filePath = path.join(destination, `${Date.now()}` );
    fs.writeFileSync(`${filePath}.mp3`, buffer);
});

ipcMain.handle('show-dialog', async (event)=>{
    const result = await dialog.showOpenDialog({properties:['openDirectory'] });
    const dirPath = result.filePaths[0];

    destination = dirPath;

    return destination;
});


