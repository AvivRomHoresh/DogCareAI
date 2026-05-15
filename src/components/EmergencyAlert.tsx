type EmergencyAlertProps = {
  dogName?: string;
};

export function EmergencyAlert({ dogName }: EmergencyAlertProps) {
  return (
    <section className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm" role="alert">
      <p className="text-sm font-semibold uppercase tracking-normal text-red-700">Urgent care notice</p>
      <h2 className="mt-2 text-lg font-semibold text-red-950">
        This may be an emergency{dogName ? ` for ${dogName}` : ''}.
      </h2>
      <p className="mt-2 text-sm leading-6 text-red-900">
        DogCareAI is not a substitute for emergency veterinary care. Contact a veterinarian or emergency animal
        clinic immediately. This beta assistant does not diagnose and does not generate a normal mock answer for
        emergency messages.
      </p>
      <span className="mt-4 inline-flex rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800">
        Contact a veterinarian
      </span>
    </section>
  );
}
