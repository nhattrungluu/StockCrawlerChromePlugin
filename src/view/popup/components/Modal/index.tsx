import * as React from 'react';
import './style.scss';

export const Modal = ({text, onClose, onConfirm}: { text: string, onClose: () => void, onConfirm: () => void }) => (
    <div className="modal">
        <div className="modalContent">
            <span className="close" onClick={onClose}>×</span>
            <p>{text}</p>
            <button className="del" onClick={onConfirm}>Ok</button>
            <button className="cancel" onClick={onClose}>Cancel</button>
        </div>
    </div>
)