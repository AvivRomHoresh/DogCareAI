import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ContextSummaryCard } from './ContextSummaryCard';
import { EmergencyAlert } from './EmergencyAlert';
import { StatusBadge } from './StatusBadge';
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

type AssistantChatExperienceProps = {
  mode?: 'page' | 'widget';
  onMinimize?: () => void;
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

function buildFallbackResponse(detectedIntent: Exclude<AssistantIntent, 'emergency'>): AssistantResponse {
  return {
    message:
      'The AI assistant is temporarily unavailable. Your dog profile and reminders still work. Please try again later.',
    response_source: 'fallback',
    is_emergency: false,
    detected_intent: detectedIntent,
    disclaimer: DOGCARE_DISCLAIMER,
  };
}

function isAssistantResponse(value: unknown): value is AssistantResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Partial<AssistantResponse>;
  return (
    typeof response.message === 'string'
    && typeof response.response_source === 'string'
    && typeof response.is_emergency === 'boolean'
    && typeof response.detected_intent === 'string'
    && typeof response.disclaimer === 'string'
  );
}

export function AssistantChatExperience({
  mode = 'page',
  onMinimize,
}: AssistantChatExperienceProps) {
  const isWidget = mode === 'widget';
  const { hasSupabaseConfig } = useAuth();
  const { activeDog, activeDogId, dogs, error: dogsError, isLoading: isDogsLoading } = useDogs();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);
  const [remindersError, setRemindersError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isSending, messages]);

  const latestEmergencyMessage = useMemo(
    () => [...messages].reverse().find((message) => message.isEmergency),
    [messages],
  );
  const hasUserMessage = messages.some((message) => message.role === 'user');
  const dogBreedLabel = activeDog?.breed?.trim() || 'Breed not set';
  const dogAgeLabel = typeof activeDog?.age === 'number'
    ? `${activeDog.age} ${activeDog.age === 1 ? 'year' : 'years'} old`
    : 'Age not set';

  const canUseAssistant = Boolean(activeDog && activeDogId && hasSupabaseConfig);

  async function requestServerAssistantResponse(trimmedQuestion: string) {
    if (!supabase || !activeDogId) {
      throw new Error('missing_supabase_or_dog');
    }

    const { data, error } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (error || !accessToken) {
      throw new Error('missing_access_token');
    }

    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dog_id: activeDogId,
        question: trimmedQuestion,
      }),
    });

    if (!response.ok) {
      throw new Error('assistant_api_failed');
    }

    const payload = await response.json();

    if (!isAssistantResponse(payload)) {
      throw new Error('invalid_assistant_response');
    }

    return payload;
  }

  async function sendQuestion(nextQuestion?: string) {
    if (isSendingRef.current) {
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

    isSendingRef.current = true;
    setIsSending(true);
    setValidationMessage(null);

    try {
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

      let response: AssistantResponse;

      if (detectedIntent === 'emergency') {
        response = buildEmergencyResponse(activeDog.name);
      } else {
        try {
          response = await requestServerAssistantResponse(trimmedQuestion);
        } catch {
          const localMockResponse = buildMockAiResponse({
            question: trimmedQuestion,
            dog: activeDog,
            detectedIntent,
            reminders,
          });
          const fallbackResponse = buildFallbackResponse(detectedIntent);
          response = {
            ...fallbackResponse,
            message: `${fallbackResponse.message} ${localMockResponse.message}`,
          };
        }
      }

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
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion();
  }

  const shellClass = isWidget
    ? 'flex h-[min(78vh,42rem)] w-[calc(100vw-2rem)] max-w-[25rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-2xl shadow-teal-950/25'
    : 'mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-xl shadow-slate-900/10';
  const bodyClass = isWidget
    ? 'flex min-h-0 flex-1 flex-col bg-gradient-to-b from-stone-50 to-white'
    : 'grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]';
  const conversationClass = isWidget
    ? 'flex-1 space-y-3 overflow-y-auto p-4'
    : 'flex-1 space-y-4 overflow-y-auto p-4 sm:p-6';

  return (
    <section className={shellClass} aria-label="Doggy assistant chat">
      <div className="border-b border-teal-100 bg-gradient-to-br from-teal-950 via-teal-800 to-emerald-700 p-4 text-white sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <DoggyAssistantMark size={isWidget ? 'sm' : 'md'} />
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-teal-100">Doggy assistant</p>
              <h1 className={isWidget ? 'mt-0.5 truncate text-lg font-extrabold' : 'mt-1 text-3xl font-extrabold'}>
                Chat with Doggy
              </h1>
              {!isWidget ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-50">
                  Ask dog-care questions using the selected dog profile and reminder context.
                </p>
              ) : null}
            </div>
          </div>
          {isWidget && onMinimize ? (
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize Doggy assistant"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-bold leading-none text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              -
            </button>
          ) : null}
        </div>

        {!isWidget ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeDog ? (
              <>
                <StatusBadge>Active Dog: {activeDog.name}</StatusBadge>
                <StatusBadge>Breed: {dogBreedLabel}</StatusBadge>
                <StatusBadge>Age: {dogAgeLabel}</StatusBadge>
              </>
            ) : null}
            <StatusBadge tone="mock">Mock Mode available</StatusBadge>
            <StatusBadge>Explicit send only</StatusBadge>
          </div>
        ) : activeDog ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-teal-50">
            <span>Active Dog: {activeDog.name}</span>
            <span>Breed: {dogBreedLabel}</span>
            <span>Age: {dogAgeLabel}</span>
          </div>
        ) : null}
      </div>

      <div className={bodyClass}>
        <div className={isWidget ? 'flex min-h-0 flex-1 flex-col' : 'flex min-h-[42rem] flex-col bg-gradient-to-b from-stone-50 to-white'}>
          <div aria-label="Doggy assistant conversation" className={conversationClass} role="log">
            <WelcomeMessage activeDogName={activeDog?.name} compact={isWidget} />

            {isDogsLoading ? <AssistantNotice>Loading dog context...</AssistantNotice> : null}

            {dogsError ? (
              <AssistantNotice tone="error">Could not load dog profiles. {dogsError}</AssistantNotice>
            ) : null}

            {!isDogsLoading && !dogsError && dogs.length === 0 ? (
              <AssistantNotice tone="warning">
                <span className="block font-semibold">Create your dog profile to get started.</span>
                <span className="mt-1 block">The assistant needs a dog profile before it can show contextual beta responses.</span>
                <Link
                  className="mt-3 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                  to="/dog-profile"
                >
                  Create Dog Profile
                </Link>
              </AssistantNotice>
            ) : null}

            {!isDogsLoading && !dogsError && dogs.length > 0 && !activeDog ? (
              <AssistantNotice tone="warning">Select a dog from the active dog menu before asking Doggy.</AssistantNotice>
            ) : null}

            {latestEmergencyMessage ? <EmergencyAlert dogName={activeDog?.name} /> : null}

            {remindersError && activeDog ? (
              <AssistantNotice tone="warning">
                Reminder context could not be loaded. The mock assistant can still respond with dog profile context.
              </AssistantNotice>
            ) : null}

            {messages.length === 0 && activeDog ? (
              <EmptyChatState dogName={activeDog.name} compact={isWidget} />
            ) : null}

            {activeDog && !hasUserMessage ? (
              <StarterPromptBubbles
                canUseAssistant={canUseAssistant}
                compact={isWidget}
                isSending={isSending}
                onPickPrompt={(starterQuestion) => {
                  setQuestion(starterQuestion);
                  setValidationMessage(null);
                }}
              />
            ) : null}

            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} compact={isWidget} />
            ))}

            {isSending ? <TypingIndicator /> : null}
            <div ref={messagesEndRef} />
          </div>

          <div className={isWidget ? 'border-t border-stone-200 bg-white/95 p-3' : 'border-t border-stone-200 bg-white/95 p-4'}>
            <form className={isWidget ? 'space-y-2' : 'space-y-3'} onSubmit={handleSubmit}>
              <label className={isWidget ? 'block text-xs font-bold text-slate-600' : 'block text-sm font-semibold text-slate-700'} htmlFor={isWidget ? 'assistant-widget-question' : 'assistant-question'}>
                Message Doggy
              </label>
              <div className={isWidget
                ? 'flex items-end gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 shadow-inner focus-within:border-teal-300 focus-within:bg-white'
                : 'flex flex-col gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-3 shadow-inner focus-within:border-teal-300 focus-within:bg-white sm:flex-row sm:items-end'}
              >
                <textarea
                  id={isWidget ? 'assistant-widget-question' : 'assistant-question'}
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                    setValidationMessage(null);
                  }}
                  disabled={!canUseAssistant || isSending}
                  className={isWidget
                    ? 'max-h-24 min-h-11 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed'
                    : 'min-h-20 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed'}
                  maxLength={1000}
                  placeholder="Ask about feeding, walks, routines, or behavior."
                />
                <button
                  type="submit"
                  disabled={!canUseAssistant || isSending}
                  className={isWidget
                    ? 'inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:bg-stone-300'
                    : 'inline-flex items-center justify-center rounded-2xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto'}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>

              {validationMessage ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {validationMessage}
                </p>
              ) : null}

              <p className="text-xs leading-5 text-slate-500">
                Doggy responds only after you press Send.
              </p>
            </form>
          </div>
        </div>

        {!isWidget ? (
          <aside className="space-y-4 border-t border-stone-200 bg-white p-4 lg:border-l lg:border-t-0 sm:p-5">
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              {DOGCARE_DISCLAIMER} Emergency detection is rule-based in this beta, and urgent messages are handled
              before any mock response is generated.
            </section>

            {!hasSupabaseConfig ? (
              <AssistantNotice tone="warning">
                Add the frontend-safe Supabase URL and anon key in .env.local to use the authenticated assistant flow.
              </AssistantNotice>
            ) : null}

            {activeDog ? (
              <ContextSummaryCard
                dog={activeDog}
                reminders={reminders}
                isLoadingReminders={isRemindersLoading}
                reminderError={remindersError}
              />
            ) : null}
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function ChatBubble({ message, compact = false }: { message: ChatMessage; compact?: boolean }) {
  const isAssistant = message.role === 'assistant';

  return (
    <article
      className={[
        'flex gap-3',
        isAssistant ? 'justify-start' : 'justify-end',
      ].join(' ')}
    >
      {isAssistant ? <DoggyAssistantMark size="sm" /> : null}
      <div
        className={[
          compact ? 'max-w-[82%]' : 'max-w-[min(42rem,85%)]',
          'rounded-[1.35rem] border p-4 text-sm leading-6 shadow-sm',
          isAssistant
            ? 'rounded-tl-md border-teal-100 bg-white text-slate-700'
            : 'rounded-tr-md border-slate-800 bg-slate-950 text-white',
          message.isEmergency ? 'border-red-300 bg-red-50 text-red-950' : '',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{isAssistant ? 'Doggy' : 'You'}</span>
          {message.detectedIntent ? <MiniBadge>Intent: {message.detectedIntent}</MiniBadge> : null}
          {message.responseSource ? <MiniBadge>Source: {message.responseSource}</MiniBadge> : null}
        </div>
        <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
        {message.disclaimer ? <p className="mt-3 text-xs leading-5 opacity-80">{message.disclaimer}</p> : null}
      </div>
    </article>
  );
}

function MiniBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function StarterPromptBubbles({
  canUseAssistant,
  compact = false,
  isSending,
  onPickPrompt,
}: {
  canUseAssistant: boolean;
  compact?: boolean;
  isSending: boolean;
  onPickPrompt: (starterQuestion: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <DoggyAssistantMark size="sm" />
      <div
        className={[
          compact ? 'max-w-[82%]' : 'max-w-[min(42rem,85%)]',
          'rounded-[1.35rem] rounded-tl-md border border-teal-100 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm',
        ].join(' ')}
      >
        <p className="font-bold text-slate-950">You can start with one of these.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {starterQuestions.slice(0, compact ? 3 : starterQuestions.length).map((starterQuestion) => (
            <button
              key={starterQuestion}
              type="button"
              disabled={!canUseAssistant || isSending}
              onClick={() => onPickPrompt(starterQuestion)}
              className="rounded-full border border-teal-100 bg-teal-50 px-3 py-2 text-left text-xs font-semibold text-teal-900 transition hover:border-teal-200 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {starterQuestion}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Tap a prompt to place it in the composer. It will not send yet.</p>
      </div>
    </div>
  );
}

function DoggyAssistantMark({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const sizeClass = size === 'sm' ? 'h-9 w-9' : 'h-16 w-16';

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white/70`}
    >
      <img alt="" className="h-full w-full object-cover" src="/brand/doggy-assistant-logo.jpg" />
    </div>
  );
}

function WelcomeMessage({ activeDogName, compact = false }: { activeDogName?: string; compact?: boolean }) {
  return (
    <div className="flex gap-3">
      <DoggyAssistantMark size="sm" />
      <div className={`${compact ? 'max-w-[82%]' : 'max-w-[min(42rem,85%)]'} rounded-[1.35rem] rounded-tl-md border border-teal-100 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm`}>
        <p className="font-bold text-slate-950">Hi, I am Doggy.</p>
        <p className="mt-2">
          {activeDogName
            ? `Ask me about ${activeDogName}'s care routine, reminders, feeding, walks, or behavior notes.`
            : 'Choose an active dog, then ask me about care routines, reminders, feeding, walks, or behavior notes.'}
        </p>
      </div>
    </div>
  );
}

function EmptyChatState({ dogName, compact = false }: { dogName: string; compact?: boolean }) {
  return (
    <section className={`rounded-3xl border border-dashed border-teal-200 bg-teal-50/70 ${compact ? 'p-4' : 'p-5'} text-sm leading-6 text-teal-950`}>
      <p className="font-bold">Ready when you are.</p>
      <p className="mt-1">
        Pick a quick prompt or write your own question about {dogName}. Nothing is sent until you press Send.
      </p>
    </section>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite">
      <DoggyAssistantMark size="sm" />
      <div className="inline-flex items-center gap-2 rounded-[1.35rem] rounded-tl-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
        <span>Preparing a beta-safe response</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
      </div>
    </div>
  );
}

function AssistantNotice({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'error' | 'neutral' | 'warning';
}) {
  const toneClass =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-stone-200 bg-white text-slate-600';

  return (
    <section className={`rounded-2xl border p-4 text-sm leading-6 shadow-sm ${toneClass}`}>
      {children}
    </section>
  );
}
