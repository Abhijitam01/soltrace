'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shrink-0"
    >
      {pending ? 'Decoding…' : 'Decode'}
    </button>
  );
}

interface SignatureInputFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function SignatureInputForm({ action }: SignatureInputFormProps) {
  return (
    <form action={action} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          name="sig"
          placeholder="Paste a Solana transaction signature…"
          className="flex-1 font-mono text-sm bg-cream border border-sand rounded-lg px-4 py-3 text-warm-black placeholder-warm-gray focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          aria-label="Transaction signature"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <SubmitButton />
      </div>
    </form>
  );
}
