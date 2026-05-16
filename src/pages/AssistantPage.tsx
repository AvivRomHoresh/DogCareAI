import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ContextSummaryCard } from '../components/ContextSummaryCard';
import { EmergencyAlert } from '../components/EmergencyAlert';
import { PageCard } from '../components/PageCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useDogs } from '../hooks/useDogs';
import { getDetectedIntent } from '../lib/getDetectedIntent';
import type { AssistantIntent } from '../lib/getDetectedIntent';
import {
  buildMockAiResponse,
  DOGCARE_DISCLAIMER,
  type AssistantResponse,
} from '../lib/mockAiResponse';
import { supabase } from '../lib/supabaseClient';
import type { Reminder } from '../types/reminder';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  detectedIntent?: AssistantIntent;
  disclaimer?: string;
  isEmergency?: boolean;
  responseSource?: AssistantResponse['response_source'];
};

const starterQuestions = [
  'What should I keep in mind for feeding today?',
  'How should I plan our walking routine this week?',
  'Which reminders should I pay attention to for care today?',
  'What behavior notes should I track before calling a trainer?',
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function delaySendingState() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 350);
  });
}

function buildEmergencyResponse(dogName: string): AssistantResponse {
  return {
    message: `This may be urgent for ${dogName}. Contact a veterinarian or emergency animal clinic immediately. This emergency rule response does not diagnose and no normal mock AI answer was generated.`,
    response_source: 'emergency_rule',
    is_emergency: true,
    detected_intent: 'emergency',
    disclaimer: DOGCARE_DISCLAIMER,
  };
}

export function AssistantPage() {
  const { hasSupabaseConfig } = useAuth();
  const { activeDog, activeDogId, dogs, error: dogsError, isLoading: isDogsLoading } = useDogs();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);
  const [remindersError, setRemindersError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !activeDogId) {
      setReminders([]);
      setRemindersError(null);
      setIsRemindersLoading(false);
      return undefined;
    }

    let isCurrent = true;
    const supabaseClient = supabase;

    async function loadAssistantReminders() {
      setIsRemindersLoading(true);
      setRemindersError(null);

      const { data, error } = await supabaseClient
        .from('reminders')
        .select('*')
        .eq('dog_id', activeDogId)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (!isCurrent) {
        return;
      }

      if (error) {
        setReminders([]);
        setRemindersError(error.message);
      } else {
        setReminders((data ?? []) as Reminder[]);
      }

      setIsRemindersLoading(false);
    }

    void loadAssistantReminders();

    return () => {
      isCurrent = false;
    };
  }, [activeDogId, hasSupabaseConfig]);

  useEffect(() => {
    setMessages([]);
    setValidationMessage(null);
    setQuestion('');
  }, [activeDogId]);

  const latestEmergencyMessage = useMemo(
    () => [...messages].reverse().find((message) => message.isEmergency),
    [messages],
  );

  const canUseAssistant = Boolean(activeDog && activeDogId && hasSupabaseConfig);

  async function sendQuestion(nextQuestion?: string) {
    if (isSending) {
      return;
    }

    if (!activeDog || !activeDogId) {
      setValidationMessage('Select a dog before asking the assistant.');
      return;
    }

    const trimmedQuestion = (nextQuestion ?? question).trim();

    if (!trimmedQuestion) {
      setValidationMessage('Enter a dog-care question first.');
      return;
    }

    setIsSending(true);
    setValidationMessage(null);

    const detectedIntent = getDetectedIntent(trimmedQuestion);
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmedQuestion,
      detectedIntent,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion('');

    await delaySendingState();

    const response =
      detectedIntent === 'emergency'
        ? buildEmergencyResponse(activeDog.name)
        : buildMockAiResponse({
            question: trimmedQuestion,
            dog: activeDog,
            detectedIntent,
            reminders,
          });

    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: 'assistant',
        content: response.message,
        detectedIntent: response.detected_intent,
        disclaimer: response.disclaimer,
        isEmergency: response.is_emergency,
        responseSource: response.response_source,
      },
    ]);
    setIsSending(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion();
  }

  return (
    <div className="space-y-4">
      <PageCard
        title="AI Assistant"
        description="Ask beta dog-care questions using the selected dog profile and reminder context. Responses are mock/demo only."
      >
        <div className="flex flex-wrap gap-2">
          {activeDog ? <StatusBadge>Active dog: {activeDog.name}</StatusBadge> : null}
          <StatusBadge tone="mock">Mock Mode</StatusBadge>
          <StatusBadge>No Gemini calls</StatusBadge>
        </div>
      </PageCard>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 shadow-sm">
        {DOGCARE_DISCLAIMER} Emergency detection is rule-based in this beta, and urgent messages are handled before
        any mock response is generated.
      </section>

      {!hasSupabaseConfig ? (
        <PageCard
          title="Supabase setup needed"
          description="Add the frontend-safe Supabase URL and anon key in .env.local to use the authenticated assistant flow."
        />
      ) : null}

      {isDogsLoading ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Loading dog context...
        </section>
      ) : null}

      {dogsError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
          Could not load dog profiles. {dogsError}
        </section>
      ) : null}

      {!isDogsLoading && !dogsError && dogs.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-950">Create your dog profile to get started.</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            The assistant needs a dog profile before it can show contextual beta responses.
          </p>
          <Link
            className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            to="/dog-profile"
          >
            Create Dog Profile
          </Link>
        </section>
      ) : null}

      {!isDogsLoading && !dogsError && dogs.length > 0 && !activeDog ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 shadow-sm">
          Select a dog from the header before asking the assistant.
        </section>
      ) : null}

      {activeDog ? (
        <>
          <ContextSummaryCard
            dog={activeDog}
            reminders={reminders}
            isLoadingReminders={isRemindersLoading}
            reminderError={remindersError}
          />

          {remindersError ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 shadow-sm">
              Reminder context could not be loaded. The mock assistant can still respond with dog profile context.
            </section>
          ) : null}

          {latestEmergencyMessage ? <EmergencyAlert dogName={activeDog.name} /> : null}

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Conversation</h2>
                    <p className="mt-1 text-sm text-slate-600">Frontend-local only. Messages are not saved.</p>
                  </div>
                  <StatusBadge tone="mock">Demo response source</StatusBadge>
                </div>

                <div className="mt-4 min-h-48 space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  {messages.length === 0 ? (
                    <p className="p-2 text-sm leading-6 text-slate-600">
                      Ask a question about {activeDog.name}, or choose a starter question.
                    </p>
                  ) : null}

                  {messages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                  ))}

                  {isSending ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      Preparing a beta-safe response...
                    </div>
                  ) : null}
                </div>

                <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                  <label className="block text-sm font-medium text-slate-700">
                    Question
                    <textarea
                      value={question}
                      onChange={(event) => {
                        setQuestion(event.target.value);
                        setValidationMessage(null);
                      }}
                      disabled={!canUseAssistant || isSending}
                      className="mt-1 min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-stone-100"
                      maxLength={1000}
                      placeholder="Ask about feeding, routines, walking, vaccination, or behavior."
                    />
                  </label>

                  {validationMessage ? (
                    <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {validationMessage}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={!canUseAssistant || isSending}
                    className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Starter questions</h2>
                <div className="mt-4 grid gap-3">
                  {starterQuestions.map((starterQuestion) => (
                    <button
                      key={starterQuestion}
                      type="button"
                      disabled={!canUseAssistant || isSending}
                      onClick={() => setQuestion(starterQuestion)}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left text-sm font-medium leading-6 text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {starterQuestion}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <article
      className={[
        'rounded-2xl border p-4 text-sm leading-6',
        isAssistant ? 'border-teal-100 bg-white text-slate-700' : 'border-stone-200 bg-slate-900 text-white',
        message.isEmergency ? 'border-red-300 bg-red-50 text-red-950' : '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{isAssistant ? 'DogCareAI' : 'You'}</span>
        {message.detectedIntent ? <MiniBadge>Intent: {message.detectedIntent}</MiniBadge> : null}
        {message.responseSource ? <MiniBadge>Source: {message.responseSource}</MiniBadge> : null}
      </div>
      <p className="mt-2">{message.content}</p>
      {message.disclaimer ? <p className="mt-3 text-xs leading-5 opacity-80">{message.disclaimer}</p> : null}
    </article>
  );
}

function MiniBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}
