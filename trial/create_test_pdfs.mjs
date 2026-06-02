import { writeFileSync } from 'fs';

function makePdf(numPages, filename) {
  const kids = Array.from({ length: numPages }, (_, i) => `${i + 3} 0 R`).join(' ');

  let body = '%PDF-1.4\n';
  body += '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n';
  body += `2 0 obj<</Type/Pages/Kids[${kids}]/Count ${numPages}>>endobj\n`;
  for (let i = 0; i < numPages; i++) {
    body += `${i + 3} 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n`;
  }
  const xrefPos = Buffer.byteLength(body, 'utf8');
  const numObjs = numPages + 3;
  body += `xref\n0 ${numObjs}\n`;
  body += '0000000000 65535 f \n';
  body += '0000000009 00000 n \n'.repeat(numObjs - 1);
  body += `trailer<</Size ${numObjs}/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`;

  writeFileSync(filename, body, 'utf8');
  console.log(`Created ${filename} (${numPages} page${numPages > 1 ? 's' : ''}, ${Buffer.byteLength(body)} bytes)`);
}

makePdf(1, 'test_1page.pdf');
makePdf(3, 'test_3page.pdf');
makePdf(5, 'test_5page.pdf');
console.log('\nAll test PDFs created.');
