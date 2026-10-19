import os
import json
from google import genai
from django.shortcuts import render
from django.http import JsonResponse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env_path = os.path.join(BASE_DIR, '.env')

api_key = ""
try:
    with open(env_path, 'r', encoding='utf-8') as file:
        for line in file:
            if 'API_KEY' in line and '=' in line:
                api_key = line.split('=', 1)[1].strip().replace('"', '').replace("'", "")
                break
except Exception as e:
    print(f"--- DEBUG: File Read Error: {e} ---")

print(f"--- DEBUG: Looking for .env at: {env_path} ---")
print(f"--- DEBUG: API Key Loaded: {'YES' if api_key else 'NO'} ---")

def index(request):
    return render(request, 'assistant/index.html')

def generate_response(request):
    if request.method == 'POST':
        if not api_key:
            return JsonResponse({'error': 'API Key is still missing! Ensure you pasted your actual key into the file.'}, status=500)
            
        try:
            data = json.loads(request.body)
            prompt = data.get('prompt')
            
            client = genai.Client(api_key=api_key)

            response = client.models.generate_content(
                model='gemini-3.8-flash',
                contents=prompt
            )
            
            return JsonResponse({'response': response.text})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request.'}, status=400)