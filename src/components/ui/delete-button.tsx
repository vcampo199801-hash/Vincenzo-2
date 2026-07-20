"use client";

export function DeleteButton({ action, label = "Elimina" }: { action: (formData: FormData) => void; label?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Confermi l'eliminazione? L'operazione non è reversibile.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
        {label}
      </button>
    </form>
  );
}
