import { useEffect, useRef, useState } from 'react';
import { loadFlights, removeFlight, saveFlight } from './db';
import { Flow } from './Flow';
import { Home } from './Home';
import { Summary } from './Summary';
import type { Flight } from './types';

type Ansicht = { name: 'home' } | { name: 'flow' } | { name: 'summary'; id: string };

function neueId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function App() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bereit, setBereit] = useState(false);
  const [ansicht, setAnsicht] = useState<Ansicht>({ name: 'home' });
  const ref = useRef<Flight[]>([]);

  const commit = (next: Flight[]) => {
    ref.current = next;
    setFlights(next);
  };
  const upsert = (f: Flight) => {
    commit([...ref.current.filter((x) => x.id !== f.id), f]);
    void saveFlight(f);
  };

  useEffect(() => {
    loadFlights()
      .then((alle) => {
        commit(alle);
        if (alle.some((f) => f.status === 'laufend')) setAnsicht({ name: 'flow' });
      })
      .finally(() => setBereit(true));
  }, []);

  if (!bereit) return <main className="seite" />;

  const laufend = flights.find((f) => f.status === 'laufend');

  const neu = () => {
    if (laufend) return setAnsicht({ name: 'flow' });
    const seq = Math.max(0, ...ref.current.map((f) => f.seq)) + 1;
    upsert({ id: neueId(), seq, status: 'laufend', step: 1, createdAt: new Date().toISOString(), landings: 0 });
    setAnsicht({ name: 'flow' });
  };

  if (ansicht.name === 'flow' && laufend) {
    return (
      <Flow
        flight={laufend}
        others={flights.filter((f) => f.id !== laufend.id)}
        update={(p) => upsert({ ...laufend, ...(ref.current.find((x) => x.id === laufend.id) ?? laufend), ...p })}
        onList={() => setAnsicht({ name: 'home' })}
        onFinish={() => {
          upsert({ ...(ref.current.find((x) => x.id === laufend.id) ?? laufend), status: 'abgeschlossen' });
          setAnsicht({ name: 'home' });
        }}
        onDiscard={() => {
          commit(ref.current.filter((x) => x.id !== laufend.id));
          void removeFlight(laufend.id);
          setAnsicht({ name: 'home' });
        }}
      />
    );
  }

  if (ansicht.name === 'summary') {
    const f = flights.find((x) => x.id === ansicht.id);
    if (f) {
      return (
        <Summary
          flight={f}
          onBack={() => setAnsicht({ name: 'home' })}
          onDelete={() => {
            commit(ref.current.filter((x) => x.id !== f.id));
            void removeFlight(f.id);
            setAnsicht({ name: 'home' });
          }}
        />
      );
    }
  }

  return <Home flights={flights} laufend={!!laufend} onNew={neu} onOpen={(id) => setAnsicht({ name: 'summary', id })} />;
}
