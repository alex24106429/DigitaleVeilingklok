import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * Props for the PageTitleUpdater component.
 */
interface PageTitleUpdaterProps {
	/**
	 * An object that maps URL paths to their corresponding page titles.
	 * e.g., `{ "/login": "Login", "/auctions": "Auctions" }`
	 */
	titleMap: { [key: string]: string }
}

/**
 * A headless component that dynamically updates the document's title (`document.title`)
 * based on the current route. It uses a provided map to find the title for the
 * current pathname.
 *
 * @param {PageTitleUpdaterProps} props The props for the component.
 * @returns {null} This component does not render any visible elements.
 */
export const PageTitleUpdater = ({ titleMap }: PageTitleUpdaterProps) => {
	const location = useLocation();

	useEffect(() => {
		const currentTitle = titleMap[location.pathname];
		const siteName = "PetalBid";

		if (currentTitle) {
			document.title = `${currentTitle} | ${siteName}`;
		} else {
			// Set a default title if the current path is not in the map
			document.title = siteName;
		}
	}, [location.pathname, titleMap]);

	return null;
}
