import React from 'react';
import './Modal.css';

const Modal = ({ show, handleClose, children, title }) => {
    const showHideClassName = show ? "modal display-block" : "modal display-none";

    return (
        <div className={showHideClassName}>
            <section className="modal-main">
                <button onClick={handleClose} className="close-button">&times;</button>
                <h2>{title}</h2>
                {children}
            </section>
        </div>
    );
};

export default Modal;
