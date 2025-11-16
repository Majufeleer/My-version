const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {google} = require("googleapis");
const fetch = require("node-fetch");

// Inicializa Firebase Admin SDK
admin.initializeApp();

// Configura autenticación Google Drive
const credentials = functions.config().drive.credentials;
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({version: "v3", auth});

// Configura EmailJS
const EMAILJS_SERVICE_ID = "service_uk4fvk8";
const EMAILJS_TEMPLATE_ID = "template_kylskmw";
const EMAILJS_PUBLIC_KEY = functions.config().emailjs.public_key;

// Webhook de Mercado Pago
exports.procesarPagoAprobado = functions.https.onRequest(async (req, res) => {
  try {
    const paymentData = req.body.data;
    const topic = req.body.topic;
    const paymentId = paymentData.id;

    if (topic === "payment" && paymentId) {
      const db = admin.firestore();
      const docsSnapshot = await db.collection("reservaciones")
          .where("paymentId", "==", paymentId)
          .limit(1)
          .get();

      if (docsSnapshot.empty) {
        console.log("No se encontró un documento de reservación para este pago.");
        return res.status(404).send("Documento no encontrado.");
      }

      const docData = docsSnapshot.docs[0].data();
      const userEmail = docData.email;
      const userName = docData.nombre;

      if (!userEmail) {
        console.log("Correo electrónico del cliente no encontrado.");
        return res.status(400).send("Correo del cliente es requerido.");
      }

      // Otorga acceso a Google Drive
      const folderId = "17V4YQF1sCClRKb1bxsBdMrpj6dA3Icm9";
      try {
        await drive.permissions.create({
          fileId: folderId,
          requestBody: {
            role: "reader",
            type: "user",
            emailAddress: userEmail,
          },
          fields: "id",
        });
        console.log(`Permisos de Drive otorgados a: ${userEmail}`);
      } catch (driveError) {
        console.error("Error al otorgar permisos de Google Drive:", driveError);
        return res.status(500).send("Error al otorgar permisos de Drive.");
      }

      // Envía correo de confirmación
      try {
        const templateParams = {
          to_email: userEmail,
          user_name: userName,
          drive_link: `https://drive.google.com/drive/folders/${folderId}`,
        };

        const emailResponse = await fetch(
            "https://api.emailjs.com/api/v1.0/email/send",
            {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: templateParams,
              }),
            },
        );

        const emailResult = await emailResponse.json();
        console.log("Correo de confirmación enviado:", emailResult);
      } catch (emailError) {
        console.error("Error al enviar el correo:", emailError);
        return res.status(500).send("Error al enviar el correo.");
      }

      res.status(200).send("Webhook procesado exitosamente.");
    } else {
      console.log("Notificación no procesada (no es un pago o el estado no es aprobado).");
      res.status(200).send("Notificación recibida, pero no procesada.");
    }
  } catch (error) {
    console.error("Error general en el webhook:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

