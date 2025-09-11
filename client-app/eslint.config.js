import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			react,
			'react-hooks': reactHooks,
			'jsx-a11y': jsxA11y,
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			...jsxA11y.configs.recommended.rules,
			'react/react-in-jsx-scope': 'off',
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
	}
);