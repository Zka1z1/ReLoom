import React from "react";
export default function Toast({ model }) {
    const { toast } = model;
    return (<> {Boolean(toast) && <> 
        <div className="toast-notification">{toast}</div>
 </>} </>);
}
