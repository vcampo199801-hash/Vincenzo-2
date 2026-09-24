import { trialDays } from "@/lib/trial";
import { SignupForm } from "@/components/app/signup-form";

export default function SignupPage() {
  return <SignupForm trialDays={trialDays()} />;
}
