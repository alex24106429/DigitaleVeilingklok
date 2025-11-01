import DocumentRenderer from '../../components/DocumentRenderer';
import document from '../../documents/privacypolicy.md?raw';

export default function PrivacyPolicy() {
	return <DocumentRenderer content={document}></DocumentRenderer>;
}