import { useEffect } from "react";
import type { Show, ShowStatus } from "../lib/types";
import { formatYears, imdbUrl } from "../lib/types";
import StatusControl from "./StatusControl";

export default function ShowDetailModal({
  show,
  status,
  onClose,
  onStatusChange,
}: {
  show: Show;
  status: ShowStatus | null;
  onClose: () => void;
  onStatusChange: (status: ShowStatus) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const providers = show.watchProviders;
  const hasProviders =
    providers && (providers.flatrate.length || providers.rent.length || providers.buy.length);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {show.backdropUrl && (
          <div className="modal__backdrop" style={{ backgroundImage: `url(${show.backdropUrl})` }} />
        )}

        <div className="modal__content">
          <div className="modal__poster">
            {show.posterUrl ? (
              <img src={show.posterUrl} alt={show.title} />
            ) : (
              <div className="show-card__poster-fallback">
                <span>{show.title}</span>
              </div>
            )}
          </div>

          <div className="modal__details">
            <p className="modal__rank">NYT #{show.nytRank}</p>
            <h2>{show.title}</h2>
            <p className="modal__meta">
              {formatYears(show)}
              {show.network ? ` · ${show.network}` : ""}
              {show.genres.length ? ` · ${show.genres.join(", ")}` : ""}
            </p>

            {show.overview && <p className="modal__overview">{show.overview}</p>}

            <div className="modal__actions">
              <a className="btn btn--outline" href={imdbUrl(show)} target="_blank" rel="noreferrer">
                View on IMDb ↗
              </a>
            </div>

            <div className="modal__status">
              <span className="modal__label">Your status</span>
              <StatusControl value={status} onChange={onStatusChange} />
            </div>

            {hasProviders && (
              <div className="modal__providers">
                <span className="modal__label">Where to watch (US)</span>
                {providers!.flatrate.length > 0 && (
                  <ProviderRow label="Stream" items={providers!.flatrate} link={providers!.link} />
                )}
                {providers!.rent.length > 0 && (
                  <ProviderRow label="Rent" items={providers!.rent} link={providers!.link} />
                )}
                {providers!.buy.length > 0 && (
                  <ProviderRow label="Buy" items={providers!.buy} link={providers!.link} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderRow({
  label,
  items,
  link,
}: {
  label: string;
  items: { name: string; logoUrl: string | null }[];
  link: string | null;
}) {
  const body = (
    <div className="provider-row__logos">
      {items.map((p) =>
        p.logoUrl ? (
          <img key={p.name} src={p.logoUrl} alt={p.name} title={p.name} className="provider-logo" />
        ) : (
          <span key={p.name} className="provider-name">
            {p.name}
          </span>
        )
      )}
    </div>
  );

  return (
    <div className="provider-row">
      <span className="provider-row__label">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}
