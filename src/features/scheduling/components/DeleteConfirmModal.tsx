import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span>{title}</span>
        </div>
      }
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">{description}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
          >
            Confirmar Exclusão
          </Button>
        </div>
      </div>
    </Modal>
  );
};
