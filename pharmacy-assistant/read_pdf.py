import pypdf
import sys
import json

pdf_path = r"C:\Users\mathe\AppData\Local\Temp\antigravity-media-cache\media__1783740281299.pdf"
# Try checking the path in brain directory
import os
alt_path = r"C:\Users\mathe\.gemini\antigravity-ide\brain\3a2e4c4f-1e09-45af-8954-11fda7a13579\media__1783740281299.pdf"
if os.path.exists(alt_path):
    pdf_path = alt_path

print(f"Reading PDF from: {pdf_path}")
reader = pypdf.PdfReader(pdf_path)
print(f"Total pages: {len(reader.pages)}")

# Print text of all pages
for idx, page in enumerate(reader.pages):
    print(f"\n--- PAGE {idx+1} ---")
    text = page.extract_text()
    print(text)
