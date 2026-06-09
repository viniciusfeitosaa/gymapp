import { Link } from 'react-router-dom';
import { GymCodeIcon } from '../components/GymCodeIcon';

const LAST_UPDATED = '5 de junho de 2026';
const CONTACT_EMAIL = 'noreply@mygymcode.com';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50">
      <header className="border-b border-dark-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-dark-900 hover:opacity-80">
            <span className="w-9 h-9 rounded-lg bg-gradient-accent flex items-center justify-center text-white">
              <GymCodeIcon size={20} className="text-white" />
            </span>
            Gym Code
          </Link>
          <Link to="/login" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14 pb-16">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-dark-500 mb-8">Última atualização: {LAST_UPDATED}</p>

        <div className="prose-policy space-y-8 text-dark-700 text-sm md:text-base leading-relaxed">
          <section>
            <p>
              Esta Política de Privacidade descreve como o <strong>Gym Code</strong> («nós», «aplicativo» ou
              «plataforma»), disponível em <strong>mygymcode.com</strong> e nos aplicativos móveis, coleta, usa,
              armazena e protege informações pessoais de <strong>personal trainers</strong> e{' '}
              <strong>alunos</strong>.
            </p>
            <p className="mt-3">
              Ao utilizar o Gym Code, você concorda com as práticas descritas neste documento, em conformidade com a
              Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">1. Quem somos</h2>
            <p>
              O Gym Code é uma plataforma digital para personal trainers gerenciarem alunos, fichas de treino,
              acompanhamento e a área do aluno no celular. O responsável pelo tratamento dos dados é o titular do
              serviço Gym Code, operado em <strong>mygymcode.com</strong>.
            </p>
            <p className="mt-3">
              Contato para privacidade:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-600 font-semibold hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">2. Funcionalidades do app</h2>
            <p className="mb-3">O Gym Code oferece, entre outras:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cadastro e gestão de personal trainers e alunos</li>
              <li>Criação e distribuição de fichas de treino por dia da semana</li>
              <li>Área do aluno com código de acesso, treino do dia e registro de treinos realizados</li>
              <li>Personalização da marca do personal (logo e cores) na visão do aluno</li>
              <li>Controle de pagamento e bloqueio de acesso aos treinos do aluno</li>
              <li>Assinatura Pro via App Store (Apple) ou Google Play (Android)</li>
              <li>Compartilhamento de links de acesso por WhatsApp</li>
              <li>Registro de progresso, mensagens e histórico de atividades de treino</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">3. Dados que coletamos</h2>

            <h3 className="font-semibold text-dark-800 mt-4 mb-2">Personal trainers</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Nome, e-mail, telefone, senha (armazenada de forma criptografada)</li>
              <li>CPF/CNPJ, CREF, endereço e dados de cadastro profissional, quando informados</li>
              <li>Logo e preferências de cores da marca (white-label para alunos)</li>
              <li>Status de assinatura Pro e identificadores de compra nas lojas (Apple/Google)</li>
            </ul>

            <h3 className="font-semibold text-dark-800 mt-4 mb-2">Alunos</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Nome, código de acesso, telefone e e-mail, quando informados</li>
              <li>Data de nascimento, peso, altura e dias de treino</li>
              <li>Dia de pagamento configurado pelo personal e status de bloqueio de treino</li>
              <li>Registros de treinos realizados, progresso e interações no app</li>
            </ul>

            <h3 className="font-semibold text-dark-800 mt-4 mb-2">Dados técnicos</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Token de sessão (login) armazenado localmente no dispositivo</li>
              <li>Logs de acesso, endereço IP e dados de uso para segurança e melhoria do serviço</li>
              <li>Informações enviadas pelas lojas de aplicativos para validação de assinaturas</li>
            </ul>

            <p className="mt-3">
              <strong>Não coletamos</strong> dados de cartão de crédito ou débito. Pagamentos da assinatura Pro são
              processados exclusivamente pela <strong>Apple</strong> ou <strong>Google</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">4. Como usamos os dados</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Autenticar personal trainers e alunos</li>
              <li>Exibir treinos, perfis e funcionalidades contratadas</li>
              <li>Personalizar a experiência do aluno com a marca do personal</li>
              <li>Gerenciar planos gratuito e Pro, limites de alunos e assinaturas</li>
              <li>Permitir bloqueio/liberação de acesso aos treinos conforme regras do personal</li>
              <li>Enviar comunicações operacionais (ex.: recuperação de senha por e-mail)</li>
              <li>Prevenir fraudes, abusos e garantir a segurança da plataforma</li>
              <li>Cumprir obrigações legais e responder a solicitações de autoridades, quando aplicável</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">5. Compartilhamento de dados</h2>
            <p className="mb-3">Podemos compartilhar dados apenas quando necessário:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Apple e Google:</strong> para processamento e validação de assinaturas in-app
              </li>
              <li>
                <strong>Provedores de infraestrutura:</strong> hospedagem, e-mail e serviços técnicos que operam sob
                contrato e confidencialidade
              </li>
              <li>
                <strong>Personal trainer ↔ aluno:</strong> dados do aluno são acessíveis ao personal responsável por
                aquele cadastro; dados do personal (nome, logo, contato) são exibidos ao aluno vinculado
              </li>
              <li>
                <strong>Obrigação legal:</strong> quando exigido por lei, ordem judicial ou autoridade competente
              </li>
            </ul>
            <p className="mt-3">Não vendemos dados pessoais a terceiros.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">6. Armazenamento e segurança</h2>
            <p>
              Os dados são armazenados em servidores seguros, com medidas técnicas e organizacionais como criptografia
              de senhas, controle de acesso, HTTPS e backups. Nenhum sistema é 100% invulnerável; em caso de incidente
              relevante, adotaremos medidas de mitigação e comunicação conforme a legislação aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">7. Retenção dos dados</h2>
            <p>
              Mantemos os dados enquanto a conta estiver ativa ou enquanto necessário para prestar o serviço, cumprir
              obrigações legais ou resolver disputas. Personal trainers e alunos podem solicitar exclusão da conta;
              alguns registros podem ser mantidos por período legal mínimo quando exigido.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">8. Seus direitos (LGPD)</h2>
            <p className="mb-3">Você pode solicitar, conforme a LGPD:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Confirmação e acesso aos dados</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade, quando aplicável</li>
              <li>Revogação do consentimento e informações sobre compartilhamento</li>
            </ul>
            <p className="mt-3">
              Envie solicitações para{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-600 font-semibold hover:underline">
                {CONTACT_EMAIL}
              </a>
              . O personal trainer pode excluir alunos; alunos podem excluir a própria conta nas configurações do
              perfil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">9. Crianças e adolescentes</h2>
            <p>
              O Gym Code é destinado a personal trainers e seus alunos. O cadastro de menores deve ser feito com
              responsabilidade do personal trainer e, quando aplicável, com consentimento dos pais ou responsáveis
              legais. Não coletamos intencionalmente dados de crianças sem supervisão adequada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">10. Cookies e armazenamento local</h2>
            <p>
              Utilizamos armazenamento local do navegador (localStorage) para manter sua sessão autenticada. Não
              utilizamos cookies de rastreamento publicitário de terceiros no aplicativo principal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">11. Assinaturas e pagamentos</h2>
            <p>
              A assinatura <strong>Gym Code Pro</strong> é contratada nas lojas oficiais (App Store ou Google Play).
              Renovação, cancelamento, reembolsos e faturamento seguem as políticas da Apple ou Google. Para cancelar,
              use as configurações de assinatura do seu dispositivo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">12. Alterações nesta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. A data da última revisão será indicada no topo da página.
              Alterações relevantes poderão ser comunicadas no app ou por e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">13. Contato</h2>
            <p>
              Dúvidas sobre privacidade:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-600 font-semibold hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-3">
              Site:{' '}
              <a href="https://mygymcode.com" className="text-accent-600 font-semibold hover:underline">
                https://mygymcode.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-100 flex flex-wrap gap-4 text-sm">
          <Link to="/" className="text-accent-600 font-semibold hover:underline">
            Voltar ao início
          </Link>
          <Link to="/login" className="text-dark-600 font-semibold hover:underline">
            Entrar no app
          </Link>
        </div>
      </main>
    </div>
  );
}
