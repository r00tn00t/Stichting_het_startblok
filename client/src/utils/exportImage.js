import { toPng } from 'html-to-image';

// Zet een DOM-element om naar een PNG en download het. De `.noprint`-elementen
// (bewerk-knoppen/dropdowns) worden tijdelijk verborgen zodat de afbeelding er
// schoon uitziet voor de groepsapp.
export async function exporteerNaarPng(element, bestandsnaam = 'badindeling') {
  if (!element) throw new Error('Geen element om te exporteren');

  element.classList.add('exporteren');
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2, // scherp op telefoonschermen
    });
    const link = document.createElement('a');
    link.download = `${bestandsnaam}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    element.classList.remove('exporteren');
  }
}
