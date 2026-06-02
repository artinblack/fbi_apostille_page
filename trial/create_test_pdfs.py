"""
Creates minimal valid PDF files for webhook testing.
Each PDF contains the correct number of /Type /Page markers so the form's
client-side page counter (regex /Type\s*\/Page\b/) would detect them correctly.
"""

def make_pdf(num_pages, filename):
    pages_kids = ' '.join(f'{i+3} 0 R' for i in range(num_pages))

    body = b'%PDF-1.4\n'
    body += b'1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'
    body += f'2 0 obj<</Type/Pages/Kids[{pages_kids}]/Count {num_pages}>>endobj\n'.encode()
    for i in range(num_pages):
        body += f'{i+3} 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents {num_pages+3+i} 0 R>>endobj\n'.encode()
    for i in range(num_pages):
        content = b'BT /F1 12 Tf 100 700 Td (Test Page) Tj ET'
        body += f'{num_pages+3+i} 0 obj<</Length {len(content)}>>stream\n'.encode()
        body += content + b'\nendstream endobj\n'

    xref_pos = len(body)
    num_objs = 1 + num_pages * 2 + 2  # catalog + pages root + N page objs + N content objs
    body += f'xref\n0 {num_objs}\n'.encode()
    body += b'0000000000 65535 f \n'
    body += b'0000000009 00000 n \n' * (num_objs - 1)
    body += f'trailer<</Size {num_objs}/Root 1 0 R>>\nstartxref\n{xref_pos}\n%%EOF\n'.encode()

    with open(filename, 'wb') as f:
        f.write(body)
    print(f"Created {filename} ({num_pages} page{'s' if num_pages > 1 else ''}, {len(body)} bytes)")

make_pdf(1, 'test_1page.pdf')
make_pdf(3, 'test_3page.pdf')
make_pdf(5, 'test_5page.pdf')
print("\nAll test PDFs created successfully.")
