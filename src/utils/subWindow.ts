import {
  WebviewWindow,
  getAllWebviewWindows,
} from "@tauri-apps/api/webviewWindow";

export const SUB_WINDOW_WIDTH = 130;
export const SUB_WINDOW_HEIGHT = 130;

export async function createSubWindow(url: string, title: string) {
  let message = "";
  let success = true;
  try {
    const allWindows = await getAllWebviewWindows();
    const windownsLen = allWindows.length;
    const label = `NewWindow_${windownsLen + 1}`;
    const openUrl = url || "index.html";
    const newTitle = title || "新窗口";
    const openTitle = `${newTitle}-${windownsLen + 1}`;
    const webview_window = new WebviewWindow(label, {
      url: openUrl,
      title: openTitle,
      parent: "main",
      zoomHotkeysEnabled: false,

      width: SUB_WINDOW_WIDTH,
      height: SUB_WINDOW_HEIGHT,
      minWidth: SUB_WINDOW_WIDTH,
      minHeight: SUB_WINDOW_HEIGHT,
      alwaysOnTop: true,
      decorations: false, // 隐藏窗口边框
      visible: false,
      resizable: false,
    });
    webview_window.once("tauri://created", async () => {
      message = "打开成功";
    });

    webview_window.once("tauri://error", function (e) {
      message = `打开${openTitle}报错: ${e}`;
      success = false;
    });
    return { success: success, message: message, webview: webview_window };
  } catch (error) {
    return { success: false, message: error };
  }
}
