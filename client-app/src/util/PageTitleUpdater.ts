import { useLocation } from "react-router-dom";
import { useEffect } from "react";

interface PageTitleUpdaterProps {
	titleMap: { [key: string]: string }
}

export const PageTitleUpdater = ({ titleMap }: PageTitleUpdaterProps) => {
	const location = useLocation();

	useEffect(() => {
		const currentTitle = titleMap[location.pathname];
		const siteName = "PetalBid";

		if (currentTitle) {
			document.title = `${currentTitle} | ${siteName}`;
			return;
		}
		document.title = siteName;
	}, [location.pathname, titleMap]);

	return null;
}
