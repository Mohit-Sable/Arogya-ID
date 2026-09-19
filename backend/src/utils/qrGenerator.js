import QRCode from 'qrcode';

/**
 * Generate a QR code data URL (base64 PNG) for a given Health ID.
 * The QR encodes a JSON payload with the health ID and an emergency URL.
 */
export const generateQRDataUrl = async (healthId, emergencyData = {}) => {
  const payload = JSON.stringify({
    healthId,
    emergencyUrl: `/emergency/${healthId}`,
    ...emergencyData,
  });

  const dataUrl = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return dataUrl;
};

/**
 * Generate a QR code as a buffer (PNG).
 */
export const generateQRBuffer = async (healthId) => {
  const payload = JSON.stringify({
    healthId,
    emergencyUrl: `/emergency/${healthId}`,
  });

  return QRCode.toBuffer(payload, { width: 300, margin: 2 });
};
