import nodemailer from 'nodemailer';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Create transporter
const createTransporter = () => {
    if (isDevelopment) {
        // In development, we'll just log to console
        return null;
    }

    // In production, use real SMTP settings
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name
 */
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const emailContent = {
        from: process.env.SMTP_FROM || 'noreply@moviequiz.com',
        to: email,
        subject: 'Сброс пароля - Movie Quiz',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #455EBC;">Сброс пароля</h2>
                <p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>
                <p>Вы запросили сброс пароля для вашего аккаунта Movie Quiz.</p>
                <p>Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
                <div style="margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #455EBC; 
                              color: white; 
                              padding: 12px 30px; 
                              text-decoration: none; 
                              border-radius: 6px;
                              display: inline-block;">
                        Сбросить пароль
                    </a>
                </div>
                <p>Или скопируйте эту ссылку в браузер:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    Эта ссылка действительна в течение 1 часа.<br>
                    Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
                </p>
            </div>
        `,
        text: `
Сброс пароля - Movie Quiz

Здравствуйте${userName ? `, ${userName}` : ''}!

Вы запросили сброс пароля для вашего аккаунта Movie Quiz.

Перейдите по ссылке ниже, чтобы создать новый пароль:
${resetUrl}

Эта ссылка действительна в течение 1 часа.
Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        `,
    };

    if (isDevelopment) {
        // In development, log to console instead of sending email
        console.log('\n' + '='.repeat(80));
        console.log('📧 PASSWORD RESET EMAIL (Development Mode)');
        console.log('='.repeat(80));
        console.log(`To: ${email}`);
        console.log(`Subject: ${emailContent.subject}`);
        console.log('\n🔗 Reset Link:');
        console.log(`   ${resetUrl}`);
        console.log('\n' + '='.repeat(80) + '\n');
        return { success: true, mode: 'development' };
    }

    // In production, send actual email
    try {
        const transporter = createTransporter();
        await transporter.sendMail(emailContent);
        return { success: true, mode: 'production' };
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send password reset email');
    }
};
