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

use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_shell::process::CommandEvent;
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
        .setup(|app| {
            // 在应用启动时自动启动sidecar
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match start_sidecar(app_handle).await {
                    Ok(msg) => println!("{}", msg),
                    Err(e) => eprintln!("启动sidecar失败: {}", e),
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, run_sidecar])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
