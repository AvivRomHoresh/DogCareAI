import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';

export function AssistantPage() {
  return (
    <PageCard
      title="AI Assistant route stub"
      description="The assistant UI, emergency alert, context summary card, and mock response flow are intentionally deferred."
    >
      <StatusBadge tone="mock">Mock mode remains available for the future AI boundary</StatusBadge>
    </PageCard>
  );
}
