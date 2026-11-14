import gradio as gr
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import pillow_heif
import timm
import spaces 

pillow_heif.register_heif_opener()

class_names = [
    "Aljabbar", "Asrama", "GKU 1", "GKU 2", "GKU3", 
    "GSG", "KOICA", "Labtek Baru", "Rektorat", "Transformer"
]

class SingleEVAModel(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.backbone = timm.create_model(
            "eva02_base_patch14_224", 
            pretrained=False, 
            num_classes=num_classes 
        )
    def forward(self, x):
        return self.backbone(x)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu") 
model = SingleEVAModel(num_classes=10)

try:
    model.load_state_dict(torch.load("best_eva02_model.pth", map_location=device, weights_only=True))
    model.to(device)
    model.eval()
except Exception as e:
    print(f"Error loading model weights: {e}")
    print("Pastikan file 'best_eva02_model.pth' sudah diunggah.")

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
IMG_SIZE = 224

transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
])

@spaces.GPU
def predict(image):
    if image is None:
        return "Gambar tidak valid"
    
    image = image.convert("RGB")
    
    img_t = transform(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(img_t)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
    
    result = {class_names[i]: float(probabilities[i]) for i in range(10)}
    return result

interface = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="pil", label="Unggah Gambar Bangunan (JPG/PNG/HEIC)"),
    outputs=gr.Label(num_top_classes=3, label="Hasil Prediksi"),
    title="Klasifikasi Gedung Dataset Transdik",
    description="Unggah gambar bangunan untuk memprediksi kelasnya menggunakan model EVA-02 Base.",
)

if __name__ == "__main__":
    interface.launch()