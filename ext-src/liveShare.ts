import * as vsls from 'vsls/vscode';
import { BrowserViewWindowManager, BrowserViewWindow } from './extension';

const SERVICE_NAME = 'browser-preview';
const REQUEST_GET_WINDOWS = 'getWindows';
const NOTIFICATION_WINDOW_CREATED = 'windowCreated';
const NOTIFICATION_WINDOW_INTERACTION = 'windowInteraction';

const DISPATCHED_EVENTS = ['Input.dispatchMouseEvent', 'Input.dispatchKeyboardEvent'];

export async function setupLiveShare(windowManager: BrowserViewWindowManager) {
  const liveShare = await vsls.getApi();
  if (!liveShare) {
	// The user doesn't have the Live Share
	// extension installed, so there's nothing
	// further to initialize.
    return;
  }

  await onSessionStarted(liveShare);
  setupServices(liveShare, windowManager);
}

async function setupServices(liveShare: vsls.LiveShare, windowManager: BrowserViewWindowManager) {
  let service: vsls.SharedService | vsls.SharedServiceProxy;

  if (liveShare.session.role === vsls.Role.Host) {
    service = (await liveShare.shareService(SERVICE_NAME))!;

    service.onRequest(REQUEST_GET_WINDOWS, () => {
      const windows = Array.from(windowManager.openWindows);
      return windows.map((window) => {
        const viewport = window.browserPage!.page.viewport();

        return {
          startUrl: window.config.startUrl, // TODO: This needs to be the current URL
          viewport
        };
      });
    });
  } else if (liveShare.session.role === vsls.Role.Guest) {
    service = await liveShare.getSharedService(SERVICE_NAME);

    if (!service) {
      // The host doesn't have this extension installed
      return;
    }

    const windows = await service.request(REQUEST_GET_WINDOWS, []);
    if (windows && windows.length > 0) {
      windows.forEach(({ startUrl, viewport }: any) => {
        windowManager.create(startUrl);
      });
    }

    service.onNotify(NOTIFICATION_WINDOW_CREATED, async (args: any) => {
      await windowManager.create(args.startUrl);
    });
  }

  handleRemoteInteractions(service, liveShare, windowManager);
  handleLocalWindowCreation(service, liveShare, windowManager);
}

function onSessionStarted(liveShare: vsls.LiveShare) {
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
      const viewport = await window.browserPage!.page.viewport();

      service.notify(NOTIFICATION_WINDOW_CREATED, {
        startUrl: window.config.startUrl,
        viewport
      });
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
