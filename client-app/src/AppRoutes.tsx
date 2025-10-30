import { Route, Routes } from "react-router-dom";
import { PageTitleUpdater } from "./util/PageTitleUpdater";

import PageNotFound from "./pages/PageNotFound";
import AuctionClock from "./pages/AuctionClock";
import Catalogus from "./pages/Catalogus";
import GrowerDashboard from "./pages/GrowerDashboard";
import HomePage from "./pages/HomePage";
import InfoPage from "./pages/InfoPage";
import KlokVerkoop from "./pages/KlokVerkoop";
import LoginPage from "./pages/LoginPage";
import OrderScherm from "./pages/OrderScherm";
import Veilbrief from "./pages/Veilbrief";
import VerkoopOrders from "./pages/VerkoopOrders";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";

const titleMap: { [key: string]: string } = {
	"/": "Home",
	"/growerdashboard": "Leverancier Dashboard",
	"/createorder": "Order Aanmaken",
	"/catalogus": "Catalogus",
	"/klokverkoop": "Klokverkoop",
	"/veilbrief": "Veilbrief",
	"/verkooporders": "Verkooporders",
	"/login": "Inloggen",
	"/register": "Aanmelden",
	"/auctionclock": "Veilingklok",
	"/info": "Info",
	"/privacy": "Privacybeleid",
	"/terms": "Algemene voorwaarden",
	"/contact": "Contact",
};

export default function AppRoutes() {
	return <>
		<PageTitleUpdater titleMap={titleMap} />
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/growerdashboard" element={<GrowerDashboard />} />
			<Route path="/createorder" element={<OrderScherm />} />
			<Route path="/catalogus" element={<Catalogus />} />
			<Route path="/klokverkoop" element={<KlokVerkoop />} />
			<Route path="/veilbrief" element={<Veilbrief />} />
			<Route path="/verkooporders" element={<VerkoopOrders />} />
			<Route path="/login" element={<LoginPage isRegisterPage={false} />} />
			<Route path="/register" element={<LoginPage isRegisterPage={true} />} />
			<Route path="/auctionclock" element={<AuctionClock />} />
			<Route path="/info" element={<InfoPage />} />
			<Route path="/privacy" element={<PrivacyPolicy />} />
			<Route path="/terms" element={<TermsOfService />} />
			<Route path="/contact" element={<Contact />} />

			{/* 404 - Pagina niet gevonden */}
			<Route path="*" element={<PageNotFound />} />
		</Routes>
	</>
}

