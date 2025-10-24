#!/usr/bin/env python3
"""
Script de debug para testar o endpoint /process-complete
"""

import requests
import json

def test_process_complete():
    """Testa o endpoint /process-complete com o PDF de teste"""
    try:
        # URL do endpoint
        url = "http://localhost:8000/api/v1/pdf/process-complete"
        
        # Ler o arquivo PDF de teste
        pdf_path = "/tmp/nota_fiscal_teste.pdf"
        
        print(f"Testando endpoint: {url}")
        print(f"Arquivo PDF: {pdf_path}")
        
        with open(pdf_path, "rb") as f:
            files = {"file": ("nota_fiscal_teste.pdf", f, "application/pdf")}
            
            print("Enviando requisição...")
            response = requests.post(url, files=files, timeout=60)
            
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            try:
                result = response.json()
                print(f"Response JSON: {json.dumps(result, indent=2, ensure_ascii=False)}")
            except:
                print(f"Response Text: {response.text}")
        
    except Exception as e:
        print(f"ERRO: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_process_complete()