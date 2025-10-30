import ReactMarkdown from 'react-markdown';
import { Box } from '@mui/material';

interface DocumentRendererProps {
	content: string;
}

export default function DocumentRenderer({ content }: DocumentRendererProps) {
	return <Box maxWidth="sm" margin="0 auto" overflow="scroll">
		<ReactMarkdown>
			{content}
		</ReactMarkdown>
	</Box>;
}