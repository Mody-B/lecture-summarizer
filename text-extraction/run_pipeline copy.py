from pdf_extractor import ocr_pdf
from data_pipeline import clean_arabic, split_text
import json

# 1. path to your biology PDF
pdf_path = r"C:\Users\user\lecture-summarizer\bac-books\12-science.pdf"

print("🔄 Extracting text...")
raw_text = ocr_pdf(pdf_path)

print("🧹 Cleaning text...")
cleaned = clean_arabic(raw_text)

print("✂️ Splitting text...")
chunks = split_text(cleaned, size=500)

print(f"✅ Done! Total chunks: {len(chunks)}")

# 4. Save result
output_file = "science_chunks.json"

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print(f"💾 Saved to {output_file}")