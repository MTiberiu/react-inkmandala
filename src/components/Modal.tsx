// Modal.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => {
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
