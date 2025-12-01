import ReactMarkdown from 'react-markdown';
import Box from '@mui/material/Box';

/**
 * Props for the DocumentRenderer component.
 */
export interface DocumentRendererProps {
	/** The Markdown content to be rendered as a string. */
	content: string;
}

/**
 * A component that renders a Markdown string into styled HTML content.
 * It uses `react-markdown` for the rendering and Material-UI's `Box` for layout and styling.
 *
 * @param {DocumentRendererProps} props The props for the component.
 * @param {string} props.content The Markdown string to be rendered.
 * @returns {JSX.Element} The rendered Markdown content within a styled container.
 */
export default function DocumentRenderer({ content }: DocumentRendererProps) {
	return (
		<Box maxWidth="sm" margin="0 auto" padding="0 10px">
			<ReactMarkdown>
				{content}
			</ReactMarkdown>
		</Box>
	);
}