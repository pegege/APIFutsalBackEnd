const nodemailer = require('nodemailer');

// Crear transportador de correos
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para enviar email de nuevo partido
async function sendNewMatchEmail(match) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ALERT_EMAIL,
        subject: `Nuevo partido: ${match.homeTeam} vs ${match.awayTeam}`,
        text: `🏆 Partido nuevo registrado\n\n${match.homeTeam} vs ${match.awayTeam}\nResultado: ${match.score}\nFecha: ${match.date}\nCompetición: ${match.competition}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado para: ${match.homeTeam} vs ${match.awayTeam}`);
    } catch (error) {
        console.error('❌ Error enviando email:', error);
    }
}

module.exports = { sendNewMatchEmail };
