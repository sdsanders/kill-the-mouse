const { globalShortcut, Notification } = require('electron');
const ioHook = require('iohook');
const menubar = require('menubar');
const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
const url = require('url');
const path = require('path');
const { ipcMain } = require('electron');

momentDurationFormatSetup(moment);

const mb = menubar();

const streak = {
  active: false,
  keys: 0
};
let isMenuBarOpen = false;

function handleKeyboardEvent(event) {
  if (!streak.active) {
    streak.active = true;
    streak.startTime = Date.now();
  }

  streak.keys++;
  mb.window.webContents.send('current-streak', streak.keys);
}
let minStreak = 10;
function handleMouseEvent(event) {
  if (!streak.active) { return };

  const currentTime = Date.now();
  const duration = moment.duration(currentTime - streak.startTime).format('h [hours], m [minutes], s [seconds]');

  if (streak.keys > minStreak) {
    mb.window.webContents.send('streak-broken', {
      keystrokes: streak.keys,
      duration,
      timestamp: Date.now()
    });

    const notification = new Notification({
      title: 'Streak broken!',
      body: `You typed ${streak.keys} keys during that streak, lasting ${duration}`
    });

    notification.show();
  }

  streak.active = false;
  streak.keys = 0;
}

function registerShortcut() {
  if (isMenuBarOpen) {
    mb.hideWindow();
  } else {
    mb.showWindow();
  }
}

function ready () {
  mb.showWindow();
}

const windowRendered = () => {

  mb.window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // ✋ 🚫 🐛
  // mb.window.openDevTools();

  ioHook.on('keyup', handleKeyboardEvent);

  ioHook.on('mousemove', handleMouseEvent);
  ioHook.on('mouseclick', handleMouseEvent);
  ioHook.on('mousedrag', handleMouseEvent);
  ioHook.on('mousewheel', handleMouseEvent);

  ioHook.start();

  globalShortcut.register('CommandOrControl+K', registerShortcut);
}

// startup health-check pings
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('min-streak', (event, arg) => {
  console.log('new min-streak: ', arg);
  minStreak = arg;
});

ipcMain.on('quit', (event, arg) => {
  mb.app.quit();
});

mb.on('ready', ready);
mb.on('after-show', () => { isMenuBarOpen = true; });
mb.on('after-hide', () => { isMenuBarOpen = false; });
mb.on('after-create-window', windowRendered);