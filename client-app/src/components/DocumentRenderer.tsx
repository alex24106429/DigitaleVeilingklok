import ReactMarkdown from 'react-markdown';
import Box from '@mui/material/Box';

interface DocumentRendererProps {
	content: string;
}

export default function DocumentRenderer({ content }: DocumentRendererProps) {
	return <Box maxWidth="sm" margin="0 auto" padding="0 10px">
		<ReactMarkdown>
			{content}
		</ReactMarkdown>
	</Box>;
}