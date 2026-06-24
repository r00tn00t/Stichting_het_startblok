// De export-libraries (html-to-image, jspdf) zijn fors. We laden ze pas wanneer
// iemand daadwerkelijk exporteert (dynamische import), zodat de hoofd-bundle
// klein blijft.

// Rendert een element naar een PNG-dataURL. De `.noprint`-elementen
// (bewerk-knoppen/dropdowns) worden tijdelijk verborgen zodat het resultaat er
// schoon uitziet. Geeft { dataUrl, width, height } terug.
async function maakAfbeelding(element) {
  if (!element) throw new Error('Geen element om te exporteren');
  const { toPng } = await import('html-to-image');
  element.classList.add('exporteren');
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2, // scherp op telefoonschermen
    });
    return { dataUrl, width: element.offsetWidth, height: element.offsetHeight };
  } finally {
    element.classList.remove('exporteren');
  }
}

// Exporteer als PNG (download).
export async function exporteerNaarPng(element, bestandsnaam = 'badindeling') {
  const { dataUrl } = await maakAfbeelding(element);
  const link = document.createElement('a');
  link.download = `${bestandsnaam}.png`;
  link.href = dataUrl;
  link.click();
}

// Exporteer als PDF (download). Het rooster is meestal breed, dus liggend A4;
// de afbeelding wordt passend geschaald binnen de pagina met marge.
export async function exporteerNaarPdf(element, bestandsnaam = 'badindeling') {
  const { dataUrl, width, height } = await maakAfbeelding(element);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const paginaB = pdf.internal.pageSize.getWidth();
  const paginaH = pdf.internal.pageSize.getHeight();
  const marge = 8;
  const maxB = paginaB - marge * 2;
  const maxH = paginaH - marge * 2;
  // Schaal de afbeelding (px) passend binnen het beschikbare vlak (mm).
  const schaal = Math.min(maxB / width, maxH / height);
  const tekenB = width * schaal;
  const tekenH = height * schaal;
  pdf.addImage(dataUrl, 'PNG', (paginaB - tekenB) / 2, marge, tekenB, tekenH);
  pdf.save(`${bestandsnaam}.pdf`);
}
