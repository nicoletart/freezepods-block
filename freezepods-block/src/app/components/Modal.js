import React from "react";

const Modal = ({ isOpen, onClose, children, label }) => {
  if (!isOpen) return null;

  return (
    <div
      style={backdropStyle}
      onClick={onClose}
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        style={contentStyle}
        onClick={(e) => e.stopPropagation()}
        tabIndex="-1"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title">{label ? label : "Modal"}</h2>
        <div>{children}</div>
      </div>
    </div>
  );
};

const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 999,
};

const contentStyle = {
  background: "#FDF6EC",
  padding: "40px 60px",
  textAlign: "center",
  zIndex: 1000,
  borderRadius: "8px",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
  maxWidth: "500px",
  width: "100%",
  backgroundColor: "darkblue",
};

export default Modal;
