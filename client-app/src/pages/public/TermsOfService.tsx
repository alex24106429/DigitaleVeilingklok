import DocumentRenderer from '../../components/DocumentRenderer';
import document from '../../documents/termsofservice.md?raw';
/**
 * TermsOfService component for displaying the terms of service
 * @returns JSX.Element
 */
export default function TermsOfService() {
	scrollTo(0, 0);
	return <DocumentRenderer content={document}></DocumentRenderer>;
}