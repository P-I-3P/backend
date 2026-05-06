
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

/**
 * Configuração do transportador Nodemailer para envio de e-mails via Gmail.
 * Utiliza variáveis de ambiente para credenciais sensíveis.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_GMAIL,   
    pass: process.env.PASSWORD_GMAIL
  }
});

/**
 * Verifica a conexão com o servidor de e-mail na inicialização.
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('Erro no transporter do Nodemailer:', error);
  } else {
    // console.log('Servidor de e-mail pronto para enviar mensagens');
  }
});


export { transporter };