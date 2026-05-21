
const payload =
  data.pixCode ||
  data.copyPaste ||
  data.payload ||
  data.qr_code ||
  data.pixCopiaECola ||
  "";

const qrCode =
  data.qrCode ||
  data.qrcode ||
  data.qr_code_base64 ||
  data.base64 ||
  "";

await supabase
  .from("orders")
  .update({
    payment_payload: payload,
    pix_code: payload,
    qr_code_base64: qrCode,
    payment_status: "pending"
  });
