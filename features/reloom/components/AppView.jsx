import React from "react";
import NfcDesigner from "./NfcDesigner.jsx";
import Header from "./Header.jsx";
import Navigation from "./Navigation.jsx";
import Showroom from "./Showroom.jsx";
import Donation from "./Donation.jsx";
import GarmentTag from "./GarmentTag.jsx";
import MyTags from "./MyTags.jsx";
import MyItems from "./MyItems.jsx";
import Threads from "./Threads.jsx";
import MessageBoard from "./MessageBoard.jsx";
import DesignerBooth from "./DesignerBooth.jsx";
import GarmentStory from "./GarmentStory.jsx";
import MeiDialog from "./MeiDialog.jsx";
import Toast from "./Toast.jsx";
export default function AppView({ model }) {
    return <main className="reloom-page"><div className="reloom-wrap"><p className="prototype-label">ReLoom · interactive prototype</p><section className="reloom-phone" aria-label="ReLoom"><Header model={model}/>{model.dataError&&<div className="record-error" role="alert">{model.dataError}<button type="button" onClick={model.retry}>Retry</button></div>}<div className="reloom-content"><Showroom model={model}/><NfcDesigner model={model}/><Donation model={model}/><GarmentTag model={model}/><MyTags model={model}/><MyItems model={model}/><Threads model={model}/><MessageBoard model={model}/><DesignerBooth model={model}/><GarmentStory model={model}/><MeiDialog model={model}/><Toast model={model}/></div><Navigation model={model}/></section></div></main>;
}
