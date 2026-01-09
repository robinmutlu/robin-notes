// Brevo API Email Service

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Send email via Brevo API
const sendEmail = async ({ to, toName, subject, htmlContent }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@robinnotes.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Robin Notes';

    if (!apiKey) {
        console.error('BREVO_API_KEY is not configured');
        throw new Error('E-posta servisi yapılandırılmamış');
    }

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: senderName,
                email: senderEmail
            },
            to: [{ email: to, name: toName || to }],
            subject,
            htmlContent
        })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Brevo API Error:', error);
        throw new Error('E-posta gönderilemedi');
    }

    const data = await response.json();
    console.log(`Email sent to ${to}, messageId: ${data.messageId}`);
    return data;
};

// Professional Email Template Base
const getEmailTemplate = (title, content, buttonText, buttonUrl, buttonColor = '#6366f1') => {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title} - Robin Notes</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 30px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 12px 24px; border-radius: 12px;">
                                        <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 1px;">ROBIN NOTES</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                                <!-- Card Content -->
                                <tr>
                                    <td style="padding: 48px 40px;">
                                        ${content}
                                        
                                        <!-- Button -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${buttonUrl}" style="display: inline-block; padding: 16px 48px; background-color: ${buttonColor}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background 0.3s;">
                                                        ${buttonText}
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Link Fallback -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                                            <tr>
                                                <td align="center">
                                                    <p style="font-size: 13px; color: #a0a0a0; margin: 0;">
                                                        Buton çalışmıyorsa, linki tarayıcınıza kopyalayın:<br>
                                                        <a href="${buttonUrl}" style="color: #6366f1; word-break: break-all;">${buttonUrl}</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 0; text-align: center;">
                            <p style="font-size: 13px; color: #8c8c8c; margin: 0 0 8px;">
                                Bu e-posta Robin Notes tarafından otomatik olarak gönderilmiştir.
                            </p>
                            <p style="font-size: 12px; color: #b0b0b0; margin: 0;">
                                &copy; 2024 Robin Notes. Tüm hakları saklıdır.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

// Password Reset Template
const getPasswordResetTemplate = (userName, resetUrl) => {
    const content = `
        <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px; text-align: center;">
            Şifre Sıfırlama Talebi
        </h1>
        <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 16px; text-align: center;">
            Merhaba <strong>${userName}</strong>,
        </p>
        <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 8px; text-align: center;">
            Hesabınız için şifre sıfırlama talebinde bulundunuz.
            Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
        </p>
        <div style="background-color: #fef3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px; margin-top: 24px;">
            <p style="font-size: 14px; color: #856404; margin: 0;">
                <strong>Önemli:</strong> Bu link 1 saat içinde geçersiz olacaktır.
                Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
        </div>
    `;

    return getEmailTemplate('Şifre Sıfırlama', content, 'Şifremi Sıfırla', resetUrl, '#6366f1');
};

// Email Verification Template
const getEmailVerificationTemplate = (userName, verifyUrl) => {
    const content = `
        <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px; text-align: center;">
            Hesabınızı Doğrulayın
        </h1>
        <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 16px; text-align: center;">
            Merhaba <strong>${userName}</strong>,
        </p>
        <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 8px; text-align: center;">
            Robin Notes'a hoşgeldiniz! Hesabınızı aktive etmek için
            aşağıdaki butona tıklayın.
        </p>
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 16px; border-radius: 8px; margin-top: 24px;">
            <p style="font-size: 14px; color: #155724; margin: 0;">
                <strong>Bilgi:</strong> Bu link 24 saat boyunca geçerlidir.
                Hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
        </div>
    `;

    return getEmailTemplate('Email Doğrulama', content, 'Email Adresimi Doğrula', verifyUrl, '#10b981');
};

// Send password reset email
export const sendPasswordResetEmail = async (email, userName, resetToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendEmail({
        to: email,
        toName: userName,
        subject: 'Şifre Sıfırlama Talebi - Robin Notes',
        htmlContent: getPasswordResetTemplate(userName, resetUrl)
    });

    return true;
};

// Send email verification email
export const sendVerificationEmail = async (email, userName, verificationToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    await sendEmail({
        to: email,
        toName: userName,
        subject: 'Hesabınızı Doğrulayın - Robin Notes',
        htmlContent: getEmailVerificationTemplate(userName, verifyUrl)
    });

    return true;
};

export default { sendPasswordResetEmail, sendVerificationEmail };
