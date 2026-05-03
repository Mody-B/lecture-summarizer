import re

def clean_arabic(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub('[إأآا]', 'ا', text)
    text = re.sub('ى', 'ي', text)
    text = re.sub('ؤ', 'و', text)
    text = re.sub('ئ', 'ي', text)
    return text.strip()


def split_text(text, size=500):
    return [text[i:i+size] for i in range(0, len(text), size)]