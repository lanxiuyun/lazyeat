import {
  WebviewWindow,
  getAllWebviewWindows,
} from "@tauri-apps/api/webviewWindow";

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
      width: 1080,
      height: 600,
      resizable: true,
      center: true,
      zoomHotkeysEnabled: false,
      parent: "main",
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
