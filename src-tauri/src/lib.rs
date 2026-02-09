// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::Emitter;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .menu(|app| {
            let import_item = MenuItem::with_id(app, "import_csv", "Import CSV...", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_item = PredefinedMenuItem::quit(app, None::<&str>)?;
            let file_menu = Submenu::with_items(app, "File", true, &[&import_item, &separator, &quit_item])?;
            let menu = Menu::with_items(app, &[&file_menu])?;
            Ok(menu)
        })
        .on_menu_event(|app, event| {
            if event.id() == "import_csv" {
                let _ = app.emit("menu-import-csv", ());
            }
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
