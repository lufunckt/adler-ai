import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BrainCircuit,
  Lock,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import {
  DEMO_CREDENTIALS,
  loginWithCredentials,
  registerWithCredentials,
  type AuthSession
} from "../lib/auth";

type AuthScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session =
        mode === "login"
          ? await loginWithCredentials(email, password)
          : await registerWithCredentials(name, email, password);
      onAuthenticated(session);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Nao foi possivel autenticar agora."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoAccess() {
    setError("");
    setIsSubmitting(true);

    try {
      const session = await loginWithCredentials(
        DEMO_CREDENTIALS.email,
        DEMO_CREDENTIALS.password
      );
      onAuthenticated(session);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Nao foi possivel abrir a demonstracao."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_520px]">
        <section className="flex items-center px-8 py-10 lg:px-14">
          <div className="mx-auto w-full max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/12 text-rose-300">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/45">
                  Adler AI
                </p>
                <p className="text-sm font-semibold text-white">Acesso clinico</p>
              </div>
            </div>

            <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Entre no Adler com uma conta compartilhavel e teste o fluxo clinico real.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">
              Use a conta de avaliacao para gravar uma sessao, rodar a analise e
              revisar o workspace sem depender de setup tecnico do outro lado.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <FeaturePill
                icon={ShieldCheck}
                title="Conta real"
                text="Login com sessao valida no backend."
              />
              <FeaturePill
                icon={Lock}
                title="Teste guiado"
                text="Acesso pronto para avaliacao hoje."
              />
              <FeaturePill
                icon={UserPlus}
                title="Cadastro aberto"
                text="Criacao de conta liberada no app."
              />
            </div>
          </div>
        </section>

        <section className="flex items-center border-t border-white/8 bg-[#101319] px-6 py-10 lg:border-l lg:border-t-0 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[32px] border border-white/8 bg-black/14 p-6 shadow-2xl shadow-black/20">
              <div className="grid grid-cols-2 gap-2 rounded-full border border-white/8 bg-black/14 p-1">
                {[
                  { id: "login", label: "Entrar" },
                  { id: "register", label: "Criar conta" }
                ].map((item) => {
                  const active = mode === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMode(item.id as "login" | "register");
                        setError("");
                      }}
                      className="rounded-full px-4 py-2.5 text-sm font-semibold transition"
                      style={{
                        backgroundColor: active ? "rgba(244,63,94,0.18)" : "transparent",
                        color: active ? "#ffffff" : "rgba(255,255,255,0.58)"
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "register" ? (
                  <Field
                    autoComplete="name"
                    label="Nome"
                    name="name"
                    onChange={setName}
                    placeholder="Seu nome profissional"
                    required
                    value={name}
                  />
                ) : null}

                <Field
                  autoComplete="email"
                  label="Email"
                  name="email"
                  onChange={setEmail}
                  placeholder="voce@clinica.com"
                  required
                  type="email"
                  value={email}
                />

                <Field
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  label="Senha"
                  name="password"
                  onChange={setPassword}
                  placeholder="Minimo de 6 caracteres"
                  required
                  type="password"
                  value={password}
                />

                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    "Entrando..."
                  ) : mode === "login" ? (
                    <>
                      Entrar no Adler <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Criar acesso <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">
                      Demonstracao
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Conta compartilhavel para avaliacao
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoAccess}
                    disabled={isSubmitting}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Usar demo
                  </button>
                </div>

                <div className="mt-4 space-y-2 font-mono text-xs text-white/62">
                  <p>Email: {DEMO_CREDENTIALS.email}</p>
                  <p>Senha: {DEMO_CREDENTIALS.password}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  autoComplete,
  label,
  name,
  onChange,
  placeholder,
  required,
  type = "text",
  value
}: {
  autoComplete?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/42">
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        name={name}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-white/8 bg-[#090b10] px-4 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-rose-300/40"
      />
    </label>
  );
}

function FeaturePill({
  icon: Icon,
  text,
  title
}: {
  icon: typeof BrainCircuit;
  text: string;
  title: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-rose-300">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/56">{text}</p>
    </div>
  );
}
