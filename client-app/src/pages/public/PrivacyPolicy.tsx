import DocumentRenderer from '../../components/DocumentRenderer';
import document from '../../documents/privacypolicy.md?raw';
/**
 * PrivacyPolicy component for displaying the privacy policy
 * @returns JSX.Element
 */
export default function PrivacyPolicy() {
	scrollTo(0, 0);
	return <DocumentRenderer content={document}></DocumentRenderer>;
}