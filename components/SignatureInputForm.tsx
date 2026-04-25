'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-[#9945FF] hover:bg-[#8035ee] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
    >
      {pending ? 'Decoding...' : 'Decode'}
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
          placeholder="Paste a Solana transaction signature..."
          className="flex-1 font-mono text-sm bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#9945FF] focus:ring-1 focus:ring-[#9945FF]"
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
