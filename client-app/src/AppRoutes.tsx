import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageTitleUpdater } from "./util/PageTitleUpdater";
import ManageAuction from "./pages/auctioneer/ManageAuction";
import Account from "./pages/public/Account";
import ProductManagement from "./pages/grower/ProductManagement";
import Sales from "./pages/grower/Sales";
import ManageUsers from "./pages/admin/ManageUsers";

const PageNotFound = lazy(() => import("./pages/public/PageNotFound"));
const AuctionClock = lazy(() => import("./pages/buyer/AuctionClock"));
const Purchases = lazy(() => import("./pages/buyer/Purchases"));
const AuctioneerDashboard = lazy(() => import("./pages/auctioneer/AuctioneerDashboard"));
const HomePage = lazy(() => import("./pages/public/HomePage"));
const InfoPage = lazy(() => import("./pages/public/InfoPage"));
const LoginPage = lazy(() => import("./pages/public/LoginPage"));
const PrivacyPolicy = lazy(() => import("./pages/public/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/public/TermsOfService"));
const Contact = lazy(() => import("./pages/public/Contact"));

const titleMap: { [key: string]: string } = {
	// Public
	"/": "Home",
	"/account": "Account",
	"/login": "Inloggen",
	"/register": "Aanmelden",
	"/info": "Info",
	"/contact": "Contact",
	"/privacy": "Privacybeleid",
	"/terms": "Algemene voorwaarden",

	// Buyer
	"/buyer/auctionclock": "Veilingklok",
	"/buyer/purchases": "Mijn Aankopen",

	// Grower
	"/grower/products": "Productbeheer",
	"/grower/sales": "Verkoopgeschiedenis",

	// Auctioneer
	"/auctioneer/dashboard": "Dashboard",
	"/auctioneer/manageauction": "Veilingbeheer",

	// Admin
	"/admin/manageusers": "Gebruikerbeheer",
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
				{/* Public */}
				<Route path="/" element={<HomePage />} />
				<Route path="/account" element={<Account />} />
				<Route path="/login" element={<LoginPage isRegisterPage={false} />} />
				<Route path="/register" element={<LoginPage isRegisterPage={true} />} />
				<Route path="/info" element={<InfoPage />} />
				<Route path="/contact" element={<Contact />} />
				<Route path="/privacy" element={<PrivacyPolicy />} />
				<Route path="/terms" element={<TermsOfService />} />

				{/* Buyer */}
				<Route path="/buyer/auctionclock" element={<AuctionClock />} />
				<Route path="/buyer/purchases" element={<Purchases />} />

				{/* Grower */}
				<Route path="/grower/products" element={<ProductManagement />} />
				<Route path="/grower/sales" element={<Sales />} />

				{/* Auctioneer */}
				<Route path="/auctioneer/dashboard" element={<AuctioneerDashboard />} />
				<Route path="/auctioneer/manageauction" element={<ManageAuction />} />

				{/* Admin */}
				<Route path="/admin/manageusers" element={<ManageUsers />} />

				{/* 404 - Pagina niet gevonden */}
				<Route path="*" element={<PageNotFound />} />
			</Routes>
		</Suspense>
	</>
}

