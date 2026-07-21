"use client";

export function DeleteButton({
  action,
  label = "Elimina",
  confirmMessage = "Confermi l'eliminazione? L'operazione non è reversibile.",
}: {
  action: (formData: FormData) => void;
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
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
