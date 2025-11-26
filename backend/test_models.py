"""
Script para testar modelos disponíveis na API Gemini.
Execute dentro do container do backend.
"""
import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY não configurada!")
    exit(1)

genai.configure(api_key=api_key)

# Listar modelos disponíveis
print("Listando modelos disponíveis...")
try:
    models = genai.list_models()
    print("\nModelos disponíveis:")
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"  - {model.name}")
except Exception as e:
    print(f"Erro ao listar modelos: {e}")

# Testar modelos comuns
test_models = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "models/gemini-pro",
    "models/gemini-1.5-pro",
    "models/gemini-1.5-flash",
]

print("\n\nTestando modelos específicos:")
for model_name in test_models:
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Teste")
        print(f"✅ {model_name} - FUNCIONA")
    except Exception as e:
        print(f"❌ {model_name} - ERRO: {str(e)[:100]}")

