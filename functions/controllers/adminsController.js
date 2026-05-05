import { db, auth_firebase } from "../config/firebase.js";
import { transporter } from "../config/nodemailer.js";

/**
 * Lista todos os usuários com role de admin
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object[]} Lista de admins com id e dados
 */
export async function listarAdmins(req, res) {
  try {
    const snapshot = await db.collection("users").where("role", "==", "admin").get();
    const admins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(admins);
  } catch (error) {
    console.error("Erro ao listar admins:", error);
    return res.status(500).json({ message: "Erro ao listar admins." });
  }
}

/**
 * Cria um novo usuário admin no Firebase Auth e Firestore
 * Gera senha temporária e envia e-mail com credenciais
 * @param {Object} req - Objeto de requisição Express (body: nome, email)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Dados do admin criado
 */
export async function criarAdmin(req, res) {
  try {
    const { nome, email } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ message: "Campos nome e email são obrigatórios." });
    }

    const senhaTemporaria = email.split("@")[0] + "2025!";

    const userRecord = await auth_firebase.createUser({
      email,
      displayName: nome,
      password: senhaTemporaria,
    });

    await auth_firebase.setCustomUserClaims(userRecord.uid, { role: "admin" });

    await db.collection("users").doc(userRecord.uid).set({
      nome,
      email,
      role: "admin",
      createdAt: Date.now(),
      createdBy: req.user.uid,
    });

    // Enviar e-mail com credenciais temporárias
    try {
      await transporter.sendMail({
        from: `"SIGHC - Senac" <${process.env.USER_GMAIL}>`,
        to: email,
        subject: "Suas credenciais de acesso ao SIGHC",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #003366;">Bem-vindo ao SIGHC</h2>
            <p>Olá <strong>${nome}</strong>,</p>
            <p>Sua conta de administrador foi criada com sucesso. Use as credenciais abaixo para acessar o sistema:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>E-mail:</strong> ${email}</p>
              <p style="margin: 4px 0;"><strong>Senha temporária:</strong> ${senhaTemporaria}</p>
            </div>
            <p style="color: #ef4444; font-size: 14px;">⚠️ Recomendamos que altere sua senha no primeiro acesso.</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Faculdade Senac Pernambuco</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail:", emailError);
    }

    return res.status(201).json({
      uid: userRecord.uid,
      nome,
      email,
      message: "Admin cadastrado com sucesso.",
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ message: "Este e-mail já está cadastrado." });
    }
    console.error("Erro ao criar admin:", error);
    return res.status(500).json({ message: "Erro ao cadastrar admin." });
  }
}

/**
 * Atualiza os dados de um admin existente
 * Atualiza tanto no Firebase Auth quanto no Firestore
 * @param {Object} req - Objeto de requisição Express (params: id, body: nome, email)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Dados atualizados do admin
 */
export async function atualizarAdmin(req, res) {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    const docRef = db.collection("users").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().role !== "admin") {
      return res.status(404).json({ message: "Admin não encontrado." });
    }

    const updateData = {};
    if (nome) {
      updateData.nome = nome;
      await auth_firebase.updateUser(id, { displayName: nome });
    }
    if (email) {
      updateData.email = email;
      await auth_firebase.updateUser(id, { email });
    }
    updateData.atualizadoEm = new Date().toISOString();

    await docRef.update(updateData);
    return res.json({ id, ...doc.data(), ...updateData });
  } catch (error) {
    console.error("Erro ao atualizar admin:", error);
    return res.status(500).json({ message: "Erro ao atualizar admin." });
  }
}

/**
 * Deleta um admin do sistema
 * Remove tanto do Firebase Auth quanto do Firestore
 * @param {Object} req - Objeto de requisição Express (params: id)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Mensagem de confirmação
 */
export async function deletarAdmin(req, res) {
  try {
    const { id } = req.params;

    const docRef = db.collection("users").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().role !== "admin") {
      return res.status(404).json({ message: "Admin não encontrado." });
    }

    await auth_firebase.deleteUser(id);
    await docRef.delete();

    return res.json({ message: "Admin excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar admin:", error);
    return res.status(500).json({ message: "Erro ao deletar admin." });
  }
}
