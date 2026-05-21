
pixTextarea.value =
  order.payment_payload ||
  order.pix_code ||
  "";

if(order.qr_code_base64){
   qrImg.src = order.qr_code_base64.startsWith("data:")
      ? order.qr_code_base64
      : `data:image/png;base64,${order.qr_code_base64}`;
}
