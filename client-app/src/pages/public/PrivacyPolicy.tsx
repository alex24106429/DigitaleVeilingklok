import DocumentRenderer from '../../components/DocumentRenderer';
import document from '../../documents/privacypolicy.md?raw';
/**
 * PrivacyPolicy component for displaying the privacy policy
 * @returns JSX.Element
 */
export default function PrivacyPolicy() {
	return <DocumentRenderer content={document}></DocumentRenderer>;
}