import { Link } from 'react-router-dom';
import { GymCodeIcon } from '../components/GymCodeIcon';
import { PRIVACY_POLICY_URL } from '../lib/legalUrls';

const LAST_UPDATED = '8 de junho de 2026';
const CONTACT_EMAIL = 'noreply@mygymcode.com';

export default function TermsOfUsePage() {
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
          Termos de Uso
        </h1>
        <p className="text-sm text-dark-500 mb-8">Última atualização: {LAST_UPDATED}</p>

        <div className="space-y-8 text-dark-700 text-sm md:text-base leading-relaxed">
          <section>
            <p>
              Estes Termos de Uso («Termos») regem o uso do aplicativo e serviço <strong>Gym Code</strong>,
              disponível em mygymcode.com e nas lojas de aplicativos. Ao criar uma conta ou utilizar o
              serviço, você concorda com estes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">1. O serviço</h2>
            <p>
              O Gym Code é uma plataforma para personal trainers gerenciarem alunos, fichas de treino e
              a área do aluno. Alunos acessam treinos por código de acesso fornecido pelo personal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">2. Contas</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Personal trainers cadastram-se com e-mail e senha.</li>
              <li>Alunos acessam com código de 5 caracteres fornecido pelo personal.</li>
              <li>Você é responsável por manter suas credenciais em sigilo.</li>
              <li>
                Você pode <strong>excluir sua conta permanentemente</strong> a qualquer momento em{' '}
                <strong>Perfil → Excluir conta</strong> no aplicativo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">3. Planos e assinatura Pro</h2>
            <p className="mb-3">
              <strong>Plano gratuito:</strong> até 2 alunos cadastrados.
            </p>
            <p className="mb-3">
              <strong>Gym Code Pro Mensal:</strong> assinatura auto-renovável com cobrança mensal
              processada pela Apple App Store ou Google Play, conforme a plataforma utilizada.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A renovação é automática até que você cancele nas configurações da loja.</li>
              <li>O preço vigente é exibido na loja no momento da compra.</li>
              <li>Não há reembolso proporcional pelo período não utilizado, salvo exigência legal ou política da loja.</li>
              <li>Ao cancelar, o acesso Pro permanece até o fim do período já pago.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">4. Uso aceitável</h2>
            <p>Você concorda em não utilizar o Gym Code para fins ilegais, abusivos ou que violem direitos de terceiros. O personal é responsável pelos dados e orientações fornecidos aos seus alunos.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">5. Propriedade intelectual</h2>
            <p>O Gym Code, sua marca, interface e software são de propriedade do titular do serviço. Conteúdos criados por você (treinos, logos) permanecem seus.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">6. Privacidade</h2>
            <p>
              O tratamento de dados pessoais é descrito na{' '}
              <a href={PRIVACY_POLICY_URL} className="text-accent-600 font-semibold hover:underline">
                Política de Privacidade
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">7. Limitação de responsabilidade</h2>
            <p>
              O Gym Code é uma ferramenta de gestão e acompanhamento. Não substitui orientação médica ou avaliação presencial. O serviço é fornecido «como está», dentro dos limites permitidos pela lei aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">8. Alterações</h2>
            <p>Podemos atualizar estes Termos. A data da última revisão será indicada no topo desta página.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-dark-900 mb-3">9. Contato</h2>
            <p>
              Dúvidas:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-600 font-semibold hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-100 flex flex-wrap gap-4 text-sm">
          <Link to="/privacidade" className="text-accent-600 font-semibold hover:underline">
            Política de Privacidade
          </Link>
          <Link to="/" className="text-dark-600 font-semibold hover:underline">
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
