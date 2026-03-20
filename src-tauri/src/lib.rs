use enigo::{Enigo, Keyboard, Mouse, Settings, Coordinate};
use enigo::{Key, Direction};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;

/// 解析按键字符串，支持组合键（如 "ctrl+r"）
fn parse_key(key_str: &str) -> Result<Vec<Key>, String> {
    let key_str = key_str.trim();
    let parts: Vec<&str> = key_str.split('+').map(|s| s.trim()).collect();
    
    let mut keys = Vec::new();
    
    for part in parts {
        let lower = part.to_lowercase();
        let key = match lower.as_str() {
            // 修饰键
            "ctrl" | "control" => Key::Control,
            "alt" => Key::Alt,
            "shift" => Key::Shift,
            "meta" | "command" | "cmd" | "win" | "windows" => Key::Meta,
            
            // 功能键
            "f1" => Key::F1,
            "f2" => Key::F2,
            "f3" => Key::F3,
            "f4" => Key::F4,
            "f5" => Key::F5,
            "f6" => Key::F6,
            "f7" => Key::F7,
            "f8" => Key::F8,
            "f9" => Key::F9,
            "f10" => Key::F10,
            "f11" => Key::F11,
            "f12" => Key::F12,
            
            // 方向键 - 支持多种命名
            "up" | "arrowup" => Key::UpArrow,
            "down" | "arrowdown" => Key::DownArrow,
            "left" | "arrowleft" => Key::LeftArrow,
            "right" | "arrowright" => Key::RightArrow,
            
            // 其他常用键
            "enter" | "return" => Key::Return,
            "space" | "spacebar" => Key::Space,
            "tab" => Key::Tab,
            "escape" | "esc" => Key::Escape,
            "backspace" | "delete" => Key::Backspace,
            "delete_forward" | "del" => Key::Delete,
            "home" => Key::Home,
            "end" => Key::End,
            "pageup" => Key::PageUp,
            "pagedown" => Key::PageDown,
            "insert" => Key::Insert,
            
            // 单字符键
            _ if part.len() == 1 => {
                let c = part.chars().next().unwrap();
                Key::Unicode(c)
            }
            
            _ => return Err(format!("Unknown key: {}", part)),
        };
        keys.push(key);
    }
    
    Ok(keys)
}

/// 移动鼠标到指定坐标
#[tauri::command]
async fn move_mouse(x: i32, y: i32) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create Enigo: {:?}", e))?;
    
    enigo.move_mouse(x, y, Coordinate::Abs)
        .map_err(|e| format!("Failed to move mouse: {:?}", e))?;
    
    Ok(())
}

/// 点击鼠标左键
#[tauri::command]
async fn click_mouse() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create Enigo: {:?}", e))?;
    
    enigo.button(enigo::Button::Left, Direction::Click)
        .map_err(|e| format!("Failed to click mouse: {:?}", e))?;
    
    Ok(())
}

/// 向上滚动
#[tauri::command]
async fn scroll_up() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create Enigo: {:?}", e))?;
    
    enigo.scroll(1, enigo::Axis::Vertical)
        .map_err(|e| format!("Failed to scroll up: {:?}", e))?;
    
    Ok(())
}

/// 向下滚动
#[tauri::command]
async fn scroll_down() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create Enigo: {:?}", e))?;
    
    enigo.scroll(-1, enigo::Axis::Vertical)
        .map_err(|e| format!("Failed to scroll down: {:?}", e))?;
    
    Ok(())
}

/// 发送按键（支持组合键如 "ctrl+r"）
#[tauri::command]
async fn send_keys(key_str: String) -> Result<(), String> {
    // 标准化按键名称（与 Python 版本兼容）
    let key_str = key_str
        .replace("ARROWUP", "up")
        .replace("ARROWDOWN", "down")
        .replace("ARROWLEFT", "left")
        .replace("ARROWRIGHT", "right");
    
    let keys = parse_key(&key_str)?;
    
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create Enigo: {:?}", e))?;
    
    // 按下所有键
    for key in &keys {
        enigo.key(*key, Direction::Press)
            .map_err(|e| format!("Failed to press key: {:?}", e))?;
    }
    
    // 按相反顺序释放所有键
    for key in keys.iter().rev() {
        enigo.key(*key, Direction::Release)
            .map_err(|e| format!("Failed to release key: {:?}", e))?;
    }
    
    Ok(())
}

/// 开始语音识别（接口预留）
#[tauri::command]
async fn start_voice_recording() -> Result<String, String> {
    // TODO: 后续实现语音识别功能
    // 目前返回提示信息
    Ok("语音识别功能即将推出".to_string())
}

/// 停止语音识别（接口预留）
#[tauri::command]
async fn stop_voice_recording() -> Result<String, String> {
    // TODO: 后续实现语音识别功能
    Ok("".to_string())
}

/// 输入文本到当前聚焦的文本框
#[tauri::command]
async fn type_text(text: String) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create Enigo: {:?}", e))?;

    enigo.text(&text)
        .map_err(|e| format!("Failed to type text: {:?}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
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
        .invoke_handler(tauri::generate_handler![
            move_mouse,
            click_mouse,
            scroll_up,
            scroll_down,
            send_keys,
            start_voice_recording,
            stop_voice_recording,
            type_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
