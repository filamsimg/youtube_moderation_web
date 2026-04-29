from huggingface_hub import HfApi
import os

# --- KONFIGURASI ---
# Ganti dengan username Hugging Face kamu
USERNAME = "filamss" 
REPO_NAME = "bert-judol-indonesia"
MODEL_FOLDER = os.path.join(os.path.dirname(__file__), "..", "model_judol_indobertweet")
# -------------------

api = HfApi()

print(f"Sedang membuat repository: {USERNAME}/{REPO_NAME}...")
try:
    api.create_repo(repo_id=f"{USERNAME}/{REPO_NAME}", repo_type="model", exist_ok=True)
    print("Repository siap.")
except Exception as e:
    print(f"Catatan: {e}")

print(f"Mulai upload folder: {MODEL_FOLDER}")
print("Proses ini akan memakan waktu beberapa menit tergantung kecepatan internet kamu...")

try:
    api.upload_folder(
        folder_path=MODEL_FOLDER,
        repo_id=f"{USERNAME}/{REPO_NAME}",
        repo_type="model",
    )
    print("\n✅ BERHASIL! Model kamu sudah ter-upload ke Hugging Face.")
    print(f"URL: https://huggingface.co/{USERNAME}/{REPO_NAME}")
except Exception as e:
    print(f"\n❌ GAGAL: {e}")
