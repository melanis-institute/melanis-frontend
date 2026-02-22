import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Calendar,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

type AuthStep = "PHONE" | "OTP" | "PIN" | "PROFILE" | "IDENTITY" | "EMAIL";
type ProfileType = "SELF" | "CHILD" | "RELATIVE";

interface PhoneStepProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

interface OtpStepProps {
  otp: string[];
  setOtp: (value: string[]) => void;
  phoneNumber: string;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

interface PinStepProps {
  pin: string[];
  setPin: (value: string[]) => void;
  onNext: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

interface ProfileStepProps {
  selectedProfile: ProfileType | null;
  onNext: (profile: ProfileType) => void;
}

interface IdentityStepProps {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationshipLabel: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setDateOfBirth: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

interface EmailStepProps {
  firstName: string;
  lastName: string;
  relationshipLabel: string;
  email: string;
  setEmail: (value: string) => void;
  onFinish: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

interface ValueItemProps {
  icon: LucideIcon;
  text: string;
}

interface ProfileCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  selected?: boolean;
  onClick: () => void;
}

export default function AU01() {
  const [step, setStep] = useState<AuthStep>("PHONE");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(
    null
  );
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const relationshipLabel =
    selectedProfile === "CHILD"
      ? "Mon enfant"
      : selectedProfile === "RELATIVE"
        ? "Un proche"
        : "Moi-même";

  // Mock navigation delay
  const handleNext = (nextStep: AuthStep, delay = 800) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(nextStep);
    }, delay);
  };

  const handleFinish = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-[#FEF0D5] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-10">
      <div
        className="mx-auto w-full max-w-[1220px] overflow-hidden rounded-[38px] bg-white lg:rounded-[48px]"
        style={{ boxShadow: "0 24px 60px rgba(59, 28, 11, 0.12)" }}
      >
        <div className="flex min-h-[calc(100vh-2rem)] lg:min-h-[760px] xl:min-h-[820px]">
          {/* Left Side - Image (Desktop) */}
          <div className="relative hidden w-[50.5%] overflow-hidden bg-[#111214] lg:block">
            <img
              src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=1200&auto=format&fit=crop"
              alt="Médecin accueillant une patiente"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <Link
              to="/"
              className="absolute left-10 top-10 text-[44px] text-white transition-opacity hover:opacity-85"
              style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              melanis
            </Link>

            <div className="absolute bottom-10 left-10 right-10 text-white">
              <h2
                className="max-w-[320px] text-[64px] leading-[1.05]"
                style={{ fontWeight: 500, letterSpacing: "-0.03em" }}
              >
                Votre santé,
                <br />
                votre priorité.
              </h2>
              <p
                className="mt-5 max-w-[460px] text-[33px] leading-[1.5] text-white/75"
                style={{ fontWeight: 400 }}
              >
                Rejoignez la première communauté de soins dermatologiques dédiée
                aux peaux noires et métissées.
              </p>
            </div>
          </div>

          {/* Right Side - Dynamic Form Area */}
          <div className="relative w-full overflow-y-auto lg:w-[49.5%]">
            <div className="mx-auto w-full max-w-[620px] px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10 lg:px-14 lg:pb-14 lg:pt-14">
              <AnimatePresence mode="wait">
                {step === "PHONE" && (
                  <PhoneStep
                    key="phone"
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    onNext={() => handleNext("OTP")}
                    isLoading={isLoading}
                  />
                )}
                {step === "OTP" && (
                  <OtpStep
                    key="otp"
                    otp={otp}
                    setOtp={setOtp}
                    phoneNumber={phoneNumber}
                    onBack={() => setStep("PHONE")}
                    onNext={() => handleNext("PIN")}
                    isLoading={isLoading}
                  />
                )}
                {step === "PIN" && (
                  <PinStep
                    key="pin"
                    pin={pin}
                    setPin={setPin}
                    onNext={() => handleNext("PROFILE")}
                    onSkip={() => handleNext("PROFILE", 200)}
                    isLoading={isLoading}
                  />
                )}
                {step === "PROFILE" && (
                  <ProfileStep
                    key="profile"
                    selectedProfile={selectedProfile}
                    onNext={(profile) => {
                      setSelectedProfile(profile);
                      handleNext("IDENTITY", 320);
                    }}
                  />
                )}
                {step === "IDENTITY" && (
                  <IdentityStep
                    key="identity"
                    firstName={firstName}
                    lastName={lastName}
                    dateOfBirth={dateOfBirth}
                    relationshipLabel={relationshipLabel}
                    setFirstName={setFirstName}
                    setLastName={setLastName}
                    setDateOfBirth={setDateOfBirth}
                    onBack={() => setStep("PROFILE")}
                    onNext={() => handleNext("EMAIL", 320)}
                  />
                )}
                {step === "EMAIL" && (
                  <EmailStep
                    key="email"
                    firstName={firstName}
                    lastName={lastName}
                    relationshipLabel={relationshipLabel}
                    email={email}
                    setEmail={setEmail}
                    onFinish={handleFinish}
                    onSkip={handleFinish}
                    isLoading={isLoading}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Step Components ---

function PhoneStep({
  phoneNumber,
  setPhoneNumber,
  onNext,
  isLoading,
}: PhoneStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-4 lg:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[15px] text-[#111214]/65 transition-colors hover:text-[#5B1112]"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft size={19} /> Retour
        </Link>
      </div>

      <span
        className="mb-5 block text-[12px] uppercase text-[#5B1112] sm:text-[13px]"
        style={{ fontWeight: 700, letterSpacing: "0.18em" }}
      >
        Espace Melanis
      </span>
      <h1
        className="text-[56px] leading-[1.05] text-[#111214] sm:text-[62px] lg:text-[64px]"
        style={{ fontWeight: 600, letterSpacing: "-0.03em" }}
      >
        Accédez à votre espace
      </h1>
      <p
        className="mb-8 mt-4 text-[20px] leading-[1.45] text-[#70737A] sm:text-[21px]"
        style={{ fontWeight: 500 }}
      >
        Sécurisez vos informations et suivez vos soins en toute confidentialité.
      </p>

      {/* Value Props */}
      <div className="mb-10 space-y-5 lg:space-y-4">
        <ValueItem icon={Calendar} text="Gérer vos rendez-vous" />
        <ValueItem icon={ImageIcon} text="Retrouver vos photos & suivi" />
        <ValueItem
          icon={FileText}
          text="Accéder à votre dossier patient (vous / enfant / proche)"
        />
      </div>

      {/* Phone Input */}
      <div className="space-y-5">
        <div className="relative flex items-center">
          <div className="absolute left-0 top-0 bottom-0 flex items-center border-r border-[#D6D9DE] pl-4 pr-3">
            <span className="flex items-center gap-2 text-[17px] text-[#22252A]">
              🇸🇳 +221 <ChevronDown size={18} className="text-[#8A8D92]" />
            </span>
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="77 000 00 00"
            className="h-[72px] w-full rounded-[18px] border border-[#D6D9DE] bg-[#EFF1F5] pl-[136px] pr-4 text-[17px] tracking-[0.01em] text-[#23262B] placeholder:text-[#BCC0C5] focus:border-[#A8ADB6] focus:bg-white focus:outline-none"
            autoFocus
          />
        </div>

        <button
          onClick={onNext}
          disabled={isLoading || phoneNumber.length < 5}
          className="flex h-[72px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#965E5E] text-[20px] text-white transition-colors enabled:hover:bg-[#825151] disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            boxShadow: "0 14px 24px rgba(88, 30, 29, 0.18)",
            fontWeight: 500,
          }}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Continuer avec mon numéro"
          )}
        </button>

        <p
          className="pt-2 text-center text-[15px] text-[#8B8E93]"
          style={{ fontWeight: 500 }}
        >
          Sans email. En ~30 secondes.
        </p>
      </div>

      {/* Footer Links */}
      <div className="mt-12 space-y-6 text-center">
        <div className="flex items-center justify-center gap-8 text-[17px] sm:text-[18px]">
          <button className="text-[#5B1112] transition-colors hover:text-[#421011]">
            J'ai déjà un compte
          </button>
          <button className="text-[#93969C] transition-colors hover:text-[#6F7278]">
            Besoin d'aide ?
          </button>
        </div>

        <div
          className="mx-auto flex max-w-[360px] items-center justify-center gap-2 text-[13px] leading-[1.4] text-[#B4B6BA]"
          style={{ fontWeight: 500 }}
        >
          <ShieldCheck size={14} />
          <span>
            Nous utilisons votre numéro uniquement pour sécuriser votre accès.
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function OtpStep({
  otp,
  setOtp,
  phoneNumber,
  onBack,
  onNext,
  isLoading,
}: OtpStepProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = otp.every((d: string) => d !== "");

  useEffect(() => {
    if (isComplete) {
      // Auto-submit could go here
    }
  }, [isComplete]);

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#111214]/40 hover:text-[#111214] mb-8 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} /> Modifier le numéro
      </button>

      <h1 className="text-3xl font-semibold text-[#111214] mb-2">
        Entrez le code
      </h1>
      <p className="text-[#111214]/60 text-lg mb-8">
        Nous avons envoyé un code au{" "}
        <span className="font-semibold text-[#111214]">
          +221 {phoneNumber || "77 XXX XX XX"}
        </span>
      </p>

      <div className="flex justify-between gap-2 mb-8">
        {otp.map((digit: string, idx: number) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold bg-[#F9FAFB] border border-[#111214]/10 rounded-xl focus:outline-none focus:border-[#5B1112] focus:bg-white transition-all caret-[#5B1112]"
          />
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!isComplete || isLoading}
        className="w-full py-4 bg-[#5B1112] text-white rounded-xl font-medium text-lg hover:bg-[#4a0e0f] transition-all shadow-lg shadow-[#5B1112]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "Vérifier"}
      </button>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#111214]/40 mb-2">
          Renvoyer le code dans{" "}
          <span className="font-mono text-[#111214]">00:45</span>
        </p>
        <button className="text-sm font-medium text-[#5B1112] opacity-50 cursor-not-allowed">
          Renvoyer le code
        </button>
      </div>
    </motion.div>
  );
}

function PinStep({ pin, setPin, onNext, onSkip, isLoading }: PinStepProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value !== "" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && pin[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = pin.every((d: string) => d !== "");

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-semibold text-[#111214] mb-2">
        Créez un code PIN
      </h1>
      <p className="text-[#111214]/60 text-lg mb-10">
        Pour vous connecter plus vite et sécuriser vos données médicales.
      </p>

      <div className="flex justify-center gap-4 mb-10">
        {pin.map((digit: string, idx: number) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-16 h-16 text-center text-3xl font-bold bg-[#F9FAFB] border border-[#111214]/10 rounded-2xl focus:outline-none focus:border-[#5B1112] focus:bg-white transition-all caret-[#5B1112]"
          />
        ))}
      </div>

      {/* Biometrics Toggle Mock */}
      <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-xl border border-[#111214]/5 mb-8">
        <span className="text-sm font-medium text-[#111214]">
          Activer Face ID / Empreinte
        </span>
        <div className="w-11 h-6 bg-[#111214]/10 rounded-full relative cursor-pointer">
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onNext}
          disabled={!isComplete || isLoading}
          className="w-full py-4 bg-[#5B1112] text-white rounded-xl font-medium text-lg hover:bg-[#4a0e0f] transition-all shadow-lg shadow-[#5B1112]/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Continuer"}
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-[#111214]/60 font-medium hover:text-[#111214] transition-colors"
        >
          Plus tard
        </button>
      </div>
    </motion.div>
  );
}

function ProfileStep({ selectedProfile, onNext }: ProfileStepProps) {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-semibold text-[#111214] mb-2">
        Vous agissez pour...
      </h1>
      <p className="text-[#111214]/60 text-lg mb-8">
        Sélectionnez le profil principal pour cette session.
      </p>

      <div className="space-y-4 mb-8">
        <ProfileCard
          icon={User}
          title="Moi-même"
          subtitle="Profil principal"
          selected={selectedProfile === "SELF"}
          onClick={() => onNext("SELF")}
        />
        <ProfileCard
          icon={Baby}
          title="Mon enfant"
          subtitle="Géré par un parent"
          selected={selectedProfile === "CHILD"}
          onClick={() => onNext("CHILD")}
        />
        <ProfileCard
          icon={Users}
          title="Un proche"
          subtitle="Accompagnant"
          selected={selectedProfile === "RELATIVE"}
          onClick={() => onNext("RELATIVE")}
        />
      </div>

      <p className="text-center text-xs text-[#111214]/40">
        Vous pourrez ajouter d'autres profils plus tard dans les réglages.
      </p>
    </motion.div>
  );
}

function IdentityStep({
  firstName,
  lastName,
  dateOfBirth,
  relationshipLabel,
  setFirstName,
  setLastName,
  setDateOfBirth,
  onBack,
  onNext,
}: IdentityStepProps) {
  const canContinue = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-[#111214]/40 transition-colors hover:text-[#111214]"
      >
        <ArrowLeft size={16} /> Choisir un autre profil
      </button>

      <h1 className="mb-2 text-3xl font-semibold text-[#111214]">
        Vos informations
      </h1>
      <p className="mb-8 text-lg text-[#111214]/60">
        Complétez les informations de base pour {relationshipLabel.toLowerCase()}.
      </p>

      <div className="mb-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111214]/60">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Ex: Awa"
              autoComplete="given-name"
              className="w-full rounded-xl border border-[#111214]/10 bg-[#F9FAFB] px-4 py-4 text-lg transition-all placeholder:text-[#111214]/20 focus:border-[#5B1112]/30 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111214]/60">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Ex: Ndiaye"
              autoComplete="family-name"
              className="w-full rounded-xl border border-[#111214]/10 bg-[#F9FAFB] px-4 py-4 text-lg transition-all placeholder:text-[#111214]/20 focus:border-[#5B1112]/30 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#111214]/60">
            Date de naissance (optionnel)
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            className="w-full rounded-xl border border-[#111214]/10 bg-[#F9FAFB] px-4 py-4 text-lg text-[#111214] transition-all focus:border-[#5B1112]/30 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B1112] py-4 text-lg font-medium text-white transition-all hover:bg-[#4a0e0f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continuer
      </button>
    </motion.div>
  );
}

function EmailStep({
  firstName,
  lastName,
  relationshipLabel,
  email,
  setEmail,
  onFinish,
  onSkip,
  isLoading,
}: EmailStepProps) {
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const hasValidEmail =
    email.trim().length === 0 ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-semibold text-[#111214] mb-2">
        Ajouter un email
      </h1>
      <p className="text-[#111214]/60 text-lg mb-10">
        (Facultatif) Pour recevoir vos confirmations, ordonnances et documents
        médicaux.
      </p>

      <div className="mb-8 rounded-xl border border-[#111214]/10 bg-[#F9FAFB] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[#111214]/45">
          Profil créé
        </p>
        <p className="mt-1 text-base font-semibold text-[#111214]">
          {displayName || "Utilisateur"} • {relationshipLabel}
        </p>
      </div>

      <div className="space-y-2 mb-8">
        <label className="text-sm font-medium text-[#111214]/60">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="exemple@email.com"
          className="w-full px-4 py-4 bg-[#F9FAFB] border border-[#111214]/10 rounded-xl focus:outline-none focus:border-[#5B1112]/30 focus:bg-white transition-all placeholder:text-[#111214]/20 text-lg"
        />
        {!hasValidEmail ? (
          <p className="text-sm text-[#A84040]">
            Entrez un email valide ou laissez ce champ vide.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <button
          onClick={onFinish}
          disabled={isLoading || !hasValidEmail}
          className="w-full py-4 bg-[#5B1112] text-white rounded-xl font-medium text-lg hover:bg-[#4a0e0f] transition-all shadow-lg shadow-[#5B1112]/20 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Enregistrer"}
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-[#111214]/60 font-medium hover:text-[#111214] transition-colors"
        >
          Ignorer
        </button>
      </div>
    </motion.div>
  );
}

// --- Helper Components ---

function ValueItem({ icon: Icon, text }: ValueItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E6D3B6] bg-[#F6EAD5] text-[#6A1D1F]">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <span
        className="pt-1 text-[18px] leading-[1.35] text-[#373A40] lg:text-[16px]"
        style={{ fontWeight: 520 }}
      >
        {text}
      </span>
    </div>
  );
}

function ProfileCard({
  icon: Icon,
  title,
  subtitle,
  selected = false,
  onClick,
}: ProfileCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-[#5B1112] bg-[#FFF9F6] shadow-md"
          : "border-[#111214]/10 bg-white hover:border-[#5B1112] hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-[#111214]/5 transition-colors ${
          selected
            ? "bg-[#FEF0D5] text-[#5B1112]"
            : "bg-[#F9FAFB] text-[#111214] group-hover:bg-[#FEF0D5] group-hover:text-[#5B1112]"
        }`}
      >
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-semibold text-[#111214] text-lg">{title}</h3>
        <p className="text-[#111214]/50 text-sm">{subtitle}</p>
      </div>
      <div
        className={`ml-auto text-[#5B1112] transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <ArrowRight size={20} />
      </div>
    </button>
  );
}
