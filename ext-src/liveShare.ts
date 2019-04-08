import * as vsls from 'vsls/vscode';
import { BrowserViewWindowManager } from './BrowserViewWindowManager';
import { BrowserViewWindow, PANEL_TITLE } from './BrowserViewWindow';

const SERVICE_NAME = 'browser-preview';
const REQUEST_GET_WINDOWS = 'getWindows';
const NOTIFICATION_WINDOW_CREATED = 'windowCreated';
const NOTIFICATION_WINDOW_INTERACTION = 'windowInteraction';

const DISPATCHED_EVENTS = [
  'Input.dispatchKeyEvent',
  'Input.dispatchMouseEvent',
  'Page.goBackward',
  'Page.goForward',
  'Page.navigate',
  'Page.reload'
];

const SHARED_PANEL_TITLE = `${PANEL_TITLE} (Shared)`;

export async function setupLiveShare(windowManager: BrowserViewWindowManager) {
  const liveShare = await vsls.getApi();
  if (!liveShare) {
    // The user doesn't have the Live Share
    // extension installed, so there's nothing
    // further to initialize.
    return;
  }

  await sessionStarted(liveShare);
  setupServices(liveShare, windowManager);
}

async function setupServices(liveShare: vsls.LiveShare, windowManager: BrowserViewWindowManager) {
  let service: vsls.SharedService | vsls.SharedServiceProxy;

  if (liveShare.session.role === vsls.Role.Host) {
    service = (await liveShare.shareService(SERVICE_NAME))!;

    service.onRequest(REQUEST_GET_WINDOWS, () => {
      const windows = Array.from(windowManager.openWindows);
      return windows.map((window) => window.getState());
    });
  } else if (liveShare.session.role === vsls.Role.Guest) {
    service = await liveShare.getSharedService(SERVICE_NAME);

    if (!service) {
      // The host doesn't have this extension installed
      return;
    }

    const windows = await service.request(REQUEST_GET_WINDOWS, []);
    if (windows && windows.length > 0) {
      windows.forEach(({ url }: any) => {
        windowManager.create(url, SHARED_PANEL_TITLE);
      });
    }

    service.onNotify(NOTIFICATION_WINDOW_CREATED, async (args: any) => {
      await windowManager.create(args.url, SHARED_PANEL_TITLE);
    });
  }

  handleRemoteInteractions(service, liveShare, windowManager);
  handleLocalWindowCreation(service, liveShare, windowManager);
}

function sessionStarted(liveShare: vsls.LiveShare) {
  return new Promise((resolve) => {
    if (liveShare.session.id) {
      resolve();
    } else {
      liveShare.onDidChangeSession((e) => {
        if (e.session.id) {
          resolve();
        }
      });
    }
  });
}

function handleRemoteInteractions(
  service: vsls.SharedService | vsls.SharedServiceProxy,
  liveShare: vsls.LiveShare,
  windowManager: BrowserViewWindowManager
) {
  service.onNotify(NOTIFICATION_WINDOW_INTERACTION, async (args: any) => {
    const { peerNumber, url, data } = args;

    if (peerNumber === liveShare.session.peerNumber) {
      // This is a re-broadcasted event from
      // the same user.
      return;
    }

    windowManager.openWindows.forEach((b: BrowserViewWindow) => {
      if (b.config.startUrl == url) {
        b.browserPage!.send(data.type, data.params);
      }
    });

    if (liveShare.session.role === vsls.Role.Host) {
      service.notify(NOTIFICATION_WINDOW_INTERACTION, args);
    }
  });
}

function handleLocalWindowCreation(
  service: vsls.SharedService | vsls.SharedServiceProxy,
  liveShare: vsls.LiveShare,
  windowManager: BrowserViewWindowManager
) {
  windowManager.on(NOTIFICATION_WINDOW_CREATED, async (window: BrowserViewWindow) => {
    if (liveShare.session.role === vsls.Role.Host) {
      service.notify(NOTIFICATION_WINDOW_CREATED, window.getState());
    }
    // Listen for any local browser interactions,
    // and synronize them to all other guests.
    window!.on('clientEvent', (args: any) => {
      const { type, params } = args;

      if (!type || DISPATCHED_EVENTS.includes(type)) {
        return;
      }

      service.notify(NOTIFICATION_WINDOW_INTERACTION, {
        peerNumber: liveShare.session.peerNumber,
        data: params,
        url: window.config.startUrl
      });
    });
  });
}
