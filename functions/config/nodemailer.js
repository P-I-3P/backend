
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Carrega variáveis de ambiente (USER_GMAIL e PASSWORD_GMAIL)
dotenv.config();

/**
 * Configuração do transportador de e-mail utilizando Nodemailer.
 * Utiliza o serviço Gmail com credenciais armazenadas em variáveis de ambiente.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_GMAIL,   
    pass: process.env.PASSWORD_GMAIL
  }
});

/**
 * Verifica se a conexão com o servidor de e-mail está ativa na inicialização.
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('Erro no transporter do Nodemailer:', error);
  } else {
    // Conexão bem-sucedida, o servidor está pronto para disparar e-mails transacionais
    // console.log('Servidor de e-mail pronto para enviar mensagens');
  }
});


export  { transporter } ;