import os
import re

pages_dir = r'c:\Users\dharineesh.v\OneDrive - IDP Education Ltd\Documents\E-Commerce App\CloudBasket-Frontend\pages'

css_pattern = re.compile(r'\s*<link rel="stylesheet" href=".*?/css/chatbot\.css">', re.IGNORECASE)
script_pattern = re.compile(r'\s*<script src=".*?/js/components/chatbot\.js"></script>', re.IGNORECASE)

for root, dirs, files in os.walk(pages_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = css_pattern.sub('', content)
            new_content = script_pattern.sub('', new_content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {file}')
print('Done!')
