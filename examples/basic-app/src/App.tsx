import {
  useFlag,
  useFlagsStatus,
  useUnleashContext,
  useVariant,
} from '@unleash/proxy-client-react';
import { type FormEvent, useState } from 'react';
import './App.css';

const TOGGLE_NAME = 'demo-app.simple-toggle';

const VariantDetails = ({ toggleName }: { toggleName: string }) => {
  const variant = useVariant(toggleName);

  if (!variant?.enabled) {
    return (
      <p>
        Variant is not enabled for <code>{toggleName}</code>.
      </p>
    );
  }

  return (
    <>
      <p>
        <strong>Variant name:</strong> {variant.name}
      </p>
      {variant.payload && (
        <p>
          <strong>Payload:</strong> {JSON.stringify(variant.payload)}
        </p>
      )}
    </>
  );
};

const ToggleStatus = ({ toggleName }: { toggleName: string }) => {
  const enabled = useFlag(toggleName);

  return (
    <p className={`toggle toggle--${enabled ? 'on' : 'off'}`}>
      Feature <code>{toggleName}</code> is{' '}
      <strong>{enabled ? 'enabled' : 'disabled'}</strong> for the current user.
    </p>
  );
};

const ContextForm = ({
  userId,
  onSubmit,
}: {
  userId: string;
  onSubmit: (nextUserId: string) => Promise<void>;
}) => {
  const [value, setValue] = useState(userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value) {
      setError('Provide a user id before updating the context.');
      return;
    }
    if (value === userId) {
      setError('The provided user id matches the current context.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update the Unleash context.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="context-form" onSubmit={handleSubmit}>
      <label htmlFor="userId">Simulate another user</label>
      <div className="context-form__row">
        <input
          id="userId"
          name="userId"
          value={value}
          onChange={(event) => {
            setError(null);
            setValue(event.target.value);
          }}
          placeholder="e.g. kate@example.com"
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update context'}
        </button>
      </div>
      {error && <p className="context-form__error">{error}</p>}
    </form>
  );
};

const App = () => {
  const { flagsReady, flagsError } = useFlagsStatus();
  const [currentUserId, setCurrentUserId] = useState<string>(
    import.meta.env.VITE_EXAMPLE_DEFAULT_USER ?? 'guest',
  );
  const updateContext = useUnleashContext();

  const handleContextUpdate = async (nextUserId: string) => {
    await updateContext({ userId: nextUserId });
    setCurrentUserId(nextUserId);
  };

  if (!flagsReady) {
    return (
      <main className="app app--loading">
        <h1>Unleash React SDK Example</h1>
        <p>Fetching feature toggles…</p>
      </main>
    );
  }

  return (
    <main className="app">
      <header>
        <h1>Unleash React SDK Example</h1>
        <p>
          Connected to the Unleash Frontend API configured in <code>.env</code>.
          The example evaluates the <code>{TOGGLE_NAME}</code> toggle.
        </p>
      </header>

      {flagsError && (
        <section className="card">
          <h2>Latest client error</h2>
          <pre>{JSON.stringify(flagsError, null, 2)}</pre>
        </section>
      )}

      <section className="card">
        <h2>Toggle status</h2>
        <ToggleStatus toggleName={TOGGLE_NAME} />
        <VariantDetails toggleName={TOGGLE_NAME} />
      </section>

      <section className="card">
        <h2>Current context</h2>
        <p>
          Evaluating toggles for <code>{currentUserId}</code>.
        </p>
        <ContextForm userId={currentUserId} onSubmit={handleContextUpdate} />
      </section>
    </main>
  );
};

export default App;
