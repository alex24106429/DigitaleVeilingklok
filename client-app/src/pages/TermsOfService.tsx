import DocumentRenderer from '../components/DocumentRenderer';
import document from '../documents/termsofservice.md?raw';

export default function TermsOfService() {
    return <DocumentRenderer content={document}></DocumentRenderer>;
}