import os

# Struktur folder dan file
structure = {
    "bot": {
        "handlers": [
            "messageHandler.js",
            "buttonHandler.js",
            "formHandler.js"
        ],
        "services": [
            "orderService.js",
            "driverService.js",
            "queueService.js",
            "notificationService.js"
        ],
        "models": [
            "Order.js",
            "Driver.js",
            "Queue.js"
        ],
        "utils": [
            "validator.js",
            "formatter.js"
        ],
    }
}

# Fungsi untuk membuat folder dan file
def create_structure(base_path, structure):
    for folder, content in structure.items():
        folder_path = os.path.join(base_path, folder)
        os.makedirs(folder_path, exist_ok=True)

        for subfolder, files in content.items():
            subfolder_path = os.path.join(folder_path, subfolder)
            os.makedirs(subfolder_path, exist_ok=True)

            for file in files:
                file_path = os.path.join(subfolder_path, file)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(f"// {file} — created automatically\n")

        # Buat file app.js di dalam folder 'bot'
        app_path = os.path.join(folder_path, "app.js")
        if not os.path.exists(app_path):
            with open(app_path, "w", encoding="utf-8") as f:
                f.write("// app.js — main entry point\n")

# Jalankan pembuatan struktur di direktori saat ini
if __name__ == "__main__":
    base_dir = os.getcwd()  # folder tempat skrip dijalankan
    create_structure(base_dir, structure)
    print("✅ Struktur folder dan file berhasil dibuat.")
