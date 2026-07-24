interface Props {
  onDeleteOne: () => void;
  onDeleteSeries: () => void;
  onCancel: () => void;
}

export function RecurringDeleteDialog({ onDeleteOne, onDeleteSeries, onCancel }: Props) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal modal--narrow" onClick={(e) => e.stopPropagation()}>
        <h3 className="panel-title">🔁 Dépense récurrente</h3>
        <p className="modal__text">
          Cette dépense fait partie d'une série récurrente. Que souhaitez-vous supprimer ?
        </p>
        <div className="modal__actions">
          <button type="button" className="btn" onClick={onDeleteOne}>
            Uniquement cette occurrence
          </button>
          <button type="button" className="btn btn--danger" onClick={onDeleteSeries}>
            Cette occurrence et les suivantes
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
