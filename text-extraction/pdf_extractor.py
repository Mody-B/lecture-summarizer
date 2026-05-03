import pytesseract
from pdf2image import convert_from_path

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

POPPLER_PATH = r"C:\Users\user\Downloads\Release-25.12.0-0\poppler-25.12.0\Library\bin"

def ocr_pdf(file_path):
    images = convert_from_path(file_path, poppler_path=POPPLER_PATH, dpi=300)

    print("Total pages detected:", len(images))

    text = ""

    for i, img in enumerate(images):
        page_text = pytesseract.image_to_string(
            img,
            lang='ara',
            config='--psm 6'
        )

        print(f"Page {i+1}: {len(page_text)} chars")

        text += page_text + "\n"

    return text