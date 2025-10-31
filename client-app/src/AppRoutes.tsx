import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageTitleUpdater } from "./util/PageTitleUpdater";

const PageNotFound = lazy(() => import("./pages/PageNotFound"));
const AuctionClock = lazy(() => import("./pages/AuctionClock"));
const Catalogus = lazy(() => import("./pages/Catalogus"));
const GrowerDashboard = lazy(() => import("./pages/GrowerDashboard"));
const HomePage = lazy(() => import("./pages/HomePage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const KlokVerkoop = lazy(() => import("./pages/KlokVerkoop"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OrderScherm = lazy(() => import("./pages/OrderScherm"));
const Veilbrief = lazy(() => import("./pages/Veilbrief"));
const VerkoopOrders = lazy(() => import("./pages/VerkoopOrders"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));

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

const LoadingFallback = () => (
	<div style={{
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		height: '200px'
	}}>
		<div>Laden...</div>
	</div>
);

export default function AppRoutes() {
	return <>
		<PageTitleUpdater titleMap={titleMap} />
		<Suspense fallback={<LoadingFallback />}>
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
		</Suspense>
	</>
}

