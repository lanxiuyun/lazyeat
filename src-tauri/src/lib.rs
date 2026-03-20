// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 提取sidecar启动逻辑到单独的函数
async fn start_sidecar(app: tauri::AppHandle) -> Result<String, String> {
    let sidecar = app
        .shell()
        .sidecar("Lazyeat Backend")
        .map_err(|e| format!("无法找到sidecar: {}", e))?;

    let (_rx, _child) = sidecar
        .spawn()
        .map_err(|e| format!("无法启动sidecar: {}", e))?;

    Ok("Sidecar已启动".to_string())
}

// 保留命令供可能的手动调用
#[tauri::command]
async fn run_sidecar(app: tauri::AppHandle) -> Result<String, String> {
    start_sidecar(app).await
}

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        // .plugin(tauri_plugin_window_state::Builder::new().build()) // 窗口状态管理,启用了导致 sub-window 无法设置decorations
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // 在应用启动时自动启动sidecar
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match start_sidecar(app_handle).await {
                    Ok(msg) => println!("{}", msg),
                    Err(e) => eprintln!("启动sidecar失败: {}", e),
                }
            });

            // 创建系统托盘
            let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        let _ = app.emit("tray-quit-requested", ());
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, run_sidecar])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
